import { auth } from "@/auth";
import { recordBookOrderAudit } from "@/lib/order-audit";
import { sendOrderProductionStageEmail } from "@/lib/order-email";
import { prisma } from "@/lib/prisma";
import {
  BookProductionStage,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type NotificationType =
  | "SHIPPING"
  | "COMPLETION";

type AdminIdentity = {
  id: string;
  name: string | null;
  email: string | null;
};

class RouteError extends Error {
  status: number;

  constructor(
    message: string,
    status: number,
  ) {
    super(message);

    this.name =
      "RouteError";

    this.status =
      status;
  }
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const admin =
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

    const body =
      await request
        .json()
        .catch(() => null);

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      throw new RouteError(
        "재발송 요청 내용을 확인할 수 없습니다.",
        400,
      );
    }

    const notificationType =
      parseNotificationType(
        (
          body as Record<
            string,
            unknown
          >
        ).notificationType,
      );

    const order =
      await prisma.bookOrder.findUnique({
        where: {
          id: orderRecordId,
        },

        select: {
          id: true,
          orderId: true,
          productionStage: true,
          proofFileUrl: true,
          shippingCarrier: true,
          trackingNumber: true,

          productionRequest: {
            select: {
              name: true,
              email: true,
            },
          },

          book: {
            select: {
              title: true,
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
      throw new RouteError(
        "재발송할 주문을 찾을 수 없습니다.",
        404,
      );
    }

    if (
      notificationType ===
      "SHIPPING"
    ) {
      const shippingStageAllowed =
        order.productionStage ===
          BookProductionStage.SHIPPED ||
        order.productionStage ===
          BookProductionStage.COMPLETED;

      if (!shippingStageAllowed) {
        throw new RouteError(
          "배송 시작 안내는 택배 발송 이후에 다시 보낼 수 있습니다.",
          409,
        );
      }

      if (
        !order.shippingCarrier?.trim() ||
        !order.trackingNumber?.trim()
      ) {
        throw new RouteError(
          "택배사와 송장번호가 없어 배송 시작 안내를 다시 보낼 수 없습니다.",
          409,
        );
      }
    }

    if (
      notificationType ===
        "COMPLETION" &&
      order.productionStage !==
        BookProductionStage.COMPLETED
    ) {
      throw new RouteError(
        "제작 완료 안내는 제작·배송 완료 처리 이후에 다시 보낼 수 있습니다.",
        409,
      );
    }

    const recipientEmail =
      order.productionRequest.email ||
      order.author.email;

    const customerName =
      order.productionRequest.name ||
      order.author.name;

    const stage =
      notificationType ===
      "SHIPPING"
        ? BookProductionStage.SHIPPED
        : BookProductionStage.COMPLETED;

    const emailResult =
      await sendOrderProductionStageEmail({
        to:
          recipientEmail,

        customerName,

        bookTitle:
          order.book.title,

        orderRecordId:
          order.id,

        orderId:
          order.orderId,

        stage:
          String(stage),

        proofFileUrl:
          order.proofFileUrl,

        shippingCarrier:
          order.shippingCarrier,

        trackingNumber:
          order.trackingNumber,
      });

    const notificationLabel =
      notificationType ===
      "SHIPPING"
        ? "배송 시작 안내"
        : "제작 완료 안내";

    const resultLabel =
      emailResult.status ===
      "SENT"
        ? "발송 성공"
        : emailResult.status ===
            "SKIPPED"
          ? "발송 건너뜀"
          : "발송 실패";

    const recipientLabel =
      emailResult.to
        ? ` · ${emailResult.to}`
        : "";

    await recordBookOrderAudit({
      orderId:
        orderRecordId,

      actorId:
        admin.id,

      actorName:
        admin.name,

      actorEmail:
        admin.email,

      source:
        "ADMIN",

      category:
        notificationType ===
        "SHIPPING"
          ? "DELIVERY"
          : "PRODUCTION",

      action:
        `CUSTOMER_${notificationType}_EMAIL_${emailResult.status}`,

      summary:
        `${notificationLabel} 이메일 재발송 ${resultLabel}${recipientLabel}`,

      before: {
        notificationStatus:
          null,
      },

      after: {
        notificationType,

        notificationStatus:
          emailResult.status,

        recipientEmail:
          emailResult.to,

        reason:
          emailResult.reason,

        providerMessageId:
          emailResult.providerMessageId,

        isRetry:
          true,
      },

      isCustomerVisible:
        false,
    });

    revalidatePath(
      `/admin/orders/${orderRecordId}`,
    );

    const responseMessage =
      emailResult.status ===
      "SENT"
        ? `${notificationLabel} 이메일을 다시 발송했습니다.`
        : emailResult.status ===
            "SKIPPED"
          ? `${notificationLabel} 이메일 재발송을 건너뛰었습니다. 발송 기록에서 사유를 확인해 주세요.`
          : `${notificationLabel} 이메일 재발송에 실패했습니다. 발송 기록에서 원인을 확인해 주세요.`;

    return NextResponse.json({
      ok:
        emailResult.status ===
        "SENT",

      status:
        emailResult.status,

      message:
        responseMessage,
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
      "[ADMIN_ORDER_EMAIL_RETRY_ERROR]",
      error,
    );

    return NextResponse.json(
      {
        error:
          "고객 안내 이메일을 다시 보내는 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}

async function requireAdmin():
  Promise<AdminIdentity> {
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
        id: true,
        name: true,
        email: true,
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

  return {
    id:
      user.id,

    name:
      user.name,

    email:
      user.email,
  };
}

function parseNotificationType(
  value: unknown,
): NotificationType {
  if (
    value === "SHIPPING" ||
    value === "COMPLETION"
  ) {
    return value;
  }

  throw new RouteError(
    "다시 발송할 알림 종류를 확인해 주세요.",
    400,
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