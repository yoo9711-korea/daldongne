"use client";

import { useRef, useState } from "react";

type Issue = {
  code: string;
  severity: "BLOCKER" | "WARNING";
  message: string;
};

type Spec = {
  finalPdfUrl: string | null;
  coverPdfUrl: string | null;
  interiorPdfUrl: string | null;
  trimSize: string | null;
  trimWidthMm: number | null;
  trimHeightMm: number | null;
  bleedMm: number | null;
  pageCount: number | null;
  coverPaper: string | null;
  innerPaper: string | null;
  coverFinish: string | null;
  bindingType: string | null;
  printColor: string | null;
  quantity: number | null;
  orderMethod: string | null;
  samplePrintRequired: boolean;
  samplePrintStatus: string;
  sampleNote: string | null;
  pdfOpenedConfirmed: boolean;
  fontsEmbeddedConfirmed: boolean;
  imageQualityConfirmed: boolean;
  bleedConfirmed: boolean;
  safeAreaConfirmed: boolean;
  pageOrderConfirmed: boolean;
  colorConfirmed: boolean;
  coverSpineConfirmed: boolean;
  note: string | null;
};

type Quote = {
  id: string;
  printerName: string;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  quoteNumber: string | null;
  status: string;
  quantity: number;
  minimumQuantity: number | null;
  unitCost: number | null;
  setupCost: number;
  shippingCost: number;
  totalCost: number;
  vatIncluded: boolean;
  leadTimeBusinessDays: number | null;
  validUntil: string | null;
  note: string | null;
};

type Props = {
  orderId: string;
  canEdit: boolean;
  status: string;
  version: number;
  frozenAt: string | null;
  initial: Spec;
  issues: Issue[];
  defaultQuantity: number;
  quotes: Quote[];
};

export default function PrintPreparationPanel({
  orderId,
  canEdit,
  status,
  version,
  frozenAt,
  initial,
  issues,
  defaultQuantity,
  quotes,
}: Props) {
  const readinessForm = useRef<HTMLFormElement>(null);
  const quoteForm = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  const frozen = status === "FROZEN";
  const blockers = issues.filter((x) => x.severity === "BLOCKER");
  const warnings = issues.filter((x) => x.severity === "WARNING");

  async function post(
    url: string,
    payload: Record<string, FormDataEntryValue | string>,
    key: string,
  ) {
    if (pending) return;

    setPending(key);
    setMessage(null);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || "처리 중 오류가 발생했습니다.");
      }

      setMessage({
        tone: "success",
        text: result.message || "처리가 완료되었습니다.",
      });

      window.setTimeout(() => window.location.reload(), 350);
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error
          ? error.message
          : "처리 중 오류가 발생했습니다.",
      });
    } finally {
      setPending(null);
    }
  }

  function submitReadiness(action: "SAVE" | "FREEZE" | "UNFREEZE") {
    const payload =
      action === "UNFREEZE" || !readinessForm.current
        ? { action }
        : {
            ...Object.fromEntries(new FormData(readinessForm.current)),
            action,
          };

    return post(
      `/api/admin/orders/${orderId}/print-readiness`,
      payload,
      action,
    );
  }

  function addQuote() {
    if (!quoteForm.current) return;

    return post(
      `/api/admin/orders/${orderId}/print-quotes`,
      {
        ...Object.fromEntries(new FormData(quoteForm.current)),
        action: "ADD",
      },
      "ADD_QUOTE",
    );
  }

  function selectQuote(quoteId: string) {
    return post(
      `/api/admin/orders/${orderId}/print-quotes`,
      {
        action: "SELECT",
        quoteId,
      },
      `SELECT:${quoteId}`,
    );
  }

  return (
    <>
      <style>{styles}</style>

      <section className="pp-panel">
        <header className="pp-heading">
          <div>
            <p>SPECIFICATION & PREFLIGHT</p>
            <h2>인쇄 사양·PDF 적합성 점검</h2>
          </div>
          <strong>{status} · v{version}</strong>
        </header>

        {frozen ? (
          <div className="pp-frozen">
            사양 동결 완료 ·{" "}
            {frozenAt
              ? new Intl.DateTimeFormat("ko-KR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(frozenAt))
              : "동결일 미등록"}
            <br />
            변경하려면 동결을 해제하고 다시 점검해야 합니다.
          </div>
        ) : null}

        <form ref={readinessForm}>
          <fieldset disabled={!canEdit || frozen}>
            <div className="pp-grid">
              <Field label="최종 인쇄 PDF" wide required>
                <input name="finalPdfUrl" defaultValue={initial.finalPdfUrl || ""} />
              </Field>
              <Field label="표지 PDF" wide>
                <input name="coverPdfUrl" defaultValue={initial.coverPdfUrl || ""} />
              </Field>
              <Field label="내지 PDF" wide>
                <input name="interiorPdfUrl" defaultValue={initial.interiorPdfUrl || ""} />
              </Field>

              <Field label="완성 책 크기" required>
                <input
                  name="trimSize"
                  defaultValue={initial.trimSize || ""}
                  placeholder="예: 148×210mm"
                />
              </Field>
              <Field label="가로(mm)" required>
                <input type="number" min="1" name="trimWidthMm" defaultValue={initial.trimWidthMm ?? ""} />
              </Field>
              <Field label="세로(mm)" required>
                <input type="number" min="1" name="trimHeightMm" defaultValue={initial.trimHeightMm ?? ""} />
              </Field>
              <Field label="재단 여백(mm)" required>
                <input type="number" min="0" name="bleedMm" defaultValue={initial.bleedMm ?? 3} />
              </Field>
              <Field label="페이지 수" required>
                <input type="number" min="1" name="pageCount" defaultValue={initial.pageCount ?? ""} />
              </Field>
              <Field label="인쇄 수량" required>
                <input type="number" min="1" name="quantity" defaultValue={initial.quantity ?? 1} />
              </Field>

              <Field label="표지 용지" required>
                <input name="coverPaper" defaultValue={initial.coverPaper || ""} />
              </Field>
              <Field label="내지 용지" required>
                <input name="innerPaper" defaultValue={initial.innerPaper || ""} />
              </Field>
              <Field label="표지 후가공">
                <input name="coverFinish" defaultValue={initial.coverFinish || ""} />
              </Field>
              <Field label="제본 방식" required>
                <input name="bindingType" defaultValue={initial.bindingType || ""} />
              </Field>
              <Field label="인쇄 색상" required>
                <input name="printColor" defaultValue={initial.printColor || ""} />
              </Field>
              <Field label="예정 발주 방식">
                <select name="orderMethod" defaultValue={initial.orderMethod || ""}>
                  <option value="">미정</option>
                  <option value="EMAIL">이메일</option>
                  <option value="WEBSITE">인쇄소 웹사이트</option>
                  <option value="PHONE">전화·메신저</option>
                  <option value="VISIT">방문 전달</option>
                  <option value="OTHER">기타</option>
                </select>
              </Field>

              <Field label="샘플 인쇄" wide>
                <div className="pp-inline">
                  <label className="pp-check">
                    <input
                      type="checkbox"
                      name="samplePrintRequired"
                      defaultChecked={initial.samplePrintRequired}
                    />
                    <span>샘플 승인 후 본 인쇄</span>
                  </label>

                  <select
                    name="samplePrintStatus"
                    defaultValue={initial.samplePrintStatus}
                  >
                    <option value="NOT_REQUIRED">샘플 불필요</option>
                    <option value="PLANNED">샘플 예정</option>
                    <option value="ORDERED">샘플 발주</option>
                    <option value="RECEIVED">샘플 수령</option>
                    <option value="APPROVED">샘플 승인</option>
                    <option value="REJECTED">샘플 반려</option>
                  </select>
                </div>
              </Field>

              <Field label="샘플 메모" wide>
                <textarea name="sampleNote" rows={3} defaultValue={initial.sampleNote || ""} />
              </Field>
              <Field label="관리자 메모" wide>
                <textarea name="note" rows={4} defaultValue={initial.note || ""} />
              </Field>
            </div>

            <div className="pp-confirm">
              <h3>PDF 수동 확인표</h3>
              <p>실제 PDF를 열어 확인한 뒤 체크하세요.</p>
              <div>
                <Confirm name="pdfOpenedConfirmed" label="최종 PDF가 정상적으로 열린다" checked={initial.pdfOpenedConfirmed} />
                <Confirm name="fontsEmbeddedConfirmed" label="글꼴 포함·윤곽선 처리 확인" checked={initial.fontsEmbeddedConfirmed} />
                <Confirm name="imageQualityConfirmed" label="사진·이미지 인쇄 화질 확인" checked={initial.imageQualityConfirmed} />
                <Confirm name="bleedConfirmed" label="재단 여백·배경 확장 확인" checked={initial.bleedConfirmed} />
                <Confirm name="safeAreaConfirmed" label="글자·사진 안전영역 확인" checked={initial.safeAreaConfirmed} />
                <Confirm name="pageOrderConfirmed" label="페이지 순서·빈 페이지 확인" checked={initial.pageOrderConfirmed} />
                <Confirm name="colorConfirmed" label="표지·내지 색상 방식 확인" checked={initial.colorConfirmed} />
                <Confirm name="coverSpineConfirmed" label="표지 앞·뒤·책등 구조 확인" checked={initial.coverSpineConfirmed} />
              </div>
            </div>
          </fieldset>
        </form>

        <div className="pp-results">
          <IssueBox title={`차단 ${blockers.length}건`} issues={blockers} kind="blocker" />
          <IssueBox title={`주의 ${warnings.length}건`} issues={warnings} kind="warning" />
        </div>

        <div className="pp-buttons">
          {!frozen ? (
            <>
              <button
                type="button"
                onClick={() => submitReadiness("SAVE")}
                disabled={!canEdit || Boolean(pending)}
              >
                {pending === "SAVE" ? "저장 중..." : "점검 내용 저장"}
              </button>
              <button
                type="button"
                onClick={() => submitReadiness("FREEZE")}
                disabled={!canEdit || Boolean(pending)}
              >
                {pending === "FREEZE" ? "동결 중..." : "점검 완료·사양 동결"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => submitReadiness("UNFREEZE")}
              disabled={!canEdit || Boolean(pending)}
            >
              {pending === "UNFREEZE" ? "해제 중..." : "사양 동결 해제"}
            </button>
          )}
        </div>
      </section>

      <section className="pp-panel">
        <header className="pp-heading">
          <div>
            <p>PRINT QUOTE COMPARISON</p>
            <h2>인쇄소 견적 비교</h2>
          </div>
          <strong>{quotes.length}건</strong>
        </header>

        <div className="pp-info">
          전화·이메일·인쇄소 웹사이트에서 받은 견적을 기록하는
          기능이며, 인쇄소 API 연결이나 자동 발주가 아닙니다.
        </div>

        {quotes.length > 0 ? (
          <div className="pp-quotes">
            {quotes.map((quote) => (
              <article
                key={quote.id}
                data-selected={quote.status === "SELECTED" ? "true" : "false"}
              >
                <header>
                  <div>
                    <span>{quote.status === "SELECTED" ? "선택 견적" : "비교 견적"}</span>
                    <h3>{quote.printerName}</h3>
                  </div>
                  <strong>{quote.totalCost.toLocaleString()}원</strong>
                </header>

                <p>
                  수량 {quote.quantity}권 · 권당{" "}
                  {quote.unitCost != null ? `${quote.unitCost.toLocaleString()}원` : "미등록"}
                  {" · "}
                  제작 {quote.leadTimeBusinessDays ? `${quote.leadTimeBusinessDays}영업일` : "기간 미등록"}
                </p>
                <small>
                  담당자 {quote.contactName || "미등록"} ·{" "}
                  {quote.contactPhone || quote.contactEmail || "연락처 미등록"} ·{" "}
                  {quote.vatIncluded ? "부가세 포함" : "부가세 확인 필요"}
                </small>

                {quote.note ? <small>{quote.note}</small> : null}

                {quote.status === "SELECTED" ? (
                  <em>수동 인쇄센터에 반영됨</em>
                ) : (
                  <button
                    type="button"
                    onClick={() => selectQuote(quote.id)}
                    disabled={!canEdit || Boolean(pending)}
                  >
                    {pending === `SELECT:${quote.id}` ? "선택 중..." : "이 견적 선택"}
                  </button>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="pp-empty">등록된 인쇄 견적이 없습니다.</div>
        )}

        <form ref={quoteForm} className="pp-quote-form">
          <fieldset disabled={!canEdit}>
            <h3>새 견적 등록</h3>
            <div className="pp-grid">
              <Field label="인쇄소 이름" required>
                <input name="printerName" />
              </Field>
              <Field label="견적 번호">
                <input name="quoteNumber" />
              </Field>
              <Field label="담당자">
                <input name="contactName" />
              </Field>
              <Field label="연락처">
                <input name="contactPhone" />
              </Field>
              <Field label="이메일">
                <input type="email" name="contactEmail" />
              </Field>
              <Field label="견적 수량" required>
                <input type="number" min="1" name="quantity" defaultValue={defaultQuantity} />
              </Field>
              <Field label="최소 수량">
                <input type="number" min="1" name="minimumQuantity" />
              </Field>
              <Field label="권당 인쇄비">
                <input type="number" min="0" name="unitCost" />
              </Field>
              <Field label="초기·후가공 비용">
                <input type="number" min="0" name="setupCost" defaultValue="0" />
              </Field>
              <Field label="배송비">
                <input type="number" min="0" name="shippingCost" defaultValue="0" />
              </Field>
              <Field label="총 견적 금액" required>
                <input type="number" min="0" name="totalCost" />
              </Field>
              <Field label="제작 영업일">
                <input type="number" min="1" name="leadTimeBusinessDays" />
              </Field>
              <Field label="견적 유효일">
                <input type="date" name="validUntil" />
              </Field>
              <Field label="부가세 포함" wide>
                <label className="pp-check">
                  <input type="checkbox" name="vatIncluded" />
                  <span>총 견적 금액에 부가세 포함</span>
                </label>
              </Field>
              <Field label="견적 메모" wide>
                <textarea name="note" rows={3} />
              </Field>
            </div>
          </fieldset>
        </form>

        <div className="pp-buttons">
          <button
            type="button"
            onClick={addQuote}
            disabled={!canEdit || Boolean(pending)}
          >
            {pending === "ADD_QUOTE" ? "등록 중..." : "견적 등록"}
          </button>
        </div>
      </section>

      {message ? (
        <p className="pp-message" data-tone={message.tone}>
          {message.text}
        </p>
      ) : null}
    </>
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

function Confirm({
  name,
  label,
  checked,
}: {
  name: string;
  label: string;
  checked: boolean;
}) {
  return (
    <label className="pp-check">
      <input type="checkbox" name={name} defaultChecked={checked} />
      <span>{label}</span>
    </label>
  );
}

function IssueBox({
  title,
  issues,
  kind,
}: {
  title: string;
  issues: Issue[];
  kind: "blocker" | "warning";
}) {
  return (
    <div data-kind={kind}>
      <strong>{title}</strong>
      {issues.length > 0 ? (
        <ul>
          {issues.map((issue) => (
            <li key={issue.code}>{issue.message}</li>
          ))}
        </ul>
      ) : (
        <p>해당 항목이 없습니다.</p>
      )}
    </div>
  );
}

const styles = `
  .pp-panel{margin-top:15px;padding:23px;border:1px solid #eadbd4;border-radius:20px;background:#fff;color:#4f3931}
  .pp-heading{display:flex;justify-content:space-between;align-items:flex-end;gap:15px}.pp-heading p{margin:0;color:#c2644e;font-size:14.4px;font-weight:900;letter-spacing:.14em}.pp-heading h2{margin:6px 0 0}.pp-heading>strong{color:#806d64}
  .pp-frozen,.pp-info{margin-top:13px;padding:14px 16px;border-radius:12px;line-height:1.65}.pp-frozen{background:#eaf6ee;border:1px solid #bad7c4;color:#355f46}.pp-info{background:#fff8e5;border:1px solid #ead6a8;color:#745c38}
  .pp-panel fieldset{margin:18px 0 0;padding:0;border:0}.pp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.pp-grid>label{display:grid;gap:6px}.pp-grid>label[data-wide="true"]{grid-column:1/-1}.pp-grid>label>span{font-size:14.4px;font-weight:800;color:#746058}.pp-grid em{margin-left:3px;color:#b85743;font-style:normal}
  .pp-grid input,.pp-grid select,.pp-grid textarea{width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid #ddcbc2;border-radius:10px;background:#fff;color:#4f3931;font:inherit}.pp-inline{display:grid;grid-template-columns:1fr 190px;gap:8px}
  .pp-check{padding:10px 12px;display:flex;align-items:flex-start;gap:8px;border:1px solid #ddcbc2;border-radius:10px;background:#fff}.pp-check input{width:auto}
  .pp-confirm{margin-top:17px;padding:18px;border:1px solid #eadbd4;border-radius:14px;background:#fffdfa}.pp-confirm h3{margin:0}.pp-confirm>p{margin:5px 0 12px;color:#806d64;font-size:12px}.pp-confirm>div{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
  .pp-results{margin-top:15px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.pp-results>div{padding:15px;border-radius:13px}.pp-results [data-kind="blocker"]{background:#fff0ec;border:1px solid #e9c0b7;color:#8e493b}.pp-results [data-kind="warning"]{background:#fff8df;border:1px solid #ead5a3;color:#806027}.pp-results ul,.pp-results p{margin:7px 0 0;font-size:14.4px;line-height:1.7}.pp-results ul{padding-left:17px}
  .pp-buttons{margin-top:14px;display:flex;gap:8px;flex-wrap:wrap}.pp-buttons button,.pp-quotes button{padding:10px 14px;border:1px solid #d8c2b7;border-radius:10px;background:#fff;color:#704e41;font-weight:800;cursor:pointer}.pp-buttons button:last-child,.pp-quotes button{background:#b95f49;border-color:#b95f49;color:#fff}.pp-buttons button:disabled,.pp-quotes button:disabled{opacity:.42;cursor:not-allowed}
  .pp-quotes{margin-top:14px;display:grid;gap:9px}.pp-quotes article{padding:15px;border:1px solid #e8dad3;border-radius:13px;background:#fffdfa}.pp-quotes article[data-selected="true"]{background:#f1f9f3;border-color:#a9cfb6}.pp-quotes header{display:flex;justify-content:space-between;gap:15px}.pp-quotes header span{font-size:13.2px;color:#b45a45;font-weight:900}.pp-quotes h3{margin:4px 0}.pp-quotes p,.pp-quotes small{display:block;margin:8px 0 0;color:#806d64;line-height:1.6;font-size:12px}.pp-quotes em{display:block;margin-top:10px;color:#3f684e;font-style:normal;font-weight:800}
  .pp-empty{margin-top:14px;padding:28px;text-align:center;border:1px dashed #dbc8be;border-radius:13px;color:#8d7a71}.pp-quote-form{margin-top:18px;padding-top:18px;border-top:1px solid #eadbd4}.pp-quote-form h3{margin:0 0 12px}
  .pp-message{margin:14px 0 0;padding:12px 14px;border-radius:11px;font-weight:800}.pp-message[data-tone="success"]{background:#e9f5ed;color:#376246}.pp-message[data-tone="error"]{background:#fff0ed;color:#91483f}
  @media(max-width:700px){.pp-heading{align-items:stretch;flex-direction:column}.pp-grid,.pp-confirm>div,.pp-results,.pp-inline{grid-template-columns:1fr}.pp-grid>label[data-wide="true"]{grid-column:auto}}
`;
