'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const PRODUCTION_STAGE_OPTIONS = [
  {
    value: 'PREPARING',
    label: '제작 준비',
  },
  {
    value: 'MANUSCRIPT_RECEIVED',
    label: '원고 접수',
  },
  {
    value: 'REVIEWING',
    label: '원고 검토',
  },
  {
    value: 'PROOFING',
    label: '교정 진행',
  },
  {
    value: 'PROOF_SENT',
    label: '교정본 전달',
  },
  {
    value: 'PROOF_APPROVED',
    label: '교정 승인',
  },
  {
    value: 'PRINT_ORDERED',
    label: '인쇄 발주',
  },
  {
    value: 'PRINTING',
    label: '인쇄 진행',
  },
  {
    value: 'SHIPPING_PREPARATION',
    label: '배송 준비',
  },
  {
    value: 'SHIPPED',
    label: '배송 중',
  },
  {
    value: 'COMPLETED',
    label: '제작 완료',
  },
  {
    value: 'ON_HOLD',
    label: '제작 보류',
  },
] as const;

type ProductionStage =
  (typeof PRODUCTION_STAGE_OPTIONS)[number]['value'];

type InitialProductionOrder = {
  productionStage: string;
  productionStageUpdatedAt:
    | Date
    | string;
  manuscriptReceivedAt:
    | Date
    | string
    | null;
  reviewStartedAt:
    | Date
    | string
    | null;
  proofFileUrl: string | null;
  proofSentAt:
    | Date
    | string
    | null;
  proofApprovedAt:
    | Date
    | string
    | null;
  printOrderedAt:
    | Date
    | string
    | null;
  printingCompletedAt:
    | Date
    | string
    | null;
  recipientName: string | null;
  recipientPhone: string | null;
  postalCode: string | null;
  shippingAddress1: string | null;
  shippingAddress2: string | null;
  shippingMemo: string | null;
  shippingCarrier: string | null;
  trackingNumber: string | null;
  shippedAt:
    | Date
    | string
    | null;
  completedAt:
    | Date
    | string
    | null;
  productionNote: string | null;
};

type Props = {
  requestId: string;
  initialOrder:
    | InitialProductionOrder
    | null;
};

export default function ProductionManagementForm({
  requestId,
  initialOrder,
}: Props) {
  const router = useRouter();

  const [isOpen, setIsOpen] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const [productionStage, setProductionStage] =
    useState<ProductionStage>(
      normalizeProductionStage(
        initialOrder?.productionStage,
      ),
    );

  const [
    manuscriptReceivedAt,
    setManuscriptReceivedAt,
  ] = useState(
    toDateTimeLocalValue(
      initialOrder?.manuscriptReceivedAt,
    ),
  );

  const [
    reviewStartedAt,
    setReviewStartedAt,
  ] = useState(
    toDateTimeLocalValue(
      initialOrder?.reviewStartedAt,
    ),
  );

  const [proofFileUrl, setProofFileUrl] =
    useState(
      initialOrder?.proofFileUrl ?? '',
    );

  const [proofSentAt, setProofSentAt] =
    useState(
      toDateTimeLocalValue(
        initialOrder?.proofSentAt,
      ),
    );

  const [
    proofApprovedAt,
    setProofApprovedAt,
  ] = useState(
    toDateTimeLocalValue(
      initialOrder?.proofApprovedAt,
    ),
  );

  const [
    printOrderedAt,
    setPrintOrderedAt,
  ] = useState(
    toDateTimeLocalValue(
      initialOrder?.printOrderedAt,
    ),
  );

  const [
    printingCompletedAt,
    setPrintingCompletedAt,
  ] = useState(
    toDateTimeLocalValue(
      initialOrder?.printingCompletedAt,
    ),
  );

  const [
    recipientName,
    setRecipientName,
  ] = useState(
    initialOrder?.recipientName ?? '',
  );

  const [
    recipientPhone,
    setRecipientPhone,
  ] = useState(
    initialOrder?.recipientPhone ?? '',
  );

  const [postalCode, setPostalCode] =
    useState(
      initialOrder?.postalCode ?? '',
    );

  const [
    shippingAddress1,
    setShippingAddress1,
  ] = useState(
    initialOrder?.shippingAddress1 ?? '',
  );

  const [
    shippingAddress2,
    setShippingAddress2,
  ] = useState(
    initialOrder?.shippingAddress2 ?? '',
  );

  const [
    shippingMemo,
    setShippingMemo,
  ] = useState(
    initialOrder?.shippingMemo ?? '',
  );

  const [
    shippingCarrier,
    setShippingCarrier,
  ] = useState(
    initialOrder?.shippingCarrier ?? '',
  );

  const [
    trackingNumber,
    setTrackingNumber,
  ] = useState(
    initialOrder?.trackingNumber ?? '',
  );

  const [shippedAt, setShippedAt] =
    useState(
      toDateTimeLocalValue(
        initialOrder?.shippedAt,
      ),
    );

  const [completedAt, setCompletedAt] =
    useState(
      toDateTimeLocalValue(
        initialOrder?.completedAt,
      ),
    );

  const [
    productionNote,
    setProductionNote,
  ] = useState(
    initialOrder?.productionNote ?? '',
  );

  const currentStageLabel = useMemo(
    () =>
      getProductionStageLabel(
        productionStage,
      ),
    [productionStage],
  );

  if (!initialOrder) {
    return (
      <section style={emptySectionStyle}>
        <strong>
          출판 제작 관리
        </strong>

        <p style={emptyTextStyle}>
          제작 견적과 결제 주문을 먼저
          등록하면 제작 진행 정보를 관리할
          수 있습니다.
        </p>
      </section>
    );
  }

  const handleSave = async () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setMessage('');

    try {
      const response = await fetch(
        `/api/admin/production-requests/${requestId}/production`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            productionStage,
            manuscriptReceivedAt,
            reviewStartedAt,
            proofFileUrl,
            proofSentAt,
            proofApprovedAt,
            printOrderedAt,
            printingCompletedAt,
            recipientName,
            recipientPhone,
            postalCode,
            shippingAddress1,
            shippingAddress2,
            shippingMemo,
            shippingCarrier,
            trackingNumber,
            shippedAt,
            completedAt,
            productionNote,
          }),
        },
      );

      const data =
        (await response
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
            '제작 정보를 저장하지 못했습니다.',
        );
      }

      setMessage(
        data.message ||
          '제작 정보를 저장했습니다.',
      );

      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : '제작 정보 저장 중 오류가 발생했습니다.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section style={sectionStyle}>
      <button
        type="button"
        onClick={() =>
          setIsOpen((current) => !current)
        }
        style={toggleButtonStyle}
      >
        <span>
          <strong>
            출판 제작 관리
          </strong>

          <small style={stageSummaryStyle}>
            현재 단계: {currentStageLabel}
          </small>
        </span>

        <span aria-hidden="true">
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen ? (
        <div style={contentStyle}>
          <div style={fieldGridStyle}>
            <Field label="제작 진행 단계">
              <select
                value={productionStage}
                onChange={(event) =>
                  setProductionStage(
                    event.target
                      .value as ProductionStage,
                  )
                }
                style={inputStyle}
              >
                {PRODUCTION_STAGE_OPTIONS.map(
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
            </Field>

            <Field label="원고 접수일">
              <input
                type="datetime-local"
                value={manuscriptReceivedAt}
                onChange={(event) =>
                  setManuscriptReceivedAt(
                    event.target.value,
                  )
                }
                style={inputStyle}
              />
            </Field>

            <Field label="검토 시작일">
              <input
                type="datetime-local"
                value={reviewStartedAt}
                onChange={(event) =>
                  setReviewStartedAt(
                    event.target.value,
                  )
                }
                style={inputStyle}
              />
            </Field>

            <Field label="교정본 전달일">
              <input
                type="datetime-local"
                value={proofSentAt}
                onChange={(event) =>
                  setProofSentAt(
                    event.target.value,
                  )
                }
                style={inputStyle}
              />
            </Field>

            <Field label="고객 교정 승인일">
              <input
                type="datetime-local"
                value={proofApprovedAt}
                onChange={(event) =>
                  setProofApprovedAt(
                    event.target.value,
                  )
                }
                style={inputStyle}
              />
            </Field>

            <Field label="인쇄 발주일">
              <input
                type="datetime-local"
                value={printOrderedAt}
                onChange={(event) =>
                  setPrintOrderedAt(
                    event.target.value,
                  )
                }
                style={inputStyle}
              />
            </Field>

            <Field label="인쇄 완료일">
              <input
                type="datetime-local"
                value={printingCompletedAt}
                onChange={(event) =>
                  setPrintingCompletedAt(
                    event.target.value,
                  )
                }
                style={inputStyle}
              />
            </Field>

            <Field label="발송일">
              <input
                type="datetime-local"
                value={shippedAt}
                onChange={(event) =>
                  setShippedAt(
                    event.target.value,
                  )
                }
                style={inputStyle}
              />
            </Field>

            <Field label="제작 완료일">
              <input
                type="datetime-local"
                value={completedAt}
                onChange={(event) =>
                  setCompletedAt(
                    event.target.value,
                  )
                }
                style={inputStyle}
              />
            </Field>
          </div>

          <Field label="교정본 파일 주소">
            <input
              type="text"
              value={proofFileUrl}
              onChange={(event) =>
                setProofFileUrl(
                  event.target.value,
                )
              }
              placeholder="https:// 또는 /로 시작하는 파일 주소"
              style={inputStyle}
            />
          </Field>

          <h4 style={subheadingStyle}>
            배송 정보
          </h4>

          <div style={fieldGridStyle}>
            <Field label="수령인 이름">
              <input
                type="text"
                value={recipientName}
                onChange={(event) =>
                  setRecipientName(
                    event.target.value,
                  )
                }
                style={inputStyle}
              />
            </Field>

            <Field label="수령인 연락처">
              <input
                type="text"
                value={recipientPhone}
                onChange={(event) =>
                  setRecipientPhone(
                    event.target.value,
                  )
                }
                style={inputStyle}
              />
            </Field>

            <Field label="우편번호">
              <input
                type="text"
                value={postalCode}
                onChange={(event) =>
                  setPostalCode(
                    event.target.value,
                  )
                }
                style={inputStyle}
              />
            </Field>

            <Field label="택배사">
              <input
                type="text"
                value={shippingCarrier}
                onChange={(event) =>
                  setShippingCarrier(
                    event.target.value,
                  )
                }
                placeholder="예: CJ대한통운"
                style={inputStyle}
              />
            </Field>

            <Field label="송장번호">
              <input
                type="text"
                value={trackingNumber}
                onChange={(event) =>
                  setTrackingNumber(
                    event.target.value,
                  )
                }
                style={inputStyle}
              />
            </Field>
          </div>

          <Field label="기본 배송지">
            <input
              type="text"
              value={shippingAddress1}
              onChange={(event) =>
                setShippingAddress1(
                  event.target.value,
                )
              }
              style={inputStyle}
            />
          </Field>

          <Field label="상세 배송지">
            <input
              type="text"
              value={shippingAddress2}
              onChange={(event) =>
                setShippingAddress2(
                  event.target.value,
                )
              }
              style={inputStyle}
            />
          </Field>

          <Field label="배송 메모">
            <textarea
              value={shippingMemo}
              onChange={(event) =>
                setShippingMemo(
                  event.target.value,
                )
              }
              rows={3}
              style={textareaStyle}
            />
          </Field>

          <Field label="관리자 제작 메모">
            <textarea
              value={productionNote}
              onChange={(event) =>
                setProductionNote(
                  event.target.value,
                )
              }
              rows={5}
              placeholder="고객 요청사항, 편집 확인사항, 인쇄소 전달사항 등을 기록하세요."
              style={textareaStyle}
            />
          </Field>

          {message ? (
            <p
              style={{
                ...messageStyle,
                color: message.includes('오류') ||
                  message.includes('못했습니다') ||
                  message.includes('올바르지')
                  ? '#b42318'
                  : '#176b3a',
              }}
            >
              {message}
            </p>
          ) : null}

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            style={{
              ...saveButtonStyle,
              opacity: isSaving
                ? 0.65
                : 1,
            }}
          >
            {isSaving
              ? '저장 중...'
              : '제작 정보 저장'}
          </button>
        </div>
      ) : null}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>
        {label}
      </span>

      {children}
    </label>
  );
}

function normalizeProductionStage(
  value: string | undefined,
): ProductionStage {
  const found =
    PRODUCTION_STAGE_OPTIONS.find(
      (option) =>
        option.value === value,
    );

  return found?.value ?? 'PREPARING';
}

function getProductionStageLabel(
  value: ProductionStage,
) {
  return (
    PRODUCTION_STAGE_OPTIONS.find(
      (option) =>
        option.value === value,
    )?.label ?? '제작 상태 확인 필요'
  );
}

function toDateTimeLocalValue(
  value:
    | Date
    | string
    | null
    | undefined,
) {
  if (!value) {
    return '';
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return '';
  }

  const localDate = new Date(
    date.getTime() -
      date.getTimezoneOffset() *
        60 *
        1000,
  );

  return localDate
    .toISOString()
    .slice(0, 16);
}

const sectionStyle: React.CSSProperties = {
  marginTop: 16,
  border:
    '1px solid rgba(107, 63, 24, 0.18)',
  borderRadius: 16,
  background:
    'rgba(255, 250, 240, 0.7)',
  overflow: 'hidden',
};

const emptySectionStyle: React.CSSProperties = {
  ...sectionStyle,
  padding: 16,
};

const emptyTextStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#75685c',
  fontSize: 13,
  lineHeight: 1.6,
};

const toggleButtonStyle: React.CSSProperties = {
  width: '100%',
  border: 0,
  background: 'transparent',
  padding: '15px 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  color: '#3d2716',
  textAlign: 'left',
  cursor: 'pointer',
};

const stageSummaryStyle: React.CSSProperties = {
  display: 'block',
  marginTop: 5,
  color: '#7a6757',
  fontSize: 12,
  fontWeight: 500,
};

const contentStyle: React.CSSProperties = {
  padding: '0 16px 18px',
  display: 'grid',
  gap: 14,
};

const fieldGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(190px, 1fr))',
  gap: 12,
};

const fieldStyle: React.CSSProperties = {
  display: 'grid',
  gap: 6,
};

const labelStyle: React.CSSProperties = {
  color: '#5b4029',
  fontSize: 12,
  fontWeight: 700,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  minWidth: 0,
  minHeight: 42,
  border:
    '1px solid rgba(107, 63, 24, 0.22)',
  borderRadius: 10,
  background: '#ffffff',
  padding: '9px 11px',
  color: '#2f2015',
  fontSize: 14,
  boxSizing: 'border-box',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 88,
  resize: 'vertical',
  lineHeight: 1.6,
};

const subheadingStyle: React.CSSProperties = {
  margin: '4px 0 0',
  color: '#3e2a19',
  fontSize: 15,
};

const messageStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 13,
  lineHeight: 1.6,
};

const saveButtonStyle: React.CSSProperties = {
  minHeight: 44,
  border: 0,
  borderRadius: 12,
  background: '#6b3f18',
  color: '#ffffff',
  padding: '11px 18px',
  fontWeight: 800,
  cursor: 'pointer',
};