import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import {
  NextRequest,
  NextResponse,
} from 'next/server';

export const runtime = 'nodejs';

const PRODUCTION_STAGES = [
  'PREPARING',
  'MANUSCRIPT_RECEIVED',
  'REVIEWING',
  'PROOFING',
  'PROOF_SENT',
  'PROOF_APPROVED',
  'PRINT_ORDERED',
  'PRINTING',
  'SHIPPING_PREPARATION',
  'SHIPPED',
  'COMPLETED',
  'ON_HOLD',
] as const;

type ProductionStage =
  (typeof PRODUCTION_STAGES)[number];

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ProductionUpdateBody = {
  productionStage?: unknown;
  manuscriptReceivedAt?: unknown;
  reviewStartedAt?: unknown;
  proofFileUrl?: unknown;
  proofSentAt?: unknown;
  proofApprovedAt?: unknown;
  printOrderedAt?: unknown;
  printingCompletedAt?: unknown;
  recipientName?: unknown;
  recipientPhone?: unknown;
  postalCode?: unknown;
  shippingAddress1?: unknown;
  shippingAddress2?: unknown;
  shippingMemo?: unknown;
  shippingCarrier?: unknown;
  trackingNumber?: unknown;
  shippedAt?: unknown;
  completedAt?: unknown;
  productionNote?: unknown;
};

type BookOrderUpdateData = {
  productionStage?: ProductionStage;
  productionStageUpdatedAt?: Date;
  manuscriptReceivedAt?: Date | null;
  reviewStartedAt?: Date | null;
  proofFileUrl?: string | null;
  proofSentAt?: Date | null;
  proofApprovedAt?: Date | null;
  printOrderedAt?: Date | null;
  printingCompletedAt?: Date | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
  postalCode?: string | null;
  shippingAddress1?: string | null;
  shippingAddress2?: string | null;
  shippingMemo?: string | null;
  shippingCarrier?: string | null;
  trackingNumber?: string | null;
  shippedAt?: Date | null;
  completedAt?: Date | null;
  productionNote?: string | null;
};

type TextFieldKey =
  | 'proofFileUrl'
  | 'recipientName'
  | 'recipientPhone'
  | 'postalCode'
  | 'shippingAddress1'
  | 'shippingAddress2'
  | 'shippingMemo'
  | 'shippingCarrier'
  | 'trackingNumber'
  | 'productionNote';

type DateFieldKey =
  | 'manuscriptReceivedAt'
  | 'reviewStartedAt'
  | 'proofSentAt'
  | 'proofApprovedAt'
  | 'printOrderedAt'
  | 'printingCompletedAt'
  | 'shippedAt'
  | 'completedAt';

const TEXT_FIELDS: ReadonlyArray<{
  key: TextFieldKey;
  label: string;
  maxLength: number;
}> = [
  {
    key: 'proofFileUrl',
    label: '교정본 파일 주소',
    maxLength: 2000,
  },
  {
    key: 'recipientName',
    label: '수령인 이름',
    maxLength: 100,
  },
  {
    key: 'recipientPhone',
    label: '수령인 연락처',
    maxLength: 50,
  },
  {
    key: 'postalCode',
    label: '우편번호',
    maxLength: 20,
  },
  {
    key: 'shippingAddress1',
    label: '기본 배송지',
    maxLength: 300,
  },
  {
    key: 'shippingAddress2',
    label: '상세 배송지',
    maxLength: 300,
  },
  {
    key: 'shippingMemo',
    label: '배송 메모',
    maxLength: 500,
  },
  {
    key: 'shippingCarrier',
    label: '택배사',
    maxLength: 100,
  },
  {
    key: 'trackingNumber',
    label: '송장번호',
    maxLength: 100,
  },
  {
    key: 'productionNote',
    label: '관리자 제작 메모',
    maxLength: 5000,
  },
];

const DATE_FIELDS: ReadonlyArray<{
  key: DateFieldKey;
  label: string;
}> = [
  {
    key: 'manuscriptReceivedAt',
    label: '원고 접수일',
  },
  {
    key: 'reviewStartedAt',
    label: '검토 시작일',
  },
  {
    key: 'proofSentAt',
    label: '교정본 전달일',
  },
  {
    key: 'proofApprovedAt',
    label: '교정 승인일',
  },
  {
    key: 'printOrderedAt',
    label: '인쇄 발주일',
  },
  {
    key: 'printingCompletedAt',
    label: '인쇄 완료일',
  },
  {
    key: 'shippedAt',
    label: '발송일',
  },
  {
    key: 'completedAt',
    label: '제작 완료일',
  },
];

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return createErrorResponse(
        '로그인이 필요합니다.',
        401,
      );
    }

    const adminUser =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          role: true,
        },
      });

    if (adminUser?.role !== 'ADMIN') {
      return createErrorResponse(
        '관리자만 제작 정보를 변경할 수 있습니다.',
        403,
      );
    }

    const { id } = await context.params;
    const requestId = id.trim();

    if (!requestId) {
      return createErrorResponse(
        '제작 상담 신청 정보를 찾을 수 없습니다.',
        400,
      );
    }

    const body =
      (await request
        .json()
        .catch(() => null)) as
        | ProductionUpdateBody
        | null;

    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body)
    ) {
      return createErrorResponse(
        '변경할 제작 정보를 입력해 주세요.',
        400,
      );
    }

    const existingRequest =
      await prisma.bookProductionRequest.findUnique(
        {
          where: {
            id: requestId,
          },
          select: {
            id: true,
            bookId: true,
            bookOrder: {
              select: {
                id: true,
                productionStage: true,
                manuscriptReceivedAt: true,
                reviewStartedAt: true,
                proofSentAt: true,
                proofApprovedAt: true,
                printOrderedAt: true,
                printingCompletedAt: true,
                shippedAt: true,
                completedAt: true,
              },
            },
          },
        },
      );

    if (!existingRequest) {
      return createErrorResponse(
        '제작 상담 신청 정보를 찾을 수 없습니다.',
        404,
      );
    }

    if (!existingRequest.bookOrder) {
      return createErrorResponse(
        '먼저 제작 견적과 결제 주문을 등록해 주세요.',
        409,
      );
    }

    const updateData: BookOrderUpdateData =
      {};

    const now = new Date();

    let nextStage =
      existingRequest.bookOrder
        .productionStage as ProductionStage;

    let stageChanged = false;

    if (
      body.productionStage !== undefined
    ) {
      if (
        !isProductionStage(
          body.productionStage,
        )
      ) {
        return createErrorResponse(
          '변경할 수 없는 제작 단계입니다.',
          400,
        );
      }

      nextStage = body.productionStage;

      stageChanged =
        nextStage !==
        existingRequest.bookOrder
          .productionStage;

      if (stageChanged) {
        updateData.productionStage =
          nextStage;

        updateData.productionStageUpdatedAt =
          now;
      }
    }

    for (const field of TEXT_FIELDS) {
      const parsed = parseOptionalText(
        body[field.key],
        field.label,
        field.maxLength,
      );

      if (!parsed.ok) {
        return createErrorResponse(
          parsed.message,
          400,
        );
      }

      if (
        field.key === 'proofFileUrl' &&
        typeof parsed.value === 'string' &&
        !isAllowedFileUrl(parsed.value)
      ) {
        return createErrorResponse(
          '교정본 파일 주소는 http, https 또는 사이트 내부 주소만 사용할 수 있습니다.',
          400,
        );
      }

      if (parsed.value !== undefined) {
        updateData[field.key] =
          parsed.value;
      }
    }

    for (const field of DATE_FIELDS) {
      const parsed = parseOptionalDate(
        body[field.key],
        field.label,
      );

      if (!parsed.ok) {
        return createErrorResponse(
          parsed.message,
          400,
        );
      }

      if (parsed.value !== undefined) {
        updateData[field.key] =
          parsed.value;
      }
    }

    if (stageChanged) {
      applyAutomaticStageDate({
        stage: nextStage,
        now,
        updateData,
        existingOrder:
          existingRequest.bookOrder,
      });
    }

    if (
      Object.keys(updateData).length === 0
    ) {
      return createErrorResponse(
        '변경된 제작 정보가 없습니다.',
        400,
      );
    }

    const updatedOrder =
      await prisma.bookOrder.update({
        where: {
          id: existingRequest.bookOrder.id,
        },
        data: updateData,
        select: {
          id: true,
          productionRequestId: true,
          bookId: true,
          orderId: true,
          status: true,
          productionStage: true,
          productionStageUpdatedAt: true,
          manuscriptReceivedAt: true,
          reviewStartedAt: true,
          proofFileUrl: true,
          proofSentAt: true,
          proofApprovedAt: true,
          printOrderedAt: true,
          printingCompletedAt: true,
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

    revalidatePath(
      '/admin/production-requests',
    );

    revalidatePath(
      `/dashboard/library/${existingRequest.bookId}`,
    );

    return NextResponse.json({
      ok: true,
      order: updatedOrder,
      message:
        stageChanged
          ? `제작 단계를 "${getProductionStageLabel(
              updatedOrder.productionStage,
            )}"로 변경했습니다.`
          : '제작 정보를 저장했습니다.',
    });
  } catch (error) {
    console.error(
      '[ADMIN_BOOK_PRODUCTION_UPDATE_ERROR]',
      error,
    );

    return createErrorResponse(
      '제작 정보 저장 중 오류가 발생했습니다.',
      500,
    );
  }
}

function applyAutomaticStageDate({
  stage,
  now,
  updateData,
  existingOrder,
}: {
  stage: ProductionStage;
  now: Date;
  updateData: BookOrderUpdateData;
  existingOrder: {
    manuscriptReceivedAt: Date | null;
    reviewStartedAt: Date | null;
    proofSentAt: Date | null;
    proofApprovedAt: Date | null;
    printOrderedAt: Date | null;
    printingCompletedAt: Date | null;
    shippedAt: Date | null;
    completedAt: Date | null;
  };
}) {
  if (
    stage === 'MANUSCRIPT_RECEIVED' &&
    updateData.manuscriptReceivedAt ===
      undefined &&
    !existingOrder.manuscriptReceivedAt
  ) {
    updateData.manuscriptReceivedAt =
      now;
  }

  if (
    stage === 'REVIEWING' &&
    updateData.reviewStartedAt ===
      undefined &&
    !existingOrder.reviewStartedAt
  ) {
    updateData.reviewStartedAt = now;
  }

  if (
    stage === 'PROOF_SENT' &&
    updateData.proofSentAt ===
      undefined &&
    !existingOrder.proofSentAt
  ) {
    updateData.proofSentAt = now;
  }

  if (
    stage === 'PROOF_APPROVED' &&
    updateData.proofApprovedAt ===
      undefined &&
    !existingOrder.proofApprovedAt
  ) {
    updateData.proofApprovedAt = now;
  }

  if (
    stage === 'PRINT_ORDERED' &&
    updateData.printOrderedAt ===
      undefined &&
    !existingOrder.printOrderedAt
  ) {
    updateData.printOrderedAt = now;
  }

  if (
    stage === 'SHIPPED' &&
    updateData.shippedAt === undefined &&
    !existingOrder.shippedAt
  ) {
    updateData.shippedAt = now;
  }

  if (
    stage === 'COMPLETED' &&
    updateData.completedAt ===
      undefined &&
    !existingOrder.completedAt
  ) {
    updateData.completedAt = now;
  }
}

function parseOptionalText(
  value: unknown,
  label: string,
  maxLength: number,
):
  | {
      ok: true;
      value:
        | string
        | null
        | undefined;
    }
  | {
      ok: false;
      message: string;
    } {
  if (value === undefined) {
    return {
      ok: true,
      value: undefined,
    };
  }

  if (value === null) {
    return {
      ok: true,
      value: null,
    };
  }

  if (typeof value !== 'string') {
    return {
      ok: false,
      message:
        `${label} 형식이 올바르지 않습니다.`,
    };
  }

  const cleaned = value.trim();

  if (!cleaned) {
    return {
      ok: true,
      value: null,
    };
  }

  if (cleaned.length > maxLength) {
    return {
      ok: false,
      message:
        `${label}은(는) ${maxLength.toLocaleString(
          'ko-KR',
        )}자 이하로 입력해 주세요.`,
    };
  }

  return {
    ok: true,
    value: cleaned,
  };
}

function parseOptionalDate(
  value: unknown,
  label: string,
):
  | {
      ok: true;
      value: Date | null | undefined;
    }
  | {
      ok: false;
      message: string;
    } {
  if (value === undefined) {
    return {
      ok: true,
      value: undefined,
    };
  }

  if (
    value === null ||
    value === ''
  ) {
    return {
      ok: true,
      value: null,
    };
  }

  if (typeof value !== 'string') {
    return {
      ok: false,
      message:
        `${label} 형식이 올바르지 않습니다.`,
    };
  }

  const parsedDate = new Date(value);

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    return {
      ok: false,
      message:
        `${label}을(를) 올바른 날짜로 입력해 주세요.`,
    };
  }

  return {
    ok: true,
    value: parsedDate,
  };
}

function isAllowedFileUrl(
  value: string,
) {
  if (value.startsWith('/')) {
    return true;
  }

  try {
    const url = new URL(value);

    return (
      url.protocol === 'http:' ||
      url.protocol === 'https:'
    );
  } catch {
    return false;
  }
}

function isProductionStage(
  value: unknown,
): value is ProductionStage {
  return (
    typeof value === 'string' &&
    PRODUCTION_STAGES.includes(
      value as ProductionStage,
    )
  );
}

function getProductionStageLabel(
  stage: string,
) {
  const labels: Record<
    ProductionStage,
    string
  > = {
    PREPARING: '제작 준비',
    MANUSCRIPT_RECEIVED: '원고 접수',
    REVIEWING: '원고 검토',
    PROOFING: '교정 진행',
    PROOF_SENT: '교정본 전달',
    PROOF_APPROVED: '교정 승인',
    PRINT_ORDERED: '인쇄 발주',
    PRINTING: '인쇄 진행',
    SHIPPING_PREPARATION:
      '배송 준비',
    SHIPPED: '배송 중',
    COMPLETED: '제작 완료',
    ON_HOLD: '제작 보류',
  };

  if (isProductionStage(stage)) {
    return labels[stage];
  }

  return '제작 상태 확인 필요';
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