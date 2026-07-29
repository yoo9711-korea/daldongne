"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(
      error,
    );
  }, [error]);

  return (
    <main className="public-state-page">
      <section className="public-state-card">
        <strong>
          TEMPORARY ERROR
        </strong>

        <h1>
          화면을 불러오지
          못했습니다
        </h1>

        <p>
          잠시 후 다시 시도하거나
          홈페이지로 이동해 주세요.
          작성 중인 자료는 다시 확인할 수
          있도록 안전하게 처리하겠습니다.
        </p>

        <div className="public-state-actions">
          <button
            type="button"
            onClick={reset}
          >
            다시 시도
          </button>

          <Link href="/">
            홈페이지로 이동
          </Link>
        </div>
      </section>
    </main>
  );
}
