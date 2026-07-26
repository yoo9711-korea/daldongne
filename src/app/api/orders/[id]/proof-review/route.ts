import { auth } from "@/auth";
import { recordBookOrderAudit } from "@/lib/order-audit";
import { prisma } from "@/lib/prisma";
import {
  BookOrderStatus,
  BookProductionStage,
  Prisma,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ProofReviewAction =
  | "APPROVE"
  | "REQUEST_CHANGES";

type RequestBody = {
  action?: unknown;
  message?: unknown;
};

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const session = await auth();
    const userId =
      session?.user?.id;

    if (!userId) {
      return createErrorResponse(
        "로그인이 필요합니다.",
        401,
      );
    }

    const { id } =
      await context.params;

    const orderRecordId =
      id.trim();

    if (!orderRecordId) {
      return createErrorResponse(
        "주문 정보를 찾을 수 없습니다.",
        400,
      );
    }

    const body =
      (await request
        .json()
        .catch(() => null)) as
        | RequestBody
        | null;

    const action =
      parseAction(
        body?.action,
      );

    if (!action) {
      return createErrorResponse(
        "교정 승인 또는 수정 요청을 선택해 주세요.",
        400,
      );
    }

    const message =
      normalizeMessage(
        body?.message,
      );

    if (
      action ===
        "REQUEST_CHANGES" &&
      message.length < 10
    ) {
      return createErrorResponse(
        "수정 요청 내용을 10자 이상 입력해 주세요.",
        400,
      );
    }

    if (message.length > 3000) {
      return createErrorResponse(
        "전달 내용은 3,000자 이하로 입력해 주세요.",
        400,
      );
    }

    const order =
      await prisma.bookOrder.findFirst({
        where: {
          id: orderRecordId,
          authorId: userId,
        },
        select: {
          id: true,
          authorId: true,
          orderId: true,
          status: true,
          productionStage: true,
          productionStageUpdatedAt:
            true,
          proofFileUrl: true,
          proofSentAt: true,
          proofApprovedAt: true,
          book: {
            select: {
              title: true,
            },
          },
        },
      });

    if (!order) {
      return createErrorResponse(
        "본인의 주문만 처리할 수 있습니다.",
        404,
      );
    }

    const unavailableStatuses:
      BookOrderStatus[] = [
        BookOrderStatus.CANCELED,
        BookOrderStatus.REFUNDED,
        BookOrderStatus.PARTIALLY_REFUNDED,
      ];

    if (
      unavailableStatuses.includes(
        order.status,
      )
    ) {
      return createErrorResponse(
        "취소 또는 환불된 주문은 교정 응답을 제출할 수 없습니다.",
        409,
      );
    }

    if (
      !order.proofFileUrl ||
      !order.proofSentAt
    ) {
      return createErrorResponse(
        "현재 확인할 교정본이 없습니다.",
        409,
      );
    }

    if (
      order.productionStage !==
      BookProductionStage.PROOF_SENT
    ) {
      const message =
        order.productionStage ===
        BookProductionStage.PROOF_APPROVED
          ? "이미 교정 승인이 완료되었습니다."
          : "현재 교정 응답을 제출할 수 있는 단계가 아닙니다.";

      return createErrorResponse(
        message,
        409,
      );
    }

    const proofFileUrl =
      order.proofFileUrl;

    const proofSentAt =
      order.proofSentAt;

    const existingResponse =
      await prisma.bookOrderProofReview.findUnique({
        where: {
          orderId_proofSentAt: {
            orderId:
              order.id,
            proofSentAt,
          },
        },
        select: {
          id: true,
          responseType: true,
        },
      });

    if (existingResponse) {
      return createErrorResponse(
        "현재 교정본에 대한 응답이 이미 접수되었습니다.",
        409,
      );
    }

    const now =
      new Date();

    const responseType =
      action === "APPROVE"
        ? "APPROVED"
        : "CHANGES_REQUESTED";

    const result =
      await prisma.$transaction(
        async (transaction) => {
          const review =
            await transaction.bookOrderProofReview.create({
              data: {
                orderId:
                  order.id,
                authorId:
                  order.authorId,
                proofFileUrl,
                proofSentAt,
                responseType,
                message:
                  message || null,
              },
              select: {
                id: true,
                responseType:
                  true,
                message: true,
                proofFileUrl:
                  true,
                proofSentAt:
                  true,
                createdAt: true,
              },
            });

          const updatedOrder =
            await transaction.bookOrder.update({
              where: {
                id: order.id,
              },
              data:
                action ===
                "APPROVE"
                  ? {
                      productionStage:
                        BookProductionStage.PROOF_APPROVED,
                      productionStageUpdatedAt:
                        now,
                      proofApprovedAt:
                        now,
                    }
                  : {
                      productionStage:
                        BookProductionStage.PROOFING,
                      productionStageUpdatedAt:
                        now,
                      proofApprovedAt:
                        null,
                      proofSentAt:
                        null,
                    },
              select: {
                id: true,
                orderId: true,
                productionStage:
                  true,
                productionStageUpdatedAt:
                  true,
                proofFileUrl:
                  true,
                proofSentAt:
                  true,
                proofApprovedAt:
                  true,
              },
            });

          return {
            review,
            updatedOrder,
          };
        },
      );

    await recordBookOrderAudit({
      orderId: order.id,
      actorId: userId,
      source: "CUSTOMER",
      category: "PRODUCTION",
      action:
        action === "APPROVE"
          ? "PROOF_APPROVED_BY_CUSTOMER"
          : "PROOF_CHANGES_REQUESTED",
      summary:
        action === "APPROVE"
          ? "고객이 교정본을 최종 승인했습니다."
          : createChangeRequestSummary(
              message,
            ),
      before: {
        productionStage:
          order.productionStage,
        productionStageUpdatedAt:
          order.productionStageUpdatedAt,
        proofFileUrl:
          order.proofFileUrl,
        proofSentAt:
          order.proofSentAt,
        proofApprovedAt:
          order.proofApprovedAt,
      },
      after: {
        productionStage:
          result.updatedOrder
            .productionStage,
        productionStageUpdatedAt:
          result.updatedOrder
            .productionStageUpdatedAt,
        proofFileUrl:
          result.updatedOrder
            .proofFileUrl,
        proofSentAt:
          result.updatedOrder
            .proofSentAt,
        proofApprovedAt:
          result.updatedOrder
            .proofApprovedAt,
        proofResponseType:
          result.review
            .responseType,
        proofResponseMessage:
          result.review.message,
      },
      isCustomerVisible: true,
    });

    revalidatePath(
      "/admin",
    );

    revalidatePath(
      "/admin/proof-reviews",
    );

    revalidatePath(
      "/admin/production-requests",
    );

    revalidatePath(
      "/admin/order-audit",
    );

    revalidatePath(
      `/admin/orders/${order.id}`,
    );

    revalidatePath(
      "/dashboard/orders",
    );

    revalidatePath(
      `/dashboard/orders/${order.id}`,
    );

    return NextResponse.json({
      ok: true,
      reviewId:
        result.review.id,
      responseType,
      message:
        action === "APPROVE"
          ? "교정본 승인이 완료되었습니다."
          : "수정 요청이 담당자에게 전달되었습니다.",
    });
  } catch (error) {
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return createErrorResponse(
        "현재 교정본에 대한 응답이 이미 접수되었습니다.",
        409,
      );
    }

    console.error(
      "[ORDER_PROOF_REVIEW_ERROR]",
      error,
    );

    return createErrorResponse(
      "교정 응답 처리 중 오류가 발생했습니다.",
      500,
    );
  }
}

function parseAction(
  value: unknown,
): ProofReviewAction | null {
  if (value === "APPROVE") {
    return "APPROVE";
  }

  if (
    value ===
    "REQUEST_CHANGES"
  ) {
    return "REQUEST_CHANGES";
  }

  return null;
}

function normalizeMessage(
  value: unknown,
) {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value.trim();
}

function createChangeRequestSummary(
  message: string,
) {
  const preview =
    message.length > 200
      ? `${message.slice(
          0,
          200,
        )}…`
      : message;

  return `고객이 교정본 수정을 요청했습니다. 요청: ${preview}`;
}

function createErrorResponse(
  message: string,
  status: number,
) {
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