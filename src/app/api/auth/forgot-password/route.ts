import {
  createHash,
  randomBytes,
} from 'node:crypto';

import { NextResponse } from 'next/server';
import { Resend } from 'resend';

import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RESET_TOKEN_MINUTES = 30;
const REQUEST_COOLDOWN_MS = 60_000;

const GENERIC_MESSAGE =
  '입력한 이메일로 가입된 계정이 있으면 비밀번호 재설정 안내를 보내드립니다.';

export async function POST(
  request: Request,
) {
  try {
    const body = await request
      .json()
      .catch(() => null);

    const email =
      typeof body?.email === 'string'
        ? body.email
            .trim()
            .toLowerCase()
        : '';

    if (
      !email ||
      email.length > 254 ||
      !EMAIL_PATTERN.test(email)
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '올바른 이메일 주소를 입력해 주세요.',
        },
        {
          status: 400,
        },
      );
    }

    const resendApiKey =
      process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.error(
        '[FORGOT_PASSWORD_CONFIG_ERROR] RESEND_API_KEY가 없습니다.',
      );

      return NextResponse.json(
        {
          ok: false,
          message:
            '현재 비밀번호 재설정 메일을 보낼 수 없습니다. 잠시 후 다시 시도해 주세요.',
        },
        {
          status: 503,
        },
      );
    }

    const user =
      await prisma.user.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
          name: true,
          email: true,
          passwordHash: true,
        },
      });

    /*
     * 가입 여부와 로그인 방식을 외부에
     * 노출하지 않기 위해 같은 응답을 반환합니다.
     */
    if (
      !user ||
      !user.email ||
      !user.passwordHash
    ) {
      return successResponse();
    }

    const latestToken =
      await prisma.passwordResetToken.findFirst(
        {
          where: {
            userId: user.id,
            usedAt: null,
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            createdAt: true,
          },
        },
      );

    if (
      latestToken &&
      Date.now() -
        latestToken.createdAt.getTime() <
        REQUEST_COOLDOWN_MS
    ) {
      return successResponse();
    }

    const rawToken =
      randomBytes(32).toString('hex');

    const tokenHash =
      createHash('sha256')
        .update(rawToken)
        .digest('hex');

    const now = new Date();

    const expiresAt = new Date(
      now.getTime() +
        RESET_TOKEN_MINUTES *
          60 *
          1000,
    );

    const transactionResult =
      await prisma.$transaction([
        prisma.passwordResetToken.updateMany(
          {
            where: {
              userId: user.id,
              usedAt: null,
            },
            data: {
              usedAt: now,
            },
          },
        ),

        prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash,
            expiresAt,
          },
          select: {
            id: true,
          },
        }),
      ]);

    const createdToken =
      transactionResult[1];

    const configuredBaseUrl =
      process.env.AUTH_URL ||
      process.env.NEXTAUTH_URL;

    const baseUrl = configuredBaseUrl
      ? configuredBaseUrl.replace(
          /\/+$/,
          '',
        )
      : new URL(request.url).origin;

    const resetUrl =
      `${baseUrl}/reset-password?token=` +
      encodeURIComponent(rawToken);

    const displayName =
      user.name?.trim() ||
      '회원';

    const resend =
      new Resend(resendApiKey);

    try {
      await resend.emails.send({
        from:
          process.env.EMAIL_FROM ||
          '달동네 출판사 <onboarding@resend.dev>',

        to: user.email,

        subject:
          '[달동네 출판사] 비밀번호 재설정 안내',

        text: [
          `${displayName}님, 안녕하세요.`,
          '',
          '비밀번호 재설정 요청이 접수되었습니다.',
          `아래 주소는 ${RESET_TOKEN_MINUTES}분 동안 한 번만 사용할 수 있습니다.`,
          '',
          resetUrl,
          '',
          '직접 요청하지 않았다면 이 메일을 무시해 주세요.',
        ].join('\n'),

        html: `
          <div style="max-width:560px;margin:0 auto;padding:32px;font-family:Arial,'Noto Sans KR',sans-serif;color:#2f2117;line-height:1.7;">
            <h1 style="margin:0 0 18px;font-size:24px;color:#5a3a18;">
              달동네 출판사
            </h1>

            <p style="margin:0 0 14px;">
              ${escapeHtml(displayName)}님, 안녕하세요.
            </p>

            <p style="margin:0 0 22px;">
              비밀번호 재설정 요청이 접수되었습니다.
              아래 버튼은 ${RESET_TOKEN_MINUTES}분 동안 한 번만 사용할 수 있습니다.
            </p>

            <p style="margin:0 0 24px;">
              <a
                href="${escapeHtml(resetUrl)}"
                style="display:inline-block;padding:13px 22px;border-radius:999px;background:#5a3a18;color:#fffaf0;text-decoration:none;font-weight:700;"
              >
                새 비밀번호 설정하기
              </a>
            </p>

            <p style="margin:0;font-size:13px;color:#756452;">
              직접 요청하지 않았다면 이 메일을 무시해 주세요.
              링크를 사용하지 않으면 기존 비밀번호는 변경되지 않습니다.
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      /*
       * 발송되지 않은 토큰은 사용할 수 없도록
       * 즉시 사용 완료 처리합니다.
       */
      await prisma.passwordResetToken
        .update({
          where: {
            id: createdToken.id,
          },
          data: {
            usedAt: new Date(),
          },
        })
        .catch(() => null);

      console.error(
        '[FORGOT_PASSWORD_EMAIL_ERROR]',
        emailError,
      );
    }

    return successResponse();
  } catch (error) {
    console.error(
      '[FORGOT_PASSWORD_ERROR]',
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          '비밀번호 재설정 요청을 처리하는 중 오류가 발생했습니다.',
      },
      {
        status: 500,
      },
    );
  }
}

function successResponse() {
  return NextResponse.json({
    ok: true,
    message: GENERIC_MESSAGE,
  });
}

function escapeHtml(
  value: string,
) {
  return value.replace(
    /[&<>"']/g,
    (character) => {
      const entities: Record<
        string,
        string
      > = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      };

      return entities[character];
    },
  );
}