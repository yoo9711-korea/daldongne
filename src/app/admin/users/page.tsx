import { auth } from "@/auth";
import AdminRoleActionButton from "@/components/admin/AdminRoleActionButton";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    role?: string;
    sort?: string;
    page?: string;
  }>;
};

type RoleFilter =
  | "ALL"
  | "ADMIN"
  | "USER";

type SortOrder =
  | "NEWEST"
  | "OLDEST"
  | "NAME_ASC"
  | "UPDATED_DESC";

type RoleAction = (
  formData: FormData,
) => Promise<void>;

const PAGE_SIZE = 20;

const ROLE_FILTERS: Array<{
  value: RoleFilter;
  label: string;
}> = [
  {
    value: "ALL",
    label: "전체 권한",
  },
  {
    value: "ADMIN",
    label: "관리자",
  },
  {
    value: "USER",
    label: "일반 회원",
  },
];

const SORT_OPTIONS: Array<{
  value: SortOrder;
  label: string;
}> = [
  {
    value: "NEWEST",
    label: "최근 가입순",
  },
  {
    value: "OLDEST",
    label: "오래된 가입순",
  },
  {
    value: "NAME_ASC",
    label: "이름순",
  },
  {
    value: "UPDATED_DESC",
    label: "최근 수정순",
  },
];

export default async function AdminUsersPage({
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
        id: true,
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

  const roleFilter =
    normalizeRoleFilter(
      resolvedSearchParams?.role,
    );

  const sortOrder =
    normalizeSortOrder(
      resolvedSearchParams?.sort,
    );

  const requestedPage =
    normalizePage(
      resolvedSearchParams?.page,
    );

  const userWhere: Prisma.UserWhereInput =
    {};

  if (searchQuery) {
    userWhere.OR = [
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
    ];
  }

  if (roleFilter !== "ALL") {
    userWhere.role = roleFilter;
  }

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
        role: "ADMIN",
      },
    }),

    prisma.memory.count(),

    prisma.book.count(),

    prisma.familyMember.count(),
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredUserCount /
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

  const users =
    await prisma.user.findMany({
      where: userWhere,
      orderBy:
        getUserOrderBy(sortOrder),
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
          by: ["userId"],
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

  const familyCountMap =
    new Map(
      familyMemberCounts.map(
        (item) => [
          item.userId,
          item._count._all,
        ],
      ),
    );

  const firstVisibleUser =
    filteredUserCount === 0
      ? 0
      : skip + 1;

  const lastVisibleUser =
    Math.min(
      skip + users.length,
      filteredUserCount,
    );

  const pageNumbers =
    getPageNumbers(
      currentPage,
      totalPages,
    );

  const generalUserCount =
    Math.max(
      totalUserCount - adminCount,
      0,
    );

  const averageMemoryCount =
    totalUserCount > 0
      ? Math.round(
          totalMemoryCount /
            totalUserCount,
        )
      : 0;

  const averageBookCount =
    totalUserCount > 0
      ? Math.round(
          totalBookCount /
            totalUserCount,
        )
      : 0;

  const hasActiveCondition =
    Boolean(searchQuery) ||
    roleFilter !== "ALL" ||
    sortOrder !== "NEWEST";

  async function toggleAdmin(
    formData: FormData,
  ) {
    "use server";

    const currentSession =
      await auth();

    if (
      !currentSession?.user?.id
    ) {
      return;
    }

    const actingUser =
      await prisma.user.findUnique({
        where: {
          id:
            currentSession.user.id,
        },
        select: {
          id: true,
          role: true,
        },
      });

    if (
      actingUser?.role !== "ADMIN"
    ) {
      return;
    }

    const targetId = String(
      formData.get("userId") ||
        "",
    ).trim();

    if (
      !targetId ||
      targetId ===
        currentSession.user.id
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

    if (
      targetUser.role === "ADMIN"
    ) {
      const currentAdminCount =
        await prisma.user.count({
          where: {
            role: "ADMIN",
          },
        });

      if (
        currentAdminCount <= 1
      ) {
        return;
      }
    }

    await prisma.user.update({
      where: {
        id: targetUser.id,
      },
      data: {
        role:
          targetUser.role ===
          "ADMIN"
            ? "USER"
            : "ADMIN",
      },
    });

    revalidatePath(
      "/admin/users",
    );
    revalidatePath("/admin");
  }

  return (
    <main className="admin-users-page">
      <style>
        {adminUsersStyles}
      </style>

      <div className="admin-users-shell">
        <header className="admin-users-hero">
          <div>
            <p>
              관리자 · 회원 관리
            </p>

            <h1>
              회원 활동과 관리자
              권한을 관리합니다
            </h1>

            <span>
              회원별 기록, 책, 가족
              공간 참여 현황을 확인하고
              필요한 경우 관리자 권한을
              지정하거나 해제하세요.
            </span>
          </div>

          <div className="admin-users-hero-actions">
            <Link href="/admin">
              관리자 홈
            </Link>

            <Link href="/admin/books">
              전체 책 관리
            </Link>

            <Link href="/admin/families">
              가족 공간 관리
              <span aria-hidden="true">
                →
              </span>
            </Link>
          </div>
        </header>

        <section className="admin-users-summary">
          <SummaryCard
            label="전체 회원"
            value={totalUserCount}
            unit="명"
            tone="coral"
          />

          <SummaryCard
            label="관리자"
            value={adminCount}
            unit="명"
            tone="purple"
          />

          <SummaryCard
            label="일반 회원"
            value={generalUserCount}
            unit="명"
            tone="blue"
          />

          <SummaryCard
            label="전체 기록"
            value={totalMemoryCount}
            unit="개"
            tone="yellow"
          />

          <SummaryCard
            label="전체 책"
            value={totalBookCount}
            unit="권"
            tone="green"
          />

          <SummaryCard
            label="가족 공간 참여"
            value={
              totalFamilyMembershipCount
            }
            unit="건"
            tone="gray"
          />
        </section>

        <section className="admin-users-insight">
          <div>
            <span>
              회원 1명당 평균 기록
            </span>

            <strong>
              {averageMemoryCount.toLocaleString()}
              <small>개</small>
            </strong>
          </div>

          <div>
            <span>
              회원 1명당 평균 책
            </span>

            <strong>
              {averageBookCount.toLocaleString()}
              <small>권</small>
            </strong>
          </div>

          <p>
            본인의 관리자 권한은
            직접 변경할 수 없으며,
            마지막 관리자 1명의 권한은
            해제할 수 없습니다.
          </p>
        </section>

        <section className="admin-users-control">
          <form
            action="/admin/users"
            method="get"
            className="admin-users-search-form"
          >
            <label className="admin-users-search-field">
              <span>
                회원 검색
              </span>

              <div>
                <SearchIcon />

                <input
                  type="search"
                  name="q"
                  defaultValue={
                    searchQuery
                  }
                  placeholder="회원 이름 또는 이메일"
                  maxLength={100}
                />
              </div>
            </label>

            <label className="admin-users-select-field">
              <span>
                회원 권한
              </span>

              <select
                name="role"
                defaultValue={
                  roleFilter
                }
              >
                {ROLE_FILTERS.map(
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

            <label className="admin-users-select-field">
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
              <Link href="/admin/users">
                전체 초기화
              </Link>
            ) : null}
          </form>

          <div className="admin-users-quick-filter">
            {ROLE_FILTERS.map(
              (filter) => {
                const count =
                  filter.value ===
                  "ALL"
                    ? totalUserCount
                    : filter.value ===
                        "ADMIN"
                      ? adminCount
                      : generalUserCount;

                return (
                  <Link
                    key={filter.value}
                    href={buildUsersHref({
                      searchQuery,
                      role:
                        filter.value,
                      sort: sortOrder,
                    })}
                    data-active={
                      roleFilter ===
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

        <section className="admin-users-list-section">
          <div className="admin-users-list-head">
            <div>
              <p>회원 목록</p>

              <h2>
                회원 활동과 권한을
                확인하세요
              </h2>

              <span>
                {filteredUserCount >
                0
                  ? `${filteredUserCount.toLocaleString()}명 중 ${firstVisibleUser.toLocaleString()}–${lastVisibleUser.toLocaleString()}번째 회원`
                  : "현재 조건에 맞는 회원이 없습니다."}
              </span>
            </div>

            {hasActiveCondition ? (
              <Link href="/admin/users">
                전체 회원 보기
              </Link>
            ) : null}
          </div>

          {users.length > 0 ? (
            <>
              <div className="admin-users-desktop">
                <div className="admin-users-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>회원</th>
                        <th>이메일</th>
                        <th>기록</th>
                        <th>책</th>
                        <th>가족 공간</th>
                        <th>권한</th>
                        <th>가입일</th>
                        <th>최근 수정</th>
                        <th>권한 관리</th>
                      </tr>
                    </thead>

                    <tbody>
                      {users.map(
                        (user) => {
                          const isSelf =
                            user.id ===
                            session.user
                              .id;

                          const isLastAdmin =
                            user.role ===
                              "ADMIN" &&
                            adminCount <=
                              1;

                          const familyCount =
                            familyCountMap.get(
                              user.id,
                            ) ?? 0;

                          return (
                            <tr
                              key={
                                user.id
                              }
                            >
                              <td>
                                <UserIdentity
                                  name={
                                    user.name
                                  }
                                  email={
                                    user.email
                                  }
                                  image={
                                    user.image
                                  }
                                  isSelf={
                                    isSelf
                                  }
                                />
                              </td>

                              <td className="admin-users-email-cell">
                                {user.email ||
                                  "이메일 없음"}
                              </td>

                              <td>
                                <ActivityValue
                                  value={
                                    user
                                      ._count
                                      .memories
                                  }
                                  unit="개"
                                />
                              </td>

                              <td>
                                <ActivityValue
                                  value={
                                    user
                                      ._count
                                      .books
                                  }
                                  unit="권"
                                />
                              </td>

                              <td>
                                <ActivityValue
                                  value={
                                    familyCount
                                  }
                                  unit="곳"
                                />
                              </td>

                              <td>
                                <RoleBadge
                                  role={
                                    user.role
                                  }
                                />
                              </td>

                              <td className="admin-users-date-cell">
                                {formatDate(
                                  user.createdAt,
                                )}
                              </td>

                              <td className="admin-users-date-cell">
                                {formatDate(
                                  user.updatedAt,
                                )}
                              </td>

                              <td>
                                <RoleControl
                                  userId={
                                    user.id
                                  }
                                  role={
                                    user.role
                                  }
                                  isSelf={
                                    isSelf
                                  }
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
                        },
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="admin-users-mobile">
                {users.map(
                  (user) => {
                    const isSelf =
                      user.id ===
                      session.user.id;

                    const isLastAdmin =
                      user.role ===
                        "ADMIN" &&
                      adminCount <= 1;

                    const familyCount =
                      familyCountMap.get(
                        user.id,
                      ) ?? 0;

                    return (
                      <article
                        key={user.id}
                        className="admin-users-mobile-card"
                      >
                        <div className="admin-users-mobile-top">
                          <UserIdentity
                            name={
                              user.name
                            }
                            email={
                              user.email
                            }
                            image={
                              user.image
                            }
                            isSelf={
                              isSelf
                            }
                          />

                          <RoleBadge
                            role={
                              user.role
                            }
                          />
                        </div>

                        <p className="admin-users-mobile-email">
                          {user.email ||
                            "이메일 없음"}
                        </p>

                        <div className="admin-users-mobile-stats">
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
                            value={`${familyCount.toLocaleString()}곳`}
                          />
                        </div>

                        <div className="admin-users-mobile-dates">
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

                        <div className="admin-users-mobile-action">
                          <RoleControl
                            userId={
                              user.id
                            }
                            role={
                              user.role
                            }
                            isSelf={
                              isSelf
                            }
                            isLastAdmin={
                              isLastAdmin
                            }
                            action={
                              toggleAdmin
                            }
                          />
                        </div>
                      </article>
                    );
                  },
                )}
              </div>

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
                role={roleFilter}
                sort={sortOrder}
              />
            </>
          ) : (
            <div className="admin-users-empty">
              <UserIcon />

              <strong>
                현재 조건에 맞는
                회원이 없습니다.
              </strong>

              <p>
                검색어나 권한 필터를
                변경해 주세요.
              </p>

              <Link href="/admin/users">
                전체 회원 보기
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
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
    | "purple"
    | "blue"
    | "yellow"
    | "green"
    | "gray";
}) {
  return (
    <article
      className="admin-users-summary-card"
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
    name || "이름 없음";

  return (
    <div className="admin-user-identity">
      {image ? (
        <img
          src={image}
          alt={`${displayName} 프로필`}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="admin-user-avatar">
          {(name ||
            email ||
            "?")
            .charAt(0)
            .toUpperCase()}
        </div>
      )}

      <div>
        <strong>
          {displayName}
        </strong>

        {isSelf ? (
          <span>
            현재 로그인 계정
          </span>
        ) : null}
      </div>
    </div>
  );
}

function ActivityValue({
  value,
  unit,
}: {
  value: number;
  unit: string;
}) {
  return (
    <div className="admin-users-activity-value">
      <strong>
        {value.toLocaleString()}
      </strong>

      <span>{unit}</span>
    </div>
  );
}

function RoleBadge({
  role,
}: {
  role: string;
}) {
  return (
    <span
      className="admin-users-role-badge"
      data-role={role}
    >
      {role === "ADMIN"
        ? "관리자"
        : "일반 회원"}
    </span>
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
    ? "본인의 관리자 권한은 이 화면에서 변경할 수 없습니다."
    : isLastAdmin
      ? "마지막 관리자 1명의 권한은 해제할 수 없습니다."
      : "";

  const label = isSelf
    ? "내 계정"
    : isLastAdmin
      ? "마지막 관리자"
      : role === "ADMIN"
        ? "관리자 해제"
        : "관리자 지정";

  return (
    <form action={action}>
      <input
        type="hidden"
        name="userId"
        value={userId}
      />

      <AdminRoleActionButton
        label={label}
        currentRole={role}
        disabled={disabled}
        disabledReason={disabledTitle}
        confirmMessage={getRoleConfirmMessage(
          role,
        )}
      />
    </form>
  );
}

function getRoleConfirmMessage(
  currentRole: string,
) {
  if (currentRole === "ADMIN") {
    return [
      "이 회원의 관리자 권한을 해제할까요?",
      "",
      "권한을 해제하면 관리자 화면에 접근할 수 없게 됩니다.",
    ].join("\n");
  }

  return [
    "이 회원에게 관리자 권한을 부여할까요?",
    "",
    "관리자는 회원 정보, 고객 문의, 상품 신청과 제작 상태를 관리할 수 있습니다.",
    "신뢰할 수 있는 계정인지 확인한 후 진행해 주세요.",
  ].join("\n");
}

function MobileInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="admin-users-mobile-info">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  pageNumbers,
  searchQuery,
  role,
  sort,
}: {
  currentPage: number;
  totalPages: number;
  pageNumbers: number[];
  searchQuery: string;
  role: RoleFilter;
  sort: SortOrder;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      className="admin-users-pagination"
      aria-label="회원 목록 페이지 이동"
    >
      {currentPage > 1 ? (
        <Link
          href={buildUsersHref({
            searchQuery,
            role,
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
            href={buildUsersHref({
              searchQuery,
              role,
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
          href={buildUsersHref({
            searchQuery,
            role,
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

function UserIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="32"
        cy="23"
        r="11"
        stroke="currentColor"
        strokeWidth="3"
      />

      <path
        d="M13 53c2.7-10 9-15 19-15s16.3 5 19 15"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function normalizeRoleFilter(
  value: string | undefined,
): RoleFilter {
  if (value === "ADMIN") {
    return "ADMIN";
  }

  if (value === "USER") {
    return "USER";
  }

  return "ALL";
}

function normalizeSortOrder(
  value: string | undefined,
): SortOrder {
  if (value === "OLDEST") {
    return "OLDEST";
  }

  if (value === "NAME_ASC") {
    return "NAME_ASC";
  }

  if (
    value === "UPDATED_DESC"
  ) {
    return "UPDATED_DESC";
  }

  return "NEWEST";
}

function getUserOrderBy(
  sort: SortOrder,
): Prisma.UserOrderByWithRelationInput {
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

  if (
    sort === "UPDATED_DESC"
  ) {
    return {
      updatedAt: "desc",
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

function buildUsersHref({
  searchQuery = "",
  role = "ALL",
  sort = "NEWEST",
  page = 1,
}: {
  searchQuery?: string;
  role?: RoleFilter;
  sort?: SortOrder;
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

  if (role !== "ALL") {
    params.set(
      "role",
      role,
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
    ? `/admin/users?${query}`
    : "/admin/users";
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

const adminUsersStyles = `
  .admin-users-page,
  .admin-users-page * {
    box-sizing: border-box;
  }

  .admin-users-page {
    min-height: 100%;
    color: #432f26;
    font-family:
      var(--font-daldongne-sans),
      "Noto Sans KR",
      sans-serif;
  }

  .admin-users-page a {
    color: inherit;
    text-decoration: none;
  }

  .admin-users-page a,
  .admin-users-page button {
    transition:
      transform 160ms ease,
      box-shadow 160ms ease,
      border-color 160ms ease;
  }

  .admin-users-page a:hover,
  .admin-users-page button:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  .admin-users-page a:focus-visible,
  .admin-users-page button:focus-visible,
  .admin-users-page input:focus-visible,
  .admin-users-page select:focus-visible {
    outline:
      4px solid
      rgba(239, 105, 83, 0.2);
    outline-offset: 3px;
  }

  .admin-users-shell {
    width: min(1480px, 100%);
    margin: 0 auto;
  }

  .admin-users-hero {
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
        circle at 90% 5%,
        rgba(229, 240, 255, 0.7),
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

  .admin-users-hero > div:first-child {
    min-width: 0;
  }

  .admin-users-hero p {
    margin: 0;
    color: #e56852;
    font-size: 13.2px;
    font-weight: 900;
    letter-spacing: 0.08em;
  }

  .admin-users-hero h1 {
    margin: 8px 0 0;
    max-width: 760px;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size:
      clamp(33px, 4vw, 50px);
    line-height: 1.24;
    letter-spacing: -0.055em;
  }

  .admin-users-hero > div:first-child > span {
    display: block;
    max-width: 720px;
    margin-top: 10px;
    color: #76635a;
    font-size: 15.6px;
    line-height: 1.78;
  }

  .admin-users-hero-actions {
    min-width: 260px;
    display: grid;
    gap: 8px;
  }

  .admin-users-hero-actions a {
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

  .admin-users-hero-actions a:last-child {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
  }

  .admin-users-summary {
    margin-top: 16px;
    display: grid;
    grid-template-columns:
      repeat(6, minmax(0, 1fr));
    gap: 9px;
  }

  .admin-users-summary-card {
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

  .admin-users-summary-card[data-tone="coral"] {
    background: #fff0eb;
  }

  .admin-users-summary-card[data-tone="purple"] {
    background: #f3edff;
  }

  .admin-users-summary-card[data-tone="blue"] {
    background: #edf5ff;
  }

  .admin-users-summary-card[data-tone="yellow"] {
    background: #fff7da;
  }

  .admin-users-summary-card[data-tone="green"] {
    background: #edf7e9;
  }

  .admin-users-summary-card[data-tone="gray"] {
    background: #f2efed;
  }

  .admin-users-summary-card > span {
    color: #7a675e;
    font-size: 9px;
    font-weight: 850;
  }

  .admin-users-summary-card > strong {
    display: block;
    margin-top: 6px;
    color: #e0644e;
    font-size: 25px;
  }

  .admin-users-summary-card small {
    margin-left: 3px;
    color: #806d64;
    font-size: 9px;
  }

  .admin-users-insight {
    margin-top: 10px;
    padding: 13px 16px;
    display: grid;
    grid-template-columns:
      repeat(2, minmax(140px, auto))
      minmax(0, 1fr);
    align-items: center;
    gap: 12px;
    border:
      1px solid
      rgba(136, 94, 74, 0.12);
    border-radius: 15px;
    background:
      rgba(255, 255, 255, 0.9);
  }

  .admin-users-insight > div {
    padding: 7px 12px;
    border-right:
      1px solid
      rgba(136, 94, 74, 0.12);
  }

  .admin-users-insight span,
  .admin-users-insight strong {
    display: block;
  }

  .admin-users-insight span {
    color: #846f65;
    font-size: 8.4px;
  }

  .admin-users-insight strong {
    margin-top: 3px;
    font-size: 16px;
  }

  .admin-users-insight small {
    margin-left: 3px;
    color: #8a756a;
    font-size: 8.4px;
  }

  .admin-users-insight > p {
    margin: 0;
    color: #7a675e;
    font-size: 9.6px;
    line-height: 1.65;
  }

  .admin-users-control,
  .admin-users-list-section {
    margin-top: 16px;
    padding: 21px;
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

  .admin-users-search-form {
    display: grid;
    grid-template-columns:
      minmax(280px, 1fr)
      minmax(140px, 0.3fr)
      minmax(150px, 0.3fr)
      auto auto;
    align-items: end;
    gap: 8px;
  }

  .admin-users-search-field > span,
  .admin-users-select-field > span {
    display: block;
    margin-bottom: 6px;
    color: #6d584e;
    font-size: 9.6px;
    font-weight: 900;
  }

  .admin-users-search-field > div {
    position: relative;
  }

  .admin-users-search-field svg {
    position: absolute;
    left: 12px;
    top: 50%;
    width: 21px;
    height: 21px;
    color: #9b7d70;
    transform: translateY(-50%);
    pointer-events: none;
  }

  .admin-users-search-form input,
  .admin-users-search-form select {
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

  .admin-users-search-form input {
    padding: 0 13px 0 41px;
  }

  .admin-users-search-form select {
    padding: 0 10px;
  }

  .admin-users-search-form button,
  .admin-users-search-form > a {
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

  .admin-users-search-form button {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
  }

  .admin-users-quick-filter {
    margin-top: 14px;
    padding-top: 14px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    border-top:
      1px solid
      rgba(136, 94, 74, 0.1);
  }

  .admin-users-quick-filter a {
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

  .admin-users-quick-filter a[data-active="true"] {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
  }

  .admin-users-quick-filter small {
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

  .admin-users-list-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 17px;
    margin-bottom: 15px;
  }

  .admin-users-list-head p {
    margin: 0;
    color: #e56852;
    font-size: 10.8px;
    font-weight: 900;
    letter-spacing: 0.07em;
  }

  .admin-users-list-head h2 {
    margin: 6px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 27px;
    line-height: 1.42;
    letter-spacing: -0.045em;
  }

  .admin-users-list-head div > span {
    display: block;
    margin-top: 5px;
    color: #7a675e;
    font-size: 12px;
  }

  .admin-users-list-head > a {
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

  .admin-users-table-wrap {
    overflow-x: auto;
    border:
      1px solid
      rgba(136, 94, 74, 0.12);
    border-radius: 15px;
  }

  .admin-users-table-wrap table {
    width: 100%;
    min-width: 1120px;
    border-collapse: collapse;
    background: #ffffff;
  }

  .admin-users-table-wrap thead {
    background: #f7f0ea;
  }

  .admin-users-table-wrap th {
    padding: 12px 13px;
    color: #7d695f;
    font-size: 9.6px;
    font-weight: 900;
    text-align: left;
    white-space: nowrap;
  }

  .admin-users-table-wrap td {
    padding: 12px 13px;
    border-top:
      1px solid
      rgba(136, 94, 74, 0.08);
    vertical-align: middle;
  }

  .admin-users-table-wrap tr:hover td {
    background: #fffaf6;
  }

  .admin-user-identity {
    min-width: 155px;
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .admin-user-identity > img,
  .admin-user-avatar {
    width: 38px;
    height: 38px;
    flex: 0 0 auto;
    border-radius: 50%;
    object-fit: cover;
    background: #efe6df;
  }

  .admin-user-avatar {
    display: grid;
    place-items: center;
    color: #9a6f60;
    font-size: 15.6px;
    font-weight: 900;
  }

  .admin-user-identity > div:last-child {
    min-width: 0;
  }

  .admin-user-identity strong,
  .admin-user-identity span {
    display: block;
  }

  .admin-user-identity strong {
    overflow: hidden;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .admin-user-identity span {
    margin-top: 3px;
    color: #d35e49;
    font-size: 7.2px;
    font-weight: 900;
  }

  .admin-users-email-cell {
    max-width: 230px;
    color: #78645a;
    font-size: 9.6px;
    word-break: break-all;
  }

  .admin-users-activity-value {
    min-width: 48px;
    text-align: center;
  }

  .admin-users-activity-value strong,
  .admin-users-activity-value span {
    display: block;
  }

  .admin-users-activity-value strong {
    font-size: 13.2px;
  }

  .admin-users-activity-value span {
    margin-top: 2px;
    color: #90796e;
    font-size: 7.2px;
  }

  .admin-users-role-badge {
    min-height: 25px;
    padding: 0 8px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    color: #76665e;
    background: #eee9e5;
    font-size: 8.4px;
    font-weight: 900;
    white-space: nowrap;
  }

  .admin-users-role-badge[data-role="ADMIN"] {
    color: #ffffff;
    background: #7b3730;
  }

  .admin-users-date-cell {
    color: #8a756a;
    font-size: 8.4px;
    white-space: nowrap;
  }

  .admin-users-role-button {
    min-height: 32px;
    padding: 0 9px;
    border:
      1px solid
      rgba(136, 94, 74, 0.22);
    border-radius: 9px;
    color: #765247;
    background: #ffffff;
    font: inherit;
    font-size: 8.4px;
    font-weight: 900;
    white-space: nowrap;
    cursor: pointer;
  }

  .admin-users-role-button[data-role="ADMIN"] {
    border-color: #e4a29a;
    color: #903c34;
    background: #fff0ee;
  }

  .admin-users-role-button:disabled {
    border-color:
      rgba(136, 94, 74, 0.1);
    color: #9b8a81;
    background: #f3efec;
    cursor: not-allowed;
    opacity: 0.66;
  }

  .admin-users-mobile {
    display: none;
  }

  .admin-users-pagination {
    margin-top: 16px;
    padding-top: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 6px;
    border-top:
      1px solid
      rgba(136, 94, 74, 0.1);
  }

  .admin-users-pagination a,
  .admin-users-pagination > span {
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

  .admin-users-pagination a[data-active="true"] {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
  }

  .admin-users-pagination > span[data-disabled="true"] {
    opacity: 0.42;
  }

  .admin-users-empty {
    padding: 52px 20px;
    border:
      1px dashed #ddb2a1;
    border-radius: 17px;
    background: #fffaf7;
    text-align: center;
  }

  .admin-users-empty svg {
    width: 54px;
    height: 54px;
    color: #e57059;
  }

  .admin-users-empty strong {
    display: block;
    margin-top: 11px;
    font-size: 16px;
  }

  .admin-users-empty p {
    margin: 5px 0 0;
    color: #806b61;
    font-size: 12px;
  }

  .admin-users-empty a {
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
    .admin-users-summary {
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
    }

    .admin-users-search-form {
      grid-template-columns:
        minmax(250px, 1fr)
        repeat(2, minmax(140px, 0.45fr))
        auto;
    }

    .admin-users-search-form > a {
      grid-column: 1 / -1;
      justify-self: start;
    }
  }

  @media (max-width: 880px) {
    .admin-users-hero {
      align-items: stretch;
      flex-direction: column;
      padding: 25px;
      border-radius: 22px;
    }

    .admin-users-hero-actions {
      min-width: 0;
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
    }

    .admin-users-insight {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .admin-users-insight > p {
      grid-column: 1 / -1;
    }

    .admin-users-search-form {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .admin-users-search-field {
      grid-column: 1 / -1;
    }

    .admin-users-desktop {
      display: none;
    }

    .admin-users-mobile {
      display: grid;
      gap: 10px;
    }

    .admin-users-mobile-card {
      padding: 14px;
      border:
        1px solid
        rgba(136, 94, 74, 0.13);
      border-radius: 15px;
      background: #fffaf6;
    }

    .admin-users-mobile-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;
    }

    .admin-users-mobile-email {
      margin: 11px 0 0;
      color: #78645a;
      font-size: 9.6px;
      word-break: break-all;
    }

    .admin-users-mobile-stats,
    .admin-users-mobile-dates {
      margin-top: 10px;
      display: grid;
      gap: 7px;
    }

    .admin-users-mobile-stats {
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
    }

    .admin-users-mobile-dates {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .admin-users-mobile-info {
      min-width: 0;
      padding: 9px;
      border-radius: 10px;
      background: #f4ede8;
      text-align: center;
    }

    .admin-users-mobile-info span,
    .admin-users-mobile-info strong {
      display: block;
    }

    .admin-users-mobile-info span {
      color: #8a756a;
      font-size: 7.2px;
    }

    .admin-users-mobile-info strong {
      margin-top: 4px;
      overflow: hidden;
      font-size: 10.8px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .admin-users-mobile-action {
      margin-top: 11px;
      padding-top: 11px;
      display: flex;
      justify-content: flex-end;
      border-top:
        1px solid
        rgba(136, 94, 74, 0.1);
    }
  }

  @media (max-width: 620px) {
    .admin-users-summary {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .admin-users-hero-actions,
    .admin-users-search-form {
      grid-template-columns: 1fr;
    }

    .admin-users-search-field {
      grid-column: auto;
    }

    .admin-users-search-form > a {
      grid-column: auto;
      justify-self: stretch;
    }

    .admin-users-insight {
      grid-template-columns: 1fr;
    }

    .admin-users-insight > div {
      border-right: 0;
      border-bottom:
        1px solid
        rgba(136, 94, 74, 0.12);
    }

    .admin-users-insight > p {
      grid-column: auto;
    }

    .admin-users-control,
    .admin-users-list-section {
      padding: 16px;
      border-radius: 18px;
    }

    .admin-users-list-head {
      align-items: stretch;
      flex-direction: column;
    }

    .admin-users-list-head > a {
      justify-content: center;
    }
  }

  @media (max-width: 420px) {
    .admin-users-summary,
    .admin-users-mobile-stats,
    .admin-users-mobile-dates {
      grid-template-columns: 1fr;
    }

    .admin-users-mobile-top {
      align-items: stretch;
      flex-direction: column;
    }

    .admin-users-mobile-top
    .admin-users-role-badge {
      align-self: flex-start;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .admin-users-page a,
    .admin-users-page button {
      transition: none;
    }
  }
`;
