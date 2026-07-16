'use client';

import {
  FormEvent,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';

type ProductType =
  | 'DIGITAL_MANUSCRIPT'
  | 'BASIC_SOFTCOVER'
  | 'CUSTOM_BOOK';

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

const PRODUCT_OPTIONS: {
  value: ProductType;
  label: string;
  defaultName: string;
}[] = [
  {
    value: 'DIGITAL_MANUSCRIPT',
    label: '디지털 책 원고',
    defaultName: '디지털 책 원고',
  },
  {
    value: 'BASIC_SOFTCOVER',
    label: '기본 소프트커버',
    defaultName: '기본 소프트커버 책 제작',
  },
  {
    value: 'CUSTOM_BOOK',
    label: '맞춤형 책 제작',
    defaultName: '맞춤형 책 제작',
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

  const [productType, setProductType] =
    useState<ProductType>(
      initialOrder?.productType ||
        'BASIC_SOFTCOVER',
    );

  const [productName, setProductName] =
    useState(
      initialOrder?.productName ||
        '기본 소프트커버 책 제작',
    );

  const [specification, setSpecification] =
    useState(
      initialOrder?.specification || '',
    );

  const [quantity, setQuantity] = useState(
    String(initialOrder?.quantity || 1),
  );

  const [
    productAmount,
    setProductAmount,
  ] = useState(
    initialOrder
      ? String(initialOrder.productAmount)
      : '',
  );

  const [shippingFee, setShippingFee] =
    useState(
      initialOrder
        ? String(initialOrder.shippingFee)
        : '0',
    );

  const [isSaving, setIsSaving] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const [isError, setIsError] =
    useState(false);

  const disabled =
    requestStatus === 'CANCELED' ||
    initialOrder?.status === 'PAID' ||
    initialOrder?.status ===
      'PARTIALLY_REFUNDED' ||
    initialOrder?.status === 'REFUNDED';

  const totalAmount = useMemo(() => {
    const product =
      Number(productAmount) || 0;

    const shipping =
      Number(shippingFee) || 0;

    return product + shipping;
  }, [productAmount, shippingFee]);

  const handleProductTypeChange = (
    value: ProductType,
  ) => {
    setProductType(value);

    const selected =
      PRODUCT_OPTIONS.find(
        (option) =>
          option.value === value,
      );

    if (selected) {
      setProductName(
        selected.defaultName,
      );
    }
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (disabled || isSaving) {
      return;
    }

    setMessage('');
    setIsError(false);

    const parsedQuantity =
      Number.parseInt(quantity, 10);

    const parsedProductAmount =
      Number.parseInt(productAmount, 10);

    const parsedShippingFee =
      Number.parseInt(shippingFee, 10);

    if (
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity < 1
    ) {
      setIsError(true);
      setMessage(
        '제작 수량을 확인해 주세요.',
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
        '상품 금액을 확인해 주세요.',
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
        '배송비를 확인해 주세요.',
      );
      return;
    }

    if (
      parsedProductAmount +
        parsedShippingFee <
      100
    ) {
      setIsError(true);
      setMessage(
        '최종 결제 금액은 100원 이상이어야 합니다.',
      );
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(
        `/api/admin/production-requests/${requestId}/order`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            productType,
            productName:
              productName.trim(),
            specification:
              specification.trim(),
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
            '견적을 저장하지 못했습니다.',
        );
      }

      setIsError(false);
      setMessage(
        data.message ||
          '제작 견적을 저장했습니다.',
      );

      router.refresh();
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : '견적 저장 중 오류가 발생했습니다.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section
      style={{
        marginTop: 14,
        borderRadius: 18,
        border:
          '1px solid rgba(111, 71, 30, 0.22)',
        background:
          'rgba(255, 248, 233, 0.9)',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() =>
          setIsOpen((value) => !value)
        }
        style={{
          width: '100%',
          border: 0,
          background: 'transparent',
          padding: '15px 17px',
          display: 'flex',
          alignItems: 'center',
          justifyContent:
            'space-between',
          gap: 12,
          cursor: 'pointer',
          textAlign: 'left',
          color: 'var(--ink)',
        }}
      >
        <span>
          <strong
            style={{
              display: 'block',
              fontSize: 15,
            }}
          >
            제작 견적 및 결제 주문
          </strong>

          <span
            style={{
              display: 'block',
              marginTop: 4,
              color:
                'var(--ink-soft)',
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            {initialOrder
              ? `${initialOrder.totalAmount.toLocaleString()}원 · ${getOrderStatusLabel(initialOrder.status)}`
              : '상품과 최종 결제 금액을 등록합니다.'}
          </span>
        </span>

        <span
          aria-hidden="true"
          style={{
            fontSize: 18,
            fontWeight: 900,
          }}
        >
          {isOpen ? '−' : '+'}
        </span>
      </button>

      {isOpen ? (
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '0 17px 17px',
          }}
        >
          {initialOrder ? (
            <div
              style={{
                marginBottom: 14,
                padding: 12,
                borderRadius: 13,
                background:
                  'rgba(111, 71, 30, 0.08)',
                color:
                  'var(--ink-soft)',
                fontSize: 12,
                lineHeight: 1.65,
              }}
            >
              주문번호:{' '}
              <strong>
                {initialOrder.orderId}
              </strong>
            </div>
          ) : null}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(190px, 1fr))',
              gap: 12,
            }}
          >
            <label style={fieldStyle}>
              <span style={labelStyle}>
                상품 종류
              </span>

              <select
                value={productType}
                onChange={(event) =>
                  handleProductTypeChange(
                    event.target
                      .value as ProductType,
                  )
                }
                disabled={disabled}
                style={inputStyle}
              >
                {PRODUCT_OPTIONS.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>
                상품명
              </span>

              <input
                type="text"
                value={productName}
                onChange={(event) =>
                  setProductName(
                    event.target.value,
                  )
                }
                maxLength={100}
                disabled={disabled}
                required
                style={inputStyle}
              />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>
                제작 수량
              </span>

              <input
                type="number"
                value={quantity}
                onChange={(event) =>
                  setQuantity(
                    event.target.value,
                  )
                }
                min={1}
                max={1000}
                step={1}
                disabled={disabled}
                required
                style={inputStyle}
              />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>
                상품 금액
              </span>

              <input
                type="number"
                value={productAmount}
                onChange={(event) =>
                  setProductAmount(
                    event.target.value,
                  )
                }
                min={0}
                max={100000000}
                step={1}
                placeholder="예: 99000"
                disabled={disabled}
                required
                style={inputStyle}
              />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>
                배송비
              </span>

              <input
                type="number"
                value={shippingFee}
                onChange={(event) =>
                  setShippingFee(
                    event.target.value,
                  )
                }
                min={0}
                max={10000000}
                step={1}
                disabled={disabled}
                required
                style={inputStyle}
              />
            </label>
          </div>

          <label
            style={{
              ...fieldStyle,
              marginTop: 12,
            }}
          >
            <span style={labelStyle}>
              제작 사양
            </span>

            <textarea
              value={specification}
              onChange={(event) =>
                setSpecification(
                  event.target.value,
                )
              }
              maxLength={2000}
              rows={5}
              placeholder="페이지 수, 제본 방식, 표지, 용지, 추가 검수, 배송 조건 등을 입력하세요."
              disabled={disabled}
              style={{
                ...inputStyle,
                resize: 'vertical',
                lineHeight: 1.65,
              }}
            />
          </label>

          <div
            style={{
              marginTop: 14,
              padding: 15,
              borderRadius: 15,
              background: '#2d2119',
              color: '#fffaf0',
              display: 'flex',
              alignItems: 'center',
              justifyContent:
                'space-between',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              최종 결제 금액
            </span>

            <strong
              style={{
                fontSize: 22,
              }}
            >
              {totalAmount.toLocaleString()}
              원
            </strong>
          </div>

          {disabled ? (
            <p
              style={{
                margin: '12px 0 0',
                color: '#8c3d35',
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              취소되었거나 결제가 처리된 주문은
              견적을 수정할 수 없습니다.
            </p>
          ) : null}

          {message ? (
            <p
              style={{
                margin: '12px 0 0',
                color: isError
                  ? '#a1332d'
                  : '#2f6b38',
                fontSize: 13,
                fontWeight: 800,
                lineHeight: 1.6,
              }}
            >
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={disabled || isSaving}
            style={{
              width: '100%',
              marginTop: 14,
              minHeight: 46,
              border: 0,
              borderRadius: 13,
              background:
                disabled || isSaving
                  ? '#b8aa98'
                  : '#6e421d',
              color: '#fffaf0',
              fontSize: 14,
              fontWeight: 900,
              cursor:
                disabled || isSaving
                  ? 'not-allowed'
                  : 'pointer',
            }}
          >
            {isSaving
              ? '저장 중...'
              : initialOrder
                ? '제작 견적 수정'
                : '제작 견적 등록'}
          </button>
        </form>
      ) : null}
    </section>
  );
}

const fieldStyle = {
  display: 'grid',
  gap: 6,
} as const;

const labelStyle = {
  color: 'var(--ink-soft)',
  fontSize: 12,
  fontWeight: 900,
} as const;

const inputStyle = {
  width: '100%',
  minHeight: 43,
  boxSizing: 'border-box',
  borderRadius: 11,
  border:
    '1px solid rgba(34, 28, 22, 0.18)',
  background: '#fffdf8',
  padding: '10px 11px',
  color: 'var(--ink)',
  fontFamily: 'inherit',
  fontSize: 14,
} as const;

function getOrderStatusLabel(
  status: string,
) {
  if (status === 'READY') {
    return '견적 확정';
  }

  if (status === 'PAYMENT_PENDING') {
    return '결제 진행 중';
  }

  if (status === 'PAID') {
    return '결제 완료';
  }

  if (
    status === 'PARTIALLY_REFUNDED'
  ) {
    return '부분 환불';
  }

  if (status === 'REFUNDED') {
    return '환불 완료';
  }

  if (status === 'CANCELED') {
    return '주문 취소';
  }

  if (status === 'FAILED') {
    return '결제 실패';
  }

  return '상태 확인 필요';
}