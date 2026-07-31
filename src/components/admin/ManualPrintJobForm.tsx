"use client";

import { useRef, useState } from "react";

type InitialData = {
  status: string;
  printerName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  orderMethod: string;
  finalPdfUrl: string;
  coverPdfUrl: string;
  interiorPdfUrl: string;
  trimSize: string;
  pageCount: number | null;
  coverPaper: string;
  innerPaper: string;
  bindingType: string;
  printColor: string;
  quantity: number;
  unitCost: number | null;
  totalCost: number | null;
  expectedCompletionAt: string;
  note: string;
  orderSentAt: string | null;
  acceptedAt: string | null;
  printingStartedAt: string | null;
  completedAt: string | null;
};

type Props = {
  orderId: string;
  orderStatus: string;
  productionStage: string;
  proofApprovedAt: string | null;
  shippingReady: boolean;
  initial: InitialData;
};

const STATUS_LABELS: Record<string, string> = {
  PREPARING: "발주 준비",
  SENT: "인쇄소 전달 완료",
  ACCEPTED: "인쇄소 접수 확인",
  PRINTING: "인쇄 진행",
  COMPLETED: "인쇄 완료",
};

export default function ManualPrintJobForm({
  orderId,
  orderStatus,
  productionStage,
  proofApprovedAt,
  shippingReady,
  initial,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pendingAction, setPendingAction] =
    useState<string | null>(null);
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  const canSend =
    initial.status === "PREPARING" &&
    orderStatus === "PAID" &&
    productionStage === "PROOF_APPROVED" &&
    Boolean(proofApprovedAt);

  const canAccept =
    initial.status === "SENT" &&
    productionStage === "PRINT_ORDERED";

  const canStart =
    initial.status === "ACCEPTED" &&
    productionStage === "PRINTING";

  const canComplete =
    ["ACCEPTED", "PRINTING"].includes(initial.status) &&
    productionStage === "PRINTING" &&
    shippingReady;

  async function submit(action: string) {
    if (!formRef.current || pendingAction) {
      return;
    }

    setPendingAction(action);
    setMessage(null);

    try {
      const formData = new FormData(formRef.current);
      const payload = Object.fromEntries(formData.entries());

      const response = await fetch(
        `/api/admin/orders/${orderId}/manual-print`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...payload,
            action,
          }),
        },
      );

      const result = (await response.json()) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          result.error || "처리 중 오류가 발생했습니다.",
        );
      }

      setMessage({
        tone: "success",
        text: result.message || "처리가 완료되었습니다.",
      });

      window.setTimeout(() => {
        window.location.reload();
      }, 350);
    } catch (error) {
      setMessage({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "처리 중 오류가 발생했습니다.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <section className="manual-print-form-panel">
      <style>{styles}</style>

      <div className="manual-print-form-heading">
        <div>
          <p>PRINT SHOP HANDOFF</p>
          <h2>인쇄소 전달 정보</h2>
        </div>

        <span data-status={initial.status}>
          {STATUS_LABELS[initial.status] || initial.status}
        </span>
      </div>

      <div className="manual-print-form-timeline">
        <Timeline
          label="인쇄소 전달"
          value={formatDateTime(initial.orderSentAt)}
        />
        <Timeline
          label="접수 확인"
          value={formatDateTime(initial.acceptedAt)}
        />
        <Timeline
          label="인쇄 시작"
          value={formatDateTime(initial.printingStartedAt)}
        />
        <Timeline
          label="인쇄 완료"
          value={formatDateTime(initial.completedAt)}
        />
      </div>

      <form ref={formRef}>
        <fieldset
          disabled={initial.status === "COMPLETED"}
        >
          <div className="manual-print-form-grid">
            <Field label="인쇄소 이름" required>
              <input
                name="printerName"
                defaultValue={initial.printerName}
                placeholder="예: ○○인쇄"
              />
            </Field>

            <Field label="발주 방식" required>
              <select
                name="orderMethod"
                defaultValue={initial.orderMethod}
              >
                <option value="">선택</option>
                <option value="EMAIL">이메일</option>
                <option value="WEBSITE">인쇄소 웹사이트</option>
                <option value="PHONE">전화·메신저</option>
                <option value="VISIT">방문 전달</option>
                <option value="OTHER">기타</option>
              </select>
            </Field>

            <Field label="인쇄소 담당자">
              <input
                name="contactName"
                defaultValue={initial.contactName}
              />
            </Field>

            <Field label="담당자 연락처">
              <input
                name="contactPhone"
                defaultValue={initial.contactPhone}
              />
            </Field>

            <Field label="담당자 이메일">
              <input
                type="email"
                name="contactEmail"
                defaultValue={initial.contactEmail}
              />
            </Field>

            <Field label="예상 완성일">
              <input
                type="datetime-local"
                name="expectedCompletionAt"
                defaultValue={initial.expectedCompletionAt}
              />
            </Field>

            <Field label="최종 인쇄 PDF" required wide>
              <input
                type="url"
                name="finalPdfUrl"
                defaultValue={initial.finalPdfUrl}
                placeholder="https://..."
              />
            </Field>

            <Field label="표지 PDF" wide>
              <input
                type="url"
                name="coverPdfUrl"
                defaultValue={initial.coverPdfUrl}
                placeholder="표지와 내지가 분리된 경우 입력"
              />
            </Field>

            <Field label="내지 PDF" wide>
              <input
                type="url"
                name="interiorPdfUrl"
                defaultValue={initial.interiorPdfUrl}
                placeholder="표지와 내지가 분리된 경우 입력"
              />
            </Field>

            <Field label="책 크기">
              <input
                name="trimSize"
                defaultValue={initial.trimSize}
                placeholder="예: 148×210mm"
              />
            </Field>

            <Field label="페이지 수">
              <input
                type="number"
                min="1"
                name="pageCount"
                defaultValue={initial.pageCount ?? ""}
              />
            </Field>

            <Field label="표지 용지">
              <input
                name="coverPaper"
                defaultValue={initial.coverPaper}
                placeholder="예: 아트지 250g"
              />
            </Field>

            <Field label="내지 용지">
              <input
                name="innerPaper"
                defaultValue={initial.innerPaper}
                placeholder="예: 미색모조 100g"
              />
            </Field>

            <Field label="제본 방식">
              <input
                name="bindingType"
                defaultValue={initial.bindingType}
                placeholder="예: 무선제본"
              />
            </Field>

            <Field label="인쇄 색상">
              <input
                name="printColor"
                defaultValue={initial.printColor}
                placeholder="예: 표지 컬러 / 내지 컬러"
              />
            </Field>

            <Field label="수량" required>
              <input
                type="number"
                min="1"
                name="quantity"
                defaultValue={initial.quantity}
              />
            </Field>

            <Field label="권당 인쇄비">
              <input
                type="number"
                min="0"
                name="unitCost"
                defaultValue={initial.unitCost ?? ""}
              />
            </Field>

            <Field label="총 인쇄비">
              <input
                type="number"
                min="0"
                name="totalCost"
                defaultValue={initial.totalCost ?? ""}
              />
            </Field>

            <Field label="발주·인쇄 메모" wide>
              <textarea
                name="note"
                rows={6}
                defaultValue={initial.note}
                placeholder="인쇄소 전달 내용, 접수번호, 특이사항, 재확인할 내용을 기록하세요."
              />
            </Field>
          </div>
        </fieldset>
      </form>

      <div className="manual-print-checklist">
        <Check
          ok={orderStatus === "PAID"}
          text="결제 완료"
        />
        <Check
          ok={Boolean(proofApprovedAt)}
          text="고객 교정 승인"
        />
        <Check
          ok={Boolean(initial.finalPdfUrl)}
          text="최종 인쇄 PDF"
        />
        <Check
          ok={shippingReady}
          text="배송지 정보"
        />
      </div>

      {message ? (
        <p
          className="manual-print-form-message"
          data-tone={message.tone}
        >
          {message.text}
        </p>
      ) : null}

      <div className="manual-print-form-actions">
        <button
          type="button"
          onClick={() => submit("SAVE")}
          disabled={
            Boolean(pendingAction) ||
            initial.status === "COMPLETED"
          }
        >
          {pendingAction === "SAVE"
            ? "저장 중..."
            : "정보 저장"}
        </button>

        <button
          type="button"
          onClick={() => submit("MARK_SENT")}
          disabled={Boolean(pendingAction) || !canSend}
        >
          인쇄소 전달 등록
        </button>

        <button
          type="button"
          onClick={() => submit("MARK_ACCEPTED")}
          disabled={Boolean(pendingAction) || !canAccept}
        >
          인쇄소 접수 확인
        </button>

        <button
          type="button"
          onClick={() => submit("MARK_PRINTING")}
          disabled={Boolean(pendingAction) || !canStart}
        >
          인쇄 시작 확인
        </button>

        <button
          type="button"
          onClick={() => submit("MARK_COMPLETED")}
          disabled={Boolean(pendingAction) || !canComplete}
        >
          인쇄 완료·배송 준비
        </button>
      </div>

      <ul className="manual-print-form-help">
        <li>
          인쇄소 전달 등록은 실제 파일 전달을 마친 뒤 사용합니다.
        </li>
        <li>
          접수 확인은 인쇄소가 파일과 사양을 확인했다는 연락을
          받은 뒤 사용합니다.
        </li>
        <li>
          인쇄 완료 처리는 배송지가 모두 등록된 경우에만
          가능합니다.
        </li>
      </ul>
    </section>
  );
}

function Field({
  label,
  required = false,
  wide = false,
  children,
}: {
  label: string;
  required?: boolean;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label data-wide={wide ? "true" : "false"}>
      <span>
        {label}
        {required ? <em>*</em> : null}
      </span>
      {children}
    </label>
  );
}

function Check({
  ok,
  text,
}: {
  ok: boolean;
  text: string;
}) {
  return (
    <span data-ok={ok ? "true" : "false"}>
      {ok ? "완료" : "확인 필요"} · {text}
    </span>
  );
}

function Timeline({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "미등록";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const styles = `
  .manual-print-form-panel {
    margin-top: 16px;
    padding: 24px;
    color: #4f3931;
    border: 1px solid #eadbd4;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 18px 50px rgba(91, 57, 44, 0.07);
  }

  .manual-print-form-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 18px;
  }

  .manual-print-form-heading p {
    margin: 0;
    color: #c2644e;
    font-size: 14.4px;
    font-weight: 900;
    letter-spacing: 0.14em;
  }

  .manual-print-form-heading h2 {
    margin: 6px 0 0;
  }

  .manual-print-form-heading > span {
    padding: 7px 11px;
    color: #8a4939;
    border-radius: 999px;
    background: #ffe8e0;
    font-size: 14.4px;
    font-weight: 900;
  }

  .manual-print-form-timeline {
    margin-top: 18px;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
  }

  .manual-print-form-timeline article {
    padding: 13px;
    border: 1px solid #eee0d9;
    border-radius: 12px;
    background: #fffdfa;
  }

  .manual-print-form-timeline span {
    display: block;
    color: #917c72;
    font-size: 13.2px;
    font-weight: 800;
  }

  .manual-print-form-timeline strong {
    margin-top: 5px;
    display: block;
    font-size: 14.4px;
  }

  .manual-print-form-panel fieldset {
    margin: 20px 0 0;
    padding: 0;
    border: 0;
  }

  .manual-print-form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 13px;
  }

  .manual-print-form-grid label {
    display: grid;
    gap: 7px;
  }

  .manual-print-form-grid label[data-wide="true"] {
    grid-column: 1 / -1;
  }

  .manual-print-form-grid label > span {
    color: #746058;
    font-size: 14.4px;
    font-weight: 850;
  }

  .manual-print-form-grid em {
    margin-left: 3px;
    color: #bd5844;
    font-style: normal;
  }

  .manual-print-form-grid input,
  .manual-print-form-grid select,
  .manual-print-form-grid textarea {
    width: 100%;
    box-sizing: border-box;
    padding: 12px 13px;
    color: #4f3931;
    border: 1px solid #ddcbc2;
    border-radius: 11px;
    outline: none;
    background: #fff;
    font: inherit;
  }

  .manual-print-form-grid input:focus,
  .manual-print-form-grid select:focus,
  .manual-print-form-grid textarea:focus {
    border-color: #bd6a55;
    box-shadow: 0 0 0 3px rgba(189, 106, 85, 0.12);
  }

  .manual-print-checklist {
    margin-top: 17px;
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  .manual-print-checklist span {
    padding: 7px 10px;
    border-radius: 999px;
    font-size: 13.2px;
    font-weight: 850;
  }

  .manual-print-checklist span[data-ok="true"] {
    color: #356146;
    background: #e5f3e9;
  }

  .manual-print-checklist span[data-ok="false"] {
    color: #8b4e3f;
    background: #ffe8e1;
  }

  .manual-print-form-message {
    margin: 14px 0 0;
    padding: 12px 14px;
    border-radius: 11px;
    font-weight: 750;
  }

  .manual-print-form-message[data-tone="success"] {
    color: #376246;
    background: #e9f5ed;
  }

  .manual-print-form-message[data-tone="error"] {
    color: #91483f;
    background: #fff0ed;
  }

  .manual-print-form-actions {
    margin-top: 17px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .manual-print-form-actions button {
    padding: 11px 15px;
    color: #6f4c40;
    border: 1px solid #d9c2b7;
    border-radius: 11px;
    background: #fff;
    font-weight: 850;
    cursor: pointer;
  }

  .manual-print-form-actions button:first-child {
    color: #fff;
    border-color: #b95f49;
    background: #b95f49;
  }

  .manual-print-form-actions button:disabled {
    cursor: not-allowed;
    opacity: 0.43;
  }

  .manual-print-form-help {
    margin: 17px 0 0;
    padding-left: 19px;
    color: #806d64;
    font-size: 14.4px;
    line-height: 1.8;
  }

  @media (max-width: 760px) {
    .manual-print-form-timeline,
    .manual-print-form-grid {
      grid-template-columns: 1fr;
    }

    .manual-print-form-grid label[data-wide="true"] {
      grid-column: auto;
    }
  }
`;
