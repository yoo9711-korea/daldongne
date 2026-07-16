'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Suspense,
  useEffect,
  useRef,
  useState,
} from 'react';

type PaymentViewState =
  | 'PROCESSING'
  | 'COMPLETED'
  | 'WAITING'
  | 'ERROR';

type ConfirmResult = {
  ok?: boolean;
  message?: string;
  paymentCompleted?: boolean;
  alreadyApproved?: boolean;
  bookId?: string;
  orderId?: string;
  totalAmount?: number;
  status?: string;
  paymentMethod?: string | null;
  paidAt?: string | null;
};

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <PaymentResultLayout
          state="PROCESSING"
          title="결제를 확인하고 있습니다"
          message="잠시만 기다려 주세요."
          amount={null}
          orderId=""
          bookId=""
          paymentMethod=""
        />
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();

    const paymentKey =
    searchParams
      ?.get('paymentKey')
      ?.trim() || '';

  const orderId =
    searchParams
      ?.get('orderId')
      ?.trim() || '';

  const amountText =
    searchParams
      ?.get('amount')
      ?.trim() || '';

  const startedRef = useRef(false);

  const [state, setState] =
    useState<PaymentViewState>(
      'PROCESSING',
    );

  const [message, setMessage] =
    useState(
      '토스페이먼츠 결제 승인을 진행하고 있습니다.',
    );

  const [result, setResult] =
    useState<ConfirmResult | null>(
      null,
    );

  const amount = Number(amountText);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }

    startedRef.current = true;

    if (
      !paymentKey ||
      !orderId ||
      !Number.isSafeInteger(amount) ||
      amount < 100
    ) {
      setState('ERROR');
      setMessage(
        '결제 인증 정보가 올바르지 않습니다.',
      );
      return;
    }

    const confirmPayment = async () => {
      try {
        const response = await fetch(
          '/api/payments/confirm',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              paymentKey,
              orderId,
              amount,
            }),
          },
        );

        const data =
          (await response
            .json()
            .catch(() => null)) as
            | ConfirmResult
            | null;

        if (
          !response.ok ||
          !data?.ok
        ) {
          throw new Error(
            data?.message ||
              '결제 승인에 실패했습니다.',
          );
        }

        setResult(data);

        if (
          data.paymentCompleted ||
          data.status === 'PAID'
        ) {
          setState('COMPLETED');
          setMessage(
            data.message ||
              '결제가 완료되었습니다.',
          );
          return;
        }

        if (
          data.status ===
          'PAYMENT_PENDING'
        ) {
          setState('WAITING');
          setMessage(
            data.message ||
              '입금 완료를 기다리고 있습니다.',
          );
          return;
        }

        setState('ERROR');
        setMessage(
          data.message ||
            '결제 상태를 확인할 수 없습니다.',
        );
      } catch (error) {
        console.error(
          '[PAYMENT_SUCCESS_PAGE_ERROR]',
          error,
        );

        setState('ERROR');
        setMessage(
          error instanceof Error
            ? error.message
            : '결제 승인 중 오류가 발생했습니다.',
        );
      }
    };

    void confirmPayment();
  }, [
    amount,
    orderId,
    paymentKey,
  ]);

  return (
    <PaymentResultLayout
      state={state}
      title={getTitle(state)}
      message={message}
      amount={
        Number.isSafeInteger(amount)
          ? amount
          : null
      }
      orderId={
        result?.orderId || orderId
      }
      bookId={result?.bookId || ''}
      paymentMethod={
        result?.paymentMethod || ''
      }
    />
  );
}

function PaymentResultLayout({
  state,
  title,
  message,
  amount,
  orderId,
  bookId,
  paymentMethod,
}: {
  state: PaymentViewState;
  title: string;
  message: string;
  amount: number | null;
  orderId: string;
  bookId: string;
  paymentMethod: string;
}) {
  const completed =
    state === 'COMPLETED';

  const waiting =
    state === 'WAITING';

  const processing =
    state === 'PROCESSING';

  const libraryHref = bookId
    ? `/dashboard/library/${bookId}`
    : '/dashboard/library';

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '50px 20px',
        boxSizing: 'border-box',
        background:
          'linear-gradient(180deg, #f7eddc 0%, #fffaf0 100%)',
        color: '#271a12',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: 620,
          padding: '38px 32px',
          boxSizing: 'border-box',
          borderRadius: 30,
          border:
            '1px solid #dfc9a4',
          background: '#fffdf7',
          boxShadow:
            '0 24px 60px rgba(57, 35, 20, 0.14)',
          textAlign: 'center',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 72,
            height: 72,
            margin: '0 auto',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: completed
              ? '#e5f5e8'
              : waiting
                ? '#fff2c9'
                : processing
                  ? '#e8f1ff'
                  : '#fff0ed',
            color: completed
              ? '#2f6b38'
              : waiting
                ? '#83540d'
                : processing
                  ? '#245d8c'
                  : '#a1332d',
            fontSize: 34,
            fontWeight: 900,
          }}
        >
          {completed
            ? '✓'
            : waiting
              ? '…'
              : processing
                ? '↻'
                : '!'}
        </div>

        <p
          style={{
            margin: '22px 0 0',
            color: '#9a6a24',
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: '0.08em',
          }}
        >
          달동네 출판사 결제
        </p>

        <h1
          style={{
            margin: '9px 0 0',
            fontFamily:
              'Noto Serif KR, serif',
            fontSize:
              'clamp(28px, 5vw, 40px)',
            lineHeight: 1.35,
            letterSpacing: '-0.05em',
          }}
        >
          {title}
        </h1>

        <p
          style={{
            margin: '15px auto 0',
            maxWidth: 470,
            color: '#6d5947',
            fontSize: 15,
            lineHeight: 1.8,
          }}
        >
          {message}
        </p>

        {amount !== null ||
        orderId ||
        paymentMethod ? (
          <div
            style={{
              marginTop: 26,
              padding: 20,
              borderRadius: 20,
              background: '#f7eddc',
              border:
                '1px solid #ead7b7',
              textAlign: 'left',
              display: 'grid',
              gap: 13,
            }}
          >
            {amount !== null ? (
              <PaymentInfoRow
                label="결제 금액"
                value={`${amount.toLocaleString()}원`}
                strong
              />
            ) : null}

            {paymentMethod ? (
              <PaymentInfoRow
                label="결제수단"
                value={paymentMethod}
              />
            ) : null}

            {orderId ? (
              <PaymentInfoRow
                label="주문번호"
                value={orderId}
              />
            ) : null}
          </div>
        ) : null}

        {processing ? (
          <p
            style={{
              margin: '24px 0 0',
              color: '#245d8c',
              fontSize: 13,
              fontWeight: 900,
            }}
          >
            이 페이지를 닫지 마세요.
          </p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                completed || waiting
                  ? '1fr'
                  : 'repeat(2, minmax(0, 1fr))',
              gap: 10,
              marginTop: 26,
            }}
          >
            <Link
              href={libraryHref}
              style={{
                minHeight: 50,
                padding: '0 18px',
                borderRadius: 14,
                background: '#6e421d',
                color: '#fffaf0',
                textDecoration: 'none',
                fontSize: 15,
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {bookId
                ? '책 주문 확인하기'
                : '내 책장으로 이동'}
            </Link>

            {!completed &&
            !waiting ? (
              <Link
                href="/dashboard/library"
                style={{
                  minHeight: 50,
                  padding: '0 18px',
                  borderRadius: 14,
                  border:
                    '1px solid #d5bd93',
                  background: '#fffdf7',
                  color: '#5f452e',
                  textDecoration: 'none',
                  fontSize: 15,
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent:
                    'center',
                }}
              >
                내 책장으로 돌아가기
              </Link>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}

function PaymentInfoRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent:
          'space-between',
        alignItems: 'flex-start',
        gap: 14,
      }}
    >
      <span
        style={{
          color: '#8a806f',
          fontSize: 13,
          fontWeight: 800,
        }}
      >
        {label}
      </span>

      <strong
        style={{
          color: '#2d1c12',
          fontSize: strong
            ? 18
            : 13,
          textAlign: 'right',
          wordBreak: 'break-all',
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function getTitle(
  state: PaymentViewState,
) {
  if (state === 'COMPLETED') {
    return '결제가 완료되었습니다';
  }

  if (state === 'WAITING') {
    return '입금을 기다리고 있습니다';
  }

  if (state === 'ERROR') {
    return '결제를 완료하지 못했습니다';
  }

  return '결제를 확인하고 있습니다';
}