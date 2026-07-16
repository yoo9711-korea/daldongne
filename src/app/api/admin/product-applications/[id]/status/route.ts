import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  ProductionRequestStatus,
} from '@prisma/client';
import {
  NextRequest,
  NextResponse,
} from 'next/server';
import { Resend } from 'resend';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ProductApplicationStatusEmailPayload = {
  to: string | null;
  customerName: string | null;
  productName: string;
  applicationId: string;
  previousStatus: ProductionRequestStatus;
  status: ProductionRequestStatus;
};

const STATUS_TRANSITIONS: Record<
  ProductionRequestStatus,
  readonly ProductionRequestStatus[]
> = {
  REQUESTED: [
    ProductionRequestStatus.CONTACTED,
    ProductionRequestStatus.CANCELED,
  ],
  CONTACTED: [
    ProductionRequestStatus.IN_PROGRESS,
    ProductionRequestStatus.CANCELED,
  ],
  IN_PROGRESS: [
    ProductionRequestStatus.COMPLETED,
    ProductionRequestStatus.CANCELED,
  ],
  COMPLETED: [],
  CANCELED: [],
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
          message: '로그인이 필요합니다.',
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
            '관리자만 상품 신청 상태를 변경할 수 있습니다.',
        },
        {
          status: 403,
        },
      );
    }

    const { id } =
      await context.params;

    const applicationId =
      id.trim();

    if (!applicationId) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '상품 신청 정보를 확인할 수 없습니다.',
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
            '변경할 수 없는 신청 상태입니다.',
        },
        {
          status: 400,
        },
      );
    }

    const existingApplication =
      await prisma.productApplication.findUnique({
        where: {
          id: applicationId,
        },
        select: {
          id: true,
          productCode: true,
          productName: true,
          status: true,
          name: true,
          phone: true,
          email: true,
          updatedAt: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

    if (!existingApplication) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '상품 신청 정보를 찾을 수 없습니다.',
        },
        {
          status: 404,
        },
      );
    }

    if (
      existingApplication.status ===
      nextStatus
    ) {
      return NextResponse.json({
        ok: true,
        unchanged: true,
        application:
          existingApplication,
        message:
          '이미 선택한 상태로 설정되어 있습니다.',
      });
    }

    const allowedNextStatuses =
      STATUS_TRANSITIONS[
        existingApplication.status
      ];

    if (
      !allowedNextStatuses.includes(
        nextStatus,
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          currentStatus:
            existingApplication.status,
          allowedStatuses:
            allowedNextStatuses,
          message:
            '현재 상태에서 선택한 상태로 변경할 수 없습니다.',
        },
        {
          status: 409,
        },
      );
    }

    const previousStatus =
      existingApplication.status;

    const updatedApplication =
      await prisma.productApplication.update({
        where: {
          id: existingApplication.id,
        },
        data: {
          status: nextStatus,
        },
        select: {
          id: true,
          productCode: true,
          productName: true,
          status: true,
          name: true,
          phone: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    await sendProductApplicationStatusEmail({
      to:
        existingApplication.email ||
        existingApplication.user.email,
      customerName:
        existingApplication.name ||
        existingApplication.user.name,
      productName:
        existingApplication.productName,
      applicationId:
        existingApplication.id,
      previousStatus,
      status:
        updatedApplication.status,
    });

    console.info(
      '[PRODUCT_APPLICATION_STATUS_UPDATED]',
      {
        applicationId:
          updatedApplication.id,
        productCode:
          updatedApplication.productCode,
        previousStatus,
        status:
          updatedApplication.status,
        adminUserId: userId,
      },
    );

    return NextResponse.json({
      ok: true,
      unchanged: false,
      application:
        updatedApplication,
      message:
        '상품 신청 상태가 변경되었습니다.',
    });
  } catch (error) {
    console.error(
      '[PRODUCT_APPLICATION_STATUS_ERROR]',
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          '상품 신청 상태 변경 중 오류가 발생했습니다.',
      },
      {
        status: 500,
      },
    );
  }
}

async function sendProductApplicationStatusEmail(
  payload: ProductApplicationStatusEmailPayload,
) {
  const resendApiKey =
    process.env.RESEND_API_KEY;

  if (
    !resendApiKey ||
    !payload.to
  ) {
    console.warn(
      '[PRODUCT_APPLICATION_STATUS_EMAIL_SKIPPED]',
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

    const applicationsUrl =
      `${cleanAppUrl}/dashboard/applications`;

    await resend.emails.send({
      from:
        process.env.EMAIL_FROM ||
        '달동네 출판사 <onboarding@resend.dev>',

      to: payload.to,

      subject:
        `[달동네] 상품 신청 상태 변경 - ${payload.productName}`,

      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #24170f;">
          <h2 style="margin: 0 0 16px;">
            상품 신청 상태가 변경되었습니다.
          </h2>

          <p style="margin: 0 0 16px;">
            ${escapeHtml(
              payload.customerName ||
                '고객',
            )}님, 신청하신 상품의 처리 상태가 변경되었습니다.
          </p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tbody>
              <tr>
                <td style="width: 150px; padding: 10px; border: 1px solid #ead7b7; font-weight: bold;">
                  신청 상품
                </td>
                <td style="padding: 10px; border: 1px solid #ead7b7;">
                  ${escapeHtml(
                    payload.productName,
                  )}
                </td>
              </tr>

              <tr>
                <td style="padding: 10px; border: 1px solid #ead7b7; font-weight: bold;">
                  이전 상태
                </td>
                <td style="padding: 10px; border: 1px solid #ead7b7;">
                  ${escapeHtml(
                    getProductApplicationStatusLabel(
                      payload.previousStatus,
                    ),
                  )}
                </td>
              </tr>

              <tr>
                <td style="padding: 10px; border: 1px solid #ead7b7; font-weight: bold;">
                  변경된 상태
                </td>
                <td style="padding: 10px; border: 1px solid #ead7b7;">
                  ${escapeHtml(
                    getProductApplicationStatusLabel(
                      payload.status,
                    ),
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          <p style="margin: 24px 0 8px;">
            <a
              href="${escapeHtml(
                applicationsUrl,
              )}"
              style="display: inline-block; padding: 12px 18px; border-radius: 999px; background: #24170f; color: #fffaf0; text-decoration: none; font-weight: bold;"
            >
              내 상품 신청 확인하기
            </a>
          </p>

          <p style="margin-top: 28px; font-size: 12px; color: #8a806f;">
            접수번호:
            ${escapeHtml(
              payload.applicationId,
            )}
          </p>
        </div>
      `,
    });

    console.info(
      '[PRODUCT_APPLICATION_STATUS_EMAIL_SENT]',
      {
        applicationId:
          payload.applicationId,
        status:
          payload.status,
      },
    );
  } catch (error) {
    /*
     * 이메일 발송 실패가 이미 완료된
     * 상태 변경을 되돌리지 않도록 합니다.
     */
    console.error(
      '[PRODUCT_APPLICATION_STATUS_EMAIL_ERROR]',
      error,
    );
  }
}

function isProductionRequestStatus(
  value: unknown,
): value is ProductionRequestStatus {
  return (
    typeof value === 'string' &&
    Object.values(
      ProductionRequestStatus,
    ).includes(
      value as ProductionRequestStatus,
    )
  );
}

function getProductApplicationStatusLabel(
  status: ProductionRequestStatus,
) {
  if (
    status ===
    ProductionRequestStatus.REQUESTED
  ) {
    return '상품 신청 접수';
  }

  if (
    status ===
    ProductionRequestStatus.CONTACTED
  ) {
    return '고객 연락 완료';
  }

  if (
    status ===
    ProductionRequestStatus.IN_PROGRESS
  ) {
    return '상품 처리 진행 중';
  }

  if (
    status ===
    ProductionRequestStatus.COMPLETED
  ) {
    return '상품 처리 완료';
  }

  if (
    status ===
    ProductionRequestStatus.CANCELED
  ) {
    return '상품 신청 취소';
  }

  return '상품 신청 상태 확인 필요';
}

function escapeHtml(
  value: string,
) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}