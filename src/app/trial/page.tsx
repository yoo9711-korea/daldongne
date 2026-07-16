import Link from 'next/link';
import { auth } from '@/auth';

const cases = [
  {
    title: '어머니의 봄날',
    type: '부모님 인생책',
    pages: '예상 72페이지',
    description:
      '오래된 가족사진과 자녀가 기억하는 이야기를 바탕으로 어머니의 삶을 따뜻한 문체로 정리한 인생책입니다.',
    chapters: ['어린 시절의 집', '가족을 위해 보낸 시간', '말하지 못한 고마움', '우리 곁에 남은 사랑'],
  },
  {
    title: '우리 가족의 계절',
    type: '가족 이야기책',
    pages: '예상 64페이지',
    description:
      '명절, 여행, 생일, 평범한 일상의 사진을 모아 가족이 함께 지나온 시간을 한 권의 책으로 구성했습니다.',
    chapters: ['처음 모인 날들', '함께 웃던 계절', '가족이라는 이름', '다시 꺼내 보는 순간'],
  },
  {
    title: '작은 발자국의 기록',
    type: '아이 성장 기록책',
    pages: '예상 58페이지',
    description:
      '아이의 성장 사진과 부모의 짧은 메모를 바탕으로, 시간이 지나도 다시 읽고 싶은 성장 기록책을 만듭니다.',
    chapters: ['처음 만난 날', '작은 웃음들', '자라나는 마음', '너에게 남기는 편지'],
  },
];

const samples = [
  {
    label: '표지 예시',
    text: '따뜻한 색감과 책 제목, 가족 이름을 넣어 선물용 표지처럼 구성합니다.',
  },
  {
    label: '목차 예시',
    text: '사진의 시간 흐름과 이야기의 감정 흐름을 바탕으로 자연스러운 장 구성을 만듭니다.',
  },
  {
    label: '본문 예시',
    text: '사용자가 남긴 짧은 글을 AI가 읽기 좋은 문장으로 다듬고 연결합니다.',
  },
  {
    label: '사진 배치 예시',
    text: '사진과 이야기가 따로 놀지 않도록 한 장면마다 기억을 함께 배치합니다.',
  },
];

export default async function TrialPage() {
    const session = await auth();

  const bookHref = session?.user
    ? '/dashboard/book'
    : '/login?callbackUrl=/dashboard/book';
 
  return (
    <main style={{ minHeight: '100vh', background: '#fffaf3', color: '#2f241c' }}>
      <section
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          padding: '76px 24px 52px',
        }}
      >
        <p style={{ color: '#9b6a3d', fontWeight: 900, marginBottom: 14 }}>
          제작 사례
        </p>

        <h1
          style={{
            fontSize: 'clamp(38px, 6vw, 66px)',
            lineHeight: 1.14,
            letterSpacing: '-0.05em',
            margin: 0,
          }}
        >
          이런 인생책이
          <br />
          만들어집니다.
        </h1>

        <p
          style={{
            maxWidth: 760,
            marginTop: 24,
            fontSize: 20,
            lineHeight: 1.75,
            color: '#66584e',
          }}
        >
          달동네는 단순히 사진을 모아두는 서비스가 아닙니다. 사진 속 시간,
          가족의 기억, 말로 다 하지 못한 마음을 한 권의 책 원고로 정리합니다.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 30 }}>
          <Link
            href="/pricing"
            style={{
              padding: '15px 24px',
              borderRadius: 999,
              background: '#3a2a1f',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 900,
            }}
          >
            상품/가격 보기
          </Link>

          <Link
            href={bookHref}
            style={{
              padding: '15px 24px',
              borderRadius: 999,
              background: '#fff',
              color: '#3a2a1f',
              textDecoration: 'none',
              fontWeight: 900,
              border: '1px solid #e3d4c2',
            }}
          >
            내 사진으로 시작하기
          </Link>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '26px 24px 70px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 22,
          }}
        >
          {cases.map((item) => (
            <article
              key={item.title}
              style={{
                background: '#fff',
                border: '1px solid #ead8c3',
                borderRadius: 30,
                overflow: 'hidden',
                boxShadow: '0 18px 48px rgba(83, 55, 31, 0.1)',
              }}
            >
              <div
                style={{
                  minHeight: 260,
                  padding: 28,
                  background:
                    'linear-gradient(135deg, #ead6bd 0%, #f8ead8 55%, #fff7ec 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <p
                    style={{
                      display: 'inline-flex',
                      padding: '7px 12px',
                      borderRadius: 999,
                      background: 'rgba(255,255,255,0.65)',
                      color: '#7a4d1f',
                      fontSize: 13,
                      fontWeight: 900,
                      margin: 0,
                    }}
                  >
                    {item.type}
                  </p>

                  <h2
                    style={{
                      margin: '24px 0 0',
                      fontFamily: 'Noto Serif KR, serif',
                      fontSize: 34,
                      lineHeight: 1.25,
                      letterSpacing: '-0.04em',
                    }}
                  >
                    {item.title}
                  </h2>
                </div>

                <p style={{ margin: 0, color: '#7a5b42', fontWeight: 800 }}>
                  {item.pages}
                </p>
              </div>

              <div style={{ padding: 26 }}>
                <p style={{ margin: 0, color: '#66584e', fontSize: 16, lineHeight: 1.75 }}>
                  {item.description}
                </p>

                <div style={{ marginTop: 22 }}>
                  <p
                    style={{
                      margin: '0 0 10px',
                      color: '#9b6a3d',
                      fontWeight: 900,
                      fontSize: 14,
                    }}
                  >
                    목차 예시
                  </p>

                  <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.9, color: '#4d4037' }}>
                    {item.chapters.map((chapter) => (
                      <li key={chapter}>{chapter}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section style={{ background: '#3a2a1f', color: '#fff' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '78px 24px' }}>
          <p style={{ color: '#e8c69f', fontWeight: 900, marginBottom: 14 }}>
            결과물 구성
          </p>

          <h2
            style={{
              fontSize: 44,
              lineHeight: 1.28,
              letterSpacing: '-0.04em',
              margin: 0,
            }}
          >
            표지부터 본문까지,
            <br />
            책처럼 보이도록 구성합니다.
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 16,
              marginTop: 34,
            }}
          >
            {samples.map((sample) => (
              <div
                key={sample.label}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  borderRadius: 22,
                  padding: 22,
                }}
              >
                <h3 style={{ margin: '0 0 12px', fontSize: 22 }}>{sample.label}</h3>
                <p style={{ margin: 0, color: '#eadcc8', lineHeight: 1.7, fontSize: 15 }}>
                  {sample.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '78px 24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '0.9fr 1.1fr',
            gap: 30,
            alignItems: 'center',
            background: '#f4e6d5',
            borderRadius: 34,
            padding: 34,
            border: '1px solid #ead8c3',
          }}
        >
          <div
            style={{
              minHeight: 420,
              borderRadius: 26,
              background: '#fffaf6',
              border: '1px solid #e5d2bb',
              padding: 30,
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.5)',
            }}
          >
            <p style={{ color: '#9b6a3d', fontWeight: 900 }}>본문 미리보기</p>

            <h2
              style={{
                fontFamily: 'Noto Serif KR, serif',
                fontSize: 32,
                lineHeight: 1.35,
                letterSpacing: '-0.04em',
                marginTop: 24,
              }}
            >
              사진 속 어머니는
              <br />
              늘 웃고 계셨습니다.
            </h2>

            <p style={{ fontSize: 17, lineHeight: 1.9, color: '#5f5146', marginTop: 24 }}>
              낡은 앨범 속 사진 한 장에는 그날의 햇살과 가족들의 목소리가
              그대로 남아 있었습니다. 우리는 그 사진을 보며 오래 잊고 지냈던
              마음을 다시 꺼내게 됩니다.
            </p>

            <p style={{ fontSize: 17, lineHeight: 1.9, color: '#5f5146' }}>
              달동네는 그 마음을 놓치지 않고 문장으로 정리합니다. 짧은 기억도
              책 안에서는 한 사람의 삶을 보여주는 소중한 장면이 됩니다.
            </p>
          </div>

          <div>
            <p style={{ color: '#9b6a3d', fontWeight: 900 }}>왜 사례가 중요한가요?</p>

            <h2
              style={{
                fontSize: 38,
                lineHeight: 1.32,
                letterSpacing: '-0.04em',
                margin: '12px 0 18px',
              }}
            >
              결과물이 보여야
              <br />
              마음이 움직입니다.
            </h2>

            <p style={{ fontSize: 18, lineHeight: 1.8, color: '#66584e' }}>
              고객은 기능보다 결과물을 먼저 궁금해합니다. 그래서 달동네는
              사진을 올리면 어떤 책이 만들어지는지, 어떤 문체와 구성으로
              정리되는지 먼저 보여주는 흐름이 필요합니다.
            </p>

            <Link
              href={bookHref}
              style={{
                display: 'inline-flex',
                marginTop: 24,
                padding: '15px 24px',
                borderRadius: 999,
                background: '#3a2a1f',
                color: '#fff',
                textDecoration: 'none',
                fontWeight: 900,
              }}
            >
              내 사진으로 인생책 만들기
            </Link>
          </div>
        </div>
      </section>

      <section style={{ background: '#f4e6d5' }}>
        <div
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            padding: '76px 24px',
            textAlign: 'center',
          }}
        >
          <h2
            style={{
              fontSize: 42,
              lineHeight: 1.32,
              letterSpacing: '-0.04em',
              margin: 0,
            }}
          >
            아직 사진이 정리되지 않았어도 괜찮습니다.
            <br />
            몇 장의 사진으로 시작할 수 있습니다.
          </h2>

          <p style={{ fontSize: 19, lineHeight: 1.75, color: '#66584e', marginTop: 20 }}>
            먼저 사진과 이야기를 남기고, 원고가 만들어진 뒤 제작 상담을 신청하세요.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginTop: 28 }}>
            <Link
              href="/pricing"
              style={{
                padding: '15px 24px',
                borderRadius: 999,
                background: '#fff',
                color: '#3a2a1f',
                textDecoration: 'none',
                fontWeight: 900,
                border: '1px solid #e3d4c2',
              }}
            >
              상품/가격 보기
            </Link>

            <Link
              href={bookHref}
              style={{
                padding: '15px 24px',
                borderRadius: 999,
                background: '#3a2a1f',
                color: '#fff',
                textDecoration: 'none',
                fontWeight: 900,
              }}
            >
              지금 시작하기
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}