/* PUBLIC_DESIGN_SEO_LAYOUT */
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "서비스 개발 방향 | 달동네 스토리",
  description: "사진과 이야기를 더 가치 있는 기록으로 만드는 달동네 스토리의 개발 방향을 안내합니다.",
};

export default function RoadmapLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <h1 className="public-route-sr-only">달동네 스토리 서비스 개발 방향</h1>
      {children}
    </>
  );
}
