import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Context = {
  params: Promise<{ id: string }>;
};

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
    const action = text(body.action);

    if (!["ADD", "SELECT"].includes(action)) {
      throw new RouteError("지원하지 않는 견적 작업입니다.");
    }

    const order = await prisma.bookOrder.findUnique({
      where: { id },
      include: { manualPrintJob: true },
    });

    if (!order) {
      throw new RouteError("주문을 찾을 수 없습니다.", 404);
    }

    if (order.manualPrintJob && order.manualPrintJob.status !== "PREPARING") {
      throw new RouteError("인쇄소 전달 이후에는 견적 선택을 변경할 수 없습니다.", 409);
    }

    if (action === "ADD") {
      const printerName = required(body.printerName, "인쇄소 이름");
      const quantity = positive(body.quantity, order.quantity, "견적 수량");
      const unitCost = optionalMoney(body.unitCost, "권당 인쇄비");
      const setupCost = money(body.setupCost, 0, "초기·후가공 비용");
      const shippingCost = money(body.shippingCost, 0, "배송비");
      const suppliedTotal = optionalMoney(body.totalCost, "총 견적 금액");
      const totalCost = suppliedTotal ?? ((unitCost || 0) * quantity + setupCost + shippingCost);

      if (totalCost < 1) {
        throw new RouteError("총 견적 금액을 입력하세요.");
      }

      const created = await prisma.$transaction(async (tx) => {
        const quote = await tx.bookOrderPrintQuote.create({
          data: {
            orderId: order.id,
            printerName,
            contactName: nullable(body.contactName),
            contactPhone: nullable(body.contactPhone),
            contactEmail: nullable(body.contactEmail),
            quoteNumber: nullable(body.quoteNumber),
            status: "RECEIVED",
            quantity,
            minimumQuantity: optionalPositive(body.minimumQuantity, "최소 수량"),
            unitCost,
            setupCost,
            shippingCost,
            totalCost,
            vatIncluded: bool(body.vatIncluded),
            leadTimeBusinessDays: optionalPositive(body.leadTimeBusinessDays, "제작 영업일"),
            validUntil: optionalDate(body.validUntil, "견적 유효일"),
            note: nullable(body.note),
            createdById: actor.id,
          },
        });

        await tx.bookOrderAuditLog.create({
          data: {
            orderId: order.id,
            actorId: actor.id,
            actorName: actor.name,
            actorEmail: actor.email,
            source: "ADMIN",
            category: "QUOTE",
            action: "PRINT_QUOTE_ADDED",
            summary: `${printerName} 인쇄 견적을 등록했습니다. 총 ${totalCost.toLocaleString()}원.`,
            beforeData: {},
            afterData: {
              quoteId: quote.id,
              printerName,
              quantity,
              totalCost,
            },
            changedFields: ["printQuote"],
            isCustomerVisible: false,
          },
        });

        return quote;
      });

      return NextResponse.json({
        ok: true,
        message: "인쇄 견적을 등록했습니다.",
        quoteId: created.id,
      });
    }

    const quoteId = required(body.quoteId, "선택할 견적");

    const quote = await prisma.bookOrderPrintQuote.findFirst({
      where: {
        id: quoteId,
        orderId: order.id,
      },
    });

    if (!quote) {
      throw new RouteError("선택할 견적을 찾을 수 없습니다.", 404);
    }

    const selected = await prisma.$transaction(async (tx) => {
      await tx.bookOrderPrintQuote.updateMany({
        where: {
          orderId: order.id,
          status: "SELECTED",
          id: { not: quote.id },
        },
        data: {
          status: "RECEIVED",
          selectedAt: null,
        },
      });

      const result = await tx.bookOrderPrintQuote.update({
        where: { id: quote.id },
        data: {
          status: "SELECTED",
          selectedAt: new Date(),
        },
      });

      await tx.bookOrderManualPrintJob.upsert({
        where: { orderId: order.id },
        create: {
          orderId: order.id,
          status: "PREPARING",
          printerName: result.printerName,
          contactName: result.contactName,
          contactPhone: result.contactPhone,
          contactEmail: result.contactEmail,
          quantity: result.quantity,
          unitCost: result.unitCost,
          totalCost: result.totalCost,
          createdById: actor.id,
          updatedById: actor.id,
        },
        update: {
          printerName: result.printerName,
          contactName: result.contactName,
          contactPhone: result.contactPhone,
          contactEmail: result.contactEmail,
          quantity: result.quantity,
          unitCost: result.unitCost,
          totalCost: result.totalCost,
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
          category: "QUOTE",
          action: "PRINT_QUOTE_SELECTED",
          summary: `${result.printerName} 견적을 선택했습니다. 총 ${result.totalCost.toLocaleString()}원.`,
          beforeData: {},
          afterData: {
            quoteId: result.id,
            printerName: result.printerName,
            totalCost: result.totalCost,
          },
          changedFields: ["selectedPrintQuote", "printerName", "totalCost"],
          isCustomerVisible: false,
        },
      });

      return result;
    });

    return NextResponse.json({
      ok: true,
      message: `${selected.printerName} 견적을 선택했습니다.`,
    });
  } catch (error) {
    if (error instanceof RouteError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("[PRINT_QUOTE_ERROR]", error);
    return NextResponse.json(
      { error: "인쇄 견적을 처리하지 못했습니다." },
      { status: 500 },
    );
  }
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

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function nullable(value: unknown) {
  return text(value) || null;
}

function required(value: unknown, label: string) {
  const result = text(value);
  if (!result) throw new RouteError(`${label}을 입력하세요.`);
  return result;
}

function bool(value: unknown) {
  if (typeof value === "boolean") return value;
  return ["true", "1", "yes", "on"].includes(text(value).toLowerCase());
}

function positive(value: unknown, fallback: number, label: string) {
  const raw = text(value);
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new RouteError(`${label}은 1 이상의 정수여야 합니다.`);
  }
  return parsed;
}

function optionalPositive(value: unknown, label: string) {
  const raw = text(value);
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new RouteError(`${label}은 1 이상의 정수여야 합니다.`);
  }
  return parsed;
}

function money(value: unknown, fallback: number, label: string) {
  const raw = text(value);
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new RouteError(`${label}은 0 이상의 정수여야 합니다.`);
  }
  return parsed;
}

function optionalMoney(value: unknown, label: string) {
  const raw = text(value);
  if (!raw) return null;
  return money(value, 0, label);
}

function optionalDate(value: unknown, label: string) {
  const raw = text(value);
  if (!raw) return null;
  const date = new Date(`${raw}T23:59:59`);
  if (Number.isNaN(date.getTime())) {
    throw new RouteError(`${label} 형식이 올바르지 않습니다.`);
  }
  return date;
}
