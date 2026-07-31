"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminAIProductionAnalyzeButtonProps = {
  orderRecordId: string;
  disabled?: boolean;
  disabledReason?: string | null;
};

type AnalyzeResponse = {
  ok?: boolean;
  message?: string;
  result?: {
    chapterCount?: number;
    usableSourceCount?: number;
    includePhotoCount?: number;
    reservePhotoCount?: number;
    excludedPhotoCount?: number;
    reviewRequired?: boolean;
    issueCount?: number;
  };
};

export default function AdminAIProductionAnalyzeButton({
  orderRecordId,
  disabled = false,
  disabledReason = null,
}: AdminAIProductionAnalyzeButtonProps) {
  const router = useRouter();

  const [isRunning, setIsRunning] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [isError, setIsError] =
    useState(false);

  const handleAnalyze = async () => {
    if (
      disabled ||
      isRunning
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        [
          "AI 자료 분석을 실행할까요?",
          "",
          "현재 저장된 원본 스냅샷을 이용해 다음 작업을 진행합니다.",
          "• 자료와 시간 흐름 분석",
          "• 책의 목차 구성",
          "• 사진 사용 계획 작성",
          "• 검토 필요 항목 분류",
          "",
          "원본 사진과 글은 변경되지 않습니다.",
        ].join("\n"),
      );

    if (!confirmed) {
      return;
    }

    setIsRunning(true);
    setMessage("");
    setIsError(false);

    try {
      const response =
        await fetch(
          `/api/admin/orders/${encodeURIComponent(
            orderRecordId,
          )}/ai-production/analyze`,
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
          | AnalyzeResponse
          | null;

      if (
        !response.ok ||
        !data?.ok
      ) {
        throw new Error(
          data?.message ||
            "AI 자료 분석을 실행하지 못했습니다.",
        );
      }

      const result =
        data.result;

      const resultText =
        result
          ? [
              data.message ||
                "AI 자료 분석을 완료했습니다.",
              "",
              `목차: ${result.chapterCount || 0}개`,
              `사용 자료: ${result.usableSourceCount || 0}개`,
              `사용 사진: ${result.includePhotoCount || 0}장`,
              `예비 사진: ${result.reservePhotoCount || 0}장`,
              `책에서 제외: ${result.excludedPhotoCount || 0}장`,
              `검수 항목: ${result.issueCount || 0}건`,
            ].join("\n")
          : data.message ||
            "AI 자료 분석을 완료했습니다.";

      setIsError(false);
      setMessage(
        resultText,
      );

      router.refresh();
    } catch (error) {
      setIsError(true);

      setMessage(
        error instanceof Error
          ? error.message
          : "AI 자료 분석 중 오류가 발생했습니다.",
      );
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="admin-ai-analyze-button">
      <button
        type="button"
        onClick={
          handleAnalyze
        }
        disabled={
          disabled ||
          isRunning
        }
      >
        {isRunning
          ? "AI 자료 분석 중..."
          : "AI 자료 분석 실행"}
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
        .admin-ai-analyze-button {
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
              #4d668f,
              #6686ae
            );
          box-shadow:
            0 10px 24px
            rgba(
              58,
              79,
              112,
              0.18
            );
          font: inherit;
          font-size: 12px;
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
          font-size: 10.8px;
          line-height: 1.7;
          white-space: pre-line;
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