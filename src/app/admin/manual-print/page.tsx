import { auth } from "@/auth";
import { BookOrderStatus, BookProductionStage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = {
  title: "수동 인쇄 운영 | 달동네 스토리",
  robots: {
    index: false,
    follow: false,
  },
};

const JOB_STATUS_LABELS: Record<string, string> = {
  PREPARING: "발주 준비",
  SENT: "인쇄소 전달",
  ACCEPTED: "접수 확인",
  PRINTING: "인쇄 진행",
  COMPLETED: "인쇄 완료",
};

const STAGE_LABELS: Record<string, string> = {
  PROOF_APPROVED: "교정 승인",
  PRINT_ORDERED: "인쇄 발주",
  PRINTING: "인쇄 중",
  SHIPPING_PREPARATION: "배송 준비",
  SHIPPED: "배송 중",
  COMPLETED: "제작 완료",
};

export default async function ManualPrintOperationsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const adminUser = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      role: true,
    },
  });

  if (adminUser?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const orders = await prisma.bookOrder.findMany({
    where: {
      status: BookOrderStatus.PAID,
      productionStage: {
        in: [
          BookProductionStage.PROOF_APPROVED,
          BookProductionStage.PRINT_ORDERED,
          BookProductionStage.PRINTING,
          BookProductionStage.SHIPPING_PREPARATION,
          BookProductionStage.SHIPPED,
          BookProductionStage.COMPLETED,
        ],
      },
    },
    orderBy: [
      {
        productionStageUpdatedAt: "desc",
      },
      {
        updatedAt: "desc",
      },
    ],
    take: 200,
    include: {
      book: {
        select: {
          title: true,
          pageCount: true,
        },
      },
      author: {
        select: {
          name: true,
          email: true,
        },
      },
      manualPrintJob: true,
    },
  });

  const counts = {
    all: orders.length,
    preparing: orders.filter(
      (order) =>
        !order.manualPrintJob ||
        order.manualPrintJob.status === "PREPARING",
    ).length,
    sent: orders.filter(
      (order) => order.manualPrintJob?.status === "SENT",
    ).length,
    accepted: orders.filter(
      (order) => order.manualPrintJob?.status === "ACCEPTED",
    ).length,
    printing: orders.filter(
      (order) => order.manualPrintJob?.status === "PRINTING",
    ).length,
    completed: orders.filter(
      (order) => order.manualPrintJob?.status === "COMPLETED",
    ).length,
  };

  return (
    <main className="manual-print-list-page">
      <style>{styles}</style>

      <div className="manual-print-list-shell">
        <header className="manual-print-list-hero">
          <div>
            <p>MANUAL PRINT OPERATIONS</p>
            <h1>수동 인쇄 운영</h1>
            <span>
              인쇄소 API 없이 인쇄용 파일 전달, 접수 확인,
              인쇄 진행과 배송 준비까지 관리합니다.
            </span>
          </div>

          <div className="manual-print-list-actions">
            <Link href="/admin/orders">전체 주문</Link>
            <Link href="/admin/system-test/phase-two">
              운영 안전 점검
            </Link>
          </div>
        </header>

        <section className="manual-print-notice">
          <strong>현재 운영 방식</strong>
          <p>
            이 화면은 인쇄소로 파일을 자동 전송하지 않습니다.
            이메일·인쇄소 웹사이트·전화 등으로 실제 발주를
            마친 뒤 해당 처리 버튼을 눌러 기록하세요.
          </p>
        </section>

        <section className="manual-print-summary">
          <Summary label="전체 대상" value={counts.all} />
          <Summary label="발주 준비" value={counts.preparing} />
          <Summary label="전달 완료" value={counts.sent} />
          <Summary label="접수 확인" value={counts.accepted} />
          <Summary label="인쇄 진행" value={counts.printing} />
          <Summary label="인쇄 완료" value={counts.completed} />
        </section>

        <section className="manual-print-list-panel">
          <div className="manual-print-list-heading">
            <div>
              <p>PRINT QUEUE</p>
              <h2>인쇄 운영 대상 주문</h2>
            </div>
            <span>{orders.length.toLocaleString()}건</span>
          </div>

          {orders.length > 0 ? (
            <div className="manual-print-order-list">
              {orders.map((order) => {
                const jobStatus =
                  order.manualPrintJob?.status || "PREPARING";

                return (
                  <article
                    key={order.id}
                    className="manual-print-order-card"
                  >
                    <div className="manual-print-order-main">
                      <div className="manual-print-order-badges">
                        <span data-kind="job">
                          {JOB_STATUS_LABELS[jobStatus] ||
                            jobStatus}
                        </span>
                        <span data-kind="stage">
                          {STAGE_LABELS[
                            String(order.productionStage)
                          ] || String(order.productionStage)}
                        </span>
                      </div>

                      <h3>{order.book.title}</h3>

                      <p>
                        주문번호 {order.orderId}
                        {" · "}
                        {order.productName}
                        {" · "}
                        {order.quantity.toLocaleString()}권
                      </p>

                      <small>
                        {order.author.name ||
                          order.author.email ||
                          "고객 확인 필요"}
                        {" · "}
                        {order.specification ||
                          "책 사양 미등록"}
                        {" · "}
                        {order.book.pageCount
                          ? `${order.book.pageCount}쪽`
                          : "페이지 수 미등록"}
                      </small>
                    </div>

                    <div className="manual-print-order-meta">
                      <span>
                        인쇄소{" "}
                        {order.manualPrintJob?.printerName ||
                          "미정"}
                      </span>
                      <span>
                        예상 완료{" "}
                        {formatDate(
                          order.manualPrintJob
                            ?.expectedCompletionAt || null,
                        )}
                      </span>
                    </div>

                    <div className="manual-print-order-links">
                      <Link
                        href={`/admin/manual-print/${order.id}`}
                      >
                        인쇄 운영
                      </Link>
                      <Link href={`/admin/orders/${order.id}`}>
                        주문 상세
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="manual-print-empty">
              교정 승인 이후 단계의 결제 완료 주문이 없습니다.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Summary({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <article>
      <span>{label}</span>
      <strong>
        {value.toLocaleString()}
        <small>건</small>
      </strong>
    </article>
  );
}

function formatDate(value: Date | null) {
  if (!value) {
    return "미등록";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
  }).format(value);
}

const styles = `
  .manual-print-list-page {
    min-height: 100vh;
    padding: 34px;
    background:
      radial-gradient(circle at top right, rgba(255, 232, 217, 0.72), transparent 34%),
      #f8f4f1;
    color: #4f3931;
  }

  .manual-print-list-shell {
    width: min(1360px, 100%);
    margin: 0 auto;
  }

  .manual-print-list-hero {
    padding: 30px;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
    border: 1px solid #eadbd4;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.92);
    box-shadow: 0 20px 60px rgba(98, 65, 52, 0.08);
  }

  .manual-print-list-hero p,
  .manual-print-list-heading p {
    margin: 0;
    color: #c66c55;
    font-size: 14.4px;
    font-weight: 900;
    letter-spacing: 0.14em;
  }

  .manual-print-list-hero h1 {
    margin: 8px 0 8px;
    font-size: clamp(28px, 4vw, 46px);
  }

  .manual-print-list-hero span {
    color: #7f6a61;
    line-height: 1.7;
  }

  .manual-print-list-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .manual-print-list-actions a,
  .manual-print-order-links a {
    padding: 11px 15px;
    border: 1px solid #dfc8bd;
    border-radius: 11px;
    color: #714f42;
    background: #fff;
    font-size: 15.6px;
    font-weight: 800;
    text-decoration: none;
  }

  .manual-print-notice {
    margin-top: 18px;
    padding: 18px 22px;
    display: flex;
    align-items: flex-start;
    gap: 18px;
    border: 1px solid #ead8b4;
    border-radius: 18px;
    background: #fff9e9;
  }

  .manual-print-notice strong {
    flex: 0 0 auto;
    color: #8c6125;
  }

  .manual-print-notice p {
    margin: 0;
    color: #765f3e;
    line-height: 1.7;
  }

  .manual-print-summary {
    margin-top: 18px;
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 10px;
  }

  .manual-print-summary article {
    padding: 18px;
    border: 1px solid #eadbd4;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.9);
  }

  .manual-print-summary span {
    display: block;
    color: #8c776e;
    font-size: 12px;
    font-weight: 800;
  }

  .manual-print-summary strong {
    margin-top: 7px;
    display: block;
    font-size: 26px;
  }

  .manual-print-summary small {
    margin-left: 3px;
    font-size: 12px;
  }

  .manual-print-list-panel {
    margin-top: 18px;
    padding: 24px;
    border: 1px solid #eadbd4;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.94);
  }

  .manual-print-list-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
  }

  .manual-print-list-heading h2 {
    margin: 6px 0 0;
  }

  .manual-print-order-list {
    margin-top: 18px;
    display: grid;
    gap: 10px;
  }

  .manual-print-order-card {
    padding: 18px;
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(180px, 0.55fr) auto;
    align-items: center;
    gap: 18px;
    border: 1px solid #eee0da;
    border-radius: 17px;
    background: #fffdfa;
  }

  .manual-print-order-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  .manual-print-order-badges span {
    padding: 5px 9px;
    border-radius: 999px;
    font-size: 13.2px;
    font-weight: 900;
  }

  .manual-print-order-badges span[data-kind="job"] {
    color: #8d4939;
    background: #ffe9e2;
  }

  .manual-print-order-badges span[data-kind="stage"] {
    color: #3f6650;
    background: #e5f3e9;
  }

  .manual-print-order-main h3 {
    margin: 10px 0 5px;
    font-size: 18px;
  }

  .manual-print-order-main p,
  .manual-print-order-main small,
  .manual-print-order-meta span {
    display: block;
    color: #817068;
    line-height: 1.6;
  }

  .manual-print-order-main p {
    margin: 0;
    font-size: 15.6px;
  }

  .manual-print-order-main small {
    margin-top: 4px;
  }

  .manual-print-order-meta {
    display: grid;
    gap: 5px;
    font-size: 14.4px;
  }

  .manual-print-order-links {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .manual-print-order-links a:first-child {
    color: #fff;
    border-color: #bd634e;
    background: #bd634e;
  }

  .manual-print-empty {
    margin-top: 18px;
    padding: 48px 20px;
    text-align: center;
    color: #8e7b72;
    border: 1px dashed #ddc9bf;
    border-radius: 16px;
  }

  @media (max-width: 1080px) {
    .manual-print-summary {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .manual-print-order-card {
      grid-template-columns: 1fr;
    }

    .manual-print-order-links {
      flex-direction: row;
    }
  }

  @media (max-width: 700px) {
    .manual-print-list-page {
      padding: 18px;
    }

    .manual-print-list-hero,
    .manual-print-notice {
      flex-direction: column;
      align-items: stretch;
    }

    .manual-print-summary {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
`;
