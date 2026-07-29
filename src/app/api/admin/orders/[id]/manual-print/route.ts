import { auth } from "@/auth";
import {
  BookOrderStatus,
  BookProductionStage,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type Action =
  | "SAVE"
  | "MARK_SENT"
  | "MARK_ACCEPTED"
  | "MARK_PRINTING"
  | "MARK_COMPLETED";

class RouteError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const actor = await requireAdmin();
    const { id } = await params;
    const body = (await request.json()) as Record<
      string,
      unknown
    >;

    const action = parseAction(body.action);

    const order = await prisma.bookOrder.findUnique({
      where: {
        id,
      },
      include: {
        manualPrintJob: true,
        book: {
          select: {
            title: true,
            pageCount: true,
          },
        },
        aiProductionRuns: {
          where: {
            finalPdfUrl: {
              not: null,
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            finalPdfUrl: true,
          },
        },
      },
    });

    if (!order) {
      throw new RouteError(
        "주문을 찾을 수 없습니다.",
        404,
      );
    }

    const details = parseDetails(body, {
      defaultFinalPdfUrl:
        order.manualPrintJob?.finalPdfUrl ||
        order.aiProductionRuns[0]?.finalPdfUrl ||
        order.proofFileUrl ||
        null,
      defaultQuantity:
        order.manualPrintJob?.quantity ||
        order.quantity,
      defaultPageCount:
        order.manualPrintJob?.pageCount ||
        order.book.pageCount ||
        null,
    });

    const currentJobStatus =
      order.manualPrintJob?.status || "PREPARING";

    const now = new Date();

    const jobUpdate:
      Prisma.BookOrderManualPrintJobUncheckedUpdateInput = {
        ...details,
        updatedById: actor.id,
      };

    const jobCreate:
      Prisma.BookOrderManualPrintJobUncheckedCreateInput = {
        orderId: order.id,
        status: "PREPARING",
        ...details,
        createdById: actor.id,
        updatedById: actor.id,
      };

    let orderUpdate:
      Prisma.BookOrderUncheckedUpdateInput | null = null;

    let nextJobStatus = currentJobStatus;
    let auditAction = "MANUAL_PRINT_DETAILS_SAVED";
    let auditSummary =
      "수동 인쇄 발주 정보를 저장했습니다.";
    let customerVisible = false;
    let responseMessage =
      "인쇄 발주 정보를 저장했습니다.";

    if (action === "MARK_SENT") {
      assertCanSend(order, currentJobStatus, details);

      nextJobStatus = "SENT";
      jobUpdate.status = nextJobStatus;
      jobUpdate.orderSentAt = now;
      jobUpdate.acceptedAt = null;
      jobUpdate.printingStartedAt = null;
      jobUpdate.completedAt = null;

      jobCreate.status = nextJobStatus;
      jobCreate.orderSentAt = now;

      orderUpdate = {
        productionStage:
          BookProductionStage.PRINT_ORDERED,
        productionStageUpdatedAt: now,
        printOrderedAt:
          order.printOrderedAt || now,
      };

      auditAction = "MANUAL_PRINT_ORDER_SENT";
      auditSummary =
        "교정 승인 후 인쇄 준비가 시작되었습니다.";
      customerVisible = true;
      responseMessage =
        "인쇄소 전달을 등록했습니다.";
    }

    if (action === "MARK_ACCEPTED") {
      assertStatus(
        currentJobStatus,
        "SENT",
        "인쇄소 전달 완료",
      );

      assertStage(
        order.productionStage,
        BookProductionStage.PRINT_ORDERED,
        "인쇄 발주",
      );

      nextJobStatus = "ACCEPTED";
      jobUpdate.status = nextJobStatus;
      jobUpdate.acceptedAt = now;
      jobCreate.status = nextJobStatus;
      jobCreate.acceptedAt = now;

      orderUpdate = {
        productionStage:
          BookProductionStage.PRINTING,
        productionStageUpdatedAt: now,
      };

      auditAction = "MANUAL_PRINT_ORDER_ACCEPTED";
      auditSummary =
        "인쇄소가 파일과 제작 사양을 확인했습니다.";
      responseMessage =
        "인쇄소 접수 확인을 등록했습니다.";
    }

    if (action === "MARK_PRINTING") {
      assertStatus(
        currentJobStatus,
        "ACCEPTED",
        "인쇄소 접수 확인",
      );

      assertStage(
        order.productionStage,
        BookProductionStage.PRINTING,
        "인쇄 중",
      );

      nextJobStatus = "PRINTING";
      jobUpdate.status = nextJobStatus;
      jobUpdate.printingStartedAt = now;
      jobCreate.status = nextJobStatus;
      jobCreate.printingStartedAt = now;

      auditAction = "MANUAL_PRINTING_STARTED";
      auditSummary =
        "인쇄 작업이 진행 중입니다.";
      customerVisible = true;
      responseMessage =
        "인쇄 시작을 등록했습니다.";
    }

    if (action === "MARK_COMPLETED") {
      if (
        !["ACCEPTED", "PRINTING"].includes(
          currentJobStatus,
        )
      ) {
        throw new RouteError(
          "인쇄소 접수 확인 또는 인쇄 진행 상태에서만 인쇄 완료를 등록할 수 있습니다.",
          409,
        );
      }

      assertStage(
        order.productionStage,
        BookProductionStage.PRINTING,
        "인쇄 중",
      );

      assertShippingAddress(order);

      nextJobStatus = "COMPLETED";
      jobUpdate.status = nextJobStatus;
      jobUpdate.completedAt = now;
      jobCreate.status = nextJobStatus;
      jobCreate.completedAt = now;

      orderUpdate = {
        productionStage:
          BookProductionStage.SHIPPING_PREPARATION,
        productionStageUpdatedAt: now,
        printingCompletedAt:
          order.printingCompletedAt || now,
      };

      auditAction = "MANUAL_PRINTING_COMPLETED";
      auditSummary =
        "인쇄가 완료되어 배송 준비 중입니다.";
      customerVisible = true;
      responseMessage =
        "인쇄 완료와 배송 준비 전환을 등록했습니다.";
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const job =
          await tx.bookOrderManualPrintJob.upsert({
            where: {
              orderId: order.id,
            },
            create: jobCreate,
            update: jobUpdate,
          });

        const updatedOrder = orderUpdate
          ? await tx.bookOrder.update({
              where: {
                id: order.id,
              },
              data: orderUpdate,
              select: {
                id: true,
                productionStage: true,
                printOrderedAt: true,
                printingCompletedAt: true,
              },
            })
          : {
              id: order.id,
              productionStage:
                order.productionStage,
              printOrderedAt:
                order.printOrderedAt,
              printingCompletedAt:
                order.printingCompletedAt,
            };

        await tx.bookOrderAuditLog.create({
          data: {
            orderId: order.id,
            actorId: actor.id,
            actorName: actor.name,
            actorEmail: actor.email,
            source: "ADMIN",
            category: "PRODUCTION",
            action: auditAction,
            summary: auditSummary,
            beforeData: {
              manualPrintStatus:
                currentJobStatus,
              productionStage:
                order.productionStage,
            },
            afterData: {
              manualPrintStatus:
                nextJobStatus,
              productionStage:
                updatedOrder.productionStage,
              printerName:
                details.printerName,
              expectedCompletionAt:
                details.expectedCompletionAt
                  ? details.expectedCompletionAt.toISOString()
                  : null,
            },
            changedFields: [
              "manualPrintStatus",
              "productionStage",
              "printerName",
              "expectedCompletionAt",
            ],
            isCustomerVisible:
              customerVisible,
          },
        });

        return {
          job,
          updatedOrder,
        };
      },
    );

    return NextResponse.json({
      ok: true,
      message: responseMessage,
      jobStatus: result.job.status,
      productionStage:
        result.updatedOrder.productionStage,
    });
  } catch (error) {
    if (error instanceof RouteError) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: error.status,
        },
      );
    }

    console.error(
      "[MANUAL_PRINT_OPERATION_ERROR]",
      error,
    );

    return NextResponse.json(
      {
        error:
          "수동 인쇄 운영 정보를 처리하지 못했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}

async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new RouteError(
      "로그인이 필요합니다.",
      401,
    );
  }

  const actor = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!actor || actor.role !== "ADMIN") {
    throw new RouteError(
      "관리자 권한이 필요합니다.",
      403,
    );
  }

  return actor;
}

function parseAction(value: unknown): Action {
  const action = normalizeText(value);

  const actions: Action[] = [
    "SAVE",
    "MARK_SENT",
    "MARK_ACCEPTED",
    "MARK_PRINTING",
    "MARK_COMPLETED",
  ];

  if (!actions.includes(action as Action)) {
    throw new RouteError(
      "지원하지 않는 인쇄 운영 작업입니다.",
    );
  }

  return action as Action;
}

function parseDetails(
  body: Record<string, unknown>,
  defaults: {
    defaultFinalPdfUrl: string | null;
    defaultQuantity: number;
    defaultPageCount: number | null;
  },
) {
  const finalPdfUrl =
    normalizeNullableText(body.finalPdfUrl) ||
    defaults.defaultFinalPdfUrl;

  return {
    printerName:
      normalizeNullableText(body.printerName),
    contactName:
      normalizeNullableText(body.contactName),
    contactPhone:
      normalizeNullableText(body.contactPhone),
    contactEmail:
      normalizeNullableText(body.contactEmail),
    orderMethod:
      normalizeNullableText(body.orderMethod),
    finalPdfUrl,
    coverPdfUrl:
      normalizeNullableText(body.coverPdfUrl),
    interiorPdfUrl:
      normalizeNullableText(body.interiorPdfUrl),
    trimSize:
      normalizeNullableText(body.trimSize),
    pageCount:
      parseNullableInteger(
        body.pageCount,
        defaults.defaultPageCount,
      ),
    coverPaper:
      normalizeNullableText(body.coverPaper),
    innerPaper:
      normalizeNullableText(body.innerPaper),
    bindingType:
      normalizeNullableText(body.bindingType),
    printColor:
      normalizeNullableText(body.printColor),
    quantity:
      parsePositiveInteger(
        body.quantity,
        defaults.defaultQuantity,
        "수량",
      ),
    unitCost:
      parseNullableNonNegativeInteger(
        body.unitCost,
        "권당 인쇄비",
      ),
    totalCost:
      parseNullableNonNegativeInteger(
        body.totalCost,
        "총 인쇄비",
      ),
    expectedCompletionAt:
      parseNullableDate(
        body.expectedCompletionAt,
        "예상 완성일",
      ),
    note:
      normalizeNullableText(body.note),
  };
}

function assertCanSend(
  order: {
    status: BookOrderStatus;
    productionStage: BookProductionStage;
    proofApprovedAt: Date | null;
    recipientName: string | null;
    recipientPhone: string | null;
    postalCode: string | null;
    shippingAddress1: string | null;
  },
  currentJobStatus: string,
  details: {
    printerName: string | null;
    orderMethod: string | null;
    finalPdfUrl: string | null;
    quantity: number;
  },
) {
  if (currentJobStatus !== "PREPARING") {
    throw new RouteError(
      "발주 준비 상태에서만 인쇄소 전달을 등록할 수 있습니다.",
      409,
    );
  }

  if (order.status !== BookOrderStatus.PAID) {
    throw new RouteError(
      "결제가 완료된 주문만 인쇄소에 전달할 수 있습니다.",
      409,
    );
  }

  assertStage(
    order.productionStage,
    BookProductionStage.PROOF_APPROVED,
    "교정 승인",
  );

  if (!order.proofApprovedAt) {
    throw new RouteError(
      "고객 교정 승인일이 등록되지 않았습니다.",
      409,
    );
  }

  if (!details.printerName) {
    throw new RouteError(
      "인쇄소 이름을 입력하세요.",
    );
  }

  if (!details.orderMethod) {
    throw new RouteError(
      "발주 방식을 선택하세요.",
    );
  }

  if (!details.finalPdfUrl) {
    throw new RouteError(
      "최종 인쇄 PDF 주소를 입력하세요.",
    );
  }

  if (details.quantity < 1) {
    throw new RouteError(
      "인쇄 수량을 확인하세요.",
    );
  }

  assertShippingAddress(order);
}

function assertShippingAddress(order: {
  recipientName: string | null;
  recipientPhone: string | null;
  postalCode: string | null;
  shippingAddress1: string | null;
}) {
  if (
    !order.recipientName ||
    !order.recipientPhone ||
    !order.postalCode ||
    !order.shippingAddress1
  ) {
    throw new RouteError(
      "수령인, 연락처, 우편번호와 기본 주소를 먼저 등록하세요.",
      409,
    );
  }
}

function assertStatus(
  current: string,
  expected: string,
  expectedLabel: string,
) {
  if (current !== expected) {
    throw new RouteError(
      `현재 인쇄소 처리 상태가 '${expectedLabel}' 상태가 아닙니다.`,
      409,
    );
  }
}

function assertStage(
  current: BookProductionStage,
  expected: BookProductionStage,
  expectedLabel: string,
) {
  if (current !== expected) {
    throw new RouteError(
      `현재 주문 제작 단계가 '${expectedLabel}' 단계가 아닙니다.`,
      409,
    );
  }
}

function normalizeText(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizeNullableText(value: unknown) {
  const normalized = normalizeText(value);
  return normalized || null;
}

function parsePositiveInteger(
  value: unknown,
  fallback: number,
  label: string,
) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return fallback;
  }

  const parsed = Number(normalized);

  if (
    !Number.isInteger(parsed) ||
    parsed < 1
  ) {
    throw new RouteError(
      `${label}은 1 이상의 정수여야 합니다.`,
    );
  }

  return parsed;
}

function parseNullableInteger(
  value: unknown,
  fallback: number | null,
) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return fallback;
  }

  const parsed = Number(normalized);

  if (
    !Number.isInteger(parsed) ||
    parsed < 1
  ) {
    throw new RouteError(
      "페이지 수는 1 이상의 정수여야 합니다.",
    );
  }

  return parsed;
}

function parseNullableNonNegativeInteger(
  value: unknown,
  label: string,
) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  if (
    !Number.isInteger(parsed) ||
    parsed < 0
  ) {
    throw new RouteError(
      `${label}는 0 이상의 정수여야 합니다.`,
    );
  }

  return parsed;
}

function parseNullableDate(
  value: unknown,
  label: string,
) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return null;
  }

  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    throw new RouteError(
      `${label} 형식이 올바르지 않습니다.`,
    );
  }

  return parsed;
}
