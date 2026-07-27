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

const STALE_MINUTES = 30;
const STALE_MILLISECONDS =
  STALE_MINUTES * 60 * 1000;

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

type StalledRun = {
  id: string;
  attempt: number;
  status: AIBookProductionStatus;
  currentStep: AIBookProductionStep;
  manuscriptData: Prisma.JsonValue;
  finalPdfUrl: string | null;
  updatedAt: Date;
};

type RecoveryPlan = {
  recoveryType:
    | "MATERIAL_ANALYSIS_LOCK"
    | "MANUSCRIPT_GENERATING_LOCK"
    | "FINAL_PDF_LOCK";
  action: string;
  message: string;
  updateData: Prisma.AIBookProductionRunUpdateManyMutationInput;
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
        "결제가 완료된 주문만 멈춘 AI 제작 작업을 복구할 수 있습니다.",
        409,
      );
    }

    const latestRun =
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
          manuscriptData: true,
          finalPdfUrl: true,
          updatedAt: true,
        },
      });

    if (!latestRun) {
      throw new RouteError(
        "AI 제작 실행 기록을 찾을 수 없습니다.",
        404,
      );
    }

    const staleBefore =
      new Date(
        Date.now() -
          STALE_MILLISECONDS,
      );

    if (
      latestRun.updatedAt >
      staleBefore
    ) {
      const elapsedMinutes =
        Math.max(
          0,
          Math.floor(
            (Date.now() -
              latestRun.updatedAt.getTime()) /
              60000,
          ),
        );

      throw new RouteError(
        `최근 상태 변경 후 ${elapsedMinutes}분이 지났습니다. ${STALE_MINUTES}분 이상 상태가 바뀌지 않은 작업만 복구할 수 있습니다.`,
        409,
      );
    }

    const recoveryPlan =
      getRecoveryPlan(
        latestRun,
      );

    if (!recoveryPlan) {
      throw new RouteError(
        `현재 상태(${latestRun.status} / ${latestRun.currentStep})는 멈춘 실행 잠금 상태가 아닙니다.`,
        409,
      );
    }

    const stalledMinutes =
      Math.max(
        STALE_MINUTES,
        Math.floor(
          (Date.now() -
            latestRun.updatedAt.getTime()) /
            60000,
        ),
      );

    const recoveredRun =
      await prisma.$transaction(
        async (transaction) => {
          const claimed =
            await transaction.aIBookProductionRun.updateMany({
              where: {
                id: latestRun.id,
                status:
                  latestRun.status,
                currentStep:
                  latestRun.currentStep,
                updatedAt: {
                  lte: staleBefore,
                },
              },
              data:
                recoveryPlan.updateData,
            });

          if (
            claimed.count !==
            1
          ) {
            throw new RouteError(
              "다른 작업에서 AI 제작 상태를 먼저 변경했습니다. 화면을 새로고침해 주세요.",
              409,
            );
          }

          const result =
            await transaction.aIBookProductionRun.findUnique({
              where: {
                id: latestRun.id,
              },
              select: {
                id: true,
                attempt: true,
                status: true,
                currentStep: true,
                requiresHumanReview:
                  true,
                humanReviewReason:
                  true,
                finalPdfUrl: true,
                startedAt: true,
                completedAt: true,
                updatedAt: true,
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
        orderId: order.id,
        actorId: admin.id,
        actorName: admin.name,
        actorEmail:
          admin.email,
        source: "ADMIN",
        category:
          "PRODUCTION",
        action:
          recoveryPlan.action,
        summary:
          `AI 자동 제작 ${latestRun.attempt}차 작업이 ${stalledMinutes}분 동안 멈춰 있어 실행 잠금을 복구했습니다.`,
        before: {
          aiProductionRunId:
            latestRun.id,
          attempt:
            latestRun.attempt,
          status:
            latestRun.status,
          currentStep:
            latestRun.currentStep,
          updatedAt:
            latestRun.updatedAt,
          finalPdfUrl:
            latestRun.finalPdfUrl,
          productionStage:
            order.productionStage,
          stalledMinutes,
          recoveryType:
            recoveryPlan.recoveryType,
        },
        after: {
          aiProductionRunId:
            recoveredRun.id,
          attempt:
            recoveredRun.attempt,
          status:
            recoveredRun.status,
          currentStep:
            recoveredRun.currentStep,
          updatedAt:
            recoveredRun.updatedAt,
          finalPdfUrl:
            recoveredRun.finalPdfUrl,
          resumedExistingRun:
            true,
          recoveryType:
            recoveryPlan.recoveryType,
        },
        isCustomerVisible:
          false,
      });
    } catch (auditError) {
      console.error(
        "[ADMIN_AI_STALLED_RECOVERY_AUDIT_ERROR]",
        auditError,
      );
    }

    revalidateRecoveryPaths(
      order.id,
      order.bookId,
    );

    return NextResponse.json({
      ok: true,
      message:
        recoveryPlan.message,
      staleMinutes:
        stalledMinutes,
      recoveryType:
        recoveryPlan.recoveryType,
      run:
        recoveredRun,
    });
  } catch (error) {
    return handleRouteError(
      error,
      "[ADMIN_AI_STALLED_RECOVERY_ERROR]",
    );
  }
}

function getRecoveryPlan(
  run: StalledRun,
): RecoveryPlan | null {
  if (
    run.status ===
      AIBookProductionStatus.RUNNING &&
    run.currentStep ===
      AIBookProductionStep.MATERIAL_ANALYSIS
  ) {
    return {
      recoveryType:
        "MATERIAL_ANALYSIS_LOCK",
      action:
        "AI_STALLED_MATERIAL_ANALYSIS_RECOVERED",
      message:
        "멈춘 자료 분석 실행 잠금을 해제했습니다. 자료 분석 단계부터 자동 제작을 다시 진행할 수 있습니다.",
      updateData: {
        status:
          AIBookProductionStatus.QUEUED,
      },
    };
  }

  if (
    run.status ===
      AIBookProductionStatus.RUNNING &&
    run.currentStep ===
      AIBookProductionStep.MANUSCRIPT_EDITING &&
    isGeneratingMarker(
      run.manuscriptData,
    )
  ) {
    return {
      recoveryType:
        "MANUSCRIPT_GENERATING_LOCK",
      action:
        "AI_STALLED_MANUSCRIPT_RECOVERED",
      message:
        "멈춘 원고 제작 실행 잠금을 해제했습니다. 원고 제작 단계부터 자동 제작을 다시 진행할 수 있습니다.",
      updateData: {
        manuscriptData:
          Prisma.DbNull,
      },
    };
  }

  if (
    run.status ===
      AIBookProductionStatus.QUEUED &&
    run.currentStep ===
      AIBookProductionStep.FINAL_PDF &&
    !run.finalPdfUrl
  ) {
    return {
      recoveryType:
        "FINAL_PDF_LOCK",
      action:
        "AI_STALLED_FINAL_PDF_RECOVERED",
      message:
        "멈춘 최종 PDF 실행 잠금을 해제했습니다. 최종 PDF 생성 단계부터 다시 진행할 수 있습니다.",
      updateData: {
        status:
          AIBookProductionStatus.RUNNING,
      },
    };
  }

  return null;
}

function isGeneratingMarker(
  value: Prisma.JsonValue,
) {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const record =
    value as Record<
      string,
      unknown
    >;

  return (
    record.status ===
      "GENERATING" &&
    typeof record.claimedAt ===
      "string"
  );
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
    user.role !== "ADMIN"
  ) {
    throw new RouteError(
      "관리자만 멈춘 AI 제작 작업을 복구할 수 있습니다.",
      403,
    );
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
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

function revalidateRecoveryPaths(
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