import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { CSSProperties } from 'react';

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    page?: string;
  }>;
};

const PAGE_SIZE = 20;

export default async function AdminFamiliesPage({
  searchParams,
}: PageProps) {
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

  const resolvedSearchParams = await searchParams;

  const searchQuery = String(
    resolvedSearchParams?.q || '',
  )
    .trim()
    .slice(0, 100);

  const requestedPage = normalizePage(
    resolvedSearchParams?.page,
  );

  const now = new Date();

  const familyWhere: Prisma.FamilyWhereInput =
    searchQuery
      ? {
          OR: [
            {
              name: {
                contains: searchQuery,
              },
            },
            {
              members: {
                some: {
                  user: {
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
                  },
                },
              },
            },
            {
              invitations: {
                some: {
                  email: {
                    contains: searchQuery,
                  },
                },
              },
            },
          ],
        }
      : {};

  const [
    filteredFamilyCount,
    totalFamilyCount,
    summaryFamilies,
    totalPendingInvitations,
  ] = await Promise.all([
    prisma.family.count({
      where: familyWhere,
    }),

    prisma.family.count(),

    prisma.family.findMany({
      select: {
        _count: {
          select: {
            members: true,
            memories: true,
            timeCapsules: true,
          },
        },
      },
    }),

    prisma.familyInvitation.count({
      where: {
        usedAt: null,
        expiresAt: {
          gte: now,
        },
      },
    }),
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredFamilyCount / PAGE_SIZE,
    ),
  );

  const currentPage = Math.min(
    requestedPage,
    totalPages,
  );

  const skip =
    (currentPage - 1) * PAGE_SIZE;

  const families = await prisma.family.findMany({
    where: familyWhere,
    orderBy: {
      createdAt: 'desc',
    },
    skip,
    take: PAGE_SIZE,
    include: {
      members: {
        orderBy: {
          joinedAt: 'asc',
        },
        select: {
          id: true,
          role: true,
          joinedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      invitations: {
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          email: true,
          role: true,
          expiresAt: true,
          usedAt: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          members: true,
          memories: true,
          timeCapsules: true,
          invitations: true,
        },
      },
    },
  });

  const totalMembers = summaryFamilies.reduce(
    (total, family) =>
      total + family._count.members,
    0,
  );

  const totalMemories = summaryFamilies.reduce(
    (total, family) =>
      total + family._count.memories,
    0,
  );

  const totalTimeCapsules =
    summaryFamilies.reduce(
      (total, family) =>
        total + family._count.timeCapsules,
      0,
    );

  const firstVisibleFamily =
    filteredFamilyCount === 0
      ? 0
      : skip + 1;

  const lastVisibleFamily = Math.min(
    skip + families.length,
    filteredFamilyCount,
  );

  const pageNumbers = getPageNumbers(
    currentPage,
    totalPages,
  );

  return (
    <main>
      <style>{`
        @media (max-width: 860px) {
          .admin-family-card-header {
            display: grid !important;
            grid-template-columns: 1fr !important;
          }

          .admin-family-counts {
            width: 100%;
            grid-template-columns:
              repeat(2, minmax(0, 1fr)) !important;
          }

          .admin-family-body {
            grid-template-columns: 1fr !important;
          }

          .admin-family-section {
            padding: 16px !important;
            border-right: 0 !important;
          }

          .admin-family-section:first-child {
            border-bottom:
              1px solid rgba(34, 28, 22, 0.08);
          }

          .admin-family-member-row,
          .admin-family-invitation-row {
            align-items: flex-start !important;
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
          가족 공간 관리
        </span>
      </div>

      <section
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
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
            가족 공간 관리
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
            가족 공간의 소유자, 참여 회원,
            기록, 타임캡슐과 초대 상태를
            확인합니다.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <Link
            href="/admin/users"
            style={secondaryHeaderButtonStyle()}
          >
            회원 관리
          </Link>

          <Link
            href="/admin"
            style={primaryButtonStyle()}
          >
            관리자 홈
          </Link>
        </div>
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
          label="가족 공간"
          value={totalFamilyCount}
          unit="개"
          color="var(--wine)"
        />

        <SummaryCard
          label="전체 구성원"
          value={totalMembers}
          unit="명"
          color="#2e3f52"
        />

        <SummaryCard
          label="가족 기록"
          value={totalMemories}
          unit="개"
          color="var(--gold)"
        />

        <SummaryCard
          label="타임캡슐"
          value={totalTimeCapsules}
          unit="개"
          color="#7b4f2a"
        />

        <SummaryCard
          label="대기 중 초대"
          value={totalPendingInvitations}
          unit="건"
          color="#3e5f3a"
        />

        <SummaryCard
          label="현재 검색 결과"
          value={filteredFamilyCount}
          unit="개"
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
          action="/admin/families"
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
              flex: '1 1 340px',
              gap: 7,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 900,
                color: 'var(--ink-soft)',
              }}
            >
              가족 공간 검색
            </span>

            <input
              type="search"
              name="q"
              defaultValue={searchQuery}
              placeholder="가족 이름, 소유자·구성원 이름 또는 이메일"
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
              href="/admin/families"
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
          marginBottom: 22,
          padding: '18px 22px',
        }}
      >
        <p
          className="dash-card__label"
          style={{
            margin: 0,
          }}
        >
          가족 공간 목록
        </p>

        <p
          style={{
            margin: '8px 0 0',
            color: 'var(--ink-soft)',
            fontSize: 13,
            lineHeight: 1.65,
          }}
        >
          검색 결과{' '}
          {filteredFamilyCount.toLocaleString()}개
          {' · '}
          {firstVisibleFamily}–
          {lastVisibleFamily}번째 표시
          {searchQuery
            ? ` · 검색어 "${searchQuery}"`
            : ''}
        </p>
      </section>

      {families.length > 0 ? (
        <>
          <section
            style={{
              display: 'grid',
              gap: 20,
            }}
          >
            {families.map((family) => {
              const ownerMembers =
                family.members.filter(
                  (member) =>
                    member.role === 'OWNER',
                );

              const pendingInvitations =
                family.invitations.filter(
                  (invitation) =>
                    !invitation.usedAt &&
                    invitation.expiresAt.getTime() >=
                      now.getTime(),
                );

              const familyStatus =
                family._count.members === 0
                  ? 'EMPTY'
                  : ownerMembers.length === 0
                    ? 'NO_OWNER'
                    : 'NORMAL';

              const sortedMembers = [
                ...family.members,
              ].sort((first, second) => {
                const roleDifference =
                  getFamilyRoleOrder(
                    first.role,
                  ) -
                  getFamilyRoleOrder(
                    second.role,
                  );

                if (roleDifference !== 0) {
                  return roleDifference;
                }

                return (
                  first.joinedAt.getTime() -
                  second.joinedAt.getTime()
                );
              });

              return (
                <article
                  key={family.id}
                  className="dash-card"
                  style={{
                    padding: 0,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    className="admin-family-card-header"
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent:
                        'space-between',
                      flexWrap: 'wrap',
                      gap: 16,
                      padding: '22px 24px',
                      borderBottom:
                        '1px solid rgba(34, 28, 22, 0.08)',
                      background:
                        'rgba(255, 255, 255, 0.18)',
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
                          gap: 8,
                        }}
                      >
                        <span
                          style={familyStatusBadgeStyle(
                            familyStatus,
                          )}
                        >
                          {getFamilyStatusLabel(
                            familyStatus,
                          )}
                        </span>

                        <span
                          style={{
                            fontSize: 12,
                            color:
                              'var(--ink-faint)',
                          }}
                        >
                          생성{' '}
                          {formatDate(
                            family.createdAt,
                          )}
                        </span>
                      </div>

                      <h2
                        style={{
                          margin: '10px 0 0',
                          color: 'var(--ink)',
                          fontFamily:
                            'var(--font-display)',
                          fontSize: 24,
                          lineHeight: 1.4,
                          wordBreak: 'break-word',
                        }}
                      >
                        {family.name}
                      </h2>

                      <p
                        style={{
                          margin: '7px 0 0',
                          color:
                            'var(--ink-soft)',
                          fontSize: 13,
                          lineHeight: 1.6,
                        }}
                      >
                        최근 수정{' '}
                        {formatDateTime(
                          family.updatedAt,
                        )}
                      </p>
                    </div>

                    <div
                      className="admin-family-counts"
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          'repeat(4, minmax(76px, 1fr))',
                        gap: 8,
                      }}
                    >
                      <MiniCount
                        label="구성원"
                        value={
                          family._count.members
                        }
                      />

                      <MiniCount
                        label="기록"
                        value={
                          family._count.memories
                        }
                      />

                      <MiniCount
                        label="타임캡슐"
                        value={
                          family._count
                            .timeCapsules
                        }
                      />

                      <MiniCount
                        label="초대 대기"
                        value={
                          pendingInvitations.length
                        }
                      />
                    </div>
                  </div>

                  <div
                    className="admin-family-body"
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(2, minmax(0, 1fr))',
                    }}
                  >
                    <section
                      className="admin-family-section"
                      style={{
                        padding: 24,
                        borderRight:
                          '1px solid rgba(34, 28, 22, 0.07)',
                      }}
                    >
                      <p
                        className="dash-card__label"
                        style={{
                          margin: 0,
                        }}
                      >
                        소유자와 구성원
                      </p>

                      {ownerMembers.length > 0 ? (
                        <div
                          style={{
                            marginTop: 16,
                            padding: 15,
                            borderRadius: 16,
                            border:
                              '1px solid rgba(123, 79, 42, 0.2)',
                            background: '#fff7e6',
                          }}
                        >
                          <p
                            style={{
                              margin: 0,
                              fontSize: 11,
                              fontWeight: 900,
                              color: '#8a5a22',
                            }}
                          >
                            가족 공간 소유자
                          </p>

                          {ownerMembers.map(
                            (owner) => (
                              <div
                                key={owner.id}
                                style={{
                                  marginTop: 8,
                                }}
                              >
                                <strong
                                  style={{
                                    display:
                                      'block',
                                    fontSize: 15,
                                    color:
                                      'var(--ink)',
                                  }}
                                >
                                  {owner.user.name ||
                                    '이름 없음'}
                                </strong>

                                <span
                                  style={{
                                    display:
                                      'block',
                                    marginTop: 4,
                                    fontSize: 13,
                                    color:
                                      'var(--ink-soft)',
                                    wordBreak:
                                      'break-all',
                                  }}
                                >
                                  {owner.user.email ||
                                    '이메일 없음'}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      ) : (
                        <WarningBox text="소유자로 지정된 회원이 없습니다." />
                      )}

                      {sortedMembers.length >
                      0 ? (
                        <div
                          style={{
                            display: 'grid',
                            gap: 9,
                            marginTop: 16,
                          }}
                        >
                          {sortedMembers.map(
                            (member) => (
                              <div
                                key={member.id}
                                className="admin-family-member-row"
                                style={{
                                  display: 'flex',
                                  alignItems:
                                    'center',
                                  justifyContent:
                                    'space-between',
                                  gap: 12,
                                  padding: 13,
                                  borderRadius: 14,
                                  border:
                                    '1px solid rgba(34, 28, 22, 0.08)',
                                  background:
                                    'rgba(255, 255, 255, 0.3)',
                                }}
                              >
                                <div
                                  style={{
                                    minWidth: 0,
                                  }}
                                >
                                  <strong
                                    style={{
                                      display:
                                        'block',
                                      fontSize: 14,
                                      color:
                                        'var(--ink)',
                                      wordBreak:
                                        'break-word',
                                    }}
                                  >
                                    {member.user
                                      .name ||
                                      '이름 없음'}
                                  </strong>

                                  <span
                                    style={{
                                      display:
                                        'block',
                                      marginTop: 4,
                                      fontSize: 12,
                                      color:
                                        'var(--ink-soft)',
                                      wordBreak:
                                        'break-all',
                                    }}
                                  >
                                    {member.user
                                      .email ||
                                      '이메일 없음'}
                                  </span>

                                  <span
                                    style={{
                                      display:
                                        'block',
                                      marginTop: 4,
                                      fontSize: 11,
                                      color:
                                        'var(--ink-faint)',
                                    }}
                                  >
                                    참여일{' '}
                                    {formatDate(
                                      member.joinedAt,
                                    )}
                                  </span>
                                </div>

                                <span
                                  style={familyRoleBadgeStyle(
                                    member.role,
                                  )}
                                >
                                  {getFamilyRoleLabel(
                                    member.role,
                                  )}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      ) : (
                        <WarningBox text="참여 중인 구성원이 없습니다." />
                      )}
                    </section>

                    <section
                      className="admin-family-section"
                      style={{
                        padding: 24,
                      }}
                    >
                      <p
                        className="dash-card__label"
                        style={{
                          margin: 0,
                        }}
                      >
                        가족 초대 현황
                      </p>

                      <p
                        style={{
                          margin: '8px 0 0',
                          color:
                            'var(--ink-soft)',
                          fontSize: 13,
                          lineHeight: 1.6,
                        }}
                      >
                        전체{' '}
                        {
                          family._count
                            .invitations
                        }
                        건 · 대기{' '}
                        {
                          pendingInvitations.length
                        }
                        건
                      </p>

                      {family.invitations.length >
                      0 ? (
                        <div
                          style={{
                            display: 'grid',
                            gap: 9,
                            marginTop: 16,
                          }}
                        >
                          {family.invitations.map(
                            (invitation) => {
                              const invitationStatus =
                                getInvitationStatus(
                                  invitation.usedAt,
                                  invitation.expiresAt,
                                  now,
                                );

                              return (
                                <div
                                  key={
                                    invitation.id
                                  }
                                  className="admin-family-invitation-row"
                                  style={{
                                    display:
                                      'flex',
                                    alignItems:
                                      'center',
                                    justifyContent:
                                      'space-between',
                                    gap: 12,
                                    padding: 13,
                                    borderRadius: 14,
                                    border:
                                      '1px solid rgba(34, 28, 22, 0.08)',
                                    background:
                                      'rgba(255, 255, 255, 0.3)',
                                  }}
                                >
                                  <div
                                    style={{
                                      minWidth: 0,
                                    }}
                                  >
                                    <strong
                                      style={{
                                        display:
                                          'block',
                                        fontSize: 13,
                                        color:
                                          'var(--ink)',
                                        wordBreak:
                                          'break-all',
                                      }}
                                    >
                                      {
                                        invitation.email
                                      }
                                    </strong>

                                    <span
                                      style={{
                                        display:
                                          'block',
                                        marginTop: 4,
                                        fontSize: 11,
                                        color:
                                          'var(--ink-faint)',
                                      }}
                                    >
                                      {getFamilyRoleLabel(
                                        invitation.role,
                                      )}
                                      {' · '}
                                      초대{' '}
                                      {formatDate(
                                        invitation.createdAt,
                                      )}
                                    </span>

                                    <span
                                      style={{
                                        display:
                                          'block',
                                        marginTop: 3,
                                        fontSize: 11,
                                        color:
                                          'var(--ink-faint)',
                                      }}
                                    >
                                      만료{' '}
                                      {formatDateTime(
                                        invitation.expiresAt,
                                      )}
                                    </span>
                                  </div>

                                  <span
                                    style={invitationBadgeStyle(
                                      invitationStatus,
                                    )}
                                  >
                                    {getInvitationStatusLabel(
                                      invitationStatus,
                                    )}
                                  </span>
                                </div>
                              );
                            },
                          )}
                        </div>
                      ) : (
                        <EmptyBox text="발송된 가족 초대가 없습니다." />
                      )}
                    </section>
                  </div>
                </article>
              );
            })}
          </section>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageNumbers={pageNumbers}
            searchQuery={searchQuery}
          />
        </>
      ) : (
        <section className="dash-card">
          <EmptyBox
            text={
              searchQuery
                ? '현재 검색 조건에 맞는 가족 공간이 없습니다.'
                : '아직 만들어진 가족 공간이 없습니다.'
            }
          />
        </section>
      )}
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
          fontFamily: 'var(--font-display)',
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
          fontFamily: 'var(--font-mono)',
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

function MiniCount({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div
      style={{
        minWidth: 76,
        padding: '10px 8px',
        borderRadius: 14,
        background:
          'rgba(34, 28, 22, 0.05)',
        textAlign: 'center',
      }}
    >
      <strong
        style={{
          display: 'block',
          fontSize: 17,
          color: 'var(--ink)',
        }}
      >
        {value.toLocaleString()}
      </strong>

      <span
        style={{
          display: 'block',
          marginTop: 3,
          fontSize: 10,
          color: 'var(--ink-faint)',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </div>
  );
}

function EmptyBox({
  text,
}: {
  text: string;
}) {
  return (
    <div
      style={{
        marginTop: 16,
        padding: 24,
        borderRadius: 18,
        border:
          '1px dashed rgba(34, 28, 22, 0.18)',
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

function WarningBox({
  text,
}: {
  text: string;
}) {
  return (
    <div
      style={{
        marginTop: 16,
        padding: 15,
        borderRadius: 14,
        border: '1px solid #e7c18a',
        background: '#fff4df',
        color: '#81531d',
        fontSize: 13,
        lineHeight: 1.6,
      }}
    >
      {text}
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
      aria-label="가족 공간 페이지 이동"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 7,
        marginTop: 20,
        padding: '20px 16px',
        borderRadius: 18,
        border:
          '1px solid rgba(34, 28, 22, 0.1)',
        background:
          'rgba(255, 255, 255, 0.28)',
      }}
    >
      {currentPage > 1 ? (
        <Link
          href={buildFamiliesHref({
            searchQuery,
            page: currentPage - 1,
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
            href={buildFamiliesHref({
              searchQuery,
              page: pageNumber,
            })}
            aria-current={
              pageNumber === currentPage
                ? 'page'
                : undefined
            }
            style={pageButtonStyle(
              pageNumber === currentPage,
            )}
          >
            {pageNumber}
          </Link>
        ),
      )}

      {currentPage < totalPages ? (
        <Link
          href={buildFamiliesHref({
            searchQuery,
            page: currentPage + 1,
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

function buildFamiliesHref({
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
    ? `/admin/families?${query}`
    : '/admin/families';
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

function primaryButtonStyle(): CSSProperties {
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

function secondaryHeaderButtonStyle(): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    padding: '0 18px',
    borderRadius: 999,
    border:
      '1px solid rgba(34, 28, 22, 0.2)',
    background:
      'rgba(255, 255, 255, 0.28)',
    color: 'var(--ink-soft)',
    fontSize: 14,
    fontWeight: 900,
    textDecoration: 'none',
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

function familyStatusBadgeStyle(
  status: string,
): CSSProperties {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 25,
    padding: '0 9px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 900,
    whiteSpace: 'nowrap',
  };

  if (status === 'NORMAL') {
    return {
      ...base,
      background: '#e3f4e5',
      color: '#2f6b38',
    };
  }

  if (status === 'NO_OWNER') {
    return {
      ...base,
      background: '#fff1c7',
      color: '#83540d',
    };
  }

  return {
    ...base,
    background: '#f2eeee',
    color: '#776868',
  };
}

function familyRoleBadgeStyle(
  role: string,
): CSSProperties {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 26,
    padding: '0 9px',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 900,
    whiteSpace: 'nowrap',
  };

  if (role === 'OWNER') {
    return {
      ...base,
      background: 'var(--wine)',
      color: 'var(--cream)',
    };
  }

  if (role === 'EDITOR') {
    return {
      ...base,
      background: '#e4f2ff',
      color: '#245d8c',
    };
  }

  return {
    ...base,
    background:
      'rgba(34, 28, 22, 0.08)',
    color: 'var(--ink-faint)',
  };
}

function invitationBadgeStyle(
  status: string,
): CSSProperties {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 25,
    padding: '0 9px',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 900,
    whiteSpace: 'nowrap',
  };

  if (status === 'PENDING') {
    return {
      ...base,
      background: '#fff1c7',
      color: '#83540d',
    };
  }

  if (status === 'ACCEPTED') {
    return {
      ...base,
      background: '#e3f4e5',
      color: '#2f6b38',
    };
  }

  return {
    ...base,
    background: '#f2eeee',
    color: '#776868',
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

function getFamilyStatusLabel(
  status: string,
) {
  if (status === 'NORMAL') {
    return '정상 운영';
  }

  if (status === 'NO_OWNER') {
    return '소유자 확인 필요';
  }

  if (status === 'EMPTY') {
    return '구성원 없음';
  }

  return '상태 확인';
}

function getFamilyRoleLabel(
  role: string,
) {
  if (role === 'OWNER') {
    return '소유자';
  }

  if (role === 'EDITOR') {
    return '편집자';
  }

  if (role === 'VIEWER') {
    return '열람자';
  }

  return '역할 확인';
}

function getFamilyRoleOrder(
  role: string,
) {
  if (role === 'OWNER') {
    return 1;
  }

  if (role === 'EDITOR') {
    return 2;
  }

  if (role === 'VIEWER') {
    return 3;
  }

  return 4;
}

function getInvitationStatus(
  usedAt: Date | null,
  expiresAt: Date,
  now: Date,
) {
  if (usedAt) {
    return 'ACCEPTED';
  }

  if (
    expiresAt.getTime() <
    now.getTime()
  ) {
    return 'EXPIRED';
  }

  return 'PENDING';
}

function getInvitationStatusLabel(
  status: string,
) {
  if (status === 'PENDING') {
    return '수락 대기';
  }

  if (status === 'ACCEPTED') {
    return '수락 완료';
  }

  if (status === 'EXPIRED') {
    return '기간 만료';
  }

  return '상태 확인';
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

function formatDateTime(
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
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(date);
}