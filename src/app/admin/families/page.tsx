import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    sort?: string;
    page?: string;
  }>;
};

type FamilyStatusFilter =
  | "ALL"
  | "NORMAL"
  | "NO_OWNER"
  | "EMPTY"
  | "PENDING_INVITE";

type FamilySort =
  | "NEWEST"
  | "UPDATED_DESC"
  | "OLDEST"
  | "NAME_ASC";

type FamilyHealthStatus =
  | "NORMAL"
  | "NO_OWNER"
  | "EMPTY";

type InvitationStatus =
  | "PENDING"
  | "USED"
  | "EXPIRED";

const PAGE_SIZE = 20;

const STATUS_FILTERS: Array<{
  value: FamilyStatusFilter;
  label: string;
}> = [
  {
    value: "ALL",
    label: "전체 공간",
  },
  {
    value: "NORMAL",
    label: "정상 운영",
  },
  {
    value: "NO_OWNER",
    label: "소유자 없음",
  },
  {
    value: "EMPTY",
    label: "구성원 없음",
  },
  {
    value: "PENDING_INVITE",
    label: "대기 초대 있음",
  },
];

const SORT_OPTIONS: Array<{
  value: FamilySort;
  label: string;
}> = [
  {
    value: "NEWEST",
    label: "최근 생성순",
  },
  {
    value: "UPDATED_DESC",
    label: "최근 수정순",
  },
  {
    value: "OLDEST",
    label: "오래된 생성순",
  },
  {
    value: "NAME_ASC",
    label: "이름순",
  },
];

export default async function AdminFamiliesPage({
  searchParams,
}: PageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const adminUser =
    await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        role: true,
      },
    });

  if (adminUser?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const resolvedSearchParams =
    await searchParams;

  const searchQuery = String(
    resolvedSearchParams?.q || "",
  )
    .trim()
    .slice(0, 100);

  const statusFilter =
    normalizeStatusFilter(
      resolvedSearchParams?.status,
    );

  const sortOrder =
    normalizeSortOrder(
      resolvedSearchParams?.sort,
    );

  const requestedPage =
    normalizePage(
      resolvedSearchParams?.page,
    );

  const now = new Date();

  const familyConditions:
    Prisma.FamilyWhereInput[] = [];

  if (searchQuery) {
    familyConditions.push({
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
                      contains:
                        searchQuery,
                    },
                  },
                  {
                    email: {
                      contains:
                        searchQuery,
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
                contains:
                  searchQuery,
              },
            },
          },
        },
      ],
    });
  }

  if (statusFilter === "NORMAL") {
    familyConditions.push({
      members: {
        some: {
          role: "OWNER",
        },
      },
    });
  }

  if (
    statusFilter === "NO_OWNER"
  ) {
    familyConditions.push({
      AND: [
        {
          members: {
            some: {},
          },
        },
        {
          members: {
            none: {
              role: "OWNER",
            },
          },
        },
      ],
    });
  }

  if (statusFilter === "EMPTY") {
    familyConditions.push({
      members: {
        none: {},
      },
    });
  }

  if (
    statusFilter ===
    "PENDING_INVITE"
  ) {
    familyConditions.push({
      invitations: {
        some: {
          usedAt: null,
          expiresAt: {
            gte: now,
          },
        },
      },
    });
  }

  const familyWhere:
    Prisma.FamilyWhereInput =
    familyConditions.length > 0
      ? {
          AND: familyConditions,
        }
      : {};

  const [
    filteredFamilyCount,
    totalFamilyCount,
    summaryFamilies,
    totalPendingInvitations,
    totalExpiredInvitations,
  ] = await Promise.all([
    prisma.family.count({
      where: familyWhere,
    }),

    prisma.family.count(),

    prisma.family.findMany({
      select: {
        members: {
          select: {
            role: true,
          },
        },
        invitations: {
          where: {
            usedAt: null,
            expiresAt: {
              gte: now,
            },
          },
          select: {
            id: true,
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
    }),

    prisma.familyInvitation.count({
      where: {
        usedAt: null,
        expiresAt: {
          gte: now,
        },
      },
    }),

    prisma.familyInvitation.count({
      where: {
        usedAt: null,
        expiresAt: {
          lt: now,
        },
      },
    }),
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredFamilyCount /
        PAGE_SIZE,
    ),
  );

  const currentPage = Math.min(
    requestedPage,
    totalPages,
  );

  const skip =
    (currentPage - 1) *
    PAGE_SIZE;

  const families =
    await prisma.family.findMany({
      where: familyWhere,
      orderBy:
        getFamilyOrderBy(
          sortOrder,
        ),
      skip,
      take: PAGE_SIZE,
      include: {
        members: {
          orderBy: {
            joinedAt: "asc",
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
                image: true,
              },
            },
          },
        },
        invitations: {
          orderBy: {
            createdAt: "desc",
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

  const totalMembers =
    summaryFamilies.reduce(
      (total, family) =>
        total +
        family._count.members,
      0,
    );

  const totalMemories =
    summaryFamilies.reduce(
      (total, family) =>
        total +
        family._count.memories,
      0,
    );

  const totalTimeCapsules =
    summaryFamilies.reduce(
      (total, family) =>
        total +
        family._count
          .timeCapsules,
      0,
    );

  const normalFamilyCount =
    summaryFamilies.filter(
      (family) =>
        family.members.some(
          (member) =>
            member.role === "OWNER",
        ),
    ).length;

  const emptyFamilyCount =
    summaryFamilies.filter(
      (family) =>
        family.members.length === 0,
    ).length;

  const noOwnerFamilyCount =
    summaryFamilies.filter(
      (family) =>
        family.members.length > 0 &&
        !family.members.some(
          (member) =>
            member.role === "OWNER",
        ),
    ).length;

  const pendingInviteFamilyCount =
    summaryFamilies.filter(
      (family) =>
        family.invitations.length >
        0,
    ).length;

  const warningFamilyCount =
    emptyFamilyCount +
    noOwnerFamilyCount;

  const firstVisibleFamily =
    filteredFamilyCount === 0
      ? 0
      : skip + 1;

  const lastVisibleFamily =
    Math.min(
      skip + families.length,
      filteredFamilyCount,
    );

  const pageNumbers =
    getPageNumbers(
      currentPage,
      totalPages,
    );

  const hasActiveCondition =
    Boolean(searchQuery) ||
    statusFilter !== "ALL" ||
    sortOrder !== "NEWEST";

  return (
    <main className="admin-families-page">
      <style>
        {adminFamiliesStyles}
      </style>

      <div className="admin-families-shell">
        <header className="admin-families-hero">
          <div>
            <p>
              관리자 · 가족 공간 관리
            </p>

            <h1>
              가족 공간의 구성원과
              초대 상태를 확인합니다
            </h1>

            <span>
              소유자 지정 여부,
              참여 회원, 가족 기록,
              타임캡슐과 초대 진행
              상태를 한 화면에서
              점검하세요.
            </span>
          </div>

          <div className="admin-families-hero-actions">
            <Link href="/admin">
              관리자 홈
            </Link>

            <Link href="/admin/users">
              회원 관리
            </Link>

            <Link href="/dashboard/family">
              사용자 가족 공간
              <span aria-hidden="true">
                →
              </span>
            </Link>
          </div>
        </header>

        <section
          className="admin-families-alert"
          data-warning={
            warningFamilyCount > 0
              ? "true"
              : "false"
          }
        >
          <span className="admin-families-alert-icon">
            {warningFamilyCount >
            0 ? (
              <AlertIcon />
            ) : (
              <CheckIcon />
            )}
          </span>

          <div>
            <p>운영 상태 확인</p>

            <h2>
              {warningFamilyCount >
              0
                ? `확인이 필요한 가족 공간이 ${warningFamilyCount.toLocaleString()}개 있습니다.`
                : "모든 가족 공간에 소유자가 정상 지정되어 있습니다."}
            </h2>

            <span>
              구성원 없음{" "}
              {emptyFamilyCount.toLocaleString()}
              개 · 소유자 없음{" "}
              {noOwnerFamilyCount.toLocaleString()}
              개 · 활성 초대가 있는
              공간{" "}
              {pendingInviteFamilyCount.toLocaleString()}
              개
            </span>
          </div>

          {warningFamilyCount > 0 ? (
            <div className="admin-families-alert-actions">
              {noOwnerFamilyCount >
              0 ? (
                <Link href="/admin/families?status=NO_OWNER">
                  소유자 없는 공간
                </Link>
              ) : null}

              {emptyFamilyCount > 0 ? (
                <Link href="/admin/families?status=EMPTY">
                  구성원 없는 공간
                </Link>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="admin-families-summary">
          <SummaryCard
            label="가족 공간"
            value={totalFamilyCount}
            unit="개"
            tone="coral"
          />

          <SummaryCard
            label="전체 구성원"
            value={totalMembers}
            unit="명"
            tone="blue"
          />

          <SummaryCard
            label="가족 기록"
            value={totalMemories}
            unit="개"
            tone="yellow"
          />

          <SummaryCard
            label="타임캡슐"
            value={totalTimeCapsules}
            unit="개"
            tone="purple"
          />

          <SummaryCard
            label="대기 중 초대"
            value={
              totalPendingInvitations
            }
            unit="건"
            tone="green"
          />

          <SummaryCard
            label="만료된 미사용 초대"
            value={
              totalExpiredInvitations
            }
            unit="건"
            tone="gray"
          />
        </section>

        <section className="admin-families-health">
          <HealthStat
            label="정상 운영"
            value={normalFamilyCount}
            href="/admin/families?status=NORMAL"
            status="NORMAL"
          />

          <HealthStat
            label="소유자 없음"
            value={noOwnerFamilyCount}
            href="/admin/families?status=NO_OWNER"
            status="NO_OWNER"
          />

          <HealthStat
            label="구성원 없음"
            value={emptyFamilyCount}
            href="/admin/families?status=EMPTY"
            status="EMPTY"
          />

          <HealthStat
            label="대기 초대 있음"
            value={
              pendingInviteFamilyCount
            }
            href="/admin/families?status=PENDING_INVITE"
            status="PENDING_INVITE"
          />
        </section>

        <section className="admin-families-control">
          <form
            action="/admin/families"
            method="get"
            className="admin-families-search-form"
          >
            <label className="admin-families-search-field">
              <span>
                가족 공간 검색
              </span>

              <div>
                <SearchIcon />

                <input
                  type="search"
                  name="q"
                  defaultValue={
                    searchQuery
                  }
                  placeholder="가족 이름, 구성원 이름·이메일, 초대 이메일"
                  maxLength={100}
                />
              </div>
            </label>

            <label className="admin-families-select-field">
              <span>
                운영 상태
              </span>

              <select
                name="status"
                defaultValue={
                  statusFilter
                }
              >
                {STATUS_FILTERS.map(
                  (filter) => (
                    <option
                      key={
                        filter.value
                      }
                      value={
                        filter.value
                      }
                    >
                      {filter.label}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label className="admin-families-select-field">
              <span>정렬</span>

              <select
                name="sort"
                defaultValue={
                  sortOrder
                }
              >
                {SORT_OPTIONS.map(
                  (option) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {option.label}
                    </option>
                  ),
                )}
              </select>
            </label>

            <button type="submit">
              조건 적용
            </button>

            {hasActiveCondition ? (
              <Link href="/admin/families">
                전체 초기화
              </Link>
            ) : null}
          </form>

          <div className="admin-families-quick-filter">
            {STATUS_FILTERS.map(
              (filter) => {
                const count =
                  getStatusCount(
                    filter.value,
                    {
                      total:
                        totalFamilyCount,
                      normal:
                        normalFamilyCount,
                      noOwner:
                        noOwnerFamilyCount,
                      empty:
                        emptyFamilyCount,
                      pendingInvite:
                        pendingInviteFamilyCount,
                    },
                  );

                return (
                  <Link
                    key={filter.value}
                    href={buildFamiliesHref({
                      searchQuery,
                      status:
                        filter.value,
                      sort: sortOrder,
                    })}
                    data-active={
                      statusFilter ===
                      filter.value
                        ? "true"
                        : "false"
                    }
                  >
                    {filter.label}

                    <small>
                      {count.toLocaleString()}
                    </small>
                  </Link>
                );
              },
            )}
          </div>
        </section>

        <section className="admin-families-list-head">
          <div>
            <p>가족 공간 목록</p>

            <h2>
              구성원과 초대 상태를
              확인하세요
            </h2>

            <span>
              {filteredFamilyCount >
              0
                ? `${filteredFamilyCount.toLocaleString()}개 중 ${firstVisibleFamily.toLocaleString()}–${lastVisibleFamily.toLocaleString()}번째 공간`
                : "현재 조건에 맞는 가족 공간이 없습니다."}
            </span>
          </div>

          {hasActiveCondition ? (
            <Link href="/admin/families">
              전체 가족 공간 보기
            </Link>
          ) : null}
        </section>

        {families.length > 0 ? (
          <>
            <section className="admin-families-list">
              {families.map(
                (family) => {
                  const ownerMembers =
                    family.members.filter(
                      (member) =>
                        member.role ===
                        "OWNER",
                    );

                  const sortedMembers =
                    [...family.members].sort(
                      (
                        first,
                        second,
                      ) => {
                        const roleDifference =
                          getFamilyRoleOrder(
                            first.role,
                          ) -
                          getFamilyRoleOrder(
                            second.role,
                          );

                        if (
                          roleDifference !==
                          0
                        ) {
                          return roleDifference;
                        }

                        return (
                          first.joinedAt.getTime() -
                          second.joinedAt.getTime()
                        );
                      },
                    );

                  const pendingInvitations =
                    family.invitations.filter(
                      (invitation) =>
                        getInvitationStatus(
                          invitation.usedAt,
                          invitation.expiresAt,
                          now,
                        ) === "PENDING",
                    );

                  const familyStatus =
                    getFamilyHealthStatus(
                      family.members,
                    );

                  return (
                    <FamilyCard
                      key={family.id}
                      family={family}
                      ownerMembers={
                        ownerMembers
                      }
                      sortedMembers={
                        sortedMembers
                      }
                      pendingInvitations={
                        pendingInvitations
                      }
                      familyStatus={
                        familyStatus
                      }
                      now={now}
                    />
                  );
                },
              )}
            </section>

            <Pagination
              currentPage={
                currentPage
              }
              totalPages={
                totalPages
              }
              pageNumbers={
                pageNumbers
              }
              searchQuery={
                searchQuery
              }
              status={
                statusFilter
              }
              sort={sortOrder}
            />
          </>
        ) : (
          <div className="admin-families-empty">
            <FamilyIcon />

            <strong>
              현재 조건에 맞는
              가족 공간이 없습니다.
            </strong>

            <p>
              검색어나 운영 상태
              필터를 변경해 주세요.
            </p>

            <Link href="/admin/families">
              전체 가족 공간 보기
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

function FamilyCard({
  family,
  ownerMembers,
  sortedMembers,
  pendingInvitations,
  familyStatus,
  now,
}: {
  family: {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    members: Array<{
      id: string;
      role: string;
      joinedAt: Date;
      user: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
      };
    }>;
    invitations: Array<{
      id: string;
      email: string;
      role: string;
      expiresAt: Date;
      usedAt: Date | null;
      createdAt: Date;
    }>;
    _count: {
      members: number;
      memories: number;
      timeCapsules: number;
      invitations: number;
    };
  };
  ownerMembers: Array<{
    id: string;
    role: string;
    joinedAt: Date;
    user: {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
    };
  }>;
  sortedMembers: Array<{
    id: string;
    role: string;
    joinedAt: Date;
    user: {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
    };
  }>;
  pendingInvitations: Array<{
    id: string;
    email: string;
    role: string;
    expiresAt: Date;
    usedAt: Date | null;
    createdAt: Date;
  }>;
  familyStatus: FamilyHealthStatus;
  now: Date;
}) {
  return (
    <article className="admin-family-card">
      <header className="admin-family-card-head">
        <div className="admin-family-title">
          <div>
            <FamilyStatusBadge
              status={familyStatus}
            />

            <span>
              생성{" "}
              {formatDate(
                family.createdAt,
              )}
            </span>
          </div>

          <h3>{family.name}</h3>

          <p>
            최근 수정{" "}
            {formatDateTime(
              family.updatedAt,
            )}
          </p>
        </div>

        <div className="admin-family-counts">
          <MiniCount
            label="구성원"
            value={
              family._count.members
            }
            unit="명"
          />

          <MiniCount
            label="가족 기록"
            value={
              family._count.memories
            }
            unit="개"
          />

          <MiniCount
            label="타임캡슐"
            value={
              family._count
                .timeCapsules
            }
            unit="개"
          />

          <MiniCount
            label="대기 초대"
            value={
              pendingInvitations.length
            }
            unit="건"
          />
        </div>
      </header>

      <section className="admin-family-owner-section">
        <SectionHeading
          eyebrow="공간 소유자"
          title={
            ownerMembers.length > 0
              ? `${ownerMembers.length.toLocaleString()}명의 소유자가 지정되어 있습니다`
              : "소유자로 지정된 회원이 없습니다"
          }
          description={
            ownerMembers.length > 0
              ? "소유자는 가족 공간의 구성원과 초대를 관리할 수 있습니다."
              : "운영 확인이 필요한 가족 공간입니다."
          }
        />

        {ownerMembers.length > 0 ? (
          <div className="admin-family-owner-list">
            {ownerMembers.map(
              (member) => (
                <MemberIdentity
                  key={member.id}
                  member={member}
                  prominent
                />
              ),
            )}
          </div>
        ) : (
          <WarningBox
            title="소유자 확인 필요"
            text="현재 가족 공간에 OWNER 역할을 가진 회원이 없습니다."
          />
        )}
      </section>

      <div className="admin-family-body">
        <section className="admin-family-column">
          <SectionHeading
            eyebrow="참여 구성원"
            title={`전체 ${family._count.members.toLocaleString()}명`}
            description="소유자, 편집자, 열람자 순서로 표시합니다."
          />

          {sortedMembers.length >
          0 ? (
            <div className="admin-family-member-list">
              {sortedMembers.map(
                (member) => (
                  <MemberIdentity
                    key={member.id}
                    member={member}
                  />
                ),
              )}
            </div>
          ) : (
            <WarningBox
              title="구성원 없음"
              text="현재 참여 중인 회원이 없습니다."
            />
          )}
        </section>

        <section className="admin-family-column">
          <SectionHeading
            eyebrow="가족 초대"
            title={`전체 ${family._count.invitations.toLocaleString()}건 · 대기 ${pendingInvitations.length.toLocaleString()}건`}
            description="초대 이메일, 역할, 사용·만료 상태를 확인합니다."
          />

          {family.invitations.length >
          0 ? (
            <div className="admin-family-invitation-list">
              {family.invitations.map(
                (invitation) => (
                  <InvitationRow
                    key={
                      invitation.id
                    }
                    invitation={
                      invitation
                    }
                    now={now}
                  />
                ),
              )}
            </div>
          ) : (
            <EmptyBox text="발송된 가족 초대가 없습니다." />
          )}
        </section>
      </div>
    </article>
  );
}

function SummaryCard({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: number;
  unit: string;
  tone:
    | "coral"
    | "blue"
    | "yellow"
    | "purple"
    | "green"
    | "gray";
}) {
  return (
    <article
      className="admin-families-summary-card"
      data-tone={tone}
    >
      <span>{label}</span>

      <strong>
        {value.toLocaleString()}
        <small>{unit}</small>
      </strong>
    </article>
  );
}

function HealthStat({
  label,
  value,
  href,
  status,
}: {
  label: string;
  value: number;
  href: string;
  status:
    | FamilyHealthStatus
    | "PENDING_INVITE";
}) {
  return (
    <Link
      href={href}
      className="admin-family-health-stat"
      data-status={status}
    >
      <span>{label}</span>

      <strong>
        {value.toLocaleString()}
      </strong>

      <em aria-hidden="true">
        →
      </em>
    </Link>
  );
}

function MiniCount({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div className="admin-family-mini-count">
      <span>{label}</span>

      <strong>
        {value.toLocaleString()}
        <small>{unit}</small>
      </strong>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="admin-family-section-heading">
      <p>{eyebrow}</p>

      <h4>{title}</h4>

      <span>{description}</span>
    </div>
  );
}

function MemberIdentity({
  member,
  prominent = false,
}: {
  member: {
    id: string;
    role: string;
    joinedAt: Date;
    user: {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
    };
  };
  prominent?: boolean;
}) {
  const displayName =
    member.user.name ||
    "이름 없음";

  const searchValue =
    member.user.email ||
    member.user.name ||
    "";

  return (
    <Link
      href={buildUserSearchHref(
        searchValue,
      )}
      className="admin-family-member"
      data-prominent={
        prominent
          ? "true"
          : "false"
      }
    >
      {member.user.image ? (
        <img
          src={member.user.image}
          alt={`${displayName} 프로필`}
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="admin-family-avatar">
          {(member.user.name ||
            member.user.email ||
            "?")
            .charAt(0)
            .toUpperCase()}
        </span>
      )}

      <div>
        <strong>
          {displayName}
        </strong>

        <span>
          {member.user.email ||
            "이메일 없음"}
        </span>

        <small>
          참여일{" "}
          {formatDate(
            member.joinedAt,
          )}
        </small>
      </div>

      <FamilyRoleBadge
        role={member.role}
      />
    </Link>
  );
}

function InvitationRow({
  invitation,
  now,
}: {
  invitation: {
    id: string;
    email: string;
    role: string;
    expiresAt: Date;
    usedAt: Date | null;
    createdAt: Date;
  };
  now: Date;
}) {
  const status =
    getInvitationStatus(
      invitation.usedAt,
      invitation.expiresAt,
      now,
    );

  return (
    <Link
      href={buildUserSearchHref(
        invitation.email,
      )}
      className="admin-family-invitation"
    >
      <div>
        <strong>
          {invitation.email}
        </strong>

        <span>
          {getFamilyRoleLabel(
            invitation.role,
          )}
          {" · "}
          초대{" "}
          {formatDate(
            invitation.createdAt,
          )}
        </span>

        <small>
          만료{" "}
          {formatDateTime(
            invitation.expiresAt,
          )}
        </small>
      </div>

      <InvitationBadge
        status={status}
      />
    </Link>
  );
}

function FamilyStatusBadge({
  status,
}: {
  status: FamilyHealthStatus;
}) {
  return (
    <span
      className="admin-family-status-badge"
      data-status={status}
    >
      {getFamilyStatusLabel(
        status,
      )}
    </span>
  );
}

function FamilyRoleBadge({
  role,
}: {
  role: string;
}) {
  return (
    <span
      className="admin-family-role-badge"
      data-role={role}
    >
      {getFamilyRoleLabel(role)}
    </span>
  );
}

function InvitationBadge({
  status,
}: {
  status: InvitationStatus;
}) {
  return (
    <span
      className="admin-family-invitation-badge"
      data-status={status}
    >
      {getInvitationStatusLabel(
        status,
      )}
    </span>
  );
}

function WarningBox({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="admin-family-warning">
      <AlertIcon />

      <div>
        <strong>{title}</strong>
        <span>{text}</span>
      </div>
    </div>
  );
}

function EmptyBox({
  text,
}: {
  text: string;
}) {
  return (
    <div className="admin-family-empty-box">
      {text}
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  pageNumbers,
  searchQuery,
  status,
  sort,
}: {
  currentPage: number;
  totalPages: number;
  pageNumbers: number[];
  searchQuery: string;
  status: FamilyStatusFilter;
  sort: FamilySort;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      className="admin-families-pagination"
      aria-label="가족 공간 목록 페이지 이동"
    >
      {currentPage > 1 ? (
        <Link
          href={buildFamiliesHref({
            searchQuery,
            status,
            sort,
            page:
              currentPage - 1,
          })}
        >
          이전
        </Link>
      ) : (
        <span data-disabled="true">
          이전
        </span>
      )}

      {pageNumbers.map(
        (pageNumber) => (
          <Link
            key={pageNumber}
            href={buildFamiliesHref({
              searchQuery,
              status,
              sort,
              page: pageNumber,
            })}
            aria-current={
              pageNumber ===
              currentPage
                ? "page"
                : undefined
            }
            data-active={
              pageNumber ===
              currentPage
                ? "true"
                : "false"
            }
          >
            {pageNumber}
          </Link>
        ),
      )}

      {currentPage <
      totalPages ? (
        <Link
          href={buildFamiliesHref({
            searchQuery,
            status,
            sort,
            page:
              currentPage + 1,
          })}
        >
          다음
        </Link>
      ) : (
        <span data-disabled="true">
          다음
        </span>
      )}
    </nav>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="17"
        cy="17"
        r="10"
        stroke="currentColor"
        strokeWidth="2.7"
      />

      <path
        d="m25 25 9 9"
        stroke="currentColor"
        strokeWidth="2.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M32 8 58 53H6L32 8Z"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinejoin="round"
      />

      <path
        d="M32 23v14M32 46h.01"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="32"
        cy="32"
        r="24"
        stroke="currentColor"
        strokeWidth="4"
      />

      <path
        d="m20 33 8 8 17-19"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FamilyIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="24"
        cy="23"
        r="8"
        stroke="currentColor"
        strokeWidth="3"
      />

      <circle
        cx="43"
        cy="25"
        r="6"
        stroke="currentColor"
        strokeWidth="3"
      />

      <path
        d="M9 51c2.4-9 7.4-13.5 15-13.5S36.6 42 39 51M37 51c1.5-6.3 4.8-9.5 10-9.5 4.1 0 7 2.5 8.7 7.5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function getFamilyHealthStatus(
  members: Array<{
    role: string;
  }>,
): FamilyHealthStatus {
  if (members.length === 0) {
    return "EMPTY";
  }

  const hasOwner =
    members.some(
      (member) =>
        member.role === "OWNER",
    );

  if (!hasOwner) {
    return "NO_OWNER";
  }

  return "NORMAL";
}

function normalizeStatusFilter(
  value: string | undefined,
): FamilyStatusFilter {
  if (value === "NORMAL") {
    return "NORMAL";
  }

  if (value === "NO_OWNER") {
    return "NO_OWNER";
  }

  if (value === "EMPTY") {
    return "EMPTY";
  }

  if (
    value ===
    "PENDING_INVITE"
  ) {
    return "PENDING_INVITE";
  }

  return "ALL";
}

function normalizeSortOrder(
  value: string | undefined,
): FamilySort {
  if (
    value === "UPDATED_DESC"
  ) {
    return "UPDATED_DESC";
  }

  if (value === "OLDEST") {
    return "OLDEST";
  }

  if (value === "NAME_ASC") {
    return "NAME_ASC";
  }

  return "NEWEST";
}

function getFamilyOrderBy(
  sort: FamilySort,
): Prisma.FamilyOrderByWithRelationInput {
  if (
    sort === "UPDATED_DESC"
  ) {
    return {
      updatedAt: "desc",
    };
  }

  if (sort === "OLDEST") {
    return {
      createdAt: "asc",
    };
  }

  if (sort === "NAME_ASC") {
    return {
      name: "asc",
    };
  }

  return {
    createdAt: "desc",
  };
}

function normalizePage(
  value: string | undefined,
) {
  const parsed =
    Number.parseInt(
      String(value || "1"),
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
  searchQuery = "",
  status = "ALL",
  sort = "NEWEST",
  page = 1,
}: {
  searchQuery?: string;
  status?: FamilyStatusFilter;
  sort?: FamilySort;
  page?: number;
}) {
  const params =
    new URLSearchParams();

  if (searchQuery.trim()) {
    params.set(
      "q",
      searchQuery.trim(),
    );
  }

  if (status !== "ALL") {
    params.set(
      "status",
      status,
    );
  }

  if (sort !== "NEWEST") {
    params.set(
      "sort",
      sort,
    );
  }

  if (page > 1) {
    params.set(
      "page",
      String(page),
    );
  }

  const query =
    params.toString();

  return query
    ? `/admin/families?${query}`
    : "/admin/families";
}

function buildUserSearchHref(
  searchQuery: string,
) {
  const query =
    searchQuery.trim();

  if (!query) {
    return "/admin/users";
  }

  const params =
    new URLSearchParams();

  params.set("q", query);

  return `/admin/users?${params.toString()}`;
}

function getStatusCount(
  status: FamilyStatusFilter,
  counts: {
    total: number;
    normal: number;
    noOwner: number;
    empty: number;
    pendingInvite: number;
  },
) {
  if (status === "NORMAL") {
    return counts.normal;
  }

  if (status === "NO_OWNER") {
    return counts.noOwner;
  }

  if (status === "EMPTY") {
    return counts.empty;
  }

  if (
    status ===
    "PENDING_INVITE"
  ) {
    return counts.pendingInvite;
  }

  return counts.total;
}

function getFamilyStatusLabel(
  status: FamilyHealthStatus,
) {
  if (status === "NORMAL") {
    return "정상 운영";
  }

  if (
    status === "NO_OWNER"
  ) {
    return "소유자 확인 필요";
  }

  return "구성원 없음";
}

function getFamilyRoleLabel(
  role: string,
) {
  if (role === "OWNER") {
    return "소유자";
  }

  if (role === "EDITOR") {
    return "편집자";
  }

  if (role === "VIEWER") {
    return "열람자";
  }

  return "역할 확인";
}

function getFamilyRoleOrder(
  role: string,
) {
  if (role === "OWNER") {
    return 0;
  }

  if (role === "EDITOR") {
    return 1;
  }

  if (role === "VIEWER") {
    return 2;
  }

  return 3;
}

function getInvitationStatus(
  usedAt: Date | null,
  expiresAt: Date,
  now: Date,
): InvitationStatus {
  if (usedAt) {
    return "USED";
  }

  if (
    expiresAt.getTime() <
    now.getTime()
  ) {
    return "EXPIRED";
  }

  return "PENDING";
}

function getInvitationStatusLabel(
  status: InvitationStatus,
) {
  if (status === "USED") {
    return "초대 사용 완료";
  }

  if (status === "EXPIRED") {
    return "초대 만료";
  }

  return "응답 대기";
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
    return "-";
  }

  return new Intl.DateTimeFormat(
    "ko-KR",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
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
    return "-";
  }

  return new Intl.DateTimeFormat(
    "ko-KR",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    },
  ).format(date);
}

const adminFamiliesStyles = `
  .admin-families-page,
  .admin-families-page * {
    box-sizing: border-box;
  }

  .admin-families-page {
    min-height: 100%;
    color: #432f26;
    font-family:
      var(--font-daldongne-sans),
      "Noto Sans KR",
      sans-serif;
  }

  .admin-families-page a {
    color: inherit;
    text-decoration: none;
  }

  .admin-families-page a,
  .admin-families-page button {
    transition:
      transform 160ms ease,
      box-shadow 160ms ease,
      border-color 160ms ease;
  }

  .admin-families-page a:hover,
  .admin-families-page button:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  .admin-families-page a:focus-visible,
  .admin-families-page button:focus-visible,
  .admin-families-page input:focus-visible,
  .admin-families-page select:focus-visible {
    outline:
      4px solid
      rgba(239, 105, 83, 0.2);
    outline-offset: 3px;
  }

  .admin-families-shell {
    width: min(1480px, 100%);
    margin: 0 auto;
  }

  .admin-families-hero {
    padding: 31px 35px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 25px;
    border:
      1px solid
      rgba(136, 94, 74, 0.13);
    border-radius: 26px;
    background:
      radial-gradient(
        circle at 90% 4%,
        rgba(223, 242, 224, 0.72),
        transparent 23rem
      ),
      linear-gradient(
        135deg,
        rgba(255, 253, 248, 0.99),
        rgba(255, 247, 240, 0.98)
      );
    box-shadow:
      0 19px 46px
      rgba(91, 59, 44, 0.065);
  }

  .admin-families-hero > div:first-child {
    min-width: 0;
  }

  .admin-families-hero p {
    margin: 0;
    color: #e56852;
    font-size: 13.2px;
    font-weight: 900;
    letter-spacing: 0.08em;
  }

  .admin-families-hero h1 {
    margin: 8px 0 0;
    max-width: 780px;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size:
      clamp(33px, 4vw, 50px);
    line-height: 1.24;
    letter-spacing: -0.055em;
  }

  .admin-families-hero > div:first-child > span {
    display: block;
    max-width: 720px;
    margin-top: 10px;
    color: #76635a;
    font-size: 15.6px;
    line-height: 1.78;
  }

  .admin-families-hero-actions {
    min-width: 260px;
    display: grid;
    gap: 8px;
  }

  .admin-families-hero-actions a {
    min-height: 45px;
    padding: 0 15px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    border:
      1px solid #d6b3a3;
    border-radius: 12px;
    color: #755247;
    background: #ffffff;
    font-size: 12px;
    font-weight: 900;
  }

  .admin-families-hero-actions a:last-child {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
  }

  .admin-families-alert {
    margin-top: 16px;
    padding: 18px 20px;
    display: grid;
    grid-template-columns:
      50px minmax(0, 1fr) auto;
    align-items: center;
    gap: 14px;
    border:
      1px solid #9dcca4;
    border-radius: 19px;
    background:
      linear-gradient(
        135deg,
        #edf8ee,
        #fbfffb
      );
  }

  .admin-families-alert[data-warning="true"] {
    border-color: #e2a26e;
    background:
      linear-gradient(
        135deg,
        #fff1df,
        #fffaf2
      );
  }

  .admin-families-alert-icon {
    width: 50px;
    height: 50px;
    padding: 10px;
    display: grid;
    place-items: center;
    border-radius: 14px;
    color: #3f7948;
    background: #ffffff;
  }

  .admin-families-alert[data-warning="true"]
  .admin-families-alert-icon {
    color: #a34d29;
  }

  .admin-families-alert-icon svg {
    width: 100%;
    height: 100%;
  }

  .admin-families-alert p {
    margin: 0;
    color: #3f7948;
    font-size: 9.6px;
    font-weight: 900;
  }

  .admin-families-alert[data-warning="true"] p {
    color: #a34d29;
  }

  .admin-families-alert h2 {
    margin: 4px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 19px;
    line-height: 1.45;
  }

  .admin-families-alert > div > span {
    display: block;
    margin-top: 4px;
    color: #78655c;
    font-size: 9.6px;
    line-height: 1.6;
  }

  .admin-families-alert-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 6px;
  }

  .admin-families-alert-actions a {
    min-height: 35px;
    padding: 0 10px;
    display: inline-flex;
    align-items: center;
    border:
      1px solid #d6b3a3;
    border-radius: 9px;
    color: #755247;
    background: #ffffff;
    font-size: 9.6px;
    font-weight: 900;
    white-space: nowrap;
  }

  .admin-families-summary {
    margin-top: 16px;
    display: grid;
    grid-template-columns:
      repeat(6, minmax(0, 1fr));
    gap: 9px;
  }

  .admin-families-summary-card {
    min-width: 0;
    padding: 15px;
    border:
      1px solid
      rgba(136, 94, 74, 0.11);
    border-radius: 15px;
    background: #ffffff;
    box-shadow:
      0 8px 20px
      rgba(91, 59, 44, 0.04);
  }

  .admin-families-summary-card[data-tone="coral"] {
    background: #fff0eb;
  }

  .admin-families-summary-card[data-tone="blue"] {
    background: #edf5ff;
  }

  .admin-families-summary-card[data-tone="yellow"] {
    background: #fff7da;
  }

  .admin-families-summary-card[data-tone="purple"] {
    background: #f3edff;
  }

  .admin-families-summary-card[data-tone="green"] {
    background: #edf7e9;
  }

  .admin-families-summary-card[data-tone="gray"] {
    background: #f2efed;
  }

  .admin-families-summary-card > span {
    color: #7a675e;
    font-size: 8px;
    font-weight: 850;
  }

  .admin-families-summary-card > strong {
    display: block;
    margin-top: 6px;
    color: #e0644e;
    font-size: 25px;
  }

  .admin-families-summary-card small {
    margin-left: 3px;
    color: #806d64;
    font-size: 8px;
  }

  .admin-families-health {
    margin-top: 10px;
    display: grid;
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    gap: 8px;
  }

  .admin-family-health-stat {
    min-width: 0;
    padding: 12px 13px;
    display: grid;
    grid-template-columns:
      minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 8px;
    border:
      1px solid
      rgba(136, 94, 74, 0.11);
    border-radius: 12px;
    background: #ffffff;
  }

  .admin-family-health-stat[data-status="NORMAL"] {
    background: #edf7e9;
  }

  .admin-family-health-stat[data-status="NO_OWNER"] {
    background: #fff7da;
  }

  .admin-family-health-stat[data-status="EMPTY"] {
    background: #f2efed;
  }

  .admin-family-health-stat[data-status="PENDING_INVITE"] {
    background: #edf5ff;
  }

  .admin-family-health-stat > span {
    overflow: hidden;
    color: #755f55;
    font-size: 8px;
    font-weight: 900;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .admin-family-health-stat strong {
    font-size: 17px;
  }

  .admin-family-health-stat em {
    color: #d5654e;
    font-size: 11px;
    font-style: normal;
    font-weight: 900;
  }

  .admin-families-control,
  .admin-families-list-head,
  .admin-family-card {
    border:
      1px solid
      rgba(136, 94, 74, 0.13);
    border-radius: 22px;
    background:
      rgba(255, 255, 255, 0.94);
    box-shadow:
      0 14px 36px
      rgba(91, 59, 44, 0.052);
  }

  .admin-families-control {
    margin-top: 16px;
    padding: 21px;
  }

  .admin-families-search-form {
    display: grid;
    grid-template-columns:
      minmax(300px, 1fr)
      minmax(150px, 0.32fr)
      minmax(150px, 0.32fr)
      auto auto;
    align-items: end;
    gap: 8px;
  }

  .admin-families-search-field > span,
  .admin-families-select-field > span {
    display: block;
    margin-bottom: 6px;
    color: #6d584e;
    font-size: 9.6px;
    font-weight: 900;
  }

  .admin-families-search-field > div {
    position: relative;
  }

  .admin-families-search-field svg {
    position: absolute;
    left: 12px;
    top: 50%;
    width: 21px;
    height: 21px;
    color: #9b7d70;
    transform: translateY(-50%);
    pointer-events: none;
  }

  .admin-families-search-form input,
  .admin-families-search-form select {
    width: 100%;
    min-height: 45px;
    border:
      1px solid
      rgba(142, 99, 78, 0.22);
    border-radius: 11px;
    color: #49362d;
    background: #fffdfb;
    font: inherit;
    font-size: 10.8px;
  }

  .admin-families-search-form input {
    padding: 0 13px 0 41px;
  }

  .admin-families-search-form select {
    padding: 0 10px;
  }

  .admin-families-search-form button,
  .admin-families-search-form > a {
    min-height: 45px;
    padding: 0 13px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border:
      1px solid #d7b4a3;
    border-radius: 11px;
    color: #765247;
    background: #ffffff;
    font-size: 10.8px;
    font-weight: 900;
    white-space: nowrap;
    cursor: pointer;
  }

  .admin-families-search-form button {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
  }

  .admin-families-quick-filter {
    margin-top: 14px;
    padding-top: 14px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    border-top:
      1px solid
      rgba(136, 94, 74, 0.1);
  }

  .admin-families-quick-filter a {
    min-height: 36px;
    padding: 0 10px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border:
      1px solid
      rgba(142, 99, 78, 0.18);
    border-radius: 10px;
    color: #72594e;
    background: #ffffff;
    font-size: 9.6px;
    font-weight: 900;
  }

  .admin-families-quick-filter a[data-active="true"] {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
  }

  .admin-families-quick-filter small {
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    color: inherit;
    background:
      rgba(120, 82, 64, 0.1);
    font-size: 8.4px;
  }

  .admin-families-list-head {
    margin-top: 16px;
    padding: 21px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 17px;
  }

  .admin-families-list-head p {
    margin: 0;
    color: #e56852;
    font-size: 10.8px;
    font-weight: 900;
    letter-spacing: 0.07em;
  }

  .admin-families-list-head h2 {
    margin: 6px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 27px;
    line-height: 1.42;
    letter-spacing: -0.045em;
  }

  .admin-families-list-head div > span {
    display: block;
    margin-top: 5px;
    color: #7a675e;
    font-size: 12px;
  }

  .admin-families-list-head > a {
    min-height: 40px;
    padding: 0 12px;
    display: inline-flex;
    align-items: center;
    flex: 0 0 auto;
    border:
      1px solid #d6b3a3;
    border-radius: 11px;
    color: #755247;
    background: #ffffff;
    font-size: 10.8px;
    font-weight: 900;
  }

  .admin-families-list {
    margin-top: 16px;
    display: grid;
    gap: 14px;
  }

  .admin-family-card {
    overflow: hidden;
  }

  .admin-family-card-head {
    padding: 19px 21px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
    border-bottom:
      1px solid
      rgba(136, 94, 74, 0.1);
    background:
      linear-gradient(
        135deg,
        #fffaf6,
        #ffffff
      );
  }

  .admin-family-title {
    min-width: 0;
  }

  .admin-family-title > div {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
  }

  .admin-family-title > div > span:last-child {
    color: #927b70;
    font-size: 8.4px;
  }

  .admin-family-title h3 {
    margin: 8px 0 0;
    overflow-wrap: anywhere;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 23px;
    line-height: 1.4;
  }

  .admin-family-title > p {
    margin: 5px 0 0;
    color: #7e6b62;
    font-size: 9.6px;
  }

  .admin-family-counts {
    display: grid;
    grid-template-columns:
      repeat(4, minmax(75px, 1fr));
    gap: 6px;
  }

  .admin-family-mini-count {
    min-width: 0;
    padding: 10px;
    border:
      1px solid
      rgba(136, 94, 74, 0.09);
    border-radius: 10px;
    background: #ffffff;
  }

  .admin-family-mini-count span,
  .admin-family-mini-count strong {
    display: block;
  }

  .admin-family-mini-count span {
    color: #8a756a;
    font-size: 8.4px;
  }

  .admin-family-mini-count strong {
    margin-top: 4px;
    font-size: 15.6px;
  }

  .admin-family-mini-count small {
    margin-left: 2px;
    color: #8a756a;
    font-size: 7.2px;
  }

  .admin-family-owner-section {
    padding: 18px 21px;
    border-bottom:
      1px solid
      rgba(136, 94, 74, 0.1);
    background: #fffdf9;
  }

  .admin-family-section-heading p {
    margin: 0;
    color: #e56852;
    font-size: 8.4px;
    font-weight: 900;
    letter-spacing: 0.07em;
  }

  .admin-family-section-heading h4 {
    margin: 5px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 17px;
    line-height: 1.45;
  }

  .admin-family-section-heading > span {
    display: block;
    margin-top: 4px;
    color: #7e6b62;
    font-size: 9.6px;
    line-height: 1.6;
  }

  .admin-family-owner-list {
    margin-top: 12px;
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .admin-family-body {
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .admin-family-column {
    min-width: 0;
    padding: 20px 21px;
  }

  .admin-family-column + .admin-family-column {
    border-left:
      1px solid
      rgba(136, 94, 74, 0.1);
  }

  .admin-family-member-list,
  .admin-family-invitation-list {
    margin-top: 13px;
    display: grid;
    gap: 7px;
  }

  .admin-family-member,
  .admin-family-invitation {
    min-width: 0;
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 9px;
    border:
      1px solid
      rgba(136, 94, 74, 0.1);
    border-radius: 11px;
    background: #fffaf6;
  }

  .admin-family-member[data-prominent="true"] {
    border-color: #dcb38a;
    background:
      linear-gradient(
        135deg,
        #fff5e6,
        #fffdf9
      );
  }

  .admin-family-member > img,
  .admin-family-avatar {
    width: 37px;
    height: 37px;
    flex: 0 0 auto;
    border-radius: 50%;
    object-fit: cover;
    background: #efe6df;
  }

  .admin-family-avatar {
    display: grid;
    place-items: center;
    color: #9a6f60;
    font-size: 14.4px;
    font-weight: 900;
  }

  .admin-family-member > div,
  .admin-family-invitation > div {
    min-width: 0;
    flex: 1 1 auto;
  }

  .admin-family-member strong,
  .admin-family-member > div > span,
  .admin-family-member small,
  .admin-family-invitation strong,
  .admin-family-invitation > div > span,
  .admin-family-invitation small {
    display: block;
  }

  .admin-family-member strong,
  .admin-family-invitation strong {
    overflow: hidden;
    font-size: 10.8px;
    line-height: 1.45;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .admin-family-member > div > span,
  .admin-family-invitation > div > span {
    margin-top: 3px;
    overflow: hidden;
    color: #7d6a61;
    font-size: 8.4px;
    line-height: 1.5;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .admin-family-member small,
  .admin-family-invitation small {
    margin-top: 3px;
    color: #9a8176;
    font-size: 7.2px;
  }

  .admin-family-status-badge,
  .admin-family-role-badge,
  .admin-family-invitation-badge {
    min-height: 24px;
    padding: 0 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    border-radius: 999px;
    font-size: 8.4px;
    font-weight: 900;
    white-space: nowrap;
  }

  .admin-family-status-badge[data-status="NORMAL"] {
    color: #2f6b38;
    background: #e3f4e5;
  }

  .admin-family-status-badge[data-status="NO_OWNER"] {
    color: #83540d;
    background: #fff1c7;
  }

  .admin-family-status-badge[data-status="EMPTY"] {
    color: #776868;
    background: #f2eeee;
  }

  .admin-family-role-badge[data-role="OWNER"] {
    color: #ffffff;
    background: #7b3730;
  }

  .admin-family-role-badge[data-role="EDITOR"] {
    color: #62438a;
    background: #efe6ff;
  }

  .admin-family-role-badge[data-role="VIEWER"] {
    color: #245d8c;
    background: #e4f2ff;
  }

  .admin-family-invitation-badge[data-status="PENDING"] {
    color: #83540d;
    background: #fff1c7;
  }

  .admin-family-invitation-badge[data-status="USED"] {
    color: #2f6b38;
    background: #e3f4e5;
  }

  .admin-family-invitation-badge[data-status="EXPIRED"] {
    color: #776868;
    background: #f2eeee;
  }

  .admin-family-warning {
    margin-top: 12px;
    padding: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    border:
      1px solid #e0b170;
    border-radius: 12px;
    color: #83540d;
    background: #fff7df;
  }

  .admin-family-warning svg {
    width: 28px;
    height: 28px;
    flex: 0 0 auto;
  }

  .admin-family-warning strong,
  .admin-family-warning span {
    display: block;
  }

  .admin-family-warning strong {
    font-size: 10.8px;
  }

  .admin-family-warning span {
    margin-top: 3px;
    font-size: 8.4px;
    line-height: 1.55;
  }

  .admin-family-empty-box {
    margin-top: 12px;
    padding: 20px 13px;
    border:
      1px dashed #d8b8aa;
    border-radius: 11px;
    color: #806b61;
    background: #fffaf7;
    font-size: 9.6px;
    line-height: 1.65;
    text-align: center;
  }

  .admin-families-pagination {
    margin-top: 16px;
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 6px;
    border:
      1px solid
      rgba(136, 94, 74, 0.13);
    border-radius: 17px;
    background:
      rgba(255, 255, 255, 0.94);
  }

  .admin-families-pagination a,
  .admin-families-pagination > span {
    min-width: 37px;
    min-height: 37px;
    padding: 0 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border:
      1px solid #d6b3a3;
    border-radius: 10px;
    color: #755247;
    background: #ffffff;
    font-size: 10.8px;
    font-weight: 900;
  }

  .admin-families-pagination a[data-active="true"] {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
  }

  .admin-families-pagination > span[data-disabled="true"] {
    opacity: 0.42;
  }

  .admin-families-empty {
    margin-top: 16px;
    padding: 52px 20px;
    border:
      1px dashed #ddb2a1;
    border-radius: 18px;
    background: #fffaf7;
    text-align: center;
  }

  .admin-families-empty svg {
    width: 56px;
    height: 56px;
    color: #e57059;
  }

  .admin-families-empty strong {
    display: block;
    margin-top: 11px;
    font-size: 16px;
  }

  .admin-families-empty p {
    margin: 5px 0 0;
    color: #806b61;
    font-size: 12px;
  }

  .admin-families-empty a {
    min-height: 40px;
    margin-top: 14px;
    padding: 0 13px;
    display: inline-flex;
    align-items: center;
    border-radius: 10px;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
    font-size: 10.8px;
    font-weight: 900;
  }

  @media (max-width: 1180px) {
    .admin-families-summary {
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
    }

    .admin-families-search-form {
      grid-template-columns:
        minmax(260px, 1fr)
        repeat(2, minmax(145px, 0.45fr))
        auto;
    }

    .admin-families-search-form > a {
      grid-column: 1 / -1;
      justify-self: start;
    }

    .admin-family-card-head {
      align-items: stretch;
      flex-direction: column;
    }

    .admin-family-counts {
      width: 100%;
    }
  }

  @media (max-width: 880px) {
    .admin-families-hero {
      align-items: stretch;
      flex-direction: column;
      padding: 25px;
      border-radius: 22px;
    }

    .admin-families-hero-actions {
      min-width: 0;
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
    }

    .admin-families-alert {
      grid-template-columns:
        46px minmax(0, 1fr);
    }

    .admin-families-alert-actions {
      grid-column: 1 / -1;
      justify-content: flex-start;
    }

    .admin-families-health {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .admin-families-search-form {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .admin-families-search-field {
      grid-column: 1 / -1;
    }

    .admin-family-body {
      grid-template-columns: 1fr;
    }

    .admin-family-column + .admin-family-column {
      border-left: 0;
      border-top:
        1px solid
        rgba(136, 94, 74, 0.1);
    }
  }

  @media (max-width: 640px) {
    .admin-families-summary,
    .admin-families-health,
    .admin-families-hero-actions,
    .admin-families-search-form,
    .admin-family-owner-list {
      grid-template-columns: 1fr;
    }

    .admin-families-search-field {
      grid-column: auto;
    }

    .admin-families-search-form > a {
      grid-column: auto;
      justify-self: stretch;
    }

    .admin-families-alert {
      grid-template-columns: 1fr;
    }

    .admin-families-alert-icon {
      width: 45px;
      height: 45px;
    }

    .admin-families-control,
    .admin-families-list-head {
      padding: 16px;
      border-radius: 18px;
    }

    .admin-families-list-head {
      align-items: stretch;
      flex-direction: column;
    }

    .admin-families-list-head > a {
      justify-content: center;
    }

    .admin-family-counts {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 430px) {
    .admin-family-counts {
      grid-template-columns: 1fr;
    }

    .admin-family-member,
    .admin-family-invitation {
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .admin-family-role-badge,
    .admin-family-invitation-badge {
      margin-left: 46px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .admin-families-page a,
    .admin-families-page button {
      transition: none;
    }
  }
`;
