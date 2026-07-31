import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminOrderDashboardPanel() {
  const [
    totalOrders,
    paidOrders,
    pendingOrders,
    refundOrders,
    paidAggregate,
    recentOrders,
  ] = await Promise.all([
    prisma.bookOrder.count(),

    prisma.bookOrder.count({
      where: {
        status: "PAID",
      },
    }),

    prisma.bookOrder.count({
      where: {
        status: {
          in: [
            "READY",
            "PAYMENT_PENDING",
            "FAILED",
          ],
        },
      },
    }),

    prisma.bookOrder.count({
      where: {
        status: {
          in: [
            "PARTIALLY_REFUNDED",
            "REFUNDED",
            "CANCELED",
          ],
        },
      },
    }),

    prisma.bookOrder.aggregate({
      where: {
        status: "PAID",
      },
      _sum: {
        totalAmount: true,
      },
    }),

    prisma.bookOrder.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        orderId: true,
        productName: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        book: {
          select: {
            title: true,
          },
        },
        author: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  return (
    <section className="admin-order-dashboard">
      <style>
        {`
          .admin-order-dashboard {
            margin-top: 16px;
            padding: 21px;
            border:
              1px solid
              rgba(128, 83, 61, 0.12);
            border-radius: 21px;
            background: #ffffff;
            box-shadow:
              0 12px 29px
              rgba(91, 58, 43, 0.045);
          }

          .admin-order-dashboard,
          .admin-order-dashboard * {
            box-sizing: border-box;
          }

          .admin-order-dashboard a {
            color: inherit;
            text-decoration: none;
          }

          .admin-order-dashboard-heading {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 15px;
          }

          .admin-order-dashboard-heading p {
            margin: 0;
            color: #df6550;
            font-size: 9.6px;
            font-weight: 900;
            letter-spacing: 0.09em;
          }

          .admin-order-dashboard-heading h2 {
            margin: 5px 0 0;
            font-size: 21px;
          }

          .admin-order-dashboard-heading > a {
            min-height: 37px;
            padding: 0 12px;
            display: inline-flex;
            align-items: center;
            border: 1px solid #d6b2a3;
            border-radius: 9px;
            color: #765449;
            background: #ffffff;
            font-size: 9.6px;
            font-weight: 900;
          }

          .admin-order-dashboard-stats {
            margin-top: 14px;
            display: grid;
            grid-template-columns:
              repeat(5, minmax(0, 1fr));
            gap: 8px;
          }

          .admin-order-dashboard-stats article {
            min-width: 0;
            padding: 14px;
            border: 1px solid #eaded8;
            border-radius: 14px;
            background: #fffcfa;
          }

          .admin-order-dashboard-stats span {
            color: #957d72;
            font-size: 7px;
            font-weight: 900;
          }

          .admin-order-dashboard-stats strong {
            display: block;
            margin-top: 6px;
            overflow-wrap: anywhere;
            font-size: 18px;
          }

          .admin-order-dashboard-list {
            margin-top: 14px;
            display: grid;
            gap: 6px;
          }

          .admin-order-dashboard-item {
            min-width: 0;
            padding: 11px 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            border: 1px solid #eee2dc;
            border-radius: 12px;
            background: #ffffff;
          }

          .admin-order-dashboard-item > div {
            min-width: 0;
          }

          .admin-order-dashboard-item strong,
          .admin-order-dashboard-item span {
            display: block;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .admin-order-dashboard-item strong {
            font-size: 10.8px;
          }

          .admin-order-dashboard-item span {
            margin-top: 4px;
            color: #927a70;
            font-size: 8.4px;
          }

          .admin-order-dashboard-item em {
            flex: 0 0 auto;
            color: #c35948;
            font-size: 9.6px;
            font-style: normal;
            font-weight: 900;
          }

          .admin-order-dashboard-empty {
            margin-top: 14px;
            padding: 28px;
            border: 1px dashed #ddc8bf;
            border-radius: 13px;
            color: #947d72;
            background: #fffaf7;
            font-size: 10.8px;
            text-align: center;
          }

          @media (max-width: 1080px) {
            .admin-order-dashboard-stats {
              grid-template-columns:
                repeat(3, minmax(0, 1fr));
            }
          }

          @media (max-width: 620px) {
            .admin-order-dashboard-heading {
              align-items: stretch;
              flex-direction: column;
            }

            .admin-order-dashboard-stats {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }

            .admin-order-dashboard-item {
              align-items: flex-start;
              flex-direction: column;
            }
          }
        `}
      </style>

      <div className="admin-order-dashboard-heading">
        <div>
          <p>
            ORDER & PAYMENT
          </p>

          <h2>
            주문·결제 운영 현황
          </h2>
        </div>

        <Link href="/admin/orders">
          전체 주문 관리
        </Link>
      </div>

      <div className="admin-order-dashboard-stats">
        <DashboardStat
          label="전체 주문"
          value={`${totalOrders.toLocaleString()}건`}
        />

        <DashboardStat
          label="결제 완료"
          value={`${paidOrders.toLocaleString()}건`}
        />

        <DashboardStat
          label="결제 확인 필요"
          value={`${pendingOrders.toLocaleString()}건`}
        />

        <DashboardStat
          label="취소·환불"
          value={`${refundOrders.toLocaleString()}건`}
        />

        <DashboardStat
          label="결제 완료 금액"
          value={`${(
            paidAggregate._sum
              .totalAmount || 0
          ).toLocaleString()}원`}
        />
      </div>

      {recentOrders.length > 0 ? (
        <div className="admin-order-dashboard-list">
          {recentOrders.map(
            (order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="admin-order-dashboard-item"
              >
                <div>
                  <strong>
                    {order.book.title}
                    {" · "}
                    {order.productName}
                  </strong>

                  <span>
                    {order.author.name ||
                      order.author.email ||
                      "고객 확인 필요"}
                    {" · "}
                    {order.totalAmount.toLocaleString()}
                    원
                    {" · "}
                    {getStatusLabel(
                      order.status,
                    )}
                  </span>
                </div>

                <em>
                  상세 →
                </em>
              </Link>
            ),
          )}
        </div>
      ) : (
        <div className="admin-order-dashboard-empty">
          등록된 제작 주문이 없습니다.
        </div>
      )}
    </section>
  );
}

function DashboardStat({
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

function getStatusLabel(
  status: string,
) {
  const labels:
    Record<string, string> = {
      READY: "결제 준비",
      PAYMENT_PENDING:
        "결제 확인 중",
      PAID: "결제 완료",
      PARTIALLY_REFUNDED:
        "부분 환불",
      REFUNDED: "전액 환불",
      CANCELED: "주문 취소",
      FAILED: "결제 실패",
    };

  return (
    labels[status] ||
    "상태 확인 필요"
  );
}