import { auth } from '@/auth';
import Link from 'next/link';
import HomeGuidePopup from '@/components/home/HomeGuidePopup';

const bookTypes = [
  '부모님 인생책',
  '가족 이야기책',
  '아이 성장 기록책',
  '여행 기록책',
  '부부 이야기책',
  '반려동물 추억책',
];

const steps = [
  '사진을 한곳에 모읍니다',
  '사진 속 이야기를 남깁니다',
  'AI가 글을 읽기 좋게 다듬습니다',
  '목차와 책 원고를 만듭니다',
  '완성된 원고를 내 책장에서 확인합니다',
  '필요하면 제작 상담을 신청합니다',
];

const animationStyles = `
    @keyframes daldongneImageFloat {
    0% {
      opacity: 0;
      transform: translateY(24px) scale(0.96);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

   @keyframes daldongneTypeLine {
    from {
      width: 0;
    }
    to {
      width: 100%;
    }
  }

  @keyframes daldongneSoftMove {
    0% {
      transform: scale(1) translateY(0);
    }
    50% {
      transform: scale(1.04) translateY(-8px);
    }
    100% {
      transform: scale(1) translateY(0);
    }
  }
`;

export default async function HomePage() {
  const session = await auth();

  const isAdmin =
    (
      session?.user as
        | { role?: string }
        | undefined
    )?.role === 'ADMIN';

 const startHref = session?.user
  ? '/dashboard'
  : '/login?callbackUrl=/dashboard';

  return (
  <>
    <style>{animationStyles}</style>
    <HomeGuidePopup />
    <main style={{ background: '#fffaf3', color: '#2f241c' }}>
      <section
        style={{
          minHeight: '76vh',
          display: 'grid',
          gridTemplateColumns: '1.05fr 0.95fr',
          gap: 34,
          alignItems: 'center',
          maxWidth: 1180,
          margin: '0 auto',
          padding: '52px 24px',
          animation: 'daldongneFadeUp 0.7s ease-out both',
        }}
      >
        <div>
          <p style={{ fontSize: 18, marginBottom: 12, color: '#9b6a3d' }}>
            달동네 출판사
          </p>

          <h1
            style={{
              fontSize: 58,
              lineHeight: 1.16,
              letterSpacing: '-0.04em',
              margin: 0,
            }}
          >
            사진은 추억을 남기고,
            <br />
            달동네는 그 추억을
            <br />
            한 권의 책으로 엮습니다.
          </h1>

          <p
            style={{
              fontSize: 21,
              lineHeight: 1.75,
              marginTop: 18,
              color: '#5f5146',
              maxWidth: 660,
            }}
          >
            부모님의 삶, 우리 가족의 시간, 아이의 성장 기록까지.
            흩어진 사진과 이야기를 AI가 정리해 평생 간직할 수 있는
            인생책 원고로 만들어 드립니다.
          </p>

                    <div
            style={{
              display: 'flex',
              gap: 14,
              marginTop: 24,
              flexWrap: 'wrap',
            }}
          >
            {isAdmin ? (
              <Link
                href="/admin"
                style={{
                  padding: '15px 24px',
                  borderRadius: 999,
                  background: '#8a4f22',
                  color: '#fffaf0',
                  textDecoration: 'none',
                  fontWeight: 900,
                  border: '1px solid #8a4f22',
                  boxShadow:
                    '0 8px 20px rgba(90, 50, 20, 0.2)',
                }}
              >
                관리자 홈
              </Link>
            ) : null}

            <Link
  href={startHref}
  style={{
    display: 'inline-block',
    marginTop: 20,
    padding: '16px 28px',
    borderRadius: 999,
    background: '#3a2a1f',
    color: '#fff',
    textDecoration: 'none',
    fontWeight: 800,
  }}
>
  {session?.user ? '내 기록 이어가기' : '무료로 시작하기'}
</Link>

            <Link
                href={startHref}
                style={{
                padding: '15px 24px',
                borderRadius: 999,
                background: '#fff',
                color: '#3a2a1f',
                textDecoration: 'none',
                fontWeight: 700,
                border: '1px solid #e3d4c2',
              }}
            >
              인생책 만들기
            </Link>
          </div>
        </div>

                <div
          style={{
            background: '#f3e3cf',
            borderRadius: 36,
            padding: 26,
            boxShadow: '0 24px 70px rgba(83, 55, 31, 0.16)',
          }}
        >
          <div
            style={{
              position: 'relative',
              overflow: 'hidden',
              background: '#fffaf6',
              borderRadius: 28,
              minHeight: 360,
              border: '1px solid #ead8c3',
              animation: 'daldongneImageFloat 0.9s ease-out both',
            }}
          >
            <img
              src="/home/memory-book-sample.jpg"
              alt="인생책 예시 이미지"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 1,
                filter: 'brightness(1.08) saturate(1.08)',
                animation: 'daldongneSoftMove 7s ease-in-out infinite',
              }}
            />

            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(180deg, rgba(255,250,246,0.18), rgba(255,250,246,0.52))',
              }}
            />

            <div
              style={{
                position: 'relative',
                zIndex: 1,
                minHeight: 360,
                padding: 28,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <p style={{ color: '#9b6a3d', fontWeight: 700 }}>
                  AI 인생책 원고 예시
                </p>

                                 <h2
                  style={{
                    fontSize: 34,
                    lineHeight: 1.28,
                    marginTop: 20,
                    display: 'grid',
                    gap: 2,
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      width: 0,
                      animation: 'daldongneTypeLine 1.2s steps(8) 0.4s forwards',
                    }}
                  >
                    어머니의 봄날은
                  </span>

                  <span
                    style={{
                      display: 'inline-block',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      width: 0,
                      animation: 'daldongneTypeLine 1.5s steps(10) 1.6s forwards',
                    }}
                  >
                    아직도 우리 집에
                  </span>

                  <span
                    style={{
                      display: 'inline-block',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      width: 0,
                      animation: 'daldongneTypeLine 1.1s steps(7) 3.1s forwards',
                    }}
                  >
                    남아 있습니다.
                  </span>
                </h2>           


              </div>

              <p style={{ fontSize: 18, lineHeight: 1.8, color: '#6b5b4f' }}>
                오래된 사진 한 장에는 그날의 공기, 가족의 목소리,
                말하지 못한 마음이 함께 담겨 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '52px 24px',
        animation: 'daldongneFadeUp 0.7s ease-out both', }}>
        <p style={{ color: '#9b6a3d', fontWeight: 700 }}>왜 달동네인가요?</p>
        <h2 style={{ fontSize: 42, lineHeight: 1.3, marginTop: 12 }}>
          기록하지 않은 이야기는
          <br />
          시간이 지나면 사라집니다.
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 20,
            marginTop: 24,
          }}
        >
          {[
            ['사진', '흩어진 사진을 한곳에 모읍니다.'],
            ['이야기', '사진 속 기억과 가족의 이야기를 남깁니다.'],
            ['책', 'AI가 목차와 원고로 정리해 줍니다.'],
          ].map(([title, desc]) => (
            <div
              key={title}
              style={{
                background: '#fff',
                border: '1px solid #ead8c3',
                borderRadius: 24,
                padding: 26,
              }}
            >
              <h3 style={{ fontSize: 24, marginTop: 0 }}>{title}</h3>
              <p style={{ fontSize: 17, lineHeight: 1.7, color: '#66584e' }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: '#3a2a1f', color: '#fff' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '56px 24px',animation: 'daldongneFadeUp 0.7s ease-out both', }}>
          <p style={{ color: '#e8c69f', fontWeight: 700 }}>
            이런 책을 만들 수 있습니다
          </p>
          <h2 style={{ fontSize: 42, lineHeight: 1.3, marginTop: 12 }}>
            한 사람의 삶도,
            <br />
            한 가족의 시간도 책이 됩니다.
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16,
              marginTop: 24,
            }}
          >
            {bookTypes.map((type) => (
              <div
                key={type}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: 20,
                  padding: 22,
                  fontSize: 19,
                  fontWeight: 700,
                }}
              >
                {type}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '56px 24px',animation: 'daldongneFadeUp 0.7s ease-out both', }}>
        <p style={{ color: '#9b6a3d', fontWeight: 700 }}>제작 과정</p>
        <h2 style={{ fontSize: 42, lineHeight: 1.3, marginTop: 12 }}>
          복잡한 출판 과정을
          <br />
          쉽게 따라갈 수 있게 만들었습니다.
        </h2>

        <div style={{ display: 'grid', gap: 14, marginTop: 22 }}>
          {steps.map((step, index) => (
            <div
              key={step}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                background: '#fff',
                border: '1px solid #ead8c3',
                borderRadius: 20,
                padding: 20,
              }}
            >
              <strong
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  background: '#f3e3cf',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {index + 1}
              </strong>
              <span style={{ fontSize: 19, fontWeight: 700 }}>{step}</span>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: '#f4e6d5' }}>
        <div
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            padding: '52px 24px',
            textAlign: 'center',
          }}
        >
          <h2 style={{ fontSize: 44, lineHeight: 1.3, margin: 0 }}>
            당신의 추억도
            <br />
            한 권의 책이 될 수 있습니다.
          </h2>

          <p style={{ fontSize: 20, color: '#66584e', marginTop: 22 }}>
            지금 사진 몇 장으로 시작해 보세요.
          </p>

          <Link
  href={startHref}
  style={{
    display: 'inline-block',
    marginTop: 20,
    padding: '16px 28px',
    borderRadius: 999,
    background: '#3a2a1f',
    color: '#fff',
    textDecoration: 'none',
    fontWeight: 800,
  }}
>
  {session?.user ? '내 기록 이어가기' : '지금 시작하기'}
</Link>
        </div>
      </section>
         </main>
    </>
  );
}