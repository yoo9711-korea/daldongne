"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ProductionStep =
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
  staleMinutes?: number;
  recoveryType?: string;
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

type AdminAIProductionStalledRecoveryButtonProps = {
  orderRecordId: string;
  stalledStep: string;
  stalledMinutes: number;
};

const STEP_LABELS: Record<
  ProductionStep,
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

export default function AdminAIProductionStalledRecoveryButton({
  orderRecordId,
  stalledStep,
  stalledMinutes,
}: AdminAIProductionStalledRecoveryButtonProps) {
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

  const productionStep =
    normalizeProductionStep(
      stalledStep,
    );

  if (!productionStep) {
    return null;
  }

  const safeStalledMinutes =
    Number.isFinite(
      stalledMinutes,
    )
      ? Math.max(
          30,
          Math.floor(
            stalledMinutes,
          ),
        )
      : 30;

  const handleRecovery =
    async () => {
      if (isRunning) {
        return;
      }

      const confirmed =
        window.confirm(
          [
            `${STEP_LABELS[productionStep]} 작업이 ${safeStalledMinutes}분 동안 멈춰 있습니다.`,
            "",
            "실행 잠금을 해제하고 현재 회차에서 자동 제작을 다시 진행할까요?",
            "",
            "새 제작 회차는 만들지 않습니다.",
            "이미 완료된 이전 단계의 결과는 유지합니다.",
            "복구된 단계부터 최종 PDF 생성까지 자동 진행합니다.",
            "관리자 최종 승인은 자동 처리하지 않습니다.",
          ].join("\n"),
        );

      if (!confirmed) {
        return;
      }

      setIsRunning(true);
      setProgressMessage(
        "멈춘 작업의 실행 잠금을 확인하고 있습니다.",
      );
      setResultMessage("");
      setResultTone(
        "notice",
      );

      try {
        const recoveryResult =
          await callJsonApi(
            `/api/admin/orders/${encodeURIComponent(
              orderRecordId,
            )}/ai-production/recover-stalled`,
          );

        const recoveredStep =
          normalizeProductionStep(
            recoveryResult.run
              ?.currentStep ||
              productionStep,
          );

        if (!recoveredStep) {
          throw new Error(
            "복구된 AI 제작 단계를 확인할 수 없습니다.",
          );
        }

        const resumeSteps =
          getResumeSteps(
            recoveredStep,
          );

        for (
          const apiStep of
          resumeSteps
        ) {
          setProgressMessage(
            `${API_STEP_LABELS[apiStep]} 작업을 진행하고 있습니다.`,
          );

          const result =
            await callJsonApi(
              getApiEndpoint(
                orderRecordId,
                apiStep,
              ),
            );

          const stopMessage =
            validateResumeResult(
              apiStep,
              result,
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
          "멈춘 작업을 복구하고 최종 PDF 생성을 완료했습니다. 관리자 최종 승인 단계로 이동했습니다.",
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
          error instanceof Error
            ? error.message
            : "멈춘 AI 제작 작업을 복구하지 못했습니다.",
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
    <section className="admin-ai-stalled-recovery">
      <header>
        <div>
          <p>
            STALLED WORK RECOVERY
          </p>

          <h3>
            멈춘 AI 작업 복구
          </h3>
        </div>

        <strong>
          {safeStalledMinutes}분
          이상 멈춤
        </strong>
      </header>

      <div className="admin-ai-stalled-recovery-step">
        <span>
          멈춘 단계
        </span>

        <strong>
          {
            STEP_LABELS[
              productionStep
            ]
          }
        </strong>
      </div>

      <p className="admin-ai-stalled-recovery-description">
        브라우저 종료, 네트워크 오류,
        서버 실행 시간 초과 등으로 남은
        실행 잠금만 해제합니다. 현재
        회차와 이미 생성된 결과는 그대로
        유지됩니다.
      </p>

      <button
        type="button"
        disabled={
          isRunning
        }
        onClick={
          handleRecovery
        }
      >
        {isRunning
          ? progressMessage ||
            "멈춘 작업 복구 중..."
          : "멈춘 작업 복구 후 자동 재개"}
      </button>

      {progressMessage ? (
        <p
          className="admin-ai-stalled-recovery-message"
          data-tone="notice"
          role="status"
        >
          {progressMessage}
        </p>
      ) : null}

      {resultMessage ? (
        <p
          className="admin-ai-stalled-recovery-message"
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

      <style jsx>{styles}</style>
    </section>
  );
}

function normalizeProductionStep(
  value: unknown,
): ProductionStep | null {
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
  step: ProductionStep,
): ResumeApiStep[] {
  if (
    step ===
    "MATERIAL_ANALYSIS"
  ) {
    return [
      "analyze",
      "manuscript",
      "pdf",
    ];
  }

  if (
    step ===
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
      return `PDF 생성 후 관리자 승인 단계로 이동하지 못했습니다. 현재 상태: ${status} / ${currentStep}`;
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

const styles = `
  .admin-ai-stalled-recovery {
    margin-top: 14px;
    padding: 17px;
    border: 1px solid #dfbd78;
    border-radius: 16px;
    background:
      linear-gradient(
        145deg,
        #fff9ea,
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
    color: #99702e;
    font-size: 9.6px;
    font-weight: 900;
    letter-spacing: 0.11em;
  }

  header h3 {
    margin: 5px 0 0;
    color: #72562c;
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
    color: #8a611e;
    background: #ffedbd;
    font-size: 9.6px;
    white-space: nowrap;
  }

  .admin-ai-stalled-recovery-step {
    margin-top: 13px;
    padding: 11px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border: 1px solid #eddbb5;
    border-radius: 11px;
    background: #ffffff;
  }

  .admin-ai-stalled-recovery-step span {
    color: #9b8565;
    font-size: 9.6px;
  }

  .admin-ai-stalled-recovery-step strong {
    color: #795a2b;
    font-size: 10.8px;
    text-align: right;
  }

  .admin-ai-stalled-recovery-description {
    margin: 11px 0 0;
    color: #827560;
    font-size: 10.8px;
    line-height: 1.7;
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
        #9b762f,
        #c49a4e
      );
    box-shadow:
      0 10px 24px
      rgba(
        132,
        94,
        26,
        0.18
      );
    font: inherit;
    font-size: 12px;
    font-weight: 900;
    cursor: pointer;
  }

  button:disabled {
    color: #a19989;
    background: #e7e1d5;
    box-shadow: none;
    cursor: not-allowed;
  }

  .admin-ai-stalled-recovery-message {
    margin: 10px 0 0;
    padding: 10px 12px;
    border-radius: 10px;
    font-size: 10.8px;
    line-height: 1.7;
    white-space: pre-line;
  }

  .admin-ai-stalled-recovery-message[data-tone="success"] {
    color: #386348;
    background: #e9f5ed;
  }

  .admin-ai-stalled-recovery-message[data-tone="notice"] {
    color: #785d31;
    background: #fff4d5;
  }

  .admin-ai-stalled-recovery-message[data-tone="error"] {
    color: #91483f;
    background: #fff0ed;
  }

  @media (max-width: 540px) {
    header {
      flex-direction: column;
    }

    .admin-ai-stalled-recovery-step {
      align-items: flex-start;
      flex-direction: column;
    }

    .admin-ai-stalled-recovery-step strong {
      text-align: left;
    }
  }
`;