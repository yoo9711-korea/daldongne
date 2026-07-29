"use client";

import {
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

type Props = {
  orderRecordId: string;
  disabled?: boolean;
};

type ReviewAction =
  | "APPROVE"
  | "REQUEST_CHANGES";

type ApiResponse = {
  ok?: boolean;
  message?: string;
};

export default function OrderProofReviewActions({
  orderRecordId,
  disabled = false,
}: Props) {
  const router =
    useRouter();

  const [isRequestFormOpen, setIsRequestFormOpen] =
    useState(false);

  const [requestMessage, setRequestMessage] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [notice, setNotice] =
    useState("");

  const [isError, setIsError] =
    useState(false);

  const submitReview =
    async (
      action: ReviewAction,
    ) => {
      if (
        disabled ||
        isSubmitting
      ) {
        return;
      }

      const normalizedMessage =
        requestMessage.trim();

      if (
        action ===
          "REQUEST_CHANGES" &&
        normalizedMessage.length < 10
      ) {
        setIsError(true);

        setNotice(
          "수정 요청 내용을 10자 이상 입력해 주세요.",
        );

        return;
      }

      const confirmMessage =
        action === "APPROVE"
          ? [
              "현재 교정본을 인쇄용 최종본으로 승인할까요?",
              "",
              "승인 후 현재 교정본은 인쇄용 최종본으로 확정되며, 원칙적으로 다시 수정하기 어렵습니다.",
            ].join("\n")
          : [
              "작성한 수정 요청을 담당자에게 전달할까요?",
              "",
              "새 교정본이 준비되면 다시 확인할 수 있습니다.",
            ].join("\n");

      if (
        !window.confirm(
          confirmMessage,
        )
      ) {
        return;
      }

      setIsSubmitting(true);
      setNotice("");
      setIsError(false);

      try {
        const response =
          await fetch(
            `/api/orders/${encodeURIComponent(
              orderRecordId,
            )}/proof-review`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                action,
                message:
                  action ===
                  "REQUEST_CHANGES"
                    ? normalizedMessage
                    : "",
              }),
            },
          );

        const data =
          (await response
            .json()
            .catch(
              () => null,
            )) as
            | ApiResponse
            | null;

        if (
          !response.ok ||
          !data?.ok
        ) {
          throw new Error(
            data?.message ||
              "교정 응답을 처리하지 못했습니다.",
          );
        }

        setRequestMessage("");
        setIsRequestFormOpen(false);
        setIsError(false);

        setNotice(
          data.message ||
            "교정 응답이 정상적으로 접수되었습니다.",
        );

        router.refresh();
      } catch (error) {
        setIsError(true);

        setNotice(
          error instanceof Error
            ? error.message
            : "교정 응답 처리 중 오류가 발생했습니다.",
        );
      } finally {
        setIsSubmitting(false);
      }
    };

  return (
    <div className="order-proof-review-actions">
      <style>
        {proofReviewActionStyles}
      </style>

      <div className="order-proof-review-button-row">
        <button
          type="button"
          className="order-proof-review-approve"
          disabled={
            disabled ||
            isSubmitting
          }
          onClick={() =>
            submitReview(
              "APPROVE",
            )
          }
        >
          {isSubmitting
            ? "처리 중..."
            : "인쇄용 최종본 승인"}
        </button>

        <button
          type="button"
          className="order-proof-review-change-toggle"
          disabled={
            disabled ||
            isSubmitting
          }
          aria-expanded={
            isRequestFormOpen
          }
          onClick={() => {
            setIsRequestFormOpen(
              (current) =>
                !current,
            );

            setNotice("");
            setIsError(false);
          }}
        >
          {isRequestFormOpen
            ? "수정 요청 닫기"
            : "수정 내용 작성"}
        </button>
      </div>

      {isRequestFormOpen ? (
        <div className="order-proof-review-request-form">
          <label>
            <span>
              수정 요청 내용
            </span>

            <textarea
              value={
                requestMessage
              }
              onChange={(
                event,
              ) => {
                setRequestMessage(
                  event.target
                    .value,
                );

                setNotice("");
                setIsError(false);
              }}
              rows={6}
              minLength={10}
              maxLength={3000}
              placeholder="수정할 페이지, 문장, 사진과 원하는 변경 내용을 구체적으로 작성해 주세요."
              disabled={
                isSubmitting
              }
            />

            <small>
              {requestMessage.length.toLocaleString()}
              {" / 3,000자"}
            </small>
          </label>

          <button
            type="button"
            disabled={
              isSubmitting
            }
            onClick={() =>
              submitReview(
                "REQUEST_CHANGES",
              )
            }
          >
            {isSubmitting
              ? "전달 중..."
              : "수정 요청 전달"}
          </button>
        </div>
      ) : null}

      {notice ? (
        <div
          className="order-proof-review-notice"
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
          {notice}
        </div>
      ) : null}
    </div>
  );
}

const proofReviewActionStyles = `
  .order-proof-review-actions,
  .order-proof-review-actions * {
    box-sizing: border-box;
  }

  .order-proof-review-actions {
    margin-top: 18px;
  }

  .order-proof-review-button-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .order-proof-review-button-row button,
  .order-proof-review-request-form > button {
    min-height: 44px;
    padding: 0 16px;
    border-radius: 11px;
    font: inherit;
    font-size: 10px;
    font-weight: 900;
    cursor: pointer;
  }

  .order-proof-review-approve {
    border: 0;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #5c8c6d,
        #3e7052
      );
    box-shadow:
      0 8px 18px
      rgba(63, 112, 82, 0.18);
  }

  .order-proof-review-change-toggle {
    border:
      1px solid
      #d8b9ab;
    color: #74564b;
    background: #ffffff;
  }

  .order-proof-review-button-row button:hover:not(:disabled),
  .order-proof-review-request-form > button:hover:not(:disabled) {
    transform:
      translateY(-1px);
  }

  .order-proof-review-button-row button:disabled,
  .order-proof-review-request-form > button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .order-proof-review-request-form {
    margin-top: 13px;
    padding: 16px;
    border:
      1px solid
      #e1cec5;
    border-radius: 15px;
    background:
      rgba(
        255,
        253,
        250,
        0.94
      );
  }

  .order-proof-review-request-form label > span,
  .order-proof-review-request-form label > small {
    display: block;
  }

  .order-proof-review-request-form label > span {
    color: #6d5247;
    font-size: 10px;
    font-weight: 900;
  }

  .order-proof-review-request-form textarea {
    width: 100%;
    margin-top: 8px;
    padding: 12px 13px;
    resize: vertical;
    border:
      1px solid
      #d9c1b7;
    border-radius: 11px;
    color: #4e3931;
    background: #ffffff;
    font: inherit;
    font-size: 11px;
    line-height: 1.7;
  }

  .order-proof-review-request-form textarea:focus {
    outline:
      3px solid
      rgba(
        126,
        91,
        158,
        0.16
      );
    border-color: #9f81b9;
  }

  .order-proof-review-request-form label > small {
    margin-top: 6px;
    color: #998278;
    font-size: 9px;
    text-align: right;
  }

  .order-proof-review-request-form > button {
    margin-top: 11px;
    border: 0;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #e97760,
        #d75b47
      );
  }

  .order-proof-review-notice {
    margin-top: 12px;
    padding: 11px 13px;
    border:
      1px solid
      #b9d8c3;
    border-radius: 11px;
    color: #356447;
    background: #eef8f1;
    font-size: 10px;
    line-height: 1.65;
  }

  .order-proof-review-notice[data-tone="error"] {
    border-color: #e5b4ab;
    color: #91493f;
    background: #fff0ed;
  }

  @media (max-width: 520px) {
    .order-proof-review-button-row {
      display: grid;
      grid-template-columns: 1fr;
    }

    .order-proof-review-button-row button,
    .order-proof-review-request-form > button {
      width: 100%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .order-proof-review-button-row button,
    .order-proof-review-request-form > button {
      transition: none;
    }
  }
`;
