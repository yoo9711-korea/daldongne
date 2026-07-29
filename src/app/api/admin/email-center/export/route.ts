import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

class RouteError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "RouteError";
    this.status = status;
  }
}

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const url = new URL(request.url);
    const searchText = cleanText(
      url.searchParams.get("q"),
    ).slice(0, 120);

    const typeFilter = parseTypeFilter(
      cleanText(url.searchParams.get("type")),
    );

    const statusFilter = parseStatusFilter(
      cleanText(url.searchParams.get("status")),
    );

    const dateFrom = normalizeDate(
      cleanText(url.searchParams.get("dateFrom")),
    );

    const dateTo = normalizeDate(
      cleanText(url.searchParams.get("dateTo")),
    );

    if (dateFrom && dateTo && dateFrom > dateTo) {
      throw new RouteError(
        "조회 시작일은 종료일보다 늦을 수 없습니다.",
        400,
      );
    }

    const where = buildEmailAuditWhere({
      searchText,
      typeFilter,
      statusFilter,
      dateFrom,
      dateTo,
    });

    const logs = await prisma.bookOrderAuditLog.findMany({
      where,
      orderBy: [
        { createdAt: "desc" },
        { id: "desc" },
      ],
      select: {
        action: true,
        summary: true,
        afterData: true,
        createdAt: true,
        order: {
          select: {
            orderId: true,
            productName: true,
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
    });

    const header = [
      "발송 일시",
      "주문번호",
      "책 제목",
      "상품명",
      "고객명",
      "현재 기본 이메일",
      "알림 종류",
      "발송 상태",
      "실제 발송 이메일",
      "변경 발송 이메일",
      "이메일 변경 여부",
      "이메일 변경 사유",
      "처리 사유",
      "발송 메시지 ID",
      "요약",
    ];

    const rows = logs.map((log) => {
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
        log.order.author.email ||
        "";

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

      const providerMessageId = readAuditString(
        log.afterData,
        "providerMessageId",
      );

      const customerName =
        log.order.productionRequest?.name ||
        log.order.author.name ||
        "";

      return [
        formatDateTime(log.createdAt),
        log.order.orderId,
        log.order.book.title,
        log.order.productName,
        customerName,
        defaultRecipientEmail,
        getEmailTypeLabel(log.action),
        getEmailStatusLabel(log.action),
        recipientEmail || "",
        requestedRecipientEmail ||
          (emailOverridden ? recipientEmail : "") ||
          "",
        emailOverridden ? "예" : "아니오",
        overrideReason || "",
        reason ? getReasonLabel(reason) : "",
        providerMessageId || "",
        log.summary,
      ];
    });

    const csv = [header, ...rows]
      .map((row) =>
        row
          .map(escapeCsvValue)
          .join(","),
      )
      .join("\r\n");

    const date = getSeoulDateString().replace(/-/g, "");

    return new Response(`\uFEFF${csv}`, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          `attachment; filename="admin-email-center-${date}.csv"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof RouteError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error(
      "[ADMIN_EMAIL_CENTER_EXPORT_ERROR]",
      error,
    );

    return NextResponse.json(
      {
        error:
          "이메일 통합 기록을 내려받는 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}

async function requireAdmin() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new RouteError(
      "로그인이 필요합니다.",
      401,
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user || user.role !== "ADMIN") {
    throw new RouteError(
      "관리자 권한이 필요합니다.",
      403,
    );
  }
}

function buildEmailAuditWhere({
  searchText,
  typeFilter,
  statusFilter,
  dateFrom,
  dateTo,
}: {
  searchText: string;
  typeFilter: EmailTypeFilter;
  statusFilter: EmailStatusFilter;
  dateFrom: string;
  dateTo: string;
}): Prisma.BookOrderAuditLogWhereInput {
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

function parseTypeFilter(value: string): EmailTypeFilter {
  return value === "SHIPPING" ||
    value === "COMPLETION"
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

function getEmailStatusLabel(action: string) {
  if (action.endsWith("_SENT")) {
    return "발송 성공";
  }

  if (action.endsWith("_SKIPPED")) {
    return "발송 건너뜀";
  }

  return "발송 실패";
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

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(value);
}

function getSeoulDateString() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year =
    parts.find((part) => part.type === "year")?.value || "";
  const month =
    parts.find((part) => part.type === "month")?.value || "";
  const day =
    parts.find((part) => part.type === "day")?.value || "";

  return `${year}-${month}-${day}`;
}

function escapeCsvValue(value: unknown) {
  let text = String(value ?? "");

  if (/^[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
