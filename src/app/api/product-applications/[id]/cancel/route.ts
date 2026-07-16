import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
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

const CANCELABLE_STATUSES = [
  'REQUESTED',
  'CONTACTED',
] as const;

export async function PATCH(
  _request: NextRequest,
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

   type ProductApplicationCancelEmailPayload = {
  applicationId: string;
  productName: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerMessage: string;
};

async function sendProductApplicationCancelEmail(
  payload: ProductApplicationCancelEmailPayload,
) {
  const resendApiKey =
    process.env.RESEND_API_KEY;

  const adminEmail =
    process.env.ADMIN_EMAIL?.trim() ||
    '';

  if (
    !resendApiKey ||
    !adminEmail
  ) {
    console.warn(
      '[PRODUCT_APPLICATION_CANCEL_EMAIL_SKIPPED]',
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

    const adminApplicationUrl =
      `${cleanAppUrl}/admin/product-applications`;

    await resend.emails.send({
      from:
        process.env.EMAIL_FROM ||
        '달동네 출판사 <onboarding@resend.dev>',

      to: adminEmail,

      subject:
        `[달동네] 상품 신청 취소 - ${payload.productName}`,

      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #24170f;">
          <h2 style="margin: 0 0 16px;">
            상품 신청이 사용자에 의해 취소되었습니다.
          </h2>

          <p style="margin: 0 0 20px;">
            관리자 화면에서 취소된 신청 내용을 확인해 주세요.
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
                  전화번호
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
                  요청사항
                </td>
                <td style="padding: 10px; border: 1px solid #ead7b7; white-space: pre-line;">
                  ${escapeHtml(
                    payload.customerMessage ||
                      '-',
                  )}
                </td>
              </tr>

              <tr>
                <td style="padding: 10px; border: 1px solid #ead7b7; font-weight: bold;">
                  변경 상태
                </td>
                <td style="padding: 10px; border: 1px solid #ead7b7;">
                  사용자 직접 취소
                </td>
              </tr>
            </tbody>
          </table>

          <p style="margin: 24px 0 8px;">
            <a
              href="${escapeHtml(
                adminApplicationUrl,
              )}"
              style="display: inline-block; padding: 12px 18px; border-radius: 999px; background: #24170f; color: #fffaf0; text-decoration: none; font-weight: bold;"
            >
              상품 신청 관리 보기
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
      '[PRODUCT_APPLICATION_CANCEL_EMAIL_SENT]',
      {
        applicationId:
          payload.applicationId,
      },
    );
  } catch (error) {
    console.error(
      '[PRODUCT_APPLICATION_CANCEL_EMAIL_ERROR]',
      error,
    );
  }
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

    const application =
      await prisma.productApplication.findFirst({
        where: {
          id: applicationId,
          userId,
        },
                select: {
          id: true,
          userId: true,
          productCode: true,
          productName: true,
          status: true,
          name: true,
          phone: true,
          email: true,
          message: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

    if (!application) {
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
      application.status ===
      'CANCELED'
    ) {
      return NextResponse.json({
        ok: true,
        unchanged: true,
        application,
        message:
          '이미 취소된 상품 신청입니다.',
      });
    }

    if (
      application.status ===
      'COMPLETED'
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '이미 처리가 완료된 신청은 취소할 수 없습니다.',
        },
        {
          status: 409,
        },
      );
    }

    if (
      application.status ===
      'IN_PROGRESS'
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '현재 진행 중인 신청입니다. 취소가 필요한 경우 관리자에게 문의해 주세요.',
        },
        {
          status: 409,
        },
      );
    }

    if (
      !CANCELABLE_STATUSES.includes(
        application.status,
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '현재 상태에서는 신청을 취소할 수 없습니다.',
        },
        {
          status: 409,
        },
      );
    }

    const canceledApplication =
      await prisma.productApplication.update({
        where: {
          id: application.id,
        },
        data: {
          status: 'CANCELED',
        },
        select: {
          id: true,
          productCode: true,
          productName: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
            });

    await sendProductApplicationCancelEmail({
      applicationId:
        application.id,
      productName:
        application.productName,
      customerName:
        application.name ||
        application.user.name ||
        '',
      customerPhone:
        application.phone || '',
      customerEmail:
        application.email ||
        application.user.email ||
        '',
      customerMessage:
        application.message || '',
    });

    console.info(
      '[PRODUCT_APPLICATION_CANCELED_BY_USER]',
      {
        applicationId:
          canceledApplication.id,
        productCode:
          canceledApplication.productCode,
        userId,
      },
    );

    return NextResponse.json({
      ok: true,
      unchanged: false,
      application:
        canceledApplication,
      message:
        '상품 신청이 취소되었습니다.',
    });
  } catch (error) {
    console.error(
      '[PRODUCT_APPLICATION_CANCEL_ERROR]',
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          '상품 신청 취소 중 오류가 발생했습니다.',
      },
      {
        status: 500,
      },
    );
  }
}