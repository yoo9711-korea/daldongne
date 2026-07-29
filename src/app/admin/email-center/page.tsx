import { auth } from "@/auth";
import AdminOrderEmailRetryButton from "@/components/admin/AdminOrderEmailRetryButton";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

const EMAIL_AUDIT_ACTIONS = [
  "CUSTOMER_SHIPPING_EMAIL_SENT",
  "CUSTOMER_SHIPPING_EMAIL_SKIPPED",
  "CUSTOMER_SHIPPING_EMAIL_FAILED",
  "CUSTOMER_COMPLETION_EMAIL_SENT",
  "CUSTOMER_COMPLETION_EMAIL_SKIPPED",
  "CUSTOMER_COMPLETION_EMAIL_FAILED",
];

type EmailTypeFilter = "" | "SHIPPING" | "COMPLETION";
type EmailStatusFilter = "" | "SENT" | "SKIPPED" | "FAILED";

type PageProps = {
  searchParams: Promise<
    Record<string, string | string[] | undefined>
  >;
};

export default async function AdminEmailCenterPage({
  searchParams,
}: PageProps) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login?callbackUrl=/admin/email-center");
  }

  const admin = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (admin?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const searchText = getParam(params.q).slice(0, 120);
  const typeFilter = parseTypeFilter(getParam(params.type));
  const statusFilter = parseStatusFilter(getParam(params.status));
  const dateFrom = normalizeDate(getParam(params.dateFrom));
  const dateTo = normalizeDate(getParam(params.dateTo));

  const requestedPage = Number.parseInt(getParam(params.page), 10);
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;

  const invalidDateRange = Boolean(
    dateFrom && dateTo && dateFrom > dateTo,
  );

  const scopeWhere = buildEmailAuditWhere({
    searchText,
    typeFilter,
    statusFilter: "",
    dateFrom,
    dateTo,
    invalidDateRange,
  });

  const filteredWhere = buildEmailAuditWhere({
    searchText,
    typeFilter,
    statusFilter,
    dateFrom,
    dateTo,
    invalidDateRange,
  });

  const issueActions = getFilteredActions(typeFilter, "").filter(
    (action) =>
      action.endsWith("_FAILED") ||
      action.endsWith("_SKIPPED"),
  );

  const sentActions = getFilteredActions(typeFilter, "SENT");

  const [filteredCount, issueCount, sentCount, logs] =
    await Promise.all([
      prisma.bookOrderAuditLog.count({
        where: filteredWhere,
      }),

      prisma.bookOrderAuditLog.count({
        where: {
          ...scopeWhere,
          action: { in: issueActions },
        },
      }),

      prisma.bookOrderAuditLog.count({
        where: {
          ...scopeWhere,
          action: { in: sentActions },
        },
      }),

      prisma.bookOrderAuditLog.findMany({
        where: filteredWhere,
        orderBy: [
          { createdAt: "desc" },
          { id: "desc" },
        ],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          action: true,
          summary: true,
          afterData: true,
          createdAt: true,
          order: {
            select: {
              id: true,
              orderId: true,
              productName: true,
              productionStage: true,
              book: {
                select: { title: true },
              },
              author: {
                select: {
                  name: true,
                  email: true,
                },
              },
              productionRequest: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
    ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCount / PAGE_SIZE),
  );

  if (filteredCount > 0 && page > totalPages) {
    redirect(
      buildEmailCenterUrl({
        q: searchText,
        type: typeFilter,
        status: statusFilter,
        dateFrom,
        dateTo,
        page: totalPages,
      }),
    );
  }

  const today = getSeoulDateString();
  const quickDates = [
    { label: "오늘", dateFrom: today, dateTo: today },
    {
      label: "최근 7일",
      dateFrom: shiftSeoulDate(today, -6),
      dateTo: today,
    },
    {
      label: "최근 30일",
      dateFrom: shiftSeoulDate(today, -29),
      dateTo: today,
    },
    {
      label: "이번 달",
      dateFrom: `${today.slice(0, 7)}-01`,
      dateTo: today,
    },
  ];

  const csvParams = new URLSearchParams();
  addParam(csvParams, "q", searchText);
  addParam(csvParams, "type", typeFilter);
  addParam(csvParams, "status", statusFilter);
  addParam(csvParams, "dateFrom", dateFrom);
  addParam(csvParams, "dateTo", dateTo);

  const csvUrl =
    `/api/admin/email-center/export?${csvParams.toString()}`;

  return (
    <main className="admin-email-center">
      <div className="admin-email-center-shell">
        <header className="admin-email-center-hero">
          <div>
            <p>ADMIN · EMAIL CENTER</p>
            <h1>이메일 통합 관리</h1>
            <span>
              모든 주문의 고객 이메일 기록을 한 화면에서
              검색하고 재발송합니다.
            </span>
          </div>

          <div className="admin-email-center-hero-actions">
            <Link href="/admin/orders">주문 관리</Link>
            <a href={csvUrl} download>
              현재 조건 CSV
            </a>
          </div>
        </header>

        <section className="admin-email-center-stats">
          <article>
            <span>조건 일치</span>
            <strong>{filteredCount.toLocaleString()}건</strong>
          </article>

          <article data-tone="danger">
            <span>실패·건너뜀</span>
            <strong>{issueCount.toLocaleString()}건</strong>
          </article>

          <article data-tone="success">
            <span>발송 성공</span>
            <strong>{sentCount.toLocaleString()}건</strong>
          </article>
        </section>

        <section className="admin-email-center-filter">
          <div className="admin-email-center-quick">
            <span>빠른 기간</span>
            <div>
              {quickDates.map((item) => {
                const active =
                  dateFrom === item.dateFrom &&
                  dateTo === item.dateTo;

                return (
                  <Link
                    key={item.label}
                    data-active={active}
                    href={buildEmailCenterUrl({
                      q: searchText,
                      type: typeFilter,
                      status: statusFilter,
                      dateFrom: item.dateFrom,
                      dateTo: item.dateTo,
                      page: 1,
                    })}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <form method="get" action="/admin/email-center">
            <label className="admin-email-center-search">
              <span>통합 검색</span>
              <input
                name="q"
                type="search"
                defaultValue={searchText}
                placeholder="이메일·고객명·주문번호·책 제목"
                maxLength={120}
              />
            </label>

            <label>
              <span>알림 종류</span>
              <select name="type" defaultValue={typeFilter}>
                <option value="">전체 알림</option>
                <option value="SHIPPING">배송 시작 안내</option>
                <option value="COMPLETION">제작 완료 안내</option>
              </select>
            </label>

            <label>
              <span>발송 상태</span>
              <select name="status" defaultValue={statusFilter}>
                <option value="">전체 상태</option>
                <option value="SENT">발송 성공</option>
                <option value="SKIPPED">발송 건너뜀</option>
                <option value="FAILED">발송 실패</option>
              </select>
            </label>

            <label>
              <span>시작일</span>
              <input
                name="dateFrom"
                type="date"
                defaultValue={dateFrom}
                max={dateTo || undefined}
              />
            </label>

            <label>
              <span>종료일</span>
              <input
                name="dateTo"
                type="date"
                defaultValue={dateTo}
                min={dateFrom || undefined}
              />
            </label>

            <button type="submit">조회하기</button>
            <Link href="/admin/email-center">초기화</Link>
          </form>

          {invalidDateRange ? (
            <p className="admin-email-center-error" role="alert">
              조회 시작일은 종료일보다 늦을 수 없습니다.
            </p>
          ) : null}
        </section>

        <section className="admin-email-center-list-section">
          <div className="admin-email-center-list-heading">
            <div>
              <h2>이메일 처리 목록</h2>
              <span>
                실패·건너뜀 기록은 주소를 확인한 뒤
                바로 재발송할 수 있습니다.
              </span>
            </div>
            <strong>{filteredCount.toLocaleString()}건</strong>
          </div>

          {logs.length > 0 ? (
            <div className="admin-email-center-list">
              {logs.map((log) => {
                const status = getEmailStatus(log.action);
                const recipientEmail = readAuditString(
                  log.afterData,
                  "recipientEmail",
                );
                const defaultRecipientEmail =
                  readAuditString(
                    log.afterData,
                    "defaultRecipientEmail",
                  ) ||
                  log.order.productionRequest?.email ||
                  log.order.author.email;

                const requestedRecipientEmail = readAuditString(
                  log.afterData,
                  "requestedRecipientEmail",
                );
                const emailOverridden = readAuditBoolean(
                  log.afterData,
                  "emailOverridden",
                );
                const overrideReason = readAuditString(
                  log.afterData,
                  "recipientOverrideReason",
                );
                const reason = readAuditString(
                  log.afterData,
                  "reason",
                );
                const customerName =
                  log.order.productionRequest?.name ||
                  log.order.author.name ||
                  "고객명 미등록";

                return (
                  <article
                    key={log.id}
                    data-status={status}
                  >
                    <div className="admin-email-center-card-top">
                      <div>
                        <span className="admin-email-center-type">
                          {getEmailTypeLabel(log.action)}
                        </span>
                        <span
                          className="admin-email-center-status"
                          data-status={status}
                        >
                          {getEmailStatusLabel(status)}
                        </span>
                        {emailOverridden ? (
                          <span className="admin-email-center-override">
                            변경 주소 발송
                          </span>
                        ) : null}
                      </div>
                      <time>{formatDateTime(log.createdAt)}</time>
                    </div>

                    <div className="admin-email-center-card-main">
                      <div>
                        <h3>{log.order.book.title}</h3>
                        <p>{log.summary}</p>
                      </div>

                      <Link href={`/admin/orders/${log.order.id}`}>
                        주문 상세 <span aria-hidden="true">→</span>
                      </Link>
                    </div>

                    <dl>
                      <div>
                        <dt>주문번호</dt>
                        <dd>{log.order.orderId}</dd>
                      </div>
                      <div>
                        <dt>고객명</dt>
                        <dd>{customerName}</dd>
                      </div>
                      <div>
                        <dt>기본 이메일</dt>
                        <dd>{defaultRecipientEmail || "미등록"}</dd>
                      </div>
                      <div>
                        <dt>실제 발송 이메일</dt>
                        <dd>
                          {requestedRecipientEmail ||
                            recipientEmail ||
                            "수신 이메일 없음"}
                        </dd>
                      </div>
                      {reason ? (
                        <div>
                          <dt>처리 사유</dt>
                          <dd>{getReasonLabel(reason)}</dd>
                        </div>
                      ) : null}
                      {emailOverridden ? (
                        <div>
                          <dt>변경 사유</dt>
                          <dd>
                            {overrideReason || "변경 사유 기록 없음"}
                          </dd>
                        </div>
                      ) : null}
                    </dl>

                    {status !== "SENT" ? (
                      <AdminOrderEmailRetryButton
                        orderRecordId={log.order.id}
                        notificationType={
                          log.action.includes("SHIPPING")
                            ? "SHIPPING"
                            : "COMPLETION"
                        }
                        recipientEmail={
                          recipientEmail || defaultRecipientEmail
                        }
                        defaultRecipientEmail={defaultRecipientEmail}
                      />
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="admin-email-center-empty">
              선택한 조건에 맞는 이메일 기록이 없습니다.
            </div>
          )}

          {totalPages > 1 ? (
            <nav
              className="admin-email-center-pagination"
              aria-label="이메일 기록 페이지"
            >
              {page > 1 ? (
                <Link
                  href={buildEmailCenterUrl({
                    q: searchText,
                    type: typeFilter,
                    status: statusFilter,
                    dateFrom,
                    dateTo,
                    page: page - 1,
                  })}
                >
                  이전
                </Link>
              ) : (
                <span aria-disabled="true">이전</span>
              )}

              <strong>
                {page.toLocaleString()} / {totalPages.toLocaleString()}
              </strong>

              {page < totalPages ? (
                <Link
                  href={buildEmailCenterUrl({
                    q: searchText,
                    type: typeFilter,
                    status: statusFilter,
                    dateFrom,
                    dateTo,
                    page: page + 1,
                  })}
                >
                  다음
                </Link>
              ) : (
                <span aria-disabled="true">다음</span>
              )}
            </nav>
          ) : null}
        </section>
      </div>

      <style>{adminEmailCenterStyles}</style>
    </main>
  );
}

function buildEmailAuditWhere({
  searchText,
  typeFilter,
  statusFilter,
  dateFrom,
  dateTo,
  invalidDateRange,
}: {
  searchText: string;
  typeFilter: EmailTypeFilter;
  statusFilter: EmailStatusFilter;
  dateFrom: string;
  dateTo: string;
  invalidDateRange: boolean;
}): Prisma.BookOrderAuditLogWhereInput {
  if (invalidDateRange) {
    return { id: "__invalid_date_range__" };
  }

  const where: Prisma.BookOrderAuditLogWhereInput = {
    action: {
      in: getFilteredActions(typeFilter, statusFilter),
    },
  };

  const createdAt = buildCreatedAtRange(dateFrom, dateTo);
  if (createdAt) {
    where.createdAt = createdAt;
  }

  if (searchText) {
    where.OR = [
      {
        summary: {
          contains: searchText,
          mode: "insensitive",
        },
      },
      {
        order: {
          is: {
            OR: [
              {
                orderId: {
                  contains: searchText,
                  mode: "insensitive",
                },
              },
              {
                productName: {
                  contains: searchText,
                  mode: "insensitive",
                },
              },
              {
                book: {
                  is: {
                    title: {
                      contains: searchText,
                      mode: "insensitive",
                    },
                  },
                },
              },
              {
                author: {
                  is: {
                    name: {
                      contains: searchText,
                      mode: "insensitive",
                    },
                  },
                },
              },
              {
                author: {
                  is: {
                    email: {
                      contains: searchText,
                      mode: "insensitive",
                    },
                  },
                },
              },
              {
                productionRequest: {
                  is: {
                    name: {
                      contains: searchText,
                      mode: "insensitive",
                    },
                  },
                },
              },
              {
                productionRequest: {
                  is: {
                    email: {
                      contains: searchText,
                      mode: "insensitive",
                    },
                  },
                },
              },
            ],
          },
        },
      },
    ];
  }

  return where;
}

function getFilteredActions(
  typeFilter: EmailTypeFilter,
  statusFilter: EmailStatusFilter,
) {
  return EMAIL_AUDIT_ACTIONS.filter((action) => {
    const matchesType =
      !typeFilter || action.includes(`_${typeFilter}_`);
    const matchesStatus =
      !statusFilter || action.endsWith(`_${statusFilter}`);
    return matchesType && matchesStatus;
  });
}

function buildCreatedAtRange(
  dateFrom: string,
  dateTo: string,
) {
  if (!dateFrom && !dateTo) {
    return null;
  }

  const range: { gte?: Date; lt?: Date } = {};

  if (dateFrom) {
    range.gte = new Date(`${dateFrom}T00:00:00+09:00`);
  }

  if (dateTo) {
    const endExclusive =
      new Date(`${dateTo}T00:00:00+09:00`);
    endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
    range.lt = endExclusive;
  }

  return range;
}

function buildEmailCenterUrl({
  q,
  type,
  status,
  dateFrom,
  dateTo,
  page,
}: {
  q: string;
  type: EmailTypeFilter;
  status: EmailStatusFilter;
  dateFrom: string;
  dateTo: string;
  page: number;
}) {
  const params = new URLSearchParams();
  addParam(params, "q", q);
  addParam(params, "type", type);
  addParam(params, "status", status);
  addParam(params, "dateFrom", dateFrom);
  addParam(params, "dateTo", dateTo);

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query
    ? `/admin/email-center?${query}`
    : "/admin/email-center";
}

function addParam(
  params: URLSearchParams,
  key: string,
  value: string,
) {
  if (value) {
    params.set(key, value);
  }
}

function getParam(
  value: string | string[] | undefined,
) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function parseTypeFilter(value: string): EmailTypeFilter {
  return value === "SHIPPING" || value === "COMPLETION"
    ? value
    : "";
}

function parseStatusFilter(
  value: string,
): EmailStatusFilter {
  return value === "SENT" ||
    value === "SKIPPED" ||
    value === "FAILED"
    ? value
    : "";
}

function normalizeDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return "";
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? value
    : "";
}

function getEmailTypeLabel(action: string) {
  return action.includes("SHIPPING")
    ? "배송 시작 안내"
    : "제작 완료 안내";
}

function getEmailStatus(
  action: string,
): Exclude<EmailStatusFilter, ""> {
  if (action.endsWith("_SENT")) {
    return "SENT";
  }

  if (action.endsWith("_SKIPPED")) {
    return "SKIPPED";
  }

  return "FAILED";
}

function getEmailStatusLabel(status: string) {
  const labels: Record<string, string> = {
    SENT: "발송 성공",
    SKIPPED: "발송 건너뜀",
    FAILED: "발송 실패",
  };

  return labels[status] || "결과 확인 필요";
}

function getReasonLabel(reason: string) {
  const labels: Record<string, string> = {
    CUSTOMER_EMAIL_MISSING:
      "고객 이메일이 등록되지 않았습니다.",
    RESEND_API_KEY_MISSING:
      "이메일 발송 환경변수가 없습니다.",
    STAGE_EMAIL_TEMPLATE_MISSING:
      "해당 단계의 이메일 양식이 없습니다.",
    RESEND_SEND_ERROR:
      "이메일 서비스가 발송 오류를 반환했습니다.",
    UNKNOWN_EMAIL_SEND_ERROR:
      "이메일 발송 중 알 수 없는 오류가 발생했습니다.",
    UNKNOWN_EMAIL_PROCESSING_ERROR:
      "이메일 처리 중 알 수 없는 오류가 발생했습니다.",
  };

  return labels[reason] || reason;
}

function readAuditString(value: unknown, key: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const result =
    (value as Record<string, unknown>)[key];

  return typeof result === "string" ? result : null;
}

function readAuditBoolean(value: unknown, key: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return (value as Record<string, unknown>)[key] === true;
}

function getSeoulDateString(value: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);

  const year =
    parts.find((part) => part.type === "year")?.value || "";
  const month =
    parts.find((part) => part.type === "month")?.value || "";
  const day =
    parts.find((part) => part.type === "day")?.value || "";

  return `${year}-${month}-${day}`;
}

function shiftSeoulDate(value: string, days: number) {
  const date = new Date(`${value}T12:00:00+09:00`);
  date.setUTCDate(date.getUTCDate() + days);
  return getSeoulDateString(date);
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

const adminEmailCenterStyles = `
  .admin-email-center,
  .admin-email-center * { box-sizing: border-box; }

  .admin-email-center {
    min-height: 100vh;
    padding: 28px 20px 60px;
    color: #4c382f;
    background: #fbf7f4;
  }

  .admin-email-center a {
    color: inherit;
    text-decoration: none;
  }

  .admin-email-center-shell {
    width: min(1500px, 100%);
    margin: 0 auto;
  }

  .admin-email-center-hero {
    padding: 25px;
    display: flex;
    justify-content: space-between;
    gap: 20px;
    border: 1px solid #eaded8;
    border-radius: 22px;
    background: #fff;
  }

  .admin-email-center-hero p {
    margin: 0 0 7px;
    color: #df6550;
    font-size: 8px;
    font-weight: 900;
    letter-spacing: .12em;
  }

  .admin-email-center-hero h1 {
    margin: 0;
    font-size: 27px;
  }

  .admin-email-center-hero span {
    display: block;
    margin-top: 9px;
    color: #927a70;
    font-size: 10px;
    line-height: 1.7;
  }

  .admin-email-center-hero-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .admin-email-center-hero-actions a,
  .admin-email-center-filter button,
  .admin-email-center-filter form > a {
    min-height: 40px;
    padding: 0 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #d3a693;
    border-radius: 10px;
    background: #fff;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-email-center-hero-actions a:hover,
  .admin-email-center-filter button:hover,
  .admin-email-center-filter form > a:hover {
    border-color: #df6550;
    color: #fff;
    background: #df6550;
  }

  .admin-email-center-stats {
    margin-top: 14px;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .admin-email-center-stats article {
    padding: 17px;
    border: 1px solid #eaded8;
    border-radius: 15px;
    background: #fff;
  }

  .admin-email-center-stats span {
    display: block;
    color: #927a70;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-email-center-stats strong {
    display: block;
    margin-top: 8px;
    font-size: 20px;
  }

  .admin-email-center-stats article[data-tone="danger"] strong {
    color: #b24e43;
  }

  .admin-email-center-stats article[data-tone="success"] strong {
    color: #317149;
  }

  .admin-email-center-filter,
  .admin-email-center-list-section {
    margin-top: 14px;
    padding: 20px;
    border: 1px solid #eaded8;
    border-radius: 18px;
    background: #fff;
  }

  .admin-email-center-quick {
    margin-bottom: 14px;
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  .admin-email-center-quick > span {
    color: #765449;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-email-center-quick > div {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .admin-email-center-quick a {
    min-height: 34px;
    padding: 0 12px;
    display: inline-flex;
    align-items: center;
    border: 1px solid #ddc6bc;
    border-radius: 999px;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-email-center-quick a:hover,
  .admin-email-center-quick a[data-active="true"] {
    border-color: #df6550;
    color: #fff;
    background: #df6550;
  }

  .admin-email-center-filter form {
    display: grid;
    grid-template-columns:
      minmax(220px, 1.5fr)
      minmax(140px, .8fr)
      minmax(140px, .8fr)
      minmax(140px, .8fr)
      minmax(140px, .8fr)
      auto
      auto;
    gap: 9px;
    align-items: end;
  }

  .admin-email-center-filter label span {
    display: block;
    margin-bottom: 6px;
    color: #765449;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-email-center-filter input,
  .admin-email-center-filter select {
    width: 100%;
    min-height: 40px;
    padding: 0 11px;
    border: 1px solid #ddc6bc;
    border-radius: 10px;
    color: #4c382f;
    background: #fff;
    font: inherit;
    font-size: 9px;
    outline: none;
  }

  .admin-email-center-filter input:focus,
  .admin-email-center-filter select:focus {
    border-color: #df6550;
    box-shadow: 0 0 0 3px rgba(223,101,80,.1);
  }

  .admin-email-center-error {
    margin: 12px 0 0;
    padding: 11px;
    border: 1px solid #efc1bb;
    border-radius: 10px;
    color: #984b42;
    background: #fff0ed;
    font-size: 8px;
    text-align: center;
  }

  .admin-email-center-list-heading,
  .admin-email-center-card-top,
  .admin-email-center-card-main {
    display: flex;
    justify-content: space-between;
    gap: 14px;
  }

  .admin-email-center-list-heading h2 {
    margin: 0;
    font-size: 19px;
  }

  .admin-email-center-list-heading span {
    display: block;
    margin-top: 7px;
    color: #927a70;
    font-size: 9px;
    line-height: 1.7;
  }

  .admin-email-center-list-heading > strong {
    padding: 8px 11px;
    border-radius: 999px;
    color: #754c3e;
    background: #f5ece7;
    font-size: 8px;
    white-space: nowrap;
  }

  .admin-email-center-list {
    margin-top: 16px;
    display: grid;
    gap: 12px;
  }

  .admin-email-center-list article {
    padding: 16px;
    border: 1px solid #eaded8;
    border-radius: 15px;
    background: #fffdfb;
  }

  .admin-email-center-list article[data-status="FAILED"] {
    border-color: #efc1bb;
  }

  .admin-email-center-list article[data-status="SKIPPED"] {
    border-color: #ead9b4;
  }

  .admin-email-center-card-top > div {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .admin-email-center-type,
  .admin-email-center-status,
  .admin-email-center-override {
    min-height: 25px;
    padding: 0 9px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    font-size: 7px;
    font-weight: 900;
  }

  .admin-email-center-type {
    color: #725349;
    background: #f5ece7;
  }

  .admin-email-center-status[data-status="SENT"] {
    color: #316b43;
    background: #e7f5ea;
  }

  .admin-email-center-status[data-status="SKIPPED"] {
    color: #806329;
    background: #fff3cf;
  }

  .admin-email-center-status[data-status="FAILED"] {
    color: #984b42;
    background: #ffe8e4;
  }

  .admin-email-center-override {
    color: #76551d;
    border: 1px solid #d8b77a;
    background: #fff7df;
  }

  .admin-email-center-card-top time {
    color: #9c8780;
    font-size: 7px;
    white-space: nowrap;
  }

  .admin-email-center-card-main {
    margin-top: 12px;
  }

  .admin-email-center-card-main h3 {
    margin: 0;
    font-size: 13px;
  }

  .admin-email-center-card-main p {
    margin: 6px 0 0;
    color: #765f56;
    font-size: 9px;
    line-height: 1.6;
  }

  .admin-email-center-card-main > a {
    min-height: 35px;
    padding: 0 11px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: 1px solid #d3a693;
    border-radius: 9px;
    background: #fff;
    font-size: 8px;
    font-weight: 900;
    white-space: nowrap;
  }

  .admin-email-center-list dl {
    margin: 13px 0 0;
    padding: 12px;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px 15px;
    border-radius: 11px;
    background: #f8f1ed;
  }

  .admin-email-center-list dl > div {
    display: grid;
    grid-template-columns: 105px 1fr;
    gap: 8px;
  }

  .admin-email-center-list dt,
  .admin-email-center-list dd {
    margin: 0;
    font-size: 8px;
    line-height: 1.6;
  }

  .admin-email-center-list dt {
    color: #927a70;
    font-weight: 900;
  }

  .admin-email-center-list dd {
    color: #5e4338;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
  }

  .admin-email-center-empty {
    margin-top: 16px;
    padding: 24px;
    border: 1px solid #ead9b4;
    border-radius: 12px;
    color: #806329;
    background: #fff8e6;
    font-size: 9px;
    text-align: center;
  }

  .admin-email-center-pagination {
    margin-top: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .admin-email-center-pagination a,
  .admin-email-center-pagination span {
    min-width: 70px;
    min-height: 37px;
    padding: 0 11px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #d3a693;
    border-radius: 9px;
    background: #fff;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-email-center-pagination span[aria-disabled="true"] {
    opacity: .4;
  }

  .admin-email-center-pagination strong {
    font-size: 8px;
  }

  @media (max-width: 1200px) {
    .admin-email-center-filter form {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .admin-email-center-search {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: 720px) {
    .admin-email-center {
      padding: 18px 12px 45px;
    }

    .admin-email-center-hero,
    .admin-email-center-list-heading,
    .admin-email-center-card-top,
    .admin-email-center-card-main,
    .admin-email-center-quick {
      flex-direction: column;
    }

    .admin-email-center-stats,
    .admin-email-center-filter form,
    .admin-email-center-list dl {
      grid-template-columns: 1fr;
    }

    .admin-email-center-hero-actions,
    .admin-email-center-quick > div {
      width: 100%;
    }

    .admin-email-center-hero-actions a,
    .admin-email-center-filter button,
    .admin-email-center-filter form > a {
      width: 100%;
    }

    .admin-email-center-quick a {
      flex: 1 1 calc(50% - 6px);
      justify-content: center;
    }

    .admin-email-center-list dl > div {
      grid-template-columns: 1fr;
      gap: 2px;
    }
  }
`;
