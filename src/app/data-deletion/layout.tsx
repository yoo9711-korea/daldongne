/* PUBLIC_DESIGN_SEO_LAYOUT */
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "개인정보와 자료 삭제 안내 | 달동네 스토리",
  description: "달동네 스토리에 등록한 계정, 사진, 이야기와 개인정보의 삭제 요청 방법을 안내합니다.",
};

export default function DataDeletionLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}
