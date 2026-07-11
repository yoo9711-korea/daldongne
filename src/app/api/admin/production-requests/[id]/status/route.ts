import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const ALLOWED_STATUSES = [
  'REQUESTED',
  'CONTACTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELED',
] as const;

type ProductionRequestStatus = (typeof ALLOWED_STATUSES)[number];

type BookStatus = 'DRAFT' | 'IN_PRODUCTION' | 'PUBLISHED';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type StatusEmailPayload = {
  to: string | null;
  customerName: string | null;
  bookTitle: string;
  bookId: string;
  requestId: string;
  status: ProductionRequestStatus;
  bookStatus: BookStatus;
};

function isProductionRequestStatus(
  value: unknown,
): value is ProductionRequestStatus {
  return (
    typeof value === 'string' &&
    ALLOWED_STATUSES.includes(value as ProductionRequestStatus)
  );
}

function getBookStatusFromProductionStatus(
  status: ProductionRequestStatus,
): BookStatus {
  if (status === 'COMPLETED') {
    return 'PUBLISHED';
  }

  if (status === 'CANCELED') {
    return 'DRAFT';
  }

  return 'IN_PRODUCTION';
}

export async function PATCH(request: NextRequest, context: RouteContext) {
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

    const adminUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        role: true,
      },
    });

    if (adminUser?.role !== 'ADMIN') {
      return NextResponse.json(
        {
          ok: false,
          message: '관리자만 상담 상태를 변경할 수 있습니다.',
        },
        { status: 403 },
      );
    }

    const { id } = await context.params;
    const requestId = id.trim();

    if (!requestId) {
      return NextResponse.json(
        {
          ok: false,
          message: '상담 신청 정보를 찾을 수 없습니다.',
        },
        { status: 400 },
      );
    }

    const body = (await request.json().catch(() => null)) as {
      status?: unknown;
    } | null;

    const nextStatus = body?.status;

    if (!isProductionRequestStatus(nextStatus)) {
      return NextResponse.json(
        {
          ok: false,
          message: '변경할 수 없는 상담 상태입니다.',
        },
        { status: 400 },
      );
    }

    const existingRequest = await prisma.bookProductionRequest.findUnique({
      where: {
        id: requestId,
      },
      select: {
        id: true,
        bookId: true,
        authorId: true,
        name: true,
        email: true,
      },
    });

    if (!existingRequest) {
      return NextResponse.json(
        {
          ok: false,
          message: '상담 신청 정보를 찾을 수 없습니다.',
        },
        { status: 404 },
      );
    }

    const [book, customer] = await Promise.all([
      prisma.book.findUnique({
        where: {
          id: existingRequest.bookId,
        },
        select: {
          id: true,
          title: true,
        },
      }),

      prisma.user.findUnique({
        where: {
          id: existingRequest.authorId,
        },
        select: {
          name: true,
          email: true,
        },
      }),
    ]);

    const nextBookStatus = getBookStatusFromProductionStatus(nextStatus);

    const updatedRequest = await prisma.$transaction(async (tx) => {
      const productionRequest = await tx.bookProductionRequest.update({
        where: {
          id: requestId,
        },
        data: {
          status: nextStatus,
        },
        select: {
          id: true,
          status: true,
          bookId: true,
        },
      });

      await tx.book.updateMany({
        where: {
          id: existingRequest.bookId,
        },
        data: {
          status: nextBookStatus,
        },
      });

      return productionRequest;
    });

    await sendProductionStatusEmail({
      to: existingRequest.email || customer?.email || null,
      customerName: existingRequest.name || customer?.name || null,
      bookTitle: book?.title || '제목 없는 책',
      bookId: updatedRequest.bookId,
      requestId: updatedRequest.id,
      status: updatedRequest.status,
      bookStatus: nextBookStatus,
    });

    return NextResponse.json({
      ok: true,
      requestId: updatedRequest.id,
      status: updatedRequest.status,
      bookId: updatedRequest.bookId,
      bookStatus: nextBookStatus,
      message: '상담 상태와 책 상태를 함께 변경했습니다.',
    });
  } catch (error) {
    console.error('ADMIN_PRODUCTION_REQUEST_STATUS_ERROR', error);

    return NextResponse.json(
      {
        ok: false,
        message: '상담 상태 변경 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}

async function sendProductionStatusEmail(payload: StatusEmailPayload) {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey || !payload.to) {
    console.warn('[PRODUCTION_STATUS_EMAIL_SKIPPED]', {
      hasResendApiKey: Boolean(resendApiKey),
      hasCustomerEmail: Boolean(payload.to),
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
    const bookUrl = `${cleanAppUrl}/dashboard/library/${payload.bookId}`;

    await resend.emails.send({
      from: '달동네 출판사 <onboarding@resend.dev>',
      to: payload.to,
      subject: `[달동네] 제작 상담 상태가 변경되었습니다 - ${payload.bookTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #24170f;">
          <h2 style="margin: 0 0 16px;">제작 상담 상태가 변경되었습니다.</h2>

          <p style="margin: 0 0 16px;">
            ${escapeHtml(payload.customerName || '고객')}님, 신청하신 제작 상담 상태가 변경되었습니다.
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
                <td style="padding: 10px; border: 1px solid #ead7b7; font-weight: bold;">책 상태</td>
                <td style="padding: 10px; border: 1px solid #ead7b7;">${escapeHtml(getBookStatusLabel(payload.bookStatus))}</td>
              </tr>
            </tbody>
          </table>

          <p style="margin: 24px 0 8px;">
            <a href="${bookUrl}" style="display: inline-block; padding: 12px 18px; border-radius: 999px; background: #24170f; color: #fffaf0; text-decoration: none; font-weight: bold;">
              내 책장 확인하기
            </a>
          </p>

          <p style="margin-top: 28px; font-size: 12px; color: #8a806f;">
            requestId: ${escapeHtml(payload.requestId)}
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error('[PRODUCTION_STATUS_EMAIL_ERROR]', error);
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

function getBookStatusLabel(status: string) {
  if (status === 'DRAFT') return '원고 초안';
  if (status === 'IN_PRODUCTION') return '제작 준비 중';
  if (status === 'PUBLISHED') return '완성';

  return '책 상태 확인 필요';
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}