"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type RetryStep =
  | "MATERIAL_ANALYSIS"
  | "MANUSCRIPT_EDITING"
  | "FINAL_PDF";

type ResumeApiStep =
  | "analyze"
  | "manuscript"
  | "pdf";

type ApiResponse = {
  ok?: boolean;
  message?: string;
  retryStep?: string;
  run?: {
    id?: string;
    attempt?: number;
    status?: string;
    currentStep?: string;
    requiresHumanReview?: boolean;
  };
  result?: {
    qualityBlocked?: boolean;
    reviewRequired?: boolean;
  };
};

type AdminAIProductionRetryButtonProps = {
  orderRecordId: string;
  failedStep: string;
  failureReason?: string | null;
};

const STEP_LABELS: Record<
  RetryStep,
  string
> = {
  MATERIAL_ANALYSIS:
    "자료 분석·목차 구성",
  MANUSCRIPT_EDITING:
    "원고·사진·페이지 제작",
  FINAL_PDF:
    "최종 PDF 생성",
};

const API_STEP_LABELS: Record<
  ResumeApiStep,
  string
> = {
  analyze:
    "자료 분석·목차 구성",
  manuscript:
    "원고·사진·페이지·품질 검수",
  pdf:
    "최종 PDF 생성",
};

export default function AdminAIProductionRetryButton({
  orderRecordId,
  failedStep,
  failureReason = null,
}: AdminAIProductionRetryButtonProps) {
  const router =
    useRouter();

  const [
    isRunning,
    setIsRunning,
  ] = useState(false);

  const [
    progressMessage,
    setProgressMessage,
  ] = useState("");

  const [
    resultMessage,
    setResultMessage,
  ] = useState("");

  const [
    resultTone,
    setResultTone,
  ] = useState<
    "success" | "notice" | "error"
  >("notice");

  const retryStep =
    normalizeRetryStep(
      failedStep,
    );

  if (!retryStep) {
    return (
      <section className="admin-ai-retry">
        <p
          className="admin-ai-retry-message"
          data-tone="error"
        >
          현재 실패 단계는 자동
          복구할 수 없습니다.
        </p>

        <style jsx>{retryStyles}</style>
      </section>
    );
  }

  const handleRetry =
    async () => {
      if (isRunning) {
        return;
      }

      const cleanedReason =
        cleanText(
          failureReason,
        );

      const reasonPreview =
        cleanedReason.length >
        500
          ? `${cleanedReason.slice(
              0,
              500,
            )}…`
          : cleanedReason;

      const confirmed =
        window.confirm(
          [
            `${STEP_LABELS[retryStep]} 실패 상태를 복구하고 자동 제작을 다시 진행할까요?`,
            "",
            reasonPreview
              ? `실패 기록:\n${reasonPreview}`
              : "기록된 실패 단계부터 다시 실행합니다.",
            "",
            "새 제작 회차를 만들지 않고 현재 회차를 이어서 사용합니다.",
            "성공한 이전 단계의 결과는 다시 만들지 않습니다.",
            "최종 관리자 승인은 자동 처리하지 않습니다.",
          ].join("\n"),
        );

      if (!confirmed) {
        return;
      }

      setIsRunning(true);
      setProgressMessage(
        "실패 상태를 복구하고 있습니다.",
      );
      setResultMessage("");
      setResultTone(
        "notice",
      );

      try {
        const retryResult =
          await callJsonApi(
            `/api/admin/orders/${encodeURIComponent(
              orderRecordId,
            )}/ai-production/retry`,
          );

        const restoredStep =
          normalizeRetryStep(
            retryResult.retryStep ||
              retryResult.run
                ?.currentStep ||
              retryStep,
          );

        if (!restoredStep) {
          throw new Error(
            "복구된 제작 단계를 확인할 수 없습니다.",
          );
        }

        const resumeSteps =
          getResumeSteps(
            restoredStep,
          );

        for (
          const apiStep of
          resumeSteps
        ) {
          setProgressMessage(
            `${API_STEP_LABELS[apiStep]} 작업을 진행하고 있습니다.`,
          );

          const stepResult =
            await callJsonApi(
              getApiEndpoint(
                orderRecordId,
                apiStep,
              ),
            );

          const stopMessage =
            validateResumeResult(
              apiStep,
              stepResult,
            );

          if (stopMessage) {
            setProgressMessage(
              "",
            );

            setResultMessage(
              stopMessage,
            );

            setResultTone(
              "notice",
            );

            router.refresh();

            return;
          }
        }

        setProgressMessage(
          "",
        );

        setResultMessage(
          "실패한 단계부터 자동 제작을 재개해 최종 PDF 생성을 완료했습니다. 관리자 최종 승인 단계로 이동했습니다.",
        );

        setResultTone(
          "success",
        );

        router.refresh();
      } catch (error) {
        setProgressMessage(
          "",
        );

        setResultMessage(
          error instanceof
          Error
            ? error.message
            : "AI 제작 복구 중 오류가 발생했습니다.",
        );

        setResultTone(
          "error",
        );

        router.refresh();
      } finally {
        setIsRunning(
          false,
        );
      }
    };

  return (
    <section className="admin-ai-retry">
      <header>
        <div>
          <p>
            FAILED STEP RECOVERY
          </p>

          <h3>
            실패 단계 자동 복구
          </h3>
        </div>

        <strong>
          {
            STEP_LABELS[
              retryStep
            ]
          }
        </strong>
      </header>

      <p className="admin-ai-retry-description">
        새 회차를 만들지 않고 현재
        실패 회차를 복구합니다. 이미
        완료된 단계는 유지하고 실패한
        단계부터 최종 PDF까지 다시
        진행합니다.
      </p>

      {failureReason ? (
        <div className="admin-ai-retry-reason">
          <strong>
            기록된 실패 사유
          </strong>

          <p>
            {failureReason}
          </p>
        </div>
      ) : null}

      <button
        type="button"
        disabled={
          isRunning
        }
        onClick={
          handleRetry
        }
      >
        {isRunning
          ? progressMessage ||
            "실패 단계 복구 중..."
          : "실패 단계 복구 후 자동 재개"}
      </button>

      {progressMessage ? (
        <p
          className="admin-ai-retry-message"
          data-tone="notice"
          role="status"
        >
          {progressMessage}
        </p>
      ) : null}

      {resultMessage ? (
        <p
          className="admin-ai-retry-message"
          data-tone={
            resultTone
          }
          role={
            resultTone ===
            "error"
              ? "alert"
              : "status"
          }
        >
          {resultMessage}
        </p>
      ) : null}

      <style jsx>{retryStyles}</style>
    </section>
  );
}

function normalizeRetryStep(
  value: unknown,
): RetryStep | null {
  const step =
    cleanText(value);

  if (
    step ===
    "MATERIAL_ANALYSIS"
  ) {
    return step;
  }

  if (
    step ===
    "MANUSCRIPT_EDITING"
  ) {
    return step;
  }

  if (
    step ===
    "FINAL_PDF"
  ) {
    return step;
  }

  return null;
}

function getResumeSteps(
  retryStep: RetryStep,
): ResumeApiStep[] {
  if (
    retryStep ===
    "MATERIAL_ANALYSIS"
  ) {
    return [
      "analyze",
      "manuscript",
      "pdf",
    ];
  }

  if (
    retryStep ===
    "MANUSCRIPT_EDITING"
  ) {
    return [
      "manuscript",
      "pdf",
    ];
  }

  return ["pdf"];
}

function getApiEndpoint(
  orderRecordId: string,
  step: ResumeApiStep,
) {
  const encodedOrderId =
    encodeURIComponent(
      orderRecordId,
    );

  return `/api/admin/orders/${encodedOrderId}/ai-production/${step}`;
}

async function callJsonApi(
  endpoint: string,
): Promise<ApiResponse> {
  const response =
    await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept:
          "application/json",
      },
    });

  const result =
    (await response
      .json()
      .catch(
        () => null,
      )) as
      | ApiResponse
      | null;

  if (
    !response.ok ||
    !result?.ok
  ) {
    throw new Error(
      result?.message ||
        "AI 제작 작업을 완료하지 못했습니다.",
    );
  }

  return result;
}

function validateResumeResult(
  step: ResumeApiStep,
  result: ApiResponse,
) {
  const status =
    cleanText(
      result.run?.status,
    );

  const currentStep =
    cleanText(
      result.run
        ?.currentStep,
    );

  if (
    step === "analyze"
  ) {
    if (
      status ===
      "NEEDS_INPUT"
    ) {
      return (
        result.message ||
        "자료 확인이 필요하여 자동 제작을 멈췄습니다."
      );
    }

    if (
      status &&
      (
        status !==
          "RUNNING" ||
        currentStep !==
          "MANUSCRIPT_EDITING"
      )
    ) {
      return `자료 분석 복구 후 다음 단계로 이동하지 못했습니다. 현재 상태: ${status} / ${currentStep}`;
    }
  }

  if (
    step ===
    "manuscript"
  ) {
    if (
      status ===
        "NEEDS_INPUT" ||
      result.result
        ?.qualityBlocked ===
        true
    ) {
      return (
        result.message ||
        "품질 검수 차단 항목이 발견되어 자동 제작을 멈췄습니다."
      );
    }

    if (
      status &&
      (
        status !==
          "RUNNING" ||
        currentStep !==
          "FINAL_PDF"
      )
    ) {
      return `원고 제작 복구 후 최종 PDF 단계로 이동하지 못했습니다. 현재 상태: ${status} / ${currentStep}`;
    }
  }

  if (step === "pdf") {
    if (
      status &&
      status !==
        "READY_FOR_APPROVAL" &&
      status !==
        "APPROVED"
    ) {
      return `PDF 재생성 후 관리자 승인 단계로 이동하지 못했습니다. 현재 상태: ${status} / ${currentStep}`;
    }
  }

  return null;
}

function cleanText(
  value: unknown,
) {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

const retryStyles = `
  .admin-ai-retry {
    margin-top: 14px;
    padding: 17px;
    border: 1px solid #e0a49d;
    border-radius: 16px;
    background:
      linear-gradient(
        145deg,
        #fff4f1,
        #ffffff
      );
  }

  header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
  }

  header p {
    margin: 0;
    color: #a15b52;
    font-size: 8px;
    font-weight: 900;
    letter-spacing: 0.11em;
  }

  header h3 {
    margin: 5px 0 0;
    color: #74453f;
    font-family:
      var(
        --font-daldongne-serif
      ),
      "Noto Serif KR",
      serif;
    font-size: 17px;
  }

  header > strong {
    min-height: 29px;
    padding: 0 10px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    color: #934d45;
    background: #ffe2de;
    font-size: 8px;
    white-space: nowrap;
  }

  .admin-ai-retry-description {
    margin: 10px 0 0;
    color: #826d69;
    font-size: 9px;
    line-height: 1.7;
  }

  .admin-ai-retry-reason {
    margin-top: 12px;
    padding: 11px 12px;
    border: 1px solid #efd2ce;
    border-radius: 11px;
    background: #ffffff;
  }

  .admin-ai-retry-reason strong {
    color: #874d46;
    font-size: 9px;
  }

  .admin-ai-retry-reason p {
    max-height: 130px;
    margin: 6px 0 0;
    overflow: auto;
    color: #7e6865;
    font-size: 9px;
    line-height: 1.7;
    white-space: pre-line;
  }

  button {
    width: 100%;
    min-height: 48px;
    margin-top: 13px;
    padding: 0 17px;
    border: 0;
    border-radius: 12px;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #a75e55,
        #c77a70
      );
    box-shadow:
      0 10px 24px
      rgba(
        138,
        72,
        64,
        0.18
      );
    font: inherit;
    font-size: 10px;
    font-weight: 900;
    cursor: pointer;
  }

  button:disabled {
    color: #9d8e8b;
    background: #e7dddb;
    box-shadow: none;
    cursor: not-allowed;
  }

  .admin-ai-retry-message {
    margin: 10px 0 0;
    padding: 10px 12px;
    border-radius: 10px;
    font-size: 9px;
    line-height: 1.7;
    white-space: pre-line;
  }

  .admin-ai-retry-message[data-tone="success"] {
    color: #386348;
    background: #e9f5ed;
  }

  .admin-ai-retry-message[data-tone="notice"] {
    color: #785d31;
    background: #fff7df;
  }

  .admin-ai-retry-message[data-tone="error"] {
    color: #91483f;
    background: #fff0ed;
  }

  @media (max-width: 540px) {
    header {
      flex-direction: column;
    }
  }
`;