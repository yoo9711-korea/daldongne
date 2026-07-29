/* PUBLIC_DESIGN_SEO_LAYOUT */
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "달동네 스토리가 다른 점 | 달동네 스토리",
  description: "사진만 인쇄하는 포토북과 달리 사진 속 이야기를 정리해 삶의 기록을 책으로 만드는 과정을 소개합니다.",
};

export default function CompareLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <h1 className="public-route-sr-only">달동네 스토리가 다른 점</h1>
      {children}
    </>
  );
}
