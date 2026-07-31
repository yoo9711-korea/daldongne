import { auth } from "@/auth";
import ManualPrintJobForm from "@/components/admin/ManualPrintJobForm";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata = {
  title: "수동 인쇄 발주 | 달동네 스토리",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ManualPrintOrderPage({
  params,
}: PageProps) {
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

  const { id } = await params;

  const order = await prisma.bookOrder.findUnique({
    where: {
      id,
    },
    include: {
      book: {
        select: {
          id: true,
          title: true,
          subtitle: true,
          pageCount: true,
        },
      },
      author: {
        select: {
          name: true,
          email: true,
        },
      },
      productionRequest: {
        select: {
          name: true,
          phone: true,
          email: true,
          message: true,
        },
      },
      manualPrintJob: true,
      aiProductionRuns: {
        where: {
          finalPdfUrl: {
            not: null,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        select: {
          finalPdfUrl: true,
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const candidateFinalPdf =
    order.manualPrintJob?.finalPdfUrl ||
    order.aiProductionRuns[0]?.finalPdfUrl ||
    order.proofFileUrl ||
    "";

  return (
    <main className="manual-print-detail-page">
      <style>{styles}</style>

      <div className="manual-print-detail-shell">
        <header className="manual-print-detail-hero">
          <div>
            <p>MANUAL PRINT ORDER</p>
            <h1>{order.book.title}</h1>
            <span>
              주문번호 {order.orderId}
              {" · "}
              {order.productName}
            </span>
          </div>

          <div className="manual-print-detail-links">
            <Link href="/admin/manual-print">
              인쇄 운영 목록
            </Link>
            <Link href={`/admin/orders/${order.id}`}>
              주문 상세
            </Link>
            <Link
              href={`/admin/manual-print/${order.id}/sheet`}
              target="_blank"
            >
              인쇄 발주서
            </Link>
          </div>
        </header>

        <section className="manual-print-detail-notice">
          <strong>중요</strong>
          <p>
            아래 버튼은 인쇄소 API를 호출하지 않습니다.
            실제 이메일 발송·파일 업로드·전화 접수를 마친 뒤
            처리 상태를 기록하는 용도입니다.
          </p>
        </section>

        <section className="manual-print-order-overview">
          <Info label="결제 상태" value={String(order.status)} />
          <Info
            label="제작 단계"
            value={String(order.productionStage)}
          />
          <Info
            label="교정 승인"
            value={formatDateTime(order.proofApprovedAt)}
          />
          <Info
            label="수량"
            value={`${order.quantity.toLocaleString()}권`}
          />
          <Info
            label="페이지"
            value={
              order.book.pageCount
                ? `${order.book.pageCount.toLocaleString()}쪽`
                : "미등록"
            }
          />
          <Info
            label="책 사양"
            value={order.specification || "미등록"}
          />
        </section>

        <section className="manual-print-address">
          <div>
            <p>DELIVERY</p>
            <h2>배송지 확인</h2>
          </div>

          <div className="manual-print-address-grid">
            <Info
              label="수령인"
              value={order.recipientName || "미등록"}
            />
            <Info
              label="연락처"
              value={order.recipientPhone || "미등록"}
            />
            <Info
              label="주소"
              value={
                order.shippingAddress1
                  ? `(${order.postalCode || ""}) ${
                      order.shippingAddress1
                    } ${order.shippingAddress2 || ""}`.trim()
                  : "미등록"
              }
              wide
            />
            <Info
              label="배송 요청"
              value={order.shippingMemo || "없음"}
              wide
            />
          </div>
        </section>

        <ManualPrintJobForm
          orderId={order.id}
          orderStatus={String(order.status)}
          productionStage={String(order.productionStage)}
          proofApprovedAt={
            order.proofApprovedAt?.toISOString() || null
          }
          shippingReady={Boolean(
            order.recipientName &&
              order.recipientPhone &&
              order.postalCode &&
              order.shippingAddress1,
          )}
          initial={{
            status:
              order.manualPrintJob?.status || "PREPARING",
            printerName:
              order.manualPrintJob?.printerName || "",
            contactName:
              order.manualPrintJob?.contactName || "",
            contactPhone:
              order.manualPrintJob?.contactPhone || "",
            contactEmail:
              order.manualPrintJob?.contactEmail || "",
            orderMethod:
              order.manualPrintJob?.orderMethod || "",
            finalPdfUrl: candidateFinalPdf,
            coverPdfUrl:
              order.manualPrintJob?.coverPdfUrl || "",
            interiorPdfUrl:
              order.manualPrintJob?.interiorPdfUrl || "",
            trimSize:
              order.manualPrintJob?.trimSize ||
              order.specification ||
              "",
            pageCount:
              order.manualPrintJob?.pageCount ??
              order.book.pageCount ??
              null,
            coverPaper:
              order.manualPrintJob?.coverPaper || "",
            innerPaper:
              order.manualPrintJob?.innerPaper || "",
            bindingType:
              order.manualPrintJob?.bindingType || "",
            printColor:
              order.manualPrintJob?.printColor || "",
            quantity:
              order.manualPrintJob?.quantity ??
              order.quantity,
            unitCost:
              order.manualPrintJob?.unitCost ?? null,
            totalCost:
              order.manualPrintJob?.totalCost ?? null,
            expectedCompletionAt: toInputDateTime(
              order.manualPrintJob?.expectedCompletionAt ||
                null,
            ),
            note: order.manualPrintJob?.note || "",
            orderSentAt:
              order.manualPrintJob?.orderSentAt?.toISOString() ||
              null,
            acceptedAt:
              order.manualPrintJob?.acceptedAt?.toISOString() ||
              null,
            printingStartedAt:
              order.manualPrintJob?.printingStartedAt?.toISOString() ||
              null,
            completedAt:
              order.manualPrintJob?.completedAt?.toISOString() ||
              null,
          }}
        />
      </div>
    </main>
  );
}

function Info({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <article data-wide={wide ? "true" : "false"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function formatDateTime(value: Date | null) {
  if (!value) {
    return "미등록";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function toInputDateTime(value: Date | null) {
  if (!value) {
    return "";
  }

  const offset = value.getTimezoneOffset();
  const local = new Date(value.getTime() - offset * 60_000);

  return local.toISOString().slice(0, 16);
}

const styles = `
  .manual-print-detail-page {
    min-height: 100vh;
    padding: 34px;
    color: #4f3931;
    background:
      radial-gradient(circle at top right, rgba(255, 229, 213, 0.74), transparent 35%),
      #f7f3f0;
  }

  .manual-print-detail-shell {
    width: min(1240px, 100%);
    margin: 0 auto;
  }

  .manual-print-detail-hero,
  .manual-print-address,
  .manual-print-order-overview {
    border: 1px solid #eadbd4;
    background: rgba(255, 255, 255, 0.94);
    box-shadow: 0 18px 50px rgba(91, 57, 44, 0.07);
  }

  .manual-print-detail-hero {
    padding: 28px;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
    border-radius: 24px;
  }

  .manual-print-detail-hero p,
  .manual-print-address > div:first-child p {
    margin: 0;
    color: #c2644e;
    font-size: 14.4px;
    font-weight: 900;
    letter-spacing: 0.14em;
  }

  .manual-print-detail-hero h1 {
    margin: 8px 0;
    font-size: clamp(26px, 4vw, 42px);
  }

  .manual-print-detail-hero span {
    color: #836e65;
  }

  .manual-print-detail-links {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .manual-print-detail-links a {
    padding: 10px 14px;
    color: #6c4b3f;
    border: 1px solid #dec8bd;
    border-radius: 11px;
    background: #fff;
    font-size: 15.6px;
    font-weight: 800;
    text-decoration: none;
  }

  .manual-print-detail-links a:last-child {
    color: #fff;
    border-color: #b95f49;
    background: #b95f49;
  }

  .manual-print-detail-notice {
    margin-top: 16px;
    padding: 17px 20px;
    display: flex;
    align-items: flex-start;
    gap: 16px;
    color: #755c37;
    border: 1px solid #ead6aa;
    border-radius: 16px;
    background: #fff8e6;
  }

  .manual-print-detail-notice p {
    margin: 0;
    line-height: 1.7;
  }

  .manual-print-order-overview {
    margin-top: 16px;
    padding: 18px;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 9px;
    border-radius: 18px;
  }

  .manual-print-order-overview article,
  .manual-print-address-grid article {
    padding: 15px;
    border: 1px solid #eee1db;
    border-radius: 13px;
    background: #fffdfa;
  }

  .manual-print-order-overview span,
  .manual-print-address-grid span {
    display: block;
    color: #937d73;
    font-size: 11px;
    font-weight: 800;
  }

  .manual-print-order-overview strong,
  .manual-print-address-grid strong {
    margin-top: 6px;
    display: block;
    overflow-wrap: anywhere;
    font-size: 14px;
    line-height: 1.6;
  }

  .manual-print-address {
    margin-top: 16px;
    padding: 22px;
    border-radius: 20px;
  }

  .manual-print-address h2 {
    margin: 5px 0 14px;
  }

  .manual-print-address-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 9px;
  }

  .manual-print-address-grid article[data-wide="true"] {
    grid-column: 1 / -1;
  }

  @media (max-width: 760px) {
    .manual-print-detail-page {
      padding: 18px;
    }

    .manual-print-detail-hero,
    .manual-print-detail-notice {
      align-items: stretch;
      flex-direction: column;
    }

    .manual-print-order-overview,
    .manual-print-address-grid {
      grid-template-columns: 1fr;
    }

    .manual-print-address-grid article[data-wide="true"] {
      grid-column: auto;
    }
  }
`;
