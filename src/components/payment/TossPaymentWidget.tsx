'use client';

import {
  loadTossPayments,
  type TossPaymentsWidgets,
  type WidgetAgreementWidget,
  type WidgetPaymentMethodWidget,
} from '@tosspayments/tosspayments-sdk';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type TossPaymentWidgetProps = {
  bookId: string;
  orderId: string;
  orderName: string;
  amount: number;
  customerKey: string;
  customerName?: string | null;
  customerEmail?: string | null;
  customerMobilePhone?: string | null;
};

export default function TossPaymentWidget({
  bookId,
  orderId,
  orderName,
  amount,
  customerKey,
  customerName,
  customerEmail,
  customerMobilePhone,
}: TossPaymentWidgetProps) {
  const widgetsRef =
    useRef<TossPaymentsWidgets | null>(
      null,
    );

  const [isReady, setIsReady] =
    useState(false);

  const [isPaying, setIsPaying] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');

  const safeOrderId = useMemo(
    () =>
      orderId.replace(
        /[^a-zA-Z0-9_-]/g,
        '',
      ),
    [orderId],
  );

  const paymentMethodId =
    `payment-method-${safeOrderId}`;

  const agreementId =
    `agreement-${safeOrderId}`;

  useEffect(() => {
    const clientKey =
      process.env
        .NEXT_PUBLIC_TOSS_CLIENT_KEY;

    if (!clientKey) {
      setErrorMessage(
        '토스페이먼츠 클라이언트 키가 설정되지 않았습니다.',
      );
      return;
    }

    if (
      !customerKey ||
      !orderId ||
      amount < 100
    ) {
      setErrorMessage(
        '결제 주문 정보를 확인할 수 없습니다.',
      );
      return;
    }

    let canceled = false;

    let paymentMethodWidget:
      | WidgetPaymentMethodWidget
      | null = null;

    let agreementWidget:
      | WidgetAgreementWidget
      | null = null;

    const initializePaymentWidget =
      async () => {
        try {
          setIsReady(false);
          setErrorMessage('');

          const tossPayments =
            await loadTossPayments(
              clientKey,
            );

          if (canceled) {
            return;
          }

          const widgets =
            tossPayments.widgets({
              customerKey,
            });

          await widgets.setAmount({
            currency: 'KRW',
            value: amount,
          });

          if (canceled) {
            return;
          }

          paymentMethodWidget =
            await widgets.renderPaymentMethods(
              {
                selector:
                  `#${paymentMethodId}`,
              },
            );

          if (canceled) {
            await paymentMethodWidget.destroy();
            return;
          }

          agreementWidget =
            await widgets.renderAgreement({
              selector:
                `#${agreementId}`,
            });

          if (canceled) {
            await Promise.allSettled([
              paymentMethodWidget.destroy(),
              agreementWidget.destroy(),
            ]);
            return;
          }

          widgetsRef.current = widgets;
          setIsReady(true);
        } catch (error) {
          console.error(
            '[TOSS_PAYMENT_WIDGET_INIT_ERROR]',
            error,
          );

          if (!canceled) {
            setErrorMessage(
              error instanceof Error
                ? error.message
                : '결제 화면을 불러오지 못했습니다.',
            );
          }
        }
      };

    void initializePaymentWidget();

    return () => {
      canceled = true;
      widgetsRef.current = null;

      const cleanupTasks:
        Promise<void>[] = [];

      if (paymentMethodWidget) {
        cleanupTasks.push(
          paymentMethodWidget.destroy(),
        );
      }

      if (agreementWidget) {
        cleanupTasks.push(
          agreementWidget.destroy(),
        );
      }

      if (cleanupTasks.length > 0) {
        void Promise.allSettled(
          cleanupTasks,
        );
      }
    };
  }, [
    agreementId,
    amount,
    customerKey,
    orderId,
    paymentMethodId,
  ]);

  const handlePayment = async () => {
    const widgets = widgetsRef.current;

    if (
      !widgets ||
      !isReady ||
      isPaying
    ) {
      return;
    }

    setIsPaying(true);
    setErrorMessage('');

    try {
      const origin =
        window.location.origin;

      const successUrl =
        new URL(
          '/payments/success',
          origin,
        );

      successUrl.searchParams.set(
        'bookId',
        bookId,
      );

      const failUrl =
        new URL(
          '/payments/fail',
          origin,
        );

      failUrl.searchParams.set(
        'bookId',
        bookId,
      );

      const cleanCustomerName =
        customerName?.trim() || undefined;

      const cleanCustomerEmail =
        customerEmail?.trim() || undefined;

      const cleanMobilePhone =
        customerMobilePhone
          ?.replace(/\D/g, '')
          .trim() || undefined;

      await widgets.requestPayment({
        orderId,
        orderName:
          orderName.trim().slice(0, 100),
        successUrl:
          successUrl.toString(),
        failUrl: failUrl.toString(),
        customerName:
          cleanCustomerName,
        customerEmail:
          cleanCustomerEmail,
        customerMobilePhone:
          cleanMobilePhone,
      });
    } catch (error) {
      console.error(
        '[TOSS_PAYMENT_REQUEST_ERROR]',
        error,
      );

      const paymentError =
        error as {
          code?: string;
          message?: string;
        };

      if (
        paymentError.code ===
        'USER_CANCEL'
      ) {
        setErrorMessage(
          '결제가 취소되었습니다.',
        );
      } else {
        setErrorMessage(
          paymentError.message ||
            '결제 요청 중 오류가 발생했습니다.',
        );
      }

      setIsPaying(false);
    }
  };

  return (
    <section
      style={{
        marginTop: 18,
        overflow: 'hidden',
        borderRadius: 22,
        border:
          '1px solid #d8b97c',
        background: '#ffffff',
      }}
    >
      <div
        style={{
          padding: '20px 20px 8px',
        }}
      >
        <p
          style={{
            margin: 0,
            color: '#9a6a24',
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: '0.06em',
          }}
        >
          결제수단 선택
        </p>

        <h3
          style={{
            margin: '7px 0 0',
            color: '#2d1c12',
            fontSize: 22,
            lineHeight: 1.4,
          }}
        >
          {amount.toLocaleString()}원 결제
        </h3>

        <p
          style={{
            margin: '7px 0 0',
            color: '#786550',
            fontSize: 13,
            lineHeight: 1.65,
          }}
        >
          결제수단을 선택하고 필수 약관에
          동의한 뒤 결제해 주세요.
        </p>
      </div>

      <div id={paymentMethodId} />

      <div id={agreementId} />

      {errorMessage ? (
        <p
          role="alert"
          style={{
            margin: '0 20px 14px',
            padding: '12px 14px',
            borderRadius: 13,
            background: '#fff0ed',
            color: '#9a332d',
            fontSize: 13,
            fontWeight: 800,
            lineHeight: 1.6,
          }}
        >
          {errorMessage}
        </p>
      ) : null}

      <div
        style={{
          padding: '0 20px 20px',
        }}
      >
        <button
          type="button"
          onClick={handlePayment}
          disabled={
            !isReady ||
            isPaying ||
            Boolean(errorMessage)
          }
          style={{
            width: '100%',
            minHeight: 52,
            border: 0,
            borderRadius: 15,
            background:
              isReady &&
              !isPaying &&
              !errorMessage
                ? '#3182f6'
                : '#b8c2cf',
            color: '#ffffff',
            fontSize: 16,
            fontWeight: 900,
            cursor:
              isReady &&
              !isPaying &&
              !errorMessage
                ? 'pointer'
                : 'not-allowed',
          }}
        >
          {isPaying
            ? '결제창 여는 중...'
            : isReady
              ? `${amount.toLocaleString()}원 결제하기`
              : '결제 화면 준비 중...'}
        </button>
      </div>
    </section>
  );
}