import { auth } from "@/auth";
import { generateAIBookLayout } from "@/lib/ai-book-production-layout";
import {
  generateAIBookManuscript,
  type AIBookManuscriptResult,
  type AIBookOutlineData,
  type AIBookPhotoSelectionData,
} from "@/lib/ai-book-production-manuscript";
import { finalizeAIBookPhotoSelection } from "@/lib/ai-book-production-photo-selection";
import { generateAIBookQualityReport } from "@/lib/ai-book-production-quality";
import type { AIBookSourceSnapshot } from "@/lib/ai-book-production-source";
import { recordBookOrderAudit } from "@/lib/order-audit";
import { prisma } from "@/lib/prisma";
import {
  AIBookProductionIssueSeverity,
  AIBookProductionIssueStatus,
  AIBookProductionStatus,
  AIBookProductionStep,
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

type ProductionResult = {
  manuscript: AIBookManuscriptResult;
  finalizedPhotoSelection: ReturnType<
    typeof finalizeAIBookPhotoSelection
  >;
  layoutPlan: ReturnType<
    typeof generateAIBookLayout
  >;
  qualityReport: ReturnType<
    typeof generateAIBookQualityReport
  >;
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
        "관리자만 AI 원고 편집을 실행할 수 있습니다.",
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
        "결제가 완료된 주문만 AI 원고 편집을 실행할 수 있습니다.",
        409,
      );
    }

    const run =
      await prisma.aIBookProductionRun.findFirst({
        where: {
          orderId:
            order.id,
          status:
            AIBookProductionStatus.RUNNING,
          currentStep:
            AIBookProductionStep.MANUSCRIPT_EDITING,
        },
        orderBy: {
          createdAt:
            "desc",
        },
        select: {
          id: true,
          attempt: true,
          sourceSnapshot:
            true,
          outlineData:
            true,
          photoSelectionData:
            true,
          manuscriptData:
            true,
          requiresHumanReview:
            true,
          humanReviewReason:
            true,
        },
      });

    if (!run) {
      return createErrorResponse(
        "원고 편집 단계의 AI 제작 작업이 없습니다.",
        409,
      );
    }

    if (
      run.manuscriptData !==
      null
    ) {
      return createErrorResponse(
        "현재 AI 원고가 이미 생성됐거나 다른 작업에서 생성 중입니다.",
        409,
      );
    }

    const generatingMarker = {
      status:
        "GENERATING",
      claimedAt:
        new Date().toISOString(),
      claimedBy:
        adminId,
    };

    const claimResult =
      await prisma.aIBookProductionRun.updateMany({
        where: {
          id:
            run.id,
          status:
            AIBookProductionStatus.RUNNING,
          currentStep:
            AIBookProductionStep.MANUSCRIPT_EDITING,
          manuscriptData: {
            equals:
              Prisma.DbNull,
          },
        },
        data: {
          manuscriptData:
            generatingMarker as Prisma.InputJsonValue,
        },
      });

    if (
      claimResult.count !==
      1
    ) {
      return createErrorResponse(
        "다른 작업에서 이미 AI 원고 편집을 시작했습니다.",
        409,
      );
    }

    let productionResult:
      ProductionResult | null =
        null;

    try {
      const snapshot =
        readSourceSnapshot(
          run.sourceSnapshot,
        );

      const outline =
        readOutlineData(
          run.outlineData,
        );

      const photoSelection =
        readPhotoSelectionData(
          run.photoSelectionData,
        );

      const manuscript =
        await generateAIBookManuscript({
          snapshot,
          outline,
          photoSelection,
        });

      const finalizedPhotoSelection =
        finalizeAIBookPhotoSelection({
          snapshot,
          initialSelection:
            photoSelection,
          manuscript,
        });

      const layoutPlan =
        generateAIBookLayout({
          snapshot,
          manuscript,
          photoSelection:
            finalizedPhotoSelection,
        });

      const qualityReport =
        generateAIBookQualityReport({
          snapshot,
          manuscript,
          photoSelection:
            finalizedPhotoSelection,
          layout:
            layoutPlan,
        });

      productionResult = {
        manuscript,
        finalizedPhotoSelection,
        layoutPlan,
        qualityReport,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "AI 원고 편집 중 알 수 없는 오류가 발생했습니다.";

      await prisma.aIBookProductionRun.update({
        where: {
          id:
            run.id,
        },
        data: {
          status:
            AIBookProductionStatus.FAILED,
          currentStep:
            AIBookProductionStep.MANUSCRIPT_EDITING,
          manuscriptData:
            Prisma.DbNull,
          requiresHumanReview:
            true,
          humanReviewReason:
            appendReason(
              run.humanReviewReason,
              `AI 원고 편집 실패: ${errorMessage}`,
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
          "AI_MANUSCRIPT_EDITING_FAILED",
        summary:
          `AI 자동 제작 ${run.attempt}차 원고 편집에 실패했습니다.`,
        before: {
          aiProductionRunId:
            run.id,
          status:
            "RUNNING",
          currentStep:
            "MANUSCRIPT_EDITING",
        },
        after: {
          aiProductionRunId:
            run.id,
          status:
            "FAILED",
          currentStep:
            "MANUSCRIPT_EDITING",
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
        "[ADMIN_AI_BOOK_MANUSCRIPT_ERROR]",
        error,
      );

      return createErrorResponse(
        errorMessage,
        500,
      );
    }

    if (!productionResult) {
      return createErrorResponse(
        "AI 제작 결과를 확인할 수 없습니다.",
        500,
      );
    }

    const {
      manuscript,
      finalizedPhotoSelection,
      layoutPlan,
      qualityReport,
    } = productionResult;

    const generatedIssues = [
      ...manuscript.issues.map(
        (issue) => ({
          ...issue,
          storageCategory:
            "AI_MANUSCRIPT_EDITING",
        }),
      ),

      ...finalizedPhotoSelection.issues.map(
        (issue) => ({
          ...issue,
          storageCategory:
            "AI_PHOTO_SELECTION",
        }),
      ),

      ...layoutPlan.issues.map(
        (issue) => ({
          ...issue,
          storageCategory:
            "AI_LAYOUT_GENERATION",
        }),
      ),

      ...qualityReport.issues
        .filter(
          (issue) =>
            issue.origin ===
            "QUALITY_CHECK",
        )
        .map(
          (issue) => ({
            ...issue,
            storageCategory:
              "AI_QUALITY_CHECK",
          }),
        ),
    ];

    const issueInputs:
      Prisma.AIBookProductionIssueCreateManyInput[] =
        generatedIssues.map(
          (issue) => ({
            runId:
              run.id,

            category:
              issue.storageCategory,

            code:
              normalizeRequiredText(
                issue.code,
                "AI_PRODUCTION_REVIEW",
                120,
              ),

            severity:
              getIssueSeverity(
                issue.severity,
              ),

            status:
              AIBookProductionIssueStatus.OPEN,

            message:
              normalizeRequiredText(
                issue.message,
                "AI 제작 결과를 확인해 주세요.",
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
                issue.storageCategory,
            } as Prisma.InputJsonValue,
          }),
        );

    const reviewIssues =
      generatedIssues.filter(
        (issue) =>
          issue.requiresHumanReview ||
          issue.severity ===
            "BLOCKER",
      );

    const qualityBlocked =
      qualityReport.status ===
      "BLOCKED";

    const nextStatus =
      qualityBlocked
        ? AIBookProductionStatus.NEEDS_INPUT
        : AIBookProductionStatus.RUNNING;

    const nextStep =
      qualityBlocked
        ? AIBookProductionStep.QUALITY_CHECK
        : AIBookProductionStep.FINAL_PDF;

    const reviewRequired =
      run.requiresHumanReview ||
      manuscript.summary
        .reviewRequired ||
      qualityReport.summary
        .reviewRequired ||
      reviewIssues.length >
        0;

    const reviewReason =
      reviewRequired
        ? appendReason(
            run.humanReviewReason,
            createReviewReason(
              qualityReport.summary
                .reviewSummary ||
                manuscript.summary
                  .reviewSummary,
              reviewIssues.length,
            ),
          )
        : run.humanReviewReason;

    const manuscriptData = {
      version:
        1,
      generatedAt:
        new Date().toISOString(),
      generatedBy:
        "OPENAI",
      result:
        manuscript,
    };

    const updatedRun =
      await prisma.$transaction(
        async (
          transaction,
        ) => {
          await transaction.aIBookProductionIssue.deleteMany({
            where: {
              runId:
                run.id,
              category: {
                in: [
                  "AI_MANUSCRIPT_EDITING",
                  "AI_PHOTO_SELECTION",
                  "AI_LAYOUT_GENERATION",
                  "AI_QUALITY_CHECK",
                ],
              },
            },
          });

          if (
            issueInputs.length >
            0
          ) {
            await transaction.aIBookProductionIssue.createMany({
              data:
                issueInputs,
            });
          }

          return transaction.aIBookProductionRun.update({
            where: {
              id:
                run.id,
            },
            data: {
              manuscriptData:
                manuscriptData as Prisma.InputJsonValue,

              photoSelectionData:
                finalizedPhotoSelection as Prisma.InputJsonValue,

              layoutData:
                layoutPlan as Prisma.InputJsonValue,

              qualityReport:
                qualityReport as Prisma.InputJsonValue,

              status:
                nextStatus,

              currentStep:
                nextStep,

              requiresHumanReview:
                reviewRequired,

              humanReviewReason:
                reviewReason,
            },
            select: {
              id: true,
              attempt:
                true,
              status:
                true,
              currentStep:
                true,
              requiresHumanReview:
                true,
              humanReviewReason:
                true,
              updatedAt:
                true,
            },
          });
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
        qualityBlocked
          ? "AI_QUALITY_CHECK_BLOCKED"
          : "AI_QUALITY_CHECK_COMPLETED",
      summary:
        qualityBlocked
          ? `AI 자동 제작 ${run.attempt}차 품질 검수에서 차단 항목이 발견됐습니다.`
          : `AI 자동 제작 ${run.attempt}차 원고, 사진, 페이지 구성과 품질 검수를 완료했습니다.`,
      before: {
        aiProductionRunId:
          run.id,
        status:
          "RUNNING",
        currentStep:
          "MANUSCRIPT_EDITING",
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

        chapterCount:
          manuscript.summary
            .chapterCount,

        sectionCount:
          manuscript.summary
            .sectionCount,

        usedSourceCount:
          manuscript.summary
            .usedSourceCount,

        usedPhotoCount:
          manuscript.summary
            .usedPhotoCount,

        finalIncludePhotoCount:
          finalizedPhotoSelection.summary
            .includePhotoCount,

        finalReservePhotoCount:
          finalizedPhotoSelection.summary
            .reservePhotoCount,

        finalExcludedPhotoCount:
          finalizedPhotoSelection.summary
            .excludedPhotoCount,

        photoConflictCount:
          finalizedPhotoSelection.summary
            .conflictCount,

        layoutTotalPageCount:
          layoutPlan.summary
            .totalPageCount,

        layoutNumberedPageCount:
          layoutPlan.summary
            .numberedPageCount,

        layoutTextPageCount:
          layoutPlan.summary
            .textPageCount,

        layoutPhotoPageCount:
          layoutPlan.summary
            .photoPageCount,

        layoutBlankPageCount:
          layoutPlan.summary
            .blankPageCount,

        layoutTargetPageCount:
          layoutPlan.summary
            .targetPageCount,

        layoutPageDifference:
          layoutPlan.summary
            .pageDifference,

        qualityStatus:
          qualityReport.status,

        qualityTotalCheckCount:
          qualityReport.summary
            .totalCheckCount,

        qualityPassCount:
          qualityReport.summary
            .passCount,

        qualityWarningCount:
          qualityReport.summary
            .warningCount,

        qualityBlockerCount:
          qualityReport.summary
            .blockerCount,

        qualityOpenIssueCount:
          qualityReport.summary
            .openIssueCount,

        qualitySourceCoveragePercent:
          qualityReport.summary
            .sourceCoveragePercent,

        qualityPhotoUsagePercent:
          qualityReport.summary
            .photoUsagePercent,

        excludedSourceCount:
          manuscript.summary
            .excludedSourceCount,

        estimatedKoreanCharacterCount:
          manuscript.summary
            .estimatedKoreanCharacterCount,

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
      ok:
        true,

      message:
        qualityBlocked
          ? "AI 원고 편집과 페이지 구성을 완료했지만 품질 검수 차단 항목이 발견됐습니다."
          : "AI 원고 편집, 사진 선별, 페이지 구성과 품질 검수를 완료했습니다. 최종 PDF 단계로 이동했습니다.",

      run:
        updatedRun,

      result: {
        title:
          manuscript.book.title,

        chapterCount:
          manuscript.summary
            .chapterCount,

        sectionCount:
          manuscript.summary
            .sectionCount,

        usedSourceCount:
          manuscript.summary
            .usedSourceCount,

        usedPhotoCount:
          manuscript.summary
            .usedPhotoCount,

        excludedSourceCount:
          manuscript.summary
            .excludedSourceCount,

        estimatedKoreanCharacterCount:
          manuscript.summary
            .estimatedKoreanCharacterCount,

        reviewRequired:
          updatedRun.requiresHumanReview,

        totalPageCount:
          layoutPlan.summary
            .totalPageCount,

        textPageCount:
          layoutPlan.summary
            .textPageCount,

        photoPageCount:
          layoutPlan.summary
            .photoPageCount,

        blankPageCount:
          layoutPlan.summary
            .blankPageCount,

        targetPageCount:
          layoutPlan.summary
            .targetPageCount,

        pageDifference:
          layoutPlan.summary
            .pageDifference,

        qualityStatus:
          qualityReport.status,

        qualityCheckCount:
          qualityReport.summary
            .totalCheckCount,

        qualityPassCount:
          qualityReport.summary
            .passCount,

        qualityWarningCount:
          qualityReport.summary
            .warningCount,

        qualityBlockerCount:
          qualityReport.summary
            .blockerCount,

        sourceCoveragePercent:
          qualityReport.summary
            .sourceCoveragePercent,

        photoUsagePercent:
          qualityReport.summary
            .photoUsagePercent,

        issueCount:
          issueInputs.length,
      },
    });
  } catch (error) {
    console.error(
      "[ADMIN_AI_BOOK_MANUSCRIPT_ROUTE_ERROR]",
      error,
    );

    return createErrorResponse(
      "AI 원고 편집 실행 중 오류가 발생했습니다.",
      500,
    );
  }
}

function readSourceSnapshot(
  value:
    Prisma.JsonValue,
): AIBookSourceSnapshot {
  if (
    !isRecord(
      value,
    ) ||
    value.version !==
      1 ||
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

function readOutlineData(
  value:
    | Prisma.JsonValue
    | null,
): AIBookOutlineData {
  if (
    !isRecord(
      value,
    ) ||
    !isRecord(
      value.bookDirection,
    ) ||
    !Array.isArray(
      value.chronology,
    ) ||
    !Array.isArray(
      value.chapters,
    ) ||
    value.chapters.length ===
      0
  ) {
    throw new Error(
      "저장된 AI 목차 정보의 형식이 올바르지 않습니다.",
    );
  }

  return value as unknown as
    AIBookOutlineData;
}

function readPhotoSelectionData(
  value:
    | Prisma.JsonValue
    | null,
): AIBookPhotoSelectionData {
  if (
    !isRecord(
      value,
    ) ||
    !Array.isArray(
      value.photoPlan,
    )
  ) {
    throw new Error(
      "저장된 AI 사진 선별 정보의 형식이 올바르지 않습니다.",
    );
  }

  return value as unknown as
    AIBookPhotoSelectionData;
}

function getIssueSeverity(
  value:
    | "INFO"
    | "WARNING"
    | "BLOCKER",
) {
  if (
    value ===
    "BLOCKER"
  ) {
    return AIBookProductionIssueSeverity.BLOCKER;
  }

  if (
    value ===
    "WARNING"
  ) {
    return AIBookProductionIssueSeverity.WARNING;
  }

  return AIBookProductionIssueSeverity.INFO;
}

function createReviewReason(
  summary:
    string,
  issueCount:
    number,
) {
  const cleanSummary =
    summary.trim();

  if (cleanSummary) {
    return `최종 승인 시 AI 제작 확인: ${cleanSummary}`;
  }

  if (
    issueCount >
    0
  ) {
    return `최종 승인 시 AI 제작 검토 항목 ${issueCount}건을 확인해야 합니다.`;
  }

  return "최종 승인 시 AI 제작 결과 전체를 확인해야 합니다.";
}

function appendReason(
  current:
    | string
    | null,
  next:
    string,
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
  value:
    string,
  fallback:
    string,
  maxLength:
    number,
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
  value:
    string,
  maxLength:
    number,
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
  orderRecordId:
    string,
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
  value:
    unknown,
): value is Record<
  string,
  unknown
> {
  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  );
}

function createErrorResponse(
  message:
    string,
  status:
    number,
) {
  return NextResponse.json(
    {
      ok:
        false,
      message,
    },
    {
      status,
    },
  );
}