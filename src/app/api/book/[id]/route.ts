import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  NextRequest,
  NextResponse,
} from 'next/server';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } =
      await context.params;

    const session = await auth();
    const userId =
      session?.user?.id;

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

    if (!id?.trim()) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '삭제할 책을 확인할 수 없습니다.',
        },
        {
          status: 400,
        },
      );
    }

    const book =
      await prisma.book.findFirst({
        where: {
          id,
          authorId: userId,
        },
        select: {
          id: true,
          title: true,
        },
      });

    if (!book) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '삭제할 책을 찾을 수 없습니다.',
        },
        {
          status: 404,
        },
      );
    }

    const result =
      await prisma.$transaction(
        async (transaction) => {
          const productionRequests =
            await transaction.bookProductionRequest.deleteMany(
              {
                where: {
                  bookId: book.id,
                  authorId: userId,
                },
              },
            );

          const memoryLinks =
            await transaction.bookMemory.deleteMany(
              {
                where: {
                  bookId: book.id,
                },
              },
            );

          const deletedBook =
            await transaction.book.deleteMany(
              {
                where: {
                  id: book.id,
                  authorId: userId,
                },
              },
            );

          return {
            deletedBookCount:
              deletedBook.count,
            deletedMemoryLinkCount:
              memoryLinks.count,
            deletedProductionRequestCount:
              productionRequests.count,
          };
        },
      );

    if (
      result.deletedBookCount === 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '책을 삭제하지 못했습니다.',
        },
        {
          status: 409,
        },
      );
    }

    return NextResponse.json({
      ok: true,
      deletedCount:
        result.deletedBookCount,
      deletedMemoryLinkCount:
        result.deletedMemoryLinkCount,
      deletedProductionRequestCount:
        result.deletedProductionRequestCount,
      message: `"${book.title}" 책이 삭제되었습니다.`,
    });
  } catch (error) {
    console.error(
      '[BOOK_DELETE_ERROR]',
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          '책을 삭제하는 중 오류가 발생했습니다.',
      },
      {
        status: 500,
      },
    );
  }
}