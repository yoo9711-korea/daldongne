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
  action: 'CREATED' | 'UPDATED';
};

const ACTIVE_REQUEST_STATUSES = [
  'REQUESTED',
  'CONTACTED',
  'IN_PROGRESS',
] as const;

export async function POST(
  request: Request,
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '로그인이 필요합니다.',
        },
        {
          status: 401,
        },
      );
    }

    const body =
      (await request.json()) as {
        bookId?: unknown;
        name?: unknown;
        phone?: unknown;
        email?: unknown;
        message?: unknown;
      };

    const bookId =
      getTrimmedString(body.bookId);

    const name =
      getTrimmedString(body.name);

    const phone =
      getTrimmedString(body.phone);

    const email =
      getTrimmedString(body.email);

    const message =
      getTrimmedString(body.message);

    if (!bookId) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '상담 신청할 책을 찾을 수 없습니다.',
        },
        {
          status: 400,
        },
      );
    }

    if (name.length > 80) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '이름은 80자 이내로 입력해 주세요.',
        },
        {
          status: 400,
        },
      );
    }

    if (phone.length > 30) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '연락처는 30자 이내로 입력해 주세요.',
        },
        {
          status: 400,
        },
      );
    }

    if (email.length > 160) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '이메일은 160자 이내로 입력해 주세요.',
        },
        {
          status: 400,
        },
      );
    }

    if (
      email &&
      !isValidEmail(email)
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '이메일 형식을 확인해 주세요.',
        },
        {
          status: 400,
        },
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '요청 내용은 2,000자 이내로 입력해 주세요.',
        },
        {
          status: 400,
        },
      );
    }

    const book =
      await prisma.book.findFirst({
        where: {
          id: bookId,
          authorId: userId,
        },
        select: {
          id: true,
          title: true,
        },
      });

    if (!book) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '상담 신청할 책을 찾을 수 없습니다.',
        },
        {
          status: 404,
        },
      );
    }

    const sessionName =
      getTrimmedString(
        session.user.name,
      );

    const sessionEmail =
      getTrimmedString(
        session.user.email,
      );

    const requestName =
      name || sessionName || null;

    const requestPhone =
      phone || null;

    const requestEmail =
      email || sessionEmail || null;

    if (
      !requestPhone &&
      !requestEmail
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '연락처 또는 이메일 중 하나는 입력해 주세요.',
        },
        {
          status: 400,
        },
      );
    }

    const requestMessage =
      message ||
      `"${book.title}" 책 제작 상담을 신청합니다.`;

    const activeRequest =
      await prisma.bookProductionRequest.findFirst(
        {
          where: {
            bookId: book.id,
            authorId: userId,
            status: {
              in: [
                ...ACTIVE_REQUEST_STATUSES,
              ],
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            status: true,
          },
        },
      );

    const saved =
      await prisma.$transaction(
        async (transaction) => {
          if (activeRequest) {
            const updatedRequest =
              await transaction.bookProductionRequest.update(
                {
                  where: {
                    id: activeRequest.id,
                  },
                  data: {
                    name: requestName,
                    phone: requestPhone,
                    email: requestEmail,
                    message:
                      requestMessage,
                  },
                  select: {
                    id: true,
                    status: true,
                  },
                },
              );

            await transaction.book.updateMany(
              {
                where: {
                  id: book.id,
                  authorId: userId,
                },
                data: {
                  status:
                    'IN_PRODUCTION',
                },
              },
            );

            return {
              request:
                updatedRequest,
              action:
                'UPDATED' as const,
            };
          }

          const createdRequest =
            await transaction.bookProductionRequest.create(
              {
                data: {
                  bookId: book.id,
                  authorId: userId,
                  name: requestName,
                  phone: requestPhone,
                  email: requestEmail,
                  message:
                    requestMessage,
                  status: 'REQUESTED',
                },
                select: {
                  id: true,
                  status: true,
                },
              },
            );

          await transaction.book.updateMany(
            {
              where: {
                id: book.id,
                authorId: userId,
              },
              data: {
                status:
                  'IN_PRODUCTION',
              },
            },
          );

          return {
            request:
              createdRequest,
            action:
              'CREATED' as const,
          };
        },
      );

    await sendProductionRequestEmail(
      {
        requestId:
          saved.request.id,
        bookId: book.id,
        bookTitle: book.title,
        customerName:
          requestName,
        customerPhone:
          requestPhone,
        customerEmail:
          requestEmail,
        customerMessage:
          requestMessage,
        status: String(
          saved.request.status,
        ),
        action: saved.action,
      },
    );

    return NextResponse.json({
      ok: true,
      requestId:
        saved.request.id,
      status: String(
        saved.request.status,
      ),
      action: saved.action,
      message:
        saved.action === 'UPDATED'
          ? '제작 상담 신청 내용이 수정되었습니다.'
          : '제작 상담 신청이 접수되었습니다. 관리자가 내용을 확인한 뒤 연락드리겠습니다.',
    });
  } catch (error) {
    console.error(
      '[BOOK_PRODUCTION_REQUEST_ERROR]',
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          '제작 상담 신청 중 오류가 발생했습니다.',
      },
      {
        status: 500,
      },
    );
  }
}

async function sendProductionRequestEmail(
  payload: ProductionRequestEmailPayload,
) {
  const resendApiKey =
    process.env.RESEND_API_KEY;

  const adminEmail =
    process.env.ADMIN_EMAIL;

  if (
    !resendApiKey ||
    !adminEmail
  ) {
    console.warn(
      '[BOOK_PRODUCTION_REQUEST_EMAIL_SKIPPED]',
      {
        hasResendApiKey:
          Boolean(resendApiKey),
        hasAdminEmail:
          Boolean(adminEmail),
      },
    );

    return;
  }

  try {
    const resend =
      new Resend(resendApiKey);

    const appUrl =
      process.env
        .NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      'https://www.daldongne.kr';

    const cleanAppUrl =
      appUrl.replace(/\/$/, '');

    const adminRequestUrl =
      `${cleanAppUrl}/admin/production-requests`;

    const adminBookUrl =
      `${cleanAppUrl}/admin/books/${payload.bookId}`;

    const actionLabel =
      payload.action === 'UPDATED'
        ? '상담 신청 내용이 수정되었습니다'
        : '새 제작 상담 신청이 접수되었습니다';

    await resend.emails.send({
      from:
        process.env.EMAIL_FROM ||
        '달동네 출판사 <onboarding@resend.dev>',

      to: adminEmail,

      subject:
        payload.action === 'UPDATED'
          ? `[달동네] 제작 상담 내용 수정 - ${payload.bookTitle}`
          : `[달동네] 새 제작 상담 신청 - ${payload.bookTitle}`,

      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #24170f;">
          <h2 style="margin: 0 0 16px;">
            ${escapeHtml(actionLabel)}
          </h2>

          <p style="margin: 0 0 20px;">
            달동네 출판사 관리자 화면에서 상담 내용을 확인해 주세요.
          </p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tbody>
              <tr>
                <td style="padding: 10px; border: 1px solid #ead7b7; font-weight: bold;">
                  책 제목
                </td>
                <td style="padding: 10px; border: 1px solid #ead7b7;">
                  ${escapeHtml(payload.bookTitle)}
                </td>
              </tr>

              <tr>
                <td style="padding: 10px; border: 1px solid #ead7b7; font-weight: bold;">
                  상담 상태
                </td>
                <td style="padding: 10px; border: 1px solid #ead7b7;">
                  ${escapeHtml(
                    getProductionRequestStatusLabel(
                      payload.status,
                    ),
                  )}
                </td>
              </tr>

              <tr>
                <td style="padding: 10px; border: 1px solid #ead7b7; font-weight: bold;">
                  신청자
                </td>
                <td style="padding: 10px; border: 1px solid #ead7b7;">
                  ${escapeHtml(
                    payload.customerName ||
                      '-',
                  )}
                </td>
              </tr>

              <tr>
                <td style="padding: 10px; border: 1px solid #ead7b7; font-weight: bold;">
                  연락처
                </td>
                <td style="padding: 10px; border: 1px solid #ead7b7;">
                  ${escapeHtml(
                    payload.customerPhone ||
                      '-',
                  )}
                </td>
              </tr>

              <tr>
                <td style="padding: 10px; border: 1px solid #ead7b7; font-weight: bold;">
                  이메일
                </td>
                <td style="padding: 10px; border: 1px solid #ead7b7;">
                  ${escapeHtml(
                    payload.customerEmail ||
                      '-',
                  )}
                </td>
              </tr>

              <tr>
                <td style="padding: 10px; border: 1px solid #ead7b7; font-weight: bold;">
                  요청 내용
                </td>
                <td style="padding: 10px; border: 1px solid #ead7b7; white-space: pre-line;">
                  ${escapeHtml(
                    payload.customerMessage,
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          <p style="margin: 24px 0 8px;">
            <a
              href="${escapeHtml(adminRequestUrl)}"
              style="display: inline-block; padding: 12px 18px; border-radius: 999px; background: #24170f; color: #fffaf0; text-decoration: none; font-weight: bold;"
            >
              제작 상담 목록 보기
            </a>
          </p>

          <p style="margin: 8px 0;">
            <a
              href="${escapeHtml(adminBookUrl)}"
              style="color: #8a5a14; font-weight: bold;"
            >
              관리자 책 상세 보기
            </a>
          </p>

          <p style="margin-top: 28px; font-size: 12px; color: #8a806f;">
            requestId:
            ${escapeHtml(payload.requestId)}
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error(
      '[BOOK_PRODUCTION_REQUEST_EMAIL_ERROR]',
      error,
    );
  }
}

function getTrimmedString(
  value: unknown,
) {
  return typeof value === 'string'
    ? value.trim()
    : '';
}

function isValidEmail(
  email: string,
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email,
  );
}

function getProductionRequestStatusLabel(
  status: string,
) {
  if (status === 'REQUESTED') {
    return '상담 신청 접수';
  }

  if (status === 'CONTACTED') {
    return '고객 연락 완료';
  }

  if (status === 'IN_PROGRESS') {
    return '제작 상담 진행 중';
  }

  if (status === 'COMPLETED') {
    return '상담 완료';
  }

  if (status === 'CANCELED') {
    return '상담 취소';
  }

  return '상담 상태 확인 필요';
}

function escapeHtml(
  value: string,
) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll(
      "'",
      '&#039;',
    );
}