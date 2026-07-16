import Link from 'next/link';

const VALUES = [
  {
    title: '기술보다 가족의 기억을 먼저 봅니다',
    text: '달동네 출판사는 AI 기능을 앞세우기보다, 사진 속에 담긴 가족의 시간과 부모님의 삶을 이해하기 쉬운 글로 정리하는 일을 중요하게 생각합니다.',
  },
  {
    title: '사진을 단순 보관하지 않습니다',
    text: '사진은 순간을 남기지만, 그 순간의 이유와 마음은 글로 남겨야 오래 전해집니다. 달동네는 사진 뒤의 이야기를 찾아 책의 흐름으로 엮습니다.',
  },
  {
    title: '부모님의 삶을 가족의 책으로 만듭니다',
    text: '어머니의 젊은 시절, 아버지의 일터, 가족을 위해 버텨온 시간들을 한 권의 인생책으로 정리해 가족이 함께 읽고 간직할 수 있게 만듭니다.',
  },
];

export default function AboutPage() {
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
            달동네 소개
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
            사진과 글을 모아,
            <br />
            부모님의 삶을 한 권의 책으로 만들어드립니다.
          </h1>

          <p
            style={{
              marginTop: 28,
              maxWidth: 850,
              fontSize: 22,
              lineHeight: 1.75,
              color: 'rgba(255, 248, 236, 0.9)',
            }}
          >
            달동네 출판사는 가족사진, 짧은 글, 인터뷰를 바탕으로
            부모님의 삶을 정리하고 가족이 오래 간직할 수 있는 인생책으로
            만들어주는 서비스입니다.
          </p>

          <div style={{ marginTop: 36, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <Link
              href="/pricing"
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
              인생책 만들기 보기
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

      <section style={{ padding: '88px 24px' }}>
        <div
          style={{
            maxWidth: 1120,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 0.95fr) minmax(320px, 1.05fr)',
            gap: 42,
            alignItems: 'center',
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
              우리가 하는 일
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
              사진은 남아 있지만,
              <br />
              이야기는 사라지고 있습니다.
            </h2>

            <p
              style={{
                marginTop: 22,
                fontSize: 20,
                lineHeight: 1.8,
                color: '#6b5845',
              }}
            >
              가족 앨범에는 많은 사진이 남아 있습니다. 하지만 그 사진이 언제,
              어디서, 어떤 마음으로 찍힌 것인지 우리는 생각보다 잘 모릅니다.
              달동네는 흩어진 사진과 기억을 모아 부모님의 삶을 다시 읽을 수 있는
              이야기로 정리합니다.
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
            <p
              style={{
                margin: 0,
                color: '#9b6d2f',
                fontWeight: 900,
                letterSpacing: '0.08em',
              }}
            >
              핵심 문장
            </p>

            <h3
              style={{
                margin: '18px 0 0',
                fontFamily: 'Noto Serif KR, serif',
                fontSize: 36,
                lineHeight: 1.36,
                letterSpacing: '-0.04em',
              }}
            >
              달동네 출판사는
              <br />
              부모님의 삶을 가족이 간직할 수 있는 책으로 만듭니다.
            </h3>

            <p
              style={{
                marginTop: 22,
                fontSize: 19,
                lineHeight: 1.8,
                color: '#6b5845',
              }}
            >
              AI는 앞에서 자랑하는 기술이 아니라, 뒤에서 가족의 기억을 정리해주는
              조용한 도구입니다. 고객이 받는 것은 기술 설명이 아니라 한 권의
              따뜻한 인생책입니다.
            </p>
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
            달동네의 기준
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
            우리는 플랫폼보다,
            <br />
            가족이 읽을 수 있는 결과물을 중요하게 생각합니다.
          </h2>

          <div
            style={{
              marginTop: 42,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 18,
            }}
          >
            {VALUES.map((value) => (
              <article
                key={value.title}
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
                  {value.title}
                </h3>

                <p
                  style={{
                    margin: '14px 0 0',
                    fontSize: 18,
                    lineHeight: 1.75,
                    color: '#6b5845',
                  }}
                >
                  {value.text}
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
            부모님의 이야기는
            <br />
            지금 남겨야 더 오래 전해집니다.
          </h2>

          <p
            style={{
              marginTop: 22,
              fontSize: 20,
              lineHeight: 1.8,
              color: 'rgba(255, 248, 236, 0.82)',
            }}
          >
            완벽하게 정리된 글이 없어도 괜찮습니다.
            사진과 짧은 기억에서 시작해 가족이 오래 간직할 인생책으로 만들어드립니다.
          </p>

          <div style={{ marginTop: 34 }}>
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
              상담 신청하기
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}