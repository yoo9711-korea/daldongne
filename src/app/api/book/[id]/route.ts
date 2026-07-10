import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;

    if (!userId) {
      return NextResponse.json(
        { ok: false, message: '로그인이 필요합니다.' },
        { status: 401 },
      );
    }

    const book = await prisma.book.findFirst({
      where: {
        id,
        authorId: userId,
      } as any,
      select: {
        id: true,
        title: true,
      },
    });

    if (!book) {
      return NextResponse.json(
        { ok: false, message: '삭제할 책을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    await prisma.book.delete({
      where: {
        id: book.id,
      },
    });

    return NextResponse.json({
      ok: true,
      message: '책이 삭제되었습니다.',
    });
  } catch (error) {
    console.error('[BOOK_DELETE_ERROR]', error);

    return NextResponse.json(
      {
        ok: false,
        message: '책을 삭제하는 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}