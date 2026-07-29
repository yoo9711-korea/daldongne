export default function Loading() {
  return (
    <main
      className="public-state-page"
      aria-live="polite"
      aria-busy="true"
    >
      <section className="public-state-card">
        <strong>
          DALDONGNE STORY
        </strong>

        <h1>
          이야기를 준비하고
          있습니다
        </h1>

        <p>
          사진과 이야기가 담긴 화면을
          불러오는 중입니다.
        </p>

        <div
          className="public-loading-dots"
          aria-hidden="true"
        >
          <span />
          <span />
          <span />
        </div>
      </section>
    </main>
  );
}
