import "server-only";

import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

export type ReadinessIssue = {
  code: string;
  severity: "BLOCKER" | "WARNING";
  message: string;
};

export type ReadinessSpec = {
  finalPdfUrl: string | null;
  coverPdfUrl: string | null;
  interiorPdfUrl: string | null;
  trimSize: string | null;
  trimWidthMm: number | null;
  trimHeightMm: number | null;
  bleedMm: number | null;
  pageCount: number | null;
  coverPaper: string | null;
  innerPaper: string | null;
  coverFinish: string | null;
  bindingType: string | null;
  printColor: string | null;
  quantity: number | null;
  orderMethod: string | null;
  samplePrintRequired: boolean;
  samplePrintStatus: string;
  sampleNote: string | null;
  pdfOpenedConfirmed: boolean;
  fontsEmbeddedConfirmed: boolean;
  imageQualityConfirmed: boolean;
  bleedConfirmed: boolean;
  safeAreaConfirmed: boolean;
  pageOrderConfirmed: boolean;
  colorConfirmed: boolean;
  coverSpineConfirmed: boolean;
  note: string | null;
};

export type HandoffSpec = Pick<
  ReadinessSpec,
  | "finalPdfUrl"
  | "coverPdfUrl"
  | "interiorPdfUrl"
  | "trimSize"
  | "pageCount"
  | "coverPaper"
  | "innerPaper"
  | "bindingType"
  | "printColor"
> & {
  quantity: number;
};

export function evaluateReadiness(
  order: {
    status: string;
    proofApprovedAt: Date | null;
    recipientName: string | null;
    recipientPhone: string | null;
    postalCode: string | null;
    shippingAddress1: string | null;
  },
  spec: ReadinessSpec,
  hasSelectedQuote: boolean,
) {
  const issues: ReadinessIssue[] = [];
  const add = (
    severity: "BLOCKER" | "WARNING",
    code: string,
    message: string,
  ) => issues.push({ severity, code, message });

  if (order.status !== "PAID") {
    add("BLOCKER", "PAYMENT", "결제가 완료되지 않았습니다.");
  }
  if (!order.proofApprovedAt) {
    add("BLOCKER", "PROOF", "고객 교정 승인이 필요합니다.");
  }
  if (!order.recipientName || !order.recipientPhone || !order.postalCode || !order.shippingAddress1) {
    add("BLOCKER", "ADDRESS", "수령인·연락처·우편번호·기본 주소가 필요합니다.");
  }
  if (!spec.finalPdfUrl) add("BLOCKER", "FINAL_PDF", "최종 인쇄 PDF가 없습니다.");
  if (!spec.trimSize || !spec.trimWidthMm || !spec.trimHeightMm) {
    add("BLOCKER", "TRIM", "완성 책 크기와 가로·세로 mm를 입력하세요.");
  }
  if (spec.bleedMm == null || spec.bleedMm < 0) {
    add("BLOCKER", "BLEED", "재단 여백 값을 확인하세요.");
  }
  if (!spec.pageCount || spec.pageCount < 1) {
    add("BLOCKER", "PAGES", "최종 페이지 수를 입력하세요.");
  } else {
    if (spec.pageCount % 2 !== 0) {
      add("BLOCKER", "ODD_PAGES", "페이지 수가 홀수입니다. 빈 페이지를 포함해 짝수로 확정하세요.");
    }
    if (spec.pageCount % 4 !== 0) {
      add("WARNING", "FOUR_PAGES", "페이지 수가 4의 배수가 아닙니다. 인쇄소 제본 기준을 확인하세요.");
    }
  }
  if (!spec.coverPaper) add("BLOCKER", "COVER_PAPER", "표지 용지를 확정하세요.");
  if (!spec.innerPaper) add("BLOCKER", "INNER_PAPER", "내지 용지를 확정하세요.");
  if (!spec.bindingType) add("BLOCKER", "BINDING", "제본 방식을 확정하세요.");
  if (!spec.printColor) add("BLOCKER", "COLOR", "인쇄 색상을 확정하세요.");
  if (!spec.quantity || spec.quantity < 1) add("BLOCKER", "QUANTITY", "인쇄 수량을 확인하세요.");

  const confirmations: Array<[boolean, string, string]> = [
    [spec.pdfOpenedConfirmed, "PDF_OPEN", "최종 PDF 열림을 확인하세요."],
    [spec.fontsEmbeddedConfirmed, "FONTS", "글꼴 포함·윤곽선 처리를 확인하세요."],
    [spec.imageQualityConfirmed, "IMAGE", "사진과 이미지의 인쇄 화질을 확인하세요."],
    [spec.bleedConfirmed, "BLEED_CHECK", "재단 여백과 배경 확장을 확인하세요."],
    [spec.safeAreaConfirmed, "SAFE_AREA", "글자·사진 안전영역을 확인하세요."],
    [spec.pageOrderConfirmed, "PAGE_ORDER", "페이지 순서와 빈 페이지를 확인하세요."],
    [spec.colorConfirmed, "COLOR_CHECK", "표지·내지 색상 방식을 확인하세요."],
    [spec.coverSpineConfirmed, "SPINE", "표지 앞·뒤·책등 구조를 확인하세요."],
  ];

  for (const [ok, code, message] of confirmations) {
    if (!ok) add("BLOCKER", code, message);
  }

  if (spec.samplePrintRequired && spec.samplePrintStatus !== "APPROVED") {
    add("BLOCKER", "SAMPLE", "샘플 인쇄 필수 주문은 샘플 승인 후 본 인쇄가 가능합니다.");
  }
  if (!spec.samplePrintRequired) {
    add("WARNING", "NO_SAMPLE", "신규 인쇄소·신규 사양이면 샘플 인쇄를 권장합니다.");
  }
  if (!hasSelectedQuote) {
    add("WARNING", "NO_QUOTE", "선택된 인쇄 견적이 없습니다.");
  }
  if (!spec.coverFinish) {
    add("WARNING", "FINISH", "표지 후가공이 미정입니다.");
  }

  const blockers = issues.filter((x) => x.severity === "BLOCKER");
  const warnings = issues.filter((x) => x.severity === "WARNING");

  return {
    issues,
    blockerCount: blockers.length,
    warningCount: warnings.length,
    ready: blockers.length === 0,
  };
}

export function specHash(spec: ReadinessSpec) {
  return createHash("sha256")
    .update(JSON.stringify(snapshot(spec)), "utf8")
    .digest("hex");
}

export function snapshot(spec: ReadinessSpec) {
  return {
    finalPdfUrl: clean(spec.finalPdfUrl),
    coverPdfUrl: clean(spec.coverPdfUrl),
    interiorPdfUrl: clean(spec.interiorPdfUrl),
    trimSize: clean(spec.trimSize),
    trimWidthMm: spec.trimWidthMm,
    trimHeightMm: spec.trimHeightMm,
    bleedMm: spec.bleedMm,
    pageCount: spec.pageCount,
    coverPaper: clean(spec.coverPaper),
    innerPaper: clean(spec.innerPaper),
    coverFinish: clean(spec.coverFinish),
    bindingType: clean(spec.bindingType),
    printColor: clean(spec.printColor),
    quantity: spec.quantity,
    samplePrintRequired: spec.samplePrintRequired,
    samplePrintStatus: spec.samplePrintStatus,
    pdfOpenedConfirmed: spec.pdfOpenedConfirmed,
    fontsEmbeddedConfirmed: spec.fontsEmbeddedConfirmed,
    imageQualityConfirmed: spec.imageQualityConfirmed,
    bleedConfirmed: spec.bleedConfirmed,
    safeAreaConfirmed: spec.safeAreaConfirmed,
    pageOrderConfirmed: spec.pageOrderConfirmed,
    colorConfirmed: spec.colorConfirmed,
    coverSpineConfirmed: spec.coverSpineConfirmed,
  };
}

export async function checkHandoffReadiness(
  orderId: string,
  handoff: HandoffSpec,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const row = await prisma.bookOrderPrintReadiness.findUnique({
    where: { orderId },
  });

  if (!row) {
    return { ok: false, message: "인쇄 준비 점검을 먼저 등록하세요." };
  }
  if (row.status !== "FROZEN" || !row.specHash || row.blockerCount > 0) {
    return { ok: false, message: "인쇄 준비 점검을 완료하고 사양을 동결하세요." };
  }

  const current: ReadinessSpec = {
    finalPdfUrl: handoff.finalPdfUrl,
    coverPdfUrl: handoff.coverPdfUrl,
    interiorPdfUrl: handoff.interiorPdfUrl,
    trimSize: handoff.trimSize,
    trimWidthMm: row.trimWidthMm,
    trimHeightMm: row.trimHeightMm,
    bleedMm: row.bleedMm,
    pageCount: handoff.pageCount,
    coverPaper: handoff.coverPaper,
    innerPaper: handoff.innerPaper,
    coverFinish: row.coverFinish,
    bindingType: handoff.bindingType,
    printColor: handoff.printColor,
    quantity: handoff.quantity,
    orderMethod: row.orderMethod,
    samplePrintRequired: row.samplePrintRequired,
    samplePrintStatus: row.samplePrintStatus,
    sampleNote: row.sampleNote,
    pdfOpenedConfirmed: row.pdfOpenedConfirmed,
    fontsEmbeddedConfirmed: row.fontsEmbeddedConfirmed,
    imageQualityConfirmed: row.imageQualityConfirmed,
    bleedConfirmed: row.bleedConfirmed,
    safeAreaConfirmed: row.safeAreaConfirmed,
    pageOrderConfirmed: row.pageOrderConfirmed,
    colorConfirmed: row.colorConfirmed,
    coverSpineConfirmed: row.coverSpineConfirmed,
    note: row.note,
  };

  if (specHash(current) !== row.specHash) {
    return {
      ok: false,
      message: "사양 동결 후 PDF·페이지·용지·제본·색상 또는 수량이 변경됐습니다. 동결을 해제하고 다시 점검하세요.",
    };
  }

  return { ok: true };
}

function clean(value: string | null) {
  const result = value?.trim();
  return result || null;
}
