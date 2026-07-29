/* PUBLIC_DESIGN_SEO_LAYOUT */
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "비밀번호 재설정 | 달동네 스토리",
  description: "달동네 스토리 계정의 새 비밀번호를 안전하게 설정합니다.",
};

export default function ResetPasswordLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}
