import { auth } from '@/auth';
import {
  PRODUCT_ADDONS,
  PRODUCT_PLANS,
} from '@/lib/products/catalog';
import { prisma } from '@/lib/prisma';
import {
  NextRequest,
  NextResponse,
} from 'next/server';
import { Resend } from 'resend';

export const runtime = 'nodejs';

type ProductApplicationRequestBody = {
  productCode?: unknown;
  addonCodes?: unknown;
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  message?: unknown;
};

type ProductApplicationEmailPayload = {
  applicationId: string;
  productName: string;
  billingType: string;
  price: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerMessage: string;
  addonCodes: readonly string[];
};

const ACTIVE_APPLICATION_STATUSES = [
  'REQUESTED',
  'CONTACTED',
  'IN_PROGRESS',
] as const;

export async function POST(
  request: NextRequest,
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

    const body =
      (await request
        .json()
        .catch(() => null)) as
        | ProductApplicationRequestBody
        | null;

    const productCode = cleanText(
      body?.productCode,
    );

    const name =
      cleanText(body?.name) ||
      cleanText(session.user.name);

    const phone = cleanText(
      body?.phone,
    );

    const email =
      cleanText(body?.email) ||
      cleanText(session.user.email);

    const message = cleanText(
      body?.message,
    );

    if (!productCode) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '신청할 상품을 선택해 주세요.',
        },
        {
          status: 400,
        },
      );
    }

    const product =
      PRODUCT_PLANS.find(
        (item) =>
          item.code === productCode,
      );

    if (!product) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '선택한 상품을 확인할 수 없습니다.',
        },
        {
          status: 400,
        },
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '신청자 이름을 입력해 주세요.',
        },
        {
          status: 400,
        },
      );
    }

    if (!phone && !email) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '전화번호 또는 이메일 중 하나를 입력해 주세요.',
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
            '전화번호를 확인해 주세요.',
        },
        {
          status: 400,
        },
      );
    }

    if (
      email &&
      (
        email.length > 200 ||
        !isValidEmail(email)
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '이메일 주소를 확인해 주세요.',
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
            '요청사항은 2,000자 이내로 입력해 주세요.',
        },
        {
          status: 400,
        },
      );
    }

    const requestedAddonCodes =
      getStringArray(
        body?.addonCodes,
      );

    const availableAddonCodes =
      new Set<string>(
        PRODUCT_ADDONS.filter(
          (addon) =>
            (
              addon.availableFor as
                readonly string[]
            ).includes(
              product.category,
            ),
        ).map(
          (addon) => addon.code,
        ),
      );

    const selectedAddonCodes =
      Array.from(
        new Set(
          requestedAddonCodes,
        ),
      );

    const hasInvalidAddon =
      selectedAddonCodes.some(
        (addonCode) =>
          !availableAddonCodes.has(
            addonCode,
          ),
      );

    if (hasInvalidAddon) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '선택할 수 없는 추가 옵션이 포함되어 있습니다.',
        },
        {
          status: 400,
        },
      );
    }

    /*
     * 같은 상품에 처리 중인 신청이 있으면
     * 중복 신청을 막습니다.
     */
    const existingApplication =
      await prisma.productApplication.findFirst({
        where: {
          userId,
          productCode:
            product.code,
          status: {
            in: [
              ...ACTIVE_APPLICATION_STATUSES,
            ],
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
        },
      });

    if (existingApplication) {
      return NextResponse.json(
        {
          ok: false,
          duplicate: true,
          applicationId:
            existingApplication.id,
          status:
            existingApplication.status,
          message:
            '같은 상품에 처리 중인 신청이 이미 있습니다.',
        },
        {
          status: 409,
        },
      );
    }

    /*
     * 상품명과 금액은 브라우저에서 받은 값을
     * 사용하지 않고 서버 카탈로그에서 저장합니다.
     */
    const application =
      await prisma.productApplication.create({
        data: {
          userId,
          productCode:
            product.code,
          productName:
            product.name,
          category:
            product.category,
          billingType:
            product.billingType,
          price:
            product.price,
          name,
          phone:
            phone || null,
          email:
            email || null,
          message:
            message || null,
          addonCodes:
            selectedAddonCodes,
          status: 'REQUESTED',
        },
        select: {
          id: true,
          productCode: true,
          productName: true,
          category: true,
          billingType: true,
          price: true,
          name: true,
          phone: true,
          email: true,
          addonCodes: true,
          status: true,
          createdAt: true,
        },
           });

    await sendProductApplicationEmails({
      applicationId:
        application.id,
      productName:
        application.productName,
      billingType:
        application.billingType,
      price:
        application.price,
      customerName:
        application.name ||
        name,
      customerPhone:
        application.phone ||
        '',
      customerEmail:
        application.email ||
        email,
      customerMessage:
        message,
      addonCodes:
        selectedAddonCodes,
    });

    return NextResponse.json(
      {
        ok: true,
        application,
        message:
          '상품 신청이 접수되었습니다.',
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      '[PRODUCT_APPLICATION_CREATE_ERROR]',
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          '상품 신청 처리 중 오류가 발생했습니다.',
      },
      {
        status: 500,
      },
    );
  }
}

async function sendProductApplicationEmails(
  payload: ProductApplicationEmailPayload,
) {
  const resendApiKey =
    process.env.RESEND_API_KEY;

  const adminEmail =
    process.env.ADMIN_EMAIL?.trim() ||
    '';

  const customerEmail =
    payload.customerEmail.trim();

  if (!resendApiKey) {
    console.warn(
      '[PRODUCT_APPLICATION_EMAIL_SKIPPED]',
      {
        reason:
          'RESEND_API_KEY_MISSING',
      },
    );

    return;
  }

  if (
    !adminEmail &&
    !customerEmail
  ) {
    console.warn(
      '[PRODUCT_APPLICATION_EMAIL_SKIPPED]',
      {
        reason:
          'RECIPIENT_MISSING',
      },
    );

    return;
  }

  const resend =
    new Resend(resendApiKey);

  const appUrl =
    process.env
      .NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    'https://www.daldongne.kr';

  const cleanAppUrl =
    appUrl.replace(/\/$/, '');

  const customerApplicationUrl =
    `${cleanAppUrl}/dashboard/applications`;

  const adminApplicationUrl =
    `${cleanAppUrl}/admin/product-applications`;

  const from =
    process.env.EMAIL_FROM ||
    '달동네 출판사 <onboarding@resend.dev>';

  const priceLabel =
    formatProductApplicationPrice(
      payload.price,
      payload.billingType,
    );

  const addonNames =
    getProductApplicationAddonNames(
      payload.addonCodes,
    );

  const addonLabel =
    addonNames.length > 0
      ? addonNames.join(', ')
      : '선택 없음';

  const messageLabel =
    payload.customerMessage ||
    '-';

  if (customerEmail) {
    try {
      await resend.emails.send({
        from,
        to: customerEmail,

        subject:
          `[달동네] 상품 신청이 접수되었습니다 - ${payload.productName}`,

        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #24170f;">
            <h2 style="margin: 0 0 16px;">
              상품 신청이 접수되었습니다.
            </h2>

            <p style="margin: 0 0 18px;">
              ${escapeHtml(
                payload.customerName ||
                  '고객',
              )}님, 달동네 상품을 신청해 주셔서 감사합니다.
            </p>

            <p style="margin: 0 0 20px;">
              신청 내용을 확인한 뒤 전화 또는 이메일로 안내드리겠습니다.
              신청 단계에서는 비용이 결제되지 않습니다.
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
                    신청 당시 가격
                  </td>
                  <td style="padding: 10px; border: 1px solid #ead7b7;">
                    ${escapeHtml(
                      priceLabel,
                    )}
                  </td>
                </tr>

                <tr>
                  <td style="padding: 10px; border: 1px solid #ead7b7; font-weight: bold;">
                    추가 옵션
                  </td>
                  <td style="padding: 10px; border: 1px solid #ead7b7;">
                    ${escapeHtml(
                      addonLabel,
                    )}
                  </td>
                </tr>

                <tr>
                  <td style="padding: 10px; border: 1px solid #ead7b7; font-weight: bold;">
                    요청사항
                  </td>
                  <td style="padding: 10px; border: 1px solid #ead7b7; white-space: pre-line;">
                    ${escapeHtml(
                      messageLabel,
                    )}
                  </td>
                </tr>

                <tr>
                  <td style="padding: 10px; border: 1px solid #ead7b7; font-weight: bold;">
                    현재 상태
                  </td>
                  <td style="padding: 10px; border: 1px solid #ead7b7;">
                    상품 신청 접수
                  </td>
                </tr>
              </tbody>
            </table>

            <p style="margin: 24px 0 8px;">
              <a
                href="${escapeHtml(
                  customerApplicationUrl,
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
        '[PRODUCT_APPLICATION_CUSTOMER_EMAIL_SENT]',
        {
          applicationId:
            payload.applicationId,
        },
      );
    } catch (error) {
      console.error(
        '[PRODUCT_APPLICATION_CUSTOMER_EMAIL_ERROR]',
        error,
      );
    }
  }

  if (adminEmail) {
    try {
      await resend.emails.send({
        from,
        to: adminEmail,

        subject:
          `[달동네] 새 상품 신청 - ${payload.productName}`,

        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #24170f;">
            <h2 style="margin: 0 0 16px;">
              새 상품 신청이 접수되었습니다.
            </h2>

            <p style="margin: 0 0 20px;">
              달동네 관리자 화면에서 신청 내용을 확인해 주세요.
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
                    신청 당시 가격
                  </td>
                  <td style="padding: 10px; border: 1px solid #ead7b7;">
                    ${escapeHtml(
                      priceLabel,
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
                      customerEmail ||
                        '-',
                    )}
                  </td>
                </tr>

                <tr>
                  <td style="padding: 10px; border: 1px solid #ead7b7; font-weight: bold;">
                    추가 옵션
                  </td>
                  <td style="padding: 10px; border: 1px solid #ead7b7;">
                    ${escapeHtml(
                      addonLabel,
                    )}
                  </td>
                </tr>

                <tr>
                  <td style="padding: 10px; border: 1px solid #ead7b7; font-weight: bold;">
                    요청사항
                  </td>
                  <td style="padding: 10px; border: 1px solid #ead7b7; white-space: pre-line;">
                    ${escapeHtml(
                      messageLabel,
                    )}
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
        '[PRODUCT_APPLICATION_ADMIN_EMAIL_SENT]',
        {
          applicationId:
            payload.applicationId,
        },
      );
    } catch (error) {
      console.error(
        '[PRODUCT_APPLICATION_ADMIN_EMAIL_ERROR]',
        error,
      );
    }
  }
}

function getProductApplicationAddonNames(
  addonCodes: readonly string[],
) {
  return addonCodes.map(
    (addonCode) => {
      const addon =
        PRODUCT_ADDONS.find(
          (item) =>
            item.code === addonCode,
        );

      return addon?.name || addonCode;
    },
  );
}

function formatProductApplicationPrice(
  price: number,
  billingType: string,
) {
  const formattedPrice =
    price.toLocaleString('ko-KR');

  if (billingType === 'MONTHLY') {
    return `${formattedPrice}원 / 월`;
  }

  return `${formattedPrice}원부터`;
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


function cleanText(
  value: unknown,
) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function getStringArray(
  value: unknown,
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (
        item,
      ): item is string =>
        typeof item === 'string',
    )
    .map((item) => item.trim())
    .filter(Boolean);
}

function isValidEmail(
  email: string,
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email,
  );
}