import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

const EMAIL_AUDIT_ACTIONS = [
  "CUSTOMER_SHIPPING_EMAIL_SENT",
  "CUSTOMER_SHIPPING_EMAIL_SKIPPED",
  "CUSTOMER_SHIPPING_EMAIL_FAILED",
  "CUSTOMER_COMPLETION_EMAIL_SENT",
  "CUSTOMER_COMPLETION_EMAIL_SKIPPED",
  "CUSTOMER_COMPLETION_EMAIL_FAILED",
] as const;

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type EmailTypeFilter =
  | "ALL"
  | "SHIPPING"
  | "COMPLETION";

type EmailStatusFilter =
  | "ALL"
  | "SENT"
  | "SKIPPED"
  | "FAILED";

class RouteError extends Error {
  status: number;

  constructor(
    message: string,
    status: number,
  ) {
    super(message);

    this.name = "RouteError";
    this.status = status;
  }
}

export async function GET(
  request: Request,
  context: RouteContext,
) {
  try {
    await requireAdmin();

    const { id } =
      await context.params;

    const orderRecordId =
      cleanText(id);

    if (!orderRecordId) {
      throw new RouteError(
        "주문 정보를 찾을 수 없습니다.",
        400,
      );
    }

    const requestUrl =
      new URL(request.url);

    const cursor =
      cleanText(
        requestUrl.searchParams.get(
          "cursor",
        ),
      ) || null;

    const typeFilter =
      parseTypeFilter(
        requestUrl.searchParams.get(
          "type",
        ),
      );

    const statusFilter =
      parseStatusFilter(
        requestUrl.searchParams.get(
          "status",
        ),
      );

    const limit =
      parseLimit(
        requestUrl.searchParams.get(
          "limit",
        ),
      );

    const orderExists =
      await prisma.bookOrder.findUnique({
        where: {
          id: orderRecordId,
        },

        select: {
          id: true,
        },
      });

    if (!orderExists) {
      throw new RouteError(
        "주문 정보를 찾을 수 없습니다.",
        404,
      );
    }

    const actions =
      getFilteredActions(
        typeFilter,
        statusFilter,
      );

    const where = {
      orderId: orderRecordId,

      action: {
        in: actions,
      },
    };

    const [
      totalCount,
      records,
    ] = await Promise.all([
      prisma.bookOrderAuditLog.count({
        where,
      }),

      prisma.bookOrderAuditLog.findMany({
        where,

        orderBy: [
          {
            createdAt: "desc",
          },
          {
            id: "desc",
          },
        ],

        take:
          limit + 1,

        ...(cursor
          ? {
              cursor: {
                id: cursor,
              },

              skip: 1,
            }
          : {}),

        select: {
          id: true,
          action: true,
          summary: true,
          afterData: true,
          createdAt: true,
        },
      }),
    ]);

    const hasMore =
      records.length > limit;

    const logs =
      hasMore
        ? records.slice(
            0,
            limit,
          )
        : records;

    const nextCursor =
      hasMore &&
      logs.length > 0
        ? logs[
            logs.length - 1
          ].id
        : null;

    return NextResponse.json({
      ok: true,

      logs: logs.map(
        (log) => ({
          id:
            log.id,

          action:
            log.action,

          summary:
            log.summary,

          afterData:
            log.afterData,

          createdAt:
            log.createdAt.toISOString(),
        }),
      ),

      totalCount,
      loadedCount:
        logs.length,

      hasMore,
      nextCursor,

      filters: {
        type:
          typeFilter,

        status:
          statusFilter,
      },
    });
  } catch (error) {
    if (
      error instanceof
      RouteError
    ) {
      return NextResponse.json(
        {
          error:
            error.message,
        },
        {
          status:
            error.status,
        },
      );
    }

    console.error(
      "[ADMIN_ORDER_EMAIL_AUDIT_GET_ERROR]",
      error,
    );

    return NextResponse.json(
      {
        error:
          "고객 알림 발송 기록을 불러오는 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}

async function requireAdmin() {
  const session =
    await auth();

  const userId =
    session?.user?.id;

  if (!userId) {
    throw new RouteError(
      "로그인이 필요합니다.",
      401,
    );
  }

  const user =
    await prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        role: true,
      },
    });

  if (
    !user ||
    user.role !== "ADMIN"
  ) {
    throw new RouteError(
      "관리자 권한이 필요합니다.",
      403,
    );
  }
}

function getFilteredActions(
  typeFilter:
    EmailTypeFilter,
  statusFilter:
    EmailStatusFilter,
) {
  return EMAIL_AUDIT_ACTIONS.filter(
    (action) => {
      const matchesType =
        typeFilter === "ALL" ||
        action.includes(
          `_${typeFilter}_`,
        );

      const matchesStatus =
        statusFilter === "ALL" ||
        action.endsWith(
          `_${statusFilter}`,
        );

      return (
        matchesType &&
        matchesStatus
      );
    },
  );
}

function parseTypeFilter(
  value: string | null,
): EmailTypeFilter {
  if (
    !value ||
    value === "ALL"
  ) {
    return "ALL";
  }

  if (
    value === "SHIPPING" ||
    value === "COMPLETION"
  ) {
    return value;
  }

  throw new RouteError(
    "이메일 알림 종류를 확인해 주세요.",
    400,
  );
}

function parseStatusFilter(
  value: string | null,
): EmailStatusFilter {
  if (
    !value ||
    value === "ALL"
  ) {
    return "ALL";
  }

  if (
    value === "SENT" ||
    value === "SKIPPED" ||
    value === "FAILED"
  ) {
    return value;
  }

  throw new RouteError(
    "이메일 발송 상태를 확인해 주세요.",
    400,
  );
}

function parseLimit(
  value: string | null,
) {
  const parsed =
    Number.parseInt(
      value || "",
      10,
    );

  if (
    !Number.isFinite(parsed) ||
    parsed < 1
  ) {
    return DEFAULT_PAGE_SIZE;
  }

  return Math.min(
    parsed,
    MAX_PAGE_SIZE,
  );
}

function cleanText(
  value: unknown,
) {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}