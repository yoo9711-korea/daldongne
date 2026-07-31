import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminOrderAuditDashboardPanel() {
  const startOfToday =
    new Date();

  startOfToday.setHours(
    0,
    0,
    0,
    0,
  );

  const [
    todayCount,
    adminCount,
    publicCount,
    latestLogs,
  ] = await Promise.all([
    prisma.bookOrderAuditLog.count({
      where: {
        createdAt: {
          gte: startOfToday,
        },
      },
    }),

    prisma.bookOrderAuditLog.count({
      where: {
        source: "ADMIN",
        createdAt: {
          gte: startOfToday,
        },
      },
    }),

    prisma.bookOrderAuditLog.count({
      where: {
        isCustomerVisible:
          true,
        createdAt: {
          gte: startOfToday,
        },
      },
    }),

    prisma.bookOrderAuditLog.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        orderId: true,
        category: true,
        summary: true,
        actorName: true,
        createdAt: true,
        order: {
          select: {
            orderId: true,
            book: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    }),
  ]);

  return (
    <section className="admin-audit-dashboard">
      <style>
        {auditDashboardStyles}
      </style>

      <div className="admin-audit-dashboard-heading">
        <div>
          <p>
            ORDER AUDIT
          </p>

          <h2>
            주문 처리 기록
          </h2>
        </div>

        <Link href="/admin/order-audit">
          전체 이력 보기
        </Link>
      </div>

      <div className="admin-audit-dashboard-stats">
        <article>
          <span>
            오늘 전체
          </span>

          <strong>
            {todayCount.toLocaleString()}건
          </strong>
        </article>

        <article>
          <span>
            관리자 처리
          </span>

          <strong>
            {adminCount.toLocaleString()}건
          </strong>
        </article>

        <article>
          <span>
            고객 공개
          </span>

          <strong>
            {publicCount.toLocaleString()}건
          </strong>
        </article>
      </div>

      {latestLogs.length > 0 ? (
        <div className="admin-audit-dashboard-list">
          {latestLogs.map((log) => (
            <Link
              key={log.id}
              href={`/admin/orders/${log.orderId}`}
            >
              <div>
                <strong>
                  {log.order.book.title}
                </strong>

                <span>
                  {log.summary}
                </span>
              </div>

              <small>
                {log.actorName ||
                  "시스템"}
                {" · "}
                {formatTime(
                  log.createdAt,
                )}
              </small>
            </Link>
          ))}
        </div>
      ) : (
        <div className="admin-audit-dashboard-empty">
          기록된 주문 처리 이력이
          없습니다.
        </div>
      )}
    </section>
  );
}

function formatTime(
  value: Date,
) {
  return new Intl.DateTimeFormat(
    "ko-KR",
    {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    },
  ).format(value);
}

const auditDashboardStyles = `
  .admin-audit-dashboard,
  .admin-audit-dashboard * {
    box-sizing: border-box;
  }

  .admin-audit-dashboard {
    margin-top: 16px;
    padding: 21px;
    border: 1px solid rgba(128, 83, 61, 0.12);
    border-radius: 21px;
    background: #ffffff;
    box-shadow: 0 12px 29px rgba(91, 58, 43, 0.045);
  }

  .admin-audit-dashboard a {
    color: inherit;
    text-decoration: none;
  }

  .admin-audit-dashboard-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 15px;
  }

  .admin-audit-dashboard-heading p {
    margin: 0;
    color: #df6550;
    font-size: 9.6px;
    font-weight: 900;
    letter-spacing: .09em;
  }

  .admin-audit-dashboard-heading h2 {
    margin: 5px 0 0;
    font-size: 21px;
  }

  .admin-audit-dashboard-heading > a {
    min-height: 37px;
    padding: 0 12px;
    display: inline-flex;
    align-items: center;
    border: 1px solid #d6b2a3;
    border-radius: 9px;
    background: #ffffff;
    font-size: 9.6px;
    font-weight: 900;
  }

  .admin-audit-dashboard-stats {
    margin-top: 14px;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .admin-audit-dashboard-stats article {
    padding: 14px;
    border: 1px solid #eaded8;
    border-radius: 14px;
    background: #fffcfa;
  }

  .admin-audit-dashboard-stats span {
    color: #957d72;
    font-size: 7px;
    font-weight: 900;
  }

  .admin-audit-dashboard-stats strong {
    display: block;
    margin-top: 6px;
    font-size: 18px;
  }

  .admin-audit-dashboard-list {
    margin-top: 14px;
    display: grid;
    gap: 6px;
  }

  .admin-audit-dashboard-list > a {
    padding: 11px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border: 1px solid #eee2dc;
    border-radius: 12px;
    background: #ffffff;
  }

  .admin-audit-dashboard-list > a > div {
    min-width: 0;
  }

  .admin-audit-dashboard-list strong,
  .admin-audit-dashboard-list span {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .admin-audit-dashboard-list strong {
    font-size: 10.8px;
  }

  .admin-audit-dashboard-list span,
  .admin-audit-dashboard-list small {
    margin-top: 4px;
    color: #927a70;
    font-size: 8.4px;
  }

  .admin-audit-dashboard-list small {
    flex: 0 0 auto;
  }

  .admin-audit-dashboard-empty {
    margin-top: 14px;
    padding: 28px;
    border: 1px dashed #ddc8bf;
    border-radius: 13px;
    color: #947d72;
    background: #fffaf7;
    font-size: 10.8px;
    text-align: center;
  }

  @media (max-width: 620px) {
    .admin-audit-dashboard-heading {
      align-items: stretch;
      flex-direction: column;
    }

    .admin-audit-dashboard-stats {
      grid-template-columns: 1fr;
    }

    .admin-audit-dashboard-list > a {
      align-items: flex-start;
      flex-direction: column;
    }
  }
`;