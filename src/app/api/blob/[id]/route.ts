import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { MemoryType } from '@prisma/client';
import { get } from '@vercel/blob';
import {
  NextRequest,
  NextResponse,
} from 'next/server';

export const runtime = 'nodejs';
export const dynamic =
  'force-dynamic';

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
    const session =
      await auth();

    const userId =
      session?.user?.id;

    if (!userId) {
      return new NextResponse(
        '로그인이 필요합니다.',
        {
          status: 401,
        },
      );
    }

    const { id } =
      await context.params;

    const memoryId =
      id.trim();

    if (!memoryId) {
      return new NextResponse(
        '사진 기록을 찾을 수 없습니다.',
        {
          status: 400,
        },
      );
    }

    const memory =
      await prisma.memory.findUnique({
        where: {
          id: memoryId,
        },
        select: {
          id: true,
          type: true,
          fileUrl: true,
          authorId: true,
          familyId: true,
        },
      });

    if (!memory) {
      return new NextResponse(
        '사진 기록을 찾을 수 없습니다.',
        {
          status: 404,
        },
      );
    }

    const viewer =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          role: true,
        },
      });

    const isOwner =
      memory.authorId ===
      userId;

    const isAdmin =
      viewer?.role ===
      'ADMIN';

    const familyMembership =
      !isOwner &&
      !isAdmin &&
      memory.familyId
        ? await prisma.familyMember.findUnique({
            where: {
              familyId_userId: {
                familyId:
                  memory.familyId,
                userId,
              },
            },
            select: {
              id: true,
            },
          })
        : null;

    const canView =
      isOwner ||
      isAdmin ||
      Boolean(
        familyMembership,
      );

    if (!canView) {
      return new NextResponse(
        '사진을 열람할 권한이 없습니다.',
        {
          status: 403,
        },
      );
    }

    if (
      memory.type !==
      MemoryType.PHOTO
    ) {
      return new NextResponse(
        '사진 기록이 아닙니다.',
        {
          status: 400,
        },
      );
    }

    if (!memory.fileUrl) {
      return new NextResponse(
        '사진 주소가 비어 있습니다.',
        {
          status: 404,
        },
      );
    }

    const pathname =
      extractBlobPathname(
        memory.fileUrl,
      );

    if (!pathname) {
      return new NextResponse(
        '사진 경로를 찾을 수 없습니다.',
        {
          status: 404,
        },
      );
    }

    const token =
      process.env
        .BLOB_READ_WRITE_TOKEN
        ?.trim();

    if (!token) {
      console.error(
        '[BLOB_IMAGE_TOKEN_MISSING]',
        {
          memoryId:
            memory.id,
        },
      );

      return new NextResponse(
        '사진 저장소 설정을 확인할 수 없습니다.',
        {
          status: 500,
        },
      );
    }

    const result =
      await get(
        pathname,
        {
          access: 'private',
          token,
        },
      );

    if (
      !result ||
      !result.stream
    ) {
      return new NextResponse(
        '사진 파일 본문이 없습니다.',
        {
          status: 404,
        },
      );
    }

    const contentType =
      result.blob?.contentType ||
      result.headers.get(
        'content-type',
      ) ||
      'image/jpeg';

    return new NextResponse(
      result.stream,
      {
        status: 200,
        headers: {
          'Content-Type':
            contentType,
          'Cache-Control':
            'private, no-store, max-age=0',
          Vary:
            'Cookie',
          'X-Content-Type-Options':
            'nosniff',
        },
      },
    );
  } catch (error) {
    console.error(
      '[BLOB_IMAGE_ERROR]',
      error,
    );

    return new NextResponse(
      '사진을 불러오는 중 오류가 발생했습니다.',
      {
        status: 500,
      },
    );
  }
}

function extractBlobPathname(
  value: string,
) {
  try {
    const url =
      new URL(value);

    return url.pathname.replace(
      /^\/+/,
      '',
    );
  } catch {
    return value.replace(
      /^\/+/,
      '',
    );
  }
}