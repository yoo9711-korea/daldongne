import Link from 'next/link';
import { auth } from '@/auth';

const guideSteps = [
  {
    number: '01',
    title: '사진을 올립니다',
    text: '부모님 사진, 가족사진, 아이 성장 사진, 여행 사진처럼 책에 남기고 싶은 사진을 먼저 올립니다.',
  },
  {
    number: '02',
    title: '사진 속 이야기를 적습니다',
    text: '사진을 찍은 날, 함께 있던 사람, 기억나는 장면을 짧게 적어도 충분합니다.',
  },
  {
    number: '03',
    title: 'AI가 글을 다듬습니다',
    text: 'AI는 없는 이야기를 지어내는 것이 아니라, 사용자가 남긴 문장을 책에 어울리게 정리합니다.',
  },
  {
    number: '04',
    title: '책 원고를 만듭니다',
    text: '올린 사진과 이야기를 바탕으로 목차와 원고 초안을 만듭니다.',
  },
  {
    number: '05',
    title: '내 책장에서 확인합니다',
    text: '생성된 원고는 내 책장에 저장되고, 언제든 다시 확인할 수 있습니다.',
  },
  {
    number: '06',
    title: '마음에 들면 제작 상담을 신청합니다',
    text: '원고를 실제 책으로 만들고 싶다면 제작 상담을 신청할 수 있습니다.',
  },
];

const faqItems = [
  {
    question: '사진은 몇 장 정도 올리면 좋나요?',
    answer:
      '처음에는 3장만 있어도 시작할 수 있습니다. 다만 좋은 책을 만들려면 10장 이상을 추천합니다.',
  },
  {
    question: '이야기를 길게 써야 하나요?',
    answer:
      '아닙니다. 짧게 적어도 됩니다. “이날 가족여행을 갔다”, “어머니가 가장 좋아하시던 사진이다” 정도로 시작해도 충분합니다.',
  },
  {
    question: 'AI가 내용을 마음대로 지어내나요?',
    answer:
      '기본 방향은 사용자가 남긴 사진과 이야기를 바탕으로 정리하는 것입니다. 없는 가족관계나 사건을 만들지 않는 방향으로 설계합니다.',
  },
  {
    question: '책 제작은 바로 결제해야 하나요?',
    answer:
      '아닙니다. 먼저 원고를 만들어 보고, 마음에 들 때 제작 상담을 신청하는 흐름입니다.',
  },
];

export default async function GuidePage() {
  const session = await auth();

const photoHref = session?.user
  ? '/dashboard/timeline'
  : '/login?callbackUrl=/dashboard/timeline';

  const interviewHref = session?.user
    ? '/dashboard/interview'
    : '/login?callbackUrl=/dashboard/interview';
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#fffaf3',
        color: '#2f241c',
      }}
    >
      <section
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          padding: '76px 24px 48px',
        }}
      >
        <p
          style={{
            margin: '0 0 14px',
            color: '#9b6a3d',
            fontSize: 15,
            fontWeight: 900,
          }}
        >
          처음 이용 가이드
        </p>

        <h1
          style={{
            margin: 0,
            fontSize: 'clamp(38px, 6vw, 66px)',
            lineHeight: 1.14,
            letterSpacing: '-0.05em',
            fontFamily: 'Noto Serif KR, serif',
          }}
        >
          사진 몇 장으로
          <br />
          인생책을 시작하는 방법
        </h1>

        <p
          style={{
            maxWidth: 760,
            margin: '24px 0 0',
            fontSize: 20,
            lineHeight: 1.75,
            color: '#66584e',
          }}
        >
          달동네는 복잡한 출판 서비스가 아닙니다. 사진을 올리고, 기억나는
          이야기를 조금씩 남기면 AI가 책 원고로 정리해 줍니다.
        </p>

        <div
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            marginTop: 32,
          }}
        >
          <Link
            href={photoHref}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 48,
              padding: '0 22px',
              borderRadius: 999,
              background: '#3a2a1f',
              color: '#fffaf0',
              textDecoration: 'none',
              fontSize: 15,
              fontWeight: 900,
            }}
          >
            사진 올리고 시작하기
          </Link>

          <Link
            href="/trial"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 48,
              padding: '0 22px',
              borderRadius: 999,
              background: '#fff',
              color: '#3a2a1f',
              textDecoration: 'none',
              fontSize: 15,
              fontWeight: 900,
              border: '1px solid #e3d4c2',
            }}
          >
            제작 사례 보기
          </Link>
        </div>
      </section>

      <section
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          padding: '24px 24px 72px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 18,
          }}
        >
          {guideSteps.map((step) => (
            <article
              key={step.number}
              style={{
                minHeight: 230,
                padding: 26,
                borderRadius: 28,
                border: '1px solid #ead8c3',
                background: '#fffdf6',
                boxShadow: '0 14px 34px rgba(83, 55, 31, 0.08)',
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: '#c18a23',
                  fontSize: 14,
                  fontWeight: 900,
                }}
              >
                STEP {step.number}
              </p>

              <h2
                style={{
                  margin: '14px 0 12px',
                  fontSize: 24,
                  lineHeight: 1.35,
                  letterSpacing: '-0.04em',
                  color: '#24170f',
                }}
              >
                {step.title}
              </h2>

              <p
                style={{
                  margin: 0,
                  fontSize: 16,
                  lineHeight: 1.75,
                  color: '#66584e',
                }}
              >
                {step.text}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        style={{
          background: '#3a2a1f',
          color: '#fffaf0',
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            padding: '76px 24px',
            display: 'grid',
            gridTemplateColumns: '0.9fr 1.1fr',
            gap: 36,
            alignItems: 'start',
          }}
        >
          <div>
            <p
              style={{
                margin: '0 0 14px',
                color: '#e8c69f',
                fontWeight: 900,
              }}
            >
              쉽게 생각하면 됩니다
            </p>

            <h2
              style={{
                margin: 0,
                fontSize: 42,
                lineHeight: 1.28,
                letterSpacing: '-0.04em',
                fontFamily: 'Noto Serif KR, serif',
              }}
            >
              좋은 글을 쓰는 것보다
              <br />
              기억을 남기는 것이 먼저입니다.
            </h2>
          </div>

          <div
            style={{
              padding: 28,
              borderRadius: 28,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.16)',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 18,
                lineHeight: 1.8,
                color: '#eadcc8',
              }}
            >
              글을 잘 쓰지 못해도 괜찮습니다. 사진을 보며 떠오르는 말을
              그대로 적어두면 됩니다. 달동네는 그 짧은 기록을 모아 읽기 좋은
              문장과 목차로 정리합니다.
            </p>
          </div>
        </div>
      </section>

      <section
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          padding: '76px 24px',
        }}
      >
        <p
          style={{
            margin: '0 0 14px',
            color: '#9b6a3d',
            fontWeight: 900,
          }}
        >
          자주 묻는 질문
        </p>

        <h2
          style={{
            margin: 0,
            fontSize: 42,
            lineHeight: 1.3,
            letterSpacing: '-0.04em',
            fontFamily: 'Noto Serif KR, serif',
          }}
        >
          처음 시작할 때
          <br />
          많이 궁금해하는 것들
        </h2>

        <div
          style={{
            display: 'grid',
            gap: 14,
            marginTop: 30,
          }}
        >
          {faqItems.map((item) => (
            <article
              key={item.question}
              style={{
                padding: 24,
                borderRadius: 22,
                border: '1px solid #ead8c3',
                background: '#fffdf6',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 20,
                  color: '#24170f',
                }}
              >
                {item.question}
              </h3>

              <p
                style={{
                  margin: '10px 0 0',
                  fontSize: 16,
                  lineHeight: 1.75,
                  color: '#66584e',
                }}
              >
                {item.answer}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        style={{
          background: '#f4e6d5',
        }}
      >
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
              margin: 0,
              fontSize: 42,
              lineHeight: 1.32,
              letterSpacing: '-0.04em',
              fontFamily: 'Noto Serif KR, serif',
            }}
          >
            지금은 완벽한 준비보다
            <br />
            첫 사진 한 장이 더 중요합니다.
          </h2>

          <p
            style={{
              margin: '20px 0 0',
              fontSize: 19,
              lineHeight: 1.75,
              color: '#66584e',
            }}
          >
            사진 몇 장과 짧은 이야기로 먼저 시작해 보세요.
          </p>

          <Link
            href={interviewHref}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 50,
              padding: '0 26px',
              borderRadius: 999,
              background: '#3a2a1f',
              color: '#fffaf0',
              textDecoration: 'none',
              fontSize: 16,
              fontWeight: 900,
              marginTop: 28,
            }}
          >
            사진과 이야기 남기기
          </Link>
        </div>
      </section>
    </main>
  );
}