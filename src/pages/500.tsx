export default function Custom500() {
  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '80px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f7efe0',
        color: '#2d1a0b',
        fontFamily:
          '"Noto Sans KR", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: 520,
          padding: 36,
          borderRadius: 28,
          background: '#fffaf0',
          border: '1px solid #e3d3b6',
          boxShadow: '0 20px 60px rgba(45, 26, 11, 0.12)',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 34,
            fontWeight: 900,
            letterSpacing: '-0.06em',
          }}
        >
          일시적인 오류가 발생했습니다
        </h1>

        <p
          style={{
            marginTop: 16,
            marginBottom: 28,
            fontSize: 16,
            lineHeight: 1.7,
            color: '#6d4b2b',
          }}
        >
          서버에서 페이지를 불러오는 중 문제가 발생했습니다.
          <br />
          잠시 후 다시 시도해 주세요.
        </p>

        <a
          href="/"
          style={{
            minHeight: 46,
            padding: '0 22px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 999,
            background: '#2d1a0b',
            color: '#fffaf0',
            fontSize: 15,
            fontWeight: 900,
            textDecoration: 'none',
          }}
        >
          홈으로 돌아가기
        </a>
      </section>
    </main>
  );
}