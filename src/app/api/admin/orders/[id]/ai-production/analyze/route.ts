import { auth } from "@/auth";
import type { AIBookSourceSnapshot } from "@/lib/ai-book-production-source";
import { generateAIBookMaterialAnalysis } from "@/lib/ai-book-production-outline";
import { recordBookOrderAudit } from "@/lib/order-audit";
import { prisma } from "@/lib/prisma";
import {
  AIBookProductionStatus,
  AIBookProductionStep,
  BookProductionStage,
  BookStatus,
  Prisma,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  _request: Request,
  context: RouteContext,
) {
  try {
    const session =
      await auth();

    const adminId =
      session?.user?.id;

    if (!adminId) {
      return createErrorResponse(
        "로그인이 필요합니다.",
        401,
      );
    }

    const admin =
      await prisma.user.findUnique({
        where: {
          id: adminId,
        },
        select: {
          role: true,
        },
      });

    if (
      admin?.role !== "ADMIN"
    ) {
      return createErrorResponse(
        "관리자만 AI 자료 분석을 실행할 수 있습니다.",
        403,
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

    const order =
      await prisma.bookOrder.findUnique({
        where: {
          id: orderRecordId,
        },
        select: {
          id: true,
          orderId: true,
          bookId: true,
          authorId: true,
          status: true,
          productionStage: true,
          book: {
            select: {
              title: true,
              status: true,
            },
          },
        },
      });

    if (!order) {
      return createErrorResponse(
        "주문 정보를 찾을 수 없습니다.",
        404,
      );
    }

    if (
      String(order.status) !==
      "PAID"
    ) {
      return createErrorResponse(
        "결제가 완료된 주문만 AI 자료 분석을 실행할 수 있습니다.",
        409,
      );
    }

    const queuedRun =
      await prisma.aIBookProductionRun.findFirst({
        where: {
          orderId:
            order.id,
          status:
            AIBookProductionStatus.QUEUED,
          currentStep:
            AIBookProductionStep.MATERIAL_ANALYSIS,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          attempt: true,
          sourceSnapshot: true,
          startedAt: true,
          requiresHumanReview:
            true,
          humanReviewReason:
            true,
        },
      });

    if (!queuedRun) {
      return createErrorResponse(
        "실행할 수 있는 대기 상태의 AI 제작 작업이 없습니다.",
        409,
      );
    }

    const claimedAt =
      new Date();

    const claimResult =
      await prisma.aIBookProductionRun.updateMany({
        where: {
          id:
            queuedRun.id,
          status:
            AIBookProductionStatus.QUEUED,
          currentStep:
            AIBookProductionStep.MATERIAL_ANALYSIS,
        },
        data: {
          status:
            AIBookProductionStatus.RUNNING,
          startedAt:
            queuedRun.startedAt ||
            claimedAt,
        },
      });

    if (
      claimResult.count !== 1
    ) {
      return createErrorResponse(
        "다른 작업에서 이미 AI 자료 분석을 시작했습니다.",
        409,
      );
    }

    const snapshot =
      readSourceSnapshot(
        queuedRun.sourceSnapshot,
      );

    let analysis:
      Awaited<
        ReturnType<
          typeof generateAIBookMaterialAnalysis
        >
      >;

    try {
      analysis =
        await generateAIBookMaterialAnalysis(
          snapshot,
        );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "AI 자료 분석 중 알 수 없는 오류가 발생했습니다.";

      await prisma.aIBookProductionRun.update({
        where: {
          id:
            queuedRun.id,
        },
        data: {
          status:
            AIBookProductionStatus.FAILED,
          currentStep:
            AIBookProductionStep.MATERIAL_ANALYSIS,
          requiresHumanReview:
            true,
          humanReviewReason:
            appendReason(
              queuedRun.humanReviewReason,
              `AI 자료 분석 실패: ${errorMessage}`,
            ),
        },
      });

      await recordBookOrderAudit({
        orderId:
          order.id,
        actorId:
          adminId,
        source:
          "ADMIN",
        category:
          "PRODUCTION",
        action:
          "AI_MATERIAL_ANALYSIS_FAILED",
        summary:
          `AI 자동 제작 ${queuedRun.attempt}차 자료 분석에 실패했습니다.`,
        before: {
          aiProductionRunId:
            queuedRun.id,
          status:
            "RUNNING",
          currentStep:
            "MATERIAL_ANALYSIS",
        },
        after: {
          aiProductionRunId:
            queuedRun.id,
          status:
            "FAILED",
          currentStep:
            "MATERIAL_ANALYSIS",
          error:
            errorMessage,
        },
        isCustomerVisible:
          false,
      });

      revalidateAIProductionPaths(
        order.id,
      );

      console.error(
        "[ADMIN_AI_BOOK_MATERIAL_ANALYSIS_ERROR]",
        error,
      );

      return createErrorResponse(
        errorMessage,
        500,
      );
    }

    const analysisIssues =
      analysis.issues.map(
        (issue) => ({
          runId:
            queuedRun.id,
          category:
            "AI_MATERIAL_ANALYSIS",
          code:
            normalizeRequiredText(
              issue.code,
              "AI_ANALYSIS_REVIEW",
              120,
            ),
          severity:
            issue.severity,
          status:
            "OPEN" as const,
          message:
            normalizeRequiredText(
              issue.message,
              "AI 분석 결과를 확인해 주세요.",
              2000,
            ),
          sourceRef:
            normalizeOptionalText(
              issue.sourceRef,
              200,
            ),
          suggestedAction:
            normalizeOptionalText(
              issue.suggestedAction,
              2000,
            ),
          confidence:
            null,
          details: {
            originalCategory:
              issue.category,
            requiresHumanReview:
              issue.requiresHumanReview,
            generatedBy:
              "AI_MATERIAL_ANALYSIS",
          } as Prisma.InputJsonValue,
        }),
      );

    const reviewIssues =
      analysis.issues.filter(
        (issue) =>
          issue.requiresHumanReview ||
          issue.severity ===
            "BLOCKER",
      );

    const reviewRequired =
      queuedRun.requiresHumanReview ||
      analysis.summary.reviewRequired ||
      reviewIssues.length >
        0;

    const reviewReason =
      reviewRequired
        ? appendReason(
            queuedRun.humanReviewReason,
            createReviewReason(
              analysis.summary.reviewSummary,
              reviewIssues.length,
            ),
          )
        : queuedRun.humanReviewReason;

    const outlineData = {
      version: 1,
      generatedAt:
        new Date().toISOString(),
      bookDirection:
        analysis.bookDirection,
      chronology:
        analysis.chronology,
      chapters:
        analysis.chapters,
      summary:
        analysis.summary,
    };

    const photoSelectionData = {
      version: 1,
      generatedAt:
        new Date().toISOString(),
      photoPlan:
        analysis.photoPlan,
      summary: {
        includePhotoCount:
          analysis.summary.includePhotoCount,
        reservePhotoCount:
          analysis.summary.reservePhotoCount,
        excludedPhotoCount:
          analysis.summary.excludedPhotoCount,
      },
    };

    const completedAt =
      new Date();

    const updatedRun =
      await prisma.$transaction(
        async (
          transaction,
        ) => {
          await transaction.aIBookProductionIssue.deleteMany({
            where: {
              runId:
                queuedRun.id,
              category:
                "AI_MATERIAL_ANALYSIS",
            },
          });

          if (
            analysisIssues.length >
            0
          ) {
            await transaction.aIBookProductionIssue.createMany({
              data:
                analysisIssues,
            });
          }

          const nextRun =
            await transaction.aIBookProductionRun.update({
              where: {
                id:
                  queuedRun.id,
              },
              data: {
                status:
                  AIBookProductionStatus.RUNNING,
                currentStep:
                  AIBookProductionStep.MANUSCRIPT_EDITING,
                outlineData:
                  outlineData as Prisma.InputJsonValue,
                photoSelectionData:
                  photoSelectionData as Prisma.InputJsonValue,
                requiresHumanReview:
                  reviewRequired,
                humanReviewReason:
                  reviewReason,
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
              },
            });

          await transaction.book.update({
            where: {
              id:
                order.bookId,
            },
            data: {
              status:
                BookStatus.IN_PRODUCTION,
            },
          });

          await transaction.bookOrder.update({
            where: {
              id:
                order.id,
            },
            data: {
              productionStage:
                BookProductionStage.REVIEWING,
              productionStageUpdatedAt:
                completedAt,
              reviewStartedAt:
                completedAt,
            },
          });

          return nextRun;
        },
      );

    await recordBookOrderAudit({
      orderId:
        order.id,
      actorId:
        adminId,
      source:
        "ADMIN",
      category:
        "PRODUCTION",
      action:
        "AI_MATERIAL_ANALYSIS_COMPLETED",
      summary:
        `AI 자동 제작 ${queuedRun.attempt}차 자료 분석과 목차 구성을 완료했습니다.`,
      before: {
        aiProductionRunId:
          queuedRun.id,
        status:
          "RUNNING",
        currentStep:
          "MATERIAL_ANALYSIS",
        productionStage:
          order.productionStage,
      },
      after: {
        aiProductionRunId:
          updatedRun.id,
        status:
          updatedRun.status,
        currentStep:
          updatedRun.currentStep,
        productionStage:
          BookProductionStage.REVIEWING,
        chapterCount:
          analysis.summary.chapterCount,
        usableSourceCount:
          analysis.summary.usableSourceCount,
        includePhotoCount:
          analysis.summary.includePhotoCount,
        reservePhotoCount:
          analysis.summary.reservePhotoCount,
        excludedPhotoCount:
          analysis.summary.excludedPhotoCount,
        reviewRequired:
          updatedRun.requiresHumanReview,
        reviewIssueCount:
          reviewIssues.length,
      },
      isCustomerVisible:
        false,
    });

    revalidateAIProductionPaths(
      order.id,
    );

    return NextResponse.json({
      ok: true,
      message:
        "AI 자료 분석과 목차 구성을 완료했습니다. 원고 자동 편집 단계로 이동했습니다.",
      run:
        updatedRun,
      result: {
        chapterCount:
          analysis.summary.chapterCount,
        usableSourceCount:
          analysis.summary.usableSourceCount,
        includePhotoCount:
          analysis.summary.includePhotoCount,
        reservePhotoCount:
          analysis.summary.reservePhotoCount,
        excludedPhotoCount:
          analysis.summary.excludedPhotoCount,
        reviewRequired:
          updatedRun.requiresHumanReview,
        issueCount:
          analysisIssues.length,
      },
    });
  } catch (error) {
    console.error(
      "[ADMIN_AI_BOOK_ANALYZE_ROUTE_ERROR]",
      error,
    );

    return createErrorResponse(
      "AI 자료 분석 실행 중 오류가 발생했습니다.",
      500,
    );
  }
}

function readSourceSnapshot(
  value: Prisma.JsonValue,
): AIBookSourceSnapshot {
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    !isRecord(
      value.book,
    ) ||
    !isRecord(
      value.counts,
    ) ||
    !Array.isArray(
      value.items,
    ) ||
    !Array.isArray(
      value.sourceAlerts,
    )
  ) {
    throw new Error(
      "저장된 AI 원본 자료 스냅샷의 형식이 올바르지 않습니다.",
    );
  }

  return value as unknown as
    AIBookSourceSnapshot;
}

function createReviewReason(
  summary: string,
  issueCount: number,
) {
  const cleanSummary =
    summary.trim();

  if (
    cleanSummary
  ) {
    return `최종 승인 시 확인: ${cleanSummary}`;
  }

  if (
    issueCount >
    0
  ) {
    return `최종 승인 시 AI 검토 필요 항목 ${issueCount}건을 확인해야 합니다.`;
  }

  return "최종 승인 시 AI 분석 결과를 확인해야 합니다.";
}

function appendReason(
  current:
    | string
    | null,
  next: string,
) {
  const cleanCurrent =
    current?.trim() ||
    "";

  const cleanNext =
    next.trim();

  if (!cleanNext) {
    return cleanCurrent ||
      null;
  }

  if (!cleanCurrent) {
    return cleanNext;
  }

  if (
    cleanCurrent.includes(
      cleanNext,
    )
  ) {
    return cleanCurrent;
  }

  return `${cleanCurrent}\n${cleanNext}`;
}

function normalizeRequiredText(
  value: string,
  fallback: string,
  maxLength: number,
) {
  const normalized =
    value.trim() ||
    fallback;

  return normalized.slice(
    0,
    maxLength,
  );
}

function normalizeOptionalText(
  value: string,
  maxLength: number,
) {
  const normalized =
    value.trim();

  return normalized
    ? normalized.slice(
        0,
        maxLength,
      )
    : null;
}

function revalidateAIProductionPaths(
  orderRecordId: string,
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
}

function isRecord(
  value: unknown,
): value is Record<
  string,
  unknown
> {
  return (
    typeof value ===
      "object" &&
    value !== null &&
    !Array.isArray(value)
  );
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