import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const runtime = 'nodejs';

type ProductionRequestEmailPayload = {
  requestId: string;
  bookId: string;
  bookTitle: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  customerMessage: string;
  status: string;
};

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
      message || `${book.title || '작성한 책 원고'} 제작 상담을 신청합니다.`;

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

    const productionRequest = await prisma.$transaction(async (tx) => {
      const savedRequest = existingRequest
        ? await tx.bookProductionRequest.update({
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
        : await tx.bookProductionRequest.create({
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

      await tx.book.updateMany({
        where: {
          id: book.id,
          authorId: session.user.id,
        },
        data: {
          status: 'IN_PRODUCTION',
        },
      });

      return savedRequest;
    });

    await sendProductionRequestEmail({
      requestId: productionRequest.id,
      bookId: book.id,
      bookTitle: book.title || '제목 없는 책',
      customerName: requestName,
      customerPhone: requestPhone,
      customerEmail: requestEmail,
      customerMessage: requestMessage,
      status: productionRequest.status,
    });

    return NextResponse.json({
      ok: true,
      requestId: productionRequest.id,
      status: productionRequest.status,
      message:
        '제작 상담 신청이 접수되었습니다. 관리자가 확인 후 연락드릴 수 있도록 준비하겠습니다.',
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

async function sendProductionRequestEmail(payload: ProductionRequestEmailPayload) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!resendApiKey || !adminEmail) {
    console.warn('[BOOK_PRODUCTION_REQUEST_EMAIL_SKIPPED]', {
      hasResendApiKey: Boolean(resendApiKey),
      hasAdminEmail: Boolean(adminEmail),
    });

    return;
  }

  try {
    const resend = new Resend(resendApiKey);
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      'https://www.daldongne.kr';

    const cleanAppUrl = appUrl.replace(/\/$/, '');
    const adminRequestUrl = `${cleanAppUrl}/admin/production-requests`;
    const adminBookUrl = `${cleanAppUrl}/admin/books/${payload.bookId}`;

    await resend.emails.send({
      from: process.env.EMAIL_FROM || '달동네 출판사 <onboarding@resend.dev>',
      to: adminEmail,
      subject: `[달동네] 제작 상담 신청이 접수되었습니다 - ${payload.bookTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #24170f;">
          <h2 style="margin: 0 0 16px;">제작 상담 신청이 접수되었습니다.</h2>

          <p style="margin: 0 0 20px;">
            달동네 출판사 관리자 화면에서 상담 내용을 확인해 주세요.
          </p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tbody>
              <tr>
                <td style="padding: 10px; border: 1px solid #ead7b7; font-weight: bold;">책 제목</td>
                <td style="padding: 10px; border: 1px solid #ead7b7;">${escapeHtml(payload.bookTitle)}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ead7b7; font-weight: bold;">상담 상태</td>
                <td style="padding: 10px; border: 1px solid #ead7b7;">${escapeHtml(getProductionRequestStatusLabel(payload.status))}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ead7b7; font-weight: bold;">신청자</td>
                <td style="padding: 10px; border: 1px solid #ead7b7;">${escapeHtml(payload.customerName || '-')}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ead7b7; font-weight: bold;">연락처</td>
                <td style="padding: 10px; border: 1px solid #ead7b7;">${escapeHtml(payload.customerPhone || '-')}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ead7b7; font-weight: bold;">이메일</td>
                <td style="padding: 10px; border: 1px solid #ead7b7;">${escapeHtml(payload.customerEmail || '-')}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ead7b7; font-weight: bold;">요청 내용</td>
                <td style="padding: 10px; border: 1px solid #ead7b7; white-space: pre-line;">${escapeHtml(payload.customerMessage)}</td>
              </tr>
            </tbody>
          </table>

          <p style="margin: 24px 0 8px;">
            <a href="${adminRequestUrl}" style="display: inline-block; padding: 12px 18px; border-radius: 999px; background: #24170f; color: #fffaf0; text-decoration: none; font-weight: bold;">
              제작 상담 목록 보기
            </a>
          </p>

          <p style="margin: 8px 0;">
            <a href="${adminBookUrl}" style="color: #8a5a14; font-weight: bold;">
              관리자 책 상세 보기
            </a>
          </p>

          <p style="margin-top: 28px; font-size: 12px; color: #8a806f;">
            requestId: ${escapeHtml(payload.requestId)}
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error('[BOOK_PRODUCTION_REQUEST_EMAIL_ERROR]', error);
  }
}

function getProductionRequestStatusLabel(status: string) {
  if (status === 'REQUESTED') return '상담 신청 접수';
  if (status === 'CONTACTED') return '고객 연락 완료';
  if (status === 'IN_PROGRESS') return '제작 상담 진행 중';
  if (status === 'COMPLETED') return '상담 완료';
  if (status === 'CANCELED') return '상담 취소';

  return '상담 상태 확인 필요';
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}