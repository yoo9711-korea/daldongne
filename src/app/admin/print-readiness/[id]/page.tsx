import { auth } from "@/auth";
import PrintPreparationPanel from "@/components/admin/PrintPreparationPanel";
import {
  evaluateReadiness,
  type ReadinessSpec,
} from "@/lib/print-readiness";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata = {
  title: "인쇄 준비 상세 | 달동네 스토리",
  robots: { index: false, follow: false },
};

export default async function PrintReadinessDetailPage({ params }: Props) {
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

  const { id } = await params;

  const order = await prisma.bookOrder.findUnique({
    where: { id },
    include: {
      book: {
        select: {
          title: true,
          pageCount: true,
        },
      },
      manualPrintJob: true,
      printReadiness: true,
      printQuotes: {
        orderBy: [
          { status: "asc" },
          { createdAt: "desc" },
        ],
      },
      aiProductionRuns: {
        where: { finalPdfUrl: { not: null } },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { finalPdfUrl: true },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const r = order.printReadiness;
  const j = order.manualPrintJob;
  const parsed = parseSize(r?.trimSize || j?.trimSize || order.specification || "");

  const spec: ReadinessSpec = {
    finalPdfUrl: r?.finalPdfUrl || j?.finalPdfUrl || order.aiProductionRuns[0]?.finalPdfUrl || order.proofFileUrl || null,
    coverPdfUrl: r?.coverPdfUrl || j?.coverPdfUrl || null,
    interiorPdfUrl: r?.interiorPdfUrl || j?.interiorPdfUrl || null,
    trimSize: r?.trimSize || j?.trimSize || order.specification || null,
    trimWidthMm: r?.trimWidthMm || parsed.width,
    trimHeightMm: r?.trimHeightMm || parsed.height,
    bleedMm: r?.bleedMm ?? 3,
    pageCount: r?.pageCount || j?.pageCount || order.book.pageCount || null,
    coverPaper: r?.coverPaper || j?.coverPaper || null,
    innerPaper: r?.innerPaper || j?.innerPaper || null,
    coverFinish: r?.coverFinish || null,
    bindingType: r?.bindingType || j?.bindingType || null,
    printColor: r?.printColor || j?.printColor || null,
    quantity: r?.quantity || j?.quantity || order.quantity,
    orderMethod: r?.orderMethod || j?.orderMethod || null,
    samplePrintRequired: r?.samplePrintRequired || false,
    samplePrintStatus: r?.samplePrintStatus || "NOT_REQUIRED",
    sampleNote: r?.sampleNote || null,
    pdfOpenedConfirmed: r?.pdfOpenedConfirmed || false,
    fontsEmbeddedConfirmed: r?.fontsEmbeddedConfirmed || false,
    imageQualityConfirmed: r?.imageQualityConfirmed || false,
    bleedConfirmed: r?.bleedConfirmed || false,
    safeAreaConfirmed: r?.safeAreaConfirmed || false,
    pageOrderConfirmed: r?.pageOrderConfirmed || false,
    colorConfirmed: r?.colorConfirmed || false,
    coverSpineConfirmed: r?.coverSpineConfirmed || false,
    note: r?.note || j?.note || null,
  };

  const selectedQuote = order.printQuotes.find((x) => x.status === "SELECTED");

  const evaluation = evaluateReadiness(
    {
      status: String(order.status),
      proofApprovedAt: order.proofApprovedAt,
      recipientName: order.recipientName,
      recipientPhone: order.recipientPhone,
      postalCode: order.postalCode,
      shippingAddress1: order.shippingAddress1,
    },
    spec,
    Boolean(selectedQuote),
  );

  const canEdit = !j || j.status === "PREPARING";

  return (
    <main className="prd-page">
      <style>{styles}</style>

      <div className="prd-shell">
        <header className="prd-hero">
          <div>
            <p>PRINT PREPARATION</p>
            <h1>{order.book.title}</h1>
            <span>주문번호 {order.orderId} · {order.productName}</span>
          </div>

          <div>
            <Link href="/admin/print-readiness">준비 목록</Link>
            <Link href={`/admin/manual-print/${order.id}`}>수동 인쇄</Link>
            <Link href={`/admin/orders/${order.id}`}>주문 상세</Link>
          </div>
        </header>

        <section className="prd-summary">
          <Info label="결제" value={String(order.status)} />
          <Info label="제작 단계" value={String(order.productionStage)} />
          <Info label="교정 승인" value={formatDate(order.proofApprovedAt)} />
          <Info label="점검 상태" value={r?.status || "DRAFT"} />
          <Info label="사양 버전" value={`v${r?.version || 1}`} />
          <Info
            label="선택 견적"
            value={
              selectedQuote
                ? `${selectedQuote.printerName} · ${selectedQuote.totalCost.toLocaleString()}원`
                : "미선택"
            }
          />
        </section>

        {!canEdit ? (
          <section className="prd-lock">
            인쇄소 전달이 시작되어 사양과 견적을 변경할 수 없습니다.
          </section>
        ) : null}

        <PrintPreparationPanel
          orderId={order.id}
          canEdit={canEdit}
          status={r?.status || "DRAFT"}
          version={r?.version || 1}
          frozenAt={r?.frozenAt?.toISOString() || null}
          initial={spec}
          issues={evaluation.issues}
          defaultQuantity={spec.quantity || order.quantity}
          quotes={order.printQuotes.map((q) => ({
            id: q.id,
            printerName: q.printerName,
            contactName: q.contactName,
            contactPhone: q.contactPhone,
            contactEmail: q.contactEmail,
            quoteNumber: q.quoteNumber,
            status: q.status,
            quantity: q.quantity,
            minimumQuantity: q.minimumQuantity,
            unitCost: q.unitCost,
            setupCost: q.setupCost,
            shippingCost: q.shippingCost,
            totalCost: q.totalCost,
            vatIncluded: q.vatIncluded,
            leadTimeBusinessDays: q.leadTimeBusinessDays,
            validUntil: q.validUntil?.toISOString() || null,
            note: q.note,
          }))}
        />
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function formatDate(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat("ko-KR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(value)
    : "미등록";
}

function parseSize(value: string) {
  const match = value.match(/(\d{2,4})\D+(\d{2,4})/);
  return {
    width: match ? Number(match[1]) : null,
    height: match ? Number(match[2]) : null,
  };
}

const styles = `
  .prd-page{min-height:100vh;padding:32px;background:#f7f3f0;color:#4f3931}
  .prd-shell{width:min(1240px,100%);margin:auto}
  .prd-hero,.prd-summary{border:1px solid #eadbd4;background:#fff;border-radius:20px}
  .prd-hero{padding:27px;display:flex;justify-content:space-between;align-items:flex-end;gap:18px}
  .prd-hero p{margin:0;color:#c46751;font-size:14.4px;font-weight:900;letter-spacing:.14em}.prd-hero h1{margin:8px 0}.prd-hero span{color:#806b62}
  .prd-hero>div:last-child{display:flex;gap:8px;flex-wrap:wrap}.prd-hero a{padding:10px 13px;border:1px solid #dec8bd;border-radius:10px;color:#704e41;background:#fff;text-decoration:none;font-weight:800;font-size:13px}.prd-hero a:nth-child(2){background:#b95f49;color:#fff;border-color:#b95f49}
  .prd-summary{margin-top:15px;padding:17px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.prd-summary article{padding:13px;border:1px solid #eee0da;border-radius:11px;background:#fffdfa}.prd-summary span{display:block;color:#927c72;font-size:11px;font-weight:800}.prd-summary strong{display:block;margin-top:5px;font-size:13px;overflow-wrap:anywhere}
  .prd-lock{margin-top:14px;padding:14px 17px;border:1px solid #edc5bb;border-radius:13px;background:#fff0ec;color:#8d4b3d;font-weight:800}
  @media(max-width:700px){.prd-page{padding:17px}.prd-hero{flex-direction:column;align-items:stretch}.prd-summary{grid-template-columns:1fr}}
`;
