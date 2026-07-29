"use client";

import Link from "next/link";

export default function ManualPrintSheetActions({
  orderId,
}: {
  orderId: string;
}) {
  return (
    <div className="manual-print-sheet-actions">
      <Link href={`/admin/manual-print/${orderId}`}>
        인쇄 운영으로 돌아가기
      </Link>
      <button
        type="button"
        onClick={() => window.print()}
      >
        인쇄·PDF 저장
      </button>
    </div>
  );
}
