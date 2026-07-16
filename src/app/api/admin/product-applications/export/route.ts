import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  Prisma,
  ProductionRequestStatus,
} from '@prisma/client';
import {
  NextRequest,
  NextResponse,
} from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const allowedStatuses = new Set<
  ProductionRequestStatus
>([
  'REQUESTED',
  'CONTACTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELED',
]);

export async function GET(
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

    const adminUser =
      await prisma.user.findUnique({
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
          message: '관리자 권한이 필요합니다.',
        },
        {
          status: 403,
        },
      );
    }

    const url = new URL(request.url);

    const query = cleanText(
      url.searchParams.get('q'),
      100,
    );

    const status = normalizeStatus(
      url.searchParams.get('status'),
    );

    const where =
      buildProductApplicationWhere(
        query,
        status,
      );

    const applications =
      await prisma.productApplication.findMany(
        {
          where,
          orderBy: {
            createdAt: 'desc',
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
            message: true,
            addonCodes: true,
            adminNote: true,
            adminNoteUpdatedAt: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      );

    const header = [
      '신청번호',
      '접수일',
      '최근수정일',
      '상품코드',
      '상품명',
      '상품구분',
      '결제방식',
      '신청가격',
      '처리상태',
      '신청자명',
      '전화번호',
      '신청이메일',
      '회원명',
      '회원이메일',
      '선택옵션',
      '요청사항',
      '관리자메모',
      '메모수정일',
    ];

    const rows = applications.map(
      (application) => [
        application.id,
        formatDateTime(
          application.createdAt,
        ),
        formatDateTime(
          application.updatedAt,
        ),
        application.productCode,
        application.productName,
        getCategoryLabel(
          application.category,
        ),
        getBillingTypeLabel(
          application.billingType,
        ),
        application.price,
        getStatusLabel(
          application.status,
        ),
        application.name || '',
        application.phone || '',
        application.email || '',
        application.user.name || '',
        application.user.email || '',
        formatAddonCodes(
          application.addonCodes,
        ),
        application.message || '',
        application.adminNote || '',
        application.adminNoteUpdatedAt
          ? formatDateTime(
              application.adminNoteUpdatedAt,
            )
          : '',
      ],
    );

    const csvLines = [
      header,
      ...rows,
    ].map((row) =>
      row
        .map((value) =>
          escapeCsvValue(value),
        )
        .join(','),
    );

    const csv =
      `\uFEFF${csvLines.join('\r\n')}`;

    const dateText = formatFileDate(
      new Date(),
    );

    const filename =
      `daldongne-product-applications-${dateText}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type':
          'text/csv; charset=utf-8',
        'Content-Disposition':
          `attachment; filename="${filename}"`,
        'Cache-Control':
          'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error(
      '[PRODUCT_APPLICATION_EXPORT_ERROR]',
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          '상품 신청 자료를 다운로드하지 못했습니다.',
      },
      {
        status: 500,
      },
    );
  }
}

function buildProductApplicationWhere(
  query: string,
  status:
    | ProductionRequestStatus
    | undefined,
): Prisma.ProductApplicationWhereInput {
  const where:
    Prisma.ProductApplicationWhereInput =
    {};

  if (status) {
    where.status = status;
  }

  if (query) {
    where.OR = [
      {
        productName: {
          contains: query,
          mode: 'insensitive',
        },
      },
      {
        productCode: {
          contains: query,
          mode: 'insensitive',
        },
      },
      {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      {
        phone: {
          contains: query,
          mode: 'insensitive',
        },
      },
      {
        email: {
          contains: query,
          mode: 'insensitive',
        },
      },
      {
        message: {
          contains: query,
          mode: 'insensitive',
        },
      },
      {
        adminNote: {
          contains: query,
          mode: 'insensitive',
        },
      },
      {
        user: {
          is: {
            OR: [
              {
                name: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
              {
                email: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
            ],
          },
        },
      },
    ];
  }

  return where;
}

function normalizeStatus(
  value: string | null,
):
  | ProductionRequestStatus
  | undefined {
  const status = cleanText(
    value,
    30,
  ).toUpperCase() as
    ProductionRequestStatus;

  if (!allowedStatuses.has(status)) {
    return undefined;
  }

  return status;
}

function cleanText(
  value: unknown,
  maxLength: number,
) {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .trim()
    .slice(0, maxLength);
}

function escapeCsvValue(
  value: unknown,
) {
  let text =
    value === null ||
    value === undefined
      ? ''
      : String(value);

  /*
   * 엑셀 수식 실행을 방지합니다.
   */
  if (/^[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replace(
    /"/g,
    '""',
  )}"`;
}

function formatAddonCodes(
  value: Prisma.JsonValue | null,
) {
  if (!value) {
    return '';
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }

        return JSON.stringify(item);
      })
      .join(' / ');
  }

  if (typeof value === 'string') {
    return value;
  }

  return JSON.stringify(value);
}

function getStatusLabel(
  status: ProductionRequestStatus,
) {
  if (status === 'REQUESTED') {
    return '새로운 접수';
  }

  if (status === 'CONTACTED') {
    return '연락 완료';
  }

  if (status === 'IN_PROGRESS') {
    return '진행 중';
  }

  if (status === 'COMPLETED') {
    return '처리 완료';
  }

  if (status === 'CANCELED') {
    return '신청 취소';
  }

  return status;
}

function getCategoryLabel(
  category: string,
) {
  if (category === 'LIFE_BOOK') {
    return '인생책';
  }

  if (
    category === 'MONTHLY_RECORD'
  ) {
    return '월간기록';
  }

  return category;
}

function getBillingTypeLabel(
  billingType: string,
) {
  if (billingType === 'MONTHLY') {
    return '월 결제';
  }

  if (billingType === 'ONE_TIME') {
    return '일회 결제';
  }

  return billingType;
}

function formatDateTime(
  date: Date,
) {
  return new Intl.DateTimeFormat(
    'ko-KR',
    {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    },
  ).format(date);
}

function formatFileDate(
  date: Date,
) {
  const parts =
    new Intl.DateTimeFormat(
      'en-CA',
      {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      },
    ).formatToParts(date);

  const year =
    parts.find(
      (part) => part.type === 'year',
    )?.value || '0000';

  const month =
    parts.find(
      (part) => part.type === 'month',
    )?.value || '00';

  const day =
    parts.find(
      (part) => part.type === 'day',
    )?.value || '00';

  return `${year}-${month}-${day}`;
}