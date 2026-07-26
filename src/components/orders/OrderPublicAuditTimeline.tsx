import { prisma } from "@/lib/prisma";

export default async function OrderPublicAuditTimeline({
  orderRecordId,
  authorId,
}: {
  orderRecordId: string;
  authorId: string;
}) {
  const logs =
    await prisma.bookOrderAuditLog.findMany({
      where: {
        orderId: orderRecordId,
        isCustomerVisible: true,
        order: {
          is: {
            authorId,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 30,
      select: {
        id: true,
        category: true,
        summary: true,
        createdAt: true,
      },
    });

  if (logs.length === 0) {
    return null;
  }

  return (
    <section className="user-order-public-audit">
      <style>
        {publicAuditStyles}
      </style>

      <div className="user-order-public-audit-heading">
        <p>
          ORDER UPDATES
        </p>

        <h2>
          상세 진행 알림
        </h2>

        <span>
          고객님께 공개된 주문과 제작
          변경 내용을 확인할 수 있습니다.
        </span>
      </div>

      <ol>
        {logs.map((log) => (
          <li key={log.id}>
            <span
              className="user-order-public-audit-icon"
              data-category={
                log.category
              }
              aria-hidden="true"
            >
              {getCategoryIcon(
                log.category,
              )}
            </span>

            <div>
              <strong>
                {getCategoryLabel(
                  log.category,
                )}
              </strong>

              <p>
                {log.summary}
              </p>

              <time>
                {formatDateTime(
                  log.createdAt,
                )}
              </time>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function getCategoryIcon(
  category: string,
) {
  if (category === "PAYMENT") {
    return "₩";
  }

  if (category === "DELIVERY") {
    return "↗";
  }

  if (category === "REFUND") {
    return "↩";
  }

  if (category === "PRODUCTION") {
    return "✓";
  }

  return "•";
}

function getCategoryLabel(
  category: string,
) {
  const labels:
    Record<string, string> = {
      ORDER: "주문 안내",
      QUOTE: "제작 견적",
      PAYMENT: "결제 안내",
      PRODUCTION: "제작 진행",
      DELIVERY: "배송 안내",
      REFUND: "취소·환불",
    };

  return labels[category] ||
    "진행 안내";
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

const publicAuditStyles = `
  .user-order-public-audit,
  .user-order-public-audit * {
    box-sizing: border-box;
  }

  .user-order-public-audit {
    margin-top: 15px;
    padding: 22px;
    border: 1px solid rgba(139, 91, 69, 0.12);
    border-radius: 21px;
    background: #ffffff;
    box-shadow: 0 12px 31px rgba(97, 62, 46, 0.045);
  }

  .user-order-public-audit-heading p {
    margin: 0;
    color: #df6750;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.08em;
  }

  .user-order-public-audit-heading h2 {
    margin: 6px 0 0;
    font-family: var(--font-display), "Noto Serif KR", serif;
    font-size: 23px;
    letter-spacing: -0.04em;
  }

  .user-order-public-audit-heading span {
    display: block;
    margin-top: 7px;
    color: #8b756b;
    font-size: 11px;
    line-height: 1.65;
  }

  .user-order-public-audit ol {
    margin: 19px 0 0;
    padding: 0;
    display: grid;
    gap: 9px;
    list-style: none;
  }

  .user-order-public-audit li {
    padding: 14px;
    display: grid;
    grid-template-columns: 39px minmax(0, 1fr);
    gap: 12px;
    border: 1px solid #eadfd8;
    border-radius: 14px;
    background: #fffcfa;
  }

  .user-order-public-audit-icon {
    width: 39px;
    height: 39px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    color: #ffffff;
    background: #7c67a1;
    font-size: 13px;
    font-weight: 900;
  }

  .user-order-public-audit-icon[data-category="PAYMENT"] {
    background: #df6750;
  }

  .user-order-public-audit-icon[data-category="PRODUCTION"],
  .user-order-public-audit-icon[data-category="DELIVERY"] {
    background: #5d8b72;
  }

  .user-order-public-audit strong {
    color: #574139;
    font-size: 10px;
  }

  .user-order-public-audit p {
    margin: 5px 0 0;
    color: #6f5a51;
    font-size: 11px;
    line-height: 1.65;
  }

  .user-order-public-audit time {
    display: block;
    margin-top: 6px;
    color: #a18a80;
    font-size: 9px;
  }

  @media (max-width: 520px) {
    .user-order-public-audit {
      padding: 18px;
    }

    .user-order-public-audit li {
      grid-template-columns: 34px minmax(0, 1fr);
    }

    .user-order-public-audit-icon {
      width: 34px;
      height: 34px;
      border-radius: 10px;
    }
  }
`;