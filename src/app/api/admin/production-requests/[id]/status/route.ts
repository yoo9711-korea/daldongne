import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  NextRequest,
  NextResponse,
} from 'next/server';
import { Resend } from 'resend';

export const runtime = 'nodejs';

const ALLOWED_STATUSES = [
  'REQUESTED',
  'CONTACTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELED',
] as const;

const ACTIVE_STATUSES = [
  'REQUESTED',
  'CONTACTED',
  'IN_PROGRESS',
] as const;

type ProductionRequestStatus =
  (typeof ALLOWED_STATUSES)[number];

type BookStatus =
  | 'DRAFT'
  | 'IN_PRODUCTION'
  | 'PUBLISHED';

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
  previousStatus: ProductionRequestStatus;
  status: ProductionRequestStatus;
  bookStatus: BookStatus;
};

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
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

    const adminUser =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          role: true,
        },
      });

    if (
      adminUser?.role !== 'ADMIN'
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '관리자만 상담 상태를 변경할 수 있습니다.',
        },
        {
          status: 403,
        },
      );
    }

    const { id } =
      await context.params;

    const requestId =
      id.trim();

    if (!requestId) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '상담 신청 정보를 찾을 수 없습니다.',
        },
        {
          status: 400,
        },
      );
    }

    const body =
      (await request
        .json()
        .catch(() => null)) as {
        status?: unknown;
      } | null;

    const nextStatus =
      body?.status;

    if (
      !isProductionRequestStatus(
        nextStatus,
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '변경할 수 없는 상담 상태입니다.',
        },
        {
          status: 400,
        },
      );
    }

    const existingRequest =
      await prisma.bookProductionRequest.findUnique(
        {
          where: {
            id: requestId,
          },
          select: {
            id: true,
            bookId: true,
            authorId: true,
            name: true,
            email: true,
            status: true,
          },
        },
      );

    if (!existingRequest) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '상담 신청 정보를 찾을 수 없습니다.',
        },
        {
          status: 404,
        },
      );
    }

    const [book, customer] =
      await Promise.all([
        prisma.book.findUnique({
          where: {
            id: existingRequest.bookId,
          },
          select: {
            id: true,
            title: true,
            status: true,
          },
        }),

        prisma.user.findUnique({
          where: {
            id:
              existingRequest.authorId,
          },
          select: {
            name: true,
            email: true,
          },
        }),
      ]);

    if (!book) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '상담 신청에 연결된 책을 찾을 수 없습니다.',
        },
        {
          status: 404,
        },
      );
    }

    const previousStatus =
      existingRequest.status as ProductionRequestStatus;

    const result =
      await prisma.$transaction(
        async (transaction) => {
          const updatedRequest =
            await transaction.bookProductionRequest.update(
              {
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
                  updatedAt: true,
                },
              },
            );

          const [
            activeRequestCount,
            completedRequestCount,
          ] = await Promise.all([
            transaction.bookProductionRequest.count(
              {
                where: {
                  bookId:
                    existingRequest.bookId,
                  status: {
                    in: [
                      ...ACTIVE_STATUSES,
                    ],
                  },
                },
              },
            ),

            transaction.bookProductionRequest.count(
              {
                where: {
                  bookId:
                    existingRequest.bookId,
                  status: 'COMPLETED',
                },
              },
            ),
          ]);

          const nextBookStatus =
            getBookStatusFromRequestCounts(
              activeRequestCount,
              completedRequestCount,
            );

          await transaction.book.update({
            where: {
              id: book.id,
            },
            data: {
              status: nextBookStatus,
            },
          });

          return {
            updatedRequest,
            nextBookStatus,
            activeRequestCount,
            completedRequestCount,
          };
        },
      );

    const statusChanged =
      previousStatus !== nextStatus;

    if (statusChanged) {
      await sendProductionStatusEmail({
        to:
          existingRequest.email ||
          customer?.email ||
          null,
        customerName:
          existingRequest.name ||
          customer?.name ||
          null,
        bookTitle: book.title,
        bookId:
          result.updatedRequest.bookId,
        requestId:
          result.updatedRequest.id,
        previousStatus,
        status:
          result.updatedRequest
            .status as ProductionRequestStatus,
        bookStatus:
          result.nextBookStatus,
      });
    }

    return NextResponse.json({
      ok: true,
      requestId:
        result.updatedRequest.id,
      previousStatus,
      status:
        result.updatedRequest.status,
      statusChanged,
      bookId:
        result.updatedRequest.bookId,
      bookStatus:
        result.nextBookStatus,
      activeRequestCount:
        result.activeRequestCount,
      completedRequestCount:
        result.completedRequestCount,
      message: statusChanged
        ? '상담 상태와 책 상태를 함께 변경했습니다.'
        : '이미 선택한 상담 상태입니다. 책 상태만 다시 확인했습니다.',
    });
  } catch (error) {
    console.error(
      '[ADMIN_PRODUCTION_REQUEST_STATUS_ERROR]',
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          '상담 상태 변경 중 오류가 발생했습니다.',
      },
      {
        status: 500,
      },
    );
  }
}

function getBookStatusFromRequestCounts(
  activeRequestCount: number,
  completedRequestCount: number,
): BookStatus {
  if (activeRequestCount > 0) {
    return 'IN_PRODUCTION';
  }

  if (completedRequestCount > 0) {
    return 'PUBLISHED';
  }

  return 'DRAFT';
}

async function sendProductionStatusEmail(
  payload: StatusEmailPayload,
) {
  const resendApiKey =
    process.env.RESEND_API_KEY;

  if (
    !resendApiKey ||
    !payload.to
  ) {
    console.warn(
      '[PRODUCTION_STATUS_EMAIL_SKIPPED]',
      {
        hasResendApiKey:
          Boolean(resendApiKey),
        hasCustomerEmail:
          Boolean(payload.to),
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

    const bookUrl =
      `${cleanAppUrl}/dashboard/library/${payload.bookId}`;

    await resend.emails.send({
      from:
        process.env.EMAIL_FROM ||
        '달동네 출판사 <onboarding@resend.dev>',

      to: payload.to,

      subject:
        `[달동네] 제작 상담 상태 변경 - ${payload.bookTitle}`,

      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #24170f;">
          <h2 style="margin: 0 0 16px;">
            제작 상담 상태가 변경되었습니다.
          </h2>

          <p style="margin: 0 0 16px;">
            ${escapeHtml(
              payload.customerName ||
                '고객',
            )}님, 신청하신 제작 상담의 진행 상태가 변경되었습니다.
          </p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tbody>
              <tr>
                <td style="padding: 10px; border: 1px solid #ead7b7; font-weight: bold;">
                  책 제목
                </td>
                <td style="padding: 10px; border: 1px solid #ead7b7;">
                  ${escapeHtml(
                    payload.bookTitle,
                  )}
                </td>
              </tr>

              <tr>
                <td style="padding: 10px; border: 1px solid #ead7b7; font-weight: bold;">
                  이전 상담 상태
                </td>
                <td style="padding: 10px; border: 1px solid #ead7b7;">
                  ${escapeHtml(
                    getProductionRequestStatusLabel(
                      payload.previousStatus,
                    ),
                  )}
                </td>
              </tr>

              <tr>
                <td style="padding: 10px; border: 1px solid #ead7b7; font-weight: bold;">
                  변경된 상담 상태
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
                  책 상태
                </td>
                <td style="padding: 10px; border: 1px solid #ead7b7;">
                  ${escapeHtml(
                    getBookStatusLabel(
                      payload.bookStatus,
                    ),
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          <p style="margin: 24px 0 8px;">
            <a
              href="${escapeHtml(bookUrl)}"
              style="display: inline-block; padding: 12px 18px; border-radius: 999px; background: #24170f; color: #fffaf0; text-decoration: none; font-weight: bold;"
            >
              내 책장 확인하기
            </a>
          </p>

          <p style="margin-top: 28px; font-size: 12px; color: #8a806f;">
            requestId:
            ${escapeHtml(
              payload.requestId,
            )}
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error(
      '[PRODUCTION_STATUS_EMAIL_ERROR]',
      error,
    );
  }
}

function isProductionRequestStatus(
  value: unknown,
): value is ProductionRequestStatus {
  return (
    typeof value === 'string' &&
    ALLOWED_STATUSES.includes(
      value as ProductionRequestStatus,
    )
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

function getBookStatusLabel(
  status: string,
) {
  if (status === 'DRAFT') {
    return '원고 초안';
  }

  if (
    status === 'IN_PRODUCTION'
  ) {
    return '제작 진행 중';
  }

  if (
    status === 'PUBLISHED'
  ) {
    return '완성';
  }

  return '책 상태 확인 필요';
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