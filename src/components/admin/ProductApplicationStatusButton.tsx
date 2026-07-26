"use client";

import {
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

type ApplicationStatus =
  | "REQUESTED"
  | "CONTACTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELED";

type ProductApplicationStatusButtonProps = {
  applicationId: string;
  currentStatus: ApplicationStatus;
};

type StatusResponse = {
  ok?: boolean;
  message?: string;
  application?: {
    status?: ApplicationStatus;
  };
};

type Feedback = {
  type: "success" | "error";
  text: string;
} | null;

const STATUS_META: Record<
  ApplicationStatus,
  {
    label: string;
    shortLabel: string;
  }
> = {
  REQUESTED: {
    label: "상품 신청 접수",
    shortLabel: "접수",
  },
  CONTACTED: {
    label: "고객 연락 완료",
    shortLabel: "연락 완료",
  },
  IN_PROGRESS: {
    label: "상품 처리 진행 중",
    shortLabel: "진행 중",
  },
  COMPLETED: {
    label: "상품 처리 완료",
    shortLabel: "완료",
  },
  CANCELED: {
    label: "상품 신청 취소",
    shortLabel: "취소",
  },
};

const NEXT_STATUS_OPTIONS: Record<
  ApplicationStatus,
  readonly ApplicationStatus[]
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

const NORMAL_FLOW: ApplicationStatus[] = [
  "REQUESTED",
  "CONTACTED",
  "IN_PROGRESS",
  "COMPLETED",
];

export default function ProductApplicationStatusButton({
  applicationId,
  currentStatus,
}: ProductApplicationStatusButtonProps) {
  const router = useRouter();

  const [activeStatus, setActiveStatus] =
    useState<ApplicationStatus>(
      currentStatus,
    );

  const [isUpdating, setIsUpdating] =
    useState(false);

  const [updatingStatus, setUpdatingStatus] =
    useState<ApplicationStatus | null>(
      null,
    );

  const [feedback, setFeedback] =
    useState<Feedback>(null);

  useEffect(() => {
    setActiveStatus(
      currentStatus,
    );
  }, [currentStatus]);

  const nextStatuses =
    NEXT_STATUS_OPTIONS[
      activeStatus
    ];

  const currentFlowIndex =
    NORMAL_FLOW.indexOf(
      activeStatus,
    );

  const changeStatus = async (
    nextStatus: ApplicationStatus,
  ) => {
    if (isUpdating) {
      return;
    }

    if (
      nextStatus === "CANCELED" &&
      !window.confirm(
        "이 상품 신청을 취소 상태로 변경하시겠습니까?",
      )
    ) {
      return;
    }

    if (
      nextStatus === "COMPLETED" &&
      !window.confirm(
        "이 상품 신청을 처리 완료로 변경하시겠습니까?",
      )
    ) {
      return;
    }

    setIsUpdating(true);
    setUpdatingStatus(
      nextStatus,
    );
    setFeedback(null);

    try {
      const response = await fetch(
        `/api/admin/product-applications/${encodeURIComponent(
          applicationId,
        )}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        },
      );

      const data =
        (await response
          .json()
          .catch(() => null)) as
          | StatusResponse
          | null;

      if (
        !response.ok ||
        !data?.ok
      ) {
        setFeedback({
          type: "error",
          text:
            data?.message ||
            "신청 상태를 변경하지 못했습니다.",
        });
        return;
      }

      const savedStatus =
        data.application?.status &&
        isApplicationStatus(
          data.application.status,
        )
          ? data.application.status
          : nextStatus;

      setActiveStatus(
        savedStatus,
      );

      setFeedback({
        type: "success",
        text:
          data.message ||
          "상품 신청 상태가 변경되었습니다.",
      });

      router.refresh();
    } catch (error) {
      console.error(
        "[PRODUCT_APPLICATION_STATUS_BUTTON_ERROR]",
        error,
      );

      setFeedback({
        type: "error",
        text:
          "신청 상태 변경 중 오류가 발생했습니다.",
      });
    } finally {
      setIsUpdating(false);
      setUpdatingStatus(null);
    }
  };

  return (
    <section className="admin-application-status">
      <header className="admin-application-status-header">
        <div>
          <span>
            PRODUCT APPLICATION
          </span>

          <h3>
            상품 신청 상태 관리
          </h3>

          <p>
            접수부터 처리 완료까지 고객
            대응 상태를 관리합니다.
          </p>
        </div>

        <strong
          data-status={
            activeStatus
          }
        >
          <i aria-hidden="true" />

          {
            STATUS_META[
              activeStatus
            ].label
          }
        </strong>
      </header>

      {activeStatus !==
      "CANCELED" ? (
        <ol
          className="admin-application-progress"
          aria-label="상품 신청 처리 단계"
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

                  <b>
                    {
                      STATUS_META[
                        status
                      ].shortLabel
                    }
                  </b>
                </li>
              );
            },
          )}
        </ol>
      ) : (
        <div className="admin-application-canceled">
          취소 처리된 상품 신청입니다.
        </div>
      )}

      <div className="admin-application-status-body">
        <div className="admin-application-action-heading">
          <strong>
            다음 처리 단계
          </strong>

          <span>
            현재 단계에서 이동할 수 있는
            상태만 표시됩니다.
          </span>
        </div>

        {nextStatuses.length > 0 ? (
          <div className="admin-application-status-buttons">
            {nextStatuses.map(
              (nextStatus) => {
                const updating =
                  updatingStatus ===
                  nextStatus;

                return (
                  <button
                    key={nextStatus}
                    type="button"
                    disabled={isUpdating}
                    onClick={() =>
                      void changeStatus(
                        nextStatus,
                      )
                    }
                    data-status={
                      nextStatus
                    }
                  >
                    <span>
                      {updating
                        ? "변경 중..."
                        : getStatusButtonLabel(
                            nextStatus,
                          )}
                    </span>

                    {!updating ? (
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
          <div className="admin-application-final">
            <strong>
              {activeStatus ===
              "COMPLETED"
                ? "처리가 완료된 신청입니다."
                : "취소된 신청입니다."}
            </strong>

            <span>
              최종 상태에서는 추가 상태
              변경이 제한됩니다.
            </span>
          </div>
        )}

        {feedback ? (
          <div
            role="status"
            aria-live="polite"
            data-type={
              feedback.type
            }
            className="admin-application-feedback"
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
        {applicationStatusStyles}
      </style>
    </section>
  );
}

function isApplicationStatus(
  value: unknown,
): value is ApplicationStatus {
  return (
    value === "REQUESTED" ||
    value === "CONTACTED" ||
    value === "IN_PROGRESS" ||
    value === "COMPLETED" ||
    value === "CANCELED"
  );
}

function getStatusButtonLabel(
  status: ApplicationStatus,
) {
  if (status === "CONTACTED") {
    return "연락 완료로 변경";
  }

  if (status === "IN_PROGRESS") {
    return "진행 중으로 변경";
  }

  if (status === "COMPLETED") {
    return "처리 완료로 변경";
  }

  if (status === "CANCELED") {
    return "신청 취소";
  }

  return "상태 변경";
}

const applicationStatusStyles = `
  .admin-application-status,
  .admin-application-status * {
    box-sizing: border-box;
  }

  .admin-application-status {
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

  .admin-application-status-header {
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

  .admin-application-status-header
  > div > span {
    display: block;
    color: #d3624e;
    font-size: 7px;
    font-weight: 900;
    letter-spacing: 0.1em;
  }

  .admin-application-status-header h3 {
    margin: 5px 0 0;
    color: #4f362d;
    font-size: 13px;
    letter-spacing: -0.035em;
  }

  .admin-application-status-header p {
    margin: 5px 0 0;
    color: #92796d;
    font-size: 8px;
    line-height: 1.65;
  }

  .admin-application-status-header
  > strong {
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
    font-size: 8px;
    white-space: nowrap;
  }

  .admin-application-status-header
  > strong > i {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #d39b55;
    box-shadow:
      0 0 0 3px
      rgba(211, 155, 85, 0.14);
  }

  .admin-application-status-header
  > strong[data-status="CONTACTED"]
  > i {
    background: #4f8dbc;
    box-shadow:
      0 0 0 3px
      rgba(79, 141, 188, 0.14);
  }

  .admin-application-status-header
  > strong[data-status="IN_PROGRESS"]
  > i {
    background: #8160ae;
    box-shadow:
      0 0 0 3px
      rgba(129, 96, 174, 0.14);
  }

  .admin-application-status-header
  > strong[data-status="COMPLETED"]
  > i {
    background: #4f9364;
    box-shadow:
      0 0 0 3px
      rgba(79, 147, 100, 0.14);
  }

  .admin-application-status-header
  > strong[data-status="CANCELED"]
  > i {
    background: #a07f7a;
    box-shadow:
      0 0 0 3px
      rgba(160, 127, 122, 0.14);
  }

  .admin-application-progress {
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

  .admin-application-progress li {
    position: relative;
    min-width: 0;
    display: grid;
    justify-items: center;
    gap: 5px;
    color: #aa9388;
    text-align: center;
  }

  .admin-application-progress li:not(:last-child)::after {
    content: "";
    position: absolute;
    top: 12px;
    left: calc(50% + 15px);
    width: calc(100% - 30px);
    height: 2px;
    background: #e6d9d2;
  }

  .admin-application-progress li[data-completed="true"]:not(:last-child)::after {
    background: #d77865;
  }

  .admin-application-progress li > span {
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
    font-size: 8px;
    font-weight: 900;
  }

  .admin-application-progress li[data-active="true"]
  > span {
    border-color: #d66450;
    color: #ffffff;
    background: #d66450;
    box-shadow:
      0 0 0 4px
      rgba(214, 100, 80, 0.13);
  }

  .admin-application-progress li[data-completed="true"]
  > span {
    border-color: #d77865;
    color: #ffffff;
    background: #d77865;
  }

  .admin-application-progress b {
    overflow: hidden;
    font-size: 7px;
    line-height: 1.4;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .admin-application-progress li[data-active="true"]
  b,
  .admin-application-progress li[data-completed="true"]
  b {
    color: #6c4439;
  }

  .admin-application-canceled {
    padding: 14px 17px;
    border-top:
      1px solid
      rgba(126, 83, 63, 0.09);
    border-bottom:
      1px solid
      rgba(126, 83, 63, 0.09);
    color: #87514a;
    background: #fff1ef;
    font-size: 9px;
    font-weight: 900;
    text-align: center;
  }

  .admin-application-status-body {
    padding: 17px;
  }

  .admin-application-action-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .admin-application-action-heading strong {
    color: #574037;
    font-size: 9px;
  }

  .admin-application-action-heading span {
    color: #9f887d;
    font-size: 7px;
  }

  .admin-application-status-buttons {
    margin-top: 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  .admin-application-status-buttons button {
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
    font-size: 8px;
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

  .admin-application-status-buttons
  button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow:
      0 10px 19px
      rgba(103, 51, 43, 0.17);
  }

  .admin-application-status-buttons
  button[data-status="CANCELED"] {
    border-color: #d3aaa4;
    color: #934a43;
    background: #fff2f0;
    box-shadow: none;
  }

  .admin-application-status-buttons
  button:disabled {
    cursor: not-allowed;
    opacity: 0.58;
  }

  .admin-application-status-buttons
  button:focus-visible {
    outline:
      4px solid
      rgba(239, 105, 83, 0.2);
    outline-offset: 2px;
  }

  .admin-application-final {
    margin-top: 10px;
    padding: 12px 13px;
    border:
      1px solid
      rgba(125, 82, 62, 0.12);
    border-radius: 11px;
    background: #f7f2ef;
  }

  .admin-application-final strong,
  .admin-application-final span {
    display: block;
  }

  .admin-application-final strong {
    color: #665047;
    font-size: 8px;
  }

  .admin-application-final span {
    margin-top: 4px;
    color: #9b867c;
    font-size: 7px;
    line-height: 1.6;
  }

  .admin-application-feedback {
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

  .admin-application-feedback[data-type="error"] {
    border-color: #e0b0aa;
    color: #8d4039;
    background: #fff1ef;
  }

  .admin-application-feedback > span {
    width: 22px;
    height: 22px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    color: #ffffff;
    background: #57936a;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-application-feedback[data-type="error"]
  > span {
    background: #bd655b;
  }

  .admin-application-feedback p {
    margin: 1px 0 0;
    white-space: pre-line;
    font-size: 7px;
    font-weight: 800;
    line-height: 1.7;
  }

  @media (max-width: 620px) {
    .admin-application-status-header {
      align-items: stretch;
      flex-direction: column;
    }

    .admin-application-status-header
    > strong {
      width: fit-content;
    }

    .admin-application-progress {
      padding-left: 10px;
      padding-right: 10px;
    }

    .admin-application-progress b {
      white-space: normal;
    }

    .admin-application-action-heading {
      align-items: flex-start;
      flex-direction: column;
      gap: 3px;
    }

    .admin-application-status-buttons
    button {
      width: 100%;
      justify-content:
        space-between;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .admin-application-status-buttons
    button {
      transition: none;
    }
  }
`;
