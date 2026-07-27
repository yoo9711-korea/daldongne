"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminAIProductionManuscriptButtonProps = {
  orderRecordId: string;
  disabled?: boolean;
  disabledReason?: string | null;
};

type ManuscriptResponse = {
  ok?: boolean;
  message?: string;
  result?: {
    title?: string;
    chapterCount?: number;
    sectionCount?: number;
    usedSourceCount?: number;
    usedPhotoCount?: number;
    excludedSourceCount?: number;
    estimatedKoreanCharacterCount?: number;
    reviewRequired?: boolean;
    issueCount?: number;
  };
};

export default function AdminAIProductionManuscriptButton({
  orderRecordId,
  disabled = false,
  disabledReason = null,
}: AdminAIProductionManuscriptButtonProps) {
  const router = useRouter();

  const [isRunning, setIsRunning] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [isError, setIsError] =
    useState(false);

  const handleGenerate =
    async () => {
      if (
        disabled ||
        isRunning
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          [
            "AI 원고 자동 편집을 실행할까요?",
            "",
            "AI가 자료 분석 결과와 목차를 바탕으로 다음 작업을 진행합니다.",
            "• 책 제목과 부제 정리",
            "• 머리말과 맺음말 작성",
            "• 장별 전체 원고 초안 작성",
            "• 사진 설명과 배치 방향 작성",
            "• 불확실한 표현과 검수 항목 분류",
            "",
            "원본 사진과 글은 변경하거나 삭제하지 않습니다.",
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
            )}/ai-production/manuscript`,
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
            | ManuscriptResponse
            | null;

        if (
          !response.ok ||
          !data?.ok
        ) {
          throw new Error(
            data?.message ||
              "AI 원고 자동 편집을 실행하지 못했습니다.",
          );
        }

        const result =
          data.result;

        const resultText =
          result
            ? [
                data.message ||
                  "AI 원고 초안을 생성했습니다.",
                "",
                result.title
                  ? `원고 제목: ${result.title}`
                  : "",
                `장 수: ${result.chapterCount || 0}개`,
                `본문 구간: ${result.sectionCount || 0}개`,
                `사용 자료: ${result.usedSourceCount || 0}개`,
                `사용 사진: ${result.usedPhotoCount || 0}장`,
                `책에서 제외: ${result.excludedSourceCount || 0}개`,
                `예상 글자 수: ${(
                  result.estimatedKoreanCharacterCount ||
                  0
                ).toLocaleString()}자`,
                `검수 항목: ${result.issueCount || 0}건`,
                `최종 확인 필요: ${
                  result.reviewRequired
                    ? "예"
                    : "아니요"
                }`,
              ]
                .filter(Boolean)
                .join("\n")
            : data.message ||
              "AI 원고 초안을 생성했습니다.";

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
            : "AI 원고 자동 편집 중 오류가 발생했습니다.",
        );
      } finally {
        setIsRunning(false);
      }
    };

  return (
    <div className="admin-ai-manuscript-button">
      <button
        type="button"
        onClick={
          handleGenerate
        }
        disabled={
          disabled ||
          isRunning
        }
      >
        {isRunning
          ? "AI 원고 작성 중..."
          : "AI 원고 자동 편집 실행"}
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
        .admin-ai-manuscript-button {
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
              #835c45,
              #a97859
            );
          box-shadow:
            0 10px 24px
            rgba(
              112,
              74,
              51,
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