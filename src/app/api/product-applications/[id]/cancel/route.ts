import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  NextRequest,
  NextResponse,
} from 'next/server';

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
          createdAt: true,
          updatedAt: true,
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