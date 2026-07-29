import "server-only";

import {
  BookProductionStage,
} from "@prisma/client";
import { Resend } from "resend";

import {
  recordBookOrderAudit,
} from "@/lib/order-audit";
import { prisma } from "@/lib/prisma";

type SupportedStage =
  | "PRINTING"
  | "SHIPPED"
  | "COMPLETED";

type NotifyInput = {
  orderRecordId: string;
  stage:
    | BookProductionStage
    | string;
};

const STAGE_COPY:
  Record<
    SupportedStage,
    {
      subject: string;
      heading: string;
      message: string;
    }
  > = {
    PRINTING: {
      subject:
        "스토리북 인쇄가 시작되었습니다",
      heading:
        "스토리북 인쇄를 시작했습니다",
      message:
        "교정 승인된 원고를 기준으로 실제 책 인쇄를 진행하고 있습니다.",
    },
    SHIPPED: {
      subject:
        "스토리북 배송이 시작되었습니다",
      heading:
        "스토리북을 발송했습니다",
      message:
        "완성된 책이 고객님께 출발했습니다. 주문 상세에서 택배사와 송장번호를 확인해 주세요.",
    },
    COMPLETED: {
      subject:
        "스토리북 제작이 완료되었습니다",
      heading:
        "스토리북 제작을 완료했습니다",
      message:
        "사진과 이야기를 담은 스토리북의 제작·배송 절차가 모두 완료되었습니다.",
    },
  };

export async function notifyOrderOperationalStage({
  orderRecordId,
  stage,
}: NotifyInput) {
  const normalizedStage =
    String(stage) as
      SupportedStage;

  const copy =
    STAGE_COPY[
      normalizedStage
    ];

  if (!copy) {
    return {
      sent: false,
      skipped: true,
      reason:
        "UNSUPPORTED_STAGE",
    } as const;
  }

  const order =
    await prisma.bookOrder.findUnique({
      where: {
        id: orderRecordId,
      },
      select: {
        id: true,
        orderId: true,
        productName: true,
        productionStage: true,
        shippingCarrier: true,
        trackingNumber: true,
        book: {
          select: {
            title: true,
          },
        },
        productionRequest: {
          select: {
            name: true,
            email: true,
          },
        },
        author: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

  if (!order) {
    return {
      sent: false,
      skipped: true,
      reason:
        "ORDER_NOT_FOUND",
    } as const;
  }

  const recipient =
    cleanText(
      order.productionRequest
        .email,
    ) ||
    cleanText(
      order.author.email,
    );

  const customerName =
    cleanText(
      order.productionRequest
        .name,
    ) ||
    cleanText(
      order.author.name,
    ) ||
    "고객";

  if (!recipient) {
    await recordFailure({
      orderId:
        order.id,
      stage:
        normalizedStage,
      reason:
        "고객 이메일이 없습니다.",
    });

    return {
      sent: false,
      reason:
        "CUSTOMER_EMAIL_MISSING",
    } as const;
  }

  const apiKey =
    cleanText(
      process.env
        .RESEND_API_KEY,
    );

  if (!apiKey) {
    await recordFailure({
      orderId:
        order.id,
      stage:
        normalizedStage,
      reason:
        "RESEND_API_KEY가 설정되지 않았습니다.",
    });

    return {
      sent: false,
      reason:
        "RESEND_API_KEY_MISSING",
    } as const;
  }

  const siteUrl =
    getSiteUrl();

  const orderUrl =
    `${siteUrl}/dashboard/orders/${encodeURIComponent(
      order.id,
    )}`;

  const trackingLine =
    normalizedStage ===
      "SHIPPED"
      ? `
        <p style="margin:16px 0 0;padding:14px;border-radius:12px;background:#fff5ee;color:#5b463d;">
          택배사: ${escapeHtml(
            order.shippingCarrier ||
              "확인 중",
          )}<br />
          송장번호: ${escapeHtml(
            order.trackingNumber ||
              "확인 중",
          )}
        </p>
      `
      : "";

  try {
    const resend =
      new Resend(apiKey);

    const result =
      await resend.emails.send({
        from:
          process.env
            .ORDER_EMAIL_FROM ||
          process.env
            .RESEND_FROM_EMAIL ||
          "달동네 스토리 <onboarding@resend.dev>",
        to: recipient,
        subject:
          `[달동네 스토리] ${copy.subject}`,
        html: `
          <div style="max-width:640px;margin:0 auto;padding:28px;font-family:Arial,'Noto Sans KR',sans-serif;color:#43352f;">
            <p style="margin:0;color:#df6550;font-size:12px;font-weight:800;letter-spacing:.08em;">
              DALDONGNE STORY
            </p>
            <h1 style="margin:10px 0 0;font-size:26px;line-height:1.4;">
              ${escapeHtml(
                customerName,
              )}님, ${escapeHtml(
                copy.heading,
              )}
            </h1>
            <p style="margin:18px 0 0;line-height:1.8;color:#725f56;">
              ${escapeHtml(
                copy.message,
              )}
            </p>
            <p style="margin:18px 0 0;line-height:1.8;">
              책: ${escapeHtml(
                order.book.title ||
                  order.productName,
              )}<br />
              주문번호: ${escapeHtml(
                order.orderId,
              )}
            </p>
            ${trackingLine}
            <p style="margin:24px 0 0;">
              <a href="${escapeHtml(
                orderUrl,
              )}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#6f4f42;color:#fff;text-decoration:none;font-weight:800;">
                주문 진행 확인
              </a>
            </p>
          </div>
        `,
      });

    if (result.error) {
      throw new Error(
        result.error.message ||
          "Resend 이메일 발송 오류",
      );
    }

    return {
      sent: true,
      messageId:
        result.data?.id ||
        null,
    } as const;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    await recordFailure({
      orderId:
        order.id,
      stage:
        normalizedStage,
      reason:
        message,
    });

    console.error(
      "[ORDER_OPERATION_EMAIL_ERROR]",
      {
        orderRecordId:
          order.id,
        stage:
          normalizedStage,
        error:
          message,
      },
    );

    return {
      sent: false,
      reason:
        "SEND_FAILED",
      error:
        message,
    } as const;
  }
}

async function recordFailure({
  orderId,
  stage,
  reason,
}: {
  orderId: string;
  stage: SupportedStage;
  reason: string;
}) {
  try {
    await recordBookOrderAudit({
      orderId,
      source:
        "SYSTEM",
      category:
        getAuditCategory(stage),
      action:
        "EMAIL_FAILED",
      summary:
        `${getStageLabel(
          stage,
        )} 안내 이메일 발송 실패 — 수동 연락 필요`,
      before: {},
      after: {
        stage,
        reason,
      },
      isCustomerVisible:
        false,
    });
  } catch (auditError) {
    console.error(
      "[ORDER_OPERATION_EMAIL_AUDIT_ERROR]",
      auditError,
    );
  }
}

function getAuditCategory(
  stage: SupportedStage,
) {
  if (
    stage === "PRINTING"
  ) {
    return "PRODUCTION" as const;
  }

  return "DELIVERY" as const;
}

function getStageLabel(
  stage: SupportedStage,
) {
  if (
    stage === "PRINTING"
  ) {
    return "인쇄 진행";
  }

  if (
    stage === "SHIPPED"
  ) {
    return "배송 시작";
  }

  return "제작 완료";
}

function getSiteUrl() {
  const raw =
    process.env
      .NEXT_PUBLIC_SITE_URL ||
    process.env
      .AUTH_URL ||
    process.env
      .NEXTAUTH_URL ||
    "https://www.daldongne.kr";

  return raw.replace(
    /\/+$/,
    "",
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

function escapeHtml(
  value: string,
) {
  return value
    .replaceAll(
      "&",
      "&amp;",
    )
    .replaceAll(
      "<",
      "&lt;",
    )
    .replaceAll(
      ">",
      "&gt;",
    )
    .replaceAll(
      '"',
      "&quot;",
    )
    .replaceAll(
      "'",
      "&#039;",
    );
}
