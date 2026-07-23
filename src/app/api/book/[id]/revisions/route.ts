import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  NextRequest,
  NextResponse,
} from 'next/server';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const { id } = await context.params;
    const bookId = id?.trim();

    if (!userId) {
      return NextResponse.json(
        {
          ok: false,
          message: '로그인이 필요합니다.',
        },
        { status: 401 },
      );
    }

    if (!bookId) {
      return NextResponse.json(
        {
          ok: false,
          message: '책을 확인할 수 없습니다.',
        },
        { status: 400 },
      );
    }

    const book =
      await prisma.book.findFirst({
        where: {
          id: bookId,
          authorId: userId,
        },
        select: {
          id: true,
        },
      });

    if (!book) {
      return NextResponse.json(
        {
          ok: false,
          message: '책을 찾을 수 없습니다.',
        },
        { status: 404 },
      );
    }

    const revisions =
      await prisma.bookRevision.findMany({
        where: {
          bookId: book.id,
          authorId: userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 30,
        select: {
  id: true,
  title: true,
  summary: true,
  pageCount: true,
  createdAt: true,
},
      });

    return NextResponse.json({
      ok: true,
      revisions,
    });
  } catch (error) {
    console.error(
      '[BOOK_REVISION_LIST_ERROR]',
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          '원고 수정 이력을 불러오는 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const { id } = await context.params;
    const bookId = id?.trim();

    if (!userId) {
      return NextResponse.json(
        {
          ok: false,
          message: '로그인이 필요합니다.',
        },
        { status: 401 },
      );
    }

    if (!bookId) {
      return NextResponse.json(
        {
          ok: false,
          message: '책을 확인할 수 없습니다.',
        },
        { status: 400 },
      );
    }

    const body = (await request
      .json()
      .catch(() => null)) as {
      revisionId?: unknown;
    } | null;

    const revisionId =
      typeof body?.revisionId === 'string'
        ? body.revisionId.trim()
        : '';

    if (!revisionId) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '복원할 원고 이력을 선택해 주세요.',
        },
        { status: 400 },
      );
    }

    const book =
      await prisma.book.findFirst({
        where: {
          id: bookId,
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
          message: '책을 찾을 수 없습니다.',
        },
        { status: 404 },
      );
    }

    if (book.status === 'PUBLISHED') {
      return NextResponse.json(
        {
          ok: false,
          message:
            '완성된 책은 이전 원고로 복원할 수 없습니다.',
        },
        { status: 409 },
      );
    }

    const revision =
      await prisma.bookRevision.findFirst({
        where: {
          id: revisionId,
          bookId: book.id,
          authorId: userId,
        },
        select: {
          id: true,
          title: true,
          subtitle: true,
          summary: true,
          coverText: true,
          content: true,
          pageCount: true,
        },
      });

    if (!revision) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '복원할 원고 이력을 찾을 수 없습니다.',
        },
        { status: 404 },
      );
    }

    const restoredBook =
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
                    (item) => item.id,
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
              title: revision.title,
              subtitle: revision.subtitle,
              summary: revision.summary,
              coverText: revision.coverText,
              content: revision.content,
              pageCount: revision.pageCount,
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
      book: restoredBook,
      message:
        '선택한 이전 원고로 복원했습니다. 복원 전 원고도 이력에 보관했습니다.',
    });
  } catch (error) {
    console.error(
      '[BOOK_REVISION_RESTORE_ERROR]',
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          '이전 원고를 복원하는 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}