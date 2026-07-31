import { auth } from "@/auth";
import CopyTextButton from "@/components/admin/CopyTextButton";
import ProductApplicationAdminNote from "@/components/admin/ProductApplicationAdminNote";
import ProductApplicationStatusButton from "@/components/admin/ProductApplicationStatusButton";
import { PRODUCT_ADDONS } from "@/lib/products/catalog";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    sort?: string;
    page?: string;
  }>;
};

type StatusFilter =
  | "ALL"
  | "REQUESTED"
  | "CONTACTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELED";

type SortOrder =
  | "NEWEST"
  | "OLDEST"
  | "UPDATED_DESC"
  | "PRICE_DESC"
  | "PRICE_ASC";

const PAGE_SIZE = 15;

const STATUS_FILTERS: Array<{
  value: StatusFilter;
  label: string;
}> = [
  {
    value: "ALL",
    label: "전체 신청",
  },
  {
    value: "REQUESTED",
    label: "새로운 접수",
  },
  {
    value: "CONTACTED",
    label: "연락 완료",
  },
  {
    value: "IN_PROGRESS",
    label: "진행 중",
  },
  {
    value: "COMPLETED",
    label: "처리 완료",
  },
  {
    value: "CANCELED",
    label: "신청 취소",
  },
];

const SORT_OPTIONS: Array<{
  value: SortOrder;
  label: string;
}> = [
  {
    value: "NEWEST",
    label: "최근 접수순",
  },
  {
    value: "OLDEST",
    label: "오래된 접수순",
  },
  {
    value: "UPDATED_DESC",
    label: "최근 변경순",
  },
  {
    value: "PRICE_DESC",
    label: "가격 높은순",
  },
  {
    value: "PRICE_ASC",
    label: "가격 낮은순",
  },
];

export default async function AdminProductApplicationsPage({
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

  const applicationWhere:
    Prisma.ProductApplicationWhereInput =
    {};

  if (searchQuery) {
    applicationWhere.OR = [
      {
        productName: {
          contains: searchQuery,
        },
      },
      {
        productCode: {
          contains: searchQuery,
        },
      },
      {
        name: {
          contains: searchQuery,
        },
      },
      {
        phone: {
          contains: searchQuery,
        },
      },
      {
        email: {
          contains: searchQuery,
        },
      },
      {
        message: {
          contains: searchQuery,
        },
      },
      {
        adminNote: {
          contains: searchQuery,
        },
      },
      {
        user: {
          is: {
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
    ];
  }

  if (statusFilter !== "ALL") {
    applicationWhere.status =
      statusFilter;
  }

  const [
    filteredApplicationCount,
    totalApplicationCount,
    requestedCount,
    contactedCount,
    inProgressCount,
    completedCount,
    canceledCount,
    oneTimeCount,
    monthlyCount,
  ] = await Promise.all([
    prisma.productApplication.count({
      where: applicationWhere,
    }),

    prisma.productApplication.count(),

    prisma.productApplication.count({
      where: {
        status: "REQUESTED",
      },
    }),

    prisma.productApplication.count({
      where: {
        status: "CONTACTED",
      },
    }),

    prisma.productApplication.count({
      where: {
        status: "IN_PROGRESS",
      },
    }),

    prisma.productApplication.count({
      where: {
        status: "COMPLETED",
      },
    }),

    prisma.productApplication.count({
      where: {
        status: "CANCELED",
      },
    }),

    prisma.productApplication.count({
      where: {
        billingType: "ONE_TIME",
      },
    }),

    prisma.productApplication.count({
      where: {
        billingType: "MONTHLY",
      },
    }),
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredApplicationCount /
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

  const applications =
    await prisma.productApplication.findMany({
      where: applicationWhere,
      orderBy:
        getApplicationOrderBy(
          sortOrder,
        ),
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        productCode: true,
        productName: true,
        category: true,
        billingType: true,
        price: true,
        name: true,
        phone: true,
        email: true,
        message: true,
        addonCodes: true,
        adminNote: true,
        adminNoteUpdatedAt: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

  const activeCount =
    requestedCount +
    contactedCount +
    inProgressCount;

  const firstVisibleApplication =
    filteredApplicationCount === 0
      ? 0
      : skip + 1;

  const lastVisibleApplication =
    Math.min(
      skip + applications.length,
      filteredApplicationCount,
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

  const exportParams =
    new URLSearchParams();

  if (searchQuery) {
    exportParams.set(
      "q",
      searchQuery,
    );
  }

  if (statusFilter !== "ALL") {
    exportParams.set(
      "status",
      statusFilter,
    );
  }

  const exportQuery =
    exportParams.toString();

  const exportHref =
    `/api/admin/product-applications/export${
      exportQuery
        ? `?${exportQuery}`
        : ""
    }`;

  return (
    <main className="admin-products-page">
      <style>
        {adminProductsStyles}
      </style>

      <div className="admin-products-shell">
        <header className="admin-products-hero">
          <div>
            <p>
              관리자 · 상품 신청 관리
            </p>

            <h1>
              상품 신청부터 상담 완료까지
              한곳에서 관리합니다
            </h1>

            <span>
              인생책 제작과 월간 기록
              신청자의 연락처, 추가 옵션,
              요청사항, 내부 메모와 처리
              상태를 확인하세요.
            </span>
          </div>

          <div className="admin-products-hero-actions">
            <Link href="/admin">
              관리자 홈
            </Link>

            <Link href="/pricing">
              상품 안내 보기
            </Link>

            <a href={exportHref}>
              현재 조건 CSV
              <span aria-hidden="true">
                ↓
              </span>
            </a>
          </div>
        </header>

        <section
          className="admin-products-alert"
          data-active={
            activeCount > 0
              ? "true"
              : "false"
          }
        >
          <span className="admin-products-alert-icon">
            {activeCount > 0 ? (
              <ApplicationIcon />
            ) : (
              <CheckIcon />
            )}
          </span>

          <div>
            <p>처리 현황</p>

            <h2>
              {activeCount > 0
                ? `처리가 필요한 상품 신청이 ${activeCount.toLocaleString()}건 있습니다.`
                : "현재 처리할 상품 신청이 없습니다."}
            </h2>

            <span>
              새로운 접수{" "}
              {requestedCount.toLocaleString()}
              건 · 연락 완료{" "}
              {contactedCount.toLocaleString()}
              건 · 진행 중{" "}
              {inProgressCount.toLocaleString()}
              건
            </span>
          </div>

          <div className="admin-products-alert-actions">
            {requestedCount > 0 ? (
              <Link href="/admin/product-applications?status=REQUESTED">
                새 신청 확인
              </Link>
            ) : null}

            {inProgressCount > 0 ? (
              <Link href="/admin/product-applications?status=IN_PROGRESS">
                진행 중 확인
              </Link>
            ) : null}
          </div>
        </section>

        <section className="admin-products-summary">
          <SummaryCard
            label="전체 신청"
            value={totalApplicationCount}
            unit="건"
            tone="coral"
          />

          <SummaryCard
            label="새로운 접수"
            value={requestedCount}
            unit="건"
            tone="yellow"
          />

          <SummaryCard
            label="연락 완료"
            value={contactedCount}
            unit="건"
            tone="blue"
          />

          <SummaryCard
            label="진행 중"
            value={inProgressCount}
            unit="건"
            tone="purple"
          />

          <SummaryCard
            label="처리 완료"
            value={completedCount}
            unit="건"
            tone="green"
          />

          <SummaryCard
            label="신청 취소"
            value={canceledCount}
            unit="건"
            tone="gray"
          />
        </section>

        <section className="admin-products-billing">
          <div>
            <span>한 번 결제 신청</span>

            <strong>
              {oneTimeCount.toLocaleString()}
              <small>건</small>
            </strong>
          </div>

          <div>
            <span>월간 구독 신청</span>

            <strong>
              {monthlyCount.toLocaleString()}
              <small>건</small>
            </strong>
          </div>

          <p>
            신청 당시의 상품명·가격과
            선택 옵션이 저장되어 있으므로
            현재 상품 안내 가격과 다를 수
            있습니다.
          </p>
        </section>

        <section className="admin-products-control">
          <form
            action="/admin/product-applications"
            method="get"
            className="admin-products-search-form"
          >
            <label className="admin-products-search-field">
              <span>
                신청 검색
              </span>

              <div>
                <SearchIcon />

                <input
                  type="search"
                  name="q"
                  defaultValue={
                    searchQuery
                  }
                  placeholder="상품명, 상품코드, 이름, 연락처, 이메일, 요청사항, 관리자 메모"
                  maxLength={100}
                />
              </div>
            </label>

            <label className="admin-products-select-field">
              <span>
                처리 상태
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

            <label className="admin-products-select-field">
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
              <Link href="/admin/product-applications">
                전체 초기화
              </Link>
            ) : null}
          </form>

          <div className="admin-products-quick-filter">
            {STATUS_FILTERS.map(
              (filter) => {
                const count =
                  getStatusCount(
                    filter.value,
                    {
                      total:
                        totalApplicationCount,
                      requested:
                        requestedCount,
                      contacted:
                        contactedCount,
                      inProgress:
                        inProgressCount,
                      completed:
                        completedCount,
                      canceled:
                        canceledCount,
                    },
                  );

                return (
                  <Link
                    key={filter.value}
                    href={buildApplicationsHref({
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

        <section className="admin-products-list-head">
          <div>
            <p>상품 신청 목록</p>

            <h2>
              신청자와 처리 상태를
              확인하세요
            </h2>

            <span>
              {filteredApplicationCount >
              0
                ? `${filteredApplicationCount.toLocaleString()}건 중 ${firstVisibleApplication.toLocaleString()}–${lastVisibleApplication.toLocaleString()}번째 신청`
                : "현재 조건에 맞는 상품 신청이 없습니다."}
            </span>
          </div>

          <div>
            <a href={exportHref}>
              CSV 내려받기
            </a>

            {hasActiveCondition ? (
              <Link href="/admin/product-applications">
                전체 신청 보기
              </Link>
            ) : null}
          </div>
        </section>

        {applications.length > 0 ? (
          <>
            <section className="admin-products-list">
              {applications.map(
                (application) => {
                  const addonNames =
                    getAddonNames(
                      application.addonCodes,
                    );

                  const customerName =
                    application.name ||
                    application.user.name ||
                    "이름 미입력";

                  const customerEmail =
                    application.email ||
                    application.user.email ||
                    "";

                  const contactValue =
                    application.phone ||
                    customerEmail ||
                    "";

                  return (
                    <article
                      key={application.id}
                      className="admin-product-card"
                    >
                      <header className="admin-product-card-head">
                        <div className="admin-product-title">
                          <div>
                            <StatusBadge
                              status={
                                application.status
                              }
                            />

                            <span>
                              {getCategoryLabel(
                                application.category,
                              )}
                              {" · "}
                              {getBillingLabel(
                                application.billingType,
                              )}
                            </span>
                          </div>

                          <h3>
                            {application.productName}
                          </h3>

                          <p>
                            상품코드{" "}
                            {application.productCode}
                          </p>
                        </div>

                        <div className="admin-product-card-metrics">
                          <Metric
                            label="신청 당시 가격"
                            value={formatApplicationPrice(
                              application.price,
                              application.billingType,
                            )}
                          />

                          <Metric
                            label="접수일"
                            value={formatDateTime(
                              application.createdAt,
                            )}
                          />

                          <Metric
                            label="마지막 변경"
                            value={formatDateTime(
                              application.updatedAt,
                            )}
                          />
                        </div>
                      </header>

                      <div className="admin-product-body">
                        <section className="admin-product-column">
                          <SectionHeading
                            eyebrow="신청자 정보"
                            title={customerName}
                            description={
                              contactValue ||
                              "연락처가 입력되지 않았습니다."
                            }
                          />

                          <div className="admin-product-contact-list">
                            <ContactRow
                              label="이름"
                              value={customerName}
                              copyLabel="이름 복사"
                            />

                            <ContactRow
                              label="전화번호"
                              value={
                                application.phone ||
                                ""
                              }
                              href={
                                application.phone
                                  ? `tel:${application.phone}`
                                  : undefined
                              }
                              copyLabel="번호 복사"
                            />

                            <ContactRow
                              label="이메일"
                              value={
                                customerEmail
                              }
                              href={
                                customerEmail
                                  ? `mailto:${customerEmail}`
                                  : undefined
                              }
                              copyLabel="메일 복사"
                            />

                            <ContactRow
                              label="회원 계정"
                              value={
                                application.user.email ||
                                application.user.name ||
                                ""
                              }
                              href={buildUserSearchHref(
                                application.user.email ||
                                  application.user.name ||
                                  "",
                              )}
                              copyLabel="계정 복사"
                            />
                          </div>
                        </section>

                        <section className="admin-product-column">
                          <SectionHeading
                            eyebrow="선택 상품 정보"
                            title={getCategoryLabel(
                              application.category,
                            )}
                            description={`${getBillingLabel(
                              application.billingType,
                            )} · 신청 당시 가격 기준`}
                          />

                          <div className="admin-product-selection">
                            <InfoBox
                              label="상품명"
                              value={
                                application.productName
                              }
                            />

                            <InfoBox
                              label="상품코드"
                              value={
                                application.productCode
                              }
                            />

                            <InfoBox
                              label="결제 방식"
                              value={getBillingLabel(
                                application.billingType,
                              )}
                            />

                            <InfoBox
                              label="신청 가격"
                              value={formatApplicationPrice(
                                application.price,
                                application.billingType,
                              )}
                            />
                          </div>

                          <div className="admin-product-addon-area">
                            <strong>
                              추가 옵션
                            </strong>

                            {addonNames.length >
                            0 ? (
                              <div className="admin-product-addon-list">
                                {addonNames.map(
                                  (addonName) => (
                                    <span
                                      key={
                                        addonName
                                      }
                                    >
                                      {addonName}
                                    </span>
                                  ),
                                )}
                              </div>
                            ) : (
                              <p>
                                선택한 추가 옵션이
                                없습니다.
                              </p>
                            )}
                          </div>
                        </section>
                      </div>

                      <section className="admin-product-message-section">
                        <SectionHeading
                          eyebrow="신청 요청사항"
                          title={
                            application.message
                              ? "신청자가 남긴 요청사항"
                              : "별도 요청사항 없음"
                          }
                          description="상담 전에 신청 내용을 확인하세요."
                        />

                        <div>
                          {application.message ||
                            "신청자가 별도의 요청사항을 남기지 않았습니다."}
                        </div>
                      </section>

                      <section className="admin-product-management">
                        <div className="admin-product-management-head">
                          <SectionHeading
                            eyebrow="관리자 처리"
                            title="내부 메모와 신청 상태"
                            description="메모는 관리자에게만 표시되며 상태 변경은 즉시 저장됩니다."
                          />

                          <CopyTextButton
                            value={
                              application.id
                            }
                            label="접수번호 복사"
                          />
                        </div>

                        <div className="admin-product-management-grid">
                          <ProductApplicationAdminNote
                            applicationId={
                              application.id
                            }
                            initialNote={
                              application.adminNote ||
                              ""
                            }
                            updatedAt={
                              application.adminNoteUpdatedAt
                                ? formatDateTime(
                                    application.adminNoteUpdatedAt,
                                  )
                                : null
                            }
                          />

                          <div className="admin-product-status-control">
                            <div>
                              <span>
                                현재 상태
                              </span>

                              <StatusBadge
                                status={
                                  application.status
                                }
                              />
                            </div>

                            <ProductApplicationStatusButton
                              applicationId={
                                application.id
                              }
                              currentStatus={
                                application.status
                              }
                            />
                          </div>
                        </div>
                      </section>

                      <footer className="admin-product-card-footer">
                        <span>
                          접수번호{" "}
                          {application.id}
                        </span>

                        <Link
                          href={buildUserSearchHref(
                            customerEmail ||
                              customerName,
                          )}
                        >
                          신청자 회원 검색
                          <span aria-hidden="true">
                            →
                          </span>
                        </Link>
                      </footer>
                    </article>
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
          <div className="admin-products-empty">
            <ApplicationIcon />

            <strong>
              {totalApplicationCount ===
              0
                ? "아직 접수된 상품 신청이 없습니다."
                : "현재 조건에 맞는 상품 신청이 없습니다."}
            </strong>

            <p>
              {totalApplicationCount ===
              0
                ? "상품 안내 페이지에서 신청이 접수되면 이곳에 표시됩니다."
                : "검색어나 상태 필터를 변경해 주세요."}
            </p>

            <Link
              href={
                totalApplicationCount ===
                0
                  ? "/pricing"
                  : "/admin/product-applications"
              }
            >
              {totalApplicationCount ===
              0
                ? "상품 안내 보기"
                : "전체 신청 보기"}
            </Link>
          </div>
        )}
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
    | "yellow"
    | "blue"
    | "purple"
    | "green"
    | "gray";
}) {
  return (
    <article
      className="admin-products-summary-card"
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

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="admin-product-metric">
      <span>{label}</span>
      <strong>{value}</strong>
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
    <div className="admin-product-section-heading">
      <p>{eyebrow}</p>
      <h4>{title}</h4>
      <span>{description}</span>
    </div>
  );
}

function ContactRow({
  label,
  value,
  href,
  copyLabel,
}: {
  label: string;
  value: string;
  href?: string;
  copyLabel: string;
}) {
  const displayValue =
    value || "미입력";

  const content = href ? (
    <Link href={href}>
      {displayValue}
    </Link>
  ) : (
    <strong>{displayValue}</strong>
  );

  return (
    <div className="admin-product-contact-row">
      <span>{label}</span>

      <div>
        {content}

        <CopyTextButton
          value={value || null}
          label={copyLabel}
        />
      </div>
    </div>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="admin-product-info-box">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span
      className="admin-product-status-badge"
      data-status={status}
    >
      {getStatusLabel(status)}
    </span>
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
  status: StatusFilter;
  sort: SortOrder;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      className="admin-products-pagination"
      aria-label="상품 신청 목록 페이지 이동"
    >
      {currentPage > 1 ? (
        <Link
          href={buildApplicationsHref({
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
            href={buildApplicationsHref({
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
          href={buildApplicationsHref({
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

function ApplicationIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M17 10h30v44H17V10Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      <path
        d="M24 22h16M24 30h16M24 38h10"
        stroke="currentColor"
        strokeWidth="3"
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

function normalizeStatusFilter(
  value: string | undefined,
): StatusFilter {
  if (value === "REQUESTED") {
    return "REQUESTED";
  }

  if (value === "CONTACTED") {
    return "CONTACTED";
  }

  if (value === "IN_PROGRESS") {
    return "IN_PROGRESS";
  }

  if (value === "COMPLETED") {
    return "COMPLETED";
  }

  if (value === "CANCELED") {
    return "CANCELED";
  }

  return "ALL";
}

function normalizeSortOrder(
  value: string | undefined,
): SortOrder {
  if (value === "OLDEST") {
    return "OLDEST";
  }

  if (
    value === "UPDATED_DESC"
  ) {
    return "UPDATED_DESC";
  }

  if (value === "PRICE_DESC") {
    return "PRICE_DESC";
  }

  if (value === "PRICE_ASC") {
    return "PRICE_ASC";
  }

  return "NEWEST";
}

function getApplicationOrderBy(
  sort: SortOrder,
): Prisma.ProductApplicationOrderByWithRelationInput[] {
  if (sort === "OLDEST") {
    return [
      {
        createdAt: "asc",
      },
      {
        updatedAt: "asc",
      },
    ];
  }

  if (
    sort === "UPDATED_DESC"
  ) {
    return [
      {
        updatedAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ];
  }

  if (sort === "PRICE_DESC") {
    return [
      {
        price: "desc",
      },
      {
        createdAt: "desc",
      },
    ];
  }

  if (sort === "PRICE_ASC") {
    return [
      {
        price: "asc",
      },
      {
        createdAt: "desc",
      },
    ];
  }

  return [
    {
      createdAt: "desc",
    },
    {
      updatedAt: "desc",
    },
  ];
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

function buildApplicationsHref({
  searchQuery = "",
  status = "ALL",
  sort = "NEWEST",
  page = 1,
}: {
  searchQuery?: string;
  status?: StatusFilter;
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
    ? `/admin/product-applications?${query}`
    : "/admin/product-applications";
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
  status: StatusFilter,
  counts: {
    total: number;
    requested: number;
    contacted: number;
    inProgress: number;
    completed: number;
    canceled: number;
  },
) {
  if (status === "REQUESTED") {
    return counts.requested;
  }

  if (status === "CONTACTED") {
    return counts.contacted;
  }

  if (status === "IN_PROGRESS") {
    return counts.inProgress;
  }

  if (status === "COMPLETED") {
    return counts.completed;
  }

  if (status === "CANCELED") {
    return counts.canceled;
  }

  return counts.total;
}

function getAddonNames(
  value: unknown,
) {
  if (!Array.isArray(value)) {
    return [];
  }

  const addonCodes =
    value.filter(
      (
        item,
      ): item is string =>
        typeof item === "string",
    );

  return addonCodes.map(
    (addonCode) => {
      const addon =
        PRODUCT_ADDONS.find(
          (item) =>
            item.code === addonCode,
        );

      return addon?.name ||
        addonCode;
    },
  );
}

function getCategoryLabel(
  category: string,
) {
  if (category === "LIFE_BOOK") {
    return "인생책 제작";
  }

  if (
    category ===
    "MONTHLY_RECORD"
  ) {
    return "월간 기록 구독";
  }

  return category;
}

function getBillingLabel(
  billingType: string,
) {
  if (
    billingType === "ONE_TIME"
  ) {
    return "한 번 결제";
  }

  if (
    billingType === "MONTHLY"
  ) {
    return "매월 결제";
  }

  return billingType;
}

function formatApplicationPrice(
  price: number,
  billingType: string,
) {
  const formatted =
    price.toLocaleString(
      "ko-KR",
    );

  if (
    billingType === "MONTHLY"
  ) {
    return `${formatted}원 / 월`;
  }

  return `${formatted}원부터`;
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
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    },
  ).format(date);
}

function getStatusLabel(
  status: string,
) {
  if (status === "REQUESTED") {
    return "새로운 접수";
  }

  if (status === "CONTACTED") {
    return "연락 완료";
  }

  if (
    status === "IN_PROGRESS"
  ) {
    return "진행 중";
  }

  if (status === "COMPLETED") {
    return "처리 완료";
  }

  if (status === "CANCELED") {
    return "신청 취소";
  }

  return "상태 확인 필요";
}

const adminProductsStyles = `
  .admin-products-page,
  .admin-products-page * {
    box-sizing: border-box;
  }

  .admin-products-page {
    min-height: 100%;
    color: #432f26;
    font-family:
      var(--font-daldongne-sans),
      "Noto Sans KR",
      sans-serif;
  }

  .admin-products-page a {
    color: inherit;
    text-decoration: none;
  }

  .admin-products-page a,
  .admin-products-page button {
    transition:
      transform 160ms ease,
      box-shadow 160ms ease,
      border-color 160ms ease;
  }

  .admin-products-page a:hover,
  .admin-products-page button:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  .admin-products-page a:focus-visible,
  .admin-products-page button:focus-visible,
  .admin-products-page input:focus-visible,
  .admin-products-page select:focus-visible,
  .admin-products-page textarea:focus-visible {
    outline:
      4px solid
      rgba(239, 105, 83, 0.2);
    outline-offset: 3px;
  }

  .admin-products-shell {
    width: min(1480px, 100%);
    margin: 0 auto;
  }

  .admin-products-hero {
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
        rgba(255, 228, 190, 0.66),
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

  .admin-products-hero > div:first-child {
    min-width: 0;
  }

  .admin-products-hero p {
    margin: 0;
    color: #e56852;
    font-size: 13.2px;
    font-weight: 900;
    letter-spacing: 0.08em;
  }

  .admin-products-hero h1 {
    margin: 8px 0 0;
    max-width: 790px;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size:
      clamp(33px, 4vw, 50px);
    line-height: 1.24;
    letter-spacing: -0.055em;
  }

  .admin-products-hero > div:first-child > span {
    display: block;
    max-width: 730px;
    margin-top: 10px;
    color: #76635a;
    font-size: 15.6px;
    line-height: 1.78;
  }

  .admin-products-hero-actions {
    min-width: 260px;
    display: grid;
    gap: 8px;
  }

  .admin-products-hero-actions a {
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

  .admin-products-hero-actions a:last-child {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
  }

  .admin-products-alert {
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

  .admin-products-alert[data-active="true"] {
    border-color: #e2a26e;
    background:
      linear-gradient(
        135deg,
        #fff1df,
        #fffaf2
      );
  }

  .admin-products-alert-icon {
    width: 50px;
    height: 50px;
    padding: 10px;
    display: grid;
    place-items: center;
    border-radius: 14px;
    color: #3f7948;
    background: #ffffff;
  }

  .admin-products-alert[data-active="true"]
  .admin-products-alert-icon {
    color: #a34d29;
  }

  .admin-products-alert-icon svg {
    width: 100%;
    height: 100%;
  }

  .admin-products-alert p {
    margin: 0;
    color: #3f7948;
    font-size: 9.6px;
    font-weight: 900;
  }

  .admin-products-alert[data-active="true"] p {
    color: #a34d29;
  }

  .admin-products-alert h2 {
    margin: 4px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 19px;
    line-height: 1.45;
  }

  .admin-products-alert > div > span {
    display: block;
    margin-top: 4px;
    color: #78655c;
    font-size: 9.6px;
    line-height: 1.6;
  }

  .admin-products-alert-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 6px;
  }

  .admin-products-alert-actions a {
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

  .admin-products-summary {
    margin-top: 16px;
    display: grid;
    grid-template-columns:
      repeat(6, minmax(0, 1fr));
    gap: 9px;
  }

  .admin-products-summary-card {
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

  .admin-products-summary-card[data-tone="coral"] {
    background: #fff0eb;
  }

  .admin-products-summary-card[data-tone="yellow"] {
    background: #fff7da;
  }

  .admin-products-summary-card[data-tone="blue"] {
    background: #edf5ff;
  }

  .admin-products-summary-card[data-tone="purple"] {
    background: #f3edff;
  }

  .admin-products-summary-card[data-tone="green"] {
    background: #edf7e9;
  }

  .admin-products-summary-card[data-tone="gray"] {
    background: #f2efed;
  }

  .admin-products-summary-card > span {
    color: #7a675e;
    font-size: 8px;
    font-weight: 850;
  }

  .admin-products-summary-card > strong {
    display: block;
    margin-top: 6px;
    color: #e0644e;
    font-size: 25px;
  }

  .admin-products-summary-card small {
    margin-left: 3px;
    color: #806d64;
    font-size: 8px;
  }

  .admin-products-billing {
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

  .admin-products-billing > div {
    padding: 7px 12px;
    border-right:
      1px solid
      rgba(136, 94, 74, 0.12);
  }

  .admin-products-billing span,
  .admin-products-billing strong {
    display: block;
  }

  .admin-products-billing span {
    color: #846f65;
    font-size: 8.4px;
  }

  .admin-products-billing strong {
    margin-top: 3px;
    font-size: 16px;
  }

  .admin-products-billing small {
    margin-left: 3px;
    color: #8a756a;
    font-size: 8.4px;
  }

  .admin-products-billing > p {
    margin: 0;
    color: #7a675e;
    font-size: 9.6px;
    line-height: 1.65;
  }

  .admin-products-control,
  .admin-products-list-head,
  .admin-product-card {
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

  .admin-products-control {
    margin-top: 16px;
    padding: 21px;
  }

  .admin-products-search-form {
    display: grid;
    grid-template-columns:
      minmax(330px, 1fr)
      minmax(150px, 0.32fr)
      minmax(150px, 0.32fr)
      auto auto;
    align-items: end;
    gap: 8px;
  }

  .admin-products-search-field > span,
  .admin-products-select-field > span {
    display: block;
    margin-bottom: 6px;
    color: #6d584e;
    font-size: 9.6px;
    font-weight: 900;
  }

  .admin-products-search-field > div {
    position: relative;
  }

  .admin-products-search-field svg {
    position: absolute;
    left: 12px;
    top: 50%;
    width: 21px;
    height: 21px;
    color: #9b7d70;
    transform: translateY(-50%);
    pointer-events: none;
  }

  .admin-products-search-form input,
  .admin-products-search-form select {
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

  .admin-products-search-form input {
    padding: 0 13px 0 41px;
  }

  .admin-products-search-form select {
    padding: 0 10px;
  }

  .admin-products-search-form button,
  .admin-products-search-form > a {
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

  .admin-products-search-form button {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
  }

  .admin-products-quick-filter {
    margin-top: 14px;
    padding-top: 14px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    border-top:
      1px solid
      rgba(136, 94, 74, 0.1);
  }

  .admin-products-quick-filter a {
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

  .admin-products-quick-filter a[data-active="true"] {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
  }

  .admin-products-quick-filter small {
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

  .admin-products-list-head {
    margin-top: 16px;
    padding: 21px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 17px;
  }

  .admin-products-list-head p {
    margin: 0;
    color: #e56852;
    font-size: 10.8px;
    font-weight: 900;
    letter-spacing: 0.07em;
  }

  .admin-products-list-head h2 {
    margin: 6px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 27px;
    line-height: 1.42;
    letter-spacing: -0.045em;
  }

  .admin-products-list-head div:first-child > span {
    display: block;
    margin-top: 5px;
    color: #7a675e;
    font-size: 12px;
  }

  .admin-products-list-head > div:last-child {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 7px;
  }

  .admin-products-list-head > div:last-child a {
    min-height: 40px;
    padding: 0 12px;
    display: inline-flex;
    align-items: center;
    border:
      1px solid #d6b3a3;
    border-radius: 11px;
    color: #755247;
    background: #ffffff;
    font-size: 10.8px;
    font-weight: 900;
  }

  .admin-products-list {
    margin-top: 16px;
    display: grid;
    gap: 15px;
  }

  .admin-product-card {
    overflow: hidden;
  }

  .admin-product-card-head {
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

  .admin-product-title {
    min-width: 0;
  }

  .admin-product-title > div {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 7px;
  }

  .admin-product-title > div > span:last-child {
    color: #8d756a;
    font-size: 9.6px;
    font-weight: 850;
  }

  .admin-product-title h3 {
    margin: 8px 0 0;
    overflow-wrap: anywhere;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 23px;
    line-height: 1.4;
  }

  .admin-product-title > p {
    margin: 5px 0 0;
    color: #7e6b62;
    font-size: 9.6px;
  }

  .admin-product-card-metrics {
    min-width: min(620px, 54%);
    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
    gap: 6px;
  }

  .admin-product-metric {
    min-width: 0;
    padding: 11px;
    border:
      1px solid
      rgba(136, 94, 74, 0.09);
    border-radius: 10px;
    background: #ffffff;
  }

  .admin-product-metric span,
  .admin-product-metric strong {
    display: block;
  }

  .admin-product-metric span {
    color: #8a756a;
    font-size: 7px;
  }

  .admin-product-metric strong {
    margin-top: 4px;
    overflow-wrap: anywhere;
    font-size: 10px;
    line-height: 1.5;
  }

  .admin-product-body {
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .admin-product-column {
    min-width: 0;
    padding: 20px 21px;
  }

  .admin-product-column + .admin-product-column {
    border-left:
      1px solid
      rgba(136, 94, 74, 0.1);
  }

  .admin-product-section-heading p {
    margin: 0;
    color: #e56852;
    font-size: 8.4px;
    font-weight: 900;
    letter-spacing: 0.07em;
  }

  .admin-product-section-heading h4 {
    margin: 5px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 17px;
    line-height: 1.45;
  }

  .admin-product-section-heading > span {
    display: block;
    margin-top: 4px;
    color: #7e6b62;
    font-size: 9.6px;
    line-height: 1.6;
  }

  .admin-product-contact-list {
    margin-top: 13px;
    display: grid;
    gap: 7px;
  }

  .admin-product-contact-row {
    min-width: 0;
    padding: 10px;
    display: grid;
    grid-template-columns:
      75px minmax(0, 1fr);
    align-items: center;
    gap: 10px;
    border:
      1px solid
      rgba(136, 94, 74, 0.1);
    border-radius: 11px;
    background: #fffaf6;
  }

  .admin-product-contact-row > span {
    color: #8a756a;
    font-size: 8.4px;
    font-weight: 850;
  }

  .admin-product-contact-row > div {
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .admin-product-contact-row strong,
  .admin-product-contact-row a {
    min-width: 0;
    overflow-wrap: anywhere;
    color: #4d382f;
    font-size: 9.6px;
    font-weight: 850;
    line-height: 1.55;
  }

  .admin-product-selection {
    margin-top: 13px;
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 7px;
  }

  .admin-product-info-box {
    min-width: 0;
    padding: 10px;
    border:
      1px solid
      rgba(136, 94, 74, 0.1);
    border-radius: 11px;
    background: #fffaf6;
  }

  .admin-product-info-box span,
  .admin-product-info-box strong {
    display: block;
  }

  .admin-product-info-box span {
    color: #8a756a;
    font-size: 8.4px;
  }

  .admin-product-info-box strong {
    margin-top: 4px;
    overflow-wrap: anywhere;
    font-size: 10.8px;
    line-height: 1.5;
  }

  .admin-product-addon-area {
    margin-top: 10px;
    padding: 11px;
    border:
      1px solid
      rgba(136, 94, 74, 0.1);
    border-radius: 11px;
    background: #fffaf6;
  }

  .admin-product-addon-area > strong {
    display: block;
    font-size: 9.6px;
  }

  .admin-product-addon-area > p {
    margin: 7px 0 0;
    color: #826e64;
    font-size: 9.6px;
  }

  .admin-product-addon-list {
    margin-top: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .admin-product-addon-list span {
    min-height: 25px;
    padding: 0 8px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    color: #62438a;
    background: #efe6ff;
    font-size: 8.4px;
    font-weight: 900;
  }

  .admin-product-message-section {
    padding: 19px 21px;
    border-top:
      1px solid
      rgba(136, 94, 74, 0.1);
    background: #fffdf9;
  }

  .admin-product-message-section > div:last-child {
    margin-top: 11px;
    padding: 14px;
    border:
      1px solid #eadcc6;
    border-radius: 12px;
    color: #5c453b;
    background: #fffaf2;
    font-size: 10.8px;
    line-height: 1.8;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  .admin-product-management {
    padding: 19px 21px;
    border-top:
      1px solid
      rgba(136, 94, 74, 0.1);
  }

  .admin-product-management-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .admin-product-management-grid {
    margin-top: 13px;
    display: grid;
    grid-template-columns:
      minmax(0, 1.35fr)
      minmax(260px, 0.65fr);
    gap: 10px;
    align-items: start;
  }

  .admin-product-management-grid > form {
    margin-top: 0 !important;
  }

  .admin-product-status-control {
    min-width: 0;
    padding: 17px;
    border:
      1px solid #d9c299;
    border-radius: 17px;
    background: #fff7e7;
  }

  .admin-product-status-control > div:first-child {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .admin-product-status-control > div:first-child > span {
    color: #8a5a2c;
    font-size: 9.6px;
    font-weight: 900;
  }

  .admin-product-status-badge {
    min-height: 25px;
    padding: 0 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    font-size: 8.4px;
    font-weight: 900;
    white-space: nowrap;
  }

  .admin-product-status-badge[data-status="REQUESTED"] {
    color: #83540d;
    background: #fff1c7;
  }

  .admin-product-status-badge[data-status="CONTACTED"] {
    color: #245d8c;
    background: #e4f2ff;
  }

  .admin-product-status-badge[data-status="IN_PROGRESS"] {
    color: #62438a;
    background: #efe6ff;
  }

  .admin-product-status-badge[data-status="COMPLETED"] {
    color: #2f6b38;
    background: #e3f4e5;
  }

  .admin-product-status-badge[data-status="CANCELED"] {
    color: #776868;
    background: #f2eeee;
  }

  .admin-product-card-footer {
    padding: 12px 21px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    border-top:
      1px solid
      rgba(136, 94, 74, 0.1);
    color: #8b776d;
    background: #f8f2ed;
    font-size: 8.4px;
  }

  .admin-product-card-footer > span {
    overflow-wrap: anywhere;
  }

  .admin-product-card-footer > a {
    flex: 0 0 auto;
    color: #d45f49;
    font-weight: 900;
  }

  .admin-products-pagination {
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

  .admin-products-pagination a,
  .admin-products-pagination > span {
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

  .admin-products-pagination a[data-active="true"] {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
  }

  .admin-products-pagination > span[data-disabled="true"] {
    opacity: 0.42;
  }

  .admin-products-empty {
    margin-top: 16px;
    padding: 52px 20px;
    border:
      1px dashed #ddb2a1;
    border-radius: 18px;
    background: #fffaf7;
    text-align: center;
  }

  .admin-products-empty svg {
    width: 56px;
    height: 56px;
    color: #e57059;
  }

  .admin-products-empty strong {
    display: block;
    margin-top: 11px;
    font-size: 16px;
  }

  .admin-products-empty p {
    margin: 5px 0 0;
    color: #806b61;
    font-size: 12px;
  }

  .admin-products-empty a {
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
    .admin-products-summary {
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
    }

    .admin-products-search-form {
      grid-template-columns:
        minmax(270px, 1fr)
        repeat(2, minmax(145px, 0.45fr))
        auto;
    }

    .admin-products-search-form > a {
      grid-column: 1 / -1;
      justify-self: start;
    }

    .admin-product-card-head {
      align-items: stretch;
      flex-direction: column;
    }

    .admin-product-card-metrics {
      min-width: 0;
      width: 100%;
    }
  }

  @media (max-width: 880px) {
    .admin-products-hero {
      align-items: stretch;
      flex-direction: column;
      padding: 25px;
      border-radius: 22px;
    }

    .admin-products-hero-actions {
      min-width: 0;
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
    }

    .admin-products-alert {
      grid-template-columns:
        46px minmax(0, 1fr);
    }

    .admin-products-alert-actions {
      grid-column: 1 / -1;
      justify-content: flex-start;
    }

    .admin-products-billing {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .admin-products-billing > p {
      grid-column: 1 / -1;
    }

    .admin-products-search-form {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .admin-products-search-field {
      grid-column: 1 / -1;
    }

    .admin-product-body {
      grid-template-columns: 1fr;
    }

    .admin-product-column + .admin-product-column {
      border-left: 0;
      border-top:
        1px solid
        rgba(136, 94, 74, 0.1);
    }

    .admin-product-management-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .admin-products-summary,
    .admin-products-hero-actions,
    .admin-products-search-form,
    .admin-product-card-metrics,
    .admin-product-selection {
      grid-template-columns: 1fr;
    }

    .admin-products-search-field {
      grid-column: auto;
    }

    .admin-products-search-form > a {
      grid-column: auto;
      justify-self: stretch;
    }

    .admin-products-alert,
    .admin-products-billing {
      grid-template-columns: 1fr;
    }

    .admin-products-alert-icon {
      width: 45px;
      height: 45px;
    }

    .admin-products-billing > p {
      grid-column: auto;
    }

    .admin-products-billing > div {
      border-right: 0;
      border-bottom:
        1px solid
        rgba(136, 94, 74, 0.12);
    }

    .admin-products-control,
    .admin-products-list-head {
      padding: 16px;
      border-radius: 18px;
    }

    .admin-products-list-head {
      align-items: stretch;
      flex-direction: column;
    }

    .admin-products-list-head > div:last-child {
      justify-content: stretch;
    }

    .admin-products-list-head > div:last-child a {
      flex: 1 1 auto;
      justify-content: center;
    }

    .admin-product-contact-row {
      grid-template-columns: 1fr;
    }

    .admin-product-contact-row > div {
      align-items: flex-start;
      flex-direction: column;
    }

    .admin-product-management-head,
    .admin-product-card-footer {
      align-items: stretch;
      flex-direction: column;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .admin-products-page a,
    .admin-products-page button {
      transition: none;
    }
  }
`;
