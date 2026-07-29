/* PUBLIC_DESIGN_SEO_LAYOUT */
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "상품과 가격 | 달동네 스토리",
  description: "사진과 이야기를 한 권의 책으로 제작하는 달동네 스토리의 상품 구성과 가격을 안내합니다.",
};

export default function PricingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}
