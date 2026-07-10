import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const ALLOWED_STATUSES = [
  'REQUESTED',
  'CONTACTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELED',
] as const;

type ProductionRequestStatus = (typeof ALLOWED_STATUSES)[number];

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, message: '로그인이 필요합니다.' },
        { status: 401 },
      );
    }

    const adminUser = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        role: true,
      },
    });

    if (adminUser?.role !== 'ADMIN') {
      return NextResponse.json(
        { ok: false, message: '관리자 권한이 필요합니다.' },
        { status: 403 },
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { ok: false, message: '상담 신청을 찾을 수 없습니다.' },
        { status: 400 },
      );
    }

    const body = (await request.json()) as {
      status?: unknown;
    };

    const status =
      typeof body.status === 'string' ? body.status.trim() : '';

    if (!isProductionRequestStatus(status)) {
      return NextResponse.json(
        { ok: false, message: '변경할 상태가 올바르지 않습니다.' },
        { status: 400 },
      );
    }

    const existingRequest = await prisma.bookProductionRequest.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        bookId: true,
      },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { ok: false, message: '상담 신청을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    const bookStatus = mapProductionRequestStatusToBookStatus(status);

    const [updatedRequest] = await prisma.$transaction([
      prisma.bookProductionRequest.update({
        where: {
          id,
        },
        data: {
          status,
        },
        select: {
          id: true,
          status: true,
          updatedAt: true,
        },
      }),

      prisma.book.update({
        where: {
          id: existingRequest.bookId,
        },
        data: {
          status: bookStatus,
        },
        select: {
          id: true,
          status: true,
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      request: updatedRequest,
      message: '상담 상태와 책 상태를 함께 변경했습니다.',
    });
  } catch (error) {
    console.error('[ADMIN_PRODUCTION_REQUEST_STATUS_UPDATE_ERROR]', error);

    return NextResponse.json(
      {
        ok: false,
        message: '상담 상태를 변경하는 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}

function isProductionRequestStatus(
  value: string,
): value is ProductionRequestStatus {
  return ALLOWED_STATUSES.includes(value as ProductionRequestStatus);
}

function mapProductionRequestStatusToBookStatus(
  status: ProductionRequestStatus,
) {
  if (status === 'IN_PROGRESS') {
    return 'IN_PRODUCTION';
  }

  if (status === 'COMPLETED') {
    return 'PUBLISHED';
  }

  return 'DRAFT';
}