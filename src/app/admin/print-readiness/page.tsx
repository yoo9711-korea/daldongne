import { auth } from "@/auth";
import {
  BookOrderStatus,
  BookProductionStage,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = {
  title: "인쇄 준비 점검 | 달동네 스토리",
  robots: { index: false, follow: false },
};

export default async function PrintReadinessPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (admin?.role !== "ADMIN") {
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
      { productionStageUpdatedAt: "desc" },
      { updatedAt: "desc" },
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
      printReadiness: true,
      printQuotes: {
        where: { status: "SELECTED" },
        take: 1,
      },
      manualPrintJob: {
        select: {
          status: true,
          printerName: true,
        },
      },
    },
  });

  const total = orders.length;
  const notStarted = orders.filter((x) => !x.printReadiness).length;
  const blocked = orders.filter((x) => (x.printReadiness?.blockerCount || 0) > 0).length;
  const ready = orders.filter((x) => x.printReadiness?.status === "READY").length;
  const frozen = orders.filter((x) => x.printReadiness?.status === "FROZEN").length;

  return (
    <main className="pr-page">
      <style>{styles}</style>

      <div className="pr-shell">
        <header className="pr-hero">
          <div>
            <p>PRINT READINESS</p>
            <h1>인쇄 준비 점검</h1>
            <span>
              실제 인쇄소 연결 전 PDF·사양·견적·샘플 인쇄를
              확정하고 인쇄소 전달 사고를 차단합니다.
            </span>
          </div>

          <div className="pr-actions">
            <Link href="/admin/manual-print">수동 인쇄 운영</Link>
            <Link href="/admin/orders">전체 주문</Link>
          </div>
        </header>

        <section className="pr-notice">
          이 화면은 인쇄소에 파일을 전송하지 않습니다.
          점검 완료 후 사양을 동결해야 수동 인쇄센터에서
          인쇄소 전달을 등록할 수 있습니다.
        </section>

        <section className="pr-stats">
          <Stat label="전체 대상" value={total} />
          <Stat label="점검 시작 전" value={notStarted} />
          <Stat label="차단 항목 있음" value={blocked} />
          <Stat label="동결 준비" value={ready} />
          <Stat label="사양 동결" value={frozen} />
        </section>

        <section className="pr-list">
          <div className="pr-list-title">
            <h2>인쇄 준비 대상 주문</h2>
            <span>{orders.length.toLocaleString()}건</span>
          </div>

          {orders.length === 0 ? (
            <div className="pr-empty">
              교정 승인 이후의 결제 완료 주문이 없습니다.
            </div>
          ) : (
            orders.map((order) => {
              const readiness = order.printReadiness;
              const handedOff =
                order.manualPrintJob &&
                order.manualPrintJob.status !== "PREPARING";

              return (
                <article key={order.id} className="pr-card">
                  <div>
                    <div className="pr-badges">
                      <span data-kind={readiness?.status || "DRAFT"}>
                        {readiness?.status === "FROZEN"
                          ? "사양 동결"
                          : readiness?.status === "READY"
                            ? "동결 준비"
                            : readiness
                              ? "점검 필요"
                              : "점검 시작 전"}
                      </span>
                      {handedOff ? (
                        <span data-kind="HANDED_OFF">인쇄소 전달 후</span>
                      ) : null}
                    </div>

                    <h3>{order.book.title}</h3>
                    <p>
                      주문번호 {order.orderId} · {order.productName} ·
                      {order.quantity.toLocaleString()}권
                    </p>
                    <small>
                      {order.author.name || order.author.email || "고객 확인 필요"}
                      {" · "}
                      {order.book.pageCount
                        ? `${order.book.pageCount}쪽`
                        : "페이지 미등록"}
                      {" · "}
                      {order.specification || "사양 미등록"}
                    </small>
                  </div>

                  <div className="pr-result">
                    <strong>차단 {readiness?.blockerCount || 0}건</strong>
                    <span>주의 {readiness?.warningCount || 0}건</span>
                    <span>
                      선택 견적 {order.printQuotes[0]?.printerName || "없음"}
                    </span>
                  </div>

                  <div className="pr-links">
                    <Link href={`/admin/print-readiness/${order.id}`}>
                      준비 점검
                    </Link>
                    <Link href={`/admin/manual-print/${order.id}`}>
                      수동 인쇄
                    </Link>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value.toLocaleString()}<small>건</small></strong>
    </article>
  );
}

const styles = `
  .pr-page{min-height:100vh;padding:32px;background:#f7f3f0;color:#4f3931}
  .pr-shell{width:min(1360px,100%);margin:auto}
  .pr-hero,.pr-list,.pr-stats article{border:1px solid #eadbd4;background:#fff;border-radius:20px}
  .pr-hero{padding:28px;display:flex;justify-content:space-between;align-items:flex-end;gap:20px}
  .pr-hero p{margin:0;color:#c46751;font-size:12px;font-weight:900;letter-spacing:.14em}
  .pr-hero h1{margin:8px 0;font-size:clamp(28px,4vw,44px)}
  .pr-hero span{color:#806b62;line-height:1.7}
  .pr-actions,.pr-links{display:flex;gap:8px;flex-wrap:wrap}
  .pr-actions a,.pr-links a{padding:10px 14px;border:1px solid #dec8bd;border-radius:10px;background:#fff;color:#704e41;text-decoration:none;font-size:13px;font-weight:800}
  .pr-actions a:first-child,.pr-links a:first-child{background:#b95f49;border-color:#b95f49;color:#fff}
  .pr-notice{margin-top:15px;padding:16px 19px;border:1px solid #ead6aa;border-radius:15px;background:#fff8e6;color:#745c38;line-height:1.7}
  .pr-stats{margin-top:15px;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px}
  .pr-stats article{padding:17px}
  .pr-stats span{display:block;color:#8f796f;font-size:12px;font-weight:800}
  .pr-stats strong{display:block;margin-top:6px;font-size:25px}.pr-stats small{font-size:12px;margin-left:3px}
  .pr-list{margin-top:15px;padding:23px}
  .pr-list-title{display:flex;justify-content:space-between;align-items:flex-end}.pr-list-title h2{margin:0}
  .pr-card{margin-top:10px;padding:17px;display:grid;grid-template-columns:minmax(0,1.4fr) minmax(170px,.5fr) auto;gap:16px;align-items:center;border:1px solid #eee0da;border-radius:15px;background:#fffdfa}
  .pr-badges{display:flex;gap:6px;flex-wrap:wrap}.pr-badges span{padding:5px 9px;border-radius:999px;font-size:11px;font-weight:900;background:#ffe8e0;color:#8e493a}
  .pr-badges span[data-kind="READY"]{background:#fff0c8;color:#816121}.pr-badges span[data-kind="FROZEN"]{background:#e3f2e8;color:#38634a}.pr-badges span[data-kind="HANDED_OFF"]{background:#e7ebf7;color:#4b5878}
  .pr-card h3{margin:9px 0 4px}.pr-card p{margin:0;color:#806d64;font-size:13px}.pr-card small{display:block;margin-top:4px;color:#8f7a70}
  .pr-result{display:grid;gap:5px;font-size:12px;color:#806d64}.pr-result strong{color:#a34f3e}
  .pr-links{flex-direction:column}.pr-empty{margin-top:15px;padding:45px;text-align:center;border:1px dashed #dbc8be;border-radius:14px;color:#8d7a71}
  @media(max-width:1000px){.pr-stats{grid-template-columns:repeat(3,1fr)}.pr-card{grid-template-columns:1fr}.pr-links{flex-direction:row}}
  @media(max-width:700px){.pr-page{padding:17px}.pr-hero{flex-direction:column;align-items:stretch}.pr-stats{grid-template-columns:repeat(2,1fr)}}
`;
