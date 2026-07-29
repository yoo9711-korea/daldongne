/* PUBLIC_DESIGN_SEO_LAYOUT */
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "책 제작 과정 | 달동네 스토리",
  description: "사진과 이야기 수집부터 AI 글 정리, 원고 생성, 제작 상담과 실제 책 제작까지의 과정을 안내합니다.",
};

export default function ProcessLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}
