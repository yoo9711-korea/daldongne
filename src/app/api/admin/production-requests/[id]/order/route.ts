import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'node:crypto';
import {
  NextRequest,
  NextResponse,
} from 'next/server';

export const runtime = 'nodejs';

const PRODUCT_TYPES = [
  'DIGITAL_MANUSCRIPT',
  'BASIC_SOFTCOVER',
  'CUSTOM_BOOK',
] as const;

type BookProductType =
  (typeof PRODUCT_TYPES)[number];

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type OrderRequestBody = {
  productType?: unknown;
  productName?: unknown;
  specification?: unknown;
  quantity?: unknown;
  productAmount?: unknown;
  shippingFee?: unknown;
};

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        {
          ok: false,
          message: '로그인이 필요합니다.',
        },
        {
          status: 401,
        },
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
      return NextResponse.json(
        {
          ok: false,
          message:
            '관리자만 제작 견적을 등록할 수 있습니다.',
        },
        {
          status: 403,
        },
      );
    }

    const { id } = await context.params;
    const productionRequestId = id.trim();

    if (!productionRequestId) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '제작 상담 신청 정보를 찾을 수 없습니다.',
        },
        {
          status: 400,
        },
      );
    }

    const body =
      (await request
        .json()
        .catch(() => null)) as
        | OrderRequestBody
        | null;

    const productType = body?.productType;
    const productName = cleanText(
      body?.productName,
    );
    const specification = cleanText(
      body?.specification,
    );
    const quantity = toInteger(body?.quantity);
    const productAmount = toInteger(
      body?.productAmount,
    );
    const shippingFee = toInteger(
      body?.shippingFee,
    );

    if (!isBookProductType(productType)) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '올바른 상품 종류를 선택해 주세요.',
        },
        {
          status: 400,
        },
      );
    }

    if (
      !productName ||
      productName.length > 100
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '상품명은 1자 이상 100자 이하로 입력해 주세요.',
        },
        {
          status: 400,
        },
      );
    }

    if (
      specification &&
      specification.length > 2000
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '제작 사양은 2,000자 이하로 입력해 주세요.',
        },
        {
          status: 400,
        },
      );
    }

    if (
      quantity === null ||
      quantity < 1 ||
      quantity > 1000
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '제작 수량은 1권 이상 1,000권 이하로 입력해 주세요.',
        },
        {
          status: 400,
        },
      );
    }

    if (
      productAmount === null ||
      productAmount < 0 ||
      productAmount > 100000000
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '상품 금액을 올바르게 입력해 주세요.',
        },
        {
          status: 400,
        },
      );
    }

    if (
      shippingFee === null ||
      shippingFee < 0 ||
      shippingFee > 10000000
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '배송비를 올바르게 입력해 주세요.',
        },
        {
          status: 400,
        },
      );
    }

    const totalAmount =
      productAmount + shippingFee;

    if (totalAmount < 100) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '최종 결제 금액은 100원 이상이어야 합니다.',
        },
        {
          status: 400,
        },
      );
    }

    const productionRequest =
      await prisma.bookProductionRequest.findUnique(
        {
          where: {
            id: productionRequestId,
          },
          select: {
            id: true,
            bookId: true,
            authorId: true,
            status: true,
            bookOrder: {
              select: {
                id: true,
                status: true,
                orderId: true,
              },
            },
          },
        },
      );

    if (!productionRequest) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '제작 상담 신청 정보를 찾을 수 없습니다.',
        },
        {
          status: 404,
        },
      );
    }

    if (
      productionRequest.status ===
      'CANCELED'
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '취소된 제작 상담에는 견적을 등록할 수 없습니다.',
        },
        {
          status: 409,
        },
      );
    }

    const currentOrder =
      productionRequest.bookOrder;

    if (
      currentOrder &&
      [
        'PAID',
        'PARTIALLY_REFUNDED',
        'REFUNDED',
      ].includes(currentOrder.status)
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '결제가 처리된 주문은 견적을 변경할 수 없습니다.',
        },
        {
          status: 409,
        },
      );
    }

    const orderId =
      currentOrder?.orderId ||
      createOrderId();

    const order =
      await prisma.bookOrder.upsert({
        where: {
          productionRequestId,
        },
        update: {
          productType,
          productName,
          specification:
            specification || null,
          quantity,
          productAmount,
          shippingFee,
          totalAmount,
          status: 'READY',
          paymentKey: null,
          paymentMethod: null,
          paidAt: null,
          canceledAt: null,
        },
        create: {
          productionRequestId,
          bookId:
            productionRequest.bookId,
          authorId:
            productionRequest.authorId,
          productType,
          productName,
          specification:
            specification || null,
          quantity,
          productAmount,
          shippingFee,
          totalAmount,
          status: 'READY',
          orderId,
        },
        select: {
          id: true,
          productionRequestId: true,
          bookId: true,
          productType: true,
          productName: true,
          specification: true,
          quantity: true,
          productAmount: true,
          shippingFee: true,
          totalAmount: true,
          status: true,
          orderId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    return NextResponse.json({
      ok: true,
      message:
        currentOrder
          ? '제작 견적을 수정했습니다.'
          : '제작 견적과 결제 주문을 만들었습니다.',
      order,
    });
  } catch (error) {
    console.error(
      '[ADMIN_BOOK_ORDER_SAVE_ERROR]',
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          '제작 견적 저장 중 오류가 발생했습니다.',
      },
      {
        status: 500,
      },
    );
  }
}

function isBookProductType(
  value: unknown,
): value is BookProductType {
  return (
    typeof value === 'string' &&
    PRODUCT_TYPES.includes(
      value as BookProductType,
    )
  );
}

function cleanText(
  value: unknown,
) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function toInteger(
  value: unknown,
) {
  if (
    typeof value === 'number' &&
    Number.isInteger(value)
  ) {
    return value;
  }

  if (
    typeof value === 'string' &&
    value.trim()
  ) {
    const parsed = Number(value);

    if (Number.isInteger(parsed)) {
      return parsed;
    }
  }

  return null;
}

function createOrderId() {
  const date = new Date()
    .toISOString()
    .slice(0, 10)
    .replaceAll('-', '');

  const randomPart = randomUUID()
    .replaceAll('-', '')
    .slice(0, 12);

  return `DALDONGNE-${date}-${randomPart}`;
}