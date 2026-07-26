import { auth } from "@/auth";
import CopyTextButton from "@/components/admin/CopyTextButton";
import ReviewActionSubmitButton from "@/components/admin/ReviewActionSubmitButton";
import { prisma } from "@/lib/prisma";
import {
  CustomerReviewStatus,
  Prisma,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic =
  "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    sort?: string;
    page?: string;
  }>;
};

type ReviewFilter =
  | "ALL"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "VISIBLE"
  | "HIDDEN"
  | "FEATURED";

type ReviewSort =
  | "NEWEST"
  | "OLDEST"
  | "UPDATED_DESC"
  | "RATING_DESC"
  | "RATING_ASC";

const PAGE_SIZE = 15;

const FILTER_OPTIONS: Array<{
  value: ReviewFilter;
  label: string;
}> = [
  {
    value: "ALL",
    label: "전체 후기",
  },
  {
    value: "PENDING",
    label: "승인 대기",
  },
  {
    value: "APPROVED",
    label: "승인 완료",
  },
  {
    value: "REJECTED",
    label: "거절",
  },
  {
    value: "VISIBLE",
    label: "홈페이지 공개",
  },
  {
    value: "HIDDEN",
    label: "홈페이지 숨김",
  },
  {
    value: "FEATURED",
    label: "대표 후기",
  },
];

const SORT_OPTIONS: Array<{
  value: ReviewSort;
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
    value: "RATING_DESC",
    label: "별점 높은순",
  },
  {
    value: "RATING_ASC",
    label: "별점 낮은순",
  },
];

async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error(
      "로그인이 필요합니다.",
    );
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

  if (
    adminUser?.role !== "ADMIN"
  ) {
    throw new Error(
      "관리자만 고객 후기를 관리할 수 있습니다.",
    );
  }
}

function getFormValue(
  formData: FormData,
  key: string,
) {
  const value =
    formData.get(key);

  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

async function updateReviewStatus(
  formData: FormData,
) {
  "use server";

  await requireAdmin();

  const reviewId =
    getFormValue(
      formData,
      "reviewId",
    );

  const statusValue =
    getFormValue(
      formData,
      "status",
    );

  if (!reviewId) {
    throw new Error(
      "고객 후기 ID가 없습니다.",
    );
  }

  if (
    !Object.values(
      CustomerReviewStatus,
    ).includes(
      statusValue as CustomerReviewStatus,
    )
  ) {
    throw new Error(
      "올바른 후기 상태가 아닙니다.",
    );
  }

  const status =
    statusValue as CustomerReviewStatus;

  await prisma.customerReview.update({
    where: {
      id: reviewId,
    },
    data: {
      status,
      approvedAt:
        status ===
        CustomerReviewStatus.APPROVED
          ? new Date()
          : null,
      isVisible:
        status ===
        CustomerReviewStatus.APPROVED,
      isFeatured:
        status ===
        CustomerReviewStatus.APPROVED
          ? undefined
          : false,
    },
  });

  revalidatePath(
    "/admin/reviews",
  );
  revalidatePath("/");
}

async function toggleFeaturedReview(
  formData: FormData,
) {
  "use server";

  await requireAdmin();

  const reviewId =
    getFormValue(
      formData,
      "reviewId",
    );

  if (!reviewId) {
    throw new Error(
      "고객 후기 ID가 없습니다.",
    );
  }

  const review =
    await prisma.customerReview.findUnique({
      where: {
        id: reviewId,
      },
      select: {
        status: true,
        isFeatured: true,
      },
    });

  if (!review) {
    throw new Error(
      "고객 후기를 찾을 수 없습니다.",
    );
  }

  if (
    review.status !==
    CustomerReviewStatus.APPROVED
  ) {
    throw new Error(
      "승인된 후기만 대표 후기로 지정할 수 있습니다.",
    );
  }

  await prisma.customerReview.update({
    where: {
      id: reviewId,
    },
    data: {
      isFeatured:
        !review.isFeatured,
    },
  });

  revalidatePath(
    "/admin/reviews",
  );
  revalidatePath("/");
}

async function toggleReviewVisibility(
  formData: FormData,
) {
  "use server";

  await requireAdmin();

  const reviewId =
    getFormValue(
      formData,
      "reviewId",
    );

  if (!reviewId) {
    throw new Error(
      "고객 후기 ID가 없습니다.",
    );
  }

  const review =
    await prisma.customerReview.findUnique({
      where: {
        id: reviewId,
      },
      select: {
        status: true,
        isVisible: true,
      },
    });

  if (!review) {
    throw new Error(
      "고객 후기를 찾을 수 없습니다.",
    );
  }

  if (
    review.status !==
    CustomerReviewStatus.APPROVED
  ) {
    throw new Error(
      "승인된 후기만 공개 상태를 변경할 수 있습니다.",
    );
  }

  await prisma.customerReview.update({
    where: {
      id: reviewId,
    },
    data: {
      isVisible:
        !review.isVisible,
    },
  });

  revalidatePath(
    "/admin/reviews",
  );
  revalidatePath("/");
}

export default async function AdminReviewsPage({
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

  if (
    adminUser?.role !== "ADMIN"
  ) {
    redirect("/dashboard");
  }

  const resolvedSearchParams =
    await searchParams;

  const searchQuery = String(
    resolvedSearchParams?.q || "",
  )
    .trim()
    .slice(0, 100);

  const reviewFilter =
    normalizeReviewFilter(
      resolvedSearchParams?.status,
    );

  const reviewSort =
    normalizeReviewSort(
      resolvedSearchParams?.sort,
    );

  const requestedPage =
    normalizePage(
      resolvedSearchParams?.page,
    );

  const reviewConditions:
    Prisma.CustomerReviewWhereInput[] =
    [];

  if (searchQuery) {
    reviewConditions.push({
      OR: [
        {
          displayName: {
            contains: searchQuery,
          },
        },
        {
          email: {
            contains: searchQuery,
          },
        },
        {
          orderReference: {
            contains: searchQuery,
          },
        },
        {
          title: {
            contains: searchQuery,
          },
        },
        {
          content: {
            contains: searchQuery,
          },
        },
      ],
    });
  }

  if (reviewFilter === "PENDING") {
    reviewConditions.push({
      status:
        CustomerReviewStatus.PENDING,
    });
  }

  if (
    reviewFilter === "APPROVED"
  ) {
    reviewConditions.push({
      status:
        CustomerReviewStatus.APPROVED,
    });
  }

  if (
    reviewFilter === "REJECTED"
  ) {
    reviewConditions.push({
      status:
        CustomerReviewStatus.REJECTED,
    });
  }

  if (
    reviewFilter === "VISIBLE"
  ) {
    reviewConditions.push({
      status:
        CustomerReviewStatus.APPROVED,
      isVisible: true,
    });
  }

  if (reviewFilter === "HIDDEN") {
    reviewConditions.push({
      status:
        CustomerReviewStatus.APPROVED,
      isVisible: false,
    });
  }

  if (
    reviewFilter === "FEATURED"
  ) {
    reviewConditions.push({
      status:
        CustomerReviewStatus.APPROVED,
      isFeatured: true,
    });
  }

  const reviewWhere:
    Prisma.CustomerReviewWhereInput =
    reviewConditions.length > 0
      ? {
          AND: reviewConditions,
        }
      : {};

  const [
    filteredReviewCount,
    totalReviewCount,
    pendingCount,
    approvedCount,
    rejectedCount,
    visibleCount,
    hiddenCount,
    featuredCount,
    ratingAggregate,
  ] = await Promise.all([
    prisma.customerReview.count({
      where: reviewWhere,
    }),

    prisma.customerReview.count(),

    prisma.customerReview.count({
      where: {
        status:
          CustomerReviewStatus.PENDING,
      },
    }),

    prisma.customerReview.count({
      where: {
        status:
          CustomerReviewStatus.APPROVED,
      },
    }),

    prisma.customerReview.count({
      where: {
        status:
          CustomerReviewStatus.REJECTED,
      },
    }),

    prisma.customerReview.count({
      where: {
        status:
          CustomerReviewStatus.APPROVED,
        isVisible: true,
      },
    }),

    prisma.customerReview.count({
      where: {
        status:
          CustomerReviewStatus.APPROVED,
        isVisible: false,
      },
    }),

    prisma.customerReview.count({
      where: {
        status:
          CustomerReviewStatus.APPROVED,
        isFeatured: true,
      },
    }),

    prisma.customerReview.aggregate({
      _avg: {
        rating: true,
      },
    }),
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredReviewCount /
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

  const reviews =
    await prisma.customerReview.findMany({
      where: reviewWhere,
      orderBy:
        getReviewOrderBy(
          reviewSort,
        ),
      skip,
      take: PAGE_SIZE,
    });

  const firstVisibleReview =
    filteredReviewCount === 0
      ? 0
      : skip + 1;

  const lastVisibleReview =
    Math.min(
      skip + reviews.length,
      filteredReviewCount,
    );

  const pageNumbers =
    getPageNumbers(
      currentPage,
      totalPages,
    );

  const averageRating =
    ratingAggregate._avg.rating
      ? ratingAggregate._avg.rating.toFixed(
          1,
        )
      : "0.0";

  const hasActiveCondition =
    Boolean(searchQuery) ||
    reviewFilter !== "ALL" ||
    reviewSort !== "NEWEST";

  return (
    <main className="admin-reviews-page">
      <style>
        {adminReviewsStyles}
      </style>

      <div className="admin-reviews-shell">
        <header className="admin-reviews-hero">
          <div>
            <p>
              관리자 · 고객 후기 관리
            </p>

            <h1>
              고객 후기를 검토하고
              홈페이지 노출을 관리합니다
            </h1>

            <span>
              승인 대기 후기의 내용과
              작성자 정보를 확인하고,
              공개·숨김·대표 후기 여부를
              관리하세요.
            </span>
          </div>

          <div className="admin-reviews-hero-actions">
            <Link href="/admin">
              관리자 홈
            </Link>

            <Link href="/reviews">
              후기 작성 화면
            </Link>

            <Link href="/">
              홈페이지 확인
              <span aria-hidden="true">
                →
              </span>
            </Link>
          </div>
        </header>

        <section
          className="admin-reviews-alert"
          data-pending={
            pendingCount > 0
              ? "true"
              : "false"
          }
        >
          <span className="admin-reviews-alert-icon">
            {pendingCount > 0 ? (
              <ReviewIcon />
            ) : (
              <CheckIcon />
            )}
          </span>

          <div>
            <p>검토 대기 현황</p>

            <h2>
              {pendingCount > 0
                ? `승인 여부를 확인할 후기가 ${pendingCount.toLocaleString()}건 있습니다.`
                : "현재 승인 대기 중인 후기가 없습니다."}
            </h2>

            <span>
              홈페이지 공개{" "}
              {visibleCount.toLocaleString()}
              건 · 숨김{" "}
              {hiddenCount.toLocaleString()}
              건 · 대표 후기{" "}
              {featuredCount.toLocaleString()}
              건
            </span>
          </div>

          {pendingCount > 0 ? (
            <Link href="/admin/reviews?status=PENDING">
              승인 대기 확인
            </Link>
          ) : null}
        </section>

        <section className="admin-reviews-summary">
          <SummaryCard
            label="전체 후기"
            value={totalReviewCount}
            unit="건"
            tone="coral"
          />

          <SummaryCard
            label="승인 대기"
            value={pendingCount}
            unit="건"
            tone="yellow"
          />

          <SummaryCard
            label="승인 완료"
            value={approvedCount}
            unit="건"
            tone="green"
          />

          <SummaryCard
            label="거절"
            value={rejectedCount}
            unit="건"
            tone="gray"
          />

          <SummaryCard
            label="홈페이지 공개"
            value={visibleCount}
            unit="건"
            tone="blue"
          />

          <SummaryCard
            label="대표 후기"
            value={featuredCount}
            unit="건"
            tone="purple"
          />
        </section>

        <section className="admin-reviews-insight">
          <div>
            <span>전체 평균 별점</span>

            <strong>
              {averageRating}
              <small>/ 5.0</small>
            </strong>
          </div>

          <div>
            <span>홈페이지 숨김</span>

            <strong>
              {hiddenCount.toLocaleString()}
              <small>건</small>
            </strong>
          </div>

          <p>
            승인하면 즉시 홈페이지
            공개 상태가 되며, 승인 후에는
            대표 후기 지정과 공개·숨김을
            별도로 관리할 수 있습니다.
          </p>
        </section>

        <section className="admin-reviews-control">
          <form
            action="/admin/reviews"
            method="get"
            className="admin-reviews-search-form"
          >
            <label className="admin-reviews-search-field">
              <span>후기 검색</span>

              <div>
                <SearchIcon />

                <input
                  type="search"
                  name="q"
                  defaultValue={
                    searchQuery
                  }
                  placeholder="작성자, 이메일, 주문·상담번호, 제목, 후기 내용"
                  maxLength={100}
                />
              </div>
            </label>

            <label className="admin-reviews-select-field">
              <span>후기 상태</span>

              <select
                name="status"
                defaultValue={
                  reviewFilter
                }
              >
                {FILTER_OPTIONS.map(
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

            <label className="admin-reviews-select-field">
              <span>정렬</span>

              <select
                name="sort"
                defaultValue={
                  reviewSort
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
              <Link href="/admin/reviews">
                전체 초기화
              </Link>
            ) : null}
          </form>

          <div className="admin-reviews-quick-filter">
            {FILTER_OPTIONS.map(
              (filter) => {
                const count =
                  getFilterCount(
                    filter.value,
                    {
                      total:
                        totalReviewCount,
                      pending:
                        pendingCount,
                      approved:
                        approvedCount,
                      rejected:
                        rejectedCount,
                      visible:
                        visibleCount,
                      hidden:
                        hiddenCount,
                      featured:
                        featuredCount,
                    },
                  );

                return (
                  <Link
                    key={filter.value}
                    href={buildReviewsHref({
                      searchQuery,
                      status:
                        filter.value,
                      sort: reviewSort,
                    })}
                    data-active={
                      reviewFilter ===
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

        <section className="admin-reviews-list-head">
          <div>
            <p>고객 후기 목록</p>

            <h2>
              후기 내용과 노출 상태를
              확인하세요
            </h2>

            <span>
              {filteredReviewCount > 0
                ? `${filteredReviewCount.toLocaleString()}건 중 ${firstVisibleReview.toLocaleString()}–${lastVisibleReview.toLocaleString()}번째 후기`
                : "현재 조건에 맞는 고객 후기가 없습니다."}
            </span>
          </div>

          {hasActiveCondition ? (
            <Link href="/admin/reviews">
              전체 후기 보기
            </Link>
          ) : null}
        </section>

        {reviews.length > 0 ? (
          <>
            <section className="admin-reviews-list">
              {reviews.map(
                (review) => (
                  <article
                    key={review.id}
                    className="admin-review-card"
                  >
                    <header className="admin-review-card-head">
                      <div>
                        <div className="admin-review-badges">
                          <StatusBadge
                            status={
                              review.status
                            }
                          />

                          {review.isFeatured ? (
                            <span
                              className="admin-review-special-badge"
                              data-type="FEATURED"
                            >
                              대표 후기
                            </span>
                          ) : null}

                          {review.status ===
                            CustomerReviewStatus.APPROVED &&
                          !review.isVisible ? (
                            <span
                              className="admin-review-special-badge"
                              data-type="HIDDEN"
                            >
                              홈페이지 숨김
                            </span>
                          ) : null}
                        </div>

                        <h3>
                          {review.title ||
                            "제목 없는 후기"}
                        </h3>

                        <span>
                          접수{" "}
                          {formatDateTime(
                            review.createdAt,
                          )}
                          {" · "}
                          최근 변경{" "}
                          {formatDateTime(
                            review.updatedAt,
                          )}
                        </span>
                      </div>

                      <RatingDisplay
                        rating={
                          review.rating
                        }
                      />
                    </header>

                    <div className="admin-review-body">
                      <section className="admin-review-content-section">
                        <SectionHeading
                          eyebrow="후기 내용"
                          title={`${review.rating.toLocaleString()}점 후기`}
                          description="고객이 작성한 원문입니다."
                        />

                        <div className="admin-review-content">
                          {review.content}
                        </div>
                      </section>

                      <section className="admin-review-customer-section">
                        <SectionHeading
                          eyebrow="작성자 정보"
                          title={
                            review.displayName
                          }
                          description="작성자와 주문·상담번호를 확인하세요."
                        />

                        <div className="admin-review-customer-grid">
                          <InfoRow
                            label="작성자"
                            value={
                              review.displayName
                            }
                            copyLabel="이름 복사"
                          />

                          <InfoRow
                            label="이메일"
                            value={
                              review.email
                            }
                            href={`mailto:${review.email}`}
                            copyLabel="메일 복사"
                          />

                          <InfoRow
                            label="주문·상담번호"
                            value={
                              review.orderReference ||
                              ""
                            }
                            copyLabel="번호 복사"
                          />

                          <InfoRow
                            label="승인일"
                            value={
                              review.approvedAt
                                ? formatDateTime(
                                    review.approvedAt,
                                  )
                                : ""
                            }
                            copyLabel="승인일 복사"
                          />
                        </div>

                        <Link
                          href={buildUserSearchHref(
                            review.email,
                          )}
                          className="admin-review-user-link"
                        >
                          같은 이메일 회원 검색
                          <span aria-hidden="true">
                            →
                          </span>
                        </Link>
                      </section>
                    </div>

                    <section className="admin-review-action-section">
                      <div>
                        <p>후기 상태 관리</p>

                        <h4>
                          승인·거절·노출 상태를
                          변경합니다
                        </h4>

                        <span>
                          변경 내용은 관리자
                          화면과 홈페이지에 즉시
                          반영됩니다.
                        </span>
                      </div>

                      <div className="admin-review-actions">
                        {review.status !==
                        CustomerReviewStatus.APPROVED ? (
                          <ActionForm
                            reviewId={
                              review.id
                            }
                            status="APPROVED"
                            action={
                              updateReviewStatus
                            }
                            label="승인하고 공개"
                            tone="APPROVE"
                          />
                        ) : null}

                        {review.status !==
                        CustomerReviewStatus.PENDING ? (
                          <ActionForm
                            reviewId={
                              review.id
                            }
                            status="PENDING"
                            action={
                              updateReviewStatus
                            }
                            label="승인 대기로 변경"
                            tone="PENDING"
                          />
                        ) : null}

                        {review.status !==
                        CustomerReviewStatus.REJECTED ? (
                          <ActionForm
                            reviewId={
                              review.id
                            }
                            status="REJECTED"
                            action={
                              updateReviewStatus
                            }
                            label="후기 거절"
                            tone="REJECT"
                          />
                        ) : null}

                        {review.status ===
                        CustomerReviewStatus.APPROVED ? (
                          <>
                            <SimpleActionForm
                              reviewId={
                                review.id
                              }
                              action={
                                toggleFeaturedReview
                              }
                              label={
                                review.isFeatured
                                  ? "대표 후기 해제"
                                  : "대표 후기 지정"
                              }
                              tone="FEATURE"
                            />

                            <SimpleActionForm
                              reviewId={
                                review.id
                              }
                              action={
                                toggleReviewVisibility
                              }
                              label={
                                review.isVisible
                                  ? "홈페이지에서 숨기기"
                                  : "홈페이지에 다시 표시"
                              }
                              tone="VISIBILITY"
                            />
                          </>
                        ) : null}
                      </div>
                    </section>

                    <footer className="admin-review-card-footer">
                      <span>
                        후기 ID{" "}
                        {review.id}
                      </span>

                      <CopyTextButton
                        value={review.id}
                        label="후기 ID 복사"
                      />
                    </footer>
                  </article>
                ),
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
                reviewFilter
              }
              sort={reviewSort}
            />
          </>
        ) : (
          <div className="admin-reviews-empty">
            <ReviewIcon />

            <strong>
              {totalReviewCount === 0
                ? "아직 접수된 고객 후기가 없습니다."
                : "현재 조건에 맞는 고객 후기가 없습니다."}
            </strong>

            <p>
              {totalReviewCount === 0
                ? "고객이 후기 작성 화면에서 후기를 등록하면 이곳에 표시됩니다."
                : "검색어나 후기 상태 필터를 변경해 주세요."}
            </p>

            <Link
              href={
                totalReviewCount === 0
                  ? "/reviews"
                  : "/admin/reviews"
              }
            >
              {totalReviewCount === 0
                ? "후기 작성 화면 보기"
                : "전체 후기 보기"}
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
    | "green"
    | "gray"
    | "blue"
    | "purple";
}) {
  return (
    <article
      className="admin-reviews-summary-card"
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
    <div className="admin-review-section-heading">
      <p>{eyebrow}</p>
      <h4>{title}</h4>
      <span>{description}</span>
    </div>
  );
}

function RatingDisplay({
  rating,
}: {
  rating: number;
}) {
  return (
    <div
      className="admin-review-rating"
      aria-label={`별점 ${rating}점`}
    >
      <div>
        {[1, 2, 3, 4, 5].map(
          (score) => (
            <span
              key={score}
              data-active={
                score <= rating
                  ? "true"
                  : "false"
              }
            >
              ★
            </span>
          ),
        )}
      </div>

      <strong>
        {rating.toLocaleString()}
        <small>/ 5</small>
      </strong>
    </div>
  );
}

function InfoRow({
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

  return (
    <div className="admin-review-info-row">
      <span>{label}</span>

      <div>
        {href && value ? (
          <Link href={href}>
            {displayValue}
          </Link>
        ) : (
          <strong>
            {displayValue}
          </strong>
        )}

        <CopyTextButton
          value={value || null}
          label={copyLabel}
        />
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: CustomerReviewStatus;
}) {
  return (
    <span
      className="admin-review-status-badge"
      data-status={status}
    >
      {getStatusLabel(status)}
    </span>
  );
}

function ActionForm({
  reviewId,
  status,
  action,
  label,
  tone,
}: {
  reviewId: string;
  status:
    | "APPROVED"
    | "PENDING"
    | "REJECTED";
  action: (
    formData: FormData,
  ) => Promise<void>;
  label: string;
  tone:
    | "APPROVE"
    | "PENDING"
    | "REJECT";
}) {
  return (
    <form action={action}>
      <input
        type="hidden"
        name="reviewId"
        value={reviewId}
      />

      <input
        type="hidden"
        name="status"
        value={status}
      />

      <ReviewActionSubmitButton
        label={label}
        tone={tone}
        pendingLabel="처리 중..."
        confirmMessage={getReviewStatusConfirmMessage(
          status,
          label,
        )}
      />
    </form>
  );
}

function SimpleActionForm({
  reviewId,
  action,
  label,
  tone,
}: {
  reviewId: string;
  action: (
    formData: FormData,
  ) => Promise<void>;
  label: string;
  tone:
    | "FEATURE"
    | "VISIBILITY";
}) {
  return (
    <form action={action}>
      <input
        type="hidden"
        name="reviewId"
        value={reviewId}
      />

      <ReviewActionSubmitButton
        label={label}
        tone={tone}
        pendingLabel="변경 중..."
        confirmMessage={getReviewToggleConfirmMessage(
          tone,
          label,
        )}
      />
    </form>
  );
}

function getReviewStatusConfirmMessage(
  status:
    | "APPROVED"
    | "PENDING"
    | "REJECTED",
  label: string,
) {
  if (status === "APPROVED") {
    return [
      `이 후기를 "${label}" 상태로 변경할까요?`,
      "",
      "승인하면 홈페이지 공개 상태도 함께 활성화됩니다.",
      "후기 내용을 다시 확인한 후 진행해 주세요.",
    ].join("\n");
  }

  if (status === "REJECTED") {
    return [
      `이 후기를 "${label}" 처리할까요?`,
      "",
      "거절된 후기는 홈페이지에서 공개되지 않으며 대표 후기로도 사용할 수 없습니다.",
    ].join("\n");
  }

  return [
    `이 후기를 "${label}" 상태로 되돌릴까요?`,
    "",
    "승인 대기로 변경하면 홈페이지 공개와 대표 후기 설정이 해제됩니다.",
  ].join("\n");
}

function getReviewToggleConfirmMessage(
  tone:
    | "FEATURE"
    | "VISIBILITY",
  label: string,
) {
  if (tone === "FEATURE") {
    const isRemoving =
      label.includes("해제");

    return isRemoving
      ? "이 후기를 대표 후기에서 해제할까요?"
      : [
          "이 후기를 대표 후기로 지정할까요?",
          "",
          "대표 후기는 홈페이지에서 고객에게 우선적으로 소개될 수 있습니다.",
        ].join("\n");
  }

  const isHiding =
    label.includes("숨기기");

  return isHiding
    ? [
        "이 후기를 홈페이지에서 숨길까요?",
        "",
        "후기는 승인 상태로 유지되지만 홈페이지에는 표시되지 않습니다.",
      ].join("\n")
    : "이 후기를 홈페이지에 다시 표시할까요?";
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
  status: ReviewFilter;
  sort: ReviewSort;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      className="admin-reviews-pagination"
      aria-label="고객 후기 목록 페이지 이동"
    >
      {currentPage > 1 ? (
        <Link
          href={buildReviewsHref({
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
            href={buildReviewsHref({
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
          href={buildReviewsHref({
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

function ReviewIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m32 9 6.7 13.6 15 2.2-10.8 10.5 2.5 14.9L32 43.1l-13.4 7.1 2.5-14.9L10.3 24.8l15-2.2L32 9Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
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

function normalizeReviewFilter(
  value: string | undefined,
): ReviewFilter {
  if (value === "PENDING") {
    return "PENDING";
  }

  if (value === "APPROVED") {
    return "APPROVED";
  }

  if (value === "REJECTED") {
    return "REJECTED";
  }

  if (value === "VISIBLE") {
    return "VISIBLE";
  }

  if (value === "HIDDEN") {
    return "HIDDEN";
  }

  if (value === "FEATURED") {
    return "FEATURED";
  }

  return "ALL";
}

function normalizeReviewSort(
  value: string | undefined,
): ReviewSort {
  if (value === "OLDEST") {
    return "OLDEST";
  }

  if (
    value === "UPDATED_DESC"
  ) {
    return "UPDATED_DESC";
  }

  if (
    value === "RATING_DESC"
  ) {
    return "RATING_DESC";
  }

  if (value === "RATING_ASC") {
    return "RATING_ASC";
  }

  return "NEWEST";
}

function getReviewOrderBy(
  sort: ReviewSort,
): Prisma.CustomerReviewOrderByWithRelationInput[] {
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

  if (
    sort === "RATING_DESC"
  ) {
    return [
      {
        rating: "desc",
      },
      {
        createdAt: "desc",
      },
    ];
  }

  if (sort === "RATING_ASC") {
    return [
      {
        rating: "asc",
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

function buildReviewsHref({
  searchQuery = "",
  status = "ALL",
  sort = "NEWEST",
  page = 1,
}: {
  searchQuery?: string;
  status?: ReviewFilter;
  sort?: ReviewSort;
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
    ? `/admin/reviews?${query}`
    : "/admin/reviews";
}

function buildUserSearchHref(
  email: string,
) {
  const query = email.trim();

  if (!query) {
    return "/admin/users";
  }

  const params =
    new URLSearchParams();

  params.set("q", query);

  return `/admin/users?${params.toString()}`;
}

function getFilterCount(
  filter: ReviewFilter,
  counts: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    visible: number;
    hidden: number;
    featured: number;
  },
) {
  if (filter === "PENDING") {
    return counts.pending;
  }

  if (filter === "APPROVED") {
    return counts.approved;
  }

  if (filter === "REJECTED") {
    return counts.rejected;
  }

  if (filter === "VISIBLE") {
    return counts.visible;
  }

  if (filter === "HIDDEN") {
    return counts.hidden;
  }

  if (filter === "FEATURED") {
    return counts.featured;
  }

  return counts.total;
}

function getStatusLabel(
  status: CustomerReviewStatus,
) {
  if (
    status ===
    CustomerReviewStatus.PENDING
  ) {
    return "승인 대기";
  }

  if (
    status ===
    CustomerReviewStatus.APPROVED
  ) {
    return "승인 완료";
  }

  return "거절";
}

function formatDateTime(
  value: Date | string | null,
) {
  if (!value) {
    return "-";
  }

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

const adminReviewsStyles = `
  .admin-reviews-page,
  .admin-reviews-page * {
    box-sizing: border-box;
  }

  .admin-reviews-page {
    min-height: 100%;
    color: #432f26;
    font-family:
      var(--font-daldongne-sans),
      "Noto Sans KR",
      sans-serif;
  }

  .admin-reviews-page a {
    color: inherit;
    text-decoration: none;
  }

  .admin-reviews-page a,
  .admin-reviews-page button {
    transition:
      transform 160ms ease,
      box-shadow 160ms ease,
      border-color 160ms ease;
  }

  .admin-reviews-page a:hover,
  .admin-reviews-page button:hover {
    transform: translateY(-2px);
  }

  .admin-reviews-page a:focus-visible,
  .admin-reviews-page button:focus-visible,
  .admin-reviews-page input:focus-visible,
  .admin-reviews-page select:focus-visible {
    outline:
      4px solid
      rgba(239, 105, 83, 0.2);
    outline-offset: 3px;
  }

  .admin-reviews-shell {
    width: min(1480px, 100%);
    margin: 0 auto;
  }

  .admin-reviews-hero {
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
        rgba(255, 227, 174, 0.68),
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

  .admin-reviews-hero > div:first-child {
    min-width: 0;
  }

  .admin-reviews-hero p {
    margin: 0;
    color: #e56852;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.08em;
  }

  .admin-reviews-hero h1 {
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

  .admin-reviews-hero > div:first-child > span {
    display: block;
    max-width: 730px;
    margin-top: 10px;
    color: #76635a;
    font-size: 13px;
    line-height: 1.78;
  }

  .admin-reviews-hero-actions {
    min-width: 260px;
    display: grid;
    gap: 8px;
  }

  .admin-reviews-hero-actions a {
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
    font-size: 10px;
    font-weight: 900;
  }

  .admin-reviews-hero-actions a:last-child {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
  }

  .admin-reviews-alert {
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

  .admin-reviews-alert[data-pending="true"] {
    border-color: #e2a26e;
    background:
      linear-gradient(
        135deg,
        #fff1df,
        #fffaf2
      );
  }

  .admin-reviews-alert-icon {
    width: 50px;
    height: 50px;
    padding: 10px;
    display: grid;
    place-items: center;
    border-radius: 14px;
    color: #3f7948;
    background: #ffffff;
  }

  .admin-reviews-alert[data-pending="true"]
  .admin-reviews-alert-icon {
    color: #a34d29;
  }

  .admin-reviews-alert-icon svg {
    width: 100%;
    height: 100%;
  }

  .admin-reviews-alert p {
    margin: 0;
    color: #3f7948;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-reviews-alert[data-pending="true"] p {
    color: #a34d29;
  }

  .admin-reviews-alert h2 {
    margin: 4px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 19px;
    line-height: 1.45;
  }

  .admin-reviews-alert > div > span {
    display: block;
    margin-top: 4px;
    color: #78655c;
    font-size: 8px;
    line-height: 1.6;
  }

  .admin-reviews-alert > a {
    min-height: 35px;
    padding: 0 10px;
    display: inline-flex;
    align-items: center;
    border:
      1px solid #d6b3a3;
    border-radius: 9px;
    color: #755247;
    background: #ffffff;
    font-size: 8px;
    font-weight: 900;
    white-space: nowrap;
  }

  .admin-reviews-summary {
    margin-top: 16px;
    display: grid;
    grid-template-columns:
      repeat(6, minmax(0, 1fr));
    gap: 9px;
  }

  .admin-reviews-summary-card {
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

  .admin-reviews-summary-card[data-tone="coral"] {
    background: #fff0eb;
  }

  .admin-reviews-summary-card[data-tone="yellow"] {
    background: #fff7da;
  }

  .admin-reviews-summary-card[data-tone="green"] {
    background: #edf7e9;
  }

  .admin-reviews-summary-card[data-tone="gray"] {
    background: #f2efed;
  }

  .admin-reviews-summary-card[data-tone="blue"] {
    background: #edf5ff;
  }

  .admin-reviews-summary-card[data-tone="purple"] {
    background: #f3edff;
  }

  .admin-reviews-summary-card > span {
    color: #7a675e;
    font-size: 8px;
    font-weight: 850;
  }

  .admin-reviews-summary-card > strong {
    display: block;
    margin-top: 6px;
    color: #e0644e;
    font-size: 25px;
  }

  .admin-reviews-summary-card small {
    margin-left: 3px;
    color: #806d64;
    font-size: 8px;
  }

  .admin-reviews-insight {
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

  .admin-reviews-insight > div {
    padding: 7px 12px;
    border-right:
      1px solid
      rgba(136, 94, 74, 0.12);
  }

  .admin-reviews-insight span,
  .admin-reviews-insight strong {
    display: block;
  }

  .admin-reviews-insight span {
    color: #846f65;
    font-size: 7px;
  }

  .admin-reviews-insight strong {
    margin-top: 3px;
    font-size: 16px;
  }

  .admin-reviews-insight small {
    margin-left: 3px;
    color: #8a756a;
    font-size: 7px;
  }

  .admin-reviews-insight > p {
    margin: 0;
    color: #7a675e;
    font-size: 8px;
    line-height: 1.65;
  }

  .admin-reviews-control,
  .admin-reviews-list-head,
  .admin-review-card {
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

  .admin-reviews-control {
    margin-top: 16px;
    padding: 21px;
  }

  .admin-reviews-search-form {
    display: grid;
    grid-template-columns:
      minmax(330px, 1fr)
      minmax(150px, 0.32fr)
      minmax(150px, 0.32fr)
      auto auto;
    align-items: end;
    gap: 8px;
  }

  .admin-reviews-search-field > span,
  .admin-reviews-select-field > span {
    display: block;
    margin-bottom: 6px;
    color: #6d584e;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-reviews-search-field > div {
    position: relative;
  }

  .admin-reviews-search-field svg {
    position: absolute;
    left: 12px;
    top: 50%;
    width: 21px;
    height: 21px;
    color: #9b7d70;
    transform: translateY(-50%);
    pointer-events: none;
  }

  .admin-reviews-search-form input,
  .admin-reviews-search-form select {
    width: 100%;
    min-height: 45px;
    border:
      1px solid
      rgba(142, 99, 78, 0.22);
    border-radius: 11px;
    color: #49362d;
    background: #fffdfb;
    font: inherit;
    font-size: 9px;
  }

  .admin-reviews-search-form input {
    padding: 0 13px 0 41px;
  }

  .admin-reviews-search-form select {
    padding: 0 10px;
  }

  .admin-reviews-search-form button,
  .admin-reviews-search-form > a {
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
    font-size: 9px;
    font-weight: 900;
    white-space: nowrap;
    cursor: pointer;
  }

  .admin-reviews-search-form button {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
  }

  .admin-reviews-quick-filter {
    margin-top: 14px;
    padding-top: 14px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    border-top:
      1px solid
      rgba(136, 94, 74, 0.1);
  }

  .admin-reviews-quick-filter a {
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
    font-size: 8px;
    font-weight: 900;
  }

  .admin-reviews-quick-filter a[data-active="true"] {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
  }

  .admin-reviews-quick-filter small {
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
    font-size: 7px;
  }

  .admin-reviews-list-head {
    margin-top: 16px;
    padding: 21px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 17px;
  }

  .admin-reviews-list-head p {
    margin: 0;
    color: #e56852;
    font-size: 9px;
    font-weight: 900;
    letter-spacing: 0.07em;
  }

  .admin-reviews-list-head h2 {
    margin: 6px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 27px;
    line-height: 1.42;
    letter-spacing: -0.045em;
  }

  .admin-reviews-list-head div > span {
    display: block;
    margin-top: 5px;
    color: #7a675e;
    font-size: 10px;
  }

  .admin-reviews-list-head > a {
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
    font-size: 9px;
    font-weight: 900;
  }

  .admin-reviews-list {
    margin-top: 16px;
    display: grid;
    gap: 15px;
  }

  .admin-review-card {
    overflow: hidden;
  }

  .admin-review-card-head {
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

  .admin-review-card-head > div:first-child {
    min-width: 0;
  }

  .admin-review-badges {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 7px;
  }

  .admin-review-card-head h3 {
    margin: 8px 0 0;
    overflow-wrap: anywhere;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 23px;
    line-height: 1.4;
  }

  .admin-review-card-head > div:first-child > span {
    display: block;
    margin-top: 5px;
    color: #7e6b62;
    font-size: 8px;
  }

  .admin-review-status-badge,
  .admin-review-special-badge {
    min-height: 25px;
    padding: 0 8px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    font-size: 7px;
    font-weight: 900;
    white-space: nowrap;
  }

  .admin-review-status-badge[data-status="PENDING"] {
    color: #83540d;
    background: #fff1c7;
  }

  .admin-review-status-badge[data-status="APPROVED"] {
    color: #2f6b38;
    background: #e3f4e5;
  }

  .admin-review-status-badge[data-status="REJECTED"] {
    color: #9a4237;
    background: #ffe6e1;
  }

  .admin-review-special-badge[data-type="FEATURED"] {
    color: #9a5914;
    background: #ffe9bf;
  }

  .admin-review-special-badge[data-type="HIDDEN"] {
    color: #5d5571;
    background: #eceaf4;
  }

  .admin-review-rating {
    min-width: 135px;
    padding: 11px;
    flex: 0 0 auto;
    border:
      1px solid
      rgba(136, 94, 74, 0.1);
    border-radius: 12px;
    background: #fffaf6;
    text-align: right;
  }

  .admin-review-rating > div {
    color: #ddd3ce;
    font-size: 14px;
    letter-spacing: 0.03em;
    white-space: nowrap;
  }

  .admin-review-rating > div span[data-active="true"] {
    color: #ee9765;
  }

  .admin-review-rating strong {
    display: block;
    margin-top: 4px;
    font-size: 14px;
  }

  .admin-review-rating small {
    margin-left: 3px;
    color: #8a756a;
    font-size: 7px;
  }

  .admin-review-body {
    display: grid;
    grid-template-columns:
      minmax(0, 1.25fr)
      minmax(360px, 0.75fr);
  }

  .admin-review-content-section,
  .admin-review-customer-section {
    min-width: 0;
    padding: 20px 21px;
  }

  .admin-review-customer-section {
    border-left:
      1px solid
      rgba(136, 94, 74, 0.1);
  }

  .admin-review-section-heading p {
    margin: 0;
    color: #e56852;
    font-size: 7px;
    font-weight: 900;
    letter-spacing: 0.07em;
  }

  .admin-review-section-heading h4 {
    margin: 5px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 17px;
    line-height: 1.45;
  }

  .admin-review-section-heading > span {
    display: block;
    margin-top: 4px;
    color: #7e6b62;
    font-size: 8px;
    line-height: 1.6;
  }

  .admin-review-content {
    margin-top: 13px;
    padding: 15px;
    border:
      1px solid #eadcc6;
    border-radius: 12px;
    color: #5c453b;
    background: #fffaf2;
    font-size: 10px;
    line-height: 1.85;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  .admin-review-customer-grid {
    margin-top: 13px;
    display: grid;
    gap: 7px;
  }

  .admin-review-info-row {
    min-width: 0;
    padding: 10px;
    display: grid;
    grid-template-columns:
      88px minmax(0, 1fr);
    align-items: center;
    gap: 9px;
    border:
      1px solid
      rgba(136, 94, 74, 0.1);
    border-radius: 11px;
    background: #fffaf6;
  }

  .admin-review-info-row > span {
    color: #8a756a;
    font-size: 7px;
    font-weight: 850;
  }

  .admin-review-info-row > div {
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .admin-review-info-row strong,
  .admin-review-info-row a {
    min-width: 0;
    overflow-wrap: anywhere;
    font-size: 8px;
    line-height: 1.55;
  }

  .admin-review-user-link {
    min-height: 38px;
    margin-top: 10px;
    padding: 0 11px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border:
      1px solid #d6b3a3;
    border-radius: 10px;
    color: #755247;
    background: #ffffff;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-review-action-section {
    padding: 19px 21px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    border-top:
      1px solid
      rgba(136, 94, 74, 0.1);
    background: #fffdf9;
  }

  .admin-review-action-section > div:first-child {
    min-width: 0;
  }

  .admin-review-action-section p {
    margin: 0;
    color: #e56852;
    font-size: 7px;
    font-weight: 900;
  }

  .admin-review-action-section h4 {
    margin: 5px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 16px;
  }

  .admin-review-action-section > div:first-child > span {
    display: block;
    margin-top: 4px;
    color: #7e6b62;
    font-size: 8px;
  }

  .admin-review-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 7px;
  }

  .admin-review-actions form {
    margin: 0;
  }

  .admin-review-action-button {
    min-height: 38px;
    padding: 0 11px;
    border:
      1px solid transparent;
    border-radius: 10px;
    font: inherit;
    font-size: 8px;
    font-weight: 900;
    cursor: pointer;
  }

  .admin-review-action-button[data-tone="APPROVE"] {
    border-color: #9fd0bb;
    color: #2f6951;
    background: #e8f7ef;
  }

  .admin-review-action-button[data-tone="PENDING"] {
    border-color: #e3c985;
    color: #80601d;
    background: #fff7d9;
  }

  .admin-review-action-button[data-tone="REJECT"] {
    border-color: #edb1a7;
    color: #a2473b;
    background: #fff0ed;
  }

  .admin-review-action-button[data-tone="FEATURE"] {
    border-color: #edbd70;
    color: #965c19;
    background: #fff1d6;
  }

  .admin-review-action-button[data-tone="VISIBILITY"] {
    border-color: #c8c1d9;
    color: #5c546d;
    background: #f3f1f8;
  }

  .admin-review-card-footer {
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
    font-size: 7px;
  }

  .admin-review-card-footer > span {
    overflow-wrap: anywhere;
  }

  .admin-reviews-pagination {
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

  .admin-reviews-pagination a,
  .admin-reviews-pagination > span {
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
    font-size: 9px;
    font-weight: 900;
  }

  .admin-reviews-pagination a[data-active="true"] {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
  }

  .admin-reviews-pagination > span[data-disabled="true"] {
    opacity: 0.42;
  }

  .admin-reviews-empty {
    margin-top: 16px;
    padding: 52px 20px;
    border:
      1px dashed #ddb2a1;
    border-radius: 18px;
    background: #fffaf7;
    text-align: center;
  }

  .admin-reviews-empty svg {
    width: 56px;
    height: 56px;
    color: #e57059;
  }

  .admin-reviews-empty strong {
    display: block;
    margin-top: 11px;
    font-size: 16px;
  }

  .admin-reviews-empty p {
    margin: 5px 0 0;
    color: #806b61;
    font-size: 10px;
  }

  .admin-reviews-empty a {
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
    font-size: 9px;
    font-weight: 900;
  }

  @media (max-width: 1180px) {
    .admin-reviews-summary {
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
    }

    .admin-reviews-search-form {
      grid-template-columns:
        minmax(270px, 1fr)
        repeat(2, minmax(145px, 0.45fr))
        auto;
    }

    .admin-reviews-search-form > a {
      grid-column: 1 / -1;
      justify-self: start;
    }

    .admin-review-body {
      grid-template-columns: 1fr;
    }

    .admin-review-customer-section {
      border-left: 0;
      border-top:
        1px solid
        rgba(136, 94, 74, 0.1);
    }
  }

  @media (max-width: 880px) {
    .admin-reviews-hero {
      align-items: stretch;
      flex-direction: column;
      padding: 25px;
      border-radius: 22px;
    }

    .admin-reviews-hero-actions {
      min-width: 0;
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
    }

    .admin-reviews-alert {
      grid-template-columns:
        46px minmax(0, 1fr);
    }

    .admin-reviews-alert > a {
      grid-column: 1 / -1;
      justify-self: start;
    }

    .admin-reviews-insight {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .admin-reviews-insight > p {
      grid-column: 1 / -1;
    }

    .admin-reviews-search-form {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .admin-reviews-search-field {
      grid-column: 1 / -1;
    }

    .admin-review-action-section {
      align-items: stretch;
      flex-direction: column;
    }

    .admin-review-actions {
      justify-content: flex-start;
    }
  }

  @media (max-width: 640px) {
    .admin-reviews-summary,
    .admin-reviews-hero-actions,
    .admin-reviews-search-form {
      grid-template-columns: 1fr;
    }

    .admin-reviews-search-field {
      grid-column: auto;
    }

    .admin-reviews-search-form > a {
      grid-column: auto;
      justify-self: stretch;
    }

    .admin-reviews-alert,
    .admin-reviews-insight {
      grid-template-columns: 1fr;
    }

    .admin-reviews-alert-icon {
      width: 45px;
      height: 45px;
    }

    .admin-reviews-insight > p {
      grid-column: auto;
    }

    .admin-reviews-insight > div {
      border-right: 0;
      border-bottom:
        1px solid
        rgba(136, 94, 74, 0.12);
    }

    .admin-reviews-control,
    .admin-reviews-list-head {
      padding: 16px;
      border-radius: 18px;
    }

    .admin-reviews-list-head {
      align-items: stretch;
      flex-direction: column;
    }

    .admin-reviews-list-head > a {
      justify-content: center;
    }

    .admin-review-card-head {
      align-items: stretch;
      flex-direction: column;
    }

    .admin-review-rating {
      min-width: 0;
      text-align: left;
    }

    .admin-review-info-row {
      grid-template-columns: 1fr;
    }

    .admin-review-info-row > div {
      align-items: flex-start;
      flex-direction: column;
    }

    .admin-review-actions {
      display: grid;
      grid-template-columns: 1fr;
    }

    .admin-review-actions form,
    .admin-review-action-button {
      width: 100%;
    }

    .admin-review-card-footer {
      align-items: stretch;
      flex-direction: column;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .admin-reviews-page a,
    .admin-reviews-page button {
      transition: none;
    }
  }
`;
