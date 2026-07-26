"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

type ProductType =
  | "DIGITAL_MANUSCRIPT"
  | "BASIC_SOFTCOVER"
  | "CUSTOM_BOOK";

type InitialOrder = {
  productType: ProductType;
  productName: string;
  specification: string | null;
  quantity: number;
  productAmount: number;
  shippingFee: number;
  totalAmount: number;
  status: string;
  orderId: string;
} | null;

type Props = {
  requestId: string;
  requestStatus: string;
  initialOrder?: InitialOrder;
};

type QuoteValues = {
  productType: ProductType;
  productName: string;
  specification: string;
  quantity: string;
  productAmount: string;
  shippingFee: string;
};

const PRODUCT_OPTIONS: ReadonlyArray<{
  value: ProductType;
  label: string;
  description: string;
  defaultName: string;
}> = [
  {
    value: "DIGITAL_MANUSCRIPT",
    label: "디지털 책 원고",
    description:
      "인쇄 없이 편집된 원고 파일을 전달합니다.",
    defaultName: "디지털 책 원고",
  },
  {
    value: "BASIC_SOFTCOVER",
    label: "기본 소프트커버",
    description:
      "기본 편집과 소프트커버 인쇄를 진행합니다.",
    defaultName: "기본 소프트커버 책 제작",
  },
  {
    value: "CUSTOM_BOOK",
    label: "맞춤형 책 제작",
    description:
      "페이지·제본·표지·검수를 맞춤 구성합니다.",
    defaultName: "맞춤형 책 제작",
  },
];

export default function OrderQuoteForm({
  requestId,
  requestStatus,
  initialOrder = null,
}: Props) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(
    Boolean(initialOrder),
  );

  const [values, setValues] =
    useState<QuoteValues>(() =>
      createQuoteValues(initialOrder),
    );

  const [savedValues, setSavedValues] =
    useState<QuoteValues>(() =>
      createQuoteValues(initialOrder),
    );

  const [isSaving, setIsSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [isError, setIsError] =
    useState(false);

  useEffect(() => {
    const nextValues =
      createQuoteValues(initialOrder);

    setValues(nextValues);
    setSavedValues(nextValues);
    setIsOpen(Boolean(initialOrder));
    setMessage("");
    setIsError(false);
  }, [initialOrder]);

  const disabled =
    requestStatus === "CANCELED" ||
    initialOrder?.status === "PAID" ||
    initialOrder?.status ===
      "PARTIALLY_REFUNDED" ||
    initialOrder?.status === "REFUNDED";

  const totalAmount = useMemo(() => {
    const product =
      Number(values.productAmount) || 0;

    const shipping =
      Number(values.shippingFee) || 0;

    return product + shipping;
  }, [
    values.productAmount,
    values.shippingFee,
  ]);

  const isDirty =
    JSON.stringify(values) !==
    JSON.stringify(savedValues);

  const handleProductTypeChange = (
    value: ProductType,
  ) => {
    const selected =
      PRODUCT_OPTIONS.find(
        (option) =>
          option.value === value,
      );

    setValues((current) => ({
      ...current,
      productType: value,
      productName:
        selected?.defaultName ||
        current.productName,
    }));

    setMessage("");
  };

  const updateValue = <
    Key extends keyof QuoteValues,
  >(
    key: Key,
    value: QuoteValues[Key],
  ) => {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));

    setMessage("");
  };

  const handleReset = () => {
    setValues(savedValues);
    setMessage("");
    setIsError(false);
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      disabled ||
      isSaving ||
      (initialOrder && !isDirty)
    ) {
      return;
    }

    setMessage("");
    setIsError(false);

    const cleanProductName =
      values.productName.trim();

    const cleanSpecification =
      values.specification.trim();

    const parsedQuantity =
      Number.parseInt(
        values.quantity,
        10,
      );

    const parsedProductAmount =
      Number.parseInt(
        values.productAmount,
        10,
      );

    const parsedShippingFee =
      Number.parseInt(
        values.shippingFee,
        10,
      );

    if (!cleanProductName) {
      setIsError(true);
      setMessage(
        "상품명을 입력해 주세요.",
      );
      return;
    }

    if (
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity < 1 ||
      parsedQuantity > 1000
    ) {
      setIsError(true);
      setMessage(
        "제작 수량은 1권 이상 1,000권 이하로 입력해 주세요.",
      );
      return;
    }

    if (
      !Number.isInteger(
        parsedProductAmount,
      ) ||
      parsedProductAmount < 0
    ) {
      setIsError(true);
      setMessage(
        "상품 금액을 확인해 주세요.",
      );
      return;
    }

    if (
      !Number.isInteger(
        parsedShippingFee,
      ) ||
      parsedShippingFee < 0
    ) {
      setIsError(true);
      setMessage(
        "배송비를 확인해 주세요.",
      );
      return;
    }

    const nextTotal =
      parsedProductAmount +
      parsedShippingFee;

    if (nextTotal < 100) {
      setIsError(true);
      setMessage(
        "최종 결제 금액은 100원 이상이어야 합니다.",
      );
      return;
    }

    const confirmed = window.confirm(
      [
        `${cleanProductName} 견적을 ${
          initialOrder
            ? "수정"
            : "등록"
        }할까요?`,
        "",
        `수량: ${parsedQuantity.toLocaleString()}권`,
        `상품 금액: ${parsedProductAmount.toLocaleString()}원`,
        `배송비: ${parsedShippingFee.toLocaleString()}원`,
        `최종 결제 금액: ${nextTotal.toLocaleString()}원`,
        "",
        "고객이 결제할 금액이므로 내용을 다시 확인해 주세요.",
      ].join("\n"),
    );

    if (!confirmed) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(
        `/api/admin/production-requests/${requestId}/order`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            productType:
              values.productType,
            productName:
              cleanProductName,
            specification:
              cleanSpecification,
            quantity:
              parsedQuantity,
            productAmount:
              parsedProductAmount,
            shippingFee:
              parsedShippingFee,
          }),
        },
      );

      const data = (await response
        .json()
        .catch(() => null)) as
        | {
            ok?: boolean;
            message?: string;
          }
        | null;

      if (!response.ok || !data?.ok) {
        throw new Error(
          data?.message ||
            "견적을 저장하지 못했습니다.",
        );
      }

      const nextSavedValues: QuoteValues = {
        ...values,
        productName:
          cleanProductName,
        specification:
          cleanSpecification,
        quantity: String(
          parsedQuantity,
        ),
        productAmount: String(
          parsedProductAmount,
        ),
        shippingFee: String(
          parsedShippingFee,
        ),
      };

      setValues(nextSavedValues);
      setSavedValues(nextSavedValues);
      setIsError(false);
      setMessage(
        data.message ||
          "제작 견적을 저장했습니다.",
      );

      router.refresh();
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "견적 저장 중 오류가 발생했습니다.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const orderStatus =
    initialOrder?.status || "NEW";

  return (
    <section
      className="admin-quote"
      data-open={isOpen}
      data-disabled={disabled}
    >
      <button
        type="button"
        className="admin-quote-toggle"
        onClick={() =>
          setIsOpen((current) =>
            !current,
          )
        }
        aria-expanded={isOpen}
      >
        <span className="admin-quote-toggle-copy">
          <span className="admin-quote-kicker">
            결제 전 최종 확인
          </span>

          <strong>
            제작 견적 및 결제 주문
          </strong>

          <small>
            {initialOrder
              ? `${initialOrder.totalAmount.toLocaleString()}원 · ${getOrderStatusLabel(
                  initialOrder.status,
                )}`
              : "상품, 제작 수량과 결제 금액을 등록합니다."}
          </small>
        </span>

        <span className="admin-quote-toggle-side">
          <span
            className="admin-quote-status"
            data-status={orderStatus}
          >
            {initialOrder
              ? getOrderStatusLabel(
                  initialOrder.status,
                )
              : "미등록"}
          </span>

          <ChevronIcon
            open={isOpen}
          />
        </span>
      </button>

      {isOpen ? (
        <form
          onSubmit={handleSubmit}
          className="admin-quote-form"
        >
          {initialOrder ? (
            <div className="admin-quote-order-number">
              <span>주문번호</span>
              <strong>
                {initialOrder.orderId}
              </strong>
            </div>
          ) : (
            <div className="admin-quote-guide">
              <span aria-hidden="true">
                01
              </span>

              <p>
                고객과 협의한 상품과 금액을
                정확히 입력한 뒤 견적을
                등록하세요.
              </p>
            </div>
          )}

          <fieldset
            className="admin-quote-products"
            disabled={disabled}
          >
            <legend>상품 종류</legend>

            <div>
              {PRODUCT_OPTIONS.map(
                (option) => {
                  const selected =
                    values.productType ===
                    option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        handleProductTypeChange(
                          option.value,
                        )
                      }
                      aria-pressed={
                        selected
                      }
                      data-selected={
                        selected
                      }
                    >
                      <span
                        className="admin-quote-product-check"
                        aria-hidden="true"
                      >
                        {selected
                          ? "✓"
                          : ""}
                      </span>

                      <strong>
                        {option.label}
                      </strong>

                      <small>
                        {option.description}
                      </small>
                    </button>
                  );
                },
              )}
            </div>
          </fieldset>

          <div className="admin-quote-field-grid admin-quote-field-grid-main">
            <Field label="상품명">
              <input
                type="text"
                value={values.productName}
                onChange={(event) =>
                  updateValue(
                    "productName",
                    event.target.value,
                  )
                }
                maxLength={100}
                disabled={disabled}
                required
              />
            </Field>

            <Field
              label="제작 수량"
              hint="1권 이상"
            >
              <div className="admin-quote-input-unit">
                <input
                  type="number"
                  value={values.quantity}
                  onChange={(event) =>
                    updateValue(
                      "quantity",
                      event.target.value,
                    )
                  }
                  min={1}
                  max={1000}
                  step={1}
                  disabled={disabled}
                  required
                />

                <span>권</span>
              </div>
            </Field>
          </div>

          <div className="admin-quote-amounts">
            <Field label="상품 금액">
              <div className="admin-quote-input-unit">
                <input
                  type="number"
                  value={
                    values.productAmount
                  }
                  onChange={(event) =>
                    updateValue(
                      "productAmount",
                      event.target.value,
                    )
                  }
                  min={0}
                  max={100000000}
                  step={1}
                  placeholder="예: 99000"
                  disabled={disabled}
                  required
                />

                <span>원</span>
              </div>
            </Field>

            <span
              className="admin-quote-plus"
              aria-hidden="true"
            >
              +
            </span>

            <Field label="배송비">
              <div className="admin-quote-input-unit">
                <input
                  type="number"
                  value={values.shippingFee}
                  onChange={(event) =>
                    updateValue(
                      "shippingFee",
                      event.target.value,
                    )
                  }
                  min={0}
                  max={10000000}
                  step={1}
                  disabled={disabled}
                  required
                />

                <span>원</span>
              </div>
            </Field>

            <span
              className="admin-quote-equals"
              aria-hidden="true"
            >
              =
            </span>

            <div className="admin-quote-total">
              <span>최종 결제 금액</span>
              <strong>
                {totalAmount.toLocaleString()}
                <small>원</small>
              </strong>
            </div>
          </div>

          <Field
            label="제작 사양"
            hint={`${values.specification.length.toLocaleString()} / 2,000자`}
          >
            <textarea
              value={values.specification}
              onChange={(event) =>
                updateValue(
                  "specification",
                  event.target.value,
                )
              }
              maxLength={2000}
              rows={5}
              placeholder="페이지 수, 제본 방식, 표지, 용지, 추가 검수, 배송 조건 등을 입력하세요."
              disabled={disabled}
            />
          </Field>

          {disabled ? (
            <div
              className="admin-quote-alert"
              data-tone="warning"
              role="status"
            >
              <AlertIcon />

              <p>
                취소되었거나 결제가 처리된
                주문은 견적을 수정할 수
                없습니다.
              </p>
            </div>
          ) : null}

          {message ? (
            <div
              className="admin-quote-alert"
              data-tone={
                isError
                  ? "error"
                  : "success"
              }
              role={
                isError
                  ? "alert"
                  : "status"
              }
            >
              {isError ? (
                <AlertIcon />
              ) : (
                <CheckIcon />
              )}

              <p>{message}</p>
            </div>
          ) : null}

          <div className="admin-quote-footer">
            <span
              className="admin-quote-change-state"
              data-dirty={isDirty}
            >
              {isDirty
                ? "저장하지 않은 변경사항이 있습니다."
                : initialOrder
                  ? "현재 견적이 저장되어 있습니다."
                  : "금액을 입력하면 견적을 등록할 수 있습니다."}
            </span>

            <div>
              <button
                type="button"
                className="admin-quote-reset"
                onClick={handleReset}
                disabled={
                  disabled ||
                  isSaving ||
                  !isDirty
                }
              >
                변경 취소
              </button>

              <button
                type="submit"
                className="admin-quote-save"
                disabled={
                  disabled ||
                  isSaving ||
                  Boolean(
                    initialOrder &&
                      !isDirty,
                  )
                }
              >
                {isSaving ? (
                  <>
                    <span className="admin-quote-spinner" />
                    저장 중...
                  </>
                ) : initialOrder ? (
                  isDirty
                    ? "제작 견적 수정"
                    : "변경사항 없음"
                ) : (
                  "제작 견적 등록"
                )}
              </button>
            </div>
          </div>
        </form>
      ) : null}

      <style>{quoteStyles}</style>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="admin-quote-field">
      <span className="admin-quote-field-label">
        <strong>{label}</strong>
        {hint ? <small>{hint}</small> : null}
      </span>

      {children}
    </label>
  );
}

function ChevronIcon({
  open,
}: {
  open: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      data-open={open}
    >
      <path
        d="m7 10 5 5 5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 3 2.8 19h18.4L12 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 9v4.5M12 17h.01"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="m8 12.5 2.5 2.5L16.5 9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function createQuoteValues(
  initialOrder: InitialOrder,
): QuoteValues {
  return {
    productType:
      initialOrder?.productType ||
      "BASIC_SOFTCOVER",
    productName:
      initialOrder?.productName ||
      "기본 소프트커버 책 제작",
    specification:
      initialOrder?.specification || "",
    quantity: String(
      initialOrder?.quantity || 1,
    ),
    productAmount: initialOrder
      ? String(initialOrder.productAmount)
      : "",
    shippingFee: initialOrder
      ? String(initialOrder.shippingFee)
      : "0",
  };
}

function getOrderStatusLabel(
  status: string,
) {
  if (status === "READY") {
    return "견적 확정";
  }

  if (status === "PAYMENT_PENDING") {
    return "결제 진행 중";
  }

  if (status === "PAID") {
    return "결제 완료";
  }

  if (
    status === "PARTIALLY_REFUNDED"
  ) {
    return "부분 환불";
  }

  if (status === "REFUNDED") {
    return "환불 완료";
  }

  if (status === "CANCELED") {
    return "주문 취소";
  }

  if (status === "FAILED") {
    return "결제 실패";
  }

  return "상태 확인 필요";
}

const quoteStyles = `
  .admin-quote,
  .admin-quote * {
    box-sizing: border-box;
  }

  .admin-quote {
    overflow: hidden;
    border: 1px solid #ead8ce;
    border-radius: 17px;
    background:
      linear-gradient(
        145deg,
        #fffdfb,
        #fff8f3
      );
    box-shadow:
      0 12px 30px
      rgba(91, 60, 45, 0.06);
  }

  .admin-quote-toggle {
    width: 100%;
    padding: 15px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    border: 0;
    color: #4c352b;
    background: transparent;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .admin-quote-toggle-copy {
    min-width: 0;
    display: grid;
    gap: 4px;
  }

  .admin-quote-kicker {
    color: #e26853;
    font-size: 8px;
    font-weight: 900;
    letter-spacing: 0.04em;
  }

  .admin-quote-toggle-copy strong {
    font-size: 13px;
    line-height: 1.4;
  }

  .admin-quote-toggle-copy small {
    overflow: hidden;
    color: #836e64;
    font-size: 9px;
    line-height: 1.5;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .admin-quote-toggle-side {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 0 0 auto;
  }

  .admin-quote-status {
    min-height: 27px;
    padding: 0 9px;
    display: inline-flex;
    align-items: center;
    border: 1px solid #e4cfc3;
    border-radius: 999px;
    color: #7a5d50;
    background: #ffffff;
    font-size: 8px;
    font-weight: 900;
    white-space: nowrap;
  }

  .admin-quote-status[data-status="PAID"] {
    border-color: #8fbea0;
    color: #39714c;
    background: #edf8f0;
  }

  .admin-quote-status[data-status="PAYMENT_PENDING"] {
    border-color: #d9b46d;
    color: #805a1e;
    background: #fff6df;
  }

  .admin-quote-status[data-status="REFUNDED"],
  .admin-quote-status[data-status="PARTIALLY_REFUNDED"],
  .admin-quote-status[data-status="CANCELED"],
  .admin-quote-status[data-status="FAILED"] {
    border-color: #d9a7a0;
    color: #934a42;
    background: #fff0ee;
  }

  .admin-quote-toggle-side svg {
    width: 19px;
    height: 19px;
    transition: transform 160ms ease;
  }

  .admin-quote-toggle-side svg[data-open="true"] {
    transform: rotate(180deg);
  }

  .admin-quote-form {
    padding: 0 16px 17px;
    display: grid;
    gap: 14px;
    border-top: 1px solid #f0e2da;
  }

  .admin-quote-order-number,
  .admin-quote-guide {
    margin-top: 14px;
    min-width: 0;
    padding: 11px 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    border-radius: 12px;
    background: #fff2e9;
  }

  .admin-quote-order-number {
    justify-content: space-between;
  }

  .admin-quote-order-number span,
  .admin-quote-guide span {
    color: #d65f4c;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-quote-order-number strong {
    min-width: 0;
    overflow: hidden;
    color: #62483d;
    font-size: 9px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .admin-quote-guide span {
    width: 31px;
    height: 31px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border-radius: 10px;
    color: #ffffff;
    background: #ee705b;
  }

  .admin-quote-guide p {
    margin: 0;
    color: #765f55;
    font-size: 9px;
    line-height: 1.65;
    word-break: keep-all;
  }

  .admin-quote-products {
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }

  .admin-quote-products legend,
  .admin-quote-field-label strong {
    color: #5c4136;
    font-size: 9px;
    font-weight: 900;
  }

  .admin-quote-products > div {
    margin-top: 7px;
    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
    gap: 7px;
  }

  .admin-quote-products button {
    min-width: 0;
    min-height: 84px;
    padding: 11px;
    display: grid;
    align-content: start;
    gap: 5px;
    border: 1px solid #e7d6ce;
    border-radius: 12px;
    color: #654c41;
    background: #ffffff;
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition:
      transform 150ms ease,
      border-color 150ms ease,
      box-shadow 150ms ease;
  }

  .admin-quote-products button:hover:not(:disabled) {
    transform: translateY(-1px);
    border-color: #e99a88;
  }

  .admin-quote-products button[data-selected="true"] {
    border-color: #ef7a64;
    background:
      linear-gradient(
        145deg,
        #fff5f0,
        #ffffff
      );
    box-shadow:
      0 8px 18px
      rgba(222, 99, 78, 0.09);
  }

  .admin-quote-product-check {
    width: 20px;
    height: 20px;
    display: grid;
    place-items: center;
    border: 1px solid #dbc8bf;
    border-radius: 7px;
    color: #ffffff;
    background: #ffffff;
    font-size: 10px;
    font-weight: 900;
  }

  .admin-quote-products button[data-selected="true"]
  .admin-quote-product-check {
    border-color: #ef705a;
    background: #ef705a;
  }

  .admin-quote-products button strong {
    font-size: 9px;
    line-height: 1.4;
  }

  .admin-quote-products button small {
    color: #8a756b;
    font-size: 8px;
    line-height: 1.5;
    word-break: keep-all;
  }

  .admin-quote-field-grid {
    display: grid;
    gap: 9px;
  }

  .admin-quote-field-grid-main {
    grid-template-columns:
      minmax(0, 1.4fr)
      minmax(110px, 0.6fr);
  }

  .admin-quote-field {
    min-width: 0;
    display: grid;
    gap: 6px;
  }

  .admin-quote-field-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .admin-quote-field-label small {
    color: #9a867d;
    font-size: 7px;
  }

  .admin-quote input,
  .admin-quote textarea {
    width: 100%;
    min-width: 0;
    min-height: 40px;
    padding: 9px 10px;
    border: 1px solid #dbc8bf;
    border-radius: 10px;
    color: #45322a;
    background: #ffffff;
    font: inherit;
    font-size: 10px;
  }

  .admin-quote textarea {
    min-height: 94px;
    resize: vertical;
    line-height: 1.65;
  }

  .admin-quote input:disabled,
  .admin-quote textarea:disabled,
  .admin-quote-products:disabled button {
    color: #9b8d86;
    background: #f3efed;
    cursor: not-allowed;
  }

  .admin-quote-input-unit {
    position: relative;
  }

  .admin-quote-input-unit input {
    padding-right: 31px;
  }

  .admin-quote-input-unit > span {
    position: absolute;
    top: 50%;
    right: 10px;
    color: #8f7a70;
    font-size: 8px;
    font-weight: 900;
    transform: translateY(-50%);
    pointer-events: none;
  }

  .admin-quote-amounts {
    padding: 12px;
    display: grid;
    grid-template-columns:
      minmax(0, 1fr)
      18px
      minmax(0, 0.8fr)
      18px
      minmax(135px, 0.95fr);
    align-items: end;
    gap: 7px;
    border: 1px solid #ead8ce;
    border-radius: 13px;
    background: #fffaf7;
  }

  .admin-quote-plus,
  .admin-quote-equals {
    min-height: 40px;
    display: grid;
    place-items: center;
    color: #b49c90;
    font-size: 14px;
    font-weight: 900;
  }

  .admin-quote-total {
    min-height: 62px;
    padding: 9px 11px;
    display: grid;
    align-content: center;
    gap: 3px;
    border-radius: 11px;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #4c352c,
        #2f211b
      );
  }

  .admin-quote-total > span {
    color:
      rgba(255, 255, 255, 0.7);
    font-size: 7px;
  }

  .admin-quote-total strong {
    font-size: 15px;
    line-height: 1.2;
  }

  .admin-quote-total small {
    margin-left: 2px;
    font-size: 8px;
  }

  .admin-quote-alert {
    padding: 11px 12px;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    border: 1px solid;
    border-radius: 11px;
  }

  .admin-quote-alert svg {
    width: 15px;
    height: 15px;
    flex: 0 0 auto;
  }

  .admin-quote-alert p {
    margin: 0;
    font-size: 9px;
    font-weight: 800;
    line-height: 1.55;
  }

  .admin-quote-alert[data-tone="warning"] {
    border-color: #e5c07a;
    color: #805c22;
    background: #fff6df;
  }

  .admin-quote-alert[data-tone="error"] {
    border-color: #dda7a0;
    color: #9a493f;
    background: #fff0ee;
  }

  .admin-quote-alert[data-tone="success"] {
    border-color: #9bc0a8;
    color: #3b724e;
    background: #edf8f0;
  }

  .admin-quote-footer {
    padding-top: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    border-top: 1px solid #eee0d8;
  }

  .admin-quote-change-state {
    color: #8a756b;
    font-size: 8px;
    line-height: 1.45;
  }

  .admin-quote-change-state[data-dirty="true"] {
    color: #bc5d4c;
    font-weight: 900;
  }

  .admin-quote-footer > div {
    display: flex;
    align-items: center;
    gap: 7px;
    flex: 0 0 auto;
  }

  .admin-quote-reset,
  .admin-quote-save {
    min-height: 37px;
    padding: 0 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border-radius: 10px;
    font: inherit;
    font-size: 8px;
    font-weight: 900;
    cursor: pointer;
  }

  .admin-quote-reset {
    border: 1px solid #d8c3b9;
    color: #76584c;
    background: #ffffff;
  }

  .admin-quote-save {
    border: 1px solid transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #f07560,
        #dd5947
      );
    box-shadow:
      0 8px 18px
      rgba(221, 89, 71, 0.16);
  }

  .admin-quote-reset:disabled,
  .admin-quote-save:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
  }

  .admin-quote-spinner {
    width: 12px;
    height: 12px;
    border: 2px solid
      rgba(255, 255, 255, 0.36);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation:
      admin-quote-spin
      700ms linear infinite;
  }

  @keyframes admin-quote-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 720px) {
    .admin-quote-products > div {
      grid-template-columns: 1fr;
    }

    .admin-quote-field-grid-main {
      grid-template-columns: 1fr;
    }

    .admin-quote-amounts {
      grid-template-columns: 1fr;
      align-items: stretch;
    }

    .admin-quote-plus,
    .admin-quote-equals {
      min-height: 18px;
    }

    .admin-quote-footer {
      align-items: stretch;
      flex-direction: column;
    }

    .admin-quote-footer > div {
      width: 100%;
    }

    .admin-quote-reset,
    .admin-quote-save {
      flex: 1 1 0;
    }
  }

  @media (max-width: 430px) {
    .admin-quote-toggle {
      align-items: flex-start;
    }

    .admin-quote-status {
      display: none;
    }

    .admin-quote-form {
      padding-right: 12px;
      padding-left: 12px;
    }

    .admin-quote-footer > div {
      flex-direction: column;
    }

    .admin-quote-reset,
    .admin-quote-save {
      width: 100%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .admin-quote-toggle-side svg,
    .admin-quote-products button {
      transition: none;
    }

    .admin-quote-spinner {
      animation: none;
    }
  }
`;
