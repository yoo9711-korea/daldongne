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

export const runtime = 'nodejs';

type ProductApplicationRequestBody = {
  productCode?: unknown;
  addonCodes?: unknown;
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  message?: unknown;
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