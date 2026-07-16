'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

export default function PaymentFailPage() {
  return (
    <Suspense
      fallback={
        <PaymentFailLayout
          title="결제 결과를 확인하고 있습니다"
          message="잠시만 기다려 주세요."
          errorCode=""
          orderId=""
          bookId=""
        />
      }
    >
      <PaymentFailContent />
    </Suspense>
  );
}

function PaymentFailContent() {
  const searchParams = useSearchParams();

  const errorCode =
    searchParams
      ?.get('code')
      ?.trim() || '';

  const receivedMessage =
    searchParams
      ?.get('message')
      ?.trim() || '';

  const orderId =
    searchParams
      ?.get('orderId')
      ?.trim() || '';

  const bookId =
    searchParams
      ?.get('bookId')
      ?.trim() || '';

  const canceled =
    isCanceledPayment(
      errorCode,
      receivedMessage,
    );

  const title = canceled
    ? '결제가 취소되었습니다'
    : '결제를 완료하지 못했습니다';

  const message =
    receivedMessage ||
    (canceled
      ? '결제가 진행되지 않았습니다. 주문 내용은 그대로 유지됩니다.'
      : '결제 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.');

  return (
    <PaymentFailLayout
      title={title}
      message={message}
      errorCode={errorCode}
      orderId={orderId}
      bookId={bookId}
    />
  );
}

function PaymentFailLayout({
  title,
  message,
  errorCode,
  orderId,
  bookId,
}: {
  title: string;
  message: string;
  errorCode: string;
  orderId: string;
  bookId: string;
}) {
  const bookHref = bookId
    ? `/dashboard/library/${encodeURIComponent(
        bookId,
      )}`
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
          border: '1px solid #dfc9a4',
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
            background: '#fff0ed',
            color: '#a1332d',
            fontSize: 34,
            fontWeight: 900,
          }}
        >
          !
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
            wordBreak: 'keep-all',
          }}
        >
          {message}
        </p>

        {errorCode || orderId ? (
          <div
            style={{
              marginTop: 26,
              padding: 20,
              borderRadius: 20,
              background: '#f7eddc',
              border: '1px solid #ead7b7',
              textAlign: 'left',
              display: 'grid',
              gap: 13,
            }}
          >
            {orderId ? (
              <PaymentInfoRow
                label="주문번호"
                value={orderId}
              />
            ) : null}

            {errorCode ? (
              <PaymentInfoRow
                label="오류코드"
                value={errorCode}
              />
            ) : null}
          </div>
        ) : null}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(2, minmax(0, 1fr))',
            gap: 10,
            marginTop: 26,
          }}
        >
          <Link
            href={bookHref}
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
              ? '책 주문으로 돌아가기'
              : '내 책장으로 이동'}
          </Link>

          <Link
            href="/dashboard"
            style={{
              minHeight: 50,
              padding: '0 18px',
              borderRadius: 14,
              border: '1px solid #d5bd93',
              background: '#fffdf7',
              color: '#5f452e',
              textDecoration: 'none',
              fontSize: 15,
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            대시보드로 이동
          </Link>
        </div>

        <p
          style={{
            margin: '20px 0 0',
            color: '#887765',
            fontSize: 12,
            lineHeight: 1.7,
          }}
        >
          결제가 완료되지 않은 경우 비용은
          청구되지 않습니다.
        </p>
      </section>
    </main>
  );
}

function PaymentInfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
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
          fontSize: 13,
          textAlign: 'right',
          wordBreak: 'break-all',
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function isCanceledPayment(
  errorCode: string,
  message: string,
) {
  const normalized =
    `${errorCode} ${message}`.toUpperCase();

  return (
    normalized.includes('CANCEL') ||
    normalized.includes('취소')
  );
}