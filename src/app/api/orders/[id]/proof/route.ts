import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { get } from "@vercel/blob";
import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";
export const dynamic =
  "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const session =
      await auth();

    const userId =
      session?.user?.id;

    if (!userId) {
      return new NextResponse(
        "로그인이 필요합니다.",
        {
          status: 401,
        },
      );
    }

    const { id } =
      await context.params;

    const orderRecordId =
      cleanText(id);

    if (!orderRecordId) {
      return new NextResponse(
        "주문 정보를 찾을 수 없습니다.",
        {
          status: 400,
        },
      );
    }

    const order =
      await prisma.bookOrder.findUnique({
        where: {
          id:
            orderRecordId,
        },
        select: {
          id: true,
          authorId: true,
          proofFileUrl:
            true,
          book: {
            select: {
              title: true,
            },
          },
        },
      });

    if (!order) {
      return new NextResponse(
        "주문 정보를 찾을 수 없습니다.",
        {
          status: 404,
        },
      );
    }

    const isOwner =
      order.authorId ===
      userId;

    let isAdmin =
      session.user.role ===
      "ADMIN";

    if (
      !isOwner &&
      !isAdmin
    ) {
      const viewer =
        await prisma.user.findUnique({
          where: {
            id:
              userId,
          },
          select: {
            role: true,
          },
        });

      isAdmin =
        viewer?.role ===
        "ADMIN";
    }

    if (
      !isOwner &&
      !isAdmin
    ) {
      return new NextResponse(
        "교정본을 열람할 권한이 없습니다.",
        {
          status: 403,
        },
      );
    }

    const reviewId =
      cleanText(
        request.nextUrl
          .searchParams
          .get("reviewId"),
      );

    let fileUrl =
      order.proofFileUrl;

    if (reviewId) {
      const review =
        await prisma.bookOrderProofReview.findFirst({
          where: {
            id:
              reviewId,
            orderId:
              order.id,
          },
          select: {
            proofFileUrl:
              true,
          },
        });

      if (!review) {
        return new NextResponse(
          "교정 이력을 찾을 수 없습니다.",
          {
            status: 404,
          },
        );
      }

      fileUrl =
        review.proofFileUrl;
    }

    if (!fileUrl) {
      return new NextResponse(
        "현재 확인할 교정본이 없습니다.",
        {
          status: 404,
        },
      );
    }

    const pathname =
      extractBlobPathname(
        fileUrl,
      );

    if (!pathname) {
      return new NextResponse(
        "교정본 파일 경로를 확인할 수 없습니다.",
        {
          status: 404,
        },
      );
    }

    const result =
      await get(
        pathname,
        {
          access:
            "private",
          token:
            process.env
              .BLOB_READ_WRITE_TOKEN,
        },
      );

    if (
      !result ||
      !result.stream
    ) {
      return new NextResponse(
        "교정본 파일을 찾을 수 없습니다.",
        {
          status: 404,
        },
      );
    }

    const filename =
      makeSafeFilename(
        order.book.title,
      );

    return new NextResponse(
      result.stream,
      {
        status: 200,
        headers: {
          "Content-Type":
            result.blob
              ?.contentType ||
            result.headers.get(
              "content-type",
            ) ||
            "application/pdf",
          "Content-Disposition":
            `inline; filename="proof.pdf"; filename*=UTF-8''${encodeURIComponent(
              `${filename}-교정본.pdf`,
            )}`,
          "Cache-Control":
            "private, no-store, max-age=0",
          "X-Content-Type-Options":
            "nosniff",
        },
      },
    );
  } catch (error) {
    console.error(
      "[ORDER_PROOF_FILE_ERROR]",
      error,
    );

    return new NextResponse(
      "교정본을 불러오는 중 오류가 발생했습니다.",
      {
        status: 500,
      },
    );
  }
}

function extractBlobPathname(
  value: string,
) {
  try {
    const url =
      new URL(value);

    return url.pathname.replace(
      /^\/+/,
      "",
    );
  } catch {
    return value.replace(
      /^\/+/,
      "",
    );
  }
}

function makeSafeFilename(
  value: string,
) {
  const result =
    value
      .trim()
      .replace(
        /[\\/:*?"<>|]/g,
        "-",
      )
      .slice(
        0,
        80,
      );

  return (
    result ||
    "daldongne-book"
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