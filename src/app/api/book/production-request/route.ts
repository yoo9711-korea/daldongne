import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
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

    const body = (await request.json()) as {
      bookId?: unknown;
      name?: unknown;
      phone?: unknown;
      email?: unknown;
      message?: unknown;
    };

    const bookId = typeof body.bookId === 'string' ? body.bookId.trim() : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (!bookId) {
      return NextResponse.json(
        { ok: false, message: '상담 신청할 책을 찾을 수 없습니다.' },
        { status: 400 },
      );
    }

    const book = await prisma.book.findFirst({
      where: {
        id: bookId,
        authorId: session.user.id,
      },
      select: {
        id: true,
        title: true,
      },
    });

    if (!book) {
      return NextResponse.json(
        { ok: false, message: '상담 신청할 책을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    const requestName = name || session.user.name || null;
    const requestEmail = email || session.user.email || null;
    const requestPhone = phone || null;
    const requestMessage =
      message ||
      `${book.title || '작성한 책 원고'} 제작 상담을 신청합니다.`;

       const existingRequest = await prisma.bookProductionRequest.findFirst({
      where: {
        bookId: book.id,
        authorId: session.user.id,
        status: {
          in: ['REQUESTED', 'CONTACTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        status: true,
      },
    });

    const productionRequest = existingRequest
      ? await prisma.bookProductionRequest.update({
          where: {
            id: existingRequest.id,
          },
          
                  data: {
            name: requestName,
            phone: requestPhone,
            email: requestEmail,
            message: requestMessage,
            status:
              existingRequest.status === 'CANCELED'
                ? 'REQUESTED'
                : existingRequest.status,
          },

          select: {
            id: true,
            status: true,
          },
        })
      : await prisma.bookProductionRequest.create({
          data: {
            bookId: book.id,
            authorId: session.user.id,
            name: requestName,
            phone: requestPhone,
            email: requestEmail,
            message: requestMessage,
            status: 'REQUESTED',
          },
          select: {
            id: true,
            status: true,
          },
        });

    return NextResponse.json({
      ok: true,
      requestId: productionRequest.id,
      status: productionRequest.status,
      message:
        '제작 상담 신청이 접수되었습니다. 관리자 확인 후 연락드릴 수 있도록 준비하겠습니다.',
    });
  } catch (error) {
    console.error('[BOOK_PRODUCTION_REQUEST_ERROR]', error);

    return NextResponse.json(
      {
        ok: false,
        message: '제작 상담 신청 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}