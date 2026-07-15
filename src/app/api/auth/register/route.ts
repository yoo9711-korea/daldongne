import {
  Prisma,
} from '@prisma/client';
import { hash } from 'bcryptjs';
import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PASSWORD_LETTER_PATTERN =
  /[A-Za-z]/;

const PASSWORD_NUMBER_PATTERN =
  /[0-9]/;

const PASSWORD_SPECIAL_PATTERN =
  /[^A-Za-z0-9]/;

export async function POST(
  request: Request,
) {
  try {
    const body = await request
      .json()
      .catch(() => null);

    const name =
      typeof body?.name === 'string'
        ? body.name.trim()
        : '';

    const email =
      typeof body?.email === 'string'
        ? body.email
            .trim()
            .toLowerCase()
        : '';

    const password =
      typeof body?.password === 'string'
        ? body.password
        : '';

    const passwordConfirm =
      typeof body?.passwordConfirm ===
      'string'
        ? body.passwordConfirm
        : '';

       const termsAccepted =
      body?.termsAccepted === true;

    if (name.length < 2) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '이름은 2자 이상 입력해 주세요.',
        },
        {
          status: 400,
        },
      );
    }

    if (name.length > 50) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '이름은 50자 이하로 입력해 주세요.',
        },
        {
          status: 400,
        },
      );
    }

    if (
      !email ||
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

    if (email.length > 254) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '이메일 주소가 너무 깁니다.',
        },
        {
          status: 400,
        },
      );
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

    if (password !== passwordConfirm) {
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

      if (!termsAccepted) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '이용약관과 개인정보처리방침에 동의해 주세요.',
        },
        {
          status: 400,
        },
      );
    }

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
          passwordHash: true,
        },
      });

    if (existingUser) {
      return NextResponse.json(
        {
          ok: false,
          message:
            existingUser.passwordHash
              ? '이미 가입된 이메일입니다.'
              : '이미 소셜 로그인으로 가입된 이메일입니다. 기존 로그인 방식을 이용해 주세요.',
        },
        {
          status: 409,
        },
      );
    }

    const passwordHash =
      await hash(password, 12);

    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'USER',
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        message:
          '회원가입이 완료되었습니다.',
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '이미 가입된 이메일입니다.',
        },
        {
          status: 409,
        },
      );
    }

    console.error(
      '[AUTH_REGISTER_ERROR]',
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          '회원가입 처리 중 오류가 발생했습니다.',
      },
      {
        status: 500,
      },
    );
  }
}