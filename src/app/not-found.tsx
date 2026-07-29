import Link from "next/link";

export default function NotFound() {
  return (
    <main className="public-state-page">
      <section className="public-state-card">
        <strong>
          PAGE NOT FOUND
        </strong>

        <h1>
          찾으시는 페이지가
          보이지 않아요
        </h1>

        <p>
          주소가 바뀌었거나 페이지가
          이동되었을 수 있습니다.
          홈페이지에서 다시 시작해 주세요.
        </p>

        <div className="public-state-actions">
          <Link href="/">
            홈페이지로 이동
          </Link>

          <Link href="/guide#contact">
            문의하기
          </Link>
        </div>
      </section>
    </main>
  );
}
