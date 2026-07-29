/* PUBLIC_DESIGN_SEO_LAYOUT */
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "비밀번호 찾기 | 달동네 스토리",
  description: "달동네 스토리 계정의 비밀번호 재설정 방법을 안내합니다.",
};

export default function ForgotPasswordLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}
