/* PUBLIC_DESIGN_SEO_LAYOUT */
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "개인정보 처리방침 | 달동네 스토리",
  description: "달동네 스토리의 개인정보 처리와 사진·이야기 자료 보호 기준을 안내합니다.",
};

export default function PrivacyLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}
