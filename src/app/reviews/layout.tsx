/* PUBLIC_DESIGN_SEO_LAYOUT */
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "고객 이야기 | 달동네 스토리",
  description: "달동네 스토리로 사진과 이야기를 책으로 남긴 고객의 경험과 후기를 확인해 보세요.",
};

export default function ReviewsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}
