import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;

    if (!userId) {
      return NextResponse.json(
        { ok: false, message: '로그인이 필요합니다.' },
        { status: 401 },
      );
    }

    const body = (await request.json()) as {
      bookIds?: unknown;
    };

    if (!Array.isArray(body.bookIds)) {
      return NextResponse.json(
        { ok: false, message: '삭제할 책을 선택해 주세요.' },
        { status: 400 },
      );
    }

    const bookIds = body.bookIds
      .filter((id): id is string => typeof id === 'string')
      .map((id) => id.trim())
      .filter(Boolean);

    if (bookIds.length === 0) {
      return NextResponse.json(
        { ok: false, message: '삭제할 책을 선택해 주세요.' },
        { status: 400 },
      );
    }

    if (bookIds.length > 50) {
      return NextResponse.json(
        { ok: false, message: '한 번에 최대 50권까지만 삭제할 수 있습니다.' },
        { status: 400 },
      );
    }

    const result = await prisma.book.deleteMany({
      where: {
        authorId: userId,
        id: {
          in: bookIds,
        },
      } as any,
    });

    return NextResponse.json({
      ok: true,
      deletedCount: result.count,
      message: `${result.count}권의 책이 삭제되었습니다.`,
    });
  } catch (error) {
    console.error('[BOOK_BULK_DELETE_ERROR]', error);

    return NextResponse.json(
      {
        ok: false,
        message: '책을 삭제하는 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}