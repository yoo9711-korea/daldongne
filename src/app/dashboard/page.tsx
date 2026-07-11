// src/app/dashboard/page.tsx
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import PageGuideBox from '@/components/guide/PageGuideBox';

const WORK_STEPS = [
  {
    title: '사진 모으기',
    text: '부모님 사진, 가족사진, 오래된 앨범 사진을 올립니다.',
    href: '/dashboard/timeline',
  },
  {
    title: '이야기 남기기',
    text: '사진 속 기억, 부모님의 이야기, 가족이 기억하는 말을 기록합니다.',
    href: '/dashboard/interview',
  },
  {
    title: '책 원고 만들기',
    text: '모은 사진과 남긴 이야기를 엮어 인생책 원고의 흐름을 준비합니다.',
    href: '/dashboard/book',
  },
  {
    title: '내 책장',
    text: '완성된 원고와 결과물을 책장에 보관하고 다시 꺼내봅니다.',
    href: '/dashboard/library',
  },
  {
    title: '가족 공간',
    text: '가족을 초대해 함께 사진과 이야기를 모읍니다.',
    href: '/dashboard/family',
  },
];

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id;

  const [
    user,
    familyCount,
    memoryCount,
    photoCount,
    interviewCount,
    bookCount,
    recentMemories,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        role: true,
      },
    }),

    prisma.familyMember.count({
      where: { userId },
    }),

    prisma.memory.count({
      where: { authorId: userId },
    }),

    prisma.memory.count({
      where: {
        authorId: userId,
        type: 'PHOTO',
      },
    }),

    prisma.memory.count({
      where: {
        authorId: userId,
        title: {
          startsWith: 'AI 인터뷰',
        },
      },
    }),

    prisma.book.count({
      where: { authorId: userId },
    }),

    prisma.memory.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      take: 4,
      select: {
        id: true,
        title: true,
        type: true,
        createdAt: true,
        occurredAt: true,
      },
    }),
  ]);

  const statCards = [
    {
      label: '모은 기록',
      value: memoryCount,
      text: '사진, 글, 음성 등 인생책의 재료입니다.',
    },
    {
      label: '사진 기록',
      value: photoCount,
      text: '책의 장면이 되는 사진입니다.',
    },
    {
      label: '이야기 답변',
      value: interviewCount,
      text: '책의 문장이 되는 이야기입니다.',
    },
    {
      label: '보관된 책',
      value: bookCount,
      text: '내 책장에 보관된 결과물입니다.',
    },
    {
      label: '가족 공간',
      value: familyCount,
      text: '함께 기록을 모으는 공간입니다.',
    },
  ];

  return (
    <main style={{ padding: 28 }}>
      <section
        style={{
          borderRadius: 34,
          padding: 38,
          background:
            'linear-gradient(135deg, #33271d 0%, #5b422c 52%, #8a6238 100%)',
          color: '#fff8ec',
          boxShadow: '0 22px 60px rgba(51, 39, 29, 0.18)',
        }}
      >
        <p
          style={{
            margin: '0 0 14px',
            color: '#f0c36a',
            fontWeight: 900,
            letterSpacing: '0.08em',
          }}
        >
          내 작업실
        </p>

        <h1
          style={{
            margin: 0,
            fontFamily: 'Noto Serif KR, serif',
            fontSize: 'clamp(36px, 5vw, 58px)',
            lineHeight: 1.18,
            letterSpacing: '-0.05em',
          }}
        >
          사진과 이야기를 모아
          <br />
          한 권의 인생책을 준비합니다.
        </h1>

        <p
          style={{
            marginTop: 24,
            maxWidth: 780,
            fontSize: 21,
            lineHeight: 1.75,
            color: 'rgba(255, 248, 236, 0.86)',
          }}
        >
          완성된 원고가 없어도 괜찮습니다. 사진을 올리고, 기억나는 이야기를
          남기고, 삶의 흐름을 정리하면 가족이 오래 간직할 인생책 제작이
          시작됩니다.
        </p>

        <div
          style={{
            marginTop: 32,
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/dashboard/timeline"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '14px 22px',
              borderRadius: 999,
              background: '#f0c36a',
              color: '#2b2118',
              fontWeight: 900,
              textDecoration: 'none',
            }}
          >
            사진 모으기
          </Link>

          <Link
            href="/dashboard/interview"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '14px 22px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.42)',
              color: '#fff8ec',
              fontWeight: 900,
              textDecoration: 'none',
            }}
          >
            이야기 남기기
          </Link>

          <Link
            href="/dashboard/book"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '14px 22px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.42)',
              color: '#fff8ec',
              fontWeight: 900,
              textDecoration: 'none',
            }}
          >
            책 원고 만들기
          </Link>
        </div>
      </section>

       <div style={{ marginTop: 24 }}>
        <PageGuideBox
          label="작업실 처음 이용 가이드"
          title="이 순서대로 진행하면 인생책을 쉽게 만들 수 있습니다"
          description="처음에는 모든 기능을 다 사용할 필요가 없습니다. 사진과 이야기를 먼저 모으고, 그다음 책 원고를 만든 뒤 내 책장에서 확인하면 됩니다."
          steps={[
            '사진과 이야기를 먼저 남깁니다.',
            '사진마다 날짜, 장소, 짧은 기억을 적습니다.',
            '자료가 어느 정도 모이면 책 원고 만들기로 이동합니다.',
            '책 종류, 문체, 원고 길이를 선택합니다.',
            'AI가 만든 원고를 내 책장에서 확인합니다.',
            '마음에 들면 제작 상담을 신청합니다.',
          ]}
          note="처음에는 사진 3장만 있어도 시작할 수 있습니다. 완벽하게 준비하려고 하기보다 먼저 기록을 남기는 것이 중요합니다."
        />
      </div>
    
      <section
        style={{
          marginTop: 24,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: 16,
        }}
      >
        {statCards.map((card) => (
          <article
            key={card.label}
            style={{
              padding: 24,
              borderRadius: 26,
              background: '#fffaf1',
              border: '1px solid rgba(91, 66, 43, 0.12)',
              boxShadow: '0 12px 30px rgba(91, 66, 43, 0.08)',
            }}
          >
            <p
              style={{
                margin: 0,
                color: '#9b6d2f',
                fontWeight: 900,
              }}
            >
              {card.label}
            </p>

            <strong
              style={{
                display: 'block',
                marginTop: 10,
                fontSize: 38,
                lineHeight: 1,
                color: '#33271d',
              }}
            >
              {card.value}
            </strong>

            <p
              style={{
                margin: '14px 0 0',
                color: '#6b5845',
                fontSize: 16,
                lineHeight: 1.6,
              }}
            >
              {card.text}
            </p>
          </article>
        ))}
      </section>

      <section
        style={{
          marginTop: 28,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.15fr) minmax(320px, 0.85fr)',
          gap: 24,
          alignItems: 'start',
        }}
      >
        <div
          style={{
            padding: 30,
            borderRadius: 30,
            background: '#fffaf1',
            border: '1px solid rgba(91, 66, 43, 0.12)',
            boxShadow: '0 12px 30px rgba(91, 66, 43, 0.08)',
          }}
        >
          <p
            style={{
              margin: '0 0 12px',
              color: '#9b6d2f',
              fontWeight: 900,
              letterSpacing: '0.08em',
            }}
          >
            다음 작업
          </p>

          <h2
            style={{
              margin: 0,
              fontFamily: 'Noto Serif KR, serif',
              fontSize: 34,
              lineHeight: 1.35,
              letterSpacing: '-0.04em',
              color: '#33271d',
            }}
          >
            인생책 제작은
            <br />
            이 순서로 진행됩니다.
          </h2>

          <div
            style={{
              marginTop: 26,
              display: 'grid',
              gap: 14,
            }}
          >
            {WORK_STEPS.map((step, index) => (
              <Link
                key={step.title}
                href={step.href}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '44px minmax(0, 1fr)',
                  gap: 16,
                  alignItems: 'start',
                  padding: 20,
                  borderRadius: 22,
                  background: index === 2 ? '#33271d' : '#ffffff',
                  color: index === 2 ? '#fff8ec' : '#33271d',
                  textDecoration: 'none',
                  border:
                    index === 2
                      ? '2px solid #f0c36a'
                      : '1px solid rgba(91, 66, 43, 0.1)',
                }}
              >
                <span
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: index === 2 ? '#f0c36a' : '#33271d',
                    color: index === 2 ? '#2b2118' : '#fff8ec',
                    fontWeight: 900,
                  }}
                >
                  {index + 1}
                </span>

                <span>
                  <strong
                    style={{
                      display: 'block',
                      fontSize: 21,
                      lineHeight: 1.35,
                    }}
                  >
                    {step.title}
                  </strong>

                  <span
                    style={{
                      display: 'block',
                      marginTop: 6,
                      fontSize: 16,
                      lineHeight: 1.6,
                      color: index === 2 ? 'rgba(255,248,236,0.78)' : '#6b5845',
                    }}
                  >
                    {step.text}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>

        <aside
          style={{
            padding: 30,
            borderRadius: 30,
            background: '#f4ead8',
            border: '1px solid rgba(91, 66, 43, 0.12)',
            boxShadow: '0 12px 30px rgba(91, 66, 43, 0.08)',
          }}
        >
          <p
            style={{
              margin: '0 0 12px',
              color: '#9b6d2f',
              fontWeight: 900,
              letterSpacing: '0.08em',
            }}
          >
            계정 정보
          </p>

          <h2
            style={{
              margin: 0,
              fontFamily: 'Noto Serif KR, serif',
              fontSize: 30,
              lineHeight: 1.35,
              letterSpacing: '-0.04em',
              color: '#33271d',
            }}
          >
            {user?.name || '달동네 사용자'}님의 작업실
          </h2>

          <p
            style={{
              marginTop: 14,
              fontSize: 17,
              lineHeight: 1.7,
              color: '#6b5845',
              wordBreak: 'break-all',
            }}
          >
            {user?.email || session.user.email}
          </p>

          {user?.role === 'ADMIN' ? (
            <Link
              href="/admin"
              style={{
                marginTop: 22,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 18px',
                borderRadius: 999,
                background: '#33271d',
                color: '#fff8ec',
                fontWeight: 900,
                textDecoration: 'none',
              }}
            >
              관리자 화면 보기
            
                         </Link>
          ) : null}

          <Link
            href="/dashboard/account"
            style={{
              marginTop: 14,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px 18px',
              borderRadius: 999,
              border: '1px solid #d6b778',
              background: '#fff8eb',
              color: '#5a3510',
              fontWeight: 900,
              textDecoration: 'none',
            }}
          >
            계정 관리
          </Link>

          <div
            style={{
              marginTop: 28,
              paddingTop: 22,
              borderTop: '1px solid rgba(91, 66, 43, 0.16)',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 18,
                lineHeight: 1.75,
                color: '#4c3a2a',
                fontWeight: 800,
              }}
            >
              사진과 이야기가 모이면 책 원고를 만들 수 있습니다.
            </p>

            <p
              style={{
                margin: '10px 0 0',
                fontSize: 16,
                lineHeight: 1.65,
                color: '#6b5845',
              }}
            >
              지금은 완성보다 수집이 중요합니다. 사진과 짧은 기억을 먼저
              모아주세요.
            </p>
          </div>
        </aside>
      </section>

      <section
        style={{
          marginTop: 28,
          padding: 30,
          borderRadius: 30,
          background: '#fffaf1',
          border: '1px solid rgba(91, 66, 43, 0.12)',
          boxShadow: '0 12px 30px rgba(91, 66, 43, 0.08)',
        }}
      >
        <p
          style={{
            margin: '0 0 12px',
            color: '#9b6d2f',
            fontWeight: 900,
            letterSpacing: '0.08em',
          }}
        >
          최근 기록
        </p>

        <h2
          style={{
            margin: 0,
            fontFamily: 'Noto Serif KR, serif',
            fontSize: 32,
            lineHeight: 1.35,
            letterSpacing: '-0.04em',
            color: '#33271d',
          }}
        >
          최근에 남긴 사진과 이야기
        </h2>

        {recentMemories.length > 0 ? (
          <div style={{ marginTop: 22, display: 'grid', gap: 12 }}>
            {recentMemories.map((memory) => (
              <div
                key={memory.id}
                style={{
                  padding: 18,
                  borderRadius: 20,
                  background: '#ffffff',
                  border: '1px solid rgba(91, 66, 43, 0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 16,
                  alignItems: 'center',
                }}
              >
                <div>
                  <strong
                    style={{
                      display: 'block',
                      fontSize: 18,
                      color: '#33271d',
                    }}
                  >
                    {memory.title || '제목 없는 기록'}
                  </strong>

                  <span
                    style={{
                      display: 'block',
                      marginTop: 6,
                      color: '#6b5845',
                      fontSize: 15,
                    }}
                  >
                    {memory.type} · {memory.createdAt.toLocaleDateString('ko-KR')}
                  </span>
                </div>

                <Link
                  href="/dashboard/timeline"
                  style={{
                    color: '#9b6d2f',
                    fontWeight: 900,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  보기
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              marginTop: 22,
              padding: 28,
              borderRadius: 24,
              background: '#ffffff',
              border: '1px dashed rgba(91, 66, 43, 0.28)',
              color: '#6b5845',
              fontSize: 18,
              lineHeight: 1.7,
            }}
          >
            아직 남긴 기록이 없습니다. 부모님의 사진을 올리고, 기억나는 이야기를
            짧게 남겨보세요.
          </div>
        )}
      </section>
    </main>
  );
}