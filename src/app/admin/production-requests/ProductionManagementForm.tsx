"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

const PRODUCTION_STAGE_OPTIONS = [
  {
    value: "PREPARING",
    label: "제작 준비",
  },
  {
    value: "MANUSCRIPT_RECEIVED",
    label: "원고 접수",
  },
  {
    value: "REVIEWING",
    label: "원고 검토",
  },
  {
    value: "PROOFING",
    label: "교정 진행",
  },
  {
    value: "PROOF_SENT",
    label: "교정본 전달",
  },
  {
    value: "PROOF_APPROVED",
    label: "교정 승인",
  },
  {
    value: "PRINT_ORDERED",
    label: "인쇄 발주",
  },
  {
    value: "PRINTING",
    label: "인쇄 진행",
  },
  {
    value: "SHIPPING_PREPARATION",
    label: "배송 준비",
  },
  {
    value: "SHIPPED",
    label: "배송 중",
  },
  {
    value: "COMPLETED",
    label: "제작 완료",
  },
  {
    value: "ON_HOLD",
    label: "제작 보류",
  },
] as const;

type ProductionStage =
  (typeof PRODUCTION_STAGE_OPTIONS)[number]["value"];

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

type ProductionValues = {
  productionStage: ProductionStage;
  manuscriptReceivedAt: string;
  reviewStartedAt: string;
  proofFileUrl: string;
  proofSentAt: string;
  proofApprovedAt: string;
  printOrderedAt: string;
  printingCompletedAt: string;
  recipientName: string;
  recipientPhone: string;
  postalCode: string;
  shippingAddress1: string;
  shippingAddress2: string;
  shippingMemo: string;
  shippingCarrier: string;
  trackingNumber: string;
  shippedAt: string;
  completedAt: string;
  productionNote: string;
};

const PRODUCTION_PHASES: ReadonlyArray<{
  label: string;
  stages: ReadonlyArray<ProductionStage>;
}> = [
  {
    label: "준비",
    stages: ["PREPARING"],
  },
  {
    label: "원고",
    stages: [
      "MANUSCRIPT_RECEIVED",
      "REVIEWING",
    ],
  },
  {
    label: "교정",
    stages: [
      "PROOFING",
      "PROOF_SENT",
      "PROOF_APPROVED",
    ],
  },
  {
    label: "인쇄",
    stages: [
      "PRINT_ORDERED",
      "PRINTING",
      "SHIPPING_PREPARATION",
    ],
  },
  {
    label: "배송·완료",
    stages: ["SHIPPED", "COMPLETED"],
  },
];

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
    useState("");

  const [isError, setIsError] =
    useState(false);

  const [values, setValues] =
    useState<ProductionValues>(() =>
      createProductionValues(
        initialOrder,
      ),
    );

  const [savedValues, setSavedValues] =
    useState<ProductionValues>(() =>
      createProductionValues(
        initialOrder,
      ),
    );

  useEffect(() => {
    const nextValues =
      createProductionValues(
        initialOrder,
      );

    setValues(nextValues);
    setSavedValues(nextValues);
    setMessage("");
    setIsError(false);
  }, [initialOrder]);

  const currentStageLabel = useMemo(
    () =>
      getProductionStageLabel(
        values.productionStage,
      ),
    [values.productionStage],
  );

  const isDirty =
    JSON.stringify(values) !==
    JSON.stringify(savedValues);

  const stageProgress = useMemo(
    () =>
      getStageProgress(
        values.productionStage,
      ),
    [values.productionStage],
  );

  if (!initialOrder) {
    return (
      <section className="admin-production-manager admin-production-manager-empty">
        <div className="admin-production-manager-empty-icon">
          <BookIcon />
        </div>

        <div>
          <span>출판 제작 관리</span>
          <strong>
            제작 견적 등록 후 사용할 수 있습니다
          </strong>
          <p>
            견적과 결제 주문을 먼저 등록하면
            원고, 교정본 확인, 인쇄, 배송 단계를 한곳에서
            관리할 수 있습니다.
          </p>
        </div>

        <style>{productionStyles}</style>
      </section>
    );
  }

  const updateValue = <
    Key extends keyof ProductionValues,
  >(
    key: Key,
    value: ProductionValues[Key],
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

  const handleSave = async () => {
    if (isSaving || !isDirty) {
      return;
    }

    const stageChanged =
      values.productionStage !==
      savedValues.productionStage;

    const confirmationLines = [
      stageChanged
        ? `제작 단계를 "${getProductionStageLabel(
            savedValues.productionStage,
          )}"에서 "${getProductionStageLabel(
            values.productionStage,
          )}"(으)로 변경할까요?`
        : "수정한 제작 정보를 저장할까요?",
      "",
      "저장한 정보는 제작 진행과 배송 관리 기준으로 사용됩니다.",
    ];

    if (
      !window.confirm(
        confirmationLines.join("\n"),
      )
    ) {
      return;
    }

    setIsSaving(true);
    setMessage("");
    setIsError(false);

    const nextValues =
      normalizeProductionValues(
        values,
      );

    try {
      const response = await fetch(
        `/api/admin/production-requests/${requestId}/production`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            nextValues,
          ),
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
            "제작 정보를 저장하지 못했습니다.",
        );
      }

      setValues(nextValues);
      setSavedValues(nextValues);
      setIsError(false);
      setMessage(
        data.message ||
          "제작 정보를 저장했습니다.",
      );

      router.refresh();
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "제작 정보 저장 중 오류가 발생했습니다.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section
      className="admin-production-manager"
      data-open={isOpen}
    >
      <button
        type="button"
        className="admin-production-manager-toggle"
        onClick={() =>
          setIsOpen((current) =>
            !current,
          )
        }
        aria-expanded={isOpen}
      >
        <span className="admin-production-manager-heading">
          <span>결제 후 제작 운영</span>

          <strong>
            출판 제작 관리
          </strong>

          <small>
            현재 단계: {currentStageLabel}
            {isDirty
              ? " · 저장하지 않은 변경사항 있음"
              : ""}
          </small>
        </span>

        <span className="admin-production-manager-toggle-side">
          <span
            className="admin-production-manager-stage-badge"
            data-stage={values.productionStage}
          >
            {currentStageLabel}
          </span>

          <ChevronIcon
            open={isOpen}
          />
        </span>
      </button>

      <div className="admin-production-manager-progress">
        <div
          className="admin-production-manager-progress-line"
          aria-hidden="true"
        >
          <span
            style={{
              width: `${stageProgress}%`,
            }}
          />
        </div>

        <div className="admin-production-manager-phases">
          {PRODUCTION_PHASES.map(
            (phase, index) => {
              const state =
                getPhaseState(
                  phase.stages,
                  values.productionStage,
                );

              return (
                <div
                  key={phase.label}
                  data-state={state}
                >
                  <span>
                    {index + 1}
                  </span>
                  <strong>
                    {phase.label}
                  </strong>
                </div>
              );
            },
          )}
        </div>
      </div>

      {isOpen ? (
        <div className="admin-production-manager-content">
          <section className="admin-production-manager-group">
            <GroupHeading
              number="01"
              title="제작 단계와 일정"
              description="원고 접수부터 제작 완료까지 주요 일정을 기록합니다."
            />

            <div className="admin-production-manager-stage-row">
              <Field label="제작 진행 단계">
                <select
                  value={
                    values.productionStage
                  }
                  onChange={(event) =>
                    updateValue(
                      "productionStage",
                      event.target
                        .value as ProductionStage,
                    )
                  }
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

              <div className="admin-production-manager-updated">
                <span>단계 최종 수정</span>
                <strong>
                  {formatDateTime(
                    initialOrder.productionStageUpdatedAt,
                  )}
                </strong>
              </div>
            </div>

            <div className="admin-production-manager-date-grid">
              <DateField
                label="원고 접수일"
                value={
                  values.manuscriptReceivedAt
                }
                onChange={(value) =>
                  updateValue(
                    "manuscriptReceivedAt",
                    value,
                  )
                }
              />

              <DateField
                label="검토 시작일"
                value={
                  values.reviewStartedAt
                }
                onChange={(value) =>
                  updateValue(
                    "reviewStartedAt",
                    value,
                  )
                }
              />

              <DateField
                label="고객 교정본 전달일"
                value={values.proofSentAt}
                onChange={(value) =>
                  updateValue(
                    "proofSentAt",
                    value,
                  )
                }
              />

              <DateField
                label="고객 인쇄용 최종 승인일"
                value={
                  values.proofApprovedAt
                }
                onChange={(value) =>
                  updateValue(
                    "proofApprovedAt",
                    value,
                  )
                }
              />

              <DateField
                label="인쇄 발주일"
                value={values.printOrderedAt}
                onChange={(value) =>
                  updateValue(
                    "printOrderedAt",
                    value,
                  )
                }
              />

              <DateField
                label="인쇄 완료일"
                value={
                  values.printingCompletedAt
                }
                onChange={(value) =>
                  updateValue(
                    "printingCompletedAt",
                    value,
                  )
                }
              />

              <DateField
                label="발송일"
                value={values.shippedAt}
                onChange={(value) =>
                  updateValue(
                    "shippedAt",
                    value,
                  )
                }
              />

              <DateField
                label="제작 완료일"
                value={values.completedAt}
                onChange={(value) =>
                  updateValue(
                    "completedAt",
                    value,
                  )
                }
              />
            </div>
          </section>

          <section className="admin-production-manager-group">
            <GroupHeading
              number="02"
              title="고객 교정본 전달 관리"
              description="고객이 확인할 교정본 주소를 등록하고 전달 여부를 관리합니다."
            />

            <Field
              label="고객 확인용 교정본 주소"
              hint="https:// 또는 /로 시작하는 주소"
            >
              <input
                type="text"
                value={values.proofFileUrl}
                onChange={(event) =>
                  updateValue(
                    "proofFileUrl",
                    event.target.value,
                  )
                }
                maxLength={2000}
                placeholder="https:// 또는 /로 시작하는 파일 주소"
              />
            </Field>
          </section>

          <section className="admin-production-manager-group">
            <GroupHeading
              number="03"
              title="배송 정보"
              description="수령인, 주소, 택배사와 송장번호를 관리합니다."
            />

            <div className="admin-production-manager-field-grid">
              <Field label="수령인 이름">
                <input
                  type="text"
                  value={values.recipientName}
                  onChange={(event) =>
                    updateValue(
                      "recipientName",
                      event.target.value,
                    )
                  }
                  maxLength={100}
                />
              </Field>

              <Field label="수령인 연락처">
                <input
                  type="text"
                  value={values.recipientPhone}
                  onChange={(event) =>
                    updateValue(
                      "recipientPhone",
                      event.target.value,
                    )
                  }
                  maxLength={50}
                />
              </Field>

              <Field label="우편번호">
                <input
                  type="text"
                  value={values.postalCode}
                  onChange={(event) =>
                    updateValue(
                      "postalCode",
                      event.target.value,
                    )
                  }
                  maxLength={20}
                />
              </Field>

              <Field label="택배사">
                <input
                  type="text"
                  value={values.shippingCarrier}
                  onChange={(event) =>
                    updateValue(
                      "shippingCarrier",
                      event.target.value,
                    )
                  }
                  maxLength={100}
                  placeholder="예: CJ대한통운"
                />
              </Field>

              <Field label="송장번호">
                <input
                  type="text"
                  value={values.trackingNumber}
                  onChange={(event) =>
                    updateValue(
                      "trackingNumber",
                      event.target.value,
                    )
                  }
                  maxLength={100}
                />
              </Field>
            </div>

            <div className="admin-production-manager-address-grid">
              <Field label="기본 배송지">
                <input
                  type="text"
                  value={
                    values.shippingAddress1
                  }
                  onChange={(event) =>
                    updateValue(
                      "shippingAddress1",
                      event.target.value,
                    )
                  }
                  maxLength={500}
                />
              </Field>

              <Field label="상세 배송지">
                <input
                  type="text"
                  value={
                    values.shippingAddress2
                  }
                  onChange={(event) =>
                    updateValue(
                      "shippingAddress2",
                      event.target.value,
                    )
                  }
                  maxLength={500}
                />
              </Field>
            </div>

            <Field
              label="배송 메모"
              hint={`${values.shippingMemo.length.toLocaleString()} / 1,000자`}
            >
              <textarea
                value={values.shippingMemo}
                onChange={(event) =>
                  updateValue(
                    "shippingMemo",
                    event.target.value,
                  )
                }
                maxLength={1000}
                rows={3}
                placeholder="부재 시 전달 방법이나 배송 요청사항을 기록하세요."
              />
            </Field>
          </section>

          <section className="admin-production-manager-group">
            <GroupHeading
              number="04"
              title="관리자 제작 메모"
              description="고객 요청, 편집 확인, 인쇄소 전달사항을 기록합니다."
            />

            <Field
              label="내부 제작 메모"
              hint={`${values.productionNote.length.toLocaleString()} / 5,000자`}
            >
              <textarea
                value={values.productionNote}
                onChange={(event) =>
                  updateValue(
                    "productionNote",
                    event.target.value,
                  )
                }
                maxLength={5000}
                rows={6}
                placeholder="고객 요청사항, 편집 확인사항, 인쇄소 전달사항 등을 기록하세요."
              />
            </Field>
          </section>

          {message ? (
            <div
              className="admin-production-manager-alert"
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

          <div className="admin-production-manager-footer">
            <span data-dirty={isDirty}>
              {isDirty
                ? "저장하지 않은 제작 정보가 있습니다."
                : "현재 제작 정보가 저장되어 있습니다."}
            </span>

            <div>
              <button
                type="button"
                className="admin-production-manager-reset"
                onClick={handleReset}
                disabled={
                  isSaving || !isDirty
                }
              >
                변경 취소
              </button>

              <button
                type="button"
                className="admin-production-manager-save"
                onClick={handleSave}
                disabled={
                  isSaving || !isDirty
                }
              >
                {isSaving ? (
                  <>
                    <span className="admin-production-manager-spinner" />
                    저장 중...
                  </>
                ) : isDirty ? (
                  "제작 정보 저장"
                ) : (
                  "변경사항 없음"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style>{productionStyles}</style>
    </section>
  );
}

function GroupHeading({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <header className="admin-production-manager-group-heading">
      <span>{number}</span>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </header>
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
    <label className="admin-production-manager-field">
      <span>
        <strong>{label}</strong>
        {hint ? <small>{hint}</small> : null}
      </span>
      {children}
    </label>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <input
        type="datetime-local"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
      />
    </Field>
  );
}

function BookIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11a3 3 0 0 1 3 3v15a3 3 0 0 0-3-3H4V5.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M20 5.5A2.5 2.5 0 0 0 17.5 3H14v18a3 3 0 0 1 3-3h3V5.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
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

function createProductionValues(
  initialOrder:
    | InitialProductionOrder
    | null,
): ProductionValues {
  return {
    productionStage:
      normalizeProductionStage(
        initialOrder?.productionStage,
      ),
    manuscriptReceivedAt:
      toDateTimeLocalValue(
        initialOrder?.manuscriptReceivedAt,
      ),
    reviewStartedAt:
      toDateTimeLocalValue(
        initialOrder?.reviewStartedAt,
      ),
    proofFileUrl:
      initialOrder?.proofFileUrl ?? "",
    proofSentAt:
      toDateTimeLocalValue(
        initialOrder?.proofSentAt,
      ),
    proofApprovedAt:
      toDateTimeLocalValue(
        initialOrder?.proofApprovedAt,
      ),
    printOrderedAt:
      toDateTimeLocalValue(
        initialOrder?.printOrderedAt,
      ),
    printingCompletedAt:
      toDateTimeLocalValue(
        initialOrder?.printingCompletedAt,
      ),
    recipientName:
      initialOrder?.recipientName ?? "",
    recipientPhone:
      initialOrder?.recipientPhone ?? "",
    postalCode:
      initialOrder?.postalCode ?? "",
    shippingAddress1:
      initialOrder?.shippingAddress1 ?? "",
    shippingAddress2:
      initialOrder?.shippingAddress2 ?? "",
    shippingMemo:
      initialOrder?.shippingMemo ?? "",
    shippingCarrier:
      initialOrder?.shippingCarrier ?? "",
    trackingNumber:
      initialOrder?.trackingNumber ?? "",
    shippedAt:
      toDateTimeLocalValue(
        initialOrder?.shippedAt,
      ),
    completedAt:
      toDateTimeLocalValue(
        initialOrder?.completedAt,
      ),
    productionNote:
      initialOrder?.productionNote ?? "",
  };
}

function normalizeProductionValues(
  values: ProductionValues,
): ProductionValues {
  return {
    ...values,
    proofFileUrl:
      values.proofFileUrl.trim(),
    recipientName:
      values.recipientName.trim(),
    recipientPhone:
      values.recipientPhone.trim(),
    postalCode:
      values.postalCode.trim(),
    shippingAddress1:
      values.shippingAddress1.trim(),
    shippingAddress2:
      values.shippingAddress2.trim(),
    shippingMemo:
      values.shippingMemo.trim(),
    shippingCarrier:
      values.shippingCarrier.trim(),
    trackingNumber:
      values.trackingNumber.trim(),
    productionNote:
      values.productionNote.trim(),
  };
}

function normalizeProductionStage(
  value: string | undefined,
): ProductionStage {
  const found =
    PRODUCTION_STAGE_OPTIONS.find(
      (option) =>
        option.value === value,
    );

  return found?.value ?? "PREPARING";
}

function getProductionStageLabel(
  value: ProductionStage,
) {
  return (
    PRODUCTION_STAGE_OPTIONS.find(
      (option) =>
        option.value === value,
    )?.label ?? "제작 상태 확인 필요"
  );
}

function getStageProgress(
  stage: ProductionStage,
) {
  if (stage === "ON_HOLD") {
    return 0;
  }

  const activeIndex =
    PRODUCTION_STAGE_OPTIONS.findIndex(
      (option) =>
        option.value === stage,
    );

  const completedIndex =
    PRODUCTION_STAGE_OPTIONS.findIndex(
      (option) =>
        option.value === "COMPLETED",
    );

  if (
    activeIndex < 0 ||
    completedIndex <= 0
  ) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      (activeIndex /
        completedIndex) *
        100,
    ),
  );
}

function getPhaseState(
  phaseStages: ReadonlyArray<ProductionStage>,
  currentStage: ProductionStage,
) {
  if (currentStage === "ON_HOLD") {
    return "hold";
  }

  const currentIndex =
    PRODUCTION_STAGE_OPTIONS.findIndex(
      (option) =>
        option.value === currentStage,
    );

  const firstStageIndex =
    PRODUCTION_STAGE_OPTIONS.findIndex(
      (option) =>
        option.value === phaseStages[0],
    );

  const lastStageIndex =
    PRODUCTION_STAGE_OPTIONS.findIndex(
      (option) =>
        option.value ===
        phaseStages[
          phaseStages.length - 1
        ],
    );

  if (
    currentIndex >= firstStageIndex &&
    currentIndex <= lastStageIndex
  ) {
    return "active";
  }

  if (currentIndex > lastStageIndex) {
    return "done";
  }

  return "waiting";
}

function toDateTimeLocalValue(
  value:
    | Date
    | string
    | null
    | undefined,
) {
  if (!value) {
    return "";
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
    return "";
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

function formatDateTime(
  value: Date | string,
) {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "확인 필요";
  }

  return new Intl.DateTimeFormat(
    "ko-KR",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

const productionStyles = `
  .admin-production-manager,
  .admin-production-manager * {
    box-sizing: border-box;
  }

  .admin-production-manager {
    margin-top: 12px;
    overflow: hidden;
    border: 1px solid #d9c9e8;
    border-radius: 16px;
    background:
      linear-gradient(
        145deg,
        #fdfbff,
        #f8f4fc
      );
    box-shadow:
      0 13px 32px
      rgba(91, 67, 125, 0.07);
  }

  .admin-production-manager-empty {
    padding: 15px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-color: #e0d4ca;
    background: #fbf8f5;
    box-shadow: none;
  }

  .admin-production-manager-empty-icon {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border-radius: 13px;
    color: #9d8070;
    background: #f0e8e2;
  }

  .admin-production-manager-empty-icon svg {
    width: 22px;
    height: 22px;
  }

  .admin-production-manager-empty > div:last-child {
    min-width: 0;
    display: grid;
    gap: 3px;
  }

  .admin-production-manager-empty span {
    color: #a16d57;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-production-manager-empty strong {
    color: #5c453b;
    font-size: 11px;
  }

  .admin-production-manager-empty p {
    margin: 0;
    color: #88766d;
    font-size: 8px;
    line-height: 1.55;
    word-break: keep-all;
  }

  .admin-production-manager-toggle {
    width: 100%;
    padding: 15px 16px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 13px;
    border: 0;
    color: #4b385a;
    background: transparent;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .admin-production-manager-heading {
    min-width: 0;
    display: grid;
    gap: 4px;
  }

  .admin-production-manager-heading > span {
    color: #8060aa;
    font-size: 8px;
    font-weight: 900;
    letter-spacing: 0.04em;
  }

  .admin-production-manager-heading strong {
    font-size: 13px;
    line-height: 1.4;
  }

  .admin-production-manager-heading small {
    overflow: hidden;
    color: #816f8e;
    font-size: 8px;
    line-height: 1.5;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .admin-production-manager-toggle-side {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 0 0 auto;
  }

  .admin-production-manager-stage-badge {
    min-height: 28px;
    padding: 0 10px;
    display: inline-flex;
    align-items: center;
    border: 1px solid #bda9d3;
    border-radius: 999px;
    color: #684b8c;
    background: #f1eaf8;
    font-size: 8px;
    font-weight: 900;
    white-space: nowrap;
  }

  .admin-production-manager-stage-badge[data-stage="COMPLETED"] {
    border-color: #91bca0;
    color: #38704b;
    background: #edf8f0;
  }

  .admin-production-manager-stage-badge[data-stage="ON_HOLD"] {
    border-color: #d5aa6b;
    color: #805b20;
    background: #fff5dc;
  }

  .admin-production-manager-toggle-side svg {
    width: 19px;
    height: 19px;
    transition: transform 160ms ease;
  }

  .admin-production-manager-toggle-side svg[data-open="true"] {
    transform: rotate(180deg);
  }

  .admin-production-manager-progress {
    padding: 0 16px 14px;
  }

  .admin-production-manager-progress-line {
    height: 5px;
    overflow: hidden;
    border-radius: 999px;
    background: #e8dfef;
  }

  .admin-production-manager-progress-line > span {
    height: 100%;
    display: block;
    border-radius: inherit;
    background:
      linear-gradient(
        90deg,
        #9c77ca,
        #6f4d9d
      );
    transition: width 220ms ease;
  }

  .admin-production-manager-phases {
    margin-top: 8px;
    display: grid;
    grid-template-columns:
      repeat(5, minmax(0, 1fr));
    gap: 5px;
  }

  .admin-production-manager-phases > div {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 5px;
    color: #a090aa;
  }

  .admin-production-manager-phases span {
    width: 18px;
    height: 18px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border: 1px solid #d4c6df;
    border-radius: 50%;
    background: #ffffff;
    font-size: 7px;
    font-weight: 900;
  }

  .admin-production-manager-phases strong {
    overflow: hidden;
    font-size: 7px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .admin-production-manager-phases > div[data-state="active"] {
    color: #6d4d94;
  }

  .admin-production-manager-phases > div[data-state="active"] span {
    border-color: #8060aa;
    color: #ffffff;
    background: #8060aa;
  }

  .admin-production-manager-phases > div[data-state="done"] {
    color: #4f7d5d;
  }

  .admin-production-manager-phases > div[data-state="done"] span {
    border-color: #79a98b;
    color: #ffffff;
    background: #669577;
  }

  .admin-production-manager-phases > div[data-state="hold"] {
    color: #9c762e;
  }

  .admin-production-manager-content {
    padding: 15px 16px 17px;
    display: grid;
    gap: 12px;
    border-top: 1px solid #e7deee;
    background:
      rgba(255, 255, 255, 0.55);
  }

  .admin-production-manager-group {
    padding: 14px;
    display: grid;
    gap: 13px;
    border: 1px solid #e3d9eb;
    border-radius: 14px;
    background: #ffffff;
  }

  .admin-production-manager-group-heading {
    display: flex;
    align-items: flex-start;
    gap: 9px;
  }

  .admin-production-manager-group-heading > span {
    width: 29px;
    height: 29px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border-radius: 9px;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #9771c5,
        #704c9e
      );
    font-size: 8px;
    font-weight: 900;
  }

  .admin-production-manager-group-heading > div {
    min-width: 0;
    display: grid;
    gap: 3px;
  }

  .admin-production-manager-group-heading strong {
    color: #513b61;
    font-size: 10px;
  }

  .admin-production-manager-group-heading p {
    margin: 0;
    color: #8a7994;
    font-size: 8px;
    line-height: 1.5;
    word-break: keep-all;
  }

  .admin-production-manager-stage-row {
    display: grid;
    grid-template-columns:
      minmax(0, 1fr)
      minmax(145px, 0.65fr);
    gap: 9px;
    align-items: end;
  }

  .admin-production-manager-updated {
    min-height: 40px;
    padding: 8px 10px;
    display: grid;
    align-content: center;
    gap: 2px;
    border-radius: 10px;
    background: #f6f1fa;
  }

  .admin-production-manager-updated span {
    color: #967fa3;
    font-size: 7px;
  }

  .admin-production-manager-updated strong {
    color: #654f73;
    font-size: 8px;
  }

  .admin-production-manager-date-grid,
  .admin-production-manager-field-grid,
  .admin-production-manager-address-grid {
    display: grid;
    gap: 9px;
  }

  .admin-production-manager-date-grid {
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
  }

  .admin-production-manager-field-grid {
    grid-template-columns:
      repeat(5, minmax(0, 1fr));
  }

  .admin-production-manager-address-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .admin-production-manager-field {
    min-width: 0;
    display: grid;
    gap: 6px;
  }

  .admin-production-manager-field > span {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 7px;
  }

  .admin-production-manager-field strong {
    color: #604b6b;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-production-manager-field small {
    color: #a08eaa;
    font-size: 7px;
  }

  .admin-production-manager input,
  .admin-production-manager select,
  .admin-production-manager textarea {
    width: 100%;
    min-width: 0;
    min-height: 39px;
    padding: 8px 9px;
    border: 1px solid #d8cce1;
    border-radius: 9px;
    color: #4e3b58;
    background: #ffffff;
    font: inherit;
    font-size: 9px;
  }

  .admin-production-manager textarea {
    min-height: 86px;
    resize: vertical;
    line-height: 1.6;
  }

  .admin-production-manager-alert {
    padding: 11px 12px;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    border: 1px solid;
    border-radius: 11px;
  }

  .admin-production-manager-alert svg {
    width: 15px;
    height: 15px;
    flex: 0 0 auto;
  }

  .admin-production-manager-alert p {
    margin: 0;
    font-size: 9px;
    font-weight: 800;
    line-height: 1.55;
  }

  .admin-production-manager-alert[data-tone="error"] {
    border-color: #dca49d;
    color: #97493f;
    background: #fff0ee;
  }

  .admin-production-manager-alert[data-tone="success"] {
    border-color: #97bda4;
    color: #3b714e;
    background: #edf8f0;
  }

  .admin-production-manager-footer {
    padding-top: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    border-top: 1px solid #e5dce9;
  }

  .admin-production-manager-footer > span {
    color: #8b7b94;
    font-size: 8px;
    line-height: 1.45;
  }

  .admin-production-manager-footer > span[data-dirty="true"] {
    color: #76539d;
    font-weight: 900;
  }

  .admin-production-manager-footer > div {
    display: flex;
    align-items: center;
    gap: 7px;
    flex: 0 0 auto;
  }

  .admin-production-manager-reset,
  .admin-production-manager-save {
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

  .admin-production-manager-reset {
    border: 1px solid #cdbed7;
    color: #695377;
    background: #ffffff;
  }

  .admin-production-manager-save {
    border: 1px solid transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #8e69bd,
        #684792
      );
    box-shadow:
      0 8px 18px
      rgba(99, 68, 139, 0.17);
  }

  .admin-production-manager-reset:disabled,
  .admin-production-manager-save:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
  }

  .admin-production-manager-spinner {
    width: 12px;
    height: 12px;
    border: 2px solid
      rgba(255, 255, 255, 0.36);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation:
      admin-production-manager-spin
      700ms linear infinite;
  }

  @keyframes admin-production-manager-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 1120px) {
    .admin-production-manager-date-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .admin-production-manager-field-grid {
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 720px) {
    .admin-production-manager-phases {
      grid-template-columns:
        repeat(5, minmax(74px, 1fr));
      overflow-x: auto;
      padding-bottom: 4px;
    }

    .admin-production-manager-stage-row,
    .admin-production-manager-date-grid,
    .admin-production-manager-field-grid,
    .admin-production-manager-address-grid {
      grid-template-columns: 1fr;
    }

    .admin-production-manager-footer {
      align-items: stretch;
      flex-direction: column;
    }

    .admin-production-manager-footer > div {
      width: 100%;
    }

    .admin-production-manager-reset,
    .admin-production-manager-save {
      flex: 1 1 0;
    }
  }

  @media (max-width: 430px) {
    .admin-production-manager-toggle {
      align-items: flex-start;
    }

    .admin-production-manager-stage-badge {
      display: none;
    }

    .admin-production-manager-content {
      padding-right: 11px;
      padding-left: 11px;
    }

    .admin-production-manager-footer > div {
      flex-direction: column;
    }

    .admin-production-manager-reset,
    .admin-production-manager-save {
      width: 100%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .admin-production-manager-toggle-side svg,
    .admin-production-manager-progress-line > span {
      transition: none;
    }

    .admin-production-manager-spinner {
      animation: none;
    }
  }
`;
