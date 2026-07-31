"use client";

import {
  useRouter,
} from "next/navigation";
import {
  useState,
} from "react";

type AdminAIProductionDecisionPanelProps = {
  orderRecordId: string;
};

type Decision =
  | "APPROVE"
  | "REJECT";

type DecisionResponse = {
  ok?: boolean;
  message?: string;
  decision?: Decision;
  run?: {
    id?: string;
    status?: string;
    approvedAt?: string | null;
    adminDecisionNote?: string | null;
  };
};

export default function AdminAIProductionDecisionPanel({
  orderRecordId,
}: AdminAIProductionDecisionPanelProps) {
  const router =
    useRouter();

  const [
    note,
    setNote,
  ] = useState("");

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    activeDecision,
    setActiveDecision,
  ] = useState<
    Decision | null
  >(null);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    isError,
    setIsError,
  ] = useState(false);

    const [
    hasCheckedFinalPdf,
    setHasCheckedFinalPdf,
  ] = useState(false);

  const handleDecision =
    async (
      decision: Decision,
    ) => {
      if (isSubmitting) {
        return;
      }

      const trimmedNote =
        note.trim();

             if (
        decision ===
          "APPROVE" &&
        !hasCheckedFinalPdf
      ) {
        setIsError(
          true,
        );

        setMessage(
          "최종 PDF를 확인했다는 체크를 완료한 뒤 승인해 주세요.",
        );

        return;
      }

      if (
        decision ===
          "REJECT" &&
        !trimmedNote
      ) {
        setIsError(
          true,
        );

        setMessage(
          "반려할 때는 수정이 필요한 내용을 입력해 주세요.",
        );

        return;
      }

      const confirmed =
        window.confirm(
          decision ===
            "APPROVE"
            ? [
                "이 최종 PDF를 승인할까요?",
                "",
                "승인하면 AI 제작 작업이 완료되고 고객에게 교정본 확인 단계가 열립니다.",
                "승인 전 PDF의 사진, 문장, 페이지 순서를 다시 확인해 주세요.",
              ].join(
                "\n",
              )
            : [
                "이 최종 PDF를 반려할까요?",
                "",
                "반려하면 주문 제작 단계가 보류 상태로 변경됩니다.",
                "입력한 수정 내용을 바탕으로 재작업을 진행해야 합니다.",
              ].join(
                "\n",
              ),
        );

      if (!confirmed) {
        return;
      }

      setIsSubmitting(
        true,
      );

      setActiveDecision(
        decision,
      );

      setMessage("");

      setIsError(
        false,
      );

      try {
        const response =
          await fetch(
            `/api/admin/orders/${encodeURIComponent(
              orderRecordId,
            )}/ai-production/decision`,
            {
              method:
                "POST",
              headers: {
                Accept:
                  "application/json",
                "Content-Type":
                  "application/json",
              },
              body:
                JSON.stringify({
                  decision,
                  note:
                    trimmedNote,
                }),
            },
          );

        const data =
          (await response
            .json()
            .catch(
              () => null,
            )) as
            | DecisionResponse
            | null;

        if (
          !response.ok ||
          !data?.ok
        ) {
          throw new Error(
            data?.message ||
              "최종 승인 결정을 처리하지 못했습니다.",
          );
        }

        setIsError(
          false,
        );

        setMessage(
          data.message ||
            (decision ===
            "APPROVE"
              ? "최종 PDF를 승인했습니다."
              : "최종 PDF를 반려했습니다."),
        );

        router.refresh();
      } catch (error) {
        setIsError(
          true,
        );

        setMessage(
          error instanceof
          Error
            ? error.message
            : "최종 승인 처리 중 오류가 발생했습니다.",
        );
      } finally {
        setIsSubmitting(
          false,
        );

        setActiveDecision(
          null,
        );
      }
    };

  return (
    <section className="admin-ai-decision-panel">
      <header>
        <div>
          <p>
            FINAL ADMIN
            DECISION
          </p>

          <h3>
            관리자 최종 승인
          </h3>
        </div>

        <strong>
          최종 확인 필요
        </strong>
      </header>

      <p className="admin-ai-decision-description">
        생성된 최종 PDF의 사진,
        문장, 목차, 페이지 순서를
        확인한 뒤 승인하거나 수정
        내용을 입력하여 반려합니다.
      </p>

      <label>
        <span>
          관리자 결정 메모
        </span>

        <textarea
          value={note}
          onChange={(
            event,
          ) =>
            setNote(
              event.target
                .value,
            )
          }
          maxLength={
            2000
          }
          placeholder="승인 메모는 선택사항입니다. 반려할 때는 수정이 필요한 내용을 반드시 입력해 주세요."
          disabled={
            isSubmitting
          }
        />

        <small>
          {note.length.toLocaleString()}
          /2,000자
        </small>
      </label>

           <label className="admin-ai-final-pdf-check">
        <input
          type="checkbox"
          checked={
            hasCheckedFinalPdf
          }
          onChange={(
            event,
          ) =>
            setHasCheckedFinalPdf(
              event.target
                .checked,
            )
          }
          disabled={
            isSubmitting
          }
        />

        <span>
          최종 PDF의 사진, 문장, 목차,
          페이지 순서를 확인했습니다.
        </span>
      </label>

      <div className="admin-ai-decision-actions">
        <button
          type="button"
          data-action="approve"
                    disabled={
            isSubmitting ||
            !hasCheckedFinalPdf
          }
          onClick={() =>
            handleDecision(
              "APPROVE",
            )
          }
        >
          {isSubmitting &&
          activeDecision ===
            "APPROVE"
            ? "최종 승인 처리 중..."
            : "고객 교정본으로 승인"}
        </button>

        <button
          type="button"
          data-action="reject"
          disabled={
            isSubmitting
          }
          onClick={() =>
            handleDecision(
              "REJECT",
            )
          }
        >
          {isSubmitting &&
          activeDecision ===
            "REJECT"
            ? "반려 처리 중..."
            : "수정 후 재작업"}
        </button>
      </div>

      {message ? (
        <p
          className="admin-ai-decision-message"
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
        .admin-ai-decision-panel {
          margin-top: 14px;
          padding: 17px;
          border: 1px solid #ddc9a2;
          border-radius: 16px;
          background:
            linear-gradient(
              145deg,
              #fffaf0,
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
          color: #a6752e;
          font-size: 9.6px;
          font-weight: 900;
          letter-spacing:
            0.11em;
        }

        header h3 {
          margin: 5px 0 0;
          color: #5a4028;
          font-family:
            var(
              --font-daldongne-serif
            ),
            "Noto Serif KR",
            serif;
          font-size: 17px;
        }

        header strong {
          min-height: 29px;
          padding: 0 10px;
          display: inline-flex;
          align-items:
            center;
          border-radius:
            999px;
          color: #8a621b;
          background:
            #fff0cb;
          font-size: 9.6px;
          white-space:
            nowrap;
        }

        .admin-ai-decision-description {
          margin:
            10px 0 0;
          color: #806e5e;
          font-size: 10.8px;
          line-height: 1.7;
        }

        label {
          margin-top: 13px;
          display: grid;
          gap: 6px;
        }

        label > span {
          color: #654f3d;
          font-size: 10.8px;
          font-weight: 900;
        }

        textarea {
          width: 100%;
          min-height: 105px;
          padding: 12px;
          border: 1px solid #d9cbbd;
          border-radius: 11px;
          color: #4c3a2d;
          background: #ffffff;
          font: inherit;
          font-size: 10.8px;
          line-height: 1.7;
          resize: vertical;
          outline: none;
        }

        textarea:focus {
          border-color:
            #a47852;
          box-shadow:
            0 0 0 3px
            rgba(
              164,
              120,
              82,
              0.12
            );
        }

        textarea:disabled {
          background:
            #f1ece7;
          cursor:
            not-allowed;
        }

        label small {
          color: #9b897a;
          font-size: 9.6px;
          text-align: right;
        }

               .admin-ai-final-pdf-check {
          margin-top: 13px;
          padding: 11px 12px;
          display: flex;
          align-items: flex-start;
          gap: 9px;
          border: 1px solid #e4d2aa;
          border-radius: 12px;
          background: #fff7e5;
        }

        .admin-ai-final-pdf-check input {
          width: 15px;
          height: 15px;
          margin-top: 2px;
          flex: 0 0 15px;
          accent-color: #477855;
        }

        .admin-ai-final-pdf-check span {
          color: #755b32;
          font-size: 10.8px;
          font-weight: 900;
          line-height: 1.7;
        }

        .admin-ai-decision-actions {
          margin-top: 12px;
          display: grid;
          grid-template-columns:
            repeat(
              2,
              minmax(0, 1fr)
            );
          gap: 8px;
        }

        button {
          min-height: 45px;
          padding: 0 14px;
          border: 0;
          border-radius: 11px;
          font: inherit;
          font-size: 10.8px;
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

        button[data-action="approve"] {
          color: #ffffff;
          background:
            linear-gradient(
              135deg,
              #477855,
              #63936f
            );
          box-shadow:
            0 9px 21px
            rgba(
              60,
              111,
              74,
              0.18
            );
        }

        button[data-action="reject"] {
          color: #914a41;
          border: 1px solid
            #dfb0a8;
          background:
            #fff0ed;
        }

        button:disabled {
          box-shadow: none;
          cursor:
            not-allowed;
          opacity: 0.62;
        }

        .admin-ai-decision-message {
          margin: 10px 0 0;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 10.8px;
          line-height: 1.7;
          white-space:
            pre-line;
        }

        .admin-ai-decision-message[data-tone="success"] {
          color: #386348;
          background:
            #e9f5ed;
        }

        .admin-ai-decision-message[data-tone="error"] {
          color: #91483f;
          background:
            #fff0ed;
        }

        @media (
          max-width: 540px
        ) {
          header {
            flex-direction:
              column;
          }

          .admin-ai-decision-actions {
            grid-template-columns:
              1fr;
          }
        }
      `}</style>
    </section>
  );
}