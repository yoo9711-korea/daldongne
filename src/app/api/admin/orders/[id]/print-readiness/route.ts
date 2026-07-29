import { auth } from "@/auth";
import {
  evaluateReadiness,
  snapshot,
  specHash,
  type ReadinessSpec,
} from "@/lib/print-readiness";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Context = {
  params: Promise<{ id: string }>;
};

type Action = "SAVE" | "FREEZE" | "UNFREEZE";

class RouteError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function POST(
  request: NextRequest,
  { params }: Context,
) {
  try {
    const actor = await requireAdmin();
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const action = parseAction(body.action);

    const order = await prisma.bookOrder.findUnique({
      where: { id },
      include: {
        book: {
          select: { pageCount: true },
        },
        manualPrintJob: true,
        printReadiness: true,
        printQuotes: {
          where: { status: "SELECTED" },
          take: 1,
        },
        aiProductionRuns: {
          where: { finalPdfUrl: { not: null } },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { finalPdfUrl: true },
        },
      },
    });

    if (!order) {
      throw new RouteError("주문을 찾을 수 없습니다.", 404);
    }

    if (order.manualPrintJob && order.manualPrintJob.status !== "PREPARING") {
      throw new RouteError("인쇄소 전달 이후에는 준비 사양을 변경할 수 없습니다.", 409);
    }

    if (action === "UNFREEZE") {
      const currentReadiness =
        order.printReadiness;
      if (!currentReadiness || currentReadiness.status !== "FROZEN") {
        throw new RouteError("현재 인쇄 사양은 동결 상태가 아닙니다.", 409);
      }

      const updated = await prisma.$transaction(async (tx) => {
        const readiness = await tx.bookOrderPrintReadiness.update({
          where: { orderId: order.id },
          data: {
            status: "DRAFT",
            version: { increment: 1 },
            specHash: null,
            frozenAt: null,
            frozenById: null,
            updatedById: actor.id,
          },
        });

        await tx.bookOrderAuditLog.create({
          data: {
            orderId: order.id,
            actorId: actor.id,
            actorName: actor.name,
            actorEmail: actor.email,
            source: "ADMIN",
            category: "PRODUCTION",
            action: "PRINT_SPEC_UNFROZEN",
            summary: "인쇄 사양 동결을 해제했습니다.",
            beforeData: {
              status: "FROZEN",
              version: currentReadiness.version,
              specHash: currentReadiness.specHash,
            },
            afterData: {
              status: "DRAFT",
              version: readiness.version,
              specHash: null,
            },
            changedFields: ["status", "version", "specHash", "frozenAt"],
            isCustomerVisible: false,
          },
        });

        return readiness;
      });

      return NextResponse.json({
        ok: true,
        message: "동결을 해제했습니다. 수정 후 다시 점검하고 동결하세요.",
        status: updated.status,
      });
    }

    if (order.printReadiness?.status === "FROZEN") {
      throw new RouteError("동결된 사양은 수정할 수 없습니다. 먼저 동결을 해제하세요.", 409);
    }

    const spec = parseSpec(body, order);
    const evaluation = evaluateReadiness(
      {
        status: String(order.status),
        proofApprovedAt: order.proofApprovedAt,
        recipientName: order.recipientName,
        recipientPhone: order.recipientPhone,
        postalCode: order.postalCode,
        shippingAddress1: order.shippingAddress1,
      },
      spec,
      order.printQuotes.length > 0,
    );

    if (action === "FREEZE" && !evaluation.ready) {
      throw new RouteError(`차단 항목 ${evaluation.blockerCount}건을 먼저 해결하세요.`, 409);
    }

    const nextStatus =
      action === "FREEZE"
        ? "FROZEN"
        : evaluation.ready
          ? "READY"
          : "DRAFT";

    const now = new Date();
    const hash = action === "FREEZE" ? specHash(spec) : null;
    const report = evaluation.issues.map((issue) => ({
      code: issue.code,
      severity: issue.severity,
      message: issue.message,
    }));

    const result = await prisma.$transaction(async (tx) => {
      const readiness = await tx.bookOrderPrintReadiness.upsert({
        where: { orderId: order.id },
        create: {
          orderId: order.id,
          status: nextStatus,
          ...toData(spec),
          blockerCount: evaluation.blockerCount,
          warningCount: evaluation.warningCount,
          report,
          specHash: hash,
          frozenAt: action === "FREEZE" ? now : null,
          frozenById: action === "FREEZE" ? actor.id : null,
          createdById: actor.id,
          updatedById: actor.id,
        },
        update: {
          status: nextStatus,
          ...toData(spec),
          blockerCount: evaluation.blockerCount,
          warningCount: evaluation.warningCount,
          report,
          specHash: hash,
          frozenAt: action === "FREEZE" ? now : null,
          frozenById: action === "FREEZE" ? actor.id : null,
          updatedById: actor.id,
        },
      });

      await tx.bookOrderManualPrintJob.upsert({
        where: { orderId: order.id },
        create: {
          orderId: order.id,
          status: "PREPARING",
          orderMethod: spec.orderMethod,
          finalPdfUrl: spec.finalPdfUrl,
          coverPdfUrl: spec.coverPdfUrl,
          interiorPdfUrl: spec.interiorPdfUrl,
          trimSize: spec.trimSize,
          pageCount: spec.pageCount,
          coverPaper: spec.coverPaper,
          innerPaper: spec.innerPaper,
          bindingType: spec.bindingType,
          printColor: spec.printColor,
          quantity: spec.quantity,
          note: spec.note,
          createdById: actor.id,
          updatedById: actor.id,
        },
        update: {
          orderMethod: spec.orderMethod,
          finalPdfUrl: spec.finalPdfUrl,
          coverPdfUrl: spec.coverPdfUrl,
          interiorPdfUrl: spec.interiorPdfUrl,
          trimSize: spec.trimSize,
          pageCount: spec.pageCount,
          coverPaper: spec.coverPaper,
          innerPaper: spec.innerPaper,
          bindingType: spec.bindingType,
          printColor: spec.printColor,
          quantity: spec.quantity,
          note: spec.note,
          updatedById: actor.id,
        },
      });

      await tx.bookOrderAuditLog.create({
        data: {
          orderId: order.id,
          actorId: actor.id,
          actorName: actor.name,
          actorEmail: actor.email,
          source: "ADMIN",
          category: "PRODUCTION",
          action: action === "FREEZE" ? "PRINT_SPEC_FROZEN" : "PRINT_READINESS_SAVED",
          summary:
            action === "FREEZE"
              ? "인쇄 준비 점검을 완료하고 사양을 동결했습니다."
              : `인쇄 준비 정보를 저장했습니다. 차단 ${evaluation.blockerCount}건, 주의 ${evaluation.warningCount}건.`,
          beforeData: {
            status: order.printReadiness?.status || null,
            blockerCount: order.printReadiness?.blockerCount || 0,
            warningCount: order.printReadiness?.warningCount || 0,
          },
          afterData: {
            status: readiness.status,
            blockerCount: readiness.blockerCount,
            warningCount: readiness.warningCount,
            specHash: readiness.specHash,
            snapshot: snapshot(spec),
          },
          changedFields: ["status", "blockerCount", "warningCount", "specHash", "printSpecification"],
          isCustomerVisible: false,
        },
      });

      return readiness;
    });

    return NextResponse.json({
      ok: true,
      message:
        action === "FREEZE"
          ? "인쇄 준비 점검을 완료하고 사양을 동결했습니다."
          : `저장했습니다. 차단 ${result.blockerCount}건, 주의 ${result.warningCount}건입니다.`,
      status: result.status,
    });
  } catch (error) {
    if (error instanceof RouteError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("[PRINT_READINESS_ERROR]", error);
    return NextResponse.json(
      { error: "인쇄 준비 정보를 처리하지 못했습니다." },
      { status: 500 },
    );
  }
}

function toData(spec: ReadinessSpec) {
  return {
    finalPdfUrl: spec.finalPdfUrl,
    coverPdfUrl: spec.coverPdfUrl,
    interiorPdfUrl: spec.interiorPdfUrl,
    trimSize: spec.trimSize,
    trimWidthMm: spec.trimWidthMm,
    trimHeightMm: spec.trimHeightMm,
    bleedMm: spec.bleedMm,
    pageCount: spec.pageCount,
    coverPaper: spec.coverPaper,
    innerPaper: spec.innerPaper,
    coverFinish: spec.coverFinish,
    bindingType: spec.bindingType,
    printColor: spec.printColor,
    quantity: spec.quantity,
    orderMethod: spec.orderMethod,
    samplePrintRequired: spec.samplePrintRequired,
    samplePrintStatus: spec.samplePrintStatus,
    sampleNote: spec.sampleNote,
    pdfOpenedConfirmed: spec.pdfOpenedConfirmed,
    fontsEmbeddedConfirmed: spec.fontsEmbeddedConfirmed,
    imageQualityConfirmed: spec.imageQualityConfirmed,
    bleedConfirmed: spec.bleedConfirmed,
    safeAreaConfirmed: spec.safeAreaConfirmed,
    pageOrderConfirmed: spec.pageOrderConfirmed,
    colorConfirmed: spec.colorConfirmed,
    coverSpineConfirmed: spec.coverSpineConfirmed,
    note: spec.note,
  };
}

async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new RouteError("로그인이 필요합니다.", 401);
  }

  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!actor || actor.role !== "ADMIN") {
    throw new RouteError("관리자 권한이 필요합니다.", 403);
  }

  return actor;
}

function parseAction(value: unknown): Action {
  const action = text(value);

  if (!["SAVE", "FREEZE", "UNFREEZE"].includes(action)) {
    throw new RouteError("지원하지 않는 인쇄 준비 작업입니다.");
  }

  return action as Action;
}

function parseSpec(
  body: Record<string, unknown>,
  order: any,
): ReadinessSpec {
  const r = order.printReadiness;
  const j = order.manualPrintJob;

  return {
    finalPdfUrl: nullable(body.finalPdfUrl) || r?.finalPdfUrl || j?.finalPdfUrl || order.aiProductionRuns[0]?.finalPdfUrl || order.proofFileUrl || null,
    coverPdfUrl: nullable(body.coverPdfUrl) || r?.coverPdfUrl || j?.coverPdfUrl || null,
    interiorPdfUrl: nullable(body.interiorPdfUrl) || r?.interiorPdfUrl || j?.interiorPdfUrl || null,
    trimSize: nullable(body.trimSize) || r?.trimSize || j?.trimSize || order.specification || null,
    trimWidthMm: nullableInt(body.trimWidthMm, r?.trimWidthMm || null, "책 가로 크기"),
    trimHeightMm: nullableInt(body.trimHeightMm, r?.trimHeightMm || null, "책 세로 크기"),
    bleedMm: nullableNonNegativeInt(body.bleedMm, r?.bleedMm ?? 3, "재단 여백"),
    pageCount: nullableInt(body.pageCount, r?.pageCount || j?.pageCount || order.book.pageCount || null, "페이지 수"),
    coverPaper: nullable(body.coverPaper) || r?.coverPaper || j?.coverPaper || null,
    innerPaper: nullable(body.innerPaper) || r?.innerPaper || j?.innerPaper || null,
    coverFinish: nullable(body.coverFinish) || r?.coverFinish || null,
    bindingType: nullable(body.bindingType) || r?.bindingType || j?.bindingType || null,
    printColor: nullable(body.printColor) || r?.printColor || j?.printColor || null,
    quantity: positiveInt(body.quantity, r?.quantity || j?.quantity || order.quantity, "인쇄 수량"),
    orderMethod: nullable(body.orderMethod) || r?.orderMethod || j?.orderMethod || null,
    samplePrintRequired: bool(body.samplePrintRequired),
    samplePrintStatus: nullable(body.samplePrintStatus) || (bool(body.samplePrintRequired) ? r?.samplePrintStatus || "PLANNED" : "NOT_REQUIRED"),
    sampleNote: nullable(body.sampleNote) || r?.sampleNote || null,
    pdfOpenedConfirmed: bool(body.pdfOpenedConfirmed),
    fontsEmbeddedConfirmed: bool(body.fontsEmbeddedConfirmed),
    imageQualityConfirmed: bool(body.imageQualityConfirmed),
    bleedConfirmed: bool(body.bleedConfirmed),
    safeAreaConfirmed: bool(body.safeAreaConfirmed),
    pageOrderConfirmed: bool(body.pageOrderConfirmed),
    colorConfirmed: bool(body.colorConfirmed),
    coverSpineConfirmed: bool(body.coverSpineConfirmed),
    note: nullable(body.note) || r?.note || j?.note || null,
  };
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function nullable(value: unknown) {
  return text(value) || null;
}

function bool(value: unknown) {
  if (typeof value === "boolean") return value;
  return ["true", "1", "yes", "on"].includes(text(value).toLowerCase());
}

function positiveInt(value: unknown, fallback: number, label: string) {
  const raw = text(value);
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new RouteError(`${label}은 1 이상의 정수여야 합니다.`);
  }
  return parsed;
}

function nullableInt(value: unknown, fallback: number | null, label: string) {
  const raw = text(value);
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new RouteError(`${label}은 1 이상의 정수여야 합니다.`);
  }
  return parsed;
}

function nullableNonNegativeInt(value: unknown, fallback: number | null, label: string) {
  const raw = text(value);
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new RouteError(`${label}은 0 이상의 정수여야 합니다.`);
  }
  return parsed;
}
