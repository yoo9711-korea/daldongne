import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const globalForReviewRateLimit = globalThis as unknown as {
  customerReviewRateLimit?: Map<string, RateLimitEntry>;
};

const reviewRateLimit =
  globalForReviewRateLimit.customerReviewRateLimit ??
  new Map<string, RateLimitEntry>();

if (process.env.NODE_ENV !== 'production') {
  globalForReviewRateLimit.customerReviewRateLimit =
    reviewRateLimit;
}

type CustomerReviewRequest = {
  displayName?: unknown;
  email?: unknown;
  orderReference?: unknown;
  title?: unknown;
  content?: unknown;
  rating?: unknown;
  privacyAgreed?: unknown;
  website?: unknown;
};

function normalizeString(value: unknown) {
  return typeof value === 'string'
    ? value.trim()
    : '';
}

function maskDisplayName(name: string) {
  const characters = Array.from(name.trim());

  if (characters.length === 0) {
    return '고객';
  }

  if (characters.length === 1) {
    return `${characters[0]}○○`;
  }

  const maskLength = Math.min(
    Math.max(characters.length - 1, 1),
    2,
  );

  return `${characters[0]}${'○'.repeat(maskLength)}`;
}

function getClientIp(request: NextRequest) {
  const forwardedFor =
    request.headers.get('x-forwarded-for');

  if (forwardedFor) {
    return forwardedFor
      .split(',')[0]
      ?.trim() || 'unknown';
  }

  return (
    request.headers.get('x-real-ip')?.trim() ||
    'unknown'
  );
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const existing = reviewRateLimit.get(ip);

  if (!existing || existing.resetAt <= now) {
    reviewRateLimit.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });

    return false;
  }

  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  existing.count += 1;
  reviewRateLimit.set(ip, existing);

  return false;
}

function validationError(message: string) {
  return NextResponse.json(
    {
      ok: false,
      message,
    },
    {
      status: 400,
    },
  );
}

export async function GET() {
  try {
    const reviews =
      await prisma.customerReview.findMany({
        where: {
          status: 'APPROVED',
          isVisible: true,
        },
        orderBy: [
          {
            isFeatured: 'desc',
          },
          {
            approvedAt: 'desc',
          },
          {
            createdAt: 'desc',
          },
        ],
        take: 12,
        select: {
          id: true,
          displayName: true,
          title: true,
          content: true,
          rating: true,
          isFeatured: true,
          approvedAt: true,
          createdAt: true,
        },
      });

    const publicReviews = reviews.map((review) => ({
      id: review.id,
      displayName: maskDisplayName(
        review.displayName,
      ),
      title: review.title,
      content: review.content,
      rating: review.rating,
      isFeatured: review.isFeatured,
      publishedAt:
        review.approvedAt ?? review.createdAt,
    }));

    return NextResponse.json(
      {
        ok: true,
        reviews: publicReviews,
      },
      {
        status: 200,
        headers: {
          'Cache-Control':
            'no-store, max-age=0',
        },
      },
    );
  } catch (error) {
    console.error(
      '고객 후기 조회 중 오류가 발생했습니다.',
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          '고객 후기를 불러오지 못했습니다.',
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(
  request: NextRequest,
) {
  try {
    const ip = getClientIp(request);

    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '후기 등록 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
        },
        {
          status: 429,
        },
      );
    }

    let body: CustomerReviewRequest;

    try {
      body =
        (await request.json()) as CustomerReviewRequest;
    } catch {
      return validationError(
        '올바른 후기 정보를 입력해 주세요.',
      );
    }

    const displayName = normalizeString(
      body.displayName,
    );
    const email = normalizeString(
      body.email,
    ).toLowerCase();
    const orderReference = normalizeString(
      body.orderReference,
    );
    const title = normalizeString(body.title);
    const content = normalizeString(body.content);
    const website = normalizeString(body.website);

    const rating =
      typeof body.rating === 'number'
        ? body.rating
        : Number(body.rating);

    /*
     * 일반 사용자에게 보이지 않는 입력칸입니다.
     * 자동화 프로그램이 값을 입력하면 정상 요청으로
     * 보이게 응답하되 실제 DB에는 저장하지 않습니다.
     */
    if (website) {
      return NextResponse.json(
        {
          ok: true,
          message:
            '후기가 정상적으로 접수되었습니다.',
        },
        {
          status: 201,
        },
      );
    }

    if (
      displayName.length < 2 ||
      displayName.length > 30
    ) {
      return validationError(
        '이름 또는 닉네임은 2자 이상 30자 이하로 입력해 주세요.',
      );
    }

    if (
      email.length > 254 ||
      !EMAIL_PATTERN.test(email)
    ) {
      return validationError(
        '확인 가능한 이메일 주소를 입력해 주세요.',
      );
    }

    if (orderReference.length > 80) {
      return validationError(
        '주문번호 또는 상담번호는 80자 이하로 입력해 주세요.',
      );
    }

    if (title.length > 80) {
      return validationError(
        '후기 제목은 80자 이하로 입력해 주세요.',
      );
    }

    if (
      content.length < 20 ||
      content.length > 1000
    ) {
      return validationError(
        '후기 내용은 20자 이상 1,000자 이하로 입력해 주세요.',
      );
    }

    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return validationError(
        '별점은 1점부터 5점 사이로 선택해 주세요.',
      );
    }

    if (body.privacyAgreed !== true) {
      return validationError(
        '후기 등록과 개인정보 처리에 동의해 주세요.',
      );
    }

    const duplicateSince = new Date(
      Date.now() - 10 * 60 * 1000,
    );

    const duplicateReview =
      await prisma.customerReview.findFirst({
        where: {
          email,
          content,
          createdAt: {
            gte: duplicateSince,
          },
        },
        select: {
          id: true,
        },
      });

    if (duplicateReview) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '같은 내용의 후기가 이미 접수되었습니다.',
        },
        {
          status: 409,
        },
      );
    }

    const review =
      await prisma.customerReview.create({
        data: {
          displayName,
          email,
          orderReference:
            orderReference || null,
          title: title || null,
          content,
          rating,
          status: 'PENDING',
          isFeatured: false,
          isVisible: true,
          privacyAgreedAt: new Date(),
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
        },
      });

    return NextResponse.json(
      {
        ok: true,
        message:
          '후기가 접수되었습니다. 관리자 확인 후 홈페이지에 공개됩니다.',
        review: {
          id: review.id,
          status: review.status,
          createdAt: review.createdAt,
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      '고객 후기 등록 중 오류가 발생했습니다.',
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          '후기를 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      },
      {
        status: 500,
      },
    );
  }
}