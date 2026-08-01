import { auth } from '@/auth';
import { recordBookOrderAudit } from '@/lib/order-audit';
import { sendOrderPaymentCompletedEmail } from '@/lib/order-email';
import {
  calculatePaymentAmounts,
  createPaymentEventKey,
  recordPaymentEvent,
} from '@/lib/payment-ledger';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createHash } from 'node:crypto';
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
  balanceAmount?: unknown;
  lastTransactionKey?: unknown;
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
          productName: true,
          orderId: true,
          totalAmount: true,
          status: true,
          paymentKey: true,
          paymentMethod: true,
          paidAt: true,
          tossStatus: true,
          approvedAmount: true,
          refundedAmount: true,
          balanceAmount: true,
          paymentSyncedAt: true,
          book: {
            select: {
              title: true,
            },
          },
          productionRequest: {
            select: {
              name: true,
              email: true,
            },
          },
          author: {
            select: {
              name: true,
              email: true,
            },
          },
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

    /* PHASE_TWO_PAYMENT_CLAIM */
    const paymentClaim =
      await prisma.bookOrder.updateMany({
        where: {
          id: order.id,
          status: order.status,
        },
        data: {
          status:
            "PAYMENT_PENDING",
        },
      });

    if (
      paymentClaim.count !== 1
    ) {
      const latestOrder =
        await prisma.bookOrder.findUnique({
          where: {
            id: order.id,
          },
          select: {
            status: true,
          },
        });

      return NextResponse.json(
        {
          ok: false,
          message:
            latestOrder?.status ===
              "PAID"
              ? "이미 결제가 완료된 주문입니다."
              : "다른 결제 요청이 처리 중입니다. 주문 화면을 새로고침한 뒤 다시 확인해 주세요.",
        },
        {
          status: 409,
        },
      );
    }

    await recordBookOrderAudit({
      orderId: order.id,
      actorId: userId,
      source: 'CUSTOMER',
      category: 'PAYMENT',
      action: 'PAYMENT_STARTED',
      summary:
        '고객이 결제를 시작했습니다.',
      before: {
        status: order.status,
        paymentMethod:
          order.paymentMethod,
        paidAt: order.paidAt,
      },
      after: {
        status:
          'PAYMENT_PENDING',
        paymentMethod:
          order.paymentMethod,
        paidAt: order.paidAt,
      },
      isCustomerVisible: true,
    });

       const authorization =
      Buffer.from(
        `${secretKey}:`,
        'utf8',
      ).toString('base64');

    /*
     * 같은 주문과 paymentKey의 승인 요청은
     * 항상 같은 멱등키를 사용합니다.
     *
     * 브라우저 재요청이나 네트워크 재시도 때문에
     * 승인 API가 여러 번 호출되더라도
     * 토스에서 중복 승인되지 않도록 보호합니다.
     */
    const confirmIdempotencyKey =
      createHash('sha256')
        .update(
          `daldongne-payment-confirm:${order.id}:${paymentKey}`,
          'utf8',
        )
        .digest('hex');

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
            'Idempotency-Key':
              confirmIdempotencyKey,
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

      /*
       * 네트워크 오류는 결제 실패를 의미하지 않습니다.
       *
       * 토스에서 승인은 완료됐지만 응답만 받지 못한
       * 경우가 있을 수 있으므로 주문을 FAILED로
       * 변경하지 않고 PAYMENT_PENDING으로 유지합니다.
       *
       * 이후 웹훅 또는 관리자 결제정보 재조회 기능으로
       * 실제 토스 상태를 확인합니다.
       */
      return NextResponse.json(
        {
          ok: true,
          paymentCompleted: false,
          alreadyApproved: false,
          bookId: order.bookId,
          orderId: order.orderId,
          totalAmount:
            order.totalAmount,
          status:
            'PAYMENT_PENDING',
          paymentMethod:
            order.paymentMethod,
          paidAt:
            order.paidAt,
          message:
            '결제 승인 결과를 확인 중입니다. 결제를 다시 시도하지 말고 주문 화면에서 결제정보를 다시 확인해 주세요.',
        },
        {
          status: 202,
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
      await markOrderFailed(order.id, userId);

      const tossError =
        tossBody as
          | TossErrorResponse
          | null;

          const tossErrorCode =
        cleanText(
          tossError?.code,
        );

      /*
       * 토스 서버 오류와 이미 처리된 결제 응답은
       * 실패로 확정할 수 없습니다.
       *
       * 주문을 PAYMENT_PENDING으로 유지하고
       * 웹훅 또는 결제정보 재조회로 정합성을 맞춥니다.
       */
      if (
        tossResponse.status >= 500 ||
        tossErrorCode ===
          'ALREADY_PROCESSED_PAYMENT'
      ) {
        console.warn(
          '[TOSS_PAYMENT_CONFIRM_UNCERTAIN]',
          {
            orderId:
              order.orderId,
            status:
              tossResponse.status,
            code:
              tossErrorCode,
          },
        );

        return NextResponse.json(
          {
            ok: true,
            paymentCompleted: false,
            alreadyApproved:
              tossErrorCode ===
              'ALREADY_PROCESSED_PAYMENT',
            bookId:
              order.bookId,
            orderId:
              order.orderId,
            totalAmount:
              order.totalAmount,
            status:
              'PAYMENT_PENDING',
            paymentMethod:
              order.paymentMethod,
            paidAt:
              order.paidAt,
            message:
              '결제 처리 결과를 토스 서버에서 다시 확인하고 있습니다. 중복 결제를 방지하기 위해 결제를 다시 시도하지 마세요.',
          },
          {
            status: 202,
          },
        );
      }

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

    const confirmedBalanceAmount =
      toInteger(
        payment?.balanceAmount,
      );

    const confirmedTransactionKey =
      cleanText(
        payment?.lastTransactionKey,
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

      await markOrderFailed(order.id, userId);

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
      await markOrderFailed(order.id, userId);

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

    const paymentAmounts =
      calculatePaymentAmounts({
        totalAmount:
          order.totalAmount,
        tossStatus:
          confirmedStatus,
        balanceAmount:
          confirmedBalanceAmount,
      });

    const paymentSyncedAt =
      new Date();

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
          tossStatus:
            confirmedStatus,
          approvedAmount:
            paymentAmounts.approvedAmount,
          refundedAmount:
            paymentAmounts.refundedAmount,
          balanceAmount:
            paymentAmounts.balanceAmount,
          paymentSyncedAt,
        },
        select: {
          bookId: true,
          orderId: true,
          totalAmount: true,
          status: true,
          paymentMethod: true,
          paidAt: true,
          tossStatus: true,
          approvedAmount: true,
          refundedAmount: true,
          balanceAmount: true,
          paymentSyncedAt: true,
        },
      });

    await recordPaymentEvent({
      orderId: order.id,
      eventType: isPaid
        ? 'APPROVAL'
        : 'WAITING_DEPOSIT',
      status: confirmedStatus,
      amount: isPaid
        ? paymentAmounts.approvedAmount
        : 0,
      balanceAmount:
        paymentAmounts.balanceAmount,
      transactionKey:
        confirmedTransactionKey || null,
      idempotencyKey:
        createPaymentEventKey([
          'confirm',
          confirmedPaymentKey,
          confirmedStatus,
          paymentAmounts.balanceAmount,
          confirmedTransactionKey ||
            'none',
        ]),
      source: 'CUSTOMER',
      occurredAt:
        approvedAt || paymentSyncedAt,
    });

    await recordBookOrderAudit({
      orderId: order.id,
      actorId: userId,
      source: 'CUSTOMER',
      category: 'PAYMENT',
      action:
        isPaid
          ? 'PAYMENT_COMPLETED'
          : 'PAYMENT_WAITING_DEPOSIT',
      summary:
        isPaid
          ? '결제가 완료되었습니다.'
          : '가상계좌가 발급되어 입금을 기다리고 있습니다.',
      before: {
        status: order.status,
        paymentMethod:
          order.paymentMethod,
        paidAt: order.paidAt,
      },
      after: {
        status:
          updatedOrder.status,
        paymentMethod:
          updatedOrder.paymentMethod,
        paidAt:
          updatedOrder.paidAt,
        totalAmount:
          updatedOrder.totalAmount,
        tossStatus:
          updatedOrder.tossStatus,
        approvedAmount:
          updatedOrder.approvedAmount,
        refundedAmount:
          updatedOrder.refundedAmount,
        balanceAmount:
          updatedOrder.balanceAmount,
        paymentSyncedAt:
          updatedOrder.paymentSyncedAt,
      },
      isCustomerVisible: true,
    });
    if (isPaid) {
      await sendOrderPaymentCompletedEmail({
        to:
          order.productionRequest
            .email ||
          order.author.email ||
          null,
        customerName:
          order.productionRequest
            .name ||
          order.author.name ||
          null,
        bookTitle:
          order.book.title,
        orderRecordId:
          order.id,
        orderId:
          updatedOrder.orderId,
        productName:
          order.productName,
        totalAmount:
          updatedOrder.totalAmount,
        paymentMethod:
          updatedOrder.paymentMethod,
        paidAt:
          updatedOrder.paidAt,
      });
    }

    revalidatePath(
      '/dashboard/orders',
    );

    revalidatePath(
      `/dashboard/orders/${order.id}`,
    );

    revalidatePath(
      `/dashboard/library/${order.bookId}`,
    );
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
      tossStatus:
        updatedOrder.tossStatus,
      approvedAmount:
        updatedOrder.approvedAmount,
      refundedAmount:
        updatedOrder.refundedAmount,
      balanceAmount:
        updatedOrder.balanceAmount,
      paymentSyncedAt:
        updatedOrder.paymentSyncedAt,
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
/* PHASE_TWO_PAYMENT_FAILURE_GUARD */
async function markOrderFailed(
  orderId: string,
  actorId: string,
) {
  const before =
    await prisma.bookOrder.findUnique({
      where: {
        id: orderId,
      },
      select: {
        id: true,
        status: true,
        paymentMethod: true,
        paidAt: true,
      },
    });

  if (!before) {
    return;
  }

  const failureUpdate =
    await prisma.bookOrder.updateMany({
      where: {
        id: orderId,
        status: {
          in: [
            "READY",
            "PAYMENT_PENDING",
            "FAILED",
          ],
        },
      },
      data: {
        status:
          "FAILED",
      },
    });

  if (
    failureUpdate.count !== 1
  ) {
    return;
  }

  const after =
    await prisma.bookOrder.findUnique({
      where: {
        id: orderId,
      },
      select: {
        id: true,
        status: true,
        paymentMethod: true,
        paidAt: true,
      },
    });

  if (!after) {
    return;
  }

  await recordBookOrderAudit({
    orderId,
    actorId,
    source:
      "CUSTOMER",
    category:
      "PAYMENT",
    action:
      "PAYMENT_FAILED",
    summary:
      "결제 승인 처리에 실패했습니다.",
    before,
    after,
    isCustomerVisible:
      true,
  });
}

// PAYMENT_LEDGER_INTEGRATION_V1
