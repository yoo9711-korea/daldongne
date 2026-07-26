import {
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type OrderAuditSource =
  | "ADMIN"
  | "CUSTOMER"
  | "WEBHOOK"
  | "SYSTEM";

export type OrderAuditCategory =
  | "ORDER"
  | "QUOTE"
  | "PAYMENT"
  | "PRODUCTION"
  | "DELIVERY"
  | "REFUND";

type AuditRecord =
  Record<string, unknown>;

type RecordOrderAuditInput = {
  orderId: string;
  actorId?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  source: OrderAuditSource;
  category: OrderAuditCategory;
  action: string;
  summary: string;
  before?: AuditRecord | null;
  after?: AuditRecord | null;
  isCustomerVisible?: boolean;
};

const SENSITIVE_KEYS =
  new Set([
    "paymentKey",
    "password",
    "passwordHash",
    "token",
    "tokenHash",
  ]);

export async function recordBookOrderAudit({
  orderId,
  actorId = null,
  actorName = null,
  actorEmail = null,
  source,
  category,
  action,
  summary,
  before = {},
  after = {},
  isCustomerVisible = false,
}: RecordOrderAuditInput) {
  try {
    const safeBefore =
      sanitizeRecord(before || {});

    const safeAfter =
      sanitizeRecord(after || {});

    const changedFields =
      getChangedFields(
        safeBefore,
        safeAfter,
      );

    if (
      changedFields.length === 0 &&
      action !== "ORDER_CREATED" &&
      action !== "AUDIT_BASELINE"
    ) {
      return false;
    }

    let resolvedActorId =
      actorId || null;

    let resolvedActorName =
      actorName || null;

    let resolvedActorEmail =
      actorEmail || null;

    if (resolvedActorId) {
      const actor =
        await prisma.user.findUnique({
          where: {
            id: resolvedActorId,
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });

      if (actor) {
        resolvedActorId = actor.id;
        resolvedActorName =
          resolvedActorName ||
          actor.name ||
          null;
        resolvedActorEmail =
          resolvedActorEmail ||
          actor.email ||
          null;
      } else {
        resolvedActorId = null;
      }
    }

    await prisma.bookOrderAuditLog.create({
      data: {
        orderId,
        actorId:
          resolvedActorId,
        actorName:
          resolvedActorName,
        actorEmail:
          resolvedActorEmail,
        source,
        category,
        action:
          action.slice(0, 100),
        summary:
          summary.slice(0, 1000),
        beforeData:
          safeBefore,
        afterData:
          safeAfter,
        changedFields:
          changedFields as Prisma.InputJsonArray,
        isCustomerVisible,
      },
    });

    return true;
  } catch (error) {
    console.error(
      "[BOOK_ORDER_AUDIT_ERROR]",
      {
        orderId,
        source,
        category,
        action,
        error,
      },
    );

    return false;
  }
}

function sanitizeRecord(
  value: AuditRecord,
): Prisma.InputJsonObject {
   const result: Record<
    string,
    Prisma.InputJsonValue | null
  > = {};

  for (
    const [key, rawValue]
    of Object.entries(value)
  ) {
    if (
      rawValue === undefined
    ) {
      continue;
    }

    if (
      SENSITIVE_KEYS.has(key)
    ) {
      result[key] =
        maskSensitiveValue(
          rawValue,
        );
      continue;
    }

    result[key] =
      sanitizeValue(rawValue);
  }

  return result;
}

function sanitizeValue(
  value: unknown,
): Prisma.InputJsonValue | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (
    typeof value === "number"
  ) {
    return Number.isFinite(value)
      ? value
      : String(value);
  }

  if (
    typeof value === "bigint"
  ) {
    return value.toString();
  }

  if (
    value instanceof Date
  ) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(
      (item) =>
        sanitizeValue(item),
    );
  }

  if (
    typeof value === "object"
  ) {
    return sanitizeRecord(
      value as AuditRecord,
    );
  }

  return String(value);
}

function getChangedFields(
  before:
    Prisma.InputJsonObject,
  after:
    Prisma.InputJsonObject,
) {
  const keys =
    new Set([
      ...Object.keys(before),
      ...Object.keys(after),
    ]);

  return Array.from(keys)
    .filter((key) => {
      return (
        JSON.stringify(
          before[key],
        ) !==
        JSON.stringify(
          after[key],
        )
      );
    })
    .sort();
}

function maskSensitiveValue(
  value: unknown,
) {
  const text =
    typeof value === "string"
      ? value
      : String(value || "");

  if (!text) {
    return "";
  }

  if (text.length <= 10) {
    return "••••••";
  }

  return `${text.slice(
    0,
    5,
  )}••••••${text.slice(-5)}`;
}