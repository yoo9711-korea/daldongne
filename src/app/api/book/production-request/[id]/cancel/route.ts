import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(_request: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, message: '로그인이 필요합니다.' },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const requestId = id.trim();

    if (!requestId) {
      return NextResponse.json(
        { ok: false, message: '취소할 상담 신청을 찾을 수 없습니다.' },
        { status: 400 },
      );
    }

    const productionRequest = await prisma.bookProductionRequest.findFirst({
      where: {
        id: requestId,
        authorId: session.user.id,
      },
      select: {
        id: true,
        bookId: true,
        status: true,
      },
    });

    if (!productionRequest) {
      return NextResponse.json(
        { ok: false, message: '취소할 상담 신청을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    if (productionRequest.status === 'COMPLETED') {
      return NextResponse.json(
        {
          ok: false,
          message:
            '이미 상담이 완료된 신청은 직접 취소할 수 없습니다. 관리자에게 문의해 주세요.',
        },
        { status: 400 },
      );
    }

    if (productionRequest.status === 'CANCELED') {
      return NextResponse.json({
        ok: true,
        request: productionRequest,
        message: '이미 취소된 상담 신청입니다.',
      });
    }

    const updatedRequest = await prisma.$transaction(async (tx) => {
      const canceledRequest = await tx.bookProductionRequest.update({
        where: {
          id: productionRequest.id,
        },
        data: {
          status: 'CANCELED',
        },
        select: {
          id: true,
          status: true,
          updatedAt: true,
        },
      });

      await tx.book.updateMany({
        where: {
          id: productionRequest.bookId,
          authorId: session.user.id,
        },
        data: {
          status: 'DRAFT',
        },
      });

      return canceledRequest;
    });

    return NextResponse.json({
      ok: true,
      request: updatedRequest,
      message: '제작 상담 신청을 취소했습니다.',
    });
  } catch (error) {
    console.error('[BOOK_PRODUCTION_REQUEST_CANCEL_ERROR]', error);

    return NextResponse.json(
      {
        ok: false,
        message: '제작 상담 신청을 취소하는 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}