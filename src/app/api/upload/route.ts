import { put } from '@vercel/blob';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

const MAX_FILE_SIZE = 30 * 1024 * 1024;

function getMemoryType(mimeType: string) {
  if (mimeType.startsWith('image/')) {
    return 'PHOTO';
  }

  if (mimeType.startsWith('video/')) {
    return 'VIDEO';
  }

  if (mimeType.startsWith('audio/')) {
    return 'AUDIO';
  }

  return null;
}

function safeFileName(name: string) {
  return name
    .replace(/[^\w.\-가-힣]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 120);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return '업로드 실패';
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: '파일 저장소 설정이 없습니다. BLOB_READ_WRITE_TOKEN을 확인하세요.' },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
    }

    if (file.size <= 0) {
      return NextResponse.json({ error: '빈 파일은 업로드할 수 없습니다.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '파일 용량은 최대 30MB까지 업로드할 수 있습니다.' },
        { status: 400 },
      );
    }

    const memoryType = getMemoryType(file.type);

    if (!memoryType) {
      return NextResponse.json(
        { error: '사진, 영상, 음성 파일만 업로드할 수 있습니다.' },
        { status: 400 },
      );
    }

    const rawTitle = String(formData.get('title') || '').trim();
    const occurredAtValue = String(formData.get('occurredAt') || '').trim();

    const title = rawTitle || file.name || '제목 없는 기록';
    const occurredAt = occurredAtValue ? new Date(occurredAtValue) : null;

    if (occurredAt && Number.isNaN(occurredAt.getTime())) {
      return NextResponse.json({ error: '날짜 형식이 올바르지 않습니다.' }, { status: 400 });
    }

    const filename = safeFileName(file.name || 'memory-file');
    const blobPath = `memories/${session.user.id}/${Date.now()}-${filename}`;

    const blob = await put(blobPath, file, {
      access: 'private',
      token,
    });

    const memory = await prisma.memory.create({
      data: {
        type: memoryType,
        title,
        fileUrl: blob.url,
        occurredAt,
        authorId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      memory,
      url: blob.url,
    });
  } catch (error: unknown) {
    console.error('Upload error:', error);

    return NextResponse.json(
      {
        error: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}