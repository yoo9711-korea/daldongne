import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, message: '로그인이 필요합니다.' },
        { status: 401 },
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { ok: false, message: '수정할 기록을 찾을 수 없습니다.' },
        { status: 400 },
      );
    }

    const body = (await request.json()) as {
      title?: unknown;
      description?: unknown;
      occurredAt?: unknown;
    };

    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const description =
      typeof body.description === 'string' ? body.description.trim() : '';
    const occurredAtValue =
      typeof body.occurredAt === 'string' ? body.occurredAt.trim() : '';

    if (!title && !description && !occurredAtValue) {
      return NextResponse.json(
        { ok: false, message: '수정할 내용을 입력해 주세요.' },
        { status: 400 },
      );
    }

    const memory = await prisma.memory.findFirst({
      where: {
        id,
        authorId: session.user.id,
      },
      select: {
        id: true,
        type: true,
        fileUrl: true,
      },
    });

    if (!memory) {
      return NextResponse.json(
        { ok: false, message: '수정할 기록을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    const occurredAt = parseOccurredAtForUpdate(occurredAtValue);

    if (occurredAtValue && !occurredAt) {
      return NextResponse.json(
        { ok: false, message: '기억 날짜 형식이 올바르지 않습니다.' },
        { status: 400 },
      );
    }

    const isTextStory = String(memory.type) === 'TEXT' && !memory.fileUrl;

    const safeTitle =
      isTextStory && title && !title.startsWith('이야기:')
        ? `이야기: ${title}`
        : title;

    const updatedMemory = await prisma.memory.update({
      where: {
        id: memory.id,
      },
      data: {
        title: safeTitle || undefined,
        description: description || null,
        ...(occurredAt
          ? {
              occurredAt,
            }
          : {}),
      },
      select: {
        id: true,
        title: true,
        description: true,
        occurredAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      memory: updatedMemory,
      message: '기록을 수정했습니다.',
    });
  } catch (error) {
    console.error('[MEMORY_UPDATE_ERROR]', error);

    return NextResponse.json(
      {
        ok: false,
        message: '기록을 수정하는 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, message: '로그인이 필요합니다.' },
        { status: 401 },
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { ok: false, message: '삭제할 기록을 찾을 수 없습니다.' },
        { status: 400 },
      );
    }

    const memory = await prisma.memory.findFirst({
      where: {
        id,
        authorId: session.user.id,
      },
      select: {
        id: true,
        fileUrl: true,
      },
    });

    if (!memory) {
      return NextResponse.json(
        { ok: false, message: '삭제할 기록을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    if (memory.fileUrl && process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        await del(memory.fileUrl, {
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
      } catch (blobError) {
        console.error('[MEMORY_DELETE_BLOB_ERROR]', blobError);
      }
    }

    await prisma.memory.delete({
      where: {
        id: memory.id,
      },
    });

    return NextResponse.json({
      ok: true,
      message: '기록을 삭제했습니다.',
    });
  } catch (error) {
    console.error('[MEMORY_DELETE_ERROR]', error);

    return NextResponse.json(
      {
        ok: false,
        message: '기록을 삭제하는 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}

function parseOccurredAtForUpdate(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}