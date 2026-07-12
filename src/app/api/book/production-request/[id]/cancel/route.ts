import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const ACTIVE_REQUEST_STATUSES = [
  'REQUESTED',
  'CONTACTED',
  'IN_PROGRESS',
] as const;

export async function PATCH(
  _request: Request,
  context: RouteContext,
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '로그인이 필요합니다.',
        },
        {
          status: 401,
        },
      );
    }

    const { id } =
      await context.params;

    const requestId =
      id.trim();

    if (!requestId) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '취소할 상담 신청을 찾을 수 없습니다.',
        },
        {
          status: 400,
        },
      );
    }

    const productionRequest =
      await prisma.bookProductionRequest.findFirst(
        {
          where: {
            id: requestId,
            authorId: userId,
          },
          select: {
            id: true,
            bookId: true,
            status: true,
          },
        },
      );

    if (!productionRequest) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '취소할 상담 신청을 찾을 수 없습니다.',
        },
        {
          status: 404,
        },
      );
    }

    if (
      productionRequest.status ===
      'COMPLETED'
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '이미 상담이 완료된 신청은 직접 취소할 수 없습니다. 관리자에게 문의해 주세요.',
        },
        {
          status: 400,
        },
      );
    }

    if (
      productionRequest.status ===
      'CANCELED'
    ) {
      return NextResponse.json({
        ok: true,
        request: productionRequest,
        message:
          '이미 취소된 상담 신청입니다.',
      });
    }

    const result =
      await prisma.$transaction(
        async (transaction) => {
          const canceledRequest =
            await transaction.bookProductionRequest.update(
              {
                where: {
                  id:
                    productionRequest.id,
                },
                data: {
                  status:
                    'CANCELED',
                },
                select: {
                  id: true,
                  bookId: true,
                  status: true,
                  updatedAt: true,
                },
              },
            );

          const otherActiveRequestCount =
            await transaction.bookProductionRequest.count(
              {
                where: {
                  bookId:
                    productionRequest.bookId,
                  authorId: userId,
                  id: {
                    not:
                      productionRequest.id,
                  },
                  status: {
                    in: [
                      ...ACTIVE_REQUEST_STATUSES,
                    ],
                  },
                },
              },
            );

          const book =
            await transaction.book.findFirst(
              {
                where: {
                  id:
                    productionRequest.bookId,
                  authorId: userId,
                },
                select: {
                  id: true,
                  status: true,
                },
              },
            );

          let nextBookStatus:
            | 'DRAFT'
            | 'IN_PRODUCTION'
            | 'PUBLISHED'
            | null = null;

          if (book) {
            if (
              book.status ===
              'PUBLISHED'
            ) {
              nextBookStatus =
                'PUBLISHED';
            } else if (
              otherActiveRequestCount > 0
            ) {
              nextBookStatus =
                'IN_PRODUCTION';
            } else {
              nextBookStatus =
                'DRAFT';
            }

            await transaction.book.updateMany(
              {
                where: {
                  id: book.id,
                  authorId: userId,
                },
                data: {
                  status:
                    nextBookStatus,
                },
              },
            );
          }

          return {
            canceledRequest,
            otherActiveRequestCount,
            nextBookStatus,
          };
        },
      );

    return NextResponse.json({
      ok: true,
      request:
        result.canceledRequest,
      bookStatus:
        result.nextBookStatus,
      otherActiveRequestCount:
        result.otherActiveRequestCount,
      message:
        getCancelMessage(
          result.nextBookStatus,
          result.otherActiveRequestCount,
        ),
    });
  } catch (error) {
    console.error(
      '[BOOK_PRODUCTION_REQUEST_CANCEL_ERROR]',
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          '제작 상담 신청을 취소하는 중 오류가 발생했습니다.',
      },
      {
        status: 500,
      },
    );
  }
}

function getCancelMessage(
  bookStatus:
    | 'DRAFT'
    | 'IN_PRODUCTION'
    | 'PUBLISHED'
    | null,
  otherActiveRequestCount: number,
) {
  if (bookStatus === null) {
    return '제작 상담 신청을 취소했습니다. 연결된 책은 현재 존재하지 않습니다.';
  }

  if (
    bookStatus === 'PUBLISHED'
  ) {
    return '제작 상담 신청을 취소했습니다. 완성된 책의 상태는 유지됩니다.';
  }

  if (
    bookStatus ===
      'IN_PRODUCTION' &&
    otherActiveRequestCount > 0
  ) {
    return '제작 상담 신청을 취소했습니다. 다른 진행 중 상담이 있어 책 상태는 제작 진행 중으로 유지됩니다.';
  }

  return '제작 상담 신청을 취소했습니다. 책 상태는 원고 초안으로 돌아갑니다.';
}