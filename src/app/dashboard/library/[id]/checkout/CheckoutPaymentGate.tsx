"use client";

import TossPaymentWidget from "@/components/payment/TossPaymentWidget";
import { useState } from "react";

type Props = {
  bookId: string;
  orderId: string;
  orderName: string;
  amount: number;
  customerKey: string;
  customerName: string;
  customerEmail: string;
  customerMobilePhone: string;
};

export default function CheckoutPaymentGate({
  bookId,
  orderId,
  orderName,
  amount,
  customerKey,
  customerName,
  customerEmail,
  customerMobilePhone,
}: Props) {
  const [confirmed, setConfirmed] =
    useState(false);

  return (
    <section className="checkout-payment-gate">
      <style>{checkoutPaymentGateStyles}</style>

      <label className="checkout-payment-confirmation">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) =>
            setConfirmed(
              event.target.checked,
            )
          }
        />

        <span>
          주문 내용과 최종 결제금액{" "}
          <strong>
            {amount.toLocaleString()}원
          </strong>
          을 확인했습니다.
        </span>
      </label>

      {!confirmed ? (
        <div className="checkout-payment-locked">
          <strong>
            확인란을 선택하면 결제창이
            열립니다.
          </strong>

          <p>
            결제 전 주문번호와 금액을
            다시 확인해 주세요.
          </p>
        </div>
      ) : (
        <div className="checkout-payment-widget-wrap">
          <TossPaymentWidget
            bookId={bookId}
            orderId={orderId}
            orderName={orderName}
            amount={amount}
            customerKey={customerKey}
            customerName={customerName}
            customerEmail={customerEmail}
            customerMobilePhone={
              customerMobilePhone
            }
          />
        </div>
      )}
    </section>
  );
}

const checkoutPaymentGateStyles = `
  .checkout-payment-confirmation {
    min-height: 58px;
    padding: 14px 17px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 11px;
    border:
      1px solid
      rgba(140, 98, 77, 0.19);
    border-radius: 14px;
    background: #fffdfb;
    cursor: pointer;
  }

  .checkout-payment-confirmation input {
    width: 21px;
    height: 21px;
    flex: 0 0 auto;
    accent-color: #ed654f;
  }

  .checkout-payment-confirmation span {
    color: #604b42;
    font-size: 13px;
    line-height: 1.6;
  }

  .checkout-payment-confirmation strong {
    color: #ec614c;
  }

  .checkout-payment-locked {
    margin-top: 13px;
    padding: 22px;
    border:
      1px dashed #dfb2a1;
    border-radius: 15px;
    background: #fff7f2;
    text-align: center;
  }

  .checkout-payment-locked strong {
    display: block;
    font-size: 14px;
  }

  .checkout-payment-locked p {
    margin: 6px 0 0;
    color: #826e64;
    font-size: 11px;
  }

  .checkout-payment-widget-wrap {
    margin-top: 15px;
  }

  .checkout-payment-widget-wrap > * {
    max-width: 100%;
  }

  @media (max-width: 620px) {
    .checkout-payment-confirmation {
      align-items: flex-start;
      justify-content: flex-start;
    }
  }
`;
