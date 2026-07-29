import { auth } from "@/auth";
import ManualPrintSheetActions from "@/components/admin/ManualPrintSheetActions";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata = {
  title: "인쇄 발주서 | 달동네 스토리",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ManualPrintSheetPage({
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
      manualPrintJob: true,
    },
  });

  if (!order) {
    notFound();
  }

  const job = order.manualPrintJob;

  return (
    <main className="manual-print-sheet">
      <style>{styles}</style>

      <ManualPrintSheetActions orderId={order.id} />

      <article>
        <header>
          <div>
            <p>DALDONGNE STORY</p>
            <h1>인쇄 발주서</h1>
          </div>

          <div>
            <span>주문번호</span>
            <strong>{order.orderId}</strong>
          </div>
        </header>

        <Section title="기본 주문 정보">
          <Row label="책 제목" value={order.book.title} />
          <Row
            label="상품"
            value={order.productName}
          />
          <Row
            label="기본 사양"
            value={order.specification || "미등록"}
          />
          <Row
            label="수량"
            value={`${(
              job?.quantity || order.quantity
            ).toLocaleString()}권`}
          />
          <Row
            label="페이지 수"
            value={
              job?.pageCount || order.book.pageCount
                ? `${(
                    job?.pageCount ||
                    order.book.pageCount ||
                    0
                  ).toLocaleString()}쪽`
                : "미등록"
            }
          />
          <Row
            label="책 크기"
            value={job?.trimSize || "미등록"}
          />
        </Section>

        <Section title="인쇄 사양">
          <Row
            label="표지 용지"
            value={job?.coverPaper || "미등록"}
          />
          <Row
            label="내지 용지"
            value={job?.innerPaper || "미등록"}
          />
          <Row
            label="제본 방식"
            value={job?.bindingType || "미등록"}
          />
          <Row
            label="인쇄 색상"
            value={job?.printColor || "미등록"}
          />
          <Row
            label="예상 완성일"
            value={formatDateTime(
              job?.expectedCompletionAt || null,
            )}
          />
        </Section>

        <Section title="인쇄 파일">
          <FileRow
            label="최종 인쇄 PDF"
            value={job?.finalPdfUrl || "미등록"}
          />
          <FileRow
            label="표지 PDF"
            value={job?.coverPdfUrl || "미등록"}
          />
          <FileRow
            label="내지 PDF"
            value={job?.interiorPdfUrl || "미등록"}
          />
        </Section>

        <Section title="인쇄소 연락 정보">
          <Row
            label="인쇄소"
            value={job?.printerName || "미등록"}
          />
          <Row
            label="담당자"
            value={job?.contactName || "미등록"}
          />
          <Row
            label="연락처"
            value={job?.contactPhone || "미등록"}
          />
          <Row
            label="이메일"
            value={job?.contactEmail || "미등록"}
          />
          <Row
            label="발주 방식"
            value={job?.orderMethod || "미등록"}
          />
        </Section>

        <Section title="배송 정보">
          <Row
            label="수령인"
            value={order.recipientName || "미등록"}
          />
          <Row
            label="연락처"
            value={order.recipientPhone || "미등록"}
          />
          <Row
            label="주소"
            value={
              order.shippingAddress1
                ? `(${order.postalCode || ""}) ${
                    order.shippingAddress1
                  } ${order.shippingAddress2 || ""}`.trim()
                : "미등록"
            }
          />
          <Row
            label="배송 요청"
            value={order.shippingMemo || "없음"}
          />
        </Section>

        <Section title="비용·메모">
          <Row
            label="권당 인쇄비"
            value={
              job?.unitCost != null
                ? `${job.unitCost.toLocaleString()}원`
                : "미등록"
            }
          />
          <Row
            label="총 인쇄비"
            value={
              job?.totalCost != null
                ? `${job.totalCost.toLocaleString()}원`
                : "미등록"
            }
          />
          <Row
            label="메모"
            value={job?.note || "없음"}
          />
        </Section>

        <footer>
          <span>
            생성일{" "}
            {new Intl.DateTimeFormat("ko-KR", {
              dateStyle: "full",
              timeStyle: "short",
            }).format(new Date())}
          </span>
          <strong>달동네 스토리</strong>
        </footer>
      </article>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2>{title}</h2>
      <div>{children}</div>
    </section>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <p>
      <span>{label}</span>
      <strong>{value}</strong>
    </p>
  );
}

function FileRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const hasUrl = value.startsWith("http");

  return (
    <p>
      <span>{label}</span>
      {hasUrl ? (
        <a href={value} target="_blank" rel="noreferrer">
          {value}
        </a>
      ) : (
        <strong>{value}</strong>
      )}
    </p>
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

const styles = `
  .manual-print-sheet {
    min-height: 100vh;
    padding: 26px;
    color: #222;
    background: #ececec;
  }

  .manual-print-sheet-actions {
    width: min(900px, 100%);
    margin: 0 auto 12px;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .manual-print-sheet-actions a,
  .manual-print-sheet-actions button {
    padding: 10px 13px;
    color: #4d382f;
    border: 1px solid #c9b8af;
    border-radius: 8px;
    background: #fff;
    font: inherit;
    font-weight: 800;
    text-decoration: none;
    cursor: pointer;
  }

  .manual-print-sheet-actions button {
    color: #fff;
    border-color: #a94f3d;
    background: #a94f3d;
  }

  .manual-print-sheet > article {
    width: min(900px, 100%);
    min-height: 1180px;
    margin: 0 auto;
    padding: 44px;
    box-sizing: border-box;
    background: #fff;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.13);
  }

  .manual-print-sheet header {
    padding-bottom: 22px;
    display: flex;
    justify-content: space-between;
    gap: 20px;
    border-bottom: 3px solid #333;
  }

  .manual-print-sheet header p {
    margin: 0;
    color: #a94f3d;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.16em;
  }

  .manual-print-sheet h1 {
    margin: 7px 0 0;
    font-size: 34px;
  }

  .manual-print-sheet header > div:last-child {
    text-align: right;
  }

  .manual-print-sheet header span,
  .manual-print-sheet header strong {
    display: block;
  }

  .manual-print-sheet header span {
    color: #777;
    font-size: 12px;
  }

  .manual-print-sheet header strong {
    margin-top: 5px;
  }

  .manual-print-sheet section {
    margin-top: 25px;
    break-inside: avoid;
  }

  .manual-print-sheet section h2 {
    margin: 0 0 8px;
    padding: 8px 10px;
    font-size: 15px;
    background: #f0ebe8;
  }

  .manual-print-sheet section > div {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    border-top: 1px solid #bbb;
    border-left: 1px solid #bbb;
  }

  .manual-print-sheet section p {
    margin: 0;
    min-width: 0;
    display: grid;
    grid-template-columns: 110px minmax(0, 1fr);
    border-right: 1px solid #bbb;
    border-bottom: 1px solid #bbb;
  }

  .manual-print-sheet section p span,
  .manual-print-sheet section p strong,
  .manual-print-sheet section p a {
    padding: 9px;
    overflow-wrap: anywhere;
    font-size: 12px;
    line-height: 1.55;
  }

  .manual-print-sheet section p span {
    color: #555;
    background: #faf8f7;
    font-weight: 800;
  }

  .manual-print-sheet section p a {
    color: #8f3f31;
  }

  .manual-print-sheet footer {
    margin-top: 30px;
    padding-top: 15px;
    display: flex;
    justify-content: space-between;
    border-top: 1px solid #bbb;
    color: #666;
    font-size: 12px;
  }

  @media print {
    .manual-print-sheet {
      padding: 0;
      background: #fff;
    }

    .manual-print-sheet-actions {
      display: none;
    }

    .manual-print-sheet > article {
      width: 100%;
      min-height: auto;
      padding: 18mm;
      box-shadow: none;
    }
  }

  @media (max-width: 700px) {
    .manual-print-sheet {
      padding: 10px;
    }

    .manual-print-sheet > article {
      padding: 22px;
    }

    .manual-print-sheet section > div {
      grid-template-columns: 1fr;
    }
  }
`;
