import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST() {
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

  try {
    const [memoriesWithFiles, timeCapsulesWithFiles] = await Promise.all([
      prisma.memory.findMany({
        where: {
          authorId: userId,
          fileUrl: {
            not: null,
          },
        },
        select: {
          fileUrl: true,
        },
      }),

      prisma.timeCapsule.findMany({
        where: {
          authorId: userId,
          fileUrl: {
            not: null,
          },
        },
        select: {
          fileUrl: true,
        },
      }),
    ]);

    const fileUrls = Array.from(
      new Set(
        [...memoriesWithFiles, ...timeCapsulesWithFiles]
          .map((item) => item.fileUrl)
          .filter((fileUrl): fileUrl is string => Boolean(fileUrl)),
      ),
    );

    await prisma.$transaction(async (tx) => {
      await tx.bookProductionRequest.deleteMany({
        where: {
          authorId: userId,
        },
      });

      await tx.user.delete({
        where: {
          id: userId,
        },
      });
    });

    if (fileUrls.length > 0) {
      try {
        await del(fileUrls);
      } catch (blobError) {
        console.error('ACCOUNT_DELETE_BLOB_ERROR', blobError);
      }
    }

    return NextResponse.json({
      ok: true,
      message: '계정과 관련 데이터가 삭제되었습니다.',
    });
  } catch (error) {
    console.error('ACCOUNT_DELETE_ERROR', error);

    return NextResponse.json(
      {
        ok: false,
        message: '계정 삭제 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}