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

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;
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

    if (!id?.trim()) {
      return NextResponse.json(
        {
          ok: false,
          message: '수정할 책을 확인할 수 없습니다.',
        },
        { status: 400 },
      );
    }

    const body = (await request
      .json()
      .catch(() => null)) as {
      title?: unknown;
      subtitle?: unknown;
      summary?: unknown;
      coverText?: unknown;
      content?: unknown;
    } | null;

    if (!body) {
      return NextResponse.json(
        {
          ok: false,
          message: '수정할 원고 내용을 확인해 주세요.',
        },
        { status: 400 },
      );
    }

    const title = getBookEditText(body.title);
    const subtitle = getBookEditText(body.subtitle);
    const summary = getBookEditText(body.summary);
    const coverText = getBookEditText(body.coverText);
    const content = getBookEditText(body.content);

    if (!title) {
      return NextResponse.json(
        {
          ok: false,
          message: '책 제목을 입력해 주세요.',
        },
        { status: 400 },
      );
    }

    if (!content) {
      return NextResponse.json(
        {
          ok: false,
          message: '책 본문을 입력해 주세요.',
        },
        { status: 400 },
      );
    }

    if (
      title.length > 120 ||
      subtitle.length > 200 ||
      summary.length > 2000 ||
      coverText.length > 500 ||
      content.length > 200000
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: '입력 가능한 원고 글자 수를 초과했습니다.',
        },
        { status: 400 },
      );
    }

    const book = await prisma.book.findFirst({
  where: {
    id,
    authorId: userId,
  },
  select: {
    id: true,
    status: true,
    title: true,
    subtitle: true,
    summary: true,
    coverText: true,
    content: true,
    pageCount: true,
  },
});

    if (!book) {
      return NextResponse.json(
        {
          ok: false,
          message: '수정할 책을 찾을 수 없습니다.',
        },
        { status: 404 },
      );
    }

    if (book.status === 'PUBLISHED') {
      return NextResponse.json(
        {
          ok: false,
          message:
            '완성된 책은 직접 수정할 수 없습니다. 관리자에게 문의해 주세요.',
        },
        { status: 409 },
      );
    }

    const updatedBook =
  await prisma.$transaction(
    async (transaction) => {
      await transaction.bookRevision.create({
        data: {
          bookId: book.id,
          authorId: userId,
          title: book.title,
          subtitle: book.subtitle,
          summary: book.summary,
          coverText: book.coverText,
          content: book.content,
          pageCount: book.pageCount,
        },
      });

          const oldRevisions =
        await transaction.bookRevision.findMany({
          where: {
            bookId: book.id,
            authorId: userId,
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip: 30,
          select: {
            id: true,
          },
        });

      if (oldRevisions.length > 0) {
        await transaction.bookRevision.deleteMany({
          where: {
            id: {
              in: oldRevisions.map(
                (revision) => revision.id,
              ),
            },
          },
        });
      }

      return transaction.book.update({
        where: {
          id: book.id,
        },
        data: {
          title,
          subtitle: subtitle || null,
          summary: summary || null,
          coverText: coverText || null,
          content,
          pageCount:
            estimateEditedBookPageCount(
              content,
            ),
        },
        select: {
          id: true,
          title: true,
          subtitle: true,
          summary: true,
          coverText: true,
          content: true,
          pageCount: true,
          updatedAt: true,
        },
      });
    },
  );

    return NextResponse.json({
      ok: true,
      book: updatedBook,
      message: '책 원고를 저장했습니다.',
    });
  } catch (error) {
    console.error('[BOOK_UPDATE_ERROR]', error);

    return NextResponse.json(
      {
        ok: false,
        message: '책 원고를 저장하는 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}

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

function getBookEditText(
  value: unknown,
) {
  return typeof value === 'string'
    ? value.trim()
    : '';
}

function estimateEditedBookPageCount(
  content: string,
) {
  const length =
    content.replace(/\s/g, '').length;

  if (length <= 0) {
    return 1;
  }

  return Math.max(
    1,
    Math.ceil(length / 650),
  );
}