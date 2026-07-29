import AdminOrderEmailRetryButton from "@/components/admin/AdminOrderEmailRetryButton";
import { prisma } from "@/lib/prisma";

const EMAIL_AUDIT_ACTIONS = [
  "CUSTOMER_SHIPPING_EMAIL_SENT",
  "CUSTOMER_SHIPPING_EMAIL_SKIPPED",
  "CUSTOMER_SHIPPING_EMAIL_FAILED",
  "CUSTOMER_COMPLETION_EMAIL_SENT",
  "CUSTOMER_COMPLETION_EMAIL_SKIPPED",
  "CUSTOMER_COMPLETION_EMAIL_FAILED",
];

export default async function AdminOrderEmailAuditSummary({
  orderRecordId,
}: {
  orderRecordId: string;
}) {
  const [totalCount, logs] =
    await Promise.all([
      prisma.bookOrderAuditLog.count({
        where: {
          orderId: orderRecordId,

          action: {
            in: EMAIL_AUDIT_ACTIONS,
          },
        },
      }),

      prisma.bookOrderAuditLog.findMany({
        where: {
          orderId: orderRecordId,

          action: {
            in: EMAIL_AUDIT_ACTIONS,
          },
        },

        orderBy: {
          createdAt: "desc",
        },

        take: 10,

        select: {
          id: true,
          action: true,
          summary: true,
          afterData: true,
          createdAt: true,
        },
      }),
    ]);

  return (
    <section className="admin-order-email-audit">
      <style>
        {emailAuditStyles}
      </style>

      <div className="admin-order-email-audit-heading">
        <div>
          <p>
            CUSTOMER NOTIFICATION
          </p>

          <h2>
            고객 알림 발송 기록
          </h2>

          <span>
            배송 시작과 제작 완료 안내
            이메일의 처리 결과를 확인합니다.
          </span>
        </div>

        <strong>
          총 {totalCount.toLocaleString()}건
        </strong>
      </div>

      {logs.length > 0 ? (
        <div className="admin-order-email-audit-list">
          {logs.map((log) => {
            const status =
              getEmailStatus(
                log.action,
              );

            const recipientEmail =
              readAuditString(
                log.afterData,
                "recipientEmail",
              );

            const reason =
              readAuditString(
                log.afterData,
                "reason",
              );

            const providerMessageId =
              readAuditString(
                log.afterData,
                "providerMessageId",
              );

            const defaultRecipientEmail =
              readAuditString(
                log.afterData,
                "defaultRecipientEmail",
              );

            const requestedRecipientEmail =
              readAuditString(
                log.afterData,
                "requestedRecipientEmail",
              );

            const emailOverridden =
              readAuditBoolean(
                log.afterData,
                "emailOverridden",
              );

            const recipientOverrideReason =
              readAuditString(
                log.afterData,
                "recipientOverrideReason",
              );

            return (
              <article
                key={log.id}
                data-status={status}
              >
                <div className="admin-order-email-audit-top">
                  <div>
                    <span
                      className="admin-order-email-audit-type"
                    >
                      {getEmailTypeLabel(
                        log.action,
                      )}
                    </span>

                    <span
                      className="admin-order-email-audit-status"
                      data-status={status}
                    >
                      {getEmailStatusLabel(
                        status,
                      )}
                    </span>

                    {emailOverridden ? (
                      <span
                        className="admin-order-email-audit-override"
                      >
                        기본 이메일과 다른 주소
                      </span>
                    ) : null}
                  </div>

                  <time>
                    {formatDateTime(
                      log.createdAt,
                    )}
                  </time>
                </div>

                <h3>
                  {log.summary}
                </h3>

                <dl>
                  <div>
                    <dt>
                      수신 이메일
                    </dt>

                    <dd>
                      {recipientEmail ||
                        "수신 이메일 없음"}
                    </dd>
                  </div>

                  {reason ? (
                    <div>
                      <dt>
                        처리 사유
                      </dt>

                      <dd>
                        {getReasonLabel(
                          reason,
                        )}
                      </dd>
                    </div>
                  ) : null}

                  {providerMessageId ? (
                    <div>
                      <dt>
                        발송 메시지 ID
                      </dt>

                      <dd>
                        {providerMessageId}
                      </dd>
                    </div>
                  ) : null}

                  {emailOverridden ? (
                    <>
                      <div>
                        <dt>
                          기본 이메일
                        </dt>

                        <dd>
                          {defaultRecipientEmail ||
                            "기본 이메일 없음"}
                        </dd>
                      </div>

                      <div>
                        <dt>
                          변경 발송 이메일
                        </dt>

                        <dd>
                          {requestedRecipientEmail ||
                            recipientEmail ||
                            "발송 이메일 확인 필요"}
                        </dd>
                      </div>

                      <div>
                        <dt>
                          이메일 변경 사유
                        </dt>

                        <dd
                          style={{
                            whiteSpace:
                              "pre-wrap",
                            overflowWrap:
                              "anywhere",
                            lineHeight: 1.7,
                          }}
                        >
                          {recipientOverrideReason ||
                            "변경 사유 기록 없음"}
                        </dd>
                      </div>
                    </>
                  ) : null}
                </dl>

                {status !== "SENT" ? (
                  <AdminOrderEmailRetryButton
                    orderRecordId={
                      orderRecordId
                    }
                    recipientEmail={
                      recipientEmail
                    }
                    defaultRecipientEmail={
                      defaultRecipientEmail
                    }
                    notificationType={
                      log.action.includes(
                        "SHIPPING",
                      )
                        ? "SHIPPING"
                        : "COMPLETION"
                    }
                  />
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="admin-order-email-audit-empty">
          아직 기록된 고객 알림 발송
          내역이 없습니다.
        </div>
      )}
    </section>
  );
}

function getEmailTypeLabel(
  action: string,
) {
  if (
    action.includes(
      "SHIPPING",
    )
  ) {
    return "배송 시작 안내";
  }

  if (
    action.includes(
      "COMPLETION",
    )
  ) {
    return "제작 완료 안내";
  }

  return "고객 안내";
}

function getEmailStatus(
  action: string,
) {
  if (
    action.endsWith(
      "_SENT",
    )
  ) {
    return "SENT";
  }

  if (
    action.endsWith(
      "_SKIPPED",
    )
  ) {
    return "SKIPPED";
  }

  return "FAILED";
}

function getEmailStatusLabel(
  status: string,
) {
  const labels:
    Record<string, string> = {
      SENT: "발송 성공",
      SKIPPED: "발송 건너뜀",
      FAILED: "발송 실패",
    };

  return (
    labels[status] ||
    "결과 확인 필요"
  );
}

function getReasonLabel(
  reason: string,
) {
  const labels:
    Record<string, string> = {
      CUSTOMER_EMAIL_MISSING:
        "고객 이메일이 등록되지 않았습니다.",

      RESEND_API_KEY_MISSING:
        "이메일 발송 환경변수가 없습니다.",

      STAGE_EMAIL_TEMPLATE_MISSING:
        "해당 단계의 이메일 양식이 없습니다.",

      RESEND_SEND_ERROR:
        "이메일 서비스가 발송 오류를 반환했습니다.",

      UNKNOWN_EMAIL_SEND_ERROR:
        "이메일 발송 중 알 수 없는 오류가 발생했습니다.",

      UNKNOWN_EMAIL_PROCESSING_ERROR:
        "이메일 처리 중 알 수 없는 오류가 발생했습니다.",
    };

  return (
    labels[reason] ||
    reason
  );
}

function readAuditString(
  value: unknown,
  key: string,
) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  const result =
    (value as Record<
      string,
      unknown
    >)[key];

  return typeof result === "string" &&
    result.trim()
    ? result
    : null;
}

function readAuditBoolean(
  value: unknown,
  key: string,
) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const result =
    (value as Record<
      string,
      unknown
    >)[key];

  return result === true;
}

function formatDateTime(
  value: Date,
) {
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

const emailAuditStyles = `
  .admin-order-email-audit,
  .admin-order-email-audit * {
    box-sizing: border-box;
  }

  .admin-order-email-audit {
    margin-top: 14px;
    padding: 21px;
    border: 1px solid rgba(128, 83, 61, 0.12);
    border-radius: 21px;
    background: #ffffff;
    box-shadow:
      0 12px 29px
      rgba(91, 58, 43, 0.045);
  }

  .admin-order-email-audit-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
  }

  .admin-order-email-audit-heading p {
    margin: 0;
    color: #df6550;
    font-size: 8px;
    font-weight: 900;
    letter-spacing: 0.09em;
  }

  .admin-order-email-audit-heading h2 {
    margin: 5px 0 0;
    font-size: 21px;
  }

  .admin-order-email-audit-heading span {
    display: block;
    margin-top: 6px;
    color: #927a70;
    font-size: 8px;
    line-height: 1.7;
  }

  .admin-order-email-audit-heading > strong {
    flex: 0 0 auto;
    padding: 8px 11px;
    border-radius: 999px;
    color: #655047;
    background: #fff4ec;
    font-size: 8px;
  }

  .admin-order-email-audit-list {
    margin-top: 15px;
    display: grid;
    gap: 9px;
  }

  .admin-order-email-audit-list article {
    padding: 15px;
    border: 1px solid #eaded8;
    border-left: 5px solid #8dbe98;
    border-radius: 14px;
    background: #fffcfa;
  }

  .admin-order-email-audit-list article[data-status="SKIPPED"] {
    border-left-color: #d2a84c;
  }

  .admin-order-email-audit-list article[data-status="FAILED"] {
    border-left-color: #d36c61;
  }

  .admin-order-email-audit-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .admin-order-email-audit-top > div {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .admin-order-email-audit-type,
  .admin-order-email-audit-status {
    min-height: 25px;
    padding: 0 9px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    font-size: 7px;
    font-weight: 900;
  }

  .admin-order-email-audit-type {
    color: #5d4b43;
    background: #f3e9e3;
  }

  .admin-order-email-audit-status {
    color: #316b43;
    background: #e5f4e8;
  }

  .admin-order-email-audit-status[data-status="SKIPPED"] {
    color: #805c19;
    background: #fff2c9;
  }

  .admin-order-email-audit-status[data-status="FAILED"] {
    color: #984b42;
    background: #ffe8e4;
  }

  .admin-order-email-audit-override {
    min-height: 25px;
    padding: 0 9px;
    display: inline-flex;
    align-items: center;
    border: 1px solid #d8b77a;
    border-radius: 999px;
    color: #76551d;
    background: #fff7df;
    font-size: 7px;
    font-weight: 900;
  }

  .admin-order-email-audit-top time {
    flex: 0 0 auto;
    color: #957d72;
    font-size: 7px;
  }

  .admin-order-email-audit-list h3 {
    margin: 11px 0 0;
    font-size: 10px;
    line-height: 1.65;
  }

  .admin-order-email-audit-list dl {
    margin: 11px 0 0;
    display: grid;
    gap: 6px;
  }

  .admin-order-email-audit-list dl > div {
    display: grid;
    grid-template-columns:
      105px minmax(0, 1fr);
    gap: 10px;
  }

  .admin-order-email-audit-list dt,
  .admin-order-email-audit-list dd {
    margin: 0;
    overflow-wrap: anywhere;
    font-size: 8px;
    line-height: 1.6;
  }

  .admin-order-email-audit-list dt {
    color: #927a70;
    font-weight: 900;
  }

  .admin-order-email-audit-list dd {
    color: #4d3a32;
  }

  .admin-order-email-audit-empty {
    margin-top: 15px;
    padding: 28px;
    border: 1px dashed #ddc8bf;
    border-radius: 13px;
    color: #947d72;
    background: #fffaf7;
    font-size: 9px;
    text-align: center;
  }

  @media (max-width: 620px) {
    .admin-order-email-audit-heading,
    .admin-order-email-audit-top {
      align-items: flex-start;
      flex-direction: column;
    }

    .admin-order-email-audit-list dl > div {
      grid-template-columns: 1fr;
      gap: 2px;
    }
  }
`;