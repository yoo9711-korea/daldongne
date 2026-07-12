import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { CSSProperties } from 'react';

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const adminUser = await prisma.user.findUnique({
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

  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: 'desc',
    },
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
              in: users.map((user) => user.id),
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

  const adminCount = users.filter(
    (user) => user.role === 'ADMIN',
  ).length;

  const totalMemoryCount = users.reduce(
    (total, user) => total + user._count.memories,
    0,
  );

  const totalBookCount = users.reduce(
    (total, user) => total + user._count.books,
    0,
  );

  const totalFamilyMembershipCount = familyMemberCounts.reduce(
    (total, item) => total + item._count._all,
    0,
  );

  async function toggleAdmin(formData: FormData) {
    'use server';

    const currentSession = await auth();

    if (!currentSession?.user?.id) {
      return;
    }

    const actingUser = await prisma.user.findUnique({
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

    if (!targetId || targetId === currentSession.user.id) {
      return;
    }

    const targetUser = await prisma.user.findUnique({
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
      const currentAdminCount = await prisma.user.count({
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
      <div className="runninghead">
        <span className="runninghead__chapter">ADMIN</span>
        <span className="runninghead__rule" />
        <span style={{ color: 'var(--ink-soft)' }}>
          회원 관리
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
            회원 관리
          </h1>

          <p
            style={{
              margin: 0,
              color: 'var(--ink-soft)',
              fontSize: 15,
              lineHeight: 1.75,
            }}
          >
            전체 {users.length.toLocaleString()}명의 회원과
            기록, 책, 가족 공간 참여 현황을 확인합니다.
          </p>
        </div>

        <Link href="/admin" style={backButtonStyle()}>
          관리자 홈
        </Link>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 14,
          marginBottom: 28,
        }}
      >
        <SummaryCard
          label="전체 회원"
          value={users.length}
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
          label="회원 기록"
          value={totalMemoryCount}
          unit="개"
          color="var(--gold)"
        />

        <SummaryCard
          label="회원 책"
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
            padding: '20px 22px',
            borderBottom:
              '1px solid rgba(34, 28, 22, 0.08)',
          }}
        >
          <p
            className="dash-card__label"
            style={{
              margin: 0,
            }}
          >
            전체 회원 목록
          </p>

          <p
            style={{
              margin: '8px 0 0',
              color: 'var(--ink-soft)',
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            본인의 관리자 권한은 직접 변경할 수 없으며,
            마지막 관리자 한 명의 권한도 해제할 수 없습니다.
          </p>
        </div>

        {users.length > 0 ? (
          <div
            style={{
              overflowX: 'auto',
            }}
          >
            <table
              style={{
                width: '100%',
                minWidth: 980,
                borderCollapse: 'collapse',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: 'var(--paper-shade)',
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
                      style={{
                        padding: '12px 14px',
                        textAlign: 'left',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        letterSpacing: '.05em',
                        color: 'var(--ink-faint)',
                        fontWeight: 400,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {users.map((user) => {
                  const isSelf =
                    user.id === session.user.id;

                  const isLastAdmin =
                    user.role === 'ADMIN' &&
                    adminCount <= 1;

                  const disabled =
                    isSelf || isLastAdmin;

                  const disabledTitle = isSelf
                    ? '본인의 관리자 권한은 이 화면에서 변경할 수 없습니다.'
                    : isLastAdmin
                      ? '마지막 관리자의 권한은 해제할 수 없습니다.'
                      : '';

                  const nextRoleLabel =
                    user.role === 'ADMIN'
                      ? '관리자 해제'
                      : '관리자 지정';

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
                          padding: '13px 14px',
                          minWidth: 150,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                          }}
                        >
                          {user.image ? (
                            <img
                              src={user.image}
                              alt=""
                              referrerPolicy="no-referrer"
                              style={{
                                width: 34,
                                height: 34,
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
                                width: 34,
                                height: 34,
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%',
                                background:
                                  'var(--paper-shade)',
                                color: 'var(--ink-faint)',
                                fontSize: 13,
                                fontWeight: 900,
                              }}
                            >
                              {(user.name ||
                                user.email ||
                                '?')
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
                              {user.name || '이름 없음'}
                            </strong>

                            {isSelf ? (
                              <span
                                style={{
                                  display: 'block',
                                  marginTop: 3,
                                  fontSize: 11,
                                  color: 'var(--wine)',
                                  fontWeight: 900,
                                }}
                              >
                                현재 로그인
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      <td
                        style={{
                          padding: '13px 14px',
                          minWidth: 190,
                          fontSize: 13,
                          color: 'var(--ink-soft)',
                          wordBreak: 'break-all',
                        }}
                      >
                        {user.email || '-'}
                      </td>

                      <td style={numberCellStyle()}>
                        {user._count.memories.toLocaleString()}
                      </td>

                      <td style={numberCellStyle()}>
                        {user._count.books.toLocaleString()}
                      </td>

                      <td style={numberCellStyle()}>
                        {(
                          familyCountMap.get(user.id) ?? 0
                        ).toLocaleString()}
                      </td>

                      <td
                        style={{
                          padding: '13px 14px',
                        }}
                      >
                        <span
                          style={roleBadgeStyle(user.role)}
                        >
                          {user.role === 'ADMIN'
                            ? '관리자'
                            : '일반 회원'}
                        </span>
                      </td>

                      <td style={dateCellStyle()}>
                        {formatDate(user.createdAt)}
                      </td>

                      <td style={dateCellStyle()}>
                        {formatDate(user.updatedAt)}
                      </td>

                      <td
                        style={{
                          padding: '13px 14px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <form action={toggleAdmin}>
                          <input
                            type="hidden"
                            name="userId"
                            value={user.id}
                          />

                          <button
                            type="submit"
                            disabled={disabled}
                            title={disabledTitle}
                            style={roleButtonStyle(
                              user.role,
                              disabled,
                            )}
                          >
                            {isSelf
                              ? '내 계정'
                              : isLastAdmin
                                ? '마지막 관리자'
                                : nextRoleLabel}
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            style={{
              padding: 34,
              textAlign: 'center',
              color: 'var(--ink-soft)',
              fontSize: 14,
            }}
          >
            등록된 회원이 없습니다.
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

function backButtonStyle(): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    padding: '0 18px',
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

function roleBadgeStyle(role: string): CSSProperties {
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
    fontFamily: 'var(--font-mono)',
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
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
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

function formatDate(value: Date | string) {
  const date =
    value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}