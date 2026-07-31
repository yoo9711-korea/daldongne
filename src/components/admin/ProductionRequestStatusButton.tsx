"use client";

import {
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

type ProductionRequestStatus =
  | "REQUESTED"
  | "CONTACTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELED";

type BookStatus =
  | "DRAFT"
  | "IN_PRODUCTION"
  | "PUBLISHED";

type Props = {
  requestId: string;
  currentStatus: string;
};

type StatusApiResult = {
  ok?: boolean;
  message?: string;
  requestId?: string;
  previousStatus?: string;
  status?: string;
  statusChanged?: boolean;
  bookId?: string;
  bookStatus?: string;
  activeRequestCount?: number;
  completedRequestCount?: number;
};

type Feedback = {
  type: "success" | "error";
  text: string;
} | null;

const STATUS_OPTIONS: {
  value: ProductionRequestStatus;
  label: string;
  shortLabel: string;
}[] = [
  {
    value: "REQUESTED",
    label: "상담 신청 접수",
    shortLabel: "접수",
  },
  {
    value: "CONTACTED",
    label: "고객 연락 완료",
    shortLabel: "연락 완료",
  },
  {
    value: "IN_PROGRESS",
    label: "제작 상담 진행 중",
    shortLabel: "진행 중",
  },
  {
    value: "COMPLETED",
    label: "상담 완료",
    shortLabel: "완료",
  },
  {
    value: "CANCELED",
    label: "상담 취소",
    shortLabel: "취소",
  },
];

const STATUS_TRANSITIONS: Record<
  ProductionRequestStatus,
  readonly ProductionRequestStatus[]
> = {
  REQUESTED: [
    "CONTACTED",
    "CANCELED",
  ],
  CONTACTED: [
    "IN_PROGRESS",
    "CANCELED",
  ],
  IN_PROGRESS: [
    "COMPLETED",
    "CANCELED",
  ],
  COMPLETED: [],
  CANCELED: [],
};

const NORMAL_FLOW: ProductionRequestStatus[] = [
  "REQUESTED",
  "CONTACTED",
  "IN_PROGRESS",
  "COMPLETED",
];

export default function ProductionRequestStatusButton({
  requestId,
  currentStatus,
}: Props) {
  const router = useRouter();

  const [selectedStatus, setSelectedStatus] =
    useState<ProductionRequestStatus | null>(
      isProductionRequestStatus(currentStatus)
        ? currentStatus
        : null,
    );

  const [isSaving, setIsSaving] =
    useState(false);

  const [savingStatus, setSavingStatus] =
    useState<ProductionRequestStatus | null>(
      null,
    );

  const [feedback, setFeedback] =
    useState<Feedback>(null);

  useEffect(() => {
    if (
      isProductionRequestStatus(
        currentStatus,
      )
    ) {
      setSelectedStatus(
        currentStatus,
      );
    }
  }, [currentStatus]);

  const availableStatusOptions =
    selectedStatus
      ? STATUS_OPTIONS.filter(
          (option) =>
            STATUS_TRANSITIONS[
              selectedStatus
            ].includes(option.value),
        )
      : [];

  const isFinalStatus =
    selectedStatus === "COMPLETED" ||
    selectedStatus === "CANCELED";

  const currentFlowIndex =
    selectedStatus
      ? NORMAL_FLOW.indexOf(
          selectedStatus,
        )
      : -1;

  const handleChangeStatus = async (
    status: ProductionRequestStatus,
  ) => {
    if (
      isSaving ||
      status === selectedStatus
    ) {
      return;
    }

    if (!requestId.trim()) {
      setFeedback({
        type: "error",
        text: "변경할 상담 신청 정보를 찾을 수 없습니다.",
      });
      return;
    }

    const option =
      STATUS_OPTIONS.find(
        (item) =>
          item.value === status,
      );

    const label =
      option?.label || status;

    const confirmed =
      window.confirm(
        getConfirmMessage(
          status,
          label,
        ),
      );

    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setSavingStatus(status);
    setFeedback(null);

    try {
      const response = await fetch(
        `/api/admin/production-requests/${requestId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            status,
          }),
        },
      );

      const result =
        (await response
          .json()
          .catch(
            () => null,
          )) as StatusApiResult | null;

      if (
        !response.ok ||
        !result?.ok
      ) {
        setFeedback({
          type: "error",
          text:
            result?.message ||
            "상담 상태를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        });
        return;
      }

      const savedStatus =
        isProductionRequestStatus(
          result.status,
        )
          ? result.status
          : status;

      setSelectedStatus(
        savedStatus,
      );

      setFeedback({
        type: "success",
        text: getSuccessMessage(
          result,
          label,
        ),
      });

      router.refresh();
    } catch {
      setFeedback({
        type: "error",
        text:
          "상담 상태를 변경하는 중 오류가 발생했습니다. 인터넷 연결을 확인한 후 다시 시도해 주세요.",
      });
    } finally {
      setIsSaving(false);
      setSavingStatus(null);
    }
  };

  return (
    <section className="admin-status-panel">
      <header className="admin-status-panel-header">
        <div>
          <span className="admin-status-eyebrow">
            PRODUCTION REQUEST
          </span>

          <h3>
            상담 상태 관리
          </h3>

          <p>
            고객 연락부터 상담 완료까지
            처리 단계를 순서대로 관리합니다.
          </p>
        </div>

        <span
          className="admin-status-current"
          data-status={
            selectedStatus ||
            "UNKNOWN"
          }
        >
          <span aria-hidden="true" />

          {getStatusLabel(
            selectedStatus,
          )}
        </span>
      </header>

      {selectedStatus !==
      "CANCELED" ? (
        <ol
          className="admin-status-progress"
          aria-label="상담 진행 단계"
        >
          {NORMAL_FLOW.map(
            (status, index) => {
              const active =
                index ===
                currentFlowIndex;

              const completed =
                currentFlowIndex >
                index;

              return (
                <li
                  key={status}
                  data-active={
                    active
                      ? "true"
                      : "false"
                  }
                  data-completed={
                    completed
                      ? "true"
                      : "false"
                  }
                >
                  <span>
                    {completed
                      ? "✓"
                      : index + 1}
                  </span>

                  <strong>
                    {getShortStatusLabel(
                      status,
                    )}
                  </strong>
                </li>
              );
            },
          )}
        </ol>
      ) : (
        <div className="admin-status-canceled">
          취소 처리된 상담입니다.
        </div>
      )}

      <div className="admin-status-action-area">
        <div className="admin-status-action-heading">
          <strong>
            다음 처리 단계
          </strong>

          <span>
            변경 전 확인창이 표시됩니다.
          </span>
        </div>

        {availableStatusOptions.length >
        0 ? (
          <div className="admin-status-button-list">
            {availableStatusOptions.map(
              (option) => {
                const saving =
                  savingStatus ===
                  option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      void handleChangeStatus(
                        option.value,
                      )
                    }
                    disabled={isSaving}
                    data-status={
                      option.value
                    }
                    className="admin-status-change-button"
                  >
                    <span>
                      {saving
                        ? "저장 중..."
                        : option.label}
                    </span>

                    {!saving ? (
                      <span aria-hidden="true">
                        →
                      </span>
                    ) : null}
                  </button>
                );
              },
            )}
          </div>
        ) : (
          <div className="admin-status-final-box">
            <strong>
              {isFinalStatus
                ? "최종 상태입니다."
                : "상태 확인이 필요합니다."}
            </strong>

            <span>
              {isFinalStatus
                ? "완료 또는 취소된 상담은 더 이상 상태를 변경할 수 없습니다."
                : "현재 상담 상태를 확인할 수 없어 상태 변경이 잠겨 있습니다."}
            </span>
          </div>
        )}

        <p className="admin-status-guide">
          {isSaving
            ? "상담 상태와 책 상태를 저장하고 있습니다. 고객 이메일이 등록되어 있으면 변경 안내도 발송됩니다."
            : "책 상태는 같은 책에 연결된 모든 상담 기록을 기준으로 자동 계산됩니다."}
        </p>

        {feedback ? (
          <div
            role="status"
            aria-live="polite"
            data-type={
              feedback.type
            }
            className="admin-status-feedback"
          >
            <span aria-hidden="true">
              {feedback.type ===
              "success"
                ? "✓"
                : "!"}
            </span>

            <p>
              {feedback.text}
            </p>
          </div>
        ) : null}
      </div>

      <style>
        {statusPanelStyles}
      </style>
    </section>
  );
}

function getConfirmMessage(
  status: ProductionRequestStatus,
  label: string,
) {
  if (status === "COMPLETED") {
    return [
      `상담 상태를 "${label}"로 변경할까요?`,
      "",
      "이 상담을 완료 처리합니다.",
      "책 상태는 같은 책의 모든 상담 기록을 기준으로 자동 계산됩니다.",
      "고객 이메일이 등록되어 있으면 변경 안내가 발송됩니다.",
    ].join("\n");
  }

  if (status === "CANCELED") {
    return [
      `상담 상태를 "${label}"로 변경할까요?`,
      "",
      "이 상담 신청을 취소 처리합니다.",
      "다른 진행 중 상담이나 완료 상담이 있으면 책 상태는 원고 초안으로 변경되지 않을 수 있습니다.",
      "고객 이메일이 등록되어 있으면 변경 안내가 발송됩니다.",
    ].join("\n");
  }

  return [
    `상담 상태를 "${label}"로 변경할까요?`,
    "",
    "책 상태는 같은 책의 전체 상담 기록을 기준으로 자동 계산됩니다.",
    "고객 이메일이 등록되어 있으면 변경 안내가 발송됩니다.",
  ].join("\n");
}

function getSuccessMessage(
  result: StatusApiResult,
  fallbackLabel: string,
) {
  const lines: string[] = [];

  lines.push(
    result.message ||
      `상담 상태를 "${fallbackLabel}"로 변경했습니다.`,
  );

  if (
    isProductionRequestStatus(
      result.status,
    )
  ) {
    lines.push(
      `상담 상태: ${getStatusLabel(result.status)}`,
    );
  }

  if (
    isBookStatus(
      result.bookStatus,
    )
  ) {
    lines.push(
      `현재 책 상태: ${getBookStatusLabel(result.bookStatus)}`,
    );
  }

  if (
    typeof result.activeRequestCount ===
    "number"
  ) {
    lines.push(
      `진행 중 상담: ${result.activeRequestCount}건`,
    );
  }

  if (
    typeof result.completedRequestCount ===
    "number"
  ) {
    lines.push(
      `완료 상담: ${result.completedRequestCount}건`,
    );
  }

  return lines.join("\n");
}

function isProductionRequestStatus(
  value: unknown,
): value is ProductionRequestStatus {
  return (
    typeof value === "string" &&
    STATUS_OPTIONS.some(
      (option) =>
        option.value === value,
    )
  );
}

function isBookStatus(
  value: unknown,
): value is BookStatus {
  return (
    value === "DRAFT" ||
    value === "IN_PRODUCTION" ||
    value === "PUBLISHED"
  );
}

function getStatusLabel(
  status:
    | ProductionRequestStatus
    | null,
) {
  if (!status) {
    return "상태 확인 필요";
  }

  return (
    STATUS_OPTIONS.find(
      (option) =>
        option.value === status,
    )?.label ||
    "상태 확인 필요"
  );
}

function getShortStatusLabel(
  status: ProductionRequestStatus,
) {
  return (
    STATUS_OPTIONS.find(
      (option) =>
        option.value === status,
    )?.shortLabel ||
    "상태 확인"
  );
}

function getBookStatusLabel(
  status: BookStatus,
) {
  if (status === "DRAFT") {
    return "원고 초안";
  }

  if (
    status === "IN_PRODUCTION"
  ) {
    return "제작 진행 중";
  }

  return "완성";
}

const statusPanelStyles = `
  .admin-status-panel,
  .admin-status-panel * {
    box-sizing: border-box;
  }

  .admin-status-panel {
    margin-top: 16px;
    overflow: hidden;
    border:
      1px solid
      rgba(126, 83, 63, 0.16);
    border-radius: 18px;
    background: #fffdfb;
    box-shadow:
      0 10px 26px
      rgba(76, 47, 34, 0.055);
  }

  .admin-status-panel-header {
    padding: 17px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
    background:
      linear-gradient(
        135deg,
        #fff8f2,
        #fffdfb
      );
  }

  .admin-status-eyebrow {
    display: block;
    color: #d3624e;
    font-size: 8.4px;
    font-weight: 900;
    letter-spacing: 0.1em;
  }

  .admin-status-panel h3 {
    margin: 5px 0 0;
    color: #4f362d;
    font-size: 15.6px;
    letter-spacing: -0.035em;
  }

  .admin-status-panel-header p {
    margin: 5px 0 0;
    color: #92796d;
    font-size: 9.6px;
    line-height: 1.65;
  }

  .admin-status-current {
    min-height: 31px;
    padding: 0 10px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex: 0 0 auto;
    border:
      1px solid
      rgba(122, 77, 57, 0.13);
    border-radius: 999px;
    color: #5f453a;
    background: #ffffff;
    font-size: 9.6px;
    font-weight: 900;
    white-space: nowrap;
  }

  .admin-status-current > span {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #d39b55;
    box-shadow:
      0 0 0 3px
      rgba(211, 155, 85, 0.14);
  }

  .admin-status-current[data-status="CONTACTED"]
  > span {
    background: #4f8dbc;
    box-shadow:
      0 0 0 3px
      rgba(79, 141, 188, 0.14);
  }

  .admin-status-current[data-status="IN_PROGRESS"]
  > span {
    background: #8160ae;
    box-shadow:
      0 0 0 3px
      rgba(129, 96, 174, 0.14);
  }

  .admin-status-current[data-status="COMPLETED"]
  > span {
    background: #4f9364;
    box-shadow:
      0 0 0 3px
      rgba(79, 147, 100, 0.14);
  }

  .admin-status-current[data-status="CANCELED"]
  > span {
    background: #a07f7a;
    box-shadow:
      0 0 0 3px
      rgba(160, 127, 122, 0.14);
  }

  .admin-status-progress {
    margin: 0;
    padding: 15px 17px;
    display: grid;
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    list-style: none;
    border-top:
      1px solid
      rgba(126, 83, 63, 0.09);
    border-bottom:
      1px solid
      rgba(126, 83, 63, 0.09);
    background: #fbf7f4;
  }

  .admin-status-progress li {
    position: relative;
    min-width: 0;
    display: grid;
    justify-items: center;
    gap: 5px;
    color: #aa9388;
    text-align: center;
  }

  .admin-status-progress li:not(:last-child)::after {
    content: "";
    position: absolute;
    top: 12px;
    left: calc(50% + 15px);
    width: calc(100% - 30px);
    height: 2px;
    background: #e6d9d2;
  }

  .admin-status-progress li[data-completed="true"]:not(:last-child)::after {
    background: #d77865;
  }

  .admin-status-progress li > span {
    position: relative;
    z-index: 1;
    width: 25px;
    height: 25px;
    display: grid;
    place-items: center;
    border:
      2px solid #ded0c8;
    border-radius: 50%;
    background: #ffffff;
    font-size: 9.6px;
    font-weight: 900;
  }

  .admin-status-progress li[data-active="true"]
  > span {
    border-color: #d66450;
    color: #ffffff;
    background: #d66450;
    box-shadow:
      0 0 0 4px
      rgba(214, 100, 80, 0.13);
  }

  .admin-status-progress li[data-completed="true"]
  > span {
    border-color: #d77865;
    color: #ffffff;
    background: #d77865;
  }

  .admin-status-progress strong {
    overflow: hidden;
    font-size: 8.4px;
    line-height: 1.4;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .admin-status-progress li[data-active="true"]
  strong,
  .admin-status-progress li[data-completed="true"]
  strong {
    color: #6c4439;
  }

  .admin-status-canceled {
    padding: 14px 17px;
    border-top:
      1px solid
      rgba(126, 83, 63, 0.09);
    border-bottom:
      1px solid
      rgba(126, 83, 63, 0.09);
    color: #87514a;
    background: #fff1ef;
    font-size: 10.8px;
    font-weight: 900;
    text-align: center;
  }

  .admin-status-action-area {
    padding: 17px;
  }

  .admin-status-action-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .admin-status-action-heading strong {
    color: #574037;
    font-size: 10.8px;
  }

  .admin-status-action-heading span {
    color: #9f887d;
    font-size: 8.4px;
  }

  .admin-status-button-list {
    margin-top: 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  .admin-status-change-button {
    min-height: 38px;
    padding: 0 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    border:
      1px solid #7b4439;
    border-radius: 10px;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #82483d,
        #6e382f
      );
    font: inherit;
    font-size: 9.6px;
    font-weight: 900;
    cursor: pointer;
    box-shadow:
      0 7px 15px
      rgba(103, 51, 43, 0.12);
    transition:
      transform 150ms ease,
      box-shadow 150ms ease,
      opacity 150ms ease;
  }

  .admin-status-change-button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow:
      0 10px 19px
      rgba(103, 51, 43, 0.17);
  }

  .admin-status-change-button[data-status="CANCELED"] {
    border-color: #d3aaa4;
    color: #934a43;
    background: #fff2f0;
    box-shadow: none;
  }

  .admin-status-change-button:disabled {
    cursor: not-allowed;
    opacity: 0.58;
  }

  .admin-status-change-button:focus-visible {
    outline:
      4px solid
      rgba(239, 105, 83, 0.2);
    outline-offset: 2px;
  }

  .admin-status-final-box {
    margin-top: 10px;
    padding: 12px 13px;
    border:
      1px solid
      rgba(125, 82, 62, 0.12);
    border-radius: 11px;
    background: #f7f2ef;
  }

  .admin-status-final-box strong,
  .admin-status-final-box span {
    display: block;
  }

  .admin-status-final-box strong {
    color: #665047;
    font-size: 9.6px;
  }

  .admin-status-final-box span {
    margin-top: 4px;
    color: #9b867c;
    font-size: 8.4px;
    line-height: 1.6;
  }

  .admin-status-guide {
    margin: 10px 0 0;
    color: #9b867c;
    font-size: 8.4px;
    line-height: 1.65;
  }

  .admin-status-feedback {
    margin-top: 11px;
    padding: 10px 11px;
    display: grid;
    grid-template-columns:
      22px minmax(0, 1fr);
    align-items: start;
    gap: 8px;
    border:
      1px solid #a9cfb3;
    border-radius: 11px;
    color: #2f6743;
    background: #edf8f0;
  }

  .admin-status-feedback[data-type="error"] {
    border-color: #e0b0aa;
    color: #8d4039;
    background: #fff1ef;
  }

  .admin-status-feedback > span {
    width: 22px;
    height: 22px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    color: #ffffff;
    background: #57936a;
    font-size: 9.6px;
    font-weight: 900;
  }

  .admin-status-feedback[data-type="error"]
  > span {
    background: #bd655b;
  }

  .admin-status-feedback p {
    margin: 1px 0 0;
    white-space: pre-line;
    font-size: 8.4px;
    font-weight: 800;
    line-height: 1.7;
  }

  @media (max-width: 620px) {
    .admin-status-panel-header {
      align-items: stretch;
      flex-direction: column;
    }

    .admin-status-current {
      width: fit-content;
    }

    .admin-status-progress {
      padding-left: 10px;
      padding-right: 10px;
    }

    .admin-status-progress strong {
      white-space: normal;
    }

    .admin-status-action-heading {
      align-items: flex-start;
      flex-direction: column;
      gap: 3px;
    }

    .admin-status-change-button {
      width: 100%;
      justify-content:
        space-between;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .admin-status-change-button {
      transition: none;
    }
  }
`;
