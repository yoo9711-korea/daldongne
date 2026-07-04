import { put } from '@vercel/blob';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    console.log('BLOB token exists:', !!token);
    console.log('BLOB token prefix:', token?.substring(0, 20));

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = (formData.get('title') as string) || file?.name || '';
    const occurredAt = (formData.get('occurredAt') as string) || null;

    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
    }

    console.log('File name:', file.name, 'Size:', file.size, 'Type:', file.type);

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');
    console.log("=== upload start ===");

    const blob = await put(
  `memories/${session.user.id}/${Date.now()}-${file.name}`,
  file,
  {
    access: 'private',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  }
);

    console.log('Blob URL:', blob.url);

    const memory = await prisma.memory.create({
      data: {
        type: isImage ? 'PHOTO' : isVideo ? 'VIDEO' : 'AUDIO',
        title,
        fileUrl: blob.url,
        occurredAt: occurredAt ? new Date(occurredAt) : null,
        authorId: session.user.id,
     
     },
    }) ; console.log("memory created:", memory.id);

    return NextResponse.json({ memory, url: blob.url });
  } catch (error: any) {
    console.error('Upload error full:', error?.message, error?.stack);
    return NextResponse.json({
      error: error?.message || '업로드 실패',
      detail: error?.toString(),
    }, { status: 500 });
  }
}