import { auth } from "@/auth";
import CopyTextButton from "@/components/admin/CopyTextButton";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    type?: string;
    status?: string;
    sort?: string;
  }>;
};

type InquiryTypeFilter =
  | "ALL"
  | "PRODUCTION"
  | "PRODUCT";

type InquiryStatusFilter =
  | "ALL"
  | "REQUESTED"
  | "CONTACTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELED";

type InquirySort =
  | "NEWEST"
  | "OLDEST"
  | "UPDATED_DESC";

type InquiryItem = {
  id: string;
  type: "PRODUCTION" | "PRODUCT";
  title: string;
  subtitle: string;
  customerName: string;
  phone: string;
  email: string;
  message: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  detailHref: string;
  userSearchValue: string;
  priceLabel: string | null;
};

const TYPE_FILTERS: Array<{
  value: InquiryTypeFilter;
  label: string;
}> = [
  {
    value: "ALL",
    label: "전체 문의",
  },
  {
    value: "PRODUCTION",
    label: "책 제작 상담",
  },
  {
    value: "PRODUCT",
    label: "상품 신청",
  },
];

const STATUS_FILTERS: Array<{
  value: InquiryStatusFilter;
  label: string;
}> = [
  {
    value: "ALL",
    label: "전체 상태",
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
    label: "취소",
  },
];

const SORT_OPTIONS: Array<{
  value: InquirySort;
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
];

export default async function AdminInquiriesPage({
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

  const typeFilter =
    normalizeTypeFilter(
      resolvedSearchParams?.type,
    );

  const statusFilter =
    normalizeStatusFilter(
      resolvedSearchParams?.status,
    );

  const sortOrder =
    normalizeSort(
      resolvedSearchParams?.sort,
    );

  const productionWhere:
    Prisma.BookProductionRequestWhereInput =
    {};

  const productWhere:
    Prisma.ProductApplicationWhereInput =
    {};

  if (searchQuery) {
    productionWhere.OR = [
      {
        id: {
          contains: searchQuery,
        },
      },
      {
        bookId: {
          contains: searchQuery,
        },
      },
      {
        authorId: {
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
    ];

    productWhere.OR = [
      {
        id: {
          contains: searchQuery,
        },
      },
      {
        productCode: {
          contains: searchQuery,
        },
      },
      {
        productName: {
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
    productionWhere.status =
      statusFilter;

    productWhere.status =
      statusFilter;
  }

  const sevenDaysAgo =
    new Date(
      Date.now() -
        7 *
          24 *
          60 *
          60 *
          1000,
    );

  const [
    productionTotal,
    productTotal,
    productionRequested,
    productRequested,
    productionContacted,
    productContacted,
    productionInProgress,
    productInProgress,
    productionCompleted,
    productCompleted,
    productionCanceled,
    productCanceled,
    oldProductionRequested,
    oldProductRequested,
    productionResults,
    productResults,
  ] = await Promise.all([
    prisma.bookProductionRequest.count(),

    prisma.productApplication.count(),

    prisma.bookProductionRequest.count({
      where: {
        status: "REQUESTED",
      },
    }),

    prisma.productApplication.count({
      where: {
        status: "REQUESTED",
      },
    }),

    prisma.bookProductionRequest.count({
      where: {
        status: "CONTACTED",
      },
    }),

    prisma.productApplication.count({
      where: {
        status: "CONTACTED",
      },
    }),

    prisma.bookProductionRequest.count({
      where: {
        status: "IN_PROGRESS",
      },
    }),

    prisma.productApplication.count({
      where: {
        status: "IN_PROGRESS",
      },
    }),

    prisma.bookProductionRequest.count({
      where: {
        status: "COMPLETED",
      },
    }),

    prisma.productApplication.count({
      where: {
        status: "COMPLETED",
      },
    }),

    prisma.bookProductionRequest.count({
      where: {
        status: "CANCELED",
      },
    }),

    prisma.productApplication.count({
      where: {
        status: "CANCELED",
      },
    }),

    prisma.bookProductionRequest.count({
      where: {
        status: "REQUESTED",
        createdAt: {
          lt: sevenDaysAgo,
        },
      },
    }),

    prisma.productApplication.count({
      where: {
        status: "REQUESTED",
        createdAt: {
          lt: sevenDaysAgo,
        },
      },
    }),

    prisma.bookProductionRequest.findMany({
      where: productionWhere,
      orderBy:
        getInquiryOrderBy(
          sortOrder,
        ),
      take: 40,
      select: {
        id: true,
        bookId: true,
        authorId: true,
        name: true,
        phone: true,
        email: true,
        message: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    }),

    prisma.productApplication.findMany({
      where: productWhere,
      orderBy:
        getInquiryOrderBy(
          sortOrder,
        ),
      take: 40,
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
        status: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  const bookIds =
    productionResults.map(
      (item) => item.bookId,
    );

  const authorIds =
    productionResults.map(
      (item) => item.authorId,
    );

  const [
    productionBooks,
    productionAuthors,
  ] = await Promise.all([
    bookIds.length > 0
      ? prisma.book.findMany({
          where: {
            id: {
              in: bookIds,
            },
          },
          select: {
            id: true,
            title: true,
          },
        })
      : Promise.resolve([]),

    authorIds.length > 0
      ? prisma.user.findMany({
          where: {
            id: {
              in: authorIds,
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

  const bookTitleMap =
    new Map(
      productionBooks.map(
        (book) => [
          book.id,
          book.title,
        ],
      ),
    );

  const authorMap =
    new Map(
      productionAuthors.map(
        (author) => [
          author.id,
          author,
        ],
      ),
    );

  const productionItems:
    InquiryItem[] =
    productionResults.map(
      (item) => {
        const author =
          authorMap.get(
            item.authorId,
          );

        const customerName =
          item.name ||
          author?.name ||
          "이름 미입력";

        const email =
          item.email ||
          author?.email ||
          "";

        return {
          id: item.id,
          type: "PRODUCTION",
          title:
            bookTitleMap.get(
              item.bookId,
            ) ||
            "제목을 확인할 수 없는 책",
          subtitle:
            "책 제작 상담",
          customerName,
          phone: item.phone || "",
          email,
          message: item.message || "",
          status: item.status,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          detailHref:
            `/admin/books/${item.bookId}`,
          userSearchValue:
            email || customerName,
          priceLabel: null,
        };
      },
    );

  const productItems:
    InquiryItem[] =
    productResults.map(
      (item) => {
        const customerName =
          item.name ||
          item.user.name ||
          "이름 미입력";

        const email =
          item.email ||
          item.user.email ||
          "";

        return {
          id: item.id,
          type: "PRODUCT",
          title:
            item.productName,
          subtitle:
            `${getCategoryLabel(
              item.category,
            )} · ${getBillingLabel(
              item.billingType,
            )}`,
          customerName,
          phone: item.phone || "",
          email,
          message: item.message || "",
          status: item.status,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          detailHref:
            `/admin/product-applications?q=${encodeURIComponent(
              item.id,
            )}`,
          userSearchValue:
            email || customerName,
          priceLabel:
            formatPrice(
              item.price,
              item.billingType,
            ),
        };
      },
    );

  const allItems =
    [...productionItems, ...productItems]
      .filter((item) => {
        if (
          typeFilter === "ALL"
        ) {
          return true;
        }

        return (
          item.type === typeFilter
        );
      })
      .sort((first, second) => {
        if (
          sortOrder === "OLDEST"
        ) {
          return (
            first.createdAt.getTime() -
            second.createdAt.getTime()
          );
        }

        if (
          sortOrder ===
          "UPDATED_DESC"
        ) {
          return (
            second.updatedAt.getTime() -
            first.updatedAt.getTime()
          );
        }

        return (
          second.createdAt.getTime() -
          first.createdAt.getTime()
        );
      })
      .slice(0, 24);

  const totalCount =
    productionTotal +
    productTotal;

  const requestedCount =
    productionRequested +
    productRequested;

  const contactedCount =
    productionContacted +
    productContacted;

  const inProgressCount =
    productionInProgress +
    productInProgress;

  const completedCount =
    productionCompleted +
    productCompleted;

  const canceledCount =
    productionCanceled +
    productCanceled;

  const activeCount =
    requestedCount +
    contactedCount +
    inProgressCount;

  const oldRequestedCount =
    oldProductionRequested +
    oldProductRequested;

  const hasActiveCondition =
    Boolean(searchQuery) ||
    typeFilter !== "ALL" ||
    statusFilter !== "ALL" ||
    sortOrder !== "NEWEST";

  return (
    <main className="admin-inquiries-page">
      <style>
        {adminInquiriesStyles}
      </style>

      <div className="admin-inquiries-shell">
        <header className="admin-inquiries-hero">
          <div>
            <p>
              관리자 · 문의 통합 관리
            </p>

            <h1>
              제작 상담과 상품 신청을
              한 화면에서 확인합니다
            </h1>

            <span>
              별도의 문의 데이터베이스를
              만들지 않고, 현재 운영 중인
              책 제작 상담과 상품 신청을
              통합하여 보여주는 운영
              화면입니다.
            </span>
          </div>

          <div className="admin-inquiries-hero-actions">
            <Link href="/admin">
              관리자 홈
            </Link>

            <Link href="/admin/production-requests">
              제작 상담 전체
            </Link>

            <Link href="/admin/product-applications">
              상품 신청 전체
              <span aria-hidden="true">
                →
              </span>
            </Link>
          </div>
        </header>

        <section
          className="admin-inquiries-alert"
          data-warning={
            oldRequestedCount > 0
              ? "true"
              : "false"
          }
        >
          <span className="admin-inquiries-alert-icon">
            {oldRequestedCount >
            0 ? (
              <AlertIcon />
            ) : (
              <CheckIcon />
            )}
          </span>

          <div>
            <p>운영 점검</p>

            <h2>
              {oldRequestedCount > 0
                ? `7일 이상 처리되지 않은 신규 문의가 ${oldRequestedCount.toLocaleString()}건 있습니다.`
                : "7일 이상 미처리된 신규 문의가 없습니다."}
            </h2>

            <span>
              전체 처리 대상{" "}
              {activeCount.toLocaleString()}
              건 · 새로운 접수{" "}
              {requestedCount.toLocaleString()}
              건 · 진행 중{" "}
              {inProgressCount.toLocaleString()}
              건
            </span>
          </div>

          {oldRequestedCount > 0 ? (
            <Link href="/admin/inquiries?status=REQUESTED&sort=OLDEST">
              오래된 문의 확인
            </Link>
          ) : null}
        </section>

        <section className="admin-inquiries-summary">
          <SummaryCard
            label="전체 문의"
            value={totalCount}
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
            label="취소"
            value={canceledCount}
            unit="건"
            tone="gray"
          />
        </section>

        <section className="admin-inquiries-source-grid">
          <SourceCard
            eyebrow="BOOK PRODUCTION"
            title="책 제작 상담"
            description="책 원고와 제작 상담을 신청한 고객을 관리합니다."
            total={productionTotal}
            requested={
              productionRequested
            }
            inProgress={
              productionInProgress
            }
            href="/admin/production-requests"
            tone="book"
          />

          <SourceCard
            eyebrow="PRODUCT APPLICATION"
            title="상품 신청"
            description="인생책 제작과 월간 기록 상품 신청을 관리합니다."
            total={productTotal}
            requested={
              productRequested
            }
            inProgress={
              productInProgress
            }
            href="/admin/product-applications"
            tone="product"
          />
        </section>

        <section className="admin-inquiries-control">
          <form
            action="/admin/inquiries"
            method="get"
            className="admin-inquiries-search-form"
          >
            <label className="admin-inquiries-search-field">
              <span>통합 검색</span>

              <div>
                <SearchIcon />

                <input
                  type="search"
                  name="q"
                  defaultValue={
                    searchQuery
                  }
                  placeholder="접수번호, 책·상품, 이름, 연락처, 이메일, 요청사항"
                  maxLength={100}
                />
              </div>
            </label>

            <label className="admin-inquiries-select-field">
              <span>문의 종류</span>

              <select
                name="type"
                defaultValue={
                  typeFilter
                }
              >
                {TYPE_FILTERS.map(
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

            <label className="admin-inquiries-select-field">
              <span>처리 상태</span>

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

            <label className="admin-inquiries-select-field">
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
              <Link href="/admin/inquiries">
                전체 초기화
              </Link>
            ) : null}
          </form>

          <div className="admin-inquiries-quick-filter">
            {TYPE_FILTERS.map(
              (filter) => (
                <Link
                  key={filter.value}
                  href={buildInquiriesHref({
                    searchQuery,
                    type:
                      filter.value,
                    status:
                      statusFilter,
                    sort: sortOrder,
                  })}
                  data-active={
                    typeFilter ===
                    filter.value
                      ? "true"
                      : "false"
                  }
                >
                  {filter.label}

                  <small>
                    {getTypeCount(
                      filter.value,
                      productionTotal,
                      productTotal,
                    ).toLocaleString()}
                  </small>
                </Link>
              ),
            )}
          </div>
        </section>

        <section className="admin-inquiries-list-head">
          <div>
            <p>통합 문의 목록</p>

            <h2>
              최근 문의와 요청 내용을
              확인하세요
            </h2>

            <span>
              현재 조건에서 최대 24건을
              표시합니다. 상태 변경과
              세부 관리는 각 전용 관리
              화면에서 진행합니다.
            </span>
          </div>

          {hasActiveCondition ? (
            <Link href="/admin/inquiries">
              전체 문의 보기
            </Link>
          ) : null}
        </section>

        {allItems.length > 0 ? (
          <section className="admin-inquiries-list">
            {allItems.map(
              (item) => (
                <InquiryCard
                  key={`${item.type}-${item.id}`}
                  item={item}
                />
              ),
            )}
          </section>
        ) : (
          <div className="admin-inquiries-empty">
            <InquiryIcon />

            <strong>
              {totalCount === 0
                ? "아직 접수된 문의가 없습니다."
                : "현재 조건에 맞는 문의가 없습니다."}
            </strong>

            <p>
              {totalCount === 0
                ? "책 제작 상담 또는 상품 신청이 접수되면 이곳에 표시됩니다."
                : "검색어와 문의 종류 또는 상태 필터를 변경해 주세요."}
            </p>

            <Link href="/admin/inquiries">
              전체 문의 보기
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

function InquiryCard({
  item,
}: {
  item: InquiryItem;
}) {
  return (
    <article className="admin-inquiry-card">
      <header className="admin-inquiry-card-head">
        <div>
          <div className="admin-inquiry-badges">
            <TypeBadge
              type={item.type}
            />

            <StatusBadge
              status={item.status}
            />
          </div>

          <h3>{item.title}</h3>

          <span>
            {item.subtitle}
          </span>
        </div>

        <div className="admin-inquiry-dates">
          <div>
            <span>접수일</span>
            <strong>
              {formatDateTime(
                item.createdAt,
              )}
            </strong>
          </div>

          <div>
            <span>최근 변경</span>
            <strong>
              {formatDateTime(
                item.updatedAt,
              )}
            </strong>
          </div>
        </div>
      </header>

      <div className="admin-inquiry-body">
        <section>
          <SectionHeading
            eyebrow="신청자 정보"
            title={item.customerName}
            description={
              item.phone ||
              item.email ||
              "연락처 미입력"
            }
          />

          <div className="admin-inquiry-contact-list">
            <InfoRow
              label="이름"
              value={item.customerName}
              copyLabel="이름 복사"
            />

            <InfoRow
              label="전화번호"
              value={item.phone}
              href={
                item.phone
                  ? `tel:${item.phone}`
                  : undefined
              }
              copyLabel="번호 복사"
            />

            <InfoRow
              label="이메일"
              value={item.email}
              href={
                item.email
                  ? `mailto:${item.email}`
                  : undefined
              }
              copyLabel="메일 복사"
            />

            {item.priceLabel ? (
              <InfoRow
                label="신청 가격"
                value={
                  item.priceLabel
                }
                copyLabel="가격 복사"
              />
            ) : null}
          </div>
        </section>

        <section>
          <SectionHeading
            eyebrow="요청 내용"
            title={
              item.message
                ? "고객이 남긴 요청사항"
                : "별도 요청사항 없음"
            }
            description="상세 처리 전에 내용을 확인하세요."
          />

          <div className="admin-inquiry-message">
            {item.message ||
              "고객이 별도의 요청사항을 남기지 않았습니다."}
          </div>
        </section>
      </div>

      <footer className="admin-inquiry-card-footer">
        <div>
          <span>
            접수번호 {item.id}
          </span>

          <CopyTextButton
            value={item.id}
            label="접수번호 복사"
          />
        </div>

        <div>
          <Link
            href={buildUserSearchHref(
              item.userSearchValue,
            )}
          >
            회원 검색
          </Link>

          <Link
            href={item.detailHref}
          >
            전용 관리 화면
            <span aria-hidden="true">
              →
            </span>
          </Link>
        </div>
      </footer>
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
    | "yellow"
    | "blue"
    | "purple"
    | "green"
    | "gray";
}) {
  return (
    <article
      className="admin-inquiries-summary-card"
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

function SourceCard({
  eyebrow,
  title,
  description,
  total,
  requested,
  inProgress,
  href,
  tone,
}: {
  eyebrow: string;
  title: string;
  description: string;
  total: number;
  requested: number;
  inProgress: number;
  href: string;
  tone: "book" | "product";
}) {
  return (
    <article
      className="admin-inquiry-source-card"
      data-tone={tone}
    >
      <div>
        <p>{eyebrow}</p>
        <h2>{title}</h2>
        <span>{description}</span>
      </div>

      <div className="admin-inquiry-source-stats">
        <div>
          <span>전체</span>
          <strong>
            {total.toLocaleString()}
          </strong>
        </div>

        <div>
          <span>새 접수</span>
          <strong>
            {requested.toLocaleString()}
          </strong>
        </div>

        <div>
          <span>진행 중</span>
          <strong>
            {inProgress.toLocaleString()}
          </strong>
        </div>
      </div>

      <Link href={href}>
        전용 관리 화면
        <span aria-hidden="true">
          →
        </span>
      </Link>
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
    <div className="admin-inquiry-section-heading">
      <p>{eyebrow}</p>
      <h4>{title}</h4>
      <span>{description}</span>
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
    <div className="admin-inquiry-info-row">
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

function TypeBadge({
  type,
}: {
  type: InquiryItem["type"];
}) {
  return (
    <span
      className="admin-inquiry-type-badge"
      data-type={type}
    >
      {type === "PRODUCTION"
        ? "책 제작 상담"
        : "상품 신청"}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span
      className="admin-inquiry-status-badge"
      data-status={status}
    >
      {getStatusLabel(status)}
    </span>
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

function InquiryIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10 14h44v32H28L17 55v-9h-7V14Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      <path
        d="M21 25h22M21 34h15"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function normalizeTypeFilter(
  value: string | undefined,
): InquiryTypeFilter {
  if (
    value === "PRODUCTION"
  ) {
    return "PRODUCTION";
  }

  if (value === "PRODUCT") {
    return "PRODUCT";
  }

  return "ALL";
}

function normalizeStatusFilter(
  value: string | undefined,
): InquiryStatusFilter {
  if (value === "REQUESTED") {
    return "REQUESTED";
  }

  if (value === "CONTACTED") {
    return "CONTACTED";
  }

  if (
    value === "IN_PROGRESS"
  ) {
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

function normalizeSort(
  value: string | undefined,
): InquirySort {
  if (value === "OLDEST") {
    return "OLDEST";
  }

  if (
    value === "UPDATED_DESC"
  ) {
    return "UPDATED_DESC";
  }

  return "NEWEST";
}

function getInquiryOrderBy(
  sort: InquirySort,
) {
  if (sort === "OLDEST") {
    return [
      {
        createdAt:
          "asc" as const,
      },
      {
        updatedAt:
          "asc" as const,
      },
    ];
  }

  if (
    sort === "UPDATED_DESC"
  ) {
    return [
      {
        updatedAt:
          "desc" as const,
      },
      {
        createdAt:
          "desc" as const,
      },
    ];
  }

  return [
    {
      createdAt:
        "desc" as const,
    },
    {
      updatedAt:
        "desc" as const,
    },
  ];
}

function buildInquiriesHref({
  searchQuery = "",
  type = "ALL",
  status = "ALL",
  sort = "NEWEST",
}: {
  searchQuery?: string;
  type?: InquiryTypeFilter;
  status?: InquiryStatusFilter;
  sort?: InquirySort;
}) {
  const params =
    new URLSearchParams();

  if (searchQuery.trim()) {
    params.set(
      "q",
      searchQuery.trim(),
    );
  }

  if (type !== "ALL") {
    params.set("type", type);
  }

  if (status !== "ALL") {
    params.set(
      "status",
      status,
    );
  }

  if (sort !== "NEWEST") {
    params.set("sort", sort);
  }

  const query =
    params.toString();

  return query
    ? `/admin/inquiries?${query}`
    : "/admin/inquiries";
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

function getTypeCount(
  type: InquiryTypeFilter,
  productionTotal: number,
  productTotal: number,
) {
  if (type === "PRODUCTION") {
    return productionTotal;
  }

  if (type === "PRODUCT") {
    return productTotal;
  }

  return (
    productionTotal +
    productTotal
  );
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
    return "취소";
  }

  return "상태 확인 필요";
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

function formatPrice(
  price: number,
  billingType: string,
) {
  const formatted =
    price.toLocaleString(
      "ko-KR",
    );

  return billingType === "MONTHLY"
    ? `${formatted}원 / 월`
    : `${formatted}원부터`;
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

const adminInquiriesStyles = `
  .admin-inquiries-page,
  .admin-inquiries-page * {
    box-sizing: border-box;
  }

  .admin-inquiries-page {
    min-height: 100%;
    color: #432f26;
    font-family:
      var(--font-daldongne-sans),
      "Noto Sans KR",
      sans-serif;
  }

  .admin-inquiries-page a {
    color: inherit;
    text-decoration: none;
  }

  .admin-inquiries-page a,
  .admin-inquiries-page button {
    transition:
      transform 160ms ease,
      box-shadow 160ms ease,
      border-color 160ms ease;
  }

  .admin-inquiries-page a:hover,
  .admin-inquiries-page button:hover {
    transform: translateY(-2px);
  }

  .admin-inquiries-page a:focus-visible,
  .admin-inquiries-page button:focus-visible,
  .admin-inquiries-page input:focus-visible,
  .admin-inquiries-page select:focus-visible {
    outline:
      4px solid
      rgba(239, 105, 83, 0.2);
    outline-offset: 3px;
  }

  .admin-inquiries-shell {
    width: min(1480px, 100%);
    margin: 0 auto;
  }

  .admin-inquiries-hero {
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
        rgba(221, 238, 255, 0.7),
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

  .admin-inquiries-hero > div:first-child {
    min-width: 0;
  }

  .admin-inquiries-hero p {
    margin: 0;
    color: #e56852;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.08em;
  }

  .admin-inquiries-hero h1 {
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

  .admin-inquiries-hero > div:first-child > span {
    display: block;
    max-width: 740px;
    margin-top: 10px;
    color: #76635a;
    font-size: 13px;
    line-height: 1.78;
  }

  .admin-inquiries-hero-actions {
    min-width: 260px;
    display: grid;
    gap: 8px;
  }

  .admin-inquiries-hero-actions a {
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

  .admin-inquiries-hero-actions a:last-child {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
  }

  .admin-inquiries-alert {
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

  .admin-inquiries-alert[data-warning="true"] {
    border-color: #e2a26e;
    background:
      linear-gradient(
        135deg,
        #fff1df,
        #fffaf2
      );
  }

  .admin-inquiries-alert-icon {
    width: 50px;
    height: 50px;
    padding: 10px;
    display: grid;
    place-items: center;
    border-radius: 14px;
    color: #3f7948;
    background: #ffffff;
  }

  .admin-inquiries-alert[data-warning="true"]
  .admin-inquiries-alert-icon {
    color: #a34d29;
  }

  .admin-inquiries-alert-icon svg {
    width: 100%;
    height: 100%;
  }

  .admin-inquiries-alert p {
    margin: 0;
    color: #3f7948;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-inquiries-alert[data-warning="true"] p {
    color: #a34d29;
  }

  .admin-inquiries-alert h2 {
    margin: 4px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 19px;
    line-height: 1.45;
  }

  .admin-inquiries-alert > div > span {
    display: block;
    margin-top: 4px;
    color: #78655c;
    font-size: 8px;
    line-height: 1.6;
  }

  .admin-inquiries-alert > a {
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

  .admin-inquiries-summary {
    margin-top: 16px;
    display: grid;
    grid-template-columns:
      repeat(6, minmax(0, 1fr));
    gap: 9px;
  }

  .admin-inquiries-summary-card {
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

  .admin-inquiries-summary-card[data-tone="coral"] {
    background: #fff0eb;
  }

  .admin-inquiries-summary-card[data-tone="yellow"] {
    background: #fff7da;
  }

  .admin-inquiries-summary-card[data-tone="blue"] {
    background: #edf5ff;
  }

  .admin-inquiries-summary-card[data-tone="purple"] {
    background: #f3edff;
  }

  .admin-inquiries-summary-card[data-tone="green"] {
    background: #edf7e9;
  }

  .admin-inquiries-summary-card[data-tone="gray"] {
    background: #f2efed;
  }

  .admin-inquiries-summary-card > span {
    color: #7a675e;
    font-size: 8px;
    font-weight: 850;
  }

  .admin-inquiries-summary-card > strong {
    display: block;
    margin-top: 6px;
    color: #e0644e;
    font-size: 25px;
  }

  .admin-inquiries-summary-card small {
    margin-left: 3px;
    color: #806d64;
    font-size: 8px;
  }

  .admin-inquiries-source-grid {
    margin-top: 10px;
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 9px;
  }

  .admin-inquiry-source-card {
    min-width: 0;
    padding: 18px;
    display: grid;
    grid-template-columns:
      minmax(0, 1fr)
      minmax(260px, 0.65fr)
      auto;
    align-items: center;
    gap: 14px;
    border:
      1px solid
      rgba(136, 94, 74, 0.12);
    border-radius: 17px;
    background: #ffffff;
  }

  .admin-inquiry-source-card[data-tone="book"] {
    background:
      linear-gradient(
        135deg,
        #fff4e9,
        #fffdf9
      );
  }

  .admin-inquiry-source-card[data-tone="product"] {
    background:
      linear-gradient(
        135deg,
        #eef5ff,
        #fbfdff
      );
  }

  .admin-inquiry-source-card p {
    margin: 0;
    color: #e56852;
    font-size: 7px;
    font-weight: 900;
    letter-spacing: 0.07em;
  }

  .admin-inquiry-source-card h2 {
    margin: 5px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 18px;
  }

  .admin-inquiry-source-card > div:first-child > span {
    display: block;
    margin-top: 5px;
    color: #7a675e;
    font-size: 8px;
    line-height: 1.6;
  }

  .admin-inquiry-source-stats {
    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
    gap: 6px;
  }

  .admin-inquiry-source-stats > div {
    padding: 9px;
    border-radius: 10px;
    background:
      rgba(255, 255, 255, 0.82);
    text-align: center;
  }

  .admin-inquiry-source-stats span,
  .admin-inquiry-source-stats strong {
    display: block;
  }

  .admin-inquiry-source-stats span {
    color: #89746a;
    font-size: 6px;
  }

  .admin-inquiry-source-stats strong {
    margin-top: 4px;
    font-size: 13px;
  }

  .admin-inquiry-source-card > a {
    min-height: 38px;
    padding: 0 11px;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    border:
      1px solid #d6b3a3;
    border-radius: 10px;
    color: #755247;
    background: #ffffff;
    font-size: 8px;
    font-weight: 900;
    white-space: nowrap;
  }

  .admin-inquiries-control,
  .admin-inquiries-list-head,
  .admin-inquiry-card {
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

  .admin-inquiries-control {
    margin-top: 16px;
    padding: 21px;
  }

  .admin-inquiries-search-form {
    display: grid;
    grid-template-columns:
      minmax(310px, 1fr)
      minmax(140px, 0.25fr)
      minmax(140px, 0.25fr)
      minmax(140px, 0.25fr)
      auto auto;
    align-items: end;
    gap: 8px;
  }

  .admin-inquiries-search-field > span,
  .admin-inquiries-select-field > span {
    display: block;
    margin-bottom: 6px;
    color: #6d584e;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-inquiries-search-field > div {
    position: relative;
  }

  .admin-inquiries-search-field svg {
    position: absolute;
    left: 12px;
    top: 50%;
    width: 21px;
    height: 21px;
    color: #9b7d70;
    transform: translateY(-50%);
    pointer-events: none;
  }

  .admin-inquiries-search-form input,
  .admin-inquiries-search-form select {
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

  .admin-inquiries-search-form input {
    padding: 0 13px 0 41px;
  }

  .admin-inquiries-search-form select {
    padding: 0 10px;
  }

  .admin-inquiries-search-form button,
  .admin-inquiries-search-form > a {
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

  .admin-inquiries-search-form button {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
  }

  .admin-inquiries-quick-filter {
    margin-top: 14px;
    padding-top: 14px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    border-top:
      1px solid
      rgba(136, 94, 74, 0.1);
  }

  .admin-inquiries-quick-filter a {
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

  .admin-inquiries-quick-filter a[data-active="true"] {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
  }

  .admin-inquiries-quick-filter small {
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

  .admin-inquiries-list-head {
    margin-top: 16px;
    padding: 21px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 17px;
  }

  .admin-inquiries-list-head p {
    margin: 0;
    color: #e56852;
    font-size: 9px;
    font-weight: 900;
    letter-spacing: 0.07em;
  }

  .admin-inquiries-list-head h2 {
    margin: 6px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 27px;
    line-height: 1.42;
    letter-spacing: -0.045em;
  }

  .admin-inquiries-list-head div > span {
    display: block;
    max-width: 720px;
    margin-top: 5px;
    color: #7a675e;
    font-size: 10px;
    line-height: 1.65;
  }

  .admin-inquiries-list-head > a {
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

  .admin-inquiries-list {
    margin-top: 16px;
    display: grid;
    gap: 14px;
  }

  .admin-inquiry-card {
    overflow: hidden;
  }

  .admin-inquiry-card-head {
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

  .admin-inquiry-card-head > div:first-child {
    min-width: 0;
  }

  .admin-inquiry-badges {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 7px;
  }

  .admin-inquiry-card-head h3 {
    margin: 8px 0 0;
    overflow-wrap: anywhere;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 23px;
    line-height: 1.4;
  }

  .admin-inquiry-card-head > div:first-child > span {
    display: block;
    margin-top: 5px;
    color: #7e6b62;
    font-size: 8px;
  }

  .admin-inquiry-type-badge,
  .admin-inquiry-status-badge {
    min-height: 25px;
    padding: 0 8px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    font-size: 7px;
    font-weight: 900;
    white-space: nowrap;
  }

  .admin-inquiry-type-badge[data-type="PRODUCTION"] {
    color: #8a4b25;
    background: #fff0da;
  }

  .admin-inquiry-type-badge[data-type="PRODUCT"] {
    color: #285d8e;
    background: #e5f2ff;
  }

  .admin-inquiry-status-badge[data-status="REQUESTED"] {
    color: #83540d;
    background: #fff1c7;
  }

  .admin-inquiry-status-badge[data-status="CONTACTED"] {
    color: #245d8c;
    background: #e4f2ff;
  }

  .admin-inquiry-status-badge[data-status="IN_PROGRESS"] {
    color: #62438a;
    background: #efe6ff;
  }

  .admin-inquiry-status-badge[data-status="COMPLETED"] {
    color: #2f6b38;
    background: #e3f4e5;
  }

  .admin-inquiry-status-badge[data-status="CANCELED"] {
    color: #776868;
    background: #f2eeee;
  }

  .admin-inquiry-dates {
    min-width: 330px;
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 6px;
  }

  .admin-inquiry-dates > div {
    min-width: 0;
    padding: 10px;
    border:
      1px solid
      rgba(136, 94, 74, 0.09);
    border-radius: 10px;
    background: #ffffff;
  }

  .admin-inquiry-dates span,
  .admin-inquiry-dates strong {
    display: block;
  }

  .admin-inquiry-dates span {
    color: #8a756a;
    font-size: 7px;
  }

  .admin-inquiry-dates strong {
    margin-top: 4px;
    font-size: 9px;
    line-height: 1.5;
  }

  .admin-inquiry-body {
    display: grid;
    grid-template-columns:
      minmax(360px, 0.72fr)
      minmax(0, 1.28fr);
  }

  .admin-inquiry-body > section {
    min-width: 0;
    padding: 20px 21px;
  }

  .admin-inquiry-body > section + section {
    border-left:
      1px solid
      rgba(136, 94, 74, 0.1);
  }

  .admin-inquiry-section-heading p {
    margin: 0;
    color: #e56852;
    font-size: 7px;
    font-weight: 900;
    letter-spacing: 0.07em;
  }

  .admin-inquiry-section-heading h4 {
    margin: 5px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 17px;
    line-height: 1.45;
  }

  .admin-inquiry-section-heading > span {
    display: block;
    margin-top: 4px;
    color: #7e6b62;
    font-size: 8px;
    line-height: 1.6;
  }

  .admin-inquiry-contact-list {
    margin-top: 13px;
    display: grid;
    gap: 7px;
  }

  .admin-inquiry-info-row {
    min-width: 0;
    padding: 10px;
    display: grid;
    grid-template-columns:
      76px minmax(0, 1fr);
    align-items: center;
    gap: 9px;
    border:
      1px solid
      rgba(136, 94, 74, 0.1);
    border-radius: 11px;
    background: #fffaf6;
  }

  .admin-inquiry-info-row > span {
    color: #8a756a;
    font-size: 7px;
    font-weight: 850;
  }

  .admin-inquiry-info-row > div {
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .admin-inquiry-info-row strong,
  .admin-inquiry-info-row a {
    min-width: 0;
    overflow-wrap: anywhere;
    font-size: 8px;
    line-height: 1.55;
  }

  .admin-inquiry-message {
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

  .admin-inquiry-card-footer {
    padding: 12px 21px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    border-top:
      1px solid
      rgba(136, 94, 74, 0.1);
    background: #f8f2ed;
  }

  .admin-inquiry-card-footer > div {
    min-width: 0;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  .admin-inquiry-card-footer > div:first-child > span {
    color: #8b776d;
    font-size: 7px;
    overflow-wrap: anywhere;
  }

  .admin-inquiry-card-footer > div:last-child {
    justify-content: flex-end;
  }

  .admin-inquiry-card-footer > div:last-child a {
    min-height: 35px;
    padding: 0 10px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border:
      1px solid #d6b3a3;
    border-radius: 9px;
    color: #755247;
    background: #ffffff;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-inquiry-card-footer > div:last-child a:last-child {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
  }

  .admin-inquiries-empty {
    margin-top: 16px;
    padding: 52px 20px;
    border:
      1px dashed #ddb2a1;
    border-radius: 18px;
    background: #fffaf7;
    text-align: center;
  }

  .admin-inquiries-empty svg {
    width: 56px;
    height: 56px;
    color: #e57059;
  }

  .admin-inquiries-empty strong {
    display: block;
    margin-top: 11px;
    font-size: 16px;
  }

  .admin-inquiries-empty p {
    margin: 5px 0 0;
    color: #806b61;
    font-size: 10px;
  }

  .admin-inquiries-empty a {
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
    .admin-inquiries-summary {
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
    }

    .admin-inquiry-source-card {
      grid-template-columns:
        minmax(0, 1fr)
        minmax(250px, 0.8fr);
    }

    .admin-inquiry-source-card > a {
      grid-column: 1 / -1;
      justify-self: start;
    }

    .admin-inquiries-search-form {
      grid-template-columns:
        minmax(260px, 1fr)
        repeat(3, minmax(135px, 0.35fr))
        auto;
    }

    .admin-inquiries-search-form > a {
      grid-column: 1 / -1;
      justify-self: start;
    }
  }

  @media (max-width: 900px) {
    .admin-inquiries-hero {
      align-items: stretch;
      flex-direction: column;
      padding: 25px;
      border-radius: 22px;
    }

    .admin-inquiries-hero-actions {
      min-width: 0;
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
    }

    .admin-inquiries-alert {
      grid-template-columns:
        46px minmax(0, 1fr);
    }

    .admin-inquiries-alert > a {
      grid-column: 1 / -1;
      justify-self: start;
    }

    .admin-inquiries-source-grid {
      grid-template-columns: 1fr;
    }

    .admin-inquiries-search-form {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .admin-inquiries-search-field {
      grid-column: 1 / -1;
    }

    .admin-inquiry-card-head {
      align-items: stretch;
      flex-direction: column;
    }

    .admin-inquiry-dates {
      min-width: 0;
      width: 100%;
    }

    .admin-inquiry-body {
      grid-template-columns: 1fr;
    }

    .admin-inquiry-body > section + section {
      border-left: 0;
      border-top:
        1px solid
        rgba(136, 94, 74, 0.1);
    }
  }

  @media (max-width: 640px) {
    .admin-inquiries-summary,
    .admin-inquiries-hero-actions,
    .admin-inquiries-search-form,
    .admin-inquiry-source-card,
    .admin-inquiry-source-stats,
    .admin-inquiry-dates {
      grid-template-columns: 1fr;
    }

    .admin-inquiries-search-field {
      grid-column: auto;
    }

    .admin-inquiries-search-form > a {
      grid-column: auto;
      justify-self: stretch;
    }

    .admin-inquiries-alert {
      grid-template-columns: 1fr;
    }

    .admin-inquiries-alert-icon {
      width: 45px;
      height: 45px;
    }

    .admin-inquiry-source-card > a {
      grid-column: auto;
      justify-self: stretch;
      justify-content: center;
    }

    .admin-inquiries-control,
    .admin-inquiries-list-head {
      padding: 16px;
      border-radius: 18px;
    }

    .admin-inquiries-list-head {
      align-items: stretch;
      flex-direction: column;
    }

    .admin-inquiries-list-head > a {
      justify-content: center;
    }

    .admin-inquiry-info-row {
      grid-template-columns: 1fr;
    }

    .admin-inquiry-info-row > div {
      align-items: flex-start;
      flex-direction: column;
    }

    .admin-inquiry-card-footer {
      align-items: stretch;
      flex-direction: column;
    }

    .admin-inquiry-card-footer > div:last-child {
      justify-content: stretch;
    }

    .admin-inquiry-card-footer > div:last-child a {
      flex: 1 1 auto;
      justify-content: center;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .admin-inquiries-page a,
    .admin-inquiries-page button {
      transition: none;
    }
  }
`;
