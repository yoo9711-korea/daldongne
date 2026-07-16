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

type AdminNoteRequestBody = {
  note?: unknown;
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

    if (adminUser?.role !== 'ADMIN') {
      return NextResponse.json(
        {
          ok: false,
          message:
            '관리자만 내부 메모를 저장할 수 있습니다.',
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
        .catch(() => null)) as
        | AdminNoteRequestBody
        | null;

    if (
      body?.note !== undefined &&
      typeof body.note !== 'string'
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '내부 메모 내용을 확인해 주세요.',
        },
        {
          status: 400,
        },
      );
    }

    const note =
      typeof body?.note === 'string'
        ? body.note.trim()
        : '';

    if (note.length > 5000) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '내부 메모는 5,000자 이내로 입력해 주세요.',
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

    const updatedApplication =
      await prisma.productApplication.update({
        where: {
          id: applicationId,
        },
        data: {
          adminNote:
            note || null,
          adminNoteUpdatedAt:
            note
              ? new Date()
              : null,
        },
        select: {
          id: true,
          productCode: true,
          productName: true,
          adminNote: true,
          adminNoteUpdatedAt: true,
          updatedAt: true,
        },
      });

    console.info(
      '[PRODUCT_APPLICATION_ADMIN_NOTE_UPDATED]',
      {
        applicationId:
          updatedApplication.id,
        productCode:
          updatedApplication.productCode,
        hasNote:
          Boolean(
            updatedApplication.adminNote,
          ),
        adminUserId: userId,
      },
    );

    return NextResponse.json({
      ok: true,
      application:
        updatedApplication,
      message: note
        ? '관리자 내부 메모가 저장되었습니다.'
        : '관리자 내부 메모가 삭제되었습니다.',
    });
  } catch (error) {
    console.error(
      '[PRODUCT_APPLICATION_ADMIN_NOTE_ERROR]',
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          '관리자 내부 메모 저장 중 오류가 발생했습니다.',
      },
      {
        status: 500,
      },
    );
  }
}