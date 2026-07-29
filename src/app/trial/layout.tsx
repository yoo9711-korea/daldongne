/* PUBLIC_DESIGN_SEO_LAYOUT */
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "완성 예시와 체험 | 달동네 스토리",
  description: "사진과 이야기가 한 권의 스토리북으로 완성되는 예시와 서비스 체험 내용을 확인해 보세요.",
};

export default function TrialLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}
