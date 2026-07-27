import { auth } from "@/auth";
import {
  recordBookOrderAudit,
} from "@/lib/order-audit";
import { prisma } from "@/lib/prisma";
import {
  AIBookProductionStatus,
  AIBookProductionStep,
  BookProductionStage,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type DecisionRequestBody = {
  decision?: unknown;
  note?: unknown;
};

type Decision =
  | "APPROVE"
  | "REJECT";

type AdminIdentity = {
  id: string;
  name: string | null;
  email: string | null;
};

class RouteError extends Error {
  status: number;

  constructor(
    message: string,
    status: number,
  ) {
    super(message);

    this.name =
      "RouteError";

    this.status =
      status;
  }
}

export async function POST(
  request: NextRequest,
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
      (await request
        .json()
        .catch(
          () => null,
        )) as
        | DecisionRequestBody
        | null;

    const decision =
      normalizeDecision(
        body?.decision,
      );

    const note =
      cleanText(
        body?.note,
      );

    if (!decision) {
      throw new RouteError(
        "승인 또는 반려 결정을 선택해 주세요.",
        400,
      );
    }

    if (
      note.length >
      2000
    ) {
      throw new RouteError(
        "관리자 결정 메모는 2,000자 이하로 작성해 주세요.",
        400,
      );
    }

    if (
      decision ===
        "REJECT" &&
      !note
    ) {
      throw new RouteError(
        "반려할 때는 수정이 필요한 내용을 입력해 주세요.",
        400,
      );
    }

    const order =
      await prisma.bookOrder.findUnique({
        where: {
          id:
            orderRecordId,
        },
        select: {
          id: true,
          orderId: true,
          bookId: true,
          status: true,
          productionStage:
            true,
          proofApprovedAt:
            true,
          productionStageUpdatedAt:
            true,
          book: {
            select: {
              title: true,
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

    if (
      String(
        order.status,
      ) !== "PAID"
    ) {
      throw new RouteError(
        "결제가 완료된 주문만 최종 승인하거나 반려할 수 있습니다.",
        409,
      );
    }

    const run =
      await prisma.aIBookProductionRun.findFirst({
        where: {
          orderId:
            order.id,
        },
        orderBy: {
          attempt:
            "desc",
        },
        select: {
          id: true,
          attempt: true,
          status: true,
          currentStep:
            true,
          finalPdfUrl:
            true,
          requiresHumanReview:
            true,
          humanReviewReason:
            true,
          adminDecisionNote:
            true,
          approvedById:
            true,
          approvedAt:
            true,
          completedAt:
            true,
        },
      });

    if (!run) {
      throw new RouteError(
        "AI 제작 실행 기록을 찾을 수 없습니다.",
        404,
      );
    }

    if (
      run.status !==
        AIBookProductionStatus
          .READY_FOR_APPROVAL ||
      run.currentStep !==
        AIBookProductionStep
          .ADMIN_APPROVAL
    ) {
      throw new RouteError(
        "현재 AI 제작 작업은 최종 승인 대기 상태가 아닙니다.",
        409,
      );
    }

    if (
      !cleanText(
        run.finalPdfUrl,
      )
    ) {
      throw new RouteError(
        "승인할 최종 PDF가 없습니다.",
        409,
      );
    }

    const now =
      new Date();

    const isApproval =
      decision ===
      "APPROVE";

    const decisionNote =
      note ||
      "관리자가 최종 PDF를 확인하고 승인했습니다.";

    const nextRunStatus =
      isApproval
        ? AIBookProductionStatus
            .APPROVED
        : AIBookProductionStatus
            .REJECTED;

    const nextProductionStage =
      isApproval
        ? BookProductionStage
            .PROOF_APPROVED
        : BookProductionStage
            .ON_HOLD;

    const nextHumanReviewReason =
      isApproval
        ? null
        : joinReviewReasons(
            run.humanReviewReason,
            `관리자 반려: ${decisionNote}`,
          );

    const result =
      await prisma.$transaction(
        async (
          transaction,
        ) => {
          const claimed =
            await transaction.aIBookProductionRun.updateMany({
              where: {
                id:
                  run.id,
                status:
                  AIBookProductionStatus
                    .READY_FOR_APPROVAL,
                currentStep:
                  AIBookProductionStep
                    .ADMIN_APPROVAL,
              },
              data: {
                status:
                  nextRunStatus,
                requiresHumanReview:
                  !isApproval,
                humanReviewReason:
                  nextHumanReviewReason,
                adminDecisionNote:
                  decisionNote,
                approvedById:
                  isApproval
                    ? admin.id
                    : null,
                approvedAt:
                  isApproval
                    ? now
                    : null,
              },
            });

          if (
            claimed.count !==
            1
          ) {
            throw new RouteError(
              "다른 관리자가 먼저 승인 상태를 변경했습니다. 화면을 새로고침해 주세요.",
              409,
            );
          }

          await transaction.bookOrder.update({
            where: {
              id:
                order.id,
            },
            data: {
              productionStage:
                nextProductionStage,
              productionStageUpdatedAt:
                now,
              proofApprovedAt:
                isApproval
                  ? now
                  : null,
            },
          });

          const updatedRun =
            await transaction.aIBookProductionRun.findUnique({
              where: {
                id:
                  run.id,
              },
              select: {
                id: true,
                attempt:
                  true,
                status:
                  true,
                currentStep:
                  true,
                finalPdfUrl:
                  true,
                requiresHumanReview:
                  true,
                humanReviewReason:
                  true,
                adminDecisionNote:
                  true,
                approvedById:
                  true,
                approvedAt:
                  true,
                completedAt:
                  true,
                updatedAt:
                  true,
              },
            });

          if (!updatedRun) {
            throw new RouteError(
              "변경된 AI 제작 기록을 확인할 수 없습니다.",
              500,
            );
          }

          return updatedRun;
        },
      );

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
          isApproval
            ? "AI_FINAL_PDF_APPROVED"
            : "AI_FINAL_PDF_REJECTED",
        summary:
          isApproval
            ? `AI 자동 제작 ${run.attempt}차 최종 PDF를 승인했습니다.`
            : `AI 자동 제작 ${run.attempt}차 최종 PDF를 반려했습니다.`,
        before: {
          aiProductionRunId:
            run.id,
          status:
            run.status,
          currentStep:
            run.currentStep,
          requiresHumanReview:
            run.requiresHumanReview,
          humanReviewReason:
            run.humanReviewReason,
          adminDecisionNote:
            run.adminDecisionNote,
          approvedById:
            run.approvedById,
          approvedAt:
            run.approvedAt,
          productionStage:
            order.productionStage,
          proofApprovedAt:
            order.proofApprovedAt,
        },
        after: {
          aiProductionRunId:
            result.id,
          status:
            result.status,
          currentStep:
            result.currentStep,
          requiresHumanReview:
            result.requiresHumanReview,
          humanReviewReason:
            result.humanReviewReason,
          adminDecisionNote:
            result.adminDecisionNote,
          approvedById:
            result.approvedById,
          approvedAt:
            result.approvedAt,
          productionStage:
            nextProductionStage,
          proofApprovedAt:
            isApproval
              ? now
              : null,
        },
        isCustomerVisible:
          false,
      });
    } catch (auditError) {
      console.error(
        "[ADMIN_AI_FINAL_DECISION_AUDIT_ERROR]",
        auditError,
      );
    }

    revalidateAIProductionPaths(
      order.id,
      order.bookId,
    );

    return NextResponse.json({
      ok: true,
      message:
        isApproval
          ? "최종 PDF를 승인했습니다. 인쇄 발주 전 단계로 이동했습니다."
          : "최종 PDF를 반려했습니다. 주문 제작이 보류 상태로 변경됐습니다.",
      decision,
      run: result,
      order: {
        id:
          order.id,
        orderId:
          order.orderId,
        productionStage:
          nextProductionStage,
        proofApprovedAt:
          isApproval
            ? now
            : null,
      },
    });
  } catch (error) {
    return handleRouteError(
      error,
      "[ADMIN_AI_FINAL_DECISION_ERROR]",
    );
  }
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
        id:
          userId,
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
      "관리자만 최종 승인 결정을 처리할 수 있습니다.",
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

function normalizeDecision(
  value: unknown,
): Decision | null {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const normalized =
    value
      .trim()
      .toUpperCase();

  if (
    normalized ===
      "APPROVE" ||
    normalized ===
      "REJECT"
  ) {
    return normalized;
  }

  return null;
}

function joinReviewReasons(
  previous: string | null,
  next: string,
) {
  return Array.from(
    new Set(
      [
        cleanText(
          previous,
        ),
        cleanText(
          next,
        ),
      ].filter(Boolean),
    ),
  ).join("\n");
}

function cleanText(
  value: unknown,
) {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value.trim();
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

function revalidateAIProductionPaths(
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