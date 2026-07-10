import Link from 'next/link';

const CHECKLIST = [
  '부모님 사진 10장 이상',
  '기억나는 이야기 몇 줄',
  '제작 목적: 생신, 칠순, 팔순, 퇴직, 가족 보관 등',
  '책으로 만들고 싶은 대상: 어머니, 아버지, 부모님, 가족 전체',
];

const FLOW = [
  {
    title: '1. 사진을 준비합니다',
    text: '완벽한 사진이 아니어도 괜찮습니다. 오래된 사진, 휴대폰 사진, 가족 앨범 사진 모두 시작점이 됩니다.',
  },
  {
    title: '2. 간단한 이야기를 남깁니다',
    text: '사진 속 장소, 사람, 그때의 기억, 부모님께 묻고 싶은 질문을 짧게 적어주세요.',
  },
  {
    title: '3. 달동네가 방향을 잡아드립니다',
    text: '준비된 사진과 이야기를 바탕으로 어떤 책으로 만들 수 있을지 제작 방향을 정리합니다.',
  },
  {
    title: '4. 인생책 제작을 시작합니다',
    text: '사진과 인터뷰, 삶의 흐름을 정리해 가족이 오래 간직할 수 있는 인생책 원고로 만듭니다.',
  },
];

export default function ApplyPage() {
  return (
    <main style={{ background: '#fffaf1', color: '#33271d' }}>
      <section
        style={{
          padding: '96px 24px 72px',
          background:
            'linear-gradient(135deg, #33271d 0%, #5b422c 50%, #8a6238 100%)',
          color: '#fff8ec',
        }}
      >
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <p
            style={{
              margin: '0 0 16px',
              color: '#f0c36a',
              fontWeight: 800,
              letterSpacing: '0.08em',
            }}
          >
            신청하기
          </p>

          <h1
            style={{
              margin: 0,
              fontFamily: 'Noto Serif KR, serif',
              fontSize: 'clamp(40px, 5.6vw, 68px)',
              lineHeight: 1.16,
              letterSpacing: '-0.05em',
            }}
          >
            부모님의 사진 10장만 있어도
            <br />
            인생책을 시작할 수 있습니다.
          </h1>

          <p
            style={{
              marginTop: 28,
              maxWidth: 820,
              fontSize: 22,
              lineHeight: 1.75,
              color: 'rgba(255, 248, 236, 0.9)',
            }}
          >
            완성된 원고가 없어도 괜찮습니다. 사진과 짧은 기억을 남겨주시면,
            달동네가 질문을 더하고 삶의 흐름을 정리해 책으로 만드는 과정을 도와드립니다.
          </p>

          <div style={{ marginTop: 36, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <Link
              href="/dashboard/book"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '15px 24px',
                borderRadius: 999,
                background: '#f0c36a',
                color: '#2b2118',
                fontWeight: 900,
                textDecoration: 'none',
              }}
            >
              인생책 만들기 시작하기
            </Link>

            <Link
              href="/pricing"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '15px 24px',
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.42)',
                color: '#fff8ec',
                fontWeight: 900,
                textDecoration: 'none',
              }}
            >
              가격 안내 먼저 보기
            </Link>
          </div>
        </div>
      </section>

      <section style={{ padding: '88px 24px' }}>
        <div
          style={{
            maxWidth: 1120,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 0.95fr) minmax(320px, 1.05fr)',
            gap: 42,
            alignItems: 'start',
          }}
        >
          <div>
            <p
              style={{
                margin: '0 0 14px',
                color: '#9b6d2f',
                fontWeight: 800,
                letterSpacing: '0.08em',
              }}
            >
              시작 전에 준비하면 좋은 것
            </p>

            <h2
              style={{
                margin: 0,
                fontFamily: 'Noto Serif KR, serif',
                fontSize: 42,
                lineHeight: 1.32,
                letterSpacing: '-0.04em',
              }}
            >
              많이 준비하지 않아도
              <br />
              괜찮습니다.
            </h2>

            <p
              style={{
                marginTop: 22,
                fontSize: 20,
                lineHeight: 1.8,
                color: '#6b5845',
              }}
            >
              인생책은 완성된 글에서 시작하지 않습니다.
              오래된 사진 한 장, 부모님께 묻고 싶은 질문 하나,
              가족이 기억하는 작은 장면에서 시작됩니다.
            </p>
          </div>

          <div
            style={{
              padding: 34,
              borderRadius: 32,
              background: '#ffffff',
              border: '1px solid rgba(91, 66, 43, 0.12)',
              boxShadow: '0 18px 42px rgba(91, 66, 43, 0.1)',
            }}
          >
            {CHECKLIST.map((item) => (
              <div
                key={item}
                style={{
                  padding: '18px 0',
                  borderBottom: '1px solid rgba(91, 66, 43, 0.12)',
                  fontSize: 19,
                  lineHeight: 1.6,
                  fontWeight: 800,
                  color: '#4c3a2a',
                }}
              >
                ✓ {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '88px 24px', background: '#f4ead8' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <p
            style={{
              margin: '0 0 14px',
              color: '#9b6d2f',
              fontWeight: 800,
              letterSpacing: '0.08em',
            }}
          >
            신청 흐름
          </p>

          <h2
            style={{
              margin: 0,
              fontFamily: 'Noto Serif KR, serif',
              fontSize: 42,
              lineHeight: 1.32,
              letterSpacing: '-0.04em',
            }}
          >
            사진을 올리고,
            <br />
            이야기를 남기는 것부터 시작합니다.
          </h2>

          <div
            style={{
              marginTop: 42,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 18,
            }}
          >
            {FLOW.map((item) => (
              <article
                key={item.title}
                style={{
                  padding: 28,
                  borderRadius: 28,
                  background: '#fffaf1',
                  boxShadow: '0 14px 34px rgba(91, 66, 43, 0.08)',
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 24,
                    lineHeight: 1.35,
                    letterSpacing: '-0.03em',
                  }}
                >
                  {item.title}
                </h3>

                <p
                  style={{
                    margin: '14px 0 0',
                    fontSize: 18,
                    lineHeight: 1.75,
                    color: '#6b5845',
                  }}
                >
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        style={{
          padding: '88px 24px',
          background: '#33271d',
          color: '#fff8ec',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <h2
            style={{
              margin: 0,
              fontFamily: 'Noto Serif KR, serif',
              fontSize: 44,
              lineHeight: 1.35,
              letterSpacing: '-0.04em',
            }}
          >
            지금 바로 내 작업실에서
            <br />
            부모님 이야기를 시작해 보세요.
          </h2>

          <p
            style={{
              marginTop: 22,
              fontSize: 20,
              lineHeight: 1.8,
              color: 'rgba(255, 248, 236, 0.82)',
            }}
          >
            사진을 모으고, 이야기를 남기고, 삶의 흐름을 정리하면
            인생책 제작의 첫 단계가 시작됩니다.
          </p>

          <div style={{ marginTop: 34, display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
         <Link
            href="/dashboard/book"
            style={{
            display: 'inline-flex',
            alignItems: 'center',
             justifyContent: 'center',
            padding: '15px 24px',
            borderRadius: 999,
            background: '#f0c36a',
            color: '#2b2118',
            fontWeight: 900,
            textDecoration: 'none',
            }}
        >
          인생책 만들기 시작하기
        </Link>

            <Link
              href="/process"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '15px 24px',
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.42)',
                color: '#fff8ec',
                fontWeight: 900,
                textDecoration: 'none',
              }}
            >
              제작 과정 보기
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}