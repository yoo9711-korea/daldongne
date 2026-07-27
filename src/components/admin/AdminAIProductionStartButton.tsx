"use client";

import { useRouter } from "next/navigation";
import {
  useState,
} from "react";

type AdminAIProductionStartButtonProps = {
  orderRecordId: string;
  disabled?: boolean;
  disabledReason?: string | null;
};

type StartResponse = {
  ok?: boolean;
  message?: string;
  run?: {
    id?: string;
    status?: string;
    currentStep?: string;
    attempt?: number;
  };
};

export default function AdminAIProductionStartButton({
  orderRecordId,
  disabled = false,
  disabledReason = null,
}: AdminAIProductionStartButtonProps) {
  const router =
    useRouter();

  const [
    isStarting,
    setIsStarting,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    isError,
    setIsError,
  ] = useState(false);

  const handleStart =
    async () => {
      if (
        disabled ||
        isStarting
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          [
            "AI 자동 제작을 시작할까요?",
            "",
            "원본 사진과 글은 변경하거나 삭제하지 않습니다.",
            "AI는 복사된 자료를 사용해 원고 편집과 검수를 진행합니다.",
          ].join("\n"),
        );

      if (!confirmed) {
        return;
      }

      setIsStarting(true);
      setMessage("");
      setIsError(false);

      try {
        const response =
          await fetch(
            `/api/admin/orders/${encodeURIComponent(
              orderRecordId,
            )}/ai-production/start`,
            {
              method: "POST",
              headers: {
                Accept:
                  "application/json",
              },
            },
          );

        const data =
          (await response
            .json()
            .catch(
              () => null,
            )) as
            | StartResponse
            | null;

        if (
          !response.ok ||
          !data?.ok
        ) {
          throw new Error(
            data?.message ||
              "AI 자동 제작을 시작하지 못했습니다.",
          );
        }

        setIsError(false);
        setMessage(
          data.message ||
            "AI 자동 제작 작업을 시작했습니다.",
        );

        router.refresh();
      } catch (error) {
        setIsError(true);

        setMessage(
          error instanceof Error
            ? error.message
            : "AI 자동 제작 시작 중 오류가 발생했습니다.",
        );
      } finally {
        setIsStarting(false);
      }
    };

  return (
    <div className="admin-ai-production-start">
      <button
        type="button"
        onClick={
          handleStart
        }
        disabled={
          disabled ||
          isStarting
        }
      >
        {isStarting
          ? "AI 작업 생성 중..."
          : "AI 자동 제작 시작"}
      </button>

      {disabled &&
      disabledReason ? (
        <p data-tone="notice">
          {disabledReason}
        </p>
      ) : null}

      {message ? (
        <p
          role={
            isError
              ? "alert"
              : "status"
          }
          data-tone={
            isError
              ? "error"
              : "success"
          }
        >
          {message}
        </p>
      ) : null}

      <style jsx>{`
        .admin-ai-production-start {
          display: grid;
          gap: 9px;
        }

        button {
          width: 100%;
          min-height: 46px;
          padding: 0 17px;
          border: 0;
          border-radius: 12px;
          color: #ffffff;
          background:
            linear-gradient(
              135deg,
              #6f4b8f,
              #8b65a7
            );
          box-shadow:
            0 10px 24px
            rgba(
              91,
              59,
              117,
              0.18
            );
          font: inherit;
          font-size: 10px;
          font-weight: 900;
          cursor: pointer;
          transition:
            transform 0.16s ease,
            opacity 0.16s ease;
        }

        button:hover:not(
          :disabled
        ) {
          transform:
            translateY(-1px);
        }

        button:disabled {
          color: #9c8b83;
          background: #e8e0dc;
          box-shadow: none;
          cursor:
            not-allowed;
          opacity: 0.82;
        }

        p {
          margin: 0;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 9px;
          line-height: 1.65;
        }

        p[data-tone="notice"] {
          color: #79675f;
          background: #f4efec;
        }

        p[data-tone="success"] {
          color: #386348;
          background: #e9f5ed;
        }

        p[data-tone="error"] {
          color: #91483f;
          background: #fff0ed;
        }
      `}</style>
    </div>
  );
}