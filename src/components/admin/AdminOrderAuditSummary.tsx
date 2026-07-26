import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminOrderAuditSummary({
  orderRecordId,
  orderNumber,
}: {
  orderRecordId: string;
  orderNumber: string;
}) {
  const [totalCount, logs] =
    await Promise.all([
      prisma.bookOrderAuditLog.count({
        where: {
          orderId:
            orderRecordId,
        },
      }),

      prisma.bookOrderAuditLog.findMany({
        where: {
          orderId:
            orderRecordId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          source: true,
          category: true,
          action: true,
          summary: true,
          actorName: true,
          actorEmail: true,
          isCustomerVisible: true,
          createdAt: true,
        },
      }),
    ]);

  return (
    <section className="admin-order-audit-summary">
      <style>
        {auditSummaryStyles}
      </style>

      <div className="admin-order-audit-summary-heading">
        <div>
          <p>
            ORDER AUDIT
          </p>

          <h2>
            최근 처리 이력
          </h2>

          <span>
            변경 관리자와 주요 변경
            내용을 기록합니다.
          </span>
        </div>

        <Link
          href={`/admin/order-audit?orderId=${encodeURIComponent(
            orderRecordId,
          )}&q=${encodeURIComponent(
            orderNumber,
          )}`}
        >
          전체 {totalCount.toLocaleString()}건
          보기
          <span aria-hidden="true">
            →
          </span>
        </Link>
      </div>

      {logs.length > 0 ? (
        <div className="admin-order-audit-summary-list">
          {logs.map((log) => (
            <article key={log.id}>
              <span
                className="admin-order-audit-summary-dot"
                data-category={
                  log.category
                }
                aria-hidden="true"
              />

              <div>
                <div className="admin-order-audit-summary-meta">
                  <strong>
                    {getCategoryLabel(
                      log.category,
                    )}
                  </strong>

                  <small>
                    {getSourceLabel(
                      log.source,
                    )}
                  </small>

                  {log.isCustomerVisible ? (
                    <em>
                      고객 공개
                    </em>
                  ) : (
                    <em
                      data-private="true"
                    >
                      관리자 전용
                    </em>
                  )}
                </div>

                <h3>
                  {log.summary}
                </h3>

                <p>
                  {log.actorName ||
                    log.actorEmail ||
                    "시스템 자동 처리"}
                  {" · "}
                  {formatDateTime(
                    log.createdAt,
                  )}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="admin-order-audit-summary-empty">
          아직 기록된 처리 이력이
          없습니다.
        </div>
      )}
    </section>
  );
}

function getCategoryLabel(
  category: string,
) {
  const labels:
    Record<string, string> = {
      ORDER: "주문",
      QUOTE: "견적",
      PAYMENT: "결제",
      PRODUCTION: "제작",
      DELIVERY: "배송",
      REFUND: "취소·환불",
    };

  return labels[category] ||
    category;
}

function getSourceLabel(
  source: string,
) {
  const labels:
    Record<string, string> = {
      ADMIN: "관리자",
      CUSTOMER: "고객",
      WEBHOOK: "토스 웹훅",
      SYSTEM: "시스템",
    };

  return labels[source] ||
    source;
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

const auditSummaryStyles = `
  .admin-order-audit-summary,
  .admin-order-audit-summary * {
    box-sizing: border-box;
  }

  .admin-order-audit-summary {
    margin-top: 15px;
    padding: 22px;
    border: 1px solid rgba(128, 83, 61, 0.12);
    border-radius: 21px;
    background: #ffffff;
    box-shadow: 0 12px 31px rgba(97, 62, 46, 0.045);
  }

  .admin-order-audit-summary a {
    color: inherit;
    text-decoration: none;
  }

  .admin-order-audit-summary-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
  }

  .admin-order-audit-summary-heading p {
    margin: 0;
    color: #df6550;
    font-size: 9px;
    font-weight: 900;
    letter-spacing: 0.09em;
  }

  .admin-order-audit-summary-heading h2 {
    margin: 5px 0 0;
    font-size: 22px;
  }

  .admin-order-audit-summary-heading > div > span {
    display: block;
    margin-top: 6px;
    color: #8b756a;
    font-size: 9px;
  }

  .admin-order-audit-summary-heading > a {
    min-height: 38px;
    padding: 0 13px;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    border: 1px solid #d7b7aa;
    border-radius: 10px;
    color: #76564b;
    background: #ffffff;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-order-audit-summary-list {
    margin-top: 17px;
    display: grid;
    gap: 8px;
  }

  .admin-order-audit-summary-list article {
    min-width: 0;
    padding: 13px;
    display: grid;
    grid-template-columns: 13px minmax(0, 1fr);
    gap: 11px;
    border: 1px solid #eadfd9;
    border-radius: 13px;
    background: #fffcfa;
  }

  .admin-order-audit-summary-dot {
    width: 11px;
    height: 11px;
    margin-top: 4px;
    border-radius: 50%;
    background: #7f6ba6;
  }

  .admin-order-audit-summary-dot[data-category="PAYMENT"],
  .admin-order-audit-summary-dot[data-category="REFUND"] {
    background: #df6550;
  }

  .admin-order-audit-summary-dot[data-category="PRODUCTION"],
  .admin-order-audit-summary-dot[data-category="DELIVERY"] {
    background: #4e7f69;
  }

  .admin-order-audit-summary-meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
  }

  .admin-order-audit-summary-meta strong,
  .admin-order-audit-summary-meta small,
  .admin-order-audit-summary-meta em {
    min-height: 22px;
    padding: 0 7px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    font-size: 7px;
    font-style: normal;
    font-weight: 900;
  }

  .admin-order-audit-summary-meta strong {
    color: #694c40;
    background: #f4e8e1;
  }

  .admin-order-audit-summary-meta small {
    color: #4f6685;
    background: #e9f0f9;
  }

  .admin-order-audit-summary-meta em {
    color: #39704b;
    background: #e6f3e9;
  }

  .admin-order-audit-summary-meta em[data-private="true"] {
    color: #84611d;
    background: #fff2cc;
  }

  .admin-order-audit-summary-list h3 {
    margin: 8px 0 0;
    color: #4f3a31;
    font-size: 11px;
    line-height: 1.6;
  }

  .admin-order-audit-summary-list p {
    margin: 5px 0 0;
    color: #937c72;
    font-size: 8px;
  }

  .admin-order-audit-summary-empty {
    margin-top: 16px;
    padding: 31px;
    border: 1px dashed #d9c3b9;
    border-radius: 14px;
    color: #947d72;
    background: #fffaf7;
    font-size: 9px;
    text-align: center;
  }

  @media (max-width: 650px) {
    .admin-order-audit-summary-heading {
      align-items: stretch;
      flex-direction: column;
    }

    .admin-order-audit-summary-heading > a {
      align-self: flex-start;
    }
  }
`;