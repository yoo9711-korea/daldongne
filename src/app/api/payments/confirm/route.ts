import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  NextRequest,
  NextResponse,
} from 'next/server';

export const runtime = 'nodejs';

type ConfirmRequestBody = {
  paymentKey?: unknown;
  orderId?: unknown;
  amount?: unknown;
};

type TossPaymentResponse = {
  paymentKey?: unknown;
  orderId?: unknown;
  status?: unknown;
  method?: unknown;
  approvedAt?: unknown;
  totalAmount?: unknown;
};

type TossErrorResponse = {
  code?: unknown;
  message?: unknown;
};

export async function POST(
  request: NextRequest,
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

    const body =
      (await request
        .json()
        .catch(() => null)) as
        | ConfirmRequestBody
        | null;

    const paymentKey = cleanText(
      body?.paymentKey,
    );

    const orderId = cleanText(
      body?.orderId,
    );

    const amount = toInteger(
      body?.amount,
    );

    if (
      !paymentKey ||
      paymentKey.length > 200
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '결제 인증 정보를 확인할 수 없습니다.',
        },
        {
          status: 400,
        },
      );
    }

    if (
      !isValidOrderId(orderId)
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '주문번호를 확인할 수 없습니다.',
        },
        {
          status: 400,
        },
      );
    }

    if (
      amount === null ||
      amount < 100
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '결제 금액을 확인할 수 없습니다.',
        },
        {
          status: 400,
        },
      );
    }

    const order =
      await prisma.bookOrder.findFirst({
        where: {
          orderId,
          authorId: userId,
        },
        select: {
          id: true,
          bookId: true,
          orderId: true,
          totalAmount: true,
          status: true,
          paymentKey: true,
          paymentMethod: true,
          paidAt: true,
        },
      });

    if (!order) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '결제할 주문을 찾을 수 없습니다.',
        },
        {
          status: 404,
        },
      );
    }

    if (order.status === 'PAID') {
      if (
        order.paymentKey ===
          paymentKey &&
        order.totalAmount === amount
      ) {
        return NextResponse.json({
          ok: true,
          alreadyApproved: true,
          paymentCompleted: true,
          bookId: order.bookId,
          orderId: order.orderId,
          status: order.status,
          paymentMethod:
            order.paymentMethod,
          paidAt: order.paidAt,
          message:
            '이미 결제가 완료된 주문입니다.',
        });
      }

      return NextResponse.json(
        {
          ok: false,
          message:
            '이미 다른 결제정보로 완료된 주문입니다.',
        },
        {
          status: 409,
        },
      );
    }

    if (
      [
        'CANCELED',
        'REFUNDED',
        'PARTIALLY_REFUNDED',
      ].includes(order.status)
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '현재 상태에서는 결제를 승인할 수 없습니다.',
        },
        {
          status: 409,
        },
      );
    }

    /*
     * 브라우저에서 받은 금액을 그대로 믿지 않고
     * DB에 저장된 최종 견적 금액과 비교합니다.
     */
    if (
      order.totalAmount !== amount
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '주문 금액과 결제 요청 금액이 일치하지 않습니다.',
        },
        {
          status: 400,
        },
      );
    }

    const secretKey =
      process.env.TOSS_SECRET_KEY;

    if (!secretKey) {
      console.error(
        '[TOSS_SECRET_KEY_MISSING]',
      );

      return NextResponse.json(
        {
          ok: false,
          message:
            '결제 서버 설정을 확인할 수 없습니다.',
        },
        {
          status: 500,
        },
      );
    }

    await prisma.bookOrder.update({
      where: {
        id: order.id,
      },
      data: {
        status: 'PAYMENT_PENDING',
      },
    });

    const authorization =
      Buffer.from(
        `${secretKey}:`,
        'utf8',
      ).toString('base64');

    let tossResponse: Response;

    try {
      tossResponse = await fetch(
        'https://api.tosspayments.com/v1/payments/confirm',
        {
          method: 'POST',
          headers: {
            Authorization:
              `Basic ${authorization}`,
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            paymentKey,
            orderId:
              order.orderId,
            amount:
              order.totalAmount,
          }),
          cache: 'no-store',
        },
      );
    } catch (error) {
      console.error(
        '[TOSS_PAYMENT_CONFIRM_NETWORK_ERROR]',
        error,
      );

      await markOrderFailed(order.id);

      return NextResponse.json(
        {
          ok: false,
          message:
            '결제 승인 서버에 연결하지 못했습니다.',
        },
        {
          status: 502,
        },
      );
    }

    const tossBody =
      (await tossResponse
        .json()
        .catch(() => null)) as
        | TossPaymentResponse
        | TossErrorResponse
        | null;

    if (!tossResponse.ok) {
      await markOrderFailed(order.id);

      const tossError =
        tossBody as
          | TossErrorResponse
          | null;

      const errorMessage =
        cleanText(
          tossError?.message,
        ) ||
        '토스페이먼츠 결제 승인에 실패했습니다.';

      console.error(
        '[TOSS_PAYMENT_CONFIRM_REJECTED]',
        {
          status:
            tossResponse.status,
          code: cleanText(
            tossError?.code,
          ),
          orderId:
            order.orderId,
        },
      );

      return NextResponse.json(
        {
          ok: false,
          message: errorMessage,
        },
        {
          status:
            tossResponse.status >= 500
              ? 502
              : 400,
        },
      );
    }

    const payment =
      tossBody as
        | TossPaymentResponse
        | null;

    const confirmedPaymentKey =
      cleanText(payment?.paymentKey);

    const confirmedOrderId =
      cleanText(payment?.orderId);

    const confirmedStatus =
      cleanText(payment?.status);

    const confirmedMethod =
      cleanText(payment?.method);

    const confirmedAmount =
      toInteger(
        payment?.totalAmount,
      );

    if (
      confirmedPaymentKey !==
        paymentKey ||
      confirmedOrderId !==
        order.orderId ||
      confirmedAmount !==
        order.totalAmount
    ) {
      console.error(
        '[TOSS_PAYMENT_CONFIRM_MISMATCH]',
        {
          orderId:
            order.orderId,
          confirmedOrderId,
          expectedAmount:
            order.totalAmount,
          confirmedAmount,
        },
      );

      await markOrderFailed(order.id);

      return NextResponse.json(
        {
          ok: false,
          message:
            '승인된 결제정보가 주문정보와 일치하지 않습니다.',
        },
        {
          status: 409,
        },
      );
    }

    const isPaid =
      confirmedStatus === 'DONE';

    const isWaitingForDeposit =
      confirmedStatus ===
      'WAITING_FOR_DEPOSIT';

    if (
      !isPaid &&
      !isWaitingForDeposit
    ) {
      await markOrderFailed(order.id);

      return NextResponse.json(
        {
          ok: false,
          message:
            '결제가 정상적인 완료 상태가 아닙니다.',
        },
        {
          status: 409,
        },
      );
    }

    const approvedAt =
      isPaid
        ? parseApprovedAt(
            payment?.approvedAt,
          )
        : null;

    const updatedOrder =
      await prisma.bookOrder.update({
        where: {
          id: order.id,
        },
        data: {
          paymentKey:
            confirmedPaymentKey,
          paymentMethod:
            confirmedMethod ||
            null,
          paidAt:
            approvedAt,
          status: isPaid
            ? 'PAID'
            : 'PAYMENT_PENDING',
        },
        select: {
          bookId: true,
          orderId: true,
          totalAmount: true,
          status: true,
          paymentMethod: true,
          paidAt: true,
        },
      });

    return NextResponse.json({
      ok: true,
      alreadyApproved: false,
      paymentCompleted: isPaid,
      bookId:
        updatedOrder.bookId,
      orderId:
        updatedOrder.orderId,
      totalAmount:
        updatedOrder.totalAmount,
      status:
        updatedOrder.status,
      paymentMethod:
        updatedOrder.paymentMethod,
      paidAt:
        updatedOrder.paidAt,
      message: isPaid
        ? '결제가 완료되었습니다.'
        : '가상계좌가 발급되었습니다. 입금 완료 후 결제가 확정됩니다.',
    });
  } catch (error) {
    console.error(
      '[BOOK_PAYMENT_CONFIRM_ERROR]',
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          '결제 승인 처리 중 오류가 발생했습니다.',
      },
      {
        status: 500,
      },
    );
  }
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
    Number.isSafeInteger(value)
  ) {
    return value;
  }

  if (
    typeof value === 'string' &&
    value.trim()
  ) {
    const parsed = Number(
      value,
    );

    if (
      Number.isSafeInteger(parsed)
    ) {
      return parsed;
    }
  }

  return null;
}

function isValidOrderId(
  orderId: string,
) {
  return (
    orderId.length >= 6 &&
    orderId.length <= 64 &&
    /^[A-Za-z0-9_-]+$/.test(
      orderId,
    )
  );
}

function parseApprovedAt(
  value: unknown,
) {
  const text = cleanText(value);

  if (!text) {
    return new Date();
  }

  const date = new Date(text);

  if (
    Number.isNaN(date.getTime())
  ) {
    return new Date();
  }

  return date;
}

async function markOrderFailed(
  orderId: string,
) {
  await prisma.bookOrder.updateMany({
    where: {
      id: orderId,
      status: {
        not: 'PAID',
      },
    },
    data: {
      status: 'FAILED',
    },
  });
}