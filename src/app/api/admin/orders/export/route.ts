import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";

const ORDER_STATUSES = [
  "READY",
  "PAYMENT_PENDING",
  "PAID",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
  "CANCELED",
  "FAILED",
] as const;

const PRODUCTION_STAGES = [
  "PREPARING",
  "MANUSCRIPT_RECEIVED",
  "REVIEWING",
  "PROOFING",
  "PROOF_SENT",
  "PROOF_APPROVED",
  "PRINT_ORDERED",
  "PRINTING",
  "SHIPPING_PREPARATION",
  "SHIPPED",
  "COMPLETED",
  "ON_HOLD",
] as const;

export async function GET(
  request: NextRequest,
) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "로그인이 필요합니다.",
      },
      {
        status: 401,
      },
    );
  }

  const adminUser =
    await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        role: true,
      },
    });

  if (
    adminUser?.role !== "ADMIN"
  ) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "관리자만 주문 목록을 내려받을 수 있습니다.",
      },
      {
        status: 403,
      },
    );
  }

  const query =
    request.nextUrl.searchParams
      .get("q")
      ?.trim()
      .slice(0, 120) || "";

  const status =
    getAllowedValue(
      request.nextUrl.searchParams.get(
        "status",
      ),
      ORDER_STATUSES,
    );

  const stage =
    getAllowedValue(
      request.nextUrl.searchParams.get(
        "stage",
      ),
      PRODUCTION_STAGES,
    );

  const where: Prisma.BookOrderWhereInput =
    {};

  if (status) {
    where.status = status;
  }

  if (stage) {
    where.productionStage =
      stage;
  }

  if (query) {
    where.OR = [
      {
        orderId: {
          contains: query,
          mode: "insensitive",
        },
      },
      {
        productName: {
          contains: query,
          mode: "insensitive",
        },
      },
      {
        trackingNumber: {
          contains: query,
          mode: "insensitive",
        },
      },
      {
        author: {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
      },
      {
        author: {
          email: {
            contains: query,
            mode: "insensitive",
          },
        },
      },
      {
        book: {
          title: {
            contains: query,
            mode: "insensitive",
          },
        },
      },
      {
        productionRequest: {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
      },
      {
        productionRequest: {
          phone: {
            contains: query,
            mode: "insensitive",
          },
        },
      },
      {
        productionRequest: {
          email: {
            contains: query,
            mode: "insensitive",
          },
        },
      },
    ];
  }

  const orders =
    await prisma.bookOrder.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      take: 5000,
      select: {
        orderId: true,
        productName: true,
        specification: true,
        quantity: true,
        productAmount: true,
        shippingFee: true,
        totalAmount: true,
        status: true,
        paymentMethod: true,
        paidAt: true,
        canceledAt: true,
        productionStage: true,
        recipientName: true,
        recipientPhone: true,
        postalCode: true,
        shippingAddress1: true,
        shippingAddress2: true,
        shippingCarrier: true,
        trackingNumber: true,
        shippedAt: true,
        completedAt: true,
        createdAt: true,
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
        productionRequest: {
          select: {
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

  const rows: string[][] = [
    [
      "주문번호",
      "주문일",
      "고객명",
      "고객 이메일",
      "고객 연락처",
      "책 제목",
      "상품명",
      "제작 사양",
      "수량",
      "상품 금액",
      "배송비",
      "최종 금액",
      "결제 상태",
      "결제수단",
      "결제일",
      "취소·환불일",
      "제작 단계",
      "수령인",
      "수령인 연락처",
      "우편번호",
      "기본 배송지",
      "상세 배송지",
      "택배사",
      "송장번호",
      "발송일",
      "완료일",
    ],
  ];

  for (const order of orders) {
    rows.push([
      order.orderId,
      formatDateTime(
        order.createdAt,
      ),
      order.productionRequest.name ||
        order.author.name ||
        "",
      order.productionRequest.email ||
        order.author.email ||
        "",
      order.productionRequest.phone ||
        "",
      order.book.title,
      order.productName,
      order.specification || "",
      String(order.quantity),
      String(order.productAmount),
      String(order.shippingFee),
      String(order.totalAmount),
      order.status,
      order.paymentMethod || "",
      formatDateTime(order.paidAt),
      formatDateTime(
        order.canceledAt,
      ),
      order.productionStage,
      order.recipientName || "",
      order.recipientPhone || "",
      order.postalCode || "",
      order.shippingAddress1 || "",
      order.shippingAddress2 || "",
      order.shippingCarrier || "",
      order.trackingNumber || "",
      formatDateTime(order.shippedAt),
      formatDateTime(
        order.completedAt,
      ),
    ]);
  }

  const csv =
    "\uFEFF" +
    rows
      .map((row) =>
        row
          .map(escapeCsvValue)
          .join(","),
      )
      .join("\r\n");

  const date = new Date()
    .toISOString()
    .slice(0, 10)
    .replaceAll("-", "");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type":
        "text/csv; charset=utf-8",
      "Content-Disposition":
        `attachment; filename="daldongne-orders-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

function getAllowedValue<
  T extends readonly string[],
>(
  value: string | null,
  allowedValues: T,
): T[number] | "" {
  const text = value?.trim() || "";

  return allowedValues.includes(
    text as T[number],
  )
    ? (text as T[number])
    : "";
}

function escapeCsvValue(
  value: string,
) {
  let safeValue = value;

  if (
    /^[=+\-@]/.test(safeValue)
  ) {
    safeValue = `'${safeValue}`;
  }

  return `"${safeValue.replaceAll(
    '"',
    '""',
  )}"`;
}

function formatDateTime(
  value: Date | null,
) {
  if (!value) {
    return "";
  }

  return value.toISOString();
}