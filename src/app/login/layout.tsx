/* PUBLIC_DESIGN_SEO_LAYOUT */
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "로그인 | 달동네 스토리",
  description: "달동네 스토리에 로그인하고 사진과 이야기를 모아 책 원고를 만들어 보세요.",
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}
