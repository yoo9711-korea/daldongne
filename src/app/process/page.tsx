import Link from 'next/link';
import { auth } from '@/auth';

const STEPS = [
  {
    title: '사진을 모읍니다',
    text: '아름다운 추억의 가족사진, 일터 사진, 오래된 앨범 사진을 준비합니다. 사진이 많지 않아도 시작할 수 있습니다.',
  },
  {
    title: '기억나는 이야기를 적습니다',
    text: '사진 속 장소, 사람, 그때의 상황, 부모님이 자주 하시던 말처럼 짧은 기억을 남깁니다.',
  },
  {
    title: '달동네가 질문을 도와드립니다',
    text: '무엇을 물어봐야 할지 막막할 때, 달동네가 사람의 삶을 자연스럽게 꺼낼 수 있는 질문을 도와드립니다.',
  },
  {
    title: '삶의 흐름을 정리합니다',
    text: '어린 시절, 청년기, 결혼, 일, 가족, 노년의 시간까지 한 사람의 삶을 책의 흐름에 맞게 정리합니다.',
  },
  {
    title: '원고를 만듭니다',
    text: '사진과 이야기를 바탕으로 제목, 목차, 본문, 장면별 글을 구성해 인생책 원고로 만듭니다.',
  },
  {
    title: '책으로 완성합니다',
    text: '완성된 원고는 PDF 또는 실제 책 제작으로 이어질 수 있으며, 가족이 오래 간직할 기록물이 됩니다.',
  },
];

export default async function ProcessPage() {
    const session = await auth();

  const consultationHref = session?.user
    ? '/dashboard/book'
    : '/login?callbackUrl=/dashboard/book';
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
            제작 과정
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
            완벽하게 준비하지 않아도
            <br />
            괜찮습니다.
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
            가족의 사진 10장과 기억나는 이야기 몇 줄만 있어도 시작할 수 있습니다.
            달동네가 질문을 더하고, 삶의 흐름을 정리해 한 권의 인생책으로 만들어드립니다.
          </p>

          <div style={{ marginTop: 36, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <Link
              href={consultationHref}
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

            <Link
              href="/trial"
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
              샘플 책 보기
            </Link>
          </div>
        </div>
      </section>

      <section style={{ padding: '88px 24px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <p
            style={{
              margin: '0 0 14px',
              color: '#9b6d2f',
              fontWeight: 800,
              letterSpacing: '0.08em',
            }}
          >
            6단계 흐름
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
            사진에서 시작해,
            <br />
            가족이 간직할 책으로 완성됩니다.
          </h2>

          <div
            style={{
              marginTop: 42,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 18,
            }}
          >
            {STEPS.map((step, index) => (
              <article
                key={step.title}
                style={{
                  padding: 28,
                  borderRadius: 28,
                  background: '#ffffff',
                  border: '1px solid rgba(91, 66, 43, 0.12)',
                  boxShadow: '0 14px 34px rgba(91, 66, 43, 0.08)',
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#33271d',
                    color: '#fff8ec',
                    fontWeight: 900,
                    marginBottom: 18,
                  }}
                >
                  {index + 1}
                </div>

                <h3
                  style={{
                    margin: 0,
                    fontSize: 24,
                    lineHeight: 1.35,
                    letterSpacing: '-0.03em',
                  }}
                >
                  {step.title}
                </h3>

                <p
                  style={{
                    margin: '14px 0 0',
                    fontSize: 18,
                    lineHeight: 1.75,
                    color: '#6b5845',
                  }}
                >
                  {step.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '88px 24px', background: '#f4ead8' }}>
        <div
          style={{
            maxWidth: 1120,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(320px, 0.9fr)',
            gap: 38,
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
              준비물
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
              시작할 수 있습니다.
            </h2>

            <p
              style={{
                marginTop: 22,
                fontSize: 20,
                lineHeight: 1.8,
                color: '#6b5845',
              }}
            >
              오래된 사진 몇 장, 가족간의 묻고 싶은 질문, 기억나는 사건 하나면 충분합니다.
              달동네는 부족한 부분을 질문으로 채우고, 흩어진 기억을 책의 흐름으로 정리합니다.
            </p>
          </div>

          <div
            style={{
              padding: 32,
              borderRadius: 30,
              background: '#fffaf1',
              boxShadow: '0 18px 42px rgba(91, 66, 43, 0.12)',
            }}
          >
            {['추억의 사진 10장 이상', '기억나는 이야기 몇 줄', '가족이 묻고 싶은 질문', '기념일 또는 선물 목적'].map(
              (item) => (
                <div
                  key={item}
                  style={{
                    padding: '18px 0',
                    borderBottom: '1px solid rgba(91, 66, 43, 0.12)',
                    fontSize: 20,
                    fontWeight: 800,
                  }}
                >
                  {item}
                </div>
              ),
            )}
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
            사진을 올리고,
            <br />
            우리의 이야기를 남겨보세요.
          </h2>

          <p
            style={{
              marginTop: 22,
              fontSize: 20,
              lineHeight: 1.8,
              color: 'rgba(255, 248, 236, 0.82)',
            }}
          >
            지금 완벽한 원고가 없어도 괜찮습니다.
            달동네가 질문부터 책의 흐름까지 함께 도와드립니다.
          </p>

          <div style={{ marginTop: 34 }}>
            <Link
              href={consultationHref}
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
              인생책 상담 신청하기
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}