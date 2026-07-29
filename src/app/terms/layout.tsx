/* PUBLIC_DESIGN_SEO_LAYOUT */
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "이용약관 | 달동네 스토리",
  description: "달동네 스토리 서비스 이용과 맞춤 책 제작에 필요한 기본 약관을 안내합니다.",
};

export default function TermsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}
