"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type WorkflowStep =
  | "START"
  | "ANALYZE"
  | "MANUSCRIPT"
  | "PDF";

type MessageTone =
  | "success"
  | "error"
  | "notice";

type AdminAIProductionAutoRunButtonProps = {
  orderRecordId: string;
  canStart?: boolean;
  canAnalyze?: boolean;
  canGenerateManuscript?: boolean;
  canGeneratePdf?: boolean;
  isRework?: boolean;
  revisionInstruction?: string | null;
  disabledReason?: string | null;
};

type WorkflowResponse = {
  ok?: boolean;
  message?: string;
  alreadyGenerated?: boolean;
  run?: {
    id?: string;
    attempt?: number;
    status?: string;
    currentStep?: string;
    requiresHumanReview?: boolean;
  };
  result?: {
    reviewRequired?: boolean;
    qualityBlocked?: boolean;
  };
};

const STEP_LABELS: Record<
  WorkflowStep,
  string
> = {
  START: "제작 회차 생성",
  ANALYZE: "자료 분석·목차 구성",
  MANUSCRIPT:
    "원고·사진·페이지·품질 검수",
  PDF: "최종 PDF 생성",
};

export default function AdminAIProductionAutoRunButton({
  orderRecordId,
  canStart = false,
  canAnalyze = false,
  canGenerateManuscript = false,
  canGeneratePdf = false,
  isRework = false,
  revisionInstruction = null,
  disabledReason = null,
}: AdminAIProductionAutoRunButtonProps) {
  const router =
    useRouter();

  const [
    isRunning,
    setIsRunning,
  ] = useState(false);

  const [
    activeStep,
    setActiveStep,
  ] = useState<
    WorkflowStep | null
  >(null);

  const [
    completedSteps,
    setCompletedSteps,
  ] = useState<
    WorkflowStep[]
  >([]);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    messageTone,
    setMessageTone,
  ] = useState<MessageTone>(
    "notice",
  );

  const workflowSteps =
    useMemo(
      () =>
        createWorkflowSteps({
          canStart,
          canAnalyze,
          canGenerateManuscript,
          canGeneratePdf,
        }),
      [
        canStart,
        canAnalyze,
        canGenerateManuscript,
        canGeneratePdf,
      ],
    );

  const disabled =
    isRunning ||
    workflowSteps.length === 0;

  const handleAutoRun =
    async () => {
      if (disabled) {
        return;
      }

      const instruction =
        revisionInstruction?.trim() ||
        "";

      const instructionPreview =
        instruction.length >
        400
          ? `${instruction.slice(
              0,
              400,
            )}…`
          : instruction;

      const confirmed =
        window.confirm(
          isRework
            ? [
                "반려 지시를 반영한 AI 전체 재작업을 시작할까요?",
                "",
                instructionPreview
                  ? `관리자 반려 지시:\n${instructionPreview}`
                  : "이전 관리자 반려 지시를 새 회차에 반영합니다.",
                "",
                "새 회차 생성부터 최종 PDF까지 순서대로 실행합니다.",
                "기존 회차와 기존 PDF는 삭제하지 않습니다.",
                "최종 관리자 승인은 자동 처리하지 않습니다.",
              ].join("\n")
            : [
                "AI 전체 자동 제작을 실행할까요?",
                "",
                "자료 분석부터 최종 PDF 생성까지 순서대로 실행합니다.",
                "원본 사진과 글은 변경하거나 삭제하지 않습니다.",
                "품질 차단 항목이 발견되면 해당 단계에서 자동으로 멈춥니다.",
                "최종 관리자 승인은 자동 처리하지 않습니다.",
              ].join("\n"),
        );

      if (!confirmed) {
        return;
      }

      setIsRunning(true);
      setActiveStep(null);
      setCompletedSteps([]);
      setMessage("");
      setMessageTone(
        "notice",
      );

      try {
        for (
          const step of
          workflowSteps
        ) {
          setActiveStep(step);

          setMessage(
            `${STEP_LABELS[step]} 작업을 진행하고 있습니다.`,
          );

          setMessageTone(
            "notice",
          );

          const result =
            await callWorkflowStep({
              orderRecordId,
              step,
            });

          const stopMessage =
            validateStepResult(
              step,
              result,
            );

          if (stopMessage) {
            setMessage(
              stopMessage,
            );

            setMessageTone(
              "notice",
            );

            setActiveStep(
              null,
            );

            router.refresh();

            return;
          }

          setCompletedSteps(
            (current) =>
              current.includes(
                step,
              )
                ? current
                : [
                    ...current,
                    step,
                  ],
          );
        }

        setActiveStep(null);

        setMessage(
          "AI 전체 자동 제작과 최종 PDF 생성을 완료했습니다. 관리자 최종 승인 단계로 이동했습니다.",
        );

        setMessageTone(
          "success",
        );

        router.refresh();
      } catch (error) {
        setActiveStep(null);

        setMessage(
          error instanceof
          Error
            ? error.message
            : "AI 전체 자동 제작 중 오류가 발생했습니다.",
        );

        setMessageTone(
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
    <section className="admin-ai-auto-run">
      <header>
        <div>
          <p>
            ONE-CLICK AI
            PRODUCTION
          </p>

          <h3>
            AI 전체 자동 제작
          </h3>
        </div>

        <strong
          data-state={
            isRunning
              ? "running"
              : "ready"
          }
        >
          {isRunning
            ? "작업 진행 중"
            : "한 번에 실행"}
        </strong>
      </header>

      <p className="admin-ai-auto-run-description">
        현재 제작 단계부터 최종 PDF
        생성까지 필요한 작업을
        순서대로 자동 실행합니다.
        품질 검수에서 차단 항목이
        발견되면 자동으로 멈춥니다.
      </p>

      <ol>
        {workflowSteps.map(
          (step) => {
            const isCompleted =
              completedSteps.includes(
                step,
              );

            const isActive =
              activeStep ===
              step;

            return (
              <li
                key={step}
                data-state={
                  isCompleted
                    ? "completed"
                    : isActive
                      ? "active"
                      : "waiting"
                }
              >
                <span>
                  {isCompleted
                    ? "✓"
                    : isActive
                      ? "…"
                      : completedSteps
                            .length +
                          1}
                </span>

                <div>
                  <strong>
                    {
                      STEP_LABELS[
                        step
                      ]
                    }
                  </strong>

                  <small>
                    {isCompleted
                      ? "완료"
                      : isActive
                        ? "진행 중"
                        : "대기"}
                  </small>
                </div>
              </li>
            );
          },
        )}
      </ol>

      <button
        type="button"
        disabled={disabled}
        onClick={
          handleAutoRun
        }
      >
        {isRunning
          ? activeStep
            ? `${STEP_LABELS[activeStep]} 진행 중...`
            : "AI 자동 제작 진행 중..."
          : isRework
            ? "반려 지시 반영 전체 재작업"
            : canStart
              ? "AI 전체 자동 제작 시작"
              : "현재 단계부터 자동 진행"}
      </button>

      {!isRunning &&
      workflowSteps.length ===
        0 &&
      disabledReason ? (
        <p
          className="admin-ai-auto-run-message"
          data-tone="notice"
        >
          {disabledReason}
        </p>
      ) : null}

      {message ? (
        <p
          className="admin-ai-auto-run-message"
          role={
            messageTone ===
            "error"
              ? "alert"
              : "status"
          }
          data-tone={
            messageTone
          }
        >
          {message}
        </p>
      ) : null}

      <style jsx>{`
        .admin-ai-auto-run {
          margin-top: 14px;
          padding: 17px;
          border: 1px solid
            #c9b2dc;
          border-radius: 16px;
          background:
            linear-gradient(
              145deg,
              #f9f4ff,
              #ffffff
            );
        }

        header {
          display: flex;
          align-items:
            flex-start;
          justify-content:
            space-between;
          gap: 14px;
        }

        header p {
          margin: 0;
          color: #785393;
          font-size: 8px;
          font-weight: 900;
          letter-spacing:
            0.11em;
        }

        header h3 {
          margin: 5px 0 0;
          color: #513b63;
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
          border-radius:
            999px;
          font-size: 8px;
          white-space:
            nowrap;
        }

        header > strong[data-state="ready"] {
          color: #684285;
          background:
            #eee1f8;
        }

        header > strong[data-state="running"] {
          color: #805d17;
          background:
            #fff0c8;
        }

        .admin-ai-auto-run-description {
          margin:
            10px 0 0;
          color: #7d6c85;
          font-size: 9px;
          line-height: 1.7;
        }

        ol {
          margin:
            14px 0 0;
          padding: 0;
          display: grid;
          gap: 7px;
          list-style: none;
        }

        li {
          min-height: 48px;
          padding: 9px 11px;
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid
            #e3d8ea;
          border-radius: 11px;
          background:
            #ffffff;
        }

        li > span {
          width: 27px;
          height: 27px;
          flex: 0 0 27px;
          display: inline-flex;
          align-items: center;
          justify-content:
            center;
          border-radius:
            999px;
          color: #8b7895;
          background:
            #f1eaf5;
          font-size: 9px;
          font-weight: 900;
        }

        li > div {
          display: grid;
          gap: 2px;
        }

        li strong {
          color: #5d4b67;
          font-size: 9px;
        }

        li small {
          color: #9a899f;
          font-size: 8px;
        }

        li[data-state="active"] {
          border-color:
            #bd99d5;
          background:
            #faf5ff;
        }

        li[data-state="active"]
          > span {
          color: #ffffff;
          background:
            #8057a0;
        }

        li[data-state="active"]
          small {
          color: #8057a0;
          font-weight: 900;
        }

        li[data-state="completed"] {
          border-color:
            #b9d5c0;
          background:
            #f3faf5;
        }

        li[data-state="completed"]
          > span {
          color: #ffffff;
          background:
            #5f8c69;
        }

        li[data-state="completed"]
          small {
          color: #4f7d59;
          font-weight: 900;
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
              #6f4b8f,
              #9168ae
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
            transform 0.16s
              ease,
            opacity 0.16s
              ease;
        }

        button:hover:not(
          :disabled
        ) {
          transform:
            translateY(-1px);
        }

        button:disabled {
          color: #9c8b83;
          background:
            #e8e0dc;
          box-shadow: none;
          cursor:
            not-allowed;
          opacity: 0.82;
        }

        .admin-ai-auto-run-message {
          margin: 10px 0 0;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 9px;
          line-height: 1.7;
          white-space:
            pre-line;
        }

        .admin-ai-auto-run-message[data-tone="success"] {
          color: #386348;
          background:
            #e9f5ed;
        }

        .admin-ai-auto-run-message[data-tone="error"] {
          color: #91483f;
          background:
            #fff0ed;
        }

        .admin-ai-auto-run-message[data-tone="notice"] {
          color: #785d31;
          background:
            #fff7df;
        }

        @media (
          max-width: 540px
        ) {
          header {
            flex-direction:
              column;
          }
        }
      `}</style>
    </section>
  );
}

function createWorkflowSteps({
  canStart,
  canAnalyze,
  canGenerateManuscript,
  canGeneratePdf,
}: {
  canStart: boolean;
  canAnalyze: boolean;
  canGenerateManuscript: boolean;
  canGeneratePdf: boolean;
}): WorkflowStep[] {
  if (canStart) {
    return [
      "START",
      "ANALYZE",
      "MANUSCRIPT",
      "PDF",
    ];
  }

  if (canAnalyze) {
    return [
      "ANALYZE",
      "MANUSCRIPT",
      "PDF",
    ];
  }

  if (
    canGenerateManuscript
  ) {
    return [
      "MANUSCRIPT",
      "PDF",
    ];
  }

  if (canGeneratePdf) {
    return ["PDF"];
  }

  return [];
}

async function callWorkflowStep({
  orderRecordId,
  step,
}: {
  orderRecordId: string;
  step: WorkflowStep;
}): Promise<WorkflowResponse> {
  const endpoint =
    getWorkflowEndpoint(
      orderRecordId,
      step,
    );

  const response =
    await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept:
          "application/json",
      },
    });

  const data =
    (await response
      .json()
      .catch(
        () => null,
      )) as
      | WorkflowResponse
      | null;

  if (
    !response.ok ||
    !data?.ok
  ) {
    throw new Error(
      data?.message ||
        `${STEP_LABELS[step]} 작업을 완료하지 못했습니다.`,
    );
  }

  return data;
}

function getWorkflowEndpoint(
  orderRecordId: string,
  step: WorkflowStep,
) {
  const encodedOrderId =
    encodeURIComponent(
      orderRecordId,
    );

  const basePath =
    `/api/admin/orders/${encodedOrderId}/ai-production`;

  if (step === "START") {
    return `${basePath}/start`;
  }

  if (
    step === "ANALYZE"
  ) {
    return `${basePath}/analyze`;
  }

  if (
    step ===
    "MANUSCRIPT"
  ) {
    return `${basePath}/manuscript`;
  }

  return `${basePath}/pdf`;
}

function validateStepResult(
  step: WorkflowStep,
  data: WorkflowResponse,
): string | null {
  const status =
    cleanText(
      data.run?.status,
    );

  const currentStep =
    cleanText(
      data.run?.currentStep,
    );

  if (step === "START") {
    if (
      status ===
      "NEEDS_INPUT"
    ) {
      return (
        data.message ||
        "AI 제작에 사용할 자료가 부족하여 자동 제작을 멈췄습니다."
      );
    }

    if (
      status &&
      (
        status !==
          "QUEUED" ||
        currentStep !==
          "MATERIAL_ANALYSIS"
      )
    ) {
      return `제작 회차가 예상하지 않은 상태로 생성되어 자동 실행을 멈췄습니다. 현재 상태: ${status} / ${currentStep}`;
    }
  }

  if (
    step === "ANALYZE"
  ) {
    if (
      status ===
      "NEEDS_INPUT"
    ) {
      return (
        data.message ||
        "자료 분석 결과 사람의 입력이 필요하여 자동 제작을 멈췄습니다."
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
      return `자료 분석 후 다음 단계로 이동하지 못해 자동 실행을 멈췄습니다. 현재 상태: ${status} / ${currentStep}`;
    }
  }

  if (
    step ===
    "MANUSCRIPT"
  ) {
    if (
      status ===
        "NEEDS_INPUT" ||
      data.result
        ?.qualityBlocked ===
        true
    ) {
      return (
        data.message ||
        "품질 검수 차단 항목이 발견되어 최종 PDF 생성을 진행하지 않았습니다."
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
      return `원고 제작 후 최종 PDF 단계로 이동하지 못해 자동 실행을 멈췄습니다. 현재 상태: ${status} / ${currentStep}`;
    }
  }

  if (step === "PDF") {
    if (
      status &&
      status !==
        "READY_FOR_APPROVAL" &&
      status !==
        "APPROVED"
    ) {
      return `최종 PDF 생성 후 관리자 승인 단계로 이동하지 못했습니다. 현재 상태: ${status} / ${currentStep}`;
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