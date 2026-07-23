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
    revisionId: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
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

    const {
      id,
      revisionId,
    } = await context.params;

    const bookId = id?.trim();
    const historyId =
      revisionId?.trim();

    if (!bookId || !historyId) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '확인할 원고 이력을 찾을 수 없습니다.',
        },
        { status: 400 },
      );
    }

    const [
      currentBook,
      revision,
    ] = await Promise.all([
      prisma.book.findFirst({
        where: {
          id: bookId,
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
          updatedAt: true,
        },
      }),

      prisma.bookRevision.findFirst({
        where: {
          id: historyId,
          bookId,
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
          createdAt: true,
        },
      }),
    ]);

    if (!currentBook) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '현재 책을 찾을 수 없거나 확인 권한이 없습니다.',
        },
        { status: 404 },
      );
    }

    if (!revision) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '원고 이력을 찾을 수 없거나 확인 권한이 없습니다.',
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      currentBook,
      revision,
    });
  } catch (error) {
    console.error(
      '[BOOK_REVISION_DETAIL_ERROR]',
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          '원고 비교 자료를 불러오는 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}