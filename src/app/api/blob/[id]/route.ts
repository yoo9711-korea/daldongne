import { get } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const memory = await prisma.memory.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        type: true,
        fileUrl: true,
      },
    });

    if (!memory) {
      return new NextResponse('사진 기록을 찾을 수 없습니다.', {
        status: 404,
      });
    }

    if (memory.type !== 'PHOTO') {
      return new NextResponse('사진 기록이 아닙니다.', {
        status: 400,
      });
    }

    if (!memory.fileUrl) {
      return new NextResponse('사진 주소가 비어 있습니다.', {
        status: 404,
      });
    }

    let pathname = '';

    try {
      const url = new URL(memory.fileUrl);
      pathname = url.pathname.replace(/^\/+/, '');
    } catch {
      pathname = memory.fileUrl.replace(/^\/+/, '');
    }

    if (!pathname) {
      return new NextResponse('사진 경로를 찾을 수 없습니다.', {
        status: 404,
      });
    }

    const result = await get(pathname, {
      access: 'private',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    if (!result || !result.stream) {
      return new NextResponse('사진 파일 본문이 없습니다.', {
        status: 404,
      });
    }

    const contentType =
      result.blob?.contentType ||
      result.headers.get('content-type') ||
      'image/jpeg';

    return new NextResponse(result.stream, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=60',
      },
    });
  } catch (error) {
    console.error('[BLOB_IMAGE_ERROR]', error);

    return new NextResponse('사진을 불러오는 중 오류가 발생했습니다.', {
      status: 500,
    });
  }
}
