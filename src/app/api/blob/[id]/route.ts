import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { get } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { id } = await params;

  if (!id) {
    return new NextResponse('Bad Request', { status: 400 });
  }

  const memory = await prisma.memory.findUnique({
    where: { id },
    select: {
      id: true,
      authorId: true,
      fileUrl: true,
    },
  });

  if (!memory) {
    return new NextResponse('Not Found', { status: 404 });
  }

  if (memory.authorId !== session.user.id) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  if (!memory.fileUrl) {
    return NextResponse.json(
      { success: false, message: '파일이 없습니다.' },
      { status: 404 },
    );
  }

  let pathname: string;

  try {
    pathname = new URL(memory.fileUrl).pathname.slice(1);
  } catch {
    return NextResponse.json(
      { success: false, message: '파일 경로가 올바르지 않습니다.' },
      { status: 400 },
    );
  }

  const result = await get(pathname, {
    access: 'private',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  if (!result || result.statusCode !== 200) {
    return new NextResponse('Blob Not Found', { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      'Content-Type': result.blob.contentType || 'application/octet-stream',
      'Cache-Control': 'private, no-cache',
    },
  });
}