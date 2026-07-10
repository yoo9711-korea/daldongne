import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, message: '로그인이 필요합니다.' },
        { status: 401 },
      );
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { ok: false, message: 'BLOB_READ_WRITE_TOKEN이 설정되어 있지 않습니다.' },
        { status: 500 },
      );
    }

    const formData = await request.formData();

    const file = formData.get('file');
    const title = String(formData.get('title') || '').trim();
    const story = String(formData.get('story') || '').trim();
    const occurredAtValue = String(formData.get('occurredAt') || '').trim();

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, message: '업로드할 사진을 선택해 주세요.' },
        { status: 400 },
      );
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { ok: false, message: '이미지 파일만 업로드할 수 있습니다.' },
        { status: 400 },
      );
    }

    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, message: '사진 용량은 8MB 이하만 가능합니다.' },
        { status: 400 },
      );
    }

    const occurredAt = parseOccurredAt(occurredAtValue);

    const safeName = file.name.replace(/[^\w.\-가-힣]/g, '_');
    const pathname = `story-photos/${session.user.id}/${Date.now()}-${safeName}`;

    const blob = await put(pathname, file, {
      access: 'private',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: file.type,
    });

    const memory = await prisma.memory.create({
      data: {
        type: 'PHOTO',
        title: title || '이야기 사진',
        description: story || null,
        fileUrl: blob.url,
        authorId: session.user.id,
        occurredAt,
      },
    });

    return NextResponse.json({
      ok: true,
      memoryId: memory.id,
      message: '사진과 이야기를 저장했습니다.',
    });
  } catch (error) {
    console.error('[STORY_PHOTO_UPLOAD_ERROR]', error);

    return NextResponse.json(
      { ok: false, message: '사진을 저장하는 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}

function parseOccurredAt(value: string) {
  if (!value) {
    return new Date();
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return new Date();
  }

  return date;
}