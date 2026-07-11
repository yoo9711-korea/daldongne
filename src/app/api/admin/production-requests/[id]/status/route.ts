import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const ALLOWED_STATUSES = [
  'REQUESTED',
  'CONTACTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELED',
] as const;

type ProductionRequestStatus = (typeof ALLOWED_STATUSES)[number];

type BookStatus = 'DRAFT' | 'IN_PRODUCTION' | 'PUBLISHED';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function isProductionRequestStatus(
  value: unknown,
): value is ProductionRequestStatus {
  return (
    typeof value === 'string' &&
    ALLOWED_STATUSES.includes(value as ProductionRequestStatus)
  );
}

function getBookStatusFromProductionStatus(
  status: ProductionRequestStatus,
): BookStatus {
  if (status === 'COMPLETED') {
    return 'PUBLISHED';
  }

  if (status === 'CANCELED') {
    return 'DRAFT';
  }

  return 'IN_PRODUCTION';
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        {
          ok: false,
          message: '로그인이 필요합니다.',
        },
        { status: 401 },
      );
    }

    const adminUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        role: true,
      },
    });

    if (adminUser?.role !== 'ADMIN') {
      return NextResponse.json(
        {
          ok: false,
          message: '관리자만 상담 상태를 변경할 수 있습니다.',
        },
        { status: 403 },
      );
    }

    const { id } = await context.params;
    const requestId = id.trim();

    if (!requestId) {
      return NextResponse.json(
        {
          ok: false,
          message: '상담 신청 정보를 찾을 수 없습니다.',
        },
        { status: 400 },
      );
    }

    const body = (await request.json().catch(() => null)) as {
      status?: unknown;
    } | null;

    const nextStatus = body?.status;

    if (!isProductionRequestStatus(nextStatus)) {
      return NextResponse.json(
        {
          ok: false,
          message: '변경할 수 없는 상담 상태입니다.',
        },
        { status: 400 },
      );
    }

    const existingRequest = await prisma.bookProductionRequest.findUnique({
      where: {
        id: requestId,
      },
      select: {
        id: true,
        bookId: true,
      },
    });

    if (!existingRequest) {
      return NextResponse.json(
        {
          ok: false,
          message: '상담 신청 정보를 찾을 수 없습니다.',
        },
        { status: 404 },
      );
    }

    const nextBookStatus = getBookStatusFromProductionStatus(nextStatus);

    const updatedRequest = await prisma.$transaction(async (tx) => {
      const productionRequest = await tx.bookProductionRequest.update({
        where: {
          id: requestId,
        },
        data: {
          status: nextStatus,
        },
        select: {
          id: true,
          status: true,
          bookId: true,
        },
      });

      await tx.book.updateMany({
        where: {
          id: existingRequest.bookId,
        },
        data: {
          status: nextBookStatus,
        },
      });

      return productionRequest;
    });

    return NextResponse.json({
      ok: true,
      requestId: updatedRequest.id,
      status: updatedRequest.status,
      bookId: updatedRequest.bookId,
      bookStatus: nextBookStatus,
      message: '상담 상태와 책 상태를 함께 변경했습니다.',
    });
  } catch (error) {
    console.error('ADMIN_PRODUCTION_REQUEST_STATUS_ERROR', error);

    return NextResponse.json(
      {
        ok: false,
        message: '상담 상태 변경 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}