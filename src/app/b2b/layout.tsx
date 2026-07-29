/* PUBLIC_DESIGN_SEO_LAYOUT */
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "단체·기업 스토리북 제작 | 달동네 스토리",
  description: "가족, 단체, 기업의 사진과 이야기를 한 권의 기록책으로 제작하는 맞춤 상담을 안내합니다.",
};

export default function B2BLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <h1 className="public-route-sr-only">단체·기업 스토리북 제작</h1>
      {children}
    </>
  );
}
