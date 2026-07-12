import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { CSSProperties } from 'react';

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    page?: string;
  }>;
};

type RoleAction = (
  formData: FormData,
) => Promise<void>;

const PAGE_SIZE = 20;

export default async function AdminUsersPage({
  searchParams,
}: PageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const adminUser =
    await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        role: true,
      },
    });

  if (adminUser?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const resolvedSearchParams =
    await searchParams;

  const searchQuery = String(
    resolvedSearchParams?.q || '',
  )
    .trim()
    .slice(0, 100);

  const requestedPage = normalizePage(
    resolvedSearchParams?.page,
  );

  const userWhere: Prisma.UserWhereInput =
    searchQuery
      ? {
          OR: [
            {
              name: {
                contains: searchQuery,
              },
            },
            {
              email: {
                contains: searchQuery,
              },
            },
          ],
        }
      : {};

  const [
    filteredUserCount,
    totalUserCount,
    adminCount,
    totalMemoryCount,
    totalBookCount,
    totalFamilyMembershipCount,
  ] = await Promise.all([
    prisma.user.count({
      where: userWhere,
    }),

    prisma.user.count(),

    prisma.user.count({
      where: {
        role: 'ADMIN',
      },
    }),

    prisma.memory.count(),

    prisma.book.count(),

    prisma.familyMember.count(),
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredUserCount / PAGE_SIZE,
    ),
  );

  const currentPage = Math.min(
    requestedPage,
    totalPages,
  );

  const skip =
    (currentPage - 1) * PAGE_SIZE;

  const users =
    await prisma.user.findMany({
      where: userWhere,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: PAGE_SIZE,
      include: {
        _count: {
          select: {
            memories: true,
            books: true,
          },
        },
      },
    });

  const familyMemberCounts =
    users.length > 0
      ? await prisma.familyMember.groupBy({
          by: ['userId'],
          where: {
            userId: {
              in: users.map(
                (user) => user.id,
              ),
            },
          },
          _count: {
            _all: true,
          },
        })
      : [];

  const familyCountMap = new Map(
    familyMemberCounts.map((item) => [
      item.userId,
      item._count._all,
    ]),
  );

  const firstVisibleUser =
    filteredUserCount === 0
      ? 0
      : skip + 1;

  const lastVisibleUser = Math.min(
    skip + users.length,
    filteredUserCount,
  );

  const pageNumbers = getPageNumbers(
    currentPage,
    totalPages,
  );

  async function toggleAdmin(
    formData: FormData,
  ) {
    'use server';

    const currentSession = await auth();

    if (!currentSession?.user?.id) {
      return;
    }

    const actingUser =
      await prisma.user.findUnique({
        where: {
          id: currentSession.user.id,
        },
        select: {
          id: true,
          role: true,
        },
      });

    if (actingUser?.role !== 'ADMIN') {
      return;
    }

    const targetId = String(
      formData.get('userId') || '',
    ).trim();

    if (
      !targetId ||
      targetId === currentSession.user.id
    ) {
      return;
    }

    const targetUser =
      await prisma.user.findUnique({
        where: {
          id: targetId,
        },
        select: {
          id: true,
          role: true,
        },
      });

    if (!targetUser) {
      return;
    }

    if (targetUser.role === 'ADMIN') {
      const currentAdminCount =
        await prisma.user.count({
          where: {
            role: 'ADMIN',
          },
        });

      if (currentAdminCount <= 1) {
        return;
      }
    }

    await prisma.user.update({
      where: {
        id: targetUser.id,
      },
      data: {
        role:
          targetUser.role === 'ADMIN'
            ? 'USER'
            : 'ADMIN',
      },
    });

    revalidatePath('/admin/users');
    revalidatePath('/admin');
  }

  return (
    <main>
      <style>{`
        .admin-users-desktop {
          display: block;
        }

        .admin-users-mobile {
          display: none;
        }

        @media (max-width: 860px) {
          .admin-users-desktop {
            display: none;
          }

          .admin-users-mobile {
            display: grid;
          }
        }
      `}</style>

      <div className="runninghead">
        <span className="runninghead__chapter">
          ADMIN
        </span>

        <span className="runninghead__rule" />

        <span
          style={{
            color: 'var(--ink-soft)',
          }}
        >
          회원 관리
        </span>
      </div>

      <section
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent:
            'space-between',
          flexWrap: 'wrap',
          gap: 18,
          marginBottom: 28,
        }}
      >
        <div>
          <h1
            className="dash-greeting"
            style={{
              marginBottom: 10,
            }}
          >
            회원 관리
          </h1>

          <p
            style={{
              margin: 0,
              maxWidth: 720,
              color: 'var(--ink-soft)',
              fontSize: 15,
              lineHeight: 1.75,
            }}
          >
            전체 회원의 기록, 책, 가족
            공간 참여 현황과 관리자 권한을
            관리합니다.
          </p>
        </div>

        <Link
          href="/admin"
          style={backButtonStyle()}
        >
          관리자 홈
        </Link>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 14,
          marginBottom: 28,
        }}
      >
        <SummaryCard
          label="전체 회원"
          value={totalUserCount}
          unit="명"
          color="var(--wine)"
        />

        <SummaryCard
          label="관리자"
          value={adminCount}
          unit="명"
          color="#7b4f2a"
        />

        <SummaryCard
          label="전체 기록"
          value={totalMemoryCount}
          unit="개"
          color="var(--gold)"
        />

        <SummaryCard
          label="전체 책"
          value={totalBookCount}
          unit="권"
          color="#2e3f52"
        />

        <SummaryCard
          label="가족 공간 참여"
          value={totalFamilyMembershipCount}
          unit="건"
          color="#3e5f3a"
        />

        <SummaryCard
          label="현재 검색 결과"
          value={filteredUserCount}
          unit="명"
          color="#62438a"
        />
      </section>

      <section
        className="dash-card"
        style={{
          marginBottom: 22,
        }}
      >
        <form
          action="/admin/users"
          method="get"
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <label
            style={{
              display: 'grid',
              flex: '1 1 320px',
              gap: 7,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 900,
                color:
                  'var(--ink-soft)',
              }}
            >
              회원 검색
            </span>

            <input
              type="search"
              name="q"
              defaultValue={searchQuery}
              placeholder="회원 이름 또는 이메일"
              maxLength={100}
              style={searchInputStyle()}
            />
          </label>

          <button
            type="submit"
            style={searchButtonStyle()}
          >
            검색 적용
          </button>

          {searchQuery ? (
            <Link
              href="/admin/users"
              style={secondaryButtonStyle()}
            >
              검색 초기화
            </Link>
          ) : null}
        </form>
      </section>

      <section
        className="dash-card"
        style={{
          padding: 0,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent:
              'space-between',
            flexWrap: 'wrap',
            gap: 12,
            padding: '20px 22px',
            borderBottom:
              '1px solid rgba(34, 28, 22, 0.08)',
          }}
        >
          <div>
            <p
              className="dash-card__label"
              style={{
                margin: 0,
              }}
            >
              회원 목록
            </p>

            <p
              style={{
                margin: '8px 0 0',
                color:
                  'var(--ink-soft)',
                fontSize: 13,
                lineHeight: 1.65,
              }}
            >
              검색 결과{' '}
              {filteredUserCount.toLocaleString()}
              명
              {' · '}
              {firstVisibleUser}–
              {lastVisibleUser}번째 표시
              {searchQuery
                ? ` · 검색어 "${searchQuery}"`
                : ''}
            </p>

            <p
              style={{
                margin: '5px 0 0',
                color:
                  'var(--ink-faint)',
                fontSize: 11,
                lineHeight: 1.6,
              }}
            >
              본인의 관리자 권한은 직접
              변경할 수 없으며 마지막 관리자
              1명의 권한은 해제할 수 없습니다.
            </p>
          </div>

          {searchQuery ? (
            <Link
              href="/admin/users"
              style={secondaryButtonStyle()}
            >
              전체 회원 보기
            </Link>
          ) : null}
        </div>

        {users.length > 0 ? (
          <>
            <div className="admin-users-desktop">
              <div
                style={{
                  overflowX: 'auto',
                }}
              >
                <table
                  style={{
                    width: '100%',
                    minWidth: 1040,
                    borderCollapse:
                      'collapse',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background:
                          'var(--paper-shade)',
                        borderBottom:
                          '1px solid rgba(34, 28, 22, 0.1)',
                      }}
                    >
                      {[
                        '회원',
                        '이메일',
                        '기록',
                        '책',
                        '가족 공간',
                        '권한',
                        '가입일',
                        '최근 수정',
                        '관리',
                      ].map((heading) => (
                        <th
                          key={heading}
                          style={tableHeadingStyle()}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {users.map((user) => {
                      const isSelf =
                        user.id ===
                        session.user.id;

                      const isLastAdmin =
                        user.role ===
                          'ADMIN' &&
                        adminCount <= 1;

                      return (
                        <tr
                          key={user.id}
                          style={{
                            borderBottom:
                              '1px solid rgba(34, 28, 22, 0.06)',
                          }}
                        >
                          <td
                            style={{
                              padding:
                                '13px 14px',
                              minWidth: 170,
                            }}
                          >
                            <UserIdentity
                              name={user.name}
                              email={user.email}
                              image={user.image}
                              isSelf={isSelf}
                            />
                          </td>

                          <td
                            style={{
                              padding:
                                '13px 14px',
                              minWidth: 200,
                              fontSize: 13,
                              color:
                                'var(--ink-soft)',
                              wordBreak:
                                'break-all',
                            }}
                          >
                            {user.email ||
                              '이메일 없음'}
                          </td>

                          <td
                            style={numberCellStyle()}
                          >
                            {user._count.memories.toLocaleString()}
                          </td>

                          <td
                            style={numberCellStyle()}
                          >
                            {user._count.books.toLocaleString()}
                          </td>

                          <td
                            style={numberCellStyle()}
                          >
                            {(
                              familyCountMap.get(
                                user.id,
                              ) ?? 0
                            ).toLocaleString()}
                          </td>

                          <td
                            style={{
                              padding:
                                '13px 14px',
                            }}
                          >
                            <span
                              style={roleBadgeStyle(
                                user.role,
                              )}
                            >
                              {user.role ===
                              'ADMIN'
                                ? '관리자'
                                : '일반 회원'}
                            </span>
                          </td>

                          <td
                            style={dateCellStyle()}
                          >
                            {formatDate(
                              user.createdAt,
                            )}
                          </td>

                          <td
                            style={dateCellStyle()}
                          >
                            {formatDate(
                              user.updatedAt,
                            )}
                          </td>

                          <td
                            style={{
                              padding:
                                '13px 14px',
                              whiteSpace:
                                'nowrap',
                            }}
                          >
                            <RoleControl
                              userId={user.id}
                              role={user.role}
                              isSelf={isSelf}
                              isLastAdmin={
                                isLastAdmin
                              }
                              action={
                                toggleAdmin
                              }
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div
              className="admin-users-mobile"
              style={{
                gap: 12,
                padding: 12,
              }}
            >
              {users.map((user) => {
                const isSelf =
                  user.id ===
                  session.user.id;

                const isLastAdmin =
                  user.role === 'ADMIN' &&
                  adminCount <= 1;

                return (
                  <article
                    key={user.id}
                    style={{
                      borderRadius: 18,
                      border:
                        '1px solid rgba(34, 28, 22, 0.1)',
                      background:
                        'rgba(255, 255, 255, 0.32)',
                      padding: 16,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems:
                          'flex-start',
                        justifyContent:
                          'space-between',
                        gap: 12,
                      }}
                    >
                      <UserIdentity
                        name={user.name}
                        email={user.email}
                        image={user.image}
                        isSelf={isSelf}
                      />

                      <span
                        style={roleBadgeStyle(
                          user.role,
                        )}
                      >
                        {user.role === 'ADMIN'
                          ? '관리자'
                          : '일반 회원'}
                      </span>
                    </div>

                    <p
                      style={{
                        margin: '12px 0 0',
                        fontSize: 12,
                        color:
                          'var(--ink-soft)',
                        wordBreak:
                          'break-all',
                      }}
                    >
                      {user.email ||
                        '이메일 없음'}
                    </p>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          'repeat(3, minmax(0, 1fr))',
                        gap: 8,
                        marginTop: 13,
                      }}
                    >
                      <MobileInfo
                        label="기록"
                        value={`${user._count.memories.toLocaleString()}개`}
                      />

                      <MobileInfo
                        label="책"
                        value={`${user._count.books.toLocaleString()}권`}
                      />

                      <MobileInfo
                        label="가족 공간"
                        value={`${(
                          familyCountMap.get(
                            user.id,
                          ) ?? 0
                        ).toLocaleString()}곳`}
                      />
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          '1fr 1fr',
                        gap: 8,
                        marginTop: 12,
                      }}
                    >
                      <MobileInfo
                        label="가입일"
                        value={formatDate(
                          user.createdAt,
                        )}
                      />

                      <MobileInfo
                        label="최근 수정"
                        value={formatDate(
                          user.updatedAt,
                        )}
                      />
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent:
                          'flex-end',
                        marginTop: 14,
                        paddingTop: 13,
                        borderTop:
                          '1px solid rgba(34, 28, 22, 0.08)',
                      }}
                    >
                      <RoleControl
                        userId={user.id}
                        role={user.role}
                        isSelf={isSelf}
                        isLastAdmin={
                          isLastAdmin
                        }
                        action={toggleAdmin}
                      />
                    </div>
                  </article>
                );
              })}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageNumbers={pageNumbers}
              searchQuery={searchQuery}
            />
          </>
        ) : (
          <div
            style={{
              padding: 38,
              textAlign: 'center',
              color: 'var(--ink-soft)',
              fontSize: 14,
              lineHeight: 1.75,
            }}
          >
            현재 검색 조건에 맞는 회원이
            없습니다.
          </div>
        )}
      </section>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
}) {
  return (
    <article
      className="dash-card"
      style={{
        textAlign: 'center',
        minWidth: 0,
      }}
    >
      <p
        style={{
          margin: '0 0 5px',
          fontFamily:
            'var(--font-display)',
          fontWeight: 700,
          fontSize: 34,
          lineHeight: 1.2,
          color,
        }}
      >
        {value.toLocaleString()}
      </p>

      <p
        style={{
          margin: 0,
          fontFamily:
            'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '.05em',
          color: 'var(--ink-faint)',
        }}
      >
        {label} ({unit})
      </p>
    </article>
  );
}

function UserIdentity({
  name,
  email,
  image,
  isSelf,
}: {
  name: string | null;
  email: string | null;
  image: string | null;
  isSelf: boolean;
}) {
  const displayName =
    name || '이름 없음';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        minWidth: 0,
      }}
    >
      {image ? (
        <img
          src={image}
          alt={`${displayName} 프로필`}
          referrerPolicy="no-referrer"
          style={{
            width: 38,
            height: 38,
            flexShrink: 0,
            borderRadius: '50%',
            objectFit: 'cover',
            background:
              'var(--paper-shade)',
          }}
        />
      ) : (
        <div
          style={{
            width: 38,
            height: 38,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            background:
              'var(--paper-shade)',
            color:
              'var(--ink-faint)',
            fontSize: 14,
            fontWeight: 900,
          }}
        >
          {(name || email || '?')
            .charAt(0)
            .toUpperCase()}
        </div>
      )}

      <div
        style={{
          minWidth: 0,
        }}
      >
        <strong
          style={{
            display: 'block',
            fontSize: 14,
            color: 'var(--ink)',
            wordBreak: 'break-word',
          }}
        >
          {displayName}
        </strong>

        {isSelf ? (
          <span
            style={{
              display: 'block',
              marginTop: 3,
              fontSize: 10,
              color: 'var(--wine)',
              fontWeight: 900,
            }}
          >
            현재 로그인 계정
          </span>
        ) : null}
      </div>
    </div>
  );
}

function RoleControl({
  userId,
  role,
  isSelf,
  isLastAdmin,
  action,
}: {
  userId: string;
  role: string;
  isSelf: boolean;
  isLastAdmin: boolean;
  action: RoleAction;
}) {
  const disabled =
    isSelf || isLastAdmin;

  const disabledTitle = isSelf
    ? '본인의 관리자 권한은 이 화면에서 변경할 수 없습니다.'
    : isLastAdmin
      ? '마지막 관리자 1명의 권한은 해제할 수 없습니다.'
      : '';

  const label = isSelf
    ? '내 계정'
    : isLastAdmin
      ? '마지막 관리자'
      : role === 'ADMIN'
        ? '관리자 해제'
        : '관리자 지정';

  return (
    <form action={action}>
      <input
        type="hidden"
        name="userId"
        value={userId}
      />

      <button
        type="submit"
        disabled={disabled}
        title={disabledTitle}
        style={roleButtonStyle(
          role,
          disabled,
        )}
      >
        {label}
      </button>
    </form>
  );
}

function MobileInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        padding: '10px 7px',
        borderRadius: 12,
        background:
          'rgba(34, 28, 22, 0.05)',
        textAlign: 'center',
        minWidth: 0,
      }}
    >
      <span
        style={{
          display: 'block',
          fontSize: 10,
          color:
            'var(--ink-faint)',
        }}
      >
        {label}
      </span>

      <strong
        style={{
          display: 'block',
          marginTop: 4,
          fontSize: 12,
          color: 'var(--ink)',
          wordBreak: 'break-word',
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  pageNumbers,
  searchQuery,
}: {
  currentPage: number;
  totalPages: number;
  pageNumbers: number[];
  searchQuery: string;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="회원 목록 페이지 이동"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 7,
        padding: '20px 16px',
        borderTop:
          '1px solid rgba(34, 28, 22, 0.08)',
      }}
    >
      {currentPage > 1 ? (
        <Link
          href={buildUsersHref({
            searchQuery,
            page:
              currentPage - 1,
          })}
          style={pageButtonStyle(false)}
        >
          이전
        </Link>
      ) : (
        <span
          style={disabledPageButtonStyle()}
        >
          이전
        </span>
      )}

      {pageNumbers.map(
        (pageNumber) => (
          <Link
            key={pageNumber}
            href={buildUsersHref({
              searchQuery,
              page: pageNumber,
            })}
            aria-current={
              pageNumber ===
              currentPage
                ? 'page'
                : undefined
            }
            style={pageButtonStyle(
              pageNumber ===
                currentPage,
            )}
          >
            {pageNumber}
          </Link>
        ),
      )}

      {currentPage < totalPages ? (
        <Link
          href={buildUsersHref({
            searchQuery,
            page:
              currentPage + 1,
          })}
          style={pageButtonStyle(false)}
        >
          다음
        </Link>
      ) : (
        <span
          style={disabledPageButtonStyle()}
        >
          다음
        </span>
      )}
    </nav>
  );
}

function normalizePage(
  value: string | undefined,
) {
  const parsed = Number.parseInt(
    String(value || '1'),
    10,
  );

  if (
    !Number.isFinite(parsed) ||
    parsed < 1
  ) {
    return 1;
  }

  return parsed;
}

function getPageNumbers(
  currentPage: number,
  totalPages: number,
) {
  const start = Math.max(
    1,
    Math.min(
      currentPage - 2,
      totalPages - 4,
    ),
  );

  const end = Math.min(
    totalPages,
    start + 4,
  );

  const pages: number[] = [];

  for (
    let pageNumber = start;
    pageNumber <= end;
    pageNumber += 1
  ) {
    pages.push(pageNumber);
  }

  return pages;
}

function buildUsersHref({
  searchQuery = '',
  page = 1,
}: {
  searchQuery?: string;
  page?: number;
}) {
  const params =
    new URLSearchParams();

  if (searchQuery.trim()) {
    params.set(
      'q',
      searchQuery.trim(),
    );
  }

  if (page > 1) {
    params.set(
      'page',
      String(page),
    );
  }

  const query = params.toString();

  return query
    ? `/admin/users?${query}`
    : '/admin/users';
}

function searchInputStyle(): CSSProperties {
  return {
    width: '100%',
    minHeight: 42,
    padding: '0 14px',
    borderRadius: 12,
    border:
      '1px solid rgba(34, 28, 22, 0.18)',
    background:
      'rgba(255, 255, 255, 0.55)',
    color: 'var(--ink)',
    fontSize: 14,
    outline: 'none',
  };
}

function searchButtonStyle(): CSSProperties {
  return {
    minHeight: 42,
    padding: '0 18px',
    borderRadius: 999,
    border:
      '1px solid var(--wine)',
    background: 'var(--wine)',
    color: 'var(--cream)',
    fontSize: 13,
    fontWeight: 900,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };
}

function secondaryButtonStyle(): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 34,
    padding: '0 12px',
    borderRadius: 999,
    border:
      '1px solid rgba(34, 28, 22, 0.18)',
    background: 'transparent',
    color: 'var(--ink-soft)',
    fontSize: 12,
    fontWeight: 900,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  };
}

function backButtonStyle(): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    padding: '0 18px',
    borderRadius: 999,
    border:
      '1px solid var(--wine)',
    background: 'var(--wine)',
    color: 'var(--cream)',
    fontSize: 14,
    fontWeight: 900,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  };
}

function roleBadgeStyle(
  role: string,
): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 26,
    padding: '0 9px',
    borderRadius: 999,
    background:
      role === 'ADMIN'
        ? 'var(--wine)'
        : 'rgba(34, 28, 22, 0.08)',
    color:
      role === 'ADMIN'
        ? 'var(--cream)'
        : 'var(--ink-faint)',
    fontFamily:
      'var(--font-mono)',
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: '.04em',
    whiteSpace: 'nowrap',
  };
}

function roleButtonStyle(
  role: string,
  disabled: boolean,
): CSSProperties {
  return {
    minHeight: 32,
    padding: '0 11px',
    borderRadius: 999,
    border: disabled
      ? '1px solid rgba(34, 28, 22, 0.1)'
      : role === 'ADMIN'
        ? '1px solid #b96b64'
        : '1px solid rgba(34, 28, 22, 0.22)',
    background: disabled
      ? 'rgba(34, 28, 22, 0.04)'
      : role === 'ADMIN'
        ? '#fff0ee'
        : 'transparent',
    color: disabled
      ? 'var(--ink-faint)'
      : role === 'ADMIN'
        ? '#8b3730'
        : 'var(--ink-soft)',
    fontSize: 11,
    fontWeight: 900,
    cursor: disabled
      ? 'not-allowed'
      : 'pointer',
    opacity: disabled ? 0.6 : 1,
    whiteSpace: 'nowrap',
  };
}

function tableHeadingStyle(): CSSProperties {
  return {
    padding: '12px 14px',
    textAlign: 'left',
    fontFamily:
      'var(--font-mono)',
    fontSize: 11,
    letterSpacing: '.05em',
    color: 'var(--ink-faint)',
    fontWeight: 400,
    whiteSpace: 'nowrap',
  };
}

function numberCellStyle(): CSSProperties {
  return {
    padding: '13px 14px',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 900,
    color: 'var(--ink)',
  };
}

function dateCellStyle(): CSSProperties {
  return {
    padding: '13px 14px',
    fontSize: 12,
    color: 'var(--ink-faint)',
    whiteSpace: 'nowrap',
  };
}

function pageButtonStyle(
  active: boolean,
): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 34,
    minHeight: 34,
    padding: '0 10px',
    borderRadius: 999,
    border: active
      ? '1px solid var(--wine)'
      : '1px solid rgba(34, 28, 22, 0.16)',
    background: active
      ? 'var(--wine)'
      : 'transparent',
    color: active
      ? 'var(--cream)'
      : 'var(--ink-soft)',
    fontSize: 12,
    fontWeight: 900,
    textDecoration: 'none',
  };
}

function disabledPageButtonStyle(): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 34,
    minHeight: 34,
    padding: '0 10px',
    borderRadius: 999,
    border:
      '1px solid rgba(34, 28, 22, 0.08)',
    color: 'var(--ink-faint)',
    fontSize: 12,
    opacity: 0.5,
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