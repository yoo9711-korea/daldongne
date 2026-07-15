import {
  createHash,
} from 'node:crypto';

import { hash } from 'bcryptjs';
import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const RESET_TOKEN_PATTERN =
  /^[a-f0-9]{64}$/i;

const PASSWORD_LETTER_PATTERN =
  /[A-Za-z]/;

const PASSWORD_NUMBER_PATTERN =
  /[0-9]/;

const PASSWORD_SPECIAL_PATTERN =
  /[^A-Za-z0-9]/;

const INVALID_TOKEN_MESSAGE =
  '비밀번호 재설정 링크가 유효하지 않거나 만료되었습니다. 재설정 메일을 다시 요청해 주세요.';

class InvalidResetTokenError extends Error {
  constructor() {
    super('INVALID_RESET_TOKEN');
    this.name =
      'InvalidResetTokenError';
  }
}

export async function POST(
  request: Request,
) {
  try {
    const body = await request
      .json()
      .catch(() => null);

    const token =
      typeof body?.token === 'string'
        ? body.token.trim()
        : '';

    const password =
      typeof body?.password ===
      'string'
        ? body.password
        : '';

    const passwordConfirm =
      typeof body?.passwordConfirm ===
      'string'
        ? body.passwordConfirm
        : '';

    if (
      !token ||
      !RESET_TOKEN_PATTERN.test(token)
    ) {
      return invalidTokenResponse();
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '비밀번호는 8자 이상 입력해 주세요.',
        },
        {
          status: 400,
        },
      );
    }

    if (password.length > 72) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '비밀번호는 72자 이하로 입력해 주세요.',
        },
        {
          status: 400,
        },
      );
    }

    if (
      !PASSWORD_LETTER_PATTERN.test(
        password,
      ) ||
      !PASSWORD_NUMBER_PATTERN.test(
        password,
      ) ||
      !PASSWORD_SPECIAL_PATTERN.test(
        password,
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '비밀번호는 영문, 숫자, 특수문자를 각각 1개 이상 포함해 주세요.',
        },
        {
          status: 400,
        },
      );
    }

    if (
      password !== passwordConfirm
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '비밀번호와 비밀번호 확인이 일치하지 않습니다.',
        },
        {
          status: 400,
        },
      );
    }

    const tokenHash =
      createHash('sha256')
        .update(token)
        .digest('hex');

    const now = new Date();

    const tokenRecord =
      await prisma.passwordResetToken
        .findUnique({
          where: {
            tokenHash,
          },
          select: {
            id: true,
            userId: true,
            expiresAt: true,
            usedAt: true,
          },
        });

    if (
      !tokenRecord ||
      tokenRecord.usedAt ||
      tokenRecord.expiresAt <= now
    ) {
      return invalidTokenResponse();
    }

    const passwordHash =
      await hash(password, 12);

    try {
      await prisma.$transaction(
        async (tx) => {
          /*
           * 같은 링크가 동시에 두 번 사용되더라도
           * 한 요청만 성공하도록 먼저 토큰을 선점합니다.
           */
          const consumedToken =
            await tx.passwordResetToken
              .updateMany({
                where: {
                  id: tokenRecord.id,
                  userId:
                    tokenRecord.userId,
                  usedAt: null,
                  expiresAt: {
                    gt: now,
                  },
                },
                data: {
                  usedAt: now,
                },
              });

          if (
            consumedToken.count !== 1
          ) {
            throw new InvalidResetTokenError();
          }

          await tx.user.update({
            where: {
              id: tokenRecord.userId,
            },
            data: {
              passwordHash,
            },
          });

          /*
           * 같은 회원에게 발급된 나머지
           * 미사용 재설정 링크도 함께 무효화합니다.
           */
          await tx.passwordResetToken
            .updateMany({
              where: {
                userId:
                  tokenRecord.userId,
                usedAt: null,
              },
              data: {
                usedAt: now,
              },
            });
        },
      );
    } catch (error) {
      if (
        error instanceof
        InvalidResetTokenError
      ) {
        return invalidTokenResponse();
      }

      throw error;
    }

    return NextResponse.json({
      ok: true,
      message:
        '비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.',
    });
  } catch (error) {
    console.error(
      '[RESET_PASSWORD_ERROR]',
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          '비밀번호를 변경하는 중 오류가 발생했습니다.',
      },
      {
        status: 500,
      },
    );
  }
}

function invalidTokenResponse() {
  return NextResponse.json(
    {
      ok: false,
      message:
        INVALID_TOKEN_MESSAGE,
    },
    {
      status: 400,
    },
  );
}