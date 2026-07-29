/* PUBLIC_DESIGN_SEO_LAYOUT */
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "회원가입 | 달동네 스토리",
  description: "달동네 스토리에 가입하고 소중한 사진과 이야기를 안전하게 기록해 보세요.",
};

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}
