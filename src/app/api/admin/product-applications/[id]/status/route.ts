import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  ProductionRequestStatus,
} from '@prisma/client';
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

    console.info(
      '[PRODUCT_APPLICATION_STATUS_UPDATED]',
      {
        applicationId:
          updatedApplication.id,
        productCode:
          updatedApplication.productCode,
        previousStatus:
          existingApplication.status,
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