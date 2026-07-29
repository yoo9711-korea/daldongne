import { auth } from "@/auth";
import { recordBookOrderAudit } from "@/lib/order-audit";
import { sendOrderProductionStageEmail } from "@/lib/order-email";
import { prisma } from "@/lib/prisma";
import {
  AIBookProductionStatus,
  BookOrderStatus,
  BookProductionStage,
  Prisma,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type PrintShippingAction =
  | "SAVE_SHIPPING"
  | "ORDER_PRINT"
  | "START_PRINTING"
  | "COMPLETE_PRINTING"
  | "SHIP"
  | "COMPLETE";

type AdminIdentity = {
  id: string;
  name: string | null;
  email: string | null;
};

type ExistingOrder = {
  id: string;
  orderId: string;
  productionRequestId: string;
  bookId: string;
  status: BookOrderStatus;
  productionStage: BookProductionStage;
  productionStageUpdatedAt: Date;
  specification: string | null;
  quantity: number;
  proofFileUrl: string | null;
  proofApprovedAt: Date | null;
  printOrderedAt: Date | null;
  printingCompletedAt: Date | null;
  recipientName: string | null;
  recipientPhone: string | null;
  postalCode: string | null;
  shippingAddress1: string | null;
  shippingAddress2: string | null;
  shippingMemo: string | null;
  shippingCarrier: string | null;
  trackingNumber: string | null;
  shippedAt: Date | null;
  completedAt: Date | null;
  productionNote: string | null;
  updatedAt: Date;
};

class RouteError extends Error {
  status: number;

  constructor(
    message: string,
    status: number,
  ) {
    super(message);
    this.name = "RouteError";
    this.status = status;
  }
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const admin =
      await requireAdmin();

    const { id } =
      await context.params;

    const orderRecordId =
      cleanText(id);

    if (!orderRecordId) {
      throw new RouteError(
        "주문 정보를 찾을 수 없습니다.",
        400,
      );
    }

    const body =
      await request
        .json()
        .catch(() => null);

    if (!isRecord(body)) {
      throw new RouteError(
        "요청 내용을 확인할 수 없습니다.",
        400,
      );
    }

    const action =
      parseAction(
        body.action,
      );

    const order =
      await prisma.bookOrder.findUnique({
        where: {
          id: orderRecordId,
        },
        select: {
          id: true,
          orderId: true,
          productionRequestId: true,
          bookId: true,
          status: true,
          productionStage: true,
          productionStageUpdatedAt:
            true,
          specification: true,
          quantity: true,
          proofFileUrl: true,
          proofApprovedAt: true,
          printOrderedAt: true,
          printingCompletedAt:
            true,
          recipientName: true,
          recipientPhone: true,
          postalCode: true,
          shippingAddress1: true,
          shippingAddress2: true,
          shippingMemo: true,
          shippingCarrier: true,
          trackingNumber: true,
          shippedAt: true,
          completedAt: true,
          productionNote: true,
          updatedAt: true,
        },
      });

    if (!order) {
      throw new RouteError(
        "주문을 찾을 수 없습니다.",
        404,
      );
    }

    if (
      order.status !==
      BookOrderStatus.PAID
    ) {
      throw new RouteError(
        "결제가 완료된 주문만 인쇄·배송 작업을 진행할 수 있습니다.",
        409,
      );
    }

    const now =
      new Date();

    let updateData:
      Prisma.BookOrderUpdateManyMutationInput =
      {};

    let auditAction =
      "";

    let auditSummary =
      "";

    let responseMessage =
      "";

    if (
      action ===
      "SAVE_SHIPPING"
    ) {
      assertShippingEditable(
        order,
      );

      updateData =
        parseShippingUpdate(
          body,
        );

      if (
        Object.keys(
          updateData,
        ).length === 0
      ) {
        throw new RouteError(
          "저장할 배송 정보가 없습니다.",
          400,
        );
      }

      auditAction =
        "PRINT_SHIPPING_INFORMATION_SAVED";

      auditSummary =
        `주문 ${order.orderId}의 수령인과 배송 정보를 저장했습니다.`;

      responseMessage =
        "수령인과 배송 정보를 저장했습니다.";
    }

    if (
      action ===
      "ORDER_PRINT"
    ) {
      assertCurrentStage(
        order,
        BookProductionStage.PROOF_APPROVED,
        "고객 인쇄용 최종 승인",
      );

      if (
        !order.proofApprovedAt
      ) {
        throw new RouteError(
          "고객의 인쇄용 최종 승인일이 등록되지 않아 인쇄를 발주할 수 없습니다.",
          409,
        );
      }

      if (
        !hasText(
          order.proofFileUrl,
        )
      ) {
        throw new RouteError(
          "최종 교정 PDF가 없어 인쇄를 발주할 수 없습니다.",
          409,
        );
      }

      const latestAIRun =
        await prisma.aIBookProductionRun.findFirst({
          where: {
            orderId:
              order.id,
            bookId:
              order.bookId,
          },
          orderBy: {
            attempt:
              "desc",
          },
          select: {
            status: true,
            finalPdfUrl:
              true,
            approvedAt:
              true,
          },
        });

      if (
        latestAIRun &&
        (
          latestAIRun.status !==
            AIBookProductionStatus.APPROVED ||
          !hasText(
            latestAIRun.finalPdfUrl,
          ) ||
          !latestAIRun.approvedAt
        )
      ) {
        throw new RouteError(
          "최근 AI 제작 회차가 관리자 최종 승인 상태가 아닙니다.",
          409,
        );
      }

      updateData = {
        productionStage:
          BookProductionStage.PRINT_ORDERED,

        productionStageUpdatedAt:
          now,

        printOrderedAt:
          order.printOrderedAt ||
          now,

        completedAt:
          null,
      };

      auditAction =
        "BOOK_PRINT_ORDER_REGISTERED";

      auditSummary =
        `주문 ${order.orderId}의 인쇄 발주를 등록했습니다. 수량 ${order.quantity}권.`;

      responseMessage =
        "인쇄 발주를 등록했습니다. 실제 인쇄소 접수 여부를 확인한 뒤 인쇄 진행 단계로 이동해 주세요.";
    }

    if (
      action ===
      "START_PRINTING"
    ) {
      assertCurrentStage(
        order,
        BookProductionStage.PRINT_ORDERED,
        "인쇄 발주",
      );

      if (
        !order.printOrderedAt
      ) {
        throw new RouteError(
          "인쇄 발주일이 등록되지 않았습니다.",
          409,
        );
      }

      updateData = {
        productionStage:
          BookProductionStage.PRINTING,

        productionStageUpdatedAt:
          now,
      };

      auditAction =
        "BOOK_PRINTING_STARTED";

      auditSummary =
        `주문 ${order.orderId}의 인쇄 진행을 등록했습니다.`;

      responseMessage =
        "인쇄 진행 상태로 변경했습니다.";
    }

    if (
      action ===
      "COMPLETE_PRINTING"
    ) {
      assertCurrentStage(
        order,
        BookProductionStage.PRINTING,
        "인쇄 진행",
      );

      assertShippingAddress(
        order,
      );

      updateData = {
        productionStage:
          BookProductionStage.SHIPPING_PREPARATION,

        productionStageUpdatedAt:
          now,

        printingCompletedAt:
          order.printingCompletedAt ||
          now,
      };

      auditAction =
        "BOOK_PRINTING_COMPLETED";

      auditSummary =
        `주문 ${order.orderId}의 인쇄 완료와 배송 준비 전환을 등록했습니다.`;

      responseMessage =
        "인쇄 완료를 등록하고 배송 준비 단계로 이동했습니다.";
    }

    if (
      action === "SHIP"
    ) {
      const supportedShippingCarriers = [
        "CJ대한통운",
        "한진택배",
        "롯데택배",
        "우체국택배",
        "로젠택배",
      ];

      const shippingCarrier =
        order.shippingCarrier?.trim() ?? "";

      const normalizedTrackingNumber =
        order.trackingNumber?.replace(/\D/g, "") ?? "";

      if (
        shippingCarrier &&
        !supportedShippingCarriers.includes(
          shippingCarrier,
        )
      ) {
        return NextResponse.json(
          {
            error:
              "지원하지 않는 택배사입니다. 택배사를 목록에서 다시 선택해 주세요.",
          },
          {
            status: 400,
          },
        );
      }

      if (
        normalizedTrackingNumber &&
        !/^\d{8,20}$/.test(
          normalizedTrackingNumber,
        )
      ) {
        return NextResponse.json(
          {
            error:
              "송장번호는 숫자 8~20자리로 입력해 주세요.",
          },
          {
            status: 400,
          },
        );
      }
      assertCurrentStage(
        order,
        BookProductionStage.SHIPPING_PREPARATION,
        "배송 준비",
      );

      assertShippingAddress(
        order,
      );

      assertTrackingInformation(
        order,
      );

      if (
        !order.printingCompletedAt
      ) {
        throw new RouteError(
          "인쇄 완료 처리가 되지 않아 택배 발송을 등록할 수 없습니다.",
          409,
        );
      }

      updateData = {
        productionStage:
          BookProductionStage.SHIPPED,

        productionStageUpdatedAt:
          now,

        shippedAt:
          order.shippedAt ||
          now,
      };

      auditAction =
        "BOOK_SHIPMENT_REGISTERED";

      auditSummary =
        `주문 ${order.orderId}의 택배 발송을 등록했습니다. ${order.shippingCarrier} / ${order.trackingNumber}`;

      responseMessage =
        "택배 발송을 등록했습니다. 고객 주문 상세에 택배사와 송장번호가 표시됩니다.";
    }

    if (
      action ===
      "COMPLETE"
    ) {
      assertCurrentStage(
        order,
        BookProductionStage.SHIPPED,
        "배송 중",
      );

      assertTrackingInformation(
        order,
      );

      if (
        !order.shippedAt
      ) {
        throw new RouteError(
          "택배 발송일이 등록되지 않아 제작·배송 완료 처리할 수 없습니다.",
          409,
        );
      }

      updateData = {
        productionStage:
          BookProductionStage.COMPLETED,

        productionStageUpdatedAt:
          now,

        completedAt:
          order.completedAt ||
          now,
      };

      auditAction =
        "BOOK_ORDER_PRODUCTION_COMPLETED";

      auditSummary =
        `주문 ${order.orderId}의 인쇄·배송 제작을 완료 처리했습니다.`;

      responseMessage =
        "주문 제작을 완료 처리했습니다.";
    }

    const updatedOrder =
      await prisma.$transaction(
        async (
          transaction,
        ) => {
          const updateResult =
            await transaction.bookOrder.updateMany({
              where: {
                id:
                  order.id,

                status:
                  BookOrderStatus.PAID,

                productionStage:
                  order.productionStage,

                updatedAt:
                  order.updatedAt,
              },

              data:
                updateData,
            });

          if (
            updateResult.count !==
            1
          ) {
            throw new RouteError(
              "다른 관리자 작업으로 주문 상태가 먼저 변경됐습니다. 화면을 새로고침해 주세요.",
              409,
            );
          }

          const result =
            await transaction.bookOrder.findUnique({
              where: {
                id:
                  order.id,
              },
              select: {
                id: true,
                orderId: true,
                status: true,
                productionStage:
                  true,
                productionStageUpdatedAt:
                  true,
                specification:
                  true,
                quantity: true,
                proofFileUrl:
                  true,
                proofApprovedAt:
                  true,
                printOrderedAt:
                  true,
                printingCompletedAt:
                  true,
                recipientName:
                  true,
                recipientPhone:
                  true,
                postalCode: true,
                shippingAddress1:
                  true,
                shippingAddress2:
                  true,
                shippingMemo:
                  true,
                shippingCarrier:
                  true,
                trackingNumber:
                  true,
                shippedAt: true,
                completedAt:
                  true,
                productionNote:
                  true,
                updatedAt: true,
              },
            });

          if (!result) {
            throw new RouteError(
              "변경된 주문 정보를 확인할 수 없습니다.",
              500,
            );
          }

          return result;
        },
      );

    if (
      action === "SHIP" ||
      action === "COMPLETE"
    ) {
      try {
        const emailOrder =
          await prisma.bookOrder.findUnique({
            where: {
              id: orderRecordId,
            },
            select: {
              id: true,
              orderId: true,
              productionStage: true,
              proofFileUrl: true,
              shippingCarrier: true,
              trackingNumber: true,

              productionRequest: {
                select: {
                  name: true,
                  email: true,
                },
              },

              book: {
                select: {
                  title: true,
                },
              },

              author: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          });

        if (emailOrder) {
          await sendOrderProductionStageEmail({
            to:
              emailOrder.productionRequest
                .email ||
              emailOrder.author.email,

            customerName:
              emailOrder.productionRequest
                .name ||
              emailOrder.author.name,

            bookTitle:
              emailOrder.book.title,

            orderRecordId:
              emailOrder.id,

            orderId:
              emailOrder.orderId,

            stage:
              String(
                emailOrder.productionStage,
              ),

            proofFileUrl:
              emailOrder.proofFileUrl,

            shippingCarrier:
              emailOrder.shippingCarrier,

            trackingNumber:
              emailOrder.trackingNumber,
          });
        }
      } catch (shippingEmailError) {
        console.error(
          "[BOOK_PRODUCTION_STAGE_EMAIL_ERROR]",
          {
            orderRecordId,
            orderId: order.orderId,
            error: shippingEmailError,
          },
        );
      }
    }
    try {
      await recordBookOrderAudit({
        orderId:
          order.id,

        actorId:
          admin.id,

        actorName:
          admin.name,

        actorEmail:
          admin.email,

        source:
          "ADMIN",

        category:
          "PRODUCTION",

        action:
          auditAction,

        summary:
          auditSummary,

        before:
          createAuditSnapshot(
            order,
          ),

        after:
          createAuditSnapshot(
            updatedOrder,
          ),

        isCustomerVisible:
          action ===
            "SHIP" ||
          action ===
            "COMPLETE",
      });
    } catch (auditError) {
      console.error(
        "[ADMIN_PRINT_SHIPPING_AUDIT_ERROR]",
        auditError,
      );
    }

    revalidatePrintShippingPaths(
      order.id,
      order.bookId,
    );

    return NextResponse.json({
      ok: true,

      message:
        responseMessage,

      action,

      order:
        updatedOrder,
    });
  } catch (error) {
    return handleRouteError(
      error,
      "[ADMIN_PRINT_SHIPPING_ERROR]",
    );
  }
}

function parseAction(
  value: unknown,
): PrintShippingAction {
  const action =
    cleanText(value).toUpperCase();

  const allowedActions:
    PrintShippingAction[] =
    [
      "SAVE_SHIPPING",
      "ORDER_PRINT",
      "START_PRINTING",
      "COMPLETE_PRINTING",
      "SHIP",
      "COMPLETE",
    ];

  if (
    !allowedActions.includes(
      action as PrintShippingAction,
    )
  ) {
    throw new RouteError(
      "지원하지 않는 인쇄·배송 작업입니다.",
      400,
    );
  }

  return action as PrintShippingAction;
}

function parseShippingUpdate(
  body: Record<
    string,
    unknown
  >,
): Prisma.BookOrderUpdateManyMutationInput {
  const updateData:
    Prisma.BookOrderUpdateManyMutationInput =
    {};

  const recipientName =
    parseOptionalTextField(
      body,
      "recipientName",
      "수령인 이름",
      100,
    );

  const recipientPhone =
    parseOptionalTextField(
      body,
      "recipientPhone",
      "수령인 연락처",
      50,
    );

  const postalCode =
    parseOptionalTextField(
      body,
      "postalCode",
      "우편번호",
      20,
    );

  const shippingAddress1 =
    parseOptionalTextField(
      body,
      "shippingAddress1",
      "기본 배송지",
      500,
    );

  const shippingAddress2 =
    parseOptionalTextField(
      body,
      "shippingAddress2",
      "상세 배송지",
      500,
    );

  const shippingMemo =
    parseOptionalTextField(
      body,
      "shippingMemo",
      "배송 메모",
      500,
    );

  const shippingCarrier =
    parseOptionalTextField(
      body,
      "shippingCarrier",
      "택배사",
      100,
    );

  const trackingNumber =
    parseOptionalTextField(
      body,
      "trackingNumber",
      "송장번호",
      100,
    );

  const productionNote =
    parseOptionalTextField(
      body,
      "productionNote",
      "관리자 제작 메모",
      2000,
    );

  if (
    recipientName.provided
  ) {
    updateData.recipientName =
      recipientName.value;
  }

  if (
    recipientPhone.provided
  ) {
    updateData.recipientPhone =
      recipientPhone.value;
  }

  if (
    postalCode.provided
  ) {
    updateData.postalCode =
      postalCode.value;
  }

  if (
    shippingAddress1.provided
  ) {
    updateData.shippingAddress1 =
      shippingAddress1.value;
  }

  if (
    shippingAddress2.provided
  ) {
    updateData.shippingAddress2 =
      shippingAddress2.value;
  }

  if (
    shippingMemo.provided
  ) {
    updateData.shippingMemo =
      shippingMemo.value;
  }

  if (
    shippingCarrier.provided
  ) {
    updateData.shippingCarrier =
      shippingCarrier.value;
  }

  if (
    trackingNumber.provided
  ) {
    updateData.trackingNumber =
      trackingNumber.value?.replace(/\D/g, "") ?? null;
  }

  if (
    productionNote.provided
  ) {
    updateData.productionNote =
      productionNote.value;
  }

  return updateData;
}

function parseOptionalTextField(
  body: Record<
    string,
    unknown
  >,
  key: string,
  label: string,
  maxLength: number,
):
  | {
      provided: false;
    }
  | {
      provided: true;
      value:
        | string
        | null;
    } {
  if (
    !Object.prototype.hasOwnProperty.call(
      body,
      key,
    )
  ) {
    return {
      provided: false,
    };
  }

  const value =
    body[key];

  if (
    value === null
  ) {
    return {
      provided: true,
      value: null,
    };
  }

  if (
    typeof value !==
    "string"
  ) {
    throw new RouteError(
      `${label} 형식이 올바르지 않습니다.`,
      400,
    );
  }

  const cleaned =
    value.trim();

  if (
    cleaned.length >
    maxLength
  ) {
    throw new RouteError(
      `${label}은 ${maxLength}자 이내로 입력해 주세요.`,
      400,
    );
  }

  return {
    provided: true,
    value:
      cleaned || null,
  };
}

function assertCurrentStage(
  order: ExistingOrder,
  expectedStage: BookProductionStage,
  expectedLabel: string,
) {
  if (
    order.productionStage !==
    expectedStage
  ) {
    throw new RouteError(
      `현재 제작 단계가 '${expectedLabel}' 단계가 아니므로 작업을 진행할 수 없습니다.`,
      409,
    );
  }
}

function assertShippingEditable(
  order: ExistingOrder,
) {
  if (
    order.productionStage ===
      BookProductionStage.SHIPPED ||
    order.productionStage ===
      BookProductionStage.COMPLETED
  ) {
    throw new RouteError(
      "이미 발송됐거나 완료된 주문의 배송 정보는 이 화면에서 변경할 수 없습니다.",
      409,
    );
  }
}

function assertShippingAddress(
  order: ExistingOrder,
) {
  const missing: string[] =
    [];

  if (
    !hasText(
      order.recipientName,
    )
  ) {
    missing.push(
      "수령인 이름",
    );
  }

  if (
    !hasText(
      order.recipientPhone,
    )
  ) {
    missing.push(
      "수령인 연락처",
    );
  }

  if (
    !hasText(
      order.postalCode,
    )
  ) {
    missing.push(
      "우편번호",
    );
  }

  if (
    !hasText(
      order.shippingAddress1,
    )
  ) {
    missing.push(
      "기본 배송지",
    );
  }

  if (
    missing.length >
    0
  ) {
    throw new RouteError(
      `배송 준비 전에 수령인과 배송지 정보를 등록해 주세요: ${missing.join(
        ", ",
      )}`,
      409,
    );
  }
}

function assertTrackingInformation(
  order: ExistingOrder,
) {
  const missing: string[] =
    [];

  if (
    !hasText(
      order.shippingCarrier,
    )
  ) {
    missing.push(
      "택배사",
    );
  }

  if (
    !hasText(
      order.trackingNumber,
    )
  ) {
    missing.push(
      "송장번호",
    );
  }

  if (
    missing.length >
    0
  ) {
    throw new RouteError(
      `택배 발송 전에 택배사와 송장번호를 등록해 주세요: ${missing.join(
        ", ",
      )}`,
      409,
    );
  }
}

function createAuditSnapshot(
  order: {
    orderId: string;
    status: unknown;
    productionStage: unknown;
    productionStageUpdatedAt:
      Date;
    specification: string | null;
    quantity: number;
    proofFileUrl: string | null;
    proofApprovedAt:
      Date | null;
    printOrderedAt:
      Date | null;
    printingCompletedAt:
      Date | null;
    recipientName:
      string | null;
    recipientPhone:
      string | null;
    postalCode:
      string | null;
    shippingAddress1:
      string | null;
    shippingAddress2:
      string | null;
    shippingMemo:
      string | null;
    shippingCarrier:
      string | null;
    trackingNumber:
      string | null;
    shippedAt:
      Date | null;
    completedAt:
      Date | null;
    productionNote:
      string | null;
    updatedAt: Date;
  },
) {
  return {
    orderId:
      order.orderId,

    status:
      String(
        order.status,
      ),

    productionStage:
      String(
        order.productionStage,
      ),

    productionStageUpdatedAt:
      order.productionStageUpdatedAt,

    specification:
      order.specification,

    quantity:
      order.quantity,

    proofFileUrl:
      order.proofFileUrl,

    proofApprovedAt:
      order.proofApprovedAt,

    printOrderedAt:
      order.printOrderedAt,

    printingCompletedAt:
      order.printingCompletedAt,

    recipientName:
      order.recipientName,

    recipientPhone:
      order.recipientPhone,

    postalCode:
      order.postalCode,

    shippingAddress1:
      order.shippingAddress1,

    shippingAddress2:
      order.shippingAddress2,

    shippingMemo:
      order.shippingMemo,

    shippingCarrier:
      order.shippingCarrier,

    trackingNumber:
      order.trackingNumber,

    shippedAt:
      order.shippedAt,

    completedAt:
      order.completedAt,

    productionNote:
      order.productionNote,

    updatedAt:
      order.updatedAt,
  };
}

async function requireAdmin(): Promise<AdminIdentity> {
  const session =
    await auth();

  const userId =
    session?.user?.id;

  if (!userId) {
    throw new RouteError(
      "로그인이 필요합니다.",
      401,
    );
  }

  const user =
    await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

  if (
    !user ||
    user.role !==
      "ADMIN"
  ) {
    throw new RouteError(
      "관리자만 인쇄·배송 작업을 변경할 수 있습니다.",
      403,
    );
  }

  return {
    id:
      user.id,

    name:
      user.name,

    email:
      user.email,
  };
}

function hasText(
  value: unknown,
) {
  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0
  );
}

function cleanText(
  value: unknown,
) {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

function isRecord(
  value: unknown,
): value is Record<
  string,
  unknown
> {
  return Boolean(
    value &&
      typeof value ===
        "object" &&
      !Array.isArray(
        value,
      ),
  );
}

function getErrorMessage(
  error: unknown,
) {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message.trim();
  }

  return "알 수 없는 오류가 발생했습니다.";
}

function handleRouteError(
  error: unknown,
  logLabel: string,
) {
  const message =
    getErrorMessage(
      error,
    );

  const status =
    error instanceof
    RouteError
      ? error.status
      : 500;

  console.error(
    logLabel,
    error,
  );

  return NextResponse.json(
    {
      ok: false,
      message,
    },
    {
      status,
    },
  );
}

function revalidatePrintShippingPaths(
  orderRecordId: string,
  bookId: string,
) {
  revalidatePath(
    "/admin",
  );

  revalidatePath(
    "/admin/orders",
  );

  revalidatePath(
    `/admin/orders/${orderRecordId}`,
  );

  revalidatePath(
    "/admin/production-requests",
  );

  revalidatePath(
    "/admin/order-audit",
  );

  revalidatePath(
    "/dashboard/orders",
  );

  revalidatePath(
    `/dashboard/orders/${orderRecordId}`,
  );

  if (bookId) {
    revalidatePath(
      `/dashboard/library/${bookId}`,
    );
  }
}