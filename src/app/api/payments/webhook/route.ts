import { prisma } from '@/lib/prisma';
import {
  BookOrderStatus,
} from '@prisma/client';
import {
  NextRequest,
  NextResponse,
} from 'next/server';

export const runtime = 'nodejs';

type PaymentWebhookBody = {
  eventType?: unknown;
  data?: unknown;
};

type TossPaymentData = {
  paymentKey?: unknown;
  orderId?: unknown;
  status?: unknown;
  method?: unknown;
  approvedAt?: unknown;
  totalAmount?: unknown;
};

export async function POST(
  request: NextRequest,
) {
  try {
    const body =
      (await request
        .json()
        .catch(() => null)) as
        | PaymentWebhookBody
        | null;

    const eventType =
      cleanText(body?.eventType);

    /*
     * 이번 엔드포인트에서는
     * 결제 상태 변경 이벤트만 처리합니다.
     */
    if (
      eventType !==
      'PAYMENT_STATUS_CHANGED'
    ) {
      return NextResponse.json({
        ok: true,
        ignored: true,
        message:
          '처리 대상이 아닌 웹훅입니다.',
      });
    }

    if (!isRecord(body?.data)) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '웹훅 결제정보가 없습니다.',
        },
        {
          status: 400,
        },
      );
    }

    const eventPayment =
      body.data as TossPaymentData;

    const paymentKey =
      cleanText(
        eventPayment.paymentKey,
      );

    const orderId =
      cleanText(
        eventPayment.orderId,
      );

    if (
      !paymentKey ||
      paymentKey.length > 200 ||
      !isValidOrderId(orderId)
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '웹훅 주문정보가 올바르지 않습니다.',
        },
        {
          status: 400,
        },
      );
    }

    /*
     * 달동네 주문번호와 연결된 주문만
     * 처리합니다.
     */
    const order =
      await prisma.bookOrder.findUnique({
        where: {
          orderId,
        },
        select: {
          id: true,
          orderId: true,
          totalAmount: true,
          status: true,
          paymentKey: true,
          paymentMethod: true,
          paidAt: true,
          canceledAt: true,
        },
      });

    if (!order) {
      console.warn(
        '[TOSS_WEBHOOK_ORDER_NOT_FOUND]',
        {
          orderId,
        },
      );

      return NextResponse.json({
        ok: true,
        ignored: true,
        message:
          '연결된 달동네 주문이 없습니다.',
      });
    }

    if (
      order.paymentKey &&
      order.paymentKey !== paymentKey
    ) {
      console.error(
        '[TOSS_WEBHOOK_PAYMENT_KEY_CONFLICT]',
        {
          orderId,
        },
      );

      return NextResponse.json(
        {
          ok: false,
          message:
            '기존 결제키와 웹훅 결제키가 일치하지 않습니다.',
        },
        {
          status: 409,
        },
      );
    }

    const secretKey =
      process.env.TOSS_SECRET_KEY;

    if (!secretKey) {
      console.error(
        '[TOSS_WEBHOOK_SECRET_KEY_MISSING]',
      );

      return NextResponse.json(
        {
          ok: false,
          message:
            '결제 서버 설정이 없습니다.',
        },
        {
          status: 500,
        },
      );
    }

    const authorization =
      Buffer.from(
        `${secretKey}:`,
        'utf8',
      ).toString('base64');

    /*
     * 웹훅 본문만 믿지 않고
     * 토스 결제 조회 API로 현재 상태를
     * 다시 확인합니다.
     */
    let tossResponse: Response;

    try {
      tossResponse = await fetch(
        `https://api.tosspayments.com/v1/payments/${encodeURIComponent(
          paymentKey,
        )}`,
        {
          method: 'GET',
          headers: {
            Authorization:
              `Basic ${authorization}`,
          },
          cache: 'no-store',
        },
      );
    } catch (error) {
      console.error(
        '[TOSS_WEBHOOK_PAYMENT_LOOKUP_NETWORK_ERROR]',
        error,
      );

      return NextResponse.json(
        {
          ok: false,
          message:
            '토스 결제정보 조회에 실패했습니다.',
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
        | TossPaymentData
        | null;

    if (
      !tossResponse.ok ||
      !tossBody
    ) {
      console.error(
        '[TOSS_WEBHOOK_PAYMENT_LOOKUP_REJECTED]',
        {
          status:
            tossResponse.status,
          orderId,
        },
      );

      return NextResponse.json(
        {
          ok: false,
          message:
            '토스 결제정보를 확인하지 못했습니다.',
        },
        {
          status: 502,
        },
      );
    }

    const verifiedPaymentKey =
      cleanText(
        tossBody.paymentKey,
      );

    const verifiedOrderId =
      cleanText(
        tossBody.orderId,
      );

    const verifiedTossStatus =
      cleanText(
        tossBody.status,
      );

    const verifiedMethod =
      cleanText(
        tossBody.method,
      );

    const verifiedAmount =
      toInteger(
        tossBody.totalAmount,
      );

    if (
      verifiedPaymentKey !==
        paymentKey ||
      verifiedOrderId !==
        order.orderId
    ) {
      console.error(
        '[TOSS_WEBHOOK_PAYMENT_ID_MISMATCH]',
        {
          orderId:
            order.orderId,
          verifiedOrderId,
        },
      );

      return NextResponse.json(
        {
          ok: false,
          message:
            '조회된 결제정보가 주문과 일치하지 않습니다.',
        },
        {
          status: 409,
        },
      );
    }

    if (
      verifiedAmount === null ||
      verifiedAmount !==
        order.totalAmount
    ) {
      console.error(
        '[TOSS_WEBHOOK_AMOUNT_MISMATCH]',
        {
          orderId:
            order.orderId,
          expectedAmount:
            order.totalAmount,
          verifiedAmount,
        },
      );

      return NextResponse.json(
        {
          ok: false,
          message:
            '조회된 결제금액이 주문금액과 일치하지 않습니다.',
        },
        {
          status: 409,
        },
      );
    }

    const nextStatus =
      mapBookOrderStatus(
        verifiedTossStatus,
        order.status,
      );

    if (!nextStatus) {
      console.warn(
        '[TOSS_WEBHOOK_STATUS_IGNORED]',
        {
          orderId:
            order.orderId,
          tossStatus:
            verifiedTossStatus,
        },
      );

      return NextResponse.json({
        ok: true,
        ignored: true,
        message:
          '변경할 필요가 없는 결제 상태입니다.',
      });
    }

    const isPaid =
      nextStatus ===
      BookOrderStatus.PAID;

    const isRefunded =
      nextStatus ===
        BookOrderStatus.REFUNDED ||
      nextStatus ===
        BookOrderStatus
          .PARTIALLY_REFUNDED;

    const isCanceled =
      nextStatus ===
      BookOrderStatus.CANCELED;

    const paidAt = isPaid
      ? parseDate(
          tossBody.approvedAt,
        ) ||
        order.paidAt ||
        new Date()
      : isRefunded
        ? order.paidAt
        : null;

    const canceledAt =
      isRefunded || isCanceled
        ? order.canceledAt ||
          new Date()
        : null;

    const updatedOrder =
      await prisma.bookOrder.update({
        where: {
          id: order.id,
        },
        data: {
          paymentKey:
            verifiedPaymentKey,
          paymentMethod:
            verifiedMethod ||
            order.paymentMethod,
          status:
            nextStatus,
          paidAt,
          canceledAt,
        },
        select: {
          orderId: true,
          status: true,
          paymentMethod: true,
          paidAt: true,
          canceledAt: true,
        },
      });

    console.info(
      '[TOSS_WEBHOOK_ORDER_UPDATED]',
      {
        orderId:
          updatedOrder.orderId,
        tossStatus:
          verifiedTossStatus,
        bookOrderStatus:
          updatedOrder.status,
      },
    );

    return NextResponse.json({
      ok: true,
      ignored: false,
      orderId:
        updatedOrder.orderId,
      status:
        updatedOrder.status,
    });
  } catch (error) {
    console.error(
      '[TOSS_PAYMENT_WEBHOOK_ERROR]',
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          '결제 웹훅 처리 중 오류가 발생했습니다.',
      },
      {
        status: 500,
      },
    );
  }
}

function mapBookOrderStatus(
  tossStatus: string,
  currentStatus: BookOrderStatus,
): BookOrderStatus | null {
  if (tossStatus === 'DONE') {
    return BookOrderStatus.PAID;
  }

  if (
    tossStatus ===
      'WAITING_FOR_DEPOSIT' ||
    tossStatus === 'IN_PROGRESS'
  ) {
    return BookOrderStatus
      .PAYMENT_PENDING;
  }

  if (tossStatus === 'READY') {
    return BookOrderStatus.READY;
  }

  if (
    tossStatus ===
    'PARTIAL_CANCELED'
  ) {
    return BookOrderStatus
      .PARTIALLY_REFUNDED;
  }

  if (tossStatus === 'CANCELED') {
    const wasPaid =
      currentStatus ===
        BookOrderStatus.PAID ||
      currentStatus ===
        BookOrderStatus
          .PARTIALLY_REFUNDED ||
      currentStatus ===
        BookOrderStatus.REFUNDED;

    return wasPaid
      ? BookOrderStatus.REFUNDED
      : BookOrderStatus.CANCELED;
  }

  if (
    tossStatus === 'ABORTED' ||
    tossStatus === 'EXPIRED'
  ) {
    return BookOrderStatus.FAILED;
  }

  return null;
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
    const parsed =
      Number(value);

    if (
      Number.isSafeInteger(
        parsed,
      )
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

function parseDate(
  value: unknown,
) {
  const text = cleanText(value);

  if (!text) {
    return null;
  }

  const date = new Date(text);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null;
  }

  return date;
}

function isRecord(
  value: unknown,
): value is Record<
  string,
  unknown
> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}