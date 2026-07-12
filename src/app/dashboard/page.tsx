import { auth } from '@/auth';
import PageGuideBox from '@/components/guide/PageGuideBox';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { CSSProperties } from 'react';

const REQUIRED_PHOTO_COUNT = 3;
const REQUIRED_STORY_COUNT = 3;

const PRIMARY_STEPS = [
  {
    number: 1,
    title: '사진 모으기',
    description:
      '부모님 사진, 가족사진, 오래된 앨범 사진을 한곳에 모읍니다.',
    href: '/dashboard/timeline',
    buttonLabel: '사진 모으기',
  },
  {
    number: 2,
    title: '이야기 남기기',
    description:
      '사진 속 기억과 가족이 기억하는 이야기를 글로 남깁니다.',
    href: '/dashboard/interview',
    buttonLabel: '이야기 남기기',
  },
  {
    number: 3,
    title: '책 원고 만들기',
    description:
      '모아 둔 사진과 이야기를 바탕으로 한 권의 책 원고를 만듭니다.',
    href: '/dashboard/book',
    buttonLabel: '책 원고 만들기',
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
    bookCount,
    activeProductionRequests,
    recentMemories,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        name: true,
        email: true,
        role: true,
      },
    }),

    prisma.familyMember.count({
      where: {
        userId,
      },
    }),

    prisma.memory.count({
      where: {
        authorId: userId,
      },
    }),

    prisma.memory.count({
      where: {
        authorId: userId,
        type: 'PHOTO',
      },
    }),

        prisma.book.count({
      where: {
        authorId: userId,
      },
    }),

    prisma.bookProductionRequest.findMany({
      where: {
        authorId: userId,
        status: {
          in: [
            'REQUESTED',
            'CONTACTED',
            'IN_PROGRESS',
          ],
        },
      },
      select: {
        bookId: true,
      },
    }),

    prisma.memory.findMany({
      where: {
        authorId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
      select: {
        id: true,
        title: true,
        type: true,
        createdAt: true,
        occurredAt: true,
      },
    }),
  ]);

    const storyCount = Math.max(
    memoryCount - photoCount,
    0,
  );
    const activeProductionBookCount =
    new Set(
      activeProductionRequests.map(
        (request) => request.bookId,
      ),
    ).size;

  const photoReady =
    photoCount >= REQUIRED_PHOTO_COUNT;

  const storyReady =
    storyCount >= REQUIRED_STORY_COUNT;

  const bookReady =
    photoReady && storyReady;

    const nextAction = getNextAction({
    photoCount,
    storyCount,
    bookCount,
    activeProductionBookCount,
  });

  const displayName =
    user?.name ||
    session.user.name ||
    '달동네 회원';

  const statCards = [
    {
      label: '모은 사진',
      value: photoCount,
      unit: '장',
      description:
        '책의 장면과 시간의 흐름을 보여 주는 사진입니다.',
      href: '/dashboard/timeline',
    },
    {
      label: '남긴 이야기',
      value: storyCount,
      unit: '개',
      description:
        '사진과 삶의 의미를 설명하는 이야기 기록입니다.',
      href: '/dashboard/interview',
    },
       {
      label: '만든 책',
      value: bookCount,
      unit: '권',
      description:
        '원고를 만들고 내 책장에 저장한 결과물입니다.',
      href: '/dashboard/library',
    },
    {
      label: '제작 상담 진행',
      value: activeProductionBookCount,
      unit: '권',
      description:
        '현재 상담 접수 또는 제작 상담이 진행 중인 책입니다.',
      href: '/dashboard/library',
    },
    {
      label: '가족 공간',
      value: familyCount,
      unit: '곳',
      description:
        '가족과 함께 사진과 이야기를 모으는 공간입니다.',
      href: '/dashboard/family',
    },
  ];

  return (
    <main
      style={{
        padding: '28px',
      }}
    >
      <style>{`
        .dashboard-main-grid {
          display: grid;
          grid-template-columns:
            minmax(0, 1.25fr) minmax(300px, 0.75fr);
          gap: 24px;
          align-items: start;
        }

        .dashboard-step-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .dashboard-recent-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        @media (max-width: 980px) {
          .dashboard-main-grid {
            grid-template-columns: 1fr;
          }

          .dashboard-step-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .dashboard-page {
            padding: 16px !important;
          }

          .dashboard-hero {
            padding: 25px 20px !important;
            border-radius: 24px !important;
          }

          .dashboard-hero-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
          }

          .dashboard-hero-actions a {
            width: 100%;
          }

          .dashboard-recent-row {
            align-items: flex-start;
          }
        }
      `}</style>

      <div
        className="dashboard-page"
        style={{
          maxWidth: 1380,
          margin: '0 auto',
        }}
      >
        <section
          className="dashboard-hero"
          style={{
            borderRadius: 34,
            padding: 38,
            background:
              'linear-gradient(135deg, #33271d 0%, #5b422c 52%, #8a6238 100%)',
            color: '#fff8ec',
            boxShadow:
              '0 22px 60px rgba(51, 39, 29, 0.18)',
          }}
        >
          <p
            style={{
              margin: '0 0 13px',
              color: '#f0c36a',
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: '0.08em',
            }}
          >
            나의 작업실
          </p>

          <h1
            style={{
              margin: 0,
              maxWidth: 900,
              fontFamily:
                'Noto Serif KR, serif',
              fontSize:
                'clamp(34px, 5vw, 56px)',
              lineHeight: 1.2,
              letterSpacing: '-0.05em',
            }}
          >
            {displayName}님의 사진과 이야기를
            <br />
            한 권의 책으로 준비합니다.
          </h1>

          <p
            style={{
              margin: '22px 0 0',
              maxWidth: 800,
              fontSize: 18,
              lineHeight: 1.8,
              color:
                'rgba(255, 248, 236, 0.86)',
            }}
          >
            완성된 원고가 없어도 괜찮습니다.
            사진을 먼저 모으고, 기억나는 이야기를
            하나씩 남기면 달동네가 책의 흐름으로
            정리합니다.
          </p>

          <div
            style={{
              marginTop: 27,
              padding: '18px 20px',
              borderRadius: 20,
              border:
                '1px solid rgba(255,255,255,0.2)',
              background:
                'rgba(255,255,255,0.08)',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 12,
                fontWeight: 900,
                color: '#f0c36a',
              }}
            >
              지금 추천하는 다음 작업
            </p>

            <strong
              style={{
                display: 'block',
                marginTop: 7,
                fontSize: 21,
                lineHeight: 1.45,
              }}
            >
              {nextAction.title}
            </strong>

            <p
              style={{
                margin: '6px 0 0',
                color:
                  'rgba(255, 248, 236, 0.75)',
                fontSize: 14,
                lineHeight: 1.7,
              }}
            >
              {nextAction.description}
            </p>
          </div>

          <div
            className="dashboard-hero-actions"
            style={{
              marginTop: 22,
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <Link
              href={nextAction.href}
              style={heroPrimaryButtonStyle()}
            >
              {nextAction.buttonLabel}
            </Link>

            <Link
              href="/dashboard/library"
              style={heroSecondaryButtonStyle()}
            >
              내 책장 보기
            </Link>

            <Link
              href="/dashboard/family"
              style={heroSecondaryButtonStyle()}
            >
              가족 공간 보기
            </Link>
          </div>
        </section>

        <div
          style={{
            marginTop: 24,
          }}
        >
          <PageGuideBox
            label="처음 이용 가이드"
            title="사진 → 이야기 → 책 만들기 순서로 진행하세요"
            description="처음부터 모든 자료를 준비할 필요는 없습니다. 사진과 기억나는 이야기를 하나씩 모은 뒤 책 원고 만들기로 이동하면 됩니다."
            steps={[
              '부모님과 가족의 사진을 먼저 모읍니다.',
              '사진마다 날짜, 장소와 기억나는 내용을 남깁니다.',
              '사진 속 인물과 사건에 대한 이야기를 추가합니다.',
              '사진 3장과 이야기 3개 이상을 준비합니다.',
              '책 종류와 원고 방향을 선택해 원고를 만듭니다.',
              '완성된 원고는 내 책장에서 확인하고 제작 상담을 신청합니다.',
            ]}
            note="처음에는 사진 3장과 이야기 3개만 준비해도 책 원고 만들기를 시작할 수 있습니다."
          />
        </div>

        <section
          style={{
            marginTop: 24,
            padding: 28,
            borderRadius: 30,
            background: '#fffaf1',
            border:
              '1px solid rgba(91, 66, 43, 0.12)',
            boxShadow:
              '0 12px 30px rgba(91, 66, 43, 0.08)',
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                color: '#9b6d2f',
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: '0.08em',
              }}
            >
              책 만들기 3단계
            </p>

            <h2
              style={{
                margin: '9px 0 0',
                fontFamily:
                  'Noto Serif KR, serif',
                fontSize: 31,
                lineHeight: 1.4,
                letterSpacing: '-0.04em',
                color: '#33271d',
              }}
            >
              지금 어디까지 준비되었는지
              확인하세요
            </h2>
          </div>

          <div
            className="dashboard-step-grid"
            style={{
              marginTop: 22,
            }}
          >
            <StepCard
              number={1}
              title="사진 모으기"
              description="책에 넣을 사진을 모으고 날짜와 장소를 기록합니다."
              count={`${photoCount}장`}
              requirement={`${REQUIRED_PHOTO_COUNT}장 이상 권장`}
              completed={photoReady}
              href="/dashboard/timeline"
              buttonLabel="사진 관리"
            />

            <StepCard
              number={2}
              title="이야기 남기기"
              description="사진 속 사건과 가족이 기억하는 이야기를 남깁니다."
              count={`${storyCount}개`}
              requirement={`${REQUIRED_STORY_COUNT}개 이상 권장`}
              completed={storyReady}
              href="/dashboard/interview"
              buttonLabel="이야기 관리"
            />

            <StepCard
              number={3}
              title="책 원고 만들기"
              description="모아 둔 사진과 이야기를 한 권의 원고로 정리합니다."
              count={`${bookCount}권`}
              requirement={
                bookReady
                  ? '원고 만들기 가능'
                  : '사진과 이야기가 더 필요합니다'
              }
              completed={bookCount > 0}
              ready={bookReady}
              href="/dashboard/book"
              buttonLabel="책 만들기"
            />
          </div>
        </section>

        <section
          style={{
            marginTop: 24,
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(190px, 1fr))',
            gap: 14,
          }}
        >
          {statCards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              style={statCardStyle()}
            >
              <p
                style={{
                  margin: 0,
                  color: '#9b6d2f',
                  fontSize: 13,
                  fontWeight: 900,
                }}
              >
                {card.label}
              </p>

              <strong
                style={{
                  display: 'block',
                  marginTop: 9,
                  fontSize: 35,
                  lineHeight: 1.1,
                  color: '#33271d',
                }}
              >
                {card.value.toLocaleString()}
                <span
                  style={{
                    marginLeft: 4,
                    fontSize: 14,
                    color: '#6b5845',
                  }}
                >
                  {card.unit}
                </span>
              </strong>

              <p
                style={{
                  margin: '12px 0 0',
                  color: '#6b5845',
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                {card.description}
              </p>
            </Link>
          ))}
        </section>

        <section
          className="dashboard-main-grid"
          style={{
            marginTop: 24,
          }}
        >
          <article
            style={{
              padding: 28,
              borderRadius: 30,
              background: '#fffaf1',
              border:
                '1px solid rgba(91, 66, 43, 0.12)',
              boxShadow:
                '0 12px 30px rgba(91, 66, 43, 0.08)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent:
                  'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    color: '#9b6d2f',
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: '0.08em',
                  }}
                >
                  최근 기록
                </p>

                <h2
                  style={{
                    margin: '8px 0 0',
                    fontFamily:
                      'Noto Serif KR, serif',
                    fontSize: 28,
                    lineHeight: 1.4,
                    letterSpacing: '-0.04em',
                    color: '#33271d',
                  }}
                >
                  최근에 남긴 사진과 이야기
                </h2>
              </div>

              <Link
                href="/dashboard/timeline"
                style={smallButtonStyle()}
              >
                전체 기록 보기
              </Link>
            </div>

            {recentMemories.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gap: 10,
                  marginTop: 20,
                }}
              >
                {recentMemories.map(
                  (memory) => (
                    <div
                      key={memory.id}
                      className="dashboard-recent-row"
                      style={{
                        padding: 16,
                        borderRadius: 18,
                        background: '#ffffff',
                        border:
                          '1px solid rgba(91, 66, 43, 0.1)',
                      }}
                    >
                      <div
                        style={{
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 7,
                          }}
                        >
                          <span
                            style={memoryTypeBadgeStyle(
                              String(memory.type),
                            )}
                          >
                            {getMemoryTypeLabel(
                              String(memory.type),
                            )}
                          </span>

                          <span
                            style={{
                              fontSize: 11,
                              color: '#8b7a67',
                            }}
                          >
                            {formatDate(
                              memory.occurredAt ||
                                memory.createdAt,
                            )}
                          </span>
                        </div>

                        <strong
                          style={{
                            display: 'block',
                            marginTop: 8,
                            color: '#33271d',
                            fontSize: 16,
                            lineHeight: 1.5,
                            wordBreak: 'break-word',
                          }}
                        >
                          {memory.title ||
                            '제목 없는 기록'}
                        </strong>
                      </div>

                      <Link
                        href="/dashboard/timeline"
                        style={recordLinkStyle()}
                      >
                        보기
                      </Link>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <div
                style={{
                  marginTop: 20,
                  padding: 27,
                  borderRadius: 22,
                  background: '#ffffff',
                  border:
                    '1px dashed rgba(91, 66, 43, 0.28)',
                  color: '#6b5845',
                  fontSize: 15,
                  lineHeight: 1.75,
                  textAlign: 'center',
                }}
              >
                아직 남긴 기록이 없습니다.
                <br />
                첫 번째 사진을 올리고 기억나는
                이야기를 남겨보세요.

                <div
                  style={{
                    marginTop: 16,
                  }}
                >
                  <Link
                    href="/dashboard/timeline"
                    style={smallButtonStyle()}
                  >
                    첫 사진 올리기
                  </Link>
                </div>
              </div>
            )}
          </article>

          <aside
            style={{
              padding: 28,
              borderRadius: 30,
              background: '#f4ead8',
              border:
                '1px solid rgba(91, 66, 43, 0.12)',
              boxShadow:
                '0 12px 30px rgba(91, 66, 43, 0.08)',
            }}
          >
            <p
              style={{
                margin: 0,
                color: '#9b6d2f',
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: '0.08em',
              }}
            >
              계정과 바로가기
            </p>

            <h2
              style={{
                margin: '9px 0 0',
                fontFamily:
                  'Noto Serif KR, serif',
                fontSize: 27,
                lineHeight: 1.4,
                letterSpacing: '-0.04em',
                color: '#33271d',
              }}
            >
              {displayName}님의 작업실
            </h2>

            <p
              style={{
                margin: '9px 0 0',
                color: '#6b5845',
                fontSize: 14,
                lineHeight: 1.7,
                wordBreak: 'break-all',
              }}
            >
              {user?.email ||
                session.user.email ||
                '이메일 정보 없음'}
            </p>

            <div
              style={{
                display: 'grid',
                gap: 9,
                marginTop: 20,
              }}
            >
              <Link
                href="/dashboard/library"
                style={sideLinkStyle()}
              >
                <strong>내 책장</strong>
                <span>
                  만든 원고와 책을 확인합니다.
                </span>
              </Link>

              <Link
                href="/dashboard/family"
                style={sideLinkStyle()}
              >
                <strong>가족 공간</strong>
                <span>
                  가족과 사진과 이야기를 함께
                  모읍니다.
                </span>
              </Link>

              <Link
                href="/dashboard/account"
                style={sideLinkStyle()}
              >
                <strong>계정 관리</strong>
                <span>
                  이름과 계정 정보를 확인합니다.
                </span>
              </Link>

              {user?.role === 'ADMIN' ? (
                <Link
                  href="/admin"
                  style={adminLinkStyle()}
                >
                  <strong>관리자 화면</strong>
                  <span>
                    회원과 상담 운영 현황을
                    관리합니다.
                  </span>
                </Link>
              ) : null}
            </div>

            <div
              style={{
                marginTop: 23,
                paddingTop: 19,
                borderTop:
                  '1px solid rgba(91, 66, 43, 0.16)',
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: '#4c3a2a',
                  fontSize: 15,
                  lineHeight: 1.75,
                  fontWeight: 800,
                }}
              >
                완벽한 글보다 지금 기억나는
                한 문장을 남기는 것이 더
                중요합니다.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function StepCard({
  number,
  title,
  description,
  count,
  requirement,
  completed,
  ready = true,
  href,
  buttonLabel,
}: {
  number: number;
  title: string;
  description: string;
  count: string;
  requirement: string;
  completed: boolean;
  ready?: boolean;
  href: string;
  buttonLabel: string;
}) {
  return (
    <article
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 285,
        padding: 22,
        borderRadius: 23,
        border: completed
          ? '1px solid #9dcca4'
          : ready
            ? '1px solid #d6b778'
            : '1px solid rgba(91, 66, 43, 0.12)',
        background: completed
          ? '#edf8ee'
          : ready
            ? '#fff7e6'
            : '#ffffff',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <span
          style={{
            width: 39,
            height: 39,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 999,
            background: completed
              ? '#3e5f3a'
              : '#33271d',
            color: '#fff8ec',
            fontSize: 14,
            fontWeight: 900,
          }}
        >
          {number}
        </span>

        <span
          style={{
            padding: '5px 9px',
            borderRadius: 999,
            background: completed
              ? '#dceddf'
              : '#f1eee8',
            color: completed
              ? '#2f6b38'
              : '#6b5845',
            fontSize: 10,
            fontWeight: 900,
          }}
        >
          {completed ? '준비됨' : '진행 중'}
        </span>
      </div>

      <h3
        style={{
          margin: '16px 0 0',
          color: '#33271d',
          fontSize: 21,
          lineHeight: 1.4,
        }}
      >
        {title}
      </h3>

      <p
        style={{
          margin: '7px 0 0',
          color: '#6b5845',
          fontSize: 14,
          lineHeight: 1.65,
        }}
      >
        {description}
      </p>

      <div
        style={{
          marginTop: 16,
          padding: 13,
          borderRadius: 15,
          background:
            'rgba(91, 66, 43, 0.055)',
        }}
      >
        <strong
          style={{
            display: 'block',
            color: '#33271d',
            fontSize: 22,
          }}
        >
          {count}
        </strong>

        <span
          style={{
            display: 'block',
            marginTop: 4,
            color: '#7b6a58',
            fontSize: 11,
          }}
        >
          {requirement}
        </span>
      </div>

      <Link
        href={href}
        style={{
          ...stepButtonStyle(),
          marginTop: 'auto',
          transform: 'translateY(12px)',
        }}
      >
        {buttonLabel}
      </Link>
    </article>
  );
}

function getNextAction({
  photoCount,
  storyCount,
  bookCount,
  activeProductionBookCount,
}: {
  photoCount: number;
  storyCount: number;
  bookCount: number;
  activeProductionBookCount: number;
}) {
  if (photoCount < REQUIRED_PHOTO_COUNT) {
    return {
      title: `사진을 ${
        REQUIRED_PHOTO_COUNT - photoCount
      }장 더 모아보세요.`,
      description:
        '사진이 모이면 시간의 흐름과 책의 장면을 구성하기 쉬워집니다.',
      href: '/dashboard/timeline',
      buttonLabel: '사진 모으기',
    };
  }

  if (storyCount < REQUIRED_STORY_COUNT) {
    return {
      title: `이야기를 ${
        REQUIRED_STORY_COUNT - storyCount
      }개 더 남겨보세요.`,
      description:
        '사진 속 상황과 사람에 대한 이야기가 책의 문장이 됩니다.',
      href: '/dashboard/interview',
      buttonLabel: '이야기 남기기',
    };
  }

   if (bookCount === 0) {
    return {
      title: '책 원고를 만들 준비가 되었습니다.',
      description:
        '지금까지 모은 사진과 이야기를 바탕으로 첫 번째 책 원고를 만들어보세요.',
      href: '/dashboard/book',
      buttonLabel: '첫 책 원고 만들기',
    };
  }

  if (activeProductionBookCount > 0) {
    return {
      title: `현재 ${activeProductionBookCount}권의 제작 상담이 진행 중입니다.`,
      description:
        '내 책장에서 상담 접수, 고객 연락, 제작 상담 진행 상태와 최근 변경 내용을 확인해보세요.',
      href: '/dashboard/library',
      buttonLabel: '상담 진행 현황 보기',
    };
  }

  return {
    title: '내 책장에서 원고를 확인해보세요.',
    description:
      '만든 원고를 읽어보고 필요한 부분을 보완하거나 제작 상담을 신청할 수 있습니다.',
    href: '/dashboard/library',
    buttonLabel: '내 책장 보기',
  };
}

function getMemoryTypeLabel(
  type: string,
) {
  if (type === 'PHOTO') {
    return '사진';
  }

  if (type === 'TEXT') {
    return '이야기';
  }

  if (type === 'VOICE') {
    return '음성';
  }

  if (type === 'VIDEO') {
    return '영상';
  }

  return '기록';
}

function memoryTypeBadgeStyle(
  type: string,
): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 24,
    padding: '0 8px',
    borderRadius: 999,
    background:
      type === 'PHOTO'
        ? '#fff1c7'
        : '#e4f2ff',
    color:
      type === 'PHOTO'
        ? '#83540d'
        : '#245d8c',
    fontSize: 10,
    fontWeight: 900,
  };
}

function heroPrimaryButtonStyle(): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    padding: '0 21px',
    borderRadius: 999,
    background: '#f0c36a',
    color: '#2b2118',
    fontSize: 14,
    fontWeight: 900,
    textDecoration: 'none',
    textAlign: 'center',
  };
}

function heroSecondaryButtonStyle(): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    padding: '0 21px',
    borderRadius: 999,
    border:
      '1px solid rgba(255,255,255,0.42)',
    background: 'transparent',
    color: '#fff8ec',
    fontSize: 14,
    fontWeight: 900,
    textDecoration: 'none',
    textAlign: 'center',
  };
}

function stepButtonStyle(): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
    padding: '0 14px',
    borderRadius: 999,
    background: '#33271d',
    color: '#fff8ec',
    fontSize: 12,
    fontWeight: 900,
    textDecoration: 'none',
  };
}

function statCardStyle(): CSSProperties {
  return {
    display: 'block',
    padding: 22,
    borderRadius: 24,
    background: '#fffaf1',
    border:
      '1px solid rgba(91, 66, 43, 0.12)',
    boxShadow:
      '0 10px 25px rgba(91, 66, 43, 0.07)',
    color: 'inherit',
    textDecoration: 'none',
  };
}

function smallButtonStyle(): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 35,
    padding: '0 12px',
    borderRadius: 999,
    border:
      '1px solid rgba(91, 66, 43, 0.22)',
    color: '#7b4f2a',
    fontSize: 12,
    fontWeight: 900,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  };
}

function recordLinkStyle(): CSSProperties {
  return {
    flexShrink: 0,
    color: '#9b6d2f',
    fontSize: 12,
    fontWeight: 900,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  };
}

function sideLinkStyle(): CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: 14,
    borderRadius: 16,
    border:
      '1px solid rgba(91, 66, 43, 0.12)',
    background:
      'rgba(255, 255, 255, 0.35)',
    color: '#33271d',
    textDecoration: 'none',
    fontSize: 13,
    lineHeight: 1.5,
  };
}

function adminLinkStyle(): CSSProperties {
  return {
    ...sideLinkStyle(),
    background: '#33271d',
    color: '#fff8ec',
    border: '1px solid #33271d',
  };
}

function formatDate(
  value: Date | string,
) {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return '-';
  }

  return new Intl.DateTimeFormat(
    'ko-KR',
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    },
  ).format(date);
}