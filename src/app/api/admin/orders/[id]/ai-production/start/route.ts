import { auth } from "@/auth";
import { buildAIBookSourceSnapshot } from "@/lib/ai-book-production-source";
import { recordBookOrderAudit } from "@/lib/order-audit";
import { prisma } from "@/lib/prisma";
import {
  AIBookProductionStatus,
  AIBookProductionStep,
  BookOrderStatus,
  Prisma,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  NextResponse,
} from "next/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const ACTIVE_STATUSES: AIBookProductionStatus[] = [
  AIBookProductionStatus.QUEUED,
  AIBookProductionStatus.RUNNING,
  AIBookProductionStatus.NEEDS_INPUT,
  AIBookProductionStatus.READY_FOR_APPROVAL,
];

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
        "관리자만 AI 자동 제작을 시작할 수 있습니다.",
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
      order.status !==
      BookOrderStatus.PAID
    ) {
      return createErrorResponse(
        "결제가 완료된 주문만 AI 자동 제작을 시작할 수 있습니다.",
        409,
      );
    }

    const activeRun =
      await prisma.aIBookProductionRun.findFirst({
        where: {
          bookId:
            order.bookId,
          status: {
            in: ACTIVE_STATUSES,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          status: true,
          currentStep: true,
          attempt: true,
        },
      });

    if (activeRun) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "현재 진행 중이거나 승인 대기 중인 AI 제작 작업이 이미 있습니다.",
          run: activeRun,
        },
        {
          status: 409,
        },
      );
    }

    const snapshot =
      await buildAIBookSourceSnapshot({
        bookId:
          order.bookId,
        authorId:
          order.authorId,
      });

    const usableMaterialCount =
      snapshot.items.filter(
        (item) =>
          item.hasPhoto ||
          item.hasStory,
      ).length;

    const needsInput =
      usableMaterialCount === 0;

    const issueInputs:
      Prisma.AIBookProductionIssueCreateWithoutRunInput[] =
        snapshot.sourceAlerts.map(
          (alert) => ({
            category:
              "SOURCE_MATERIAL",
            code:
              alert.code,
            severity:
              alert.severity,
            message:
              alert.message,
            sourceRef:
              alert.sourceRef,
            suggestedAction:
              getSuggestedAction(
                alert.code,
              ),
            details: {
              detectedAt:
                snapshot.generatedAt,
            },
          }),
        );

    if (needsInput) {
      issueInputs.push({
        category:
          "SOURCE_MATERIAL",
        code:
          "NO_USABLE_SOURCE_MATERIAL",
        severity:
          "BLOCKER",
        message:
          "AI가 책을 제작할 수 있는 사진이나 이야기 자료가 없습니다.",
        suggestedAction:
          "사진 또는 이야기를 책에 연결한 뒤 AI 제작을 다시 시작해 주세요.",
        details: {
          totalSourceCount:
            snapshot.counts.total,
          photoCount:
            snapshot.counts.photos,
          storyCount:
            snapshot.counts.itemsWithStory,
        },
      });
    }

    const latestRun =
      await prisma.aIBookProductionRun.findFirst({
        where: {
          bookId:
            order.bookId,
        },
        orderBy: {
          attempt: "desc",
        },
        select: {
          attempt: true,
        },
      });

    const nextAttempt =
      (latestRun?.attempt ||
        0) + 1;

    const initialStatus =
      needsInput
        ? AIBookProductionStatus.NEEDS_INPUT
        : AIBookProductionStatus.QUEUED;

    const now =
      new Date();

    const run =
      await prisma.aIBookProductionRun.create({
        data: {
          bookId:
            order.bookId,
          orderId:
            order.id,
          authorId:
            order.authorId,
          mode:
            "AUTOMATIC",
          status:
            initialStatus,
          currentStep:
            AIBookProductionStep.MATERIAL_ANALYSIS,
          attempt:
            nextAttempt,
          sourceSnapshot:
            snapshot as Prisma.InputJsonValue,
          requiresHumanReview:
            needsInput,
          humanReviewReason:
            needsInput
              ? "AI 제작에 사용할 원본 자료가 없습니다."
              : null,
          startedAt:
            needsInput
              ? null
              : now,
          issues:
            issueInputs.length >
            0
              ? {
                  create:
                    issueInputs,
                }
              : undefined,
        },
        select: {
          id: true,
          bookId: true,
          orderId: true,
          mode: true,
          status: true,
          currentStep: true,
          attempt: true,
          requiresHumanReview:
            true,
          humanReviewReason:
            true,
          createdAt: true,
          _count: {
            select: {
              issues: true,
            },
          },
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
        needsInput
          ? "AI_PRODUCTION_NEEDS_INPUT"
          : "AI_PRODUCTION_STARTED",
      summary:
        needsInput
          ? "AI 자동 제작을 시작했으나 사용할 원본 자료가 없어 입력 대기로 전환했습니다."
          : `AI 자동 제작 ${nextAttempt}차 작업을 시작했습니다.`,
      before: {
        productionStage:
          order.productionStage,
      },
      after: {
        aiProductionRunId:
          run.id,
        aiProductionStatus:
          run.status,
        aiProductionStep:
          run.currentStep,
        aiProductionAttempt:
          run.attempt,
        sourceCounts:
          snapshot.counts,
        issueCount:
          run._count.issues,
      },
      isCustomerVisible:
        false,
    });

    revalidatePath(
      "/admin",
    );

    revalidatePath(
      "/admin/orders",
    );

    revalidatePath(
      `/admin/orders/${order.id}`,
    );

    revalidatePath(
      "/admin/order-audit",
    );

    revalidatePath(
      "/dashboard/orders",
    );

    revalidatePath(
      `/dashboard/orders/${order.id}`,
    );

    return NextResponse.json({
      ok: true,
      message:
        needsInput
          ? "AI 제작 작업은 생성됐지만 사용할 자료가 없어 입력 대기 상태입니다."
          : "AI 자동 제작 작업이 생성되었습니다.",
      run,
      sourceCounts:
        snapshot.counts,
    });
  } catch (error) {
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return createErrorResponse(
        "같은 책의 AI 제작 회차가 이미 생성되었습니다. 화면을 새로고침한 뒤 다시 확인해 주세요.",
        409,
      );
    }

    console.error(
      "[ADMIN_AI_BOOK_PRODUCTION_START_ERROR]",
      error,
    );

    return createErrorResponse(
      "AI 자동 제작 시작 중 오류가 발생했습니다.",
      500,
    );
  }
}

function getSuggestedAction(
  code: string,
) {
  const actions:
    Record<string, string> = {
      PHOTO_FILE_MISSING:
        "사진 파일을 다시 등록하거나 해당 자료를 책에서 제외해 주세요.",

      EMPTY_SOURCE_ITEM:
        "사진 또는 이야기 내용을 추가하거나 책에서 제외해 주세요.",

      PHOTO_STORY_MISSING:
        "AI 사진 분석으로 설명을 생성하거나 사용자가 이야기를 추가할 수 있습니다.",

      DATE_MISSING:
        "정확한 날짜가 필요하면 사용자 확인 대상으로 분류하고, 불필요하면 연도 미상으로 유지하세요.",
    };

  return (
    actions[code] ||
    "자료 내용을 확인해 주세요."
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