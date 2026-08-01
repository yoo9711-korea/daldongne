import {
  cancelOrRefundOrder,
  syncOrderPayment,
} from "@/app/admin/orders/actions";
import AdminOrderConfirmButton from "@/components/admin/AdminOrderConfirmButton";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "node:crypto";

type Props = {
  orderRecordId: string;
};

export default async function AdminPaymentManagementPanel({
  orderRecordId,
}: Props) {
  const order =
    await prisma.bookOrder.findUnique({
      where: {
        id: orderRecordId,
      },
      select: {
        id: true,
        orderId: true,
        totalAmount: true,
        status: true,
        paymentKey: true,
        paymentMethod: true,
        paidAt: true,
        canceledAt: true,
        tossStatus: true,
        approvedAmount: true,
        refundedAmount: true,
        balanceAmount: true,
        paymentSyncedAt: true,
        paymentEvents: {
          orderBy: {
            occurredAt: "desc",
          },
          take: 60,
          select: {
            id: true,
            eventType: true,
            status: true,
            amount: true,
            balanceAmount: true,
            transactionKey: true,
            reason: true,
            source: true,
            occurredAt: true,
          },
        },
      },
    });

  if (!order) {
    return null;
  }

  const refundedAmount =
    Math.max(
      0,
      order.refundedAmount || 0,
    );

  const refundableAmount =
    !order.paymentKey
      ? 0
      : order.balanceAmount === null
        ? Math.max(
            0,
            (order.approvedAmount ?? 0) -
              refundedAmount,
          )
        : Math.max(
            0,
            order.balanceAmount,
          );

  const terminal = [
    "CANCELED",
    "REFUNDED",
  ].includes(order.status);

  const isVirtualAccount =
    isVirtualAccountPayment(
      order.paymentMethod,
    );

  const needsRefundAccount =
    isVirtualAccount &&
    Boolean(order.paidAt);

  const actionDisabled =
    terminal ||
    (Boolean(order.paymentKey) &&
      refundableAmount <= 0);

  const actionLabel =
    !order.paymentKey
      ? "주문 취소 처리"
      : order.status ===
          "PARTIALLY_REFUNDED"
        ? "추가 환불 처리"
        : "환불 처리";

  const confirmMessage =
    !order.paymentKey
      ? "이 미결제 주문을 취소할까요?"
      : `입력한 금액을 실제 토스 결제에서 환불합니다. 최대 환불 가능 금액은 ${refundableAmount.toLocaleString()}원입니다. 계속할까요?`;

  const refundRequestKey =
    randomUUID();

  return (
    <section className="admin-payment-management">
      <style>
        {adminPaymentManagementStyles}
      </style>

      <div className="admin-payment-management-heading">
        <div>
          <p>PAYMENT · REFUND</p>
          <h2>결제·환불 관리</h2>
          <span>
            토스 결제정보와 달동네 결제
            원장을 함께 확인합니다.
          </span>
        </div>

        {order.paymentKey ? (
          <form action={syncOrderPayment}>
            <input
              type="hidden"
              name="orderRecordId"
              value={order.id}
            />
  
            <AdminOrderConfirmButton
              label="토스 결제정보 다시 조회"
              pendingLabel="결제정보 확인 중..."
              confirmMessage="토스 서버에서 실제 결제상태를 다시 조회할까요?"
              tone="neutral"
            />
          </form>
        ) : null}
      </div>

      <div className="admin-payment-summary">
        <SummaryCard
          label="주문금액"
          value={formatWon(
            order.totalAmount,
          )}
        />
        <SummaryCard
          label="승인금액"
          value={formatWon(
            order.approvedAmount || 0,
          )}
        />
        <SummaryCard
          label="누적 환불"
          value={formatWon(
            refundedAmount,
          )}
        />
        <SummaryCard
          label="환불 가능 잔액"
          value={formatWon(
            refundableAmount,
          )}
        />
        <SummaryCard
          label="토스 상태"
          value={
            order.tossStatus ||
            "미동기화"
          }
        />
        <SummaryCard
          label="마지막 동기화"
          value={formatDateTime(
            order.paymentSyncedAt,
          )}
        />
      </div>

      <div className="admin-payment-refund-box">
        <div className="admin-payment-refund-copy">
          <strong>
            {order.paymentKey
              ? "전액·부분 환불"
              : "미결제 주문 취소"}
          </strong>
          <p>
            {order.paymentKey
              ? "환불 금액을 입력하면 해당 금액만 부분 환불됩니다. 환불 가능 잔액 전부를 입력하면 전액 환불됩니다."
              : "아직 토스 결제키가 없는 주문은 금액 환불 없이 주문만 취소합니다."}
          </p>
        </div>

        <form
          action={cancelOrRefundOrder}
          className="admin-payment-refund-form"
        >
          <input
            type="hidden"
            name="orderRecordId"
            value={order.id}
          />
          <input
            type="hidden"
            name="refundRequestKey"
            value={refundRequestKey}
          />

          {order.paymentKey ? (
            <label>
              <span>환불 금액</span>
              <input
                type="number"
                name="cancelAmount"
                min={1}
                max={Math.max(
                  1,
                  refundableAmount,
                )}
                defaultValue={
                  refundableAmount > 0
                    ? refundableAmount
                    : undefined
                }
                inputMode="numeric"
                required
                disabled={
                  actionDisabled
                }
              />
              <small>
                최대 {formatWon(
                  refundableAmount,
                )}
              </small>
            </label>
          ) : null}

          <label className="admin-payment-refund-reason">
            <span>취소·환불 사유</span>
            <textarea
              name="cancelReason"
              defaultValue="관리자 요청에 의한 주문 취소"
              maxLength={200}
              required
              disabled={actionDisabled}
            />
          </label>

          {needsRefundAccount ? (
            <fieldset>
              <legend>
                가상계좌 환불계좌
              </legend>

              <label>
                <span>은행 코드</span>
                <input
                  type="text"
                  name="refundBank"
                  maxLength={10}
                  placeholder="예: 88"
                  required
                  disabled={
                    actionDisabled
                  }
                />
              </label>

              <label>
                <span>계좌번호</span>
                <input
                  type="text"
                  name="refundAccountNumber"
                  inputMode="numeric"
                  maxLength={30}
                  placeholder="숫자만 입력"
                  required
                  autoComplete="off"
                  disabled={
                    actionDisabled
                  }
                />
              </label>

              <label>
                <span>예금주명</span>
                <input
                  type="text"
                  name="refundHolderName"
                  maxLength={100}
                  required
                  autoComplete="off"
                  disabled={
                    actionDisabled
                  }
                />
              </label>

              <p>
                환불계좌 원문은 달동네
                데이터베이스에 저장하지
                않습니다. 처리 이력에는
                끝 네 자리만 남습니다.
              </p>
            </fieldset>
          ) : null}

          <AdminOrderConfirmButton
            label={actionLabel}
            pendingLabel="취소·환불 처리 중..."
            confirmMessage={
              confirmMessage
            }
            tone="danger"
            disabled={actionDisabled}
          />
        </form>

        {actionDisabled ? (
          <div className="admin-payment-disabled">
            현재 주문 상태에서는 추가
            취소·환불을 진행할 수
            없습니다.
          </div>
        ) : null}
      </div>

      <div className="admin-payment-ledger">
        <div className="admin-payment-ledger-heading">
          <div>
            <strong>결제·환불 원장</strong>
            <span>
              최근 {order.paymentEvents.length}
              건
            </span>
          </div>
          <code>{order.orderId}</code>
        </div>

        {order.paymentEvents.length > 0 ? (
          <div className="admin-payment-ledger-list">
            {order.paymentEvents.map(
              (event) => (
                <article key={event.id}>
                  <div>
                    <strong>
                      {getEventLabel(
                        event.eventType,
                      )}
                    </strong>
                    <span
                      data-source={
                        event.source
                      }
                    >
                      {getSourceLabel(
                        event.source,
                      )}
                    </span>
                  </div>

                  <dl>
                    <div>
                      <dt>상태</dt>
                      <dd>{event.status}</dd>
                    </div>
                    <div>
                      <dt>처리금액</dt>
                      <dd>
                        {formatWon(
                          event.amount,
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>남은 잔액</dt>
                      <dd>
                        {event.balanceAmount ===
                        null
                          ? "-"
                          : formatWon(
                              event.balanceAmount,
                            )}
                      </dd>
                    </div>
                    <div>
                      <dt>처리시각</dt>
                      <dd>
                        {formatDateTime(
                          event.occurredAt,
                        )}
                      </dd>
                    </div>
                  </dl>

                  {event.reason ? (
                    <p>{event.reason}</p>
                  ) : null}

                  {event.transactionKey ? (
                    <code>
                      거래키 {maskKey(
                        event.transactionKey,
                      )}
                    </code>
                  ) : null}
                </article>
              ),
            )}
          </div>
        ) : (
          <div className="admin-payment-ledger-empty">
            아직 기록된 결제 원장이
            없습니다. 토스 결제정보를
            다시 조회하면 동기화 이력이
            생성됩니다.
          </div>
        )}
      </div>
    </section>
  );
}

function SummaryCard({
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

function isVirtualAccountPayment(
  paymentMethod: string | null,
) {
  const normalized =
    (paymentMethod || "")
      .trim()
      .toUpperCase();

  return (
    normalized.includes("VIRTUAL") ||
    normalized.includes("가상")
  );
}

function formatWon(value: number) {
  return `${Math.max(
    0,
    value,
  ).toLocaleString()}원`;
}

function formatDateTime(
  value: Date | null,
) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "ko-KR",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    },
  ).format(value);
}

function maskKey(value: string) {
  if (value.length <= 10) {
    return "********";
  }

  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

function getSourceLabel(
  source: string,
) {
  const labels: Record<
    string,
    string
  > = {
    CUSTOMER: "고객",
    WEBHOOK: "웹훅",
    ADMIN: "관리자",
    SYSTEM: "시스템",
  };

  return labels[source] || source;
}

function getEventLabel(
  eventType: string,
) {
  const labels: Record<
    string,
    string
  > = {
    APPROVAL: "결제 승인",
    WAITING_DEPOSIT:
      "가상계좌 입금 대기",
    PAYMENT_SYNC:
      "결제정보 동기화",
    WEBHOOK_STATUS:
      "웹훅 상태 반영",
    PARTIAL_REFUND:
      "부분 환불",
    FULL_REFUND:
      "전액 환불",
    PAYMENT_CANCELED:
      "결제 취소",
    ORDER_CANCELED:
      "미결제 주문 취소",
  };

  return labels[eventType] ||
    eventType;
}

const adminPaymentManagementStyles = `
  .admin-payment-management {
    display: grid;
    gap: 18px;
    padding: 22px;
    border: 1px solid #eadbd4;
    border-radius: 22px;
    background: #fffdfa;
    box-shadow: 0 16px 44px rgba(99, 69, 57, 0.08);
  }

  .admin-payment-management-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
  }

  .admin-payment-management-heading p {
    margin: 0 0 5px;
    color: #9a6e61;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.12em;
  }

  .admin-payment-management-heading h2 {
    margin: 0;
    color: #4d3730;
    font-size: 20px;
    line-height: 1.25;
  }

  .admin-payment-management-heading span {
    display: block;
    margin-top: 7px;
    color: #826d65;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.65;
  }

  .admin-payment-summary {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .admin-payment-summary article {
    min-width: 0;
    padding: 13px;
    border: 1px solid #eee2dc;
    border-radius: 14px;
    background: #ffffff;
  }

  .admin-payment-summary span {
    display: block;
    color: #9a8178;
    font-size: 9px;
    font-weight: 900;
  }

  .admin-payment-summary strong {
    display: block;
    margin-top: 6px;
    color: #513b34;
    font-size: 12px;
    font-weight: 900;
    overflow-wrap: anywhere;
  }

  .admin-payment-refund-box {
    display: grid;
    gap: 14px;
    padding: 16px;
    border: 1px solid #efc8c1;
    border-radius: 16px;
    background: #fff7f5;
  }

  .admin-payment-refund-copy strong {
    color: #8f3f37;
    font-size: 13px;
  }

  .admin-payment-refund-copy p {
    margin: 6px 0 0;
    color: #84645e;
    font-size: 10px;
    font-weight: 700;
    line-height: 1.7;
  }

  .admin-payment-refund-form {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .admin-payment-refund-form label {
    display: grid;
    gap: 6px;
  }

  .admin-payment-refund-form label > span,
  .admin-payment-refund-form legend {
    color: #70524a;
    font-size: 9px;
    font-weight: 900;
  }

  .admin-payment-refund-form input,
  .admin-payment-refund-form textarea {
    width: 100%;
    border: 1px solid #d9c3bb;
    border-radius: 11px;
    background: #ffffff;
    padding: 10px 11px;
    color: #49342d;
    font: inherit;
    font-size: 11px;
    box-sizing: border-box;
  }

  .admin-payment-refund-form textarea {
    min-height: 82px;
    resize: vertical;
  }

  .admin-payment-refund-form small {
    color: #9d7d74;
    font-size: 9px;
    font-weight: 800;
  }

  .admin-payment-refund-reason,
  .admin-payment-refund-form fieldset {
    grid-column: 1 / -1;
  }

  .admin-payment-refund-form fieldset {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin: 0;
    padding: 13px;
    border: 1px dashed #d4aaa1;
    border-radius: 13px;
  }

  .admin-payment-refund-form fieldset p {
    grid-column: 1 / -1;
    margin: 0;
    color: #8b6e66;
    font-size: 9px;
    font-weight: 700;
    line-height: 1.65;
  }

  .admin-payment-disabled {
    padding: 10px 12px;
    border-radius: 11px;
    color: #865d55;
    background: #f7e6e2;
    font-size: 10px;
    font-weight: 800;
    line-height: 1.6;
  }

  .admin-payment-ledger {
    display: grid;
    gap: 12px;
  }

  .admin-payment-ledger-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .admin-payment-ledger-heading > div {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .admin-payment-ledger-heading strong {
    color: #4f3932;
    font-size: 13px;
  }

  .admin-payment-ledger-heading span,
  .admin-payment-ledger-heading code {
    color: #92776e;
    font-size: 9px;
    font-weight: 800;
  }

  .admin-payment-ledger-list {
    display: grid;
    gap: 9px;
  }

  .admin-payment-ledger-list article {
    padding: 13px;
    border: 1px solid #ece1dc;
    border-radius: 13px;
    background: #ffffff;
  }

  .admin-payment-ledger-list article > div:first-child {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .admin-payment-ledger-list article > div:first-child strong {
    color: #533d35;
    font-size: 11px;
  }

  .admin-payment-ledger-list article > div:first-child span {
    padding: 4px 7px;
    border-radius: 999px;
    color: #765d55;
    background: #f1e7e2;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-payment-ledger-list dl {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
    margin: 11px 0 0;
  }

  .admin-payment-ledger-list dl div {
    min-width: 0;
  }

  .admin-payment-ledger-list dt {
    color: #a0867e;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-payment-ledger-list dd {
    margin: 4px 0 0;
    color: #5b453d;
    font-size: 9px;
    font-weight: 800;
    overflow-wrap: anywhere;
  }

  .admin-payment-ledger-list article > p {
    margin: 10px 0 0;
    color: #826b63;
    font-size: 9px;
    font-weight: 700;
    line-height: 1.6;
  }

  .admin-payment-ledger-list article > code {
    display: block;
    margin-top: 8px;
    color: #9d837b;
    font-size: 8px;
  }

  .admin-payment-ledger-empty {
    padding: 18px;
    border: 1px dashed #d8c6bf;
    border-radius: 13px;
    color: #88746d;
    background: #faf7f5;
    font-size: 10px;
    font-weight: 700;
    line-height: 1.7;
    text-align: center;
  }

  @media (max-width: 760px) {
    .admin-payment-management-heading {
      flex-direction: column;
    }

    .admin-payment-summary {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .admin-payment-refund-form,
    .admin-payment-refund-form fieldset {
      grid-template-columns: 1fr;
    }

    .admin-payment-ledger-list dl {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 480px) {
    .admin-payment-management {
      padding: 16px;
    }

    .admin-payment-summary {
      grid-template-columns: 1fr;
    }
  }
`;

// PAYMENT_REFUND_WORKFLOW_V2
