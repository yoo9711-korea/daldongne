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

export async function DELETE(
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
            '삭제할 원고 이력을 찾을 수 없습니다.',
        },
        { status: 400 },
      );
    }

    const revision =
      await prisma.bookRevision.findFirst({
        where: {
          id: historyId,
          bookId,
          authorId: userId,
        },
        select: {
          id: true,
          title: true,
          label: true,
          isPinned: true,
        },
      });

    if (!revision) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '삭제할 원고 이력을 찾을 수 없거나 권한이 없습니다.',
        },
        { status: 404 },
      );
    }

    if (revision.isPinned) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '중요 버전은 삭제할 수 없습니다. 먼저 중요 버전 고정을 해제해 주세요.',
        },
        { status: 409 },
      );
    }

    const deleted =
      await prisma.bookRevision.deleteMany({
        where: {
          id: revision.id,
          bookId,
          authorId: userId,
          isPinned: false,
        },
      });

    if (deleted.count === 0) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '원고 이력을 삭제하지 못했습니다.',
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      ok: true,
      deletedId: revision.id,
      message: `"${
        revision.label ||
        revision.title
      }" 원고 이력을 삭제했습니다.`,
    });
  } catch (error) {
    console.error(
      '[BOOK_REVISION_DELETE_ERROR]',
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          '원고 이력을 삭제하는 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
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
            '수정할 원고 이력을 찾을 수 없습니다.',
        },
        { status: 400 },
      );
    }

    const body = (await request
      .json()
      .catch(() => null)) as {
      label?: unknown;
      isPinned?: unknown;
    } | null;

    if (
      !body ||
      typeof body.isPinned !== 'boolean'
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '중요 버전 설정값을 확인해 주세요.',
        },
        { status: 400 },
      );
    }

    const label =
      typeof body.label === 'string'
        ? body.label.trim()
        : '';

    if (label.length > 60) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '이력 이름은 60자 이내로 입력해 주세요.',
        },
        { status: 400 },
      );
    }

    const revision =
      await prisma.bookRevision.findFirst({
        where: {
          id: historyId,
          bookId,
          authorId: userId,
        },
        select: {
          id: true,
        },
      });

    if (!revision) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '수정할 원고 이력을 찾을 수 없거나 권한이 없습니다.',
        },
        { status: 404 },
      );
    }

    const updatedRevision =
      await prisma.bookRevision.update({
        where: {
          id: revision.id,
        },
        data: {
          label: label || null,
          isPinned: body.isPinned,
        },
        select: {
          id: true,
          title: true,
          summary: true,
          pageCount: true,
          label: true,
          isPinned: true,
          createdAt: true,
        },
      });

    return NextResponse.json({
      ok: true,
      revision: updatedRevision,
      message:
        '원고 이력 이름과 중요 버전 설정을 저장했습니다.',
    });
  } catch (error) {
    console.error(
      '[BOOK_REVISION_UPDATE_ERROR]',
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          '원고 이력 정보를 저장하는 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}