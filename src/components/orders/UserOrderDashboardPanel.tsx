import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  BookOrderStatus,
  BookProductionStage,
} from "@prisma/client";
import Link from "next/link";

export default async function UserOrderDashboardPanel() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  const [
    totalCount,
    paymentRequiredCount,
    productionCount,
    recentOrders,
  ] = await Promise.all([
    prisma.bookOrder.count({
      where: {
        authorId: userId,
      },
    }),

    prisma.bookOrder.count({
      where: {
        authorId: userId,
        status: {
          in: [
            BookOrderStatus.READY,
            BookOrderStatus.FAILED,
          ],
        },
      },
    }),

    prisma.bookOrder.count({
      where: {
        authorId: userId,
        status:
          BookOrderStatus.PAID,
        productionStage: {
          notIn: [
            BookProductionStage.COMPLETED,
            BookProductionStage.ON_HOLD,
          ],
        },
      },
    }),

    prisma.bookOrder.findMany({
      where: {
        authorId: userId,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 3,
      select: {
        id: true,
        productName: true,
        totalAmount: true,
        status: true,
        productionStage: true,
        updatedAt: true,
        book: {
          select: {
            title: true,
          },
        },
      },
    }),
  ]);

  if (totalCount === 0) {
    return null;
  }

  return (
    <section className="dashboard-user-order-panel">
      <style>
        {dashboardOrderStyles}
      </style>

      <div className="dashboard-user-order-heading">
        <div>
          <p>나의 주문</p>

          <h2>
            주문·제작 진행 현황
          </h2>
        </div>

        <Link href="/dashboard/orders">
          전체 주문 보기
          <span aria-hidden="true">
            →
          </span>
        </Link>
      </div>

      <div className="dashboard-user-order-summary">
        <article>
          <span>전체 주문</span>

          <strong>
            {totalCount.toLocaleString()}
            <small>건</small>
          </strong>
        </article>

        <article>
          <span>결제 필요</span>

          <strong>
            {paymentRequiredCount.toLocaleString()}
            <small>건</small>
          </strong>
        </article>

        <article>
          <span>제작 진행</span>

          <strong>
            {productionCount.toLocaleString()}
            <small>건</small>
          </strong>
        </article>
      </div>

      <div className="dashboard-user-order-list">
        {recentOrders.map(
          (order) => (
            <Link
              key={order.id}
              href={`/dashboard/orders/${order.id}`}
            >
              <div>
                <strong>
                  {order.book.title}
                </strong>

                <span>
                  {order.productName}
                  {" · "}
                  {order.totalAmount.toLocaleString()}
                  원
                </span>
              </div>

              <div>
                <em>
                  {getOrderStatusLabel(
                    String(
                      order.status,
                    ),
                  )}
                </em>

                <small>
                  {getStageLabel(
                    String(
                      order.productionStage,
                    ),
                  )}
                </small>
              </div>
            </Link>
          ),
        )}
      </div>
    </section>
  );
}

function getOrderStatusLabel(
  status: string,
) {
  const labels:
    Record<string, string> = {
      READY: "결제 준비",
      PAYMENT_PENDING:
        "입금 확인 중",
      PAID: "결제 완료",
      PARTIALLY_REFUNDED:
        "부분 환불",
      REFUNDED: "전액 환불",
      CANCELED: "주문 취소",
      FAILED: "결제 재시도",
    };

  return (
    labels[status] ||
    "상태 확인 필요"
  );
}

function getStageLabel(
  stage: string,
) {
  const labels:
    Record<string, string> = {
      PREPARING: "제작 준비",
      MANUSCRIPT_RECEIVED:
        "원고 접수",
      REVIEWING: "원고 검토",
      PROOFING: "교정 작업",
      PROOF_SENT: "교정본 확인",
      PROOF_APPROVED:
        "교정 승인",
      PRINT_ORDERED: "인쇄 발주",
      PRINTING: "인쇄 중",
      SHIPPING_PREPARATION:
        "배송 준비",
      SHIPPED: "배송 중",
      COMPLETED: "제작 완료",
      ON_HOLD: "제작 보류",
    };

  return (
    labels[stage] ||
    "제작 상태 확인"
  );
}

const dashboardOrderStyles = `
  .dashboard-user-order-panel,
  .dashboard-user-order-panel * {
    box-sizing: border-box;
  }

  .dashboard-user-order-panel {
    margin-top: 21px;
    padding: 24px;
    border:
      1px solid
      rgba(143, 96, 73, 0.13);
    border-radius: 24px;
    background:
      linear-gradient(
        145deg,
        #fffdf9,
        #fff5ef
      );
    box-shadow:
      0 14px 35px
      rgba(104, 67, 50, 0.055);
  }

  .dashboard-user-order-panel a {
    color: inherit;
    text-decoration: none;
  }

  .dashboard-user-order-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 18px;
  }

  .dashboard-user-order-heading p {
    margin: 0;
    color: #dc684f;
    font-size: 10px;
    font-weight: 900;
  }

  .dashboard-user-order-heading h2 {
    margin: 6px 0 0;
    font-family:
      var(--font-display),
      "Noto Serif KR",
      serif;
    font-size: 24px;
    letter-spacing: -0.04em;
  }

  .dashboard-user-order-heading > a {
    min-height: 39px;
    padding: 0 13px;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    border: 1px solid #dfc1b3;
    border-radius: 11px;
    color: #76594e;
    background: #ffffff;
    font-size: 11px;
    font-weight: 900;
  }

  .dashboard-user-order-summary {
    margin-top: 17px;
    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
    gap: 9px;
  }

  .dashboard-user-order-summary article {
    padding: 15px;
    border: 1px solid #ebddd6;
    border-radius: 15px;
    background: #ffffff;
  }

  .dashboard-user-order-summary span {
    color: #927b70;
    font-size: 10px;
    font-weight: 900;
  }

  .dashboard-user-order-summary strong {
    display: block;
    margin-top: 6px;
    font-size: 23px;
  }

  .dashboard-user-order-summary small {
    margin-left: 3px;
    font-size: 11px;
  }

  .dashboard-user-order-list {
    margin-top: 13px;
    display: grid;
    gap: 7px;
  }

  .dashboard-user-order-list > a {
    min-width: 0;
    padding: 12px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 13px;
    border: 1px solid #eadbd4;
    border-radius: 13px;
    background: rgba(
      255,
      255,
      255,
      0.86
    );
  }

  .dashboard-user-order-list > a:hover {
    border-color: #e99b85;
    background: #fff8f4;
  }

  .dashboard-user-order-list > a > div {
    min-width: 0;
  }

  .dashboard-user-order-list strong,
  .dashboard-user-order-list span,
  .dashboard-user-order-list em,
  .dashboard-user-order-list small {
    display: block;
  }

  .dashboard-user-order-list strong {
    overflow: hidden;
    color: #513a30;
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dashboard-user-order-list span {
    margin-top: 4px;
    overflow: hidden;
    color: #927b71;
    font-size: 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dashboard-user-order-list > a > div:last-child {
    flex: 0 0 auto;
    text-align: right;
  }

  .dashboard-user-order-list em {
    color: #c95c47;
    font-size: 10px;
    font-style: normal;
    font-weight: 900;
  }

  .dashboard-user-order-list small {
    margin-top: 4px;
    color: #8b756a;
    font-size: 9px;
  }

  @media (max-width: 650px) {
    .dashboard-user-order-heading {
      align-items: stretch;
      flex-direction: column;
    }

    .dashboard-user-order-heading > a {
      align-self: flex-start;
    }

    .dashboard-user-order-summary {
      grid-template-columns: 1fr;
    }

    .dashboard-user-order-list > a {
      align-items: flex-start;
      flex-direction: column;
    }

    .dashboard-user-order-list > a > div:last-child {
      text-align: left;
    }
  }
`;