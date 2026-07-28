import { auth } from "@/auth";
import { recordBookOrderAudit } from "@/lib/order-audit";
import { prisma } from "@/lib/prisma";
import {
  AIBookProductionStatus,
  AIBookProductionStep,
  BookOrderStatus,
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

type AdminIdentity = {
  id: string;
  name: string | null;
  email: string | null;
};

type RetryPlan = {
  nextStatus: AIBookProductionStatus;
  action: string;
  summary: string;
  message: string;
  failurePrefix: string;
  resetData: Prisma.AIBookProductionRunUncheckedUpdateManyInput;
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
  _request: Request,
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

    const order =
      await prisma.bookOrder.findUnique({
        where: {
          id: orderRecordId,
        },
        select: {
          id: true,
          orderId: true,
          bookId: true,
          status: true,
          productionStage: true,
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
        "결제가 완료된 주문만 AI 제작 작업을 복구할 수 있습니다.",
        409,
      );
    }

    const failedRun =
      await prisma.aIBookProductionRun.findFirst({
        where: {
          orderId: order.id,
          bookId: order.bookId,
        },
        orderBy: {
          attempt: "desc",
        },
        select: {
          id: true,
          attempt: true,
          status: true,
          currentStep: true,
          humanReviewReason: true,
          requiresHumanReview: true,
          finalPdfUrl: true,
          updatedAt: true,
        },
      });

    if (!failedRun) {
      throw new RouteError(
        "AI 제작 실행 기록을 찾을 수 없습니다.",
        404,
      );
    }

    if (
      failedRun.status !==
      AIBookProductionStatus.FAILED
    ) {
      throw new RouteError(
        "가장 최근 AI 제작 회차가 실패 상태가 아닙니다.",
        409,
      );
    }

    const retryPlan =
      getRetryPlan(
        failedRun.currentStep,
      );

    if (!retryPlan) {
      throw new RouteError(
        `현재 실패 단계(${failedRun.currentStep})는 자동 복구할 수 없습니다.`,
        409,
      );
    }

    const remainingReviewReason =
      removeFailureReason(
        failedRun.humanReviewReason,
        retryPlan.failurePrefix,
      );

    const retryData:
      Prisma.AIBookProductionRunUpdateManyMutationInput =
      {
        ...retryPlan.resetData,

        status:
          retryPlan.nextStatus,

        requiresHumanReview:
          Boolean(
            remainingReviewReason,
          ),

        humanReviewReason:
          remainingReviewReason,

        completedAt:
          null,

        approvedAt:
          null,

        approvedById:
          null,
      };

    const updatedRun =
      await prisma.$transaction(
        async (
          transaction,
        ) => {
          const claimed =
            await transaction.aIBookProductionRun.updateMany({
              where: {
                id:
                  failedRun.id,

                status:
                  AIBookProductionStatus.FAILED,

                currentStep:
                  failedRun.currentStep,
              },

              data:
                retryData,
            });

          if (
            claimed.count !==
            1
          ) {
            throw new RouteError(
              "다른 관리자 작업으로 AI 제작 상태가 먼저 변경됐습니다. 화면을 새로고침해 주세요.",
              409,
            );
          }

          const result =
            await transaction.aIBookProductionRun.findUnique({
              where: {
                id:
                  failedRun.id,
              },

              select: {
                id: true,
                attempt: true,
                status: true,
                currentStep:
                  true,
                requiresHumanReview:
                  true,
                humanReviewReason:
                  true,
                finalPdfUrl:
                  true,
                startedAt:
                  true,
                completedAt:
                  true,
                updatedAt:
                  true,
              },
            });

          if (!result) {
            throw new RouteError(
              "복구된 AI 제작 기록을 확인할 수 없습니다.",
              500,
            );
          }

          return result;
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
          retryPlan.action,

        summary:
          retryPlan.summary.replace(
            "{attempt}",
            String(
              failedRun.attempt,
            ),
          ),

        before: {
          aiProductionRunId:
            failedRun.id,

          attempt:
            failedRun.attempt,

          status:
            failedRun.status,

          currentStep:
            failedRun.currentStep,

          requiresHumanReview:
            failedRun.requiresHumanReview,

          humanReviewReason:
            failedRun.humanReviewReason,

          finalPdfUrl:
            failedRun.finalPdfUrl,

          productionStage:
            order.productionStage,
        },

        after: {
          aiProductionRunId:
            updatedRun.id,

          attempt:
            updatedRun.attempt,

          status:
            updatedRun.status,

          currentStep:
            updatedRun.currentStep,

          requiresHumanReview:
            updatedRun.requiresHumanReview,

          humanReviewReason:
            updatedRun.humanReviewReason,

          finalPdfUrl:
            updatedRun.finalPdfUrl,

          resumedExistingRun:
            true,
        },

        isCustomerVisible:
          false,
      });
    } catch (auditError) {
      console.error(
        "[ADMIN_AI_PRODUCTION_RETRY_AUDIT_ERROR]",
        auditError,
      );
    }

    revalidateRetryPaths(
      order.id,
      order.bookId,
    );

    return NextResponse.json({
      ok: true,

      message:
        retryPlan.message,

      retryStep:
        failedRun.currentStep,

      run:
        updatedRun,
    });
  } catch (error) {
    return handleRouteError(
      error,
      "[ADMIN_AI_PRODUCTION_RETRY_ERROR]",
    );
  }
}

function getRetryPlan(
  step: AIBookProductionStep,
): RetryPlan | null {
  if (
    step ===
    AIBookProductionStep.MATERIAL_ANALYSIS
  ) {
    return {
      nextStatus:
        AIBookProductionStatus.QUEUED,

      action:
        "AI_MATERIAL_ANALYSIS_RETRY_READY",

      summary:
        "AI 자동 제작 {attempt}차 자료 분석 실패 상태를 복구했습니다.",

      message:
        "자료 분석 실패 상태를 복구했습니다. AI 전체 자동 제작을 다시 실행하면 자료 분석 단계부터 이어서 진행됩니다.",

      failurePrefix:
        "AI 자료 분석 실패:",

      resetData: {
        outlineData:
          Prisma.DbNull,

        photoSelectionData:
          Prisma.DbNull,

        manuscriptData:
          Prisma.DbNull,

        layoutData:
          Prisma.DbNull,

        qualityReport:
          Prisma.DbNull,

        finalPdfUrl:
          null,
      },
    };
  }

  if (
    step ===
    AIBookProductionStep.MANUSCRIPT_EDITING
  ) {
    return {
      nextStatus:
        AIBookProductionStatus.RUNNING,

      action:
        "AI_MANUSCRIPT_EDITING_RETRY_READY",

      summary:
        "AI 자동 제작 {attempt}차 원고 편집 실패 상태를 복구했습니다.",

      message:
        "원고 편집 실패 상태를 복구했습니다. AI 전체 자동 제작을 다시 실행하면 원고 편집 단계부터 이어서 진행됩니다.",

      failurePrefix:
        "AI 원고 편집 실패:",

      resetData: {
        manuscriptData:
          Prisma.DbNull,

        layoutData:
          Prisma.DbNull,

        qualityReport:
          Prisma.DbNull,

        finalPdfUrl:
          null,
      },
    };
  }

  if (
    step ===
    AIBookProductionStep.FINAL_PDF
  ) {
    return {
      nextStatus:
        AIBookProductionStatus.RUNNING,

      action:
        "AI_FINAL_PDF_RETRY_READY",

      summary:
        "AI 자동 제작 {attempt}차 최종 PDF 실패 상태를 복구했습니다.",

      message:
        "최종 PDF 실패 상태를 복구했습니다. AI 전체 자동 제작을 다시 실행하면 PDF 생성 단계부터 이어서 진행됩니다.",

      failurePrefix:
        "최종 PDF 생성 실패:",

      resetData: {
        finalPdfUrl:
          null,
      },
    };
  }

  return null;
}

function removeFailureReason(
  reason: string | null,
  failurePrefix: string,
) {
  if (!reason) {
    return null;
  }

  const remainingLines =
    reason
      .split(/\r?\n/)
      .map(
        (line) =>
          line.trim(),
      )
      .filter(Boolean)
      .filter(
        (line) =>
          !line.startsWith(
            failurePrefix,
          ),
      );

  return remainingLines.length >
    0
    ? Array.from(
        new Set(
          remainingLines,
        ),
      ).join("\n")
    : null;
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
      "관리자만 AI 제작 실패 상태를 복구할 수 있습니다.",
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

function cleanText(
  value: unknown,
) {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
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

function revalidateRetryPaths(
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
    "/admin/order-audit",
  );

  revalidatePath(
    "/dashboard/orders",
  );

  revalidatePath(
    `/dashboard/orders/${orderRecordId}`,
  );

  revalidatePath(
    `/internal/ai-book-pdf/${orderRecordId}`,
  );

  if (bookId) {
    revalidatePath(
      `/dashboard/library/${bookId}`,
    );
  }
}
