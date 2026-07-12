import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { CSSProperties } from 'react';

export default async function AdminDashboard() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const adminUser = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      role: true,
    },
  });

  if (adminUser?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const [
    totalUsers,
    totalMemories,
    totalFamilies,
    totalBooks,
    totalProductionRequests,
    requestedProductionRequests,
    activeProductionRequests,
    completedProductionRequests,
    recentUsers,
    recentProductionRequests,
    recentBooks,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.memory.count(),
    prisma.family.count(),
    prisma.book.count(),
    prisma.bookProductionRequest.count(),

    prisma.bookProductionRequest.count({
      where: {
        status: 'REQUESTED',
      },
    }),

    prisma.bookProductionRequest.count({
      where: {
        status: {
          in: ['CONTACTED', 'IN_PROGRESS'],
        },
      },
    }),

    prisma.bookProductionRequest.count({
      where: {
        status: 'COMPLETED',
      },
    }),

    prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        role: true,
      },
    }),

    prisma.bookProductionRequest.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
      select: {
        id: true,
        bookId: true,
        name: true,
        phone: true,
        email: true,
        status: true,
        createdAt: true,
      },
    }),

    prisma.book.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
      select: {
        id: true,
        authorId: true,
        title: true,
        type: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  const requestBookIds = Array.from(
    new Set(
      recentProductionRequests.map((request) => request.bookId),
    ),
  );

  const recentBookAuthorIds = Array.from(
    new Set(recentBooks.map((book) => book.authorId)),
  );

  const [requestBooks, recentBookAuthors] = await Promise.all([
    requestBookIds.length
      ? prisma.book.findMany({
          where: {
            id: {
              in: requestBookIds,
            },
          },
          select: {
            id: true,
            title: true,
          },
        })
      : Promise.resolve([]),

    recentBookAuthorIds.length
      ? prisma.user.findMany({
          where: {
            id: {
              in: recentBookAuthorIds,
            },
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const requestBookMap = new Map(
    requestBooks.map((book) => [book.id, book]),
  );

  const authorMap = new Map(
    recentBookAuthors.map((author) => [author.id, author]),
  );

  const stats = [
    {
      label: '전체 회원',
      value: totalUsers,
      unit: '명',
      color: 'var(--wine)',
    },
    {
      label: '저장된 기록',
      value: totalMemories,
      unit: '개',
      color: 'var(--gold)',
    },
    {
      label: '가족 공간',
      value: totalFamilies,
      unit: '개',
      color: '#2e3f52',
    },
    {
      label: '책 원고',
      value: totalBooks,
      unit: '권',
      color: '#7b4f2a',
    },
    {
      label: '전체 제작 상담',
      value: totalProductionRequests,
      unit: '건',
      color: '#6d3b1f',
    },
    {
      label: '신규 상담 접수',
      value: requestedProductionRequests,
      unit: '건',
      color: '#9a6a24',
    },
    {
      label: '상담 처리 중',
      value: activeProductionRequests,
      unit: '건',
      color: '#2e3f52',
    },
    {
      label: '상담 완료',
      value: completedProductionRequests,
      unit: '건',
      color: '#3e5f3a',
    },
  ];

  return (
    <main>
      <div className="runninghead">
        <span className="runninghead__chapter">ADMIN</span>
        <span className="runninghead__rule" />
        <span style={{ color: 'var(--ink-soft)' }}>
          관리자 대시보드
        </span>
      </div>

      <section
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20,
          marginBottom: 32,
        }}
      >
        <div>
          <h1
            className="dash-greeting"
            style={{
              marginBottom: 10,
            }}
          >
            관리자 대시보드
          </h1>

          <p
            style={{
              margin: 0,
              maxWidth: 720,
              color: 'var(--ink-soft)',
              fontSize: 15,
              lineHeight: 1.8,
            }}
          >
            달동네 출판사의 회원, 기록, 가족 공간, 책 원고와
            제작 상담 현황을 한눈에 확인합니다.
          </p>
        </div>

        <Link
          href="/admin/production-requests"
          style={primaryButtonStyle()}
        >
          제작 상담 관리
          {requestedProductionRequests > 0
            ? ` (${requestedProductionRequests})`
            : ''}
        </Link>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(175px, 1fr))',
          gap: 16,
          marginBottom: 34,
        }}
      >
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="dash-card"
            style={{
              textAlign: 'center',
              minWidth: 0,
            }}
          >
            <p
              style={{
                margin: '0 0 5px',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 36,
                lineHeight: 1.2,
                color: stat.color,
              }}
            >
              {stat.value.toLocaleString()}
            </p>

            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--ink-faint)',
                letterSpacing: '.05em',
              }}
            >
              {stat.label} ({stat.unit})
            </p>
          </article>
        ))}
      </section>

      <section
        className="dash-card"
        style={{
          marginBottom: 28,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <p className="dash-card__label">운영 바로가기</p>

            <p
              style={{
                margin: '8px 0 0',
                color: 'var(--ink-soft)',
                fontSize: 14,
              }}
            >
              자주 사용하는 관리자 메뉴로 이동합니다.
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            marginTop: 18,
          }}
        >
          <Link
            href="/admin/production-requests"
            style={quickLinkStyle()}
          >
            <strong>제작 상담 관리</strong>
            <span>상담 접수와 진행 상태 확인</span>
          </Link>

          <Link href="/admin/families" style={quickLinkStyle()}>
  <strong>가족 공간 관리</strong>
  <span>가족 공간과 참여 회원 확인</span>
</Link>

<Link href="/admin/books" style={quickLinkStyle()}>
  <strong>책 관리</strong>
  <span>전체 책 원고와 제작 상태 확인</span>
</Link>

<Link href="/dashboard" style={quickLinkStyle()}>
  <strong>사용자 화면</strong>
  <span>일반 대시보드 화면 확인</span>
</Link>

          <Link href="/dashboard" style={quickLinkStyle()}>
            <strong>사용자 화면</strong>
            <span>일반 대시보드 화면 확인</span>
          </Link>
        </div>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 24,
          marginBottom: 28,
        }}
      >
        <article className="dash-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <p className="dash-card__label">
                최근 제작 상담
              </p>

              <p
                style={{
                  margin: '8px 0 0',
                  fontSize: 13,
                  color: 'var(--ink-soft)',
                }}
              >
                최근 접수된 상담 5건
              </p>
            </div>

            <Link
              href="/admin/production-requests"
              style={smallButtonStyle()}
            >
              전체 보기
            </Link>
          </div>

          {recentProductionRequests.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gap: 10,
                marginTop: 18,
              }}
            >
              {recentProductionRequests.map((request) => {
                const book = requestBookMap.get(request.bookId);

                return (
                  <Link
                    key={request.id}
                    href={`/admin/books/${request.bookId}`}
                    style={listItemStyle()}
                  >
                    <div
                      style={{
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <span
                          style={statusBadgeStyle(request.status)}
                        >
                          {getProductionRequestStatusLabel(
                            request.status,
                          )}
                        </span>

                        <span
                          style={{
                            fontSize: 12,
                            color: 'var(--ink-faint)',
                          }}
                        >
                          {formatDate(request.createdAt)}
                        </span>
                      </div>

                      <strong
                        style={{
                          display: 'block',
                          marginTop: 8,
                          color: 'var(--ink)',
                          fontSize: 15,
                          lineHeight: 1.45,
                          wordBreak: 'break-word',
                        }}
                      >
                        {book?.title || '책 제목 확인 필요'}
                      </strong>

                      <span
                        style={{
                          display: 'block',
                          marginTop: 5,
                          color: 'var(--ink-soft)',
                          fontSize: 13,
                          lineHeight: 1.5,
                          wordBreak: 'break-all',
                        }}
                      >
                        {request.name || '이름 없음'} ·{' '}
                        {request.phone ||
                          request.email ||
                          '연락처 없음'}
                      </span>
                    </div>

                    <span
                      style={{
                        flexShrink: 0,
                        color: 'var(--wine)',
                        fontSize: 13,
                        fontWeight: 900,
                      }}
                    >
                      상세
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyBox text="아직 제작 상담 신청이 없습니다." />
          )}
        </article>

        <article className="dash-card">
          <div>
            <p className="dash-card__label">
              최근 등록된 책
            </p>

            <p
              style={{
                margin: '8px 0 0',
                fontSize: 13,
                color: 'var(--ink-soft)',
              }}
            >
              최근 생성된 책 원고 5권
            </p>
          </div>

          {recentBooks.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gap: 10,
                marginTop: 18,
              }}
            >
              {recentBooks.map((book) => {
                const author = authorMap.get(book.authorId);

                return (
                  <Link
                    key={book.id}
                    href={`/admin/books/${book.id}`}
                    style={listItemStyle()}
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
                          gap: 8,
                        }}
                      >
                        <span
                          style={bookStatusBadgeStyle(book.status)}
                        >
                          {getBookStatusLabel(book.status)}
                        </span>

                        <span
                          style={{
                            fontSize: 12,
                            color: 'var(--ink-faint)',
                          }}
                        >
                          {getBookTypeLabel(book.type)}
                        </span>
                      </div>

                      <strong
                        style={{
                          display: 'block',
                          marginTop: 8,
                          color: 'var(--ink)',
                          fontSize: 15,
                          lineHeight: 1.45,
                          wordBreak: 'break-word',
                        }}
                      >
                        {book.title}
                      </strong>

                      <span
                        style={{
                          display: 'block',
                          marginTop: 5,
                          color: 'var(--ink-soft)',
                          fontSize: 13,
                          lineHeight: 1.5,
                          wordBreak: 'break-all',
                        }}
                      >
                        {author?.name ||
                          author?.email ||
                          '작성자 확인 필요'}{' '}
                        · {formatDate(book.createdAt)}
                      </span>
                    </div>

                    <span
                      style={{
                        flexShrink: 0,
                        color: 'var(--wine)',
                        fontSize: 13,
                        fontWeight: 900,
                      }}
                    >
                      상세
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyBox text="아직 등록된 책이 없습니다." />
          )}
        </article>
      </section>

      <section className="dash-card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <p className="dash-card__label">
              최근 가입 회원
            </p>

            <p
              style={{
                margin: '8px 0 0',
                fontSize: 13,
                color: 'var(--ink-soft)',
              }}
            >
              최근 가입한 회원 5명
            </p>
          </div>

          <Link href="/admin/users" style={smallButtonStyle()}>
            회원 관리
          </Link>
        </div>

        {recentUsers.length > 0 ? (
          <div
            style={{
              overflowX: 'auto',
              marginTop: 18,
            }}
          >
            <table
              style={{
                width: '100%',
                minWidth: 600,
                borderCollapse: 'collapse',
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom:
                      '1px solid rgba(34, 28, 22, 0.1)',
                  }}
                >
                  {['이름', '이메일', '권한', '가입일'].map(
                    (heading) => (
                      <th
                        key={heading}
                        style={{
                          padding: '9px 12px',
                          textAlign: 'left',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          letterSpacing: '.05em',
                          color: 'var(--ink-faint)',
                          fontWeight: 400,
                        }}
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>

              <tbody>
                {recentUsers.map((user) => (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom:
                        '1px solid rgba(34, 28, 22, 0.06)',
                    }}
                  >
                    <td
                      style={{
                        padding: '11px 12px',
                        fontSize: 14,
                      }}
                    >
                      {user.name || '-'}
                    </td>

                    <td
                      style={{
                        padding: '11px 12px',
                        fontSize: 14,
                        color: 'var(--ink-soft)',
                        wordBreak: 'break-all',
                      }}
                    >
                      {user.email || '-'}
                    </td>

                    <td
                      style={{
                        padding: '11px 12px',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          padding: '4px 9px',
                          borderRadius: 999,
                          background:
                            user.role === 'ADMIN'
                              ? 'var(--wine)'
                              : 'rgba(34, 28, 22, 0.08)',
                          color:
                            user.role === 'ADMIN'
                              ? 'var(--cream)'
                              : 'var(--ink-faint)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          letterSpacing: '.04em',
                        }}
                      >
                        {user.role === 'ADMIN'
                          ? '관리자'
                          : '일반 회원'}
                      </span>
                    </td>

                    <td
                      style={{
                        padding: '11px 12px',
                        fontSize: 13,
                        color: 'var(--ink-faint)',
                      }}
                    >
                      {formatDate(user.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyBox text="아직 가입한 회원이 없습니다." />
        )}
      </section>
    </main>
  );
}

function primaryButtonStyle(): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    padding: '0 20px',
    borderRadius: 999,
    border: '1px solid var(--wine)',
    background: 'var(--wine)',
    color: 'var(--cream)',
    fontSize: 14,
    fontWeight: 900,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  };
}

function smallButtonStyle(): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 34,
    padding: '0 12px',
    borderRadius: 999,
    border: '1px solid rgba(34, 28, 22, 0.15)',
    background: 'transparent',
    color: 'var(--wine)',
    fontSize: 12,
    fontWeight: 900,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  };
}

function quickLinkStyle(): CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    minHeight: 86,
    padding: 16,
    borderRadius: 18,
    border: '1px solid rgba(34, 28, 22, 0.1)',
    background: 'rgba(255, 255, 255, 0.35)',
    color: 'var(--ink)',
    textDecoration: 'none',
    lineHeight: 1.5,
  };
}

function listItemStyle(): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    padding: 14,
    borderRadius: 16,
    border: '1px solid rgba(34, 28, 22, 0.08)',
    background: 'rgba(255, 255, 255, 0.3)',
    color: 'inherit',
    textDecoration: 'none',
  };
}

function statusBadgeStyle(status: string): CSSProperties {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 24,
    padding: '0 8px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 900,
  };

  if (status === 'REQUESTED') {
    return {
      ...base,
      background: '#fff1c7',
      color: '#83540d',
    };
  }

  if (status === 'CONTACTED') {
    return {
      ...base,
      background: '#e4f2ff',
      color: '#245d8c',
    };
  }

  if (status === 'IN_PROGRESS') {
    return {
      ...base,
      background: '#efe6ff',
      color: '#62438a',
    };
  }

  if (status === 'COMPLETED') {
    return {
      ...base,
      background: '#e3f4e5',
      color: '#2f6b38',
    };
  }

  if (status === 'CANCELED') {
    return {
      ...base,
      background: '#f2eeee',
      color: '#776868',
    };
  }

  return {
    ...base,
    background: 'rgba(34, 28, 22, 0.08)',
    color: 'var(--ink-faint)',
  };
}

function bookStatusBadgeStyle(status: string): CSSProperties {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 24,
    padding: '0 8px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 900,
  };

  if (status === 'DRAFT') {
    return {
      ...base,
      background: '#f1eee8',
      color: '#6b5a46',
    };
  }

  if (status === 'IN_PRODUCTION') {
    return {
      ...base,
      background: '#fff1c7',
      color: '#83540d',
    };
  }

  if (status === 'PUBLISHED') {
    return {
      ...base,
      background: '#e3f4e5',
      color: '#2f6b38',
    };
  }

  return {
    ...base,
    background: 'rgba(34, 28, 22, 0.08)',
    color: 'var(--ink-faint)',
  };
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div
      style={{
        marginTop: 18,
        padding: 22,
        borderRadius: 18,
        border: '1px dashed rgba(34, 28, 22, 0.18)',
        color: 'var(--ink-soft)',
        fontSize: 14,
        lineHeight: 1.7,
        textAlign: 'center',
      }}
    >
      {text}
    </div>
  );
}

function getProductionRequestStatusLabel(status: string) {
  if (status === 'REQUESTED') return '상담 접수';
  if (status === 'CONTACTED') return '고객 연락';
  if (status === 'IN_PROGRESS') return '상담 진행';
  if (status === 'COMPLETED') return '상담 완료';
  if (status === 'CANCELED') return '취소';

  return '상태 확인';
}

function getBookStatusLabel(status: string) {
  if (status === 'DRAFT') return '원고 초안';
  if (status === 'IN_PRODUCTION') return '제작 준비';
  if (status === 'PUBLISHED') return '완성';

  return '상태 확인';
}

function getBookTypeLabel(type: string) {
  if (type === 'LIFE_BOOK') return '부모님 인생책';
  if (type === 'FAMILY_BOOK') return '가족 이야기책';
  if (type === 'COUPLE_BOOK') return '부부 이야기책';
  if (type === 'BABY_BOOK') return '성장 기록책';
  if (type === 'TRAVEL_BOOK') return '여행 기록책';
  if (type === 'AI_MOVIE') return 'AI 영상';

  return '기타';
}

function formatDate(value: Date | string) {
  const date =
    value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}