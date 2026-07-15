import { PrismaAdapter } from '@auth/prisma-adapter';
import { compare } from 'bcryptjs';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import Kakao from 'next-auth/providers/kakao';
import Naver from 'next-auth/providers/naver';

import { prisma } from '@/lib/prisma';

export const {
  handlers,
  signIn,
  signOut,
  auth,
} = NextAuth({
  debug: false,

  adapter: PrismaAdapter(
    prisma as never,
  ),

  providers: [
    Credentials({
      name: '이메일 로그인',

      credentials: {
        email: {
          label: '이메일',
          type: 'email',
        },
        password: {
          label: '비밀번호',
          type: 'password',
        },
      },

      async authorize(credentials) {
        const email =
          typeof credentials?.email ===
          'string'
            ? credentials.email
                .trim()
                .toLowerCase()
            : '';

        const password =
          typeof credentials?.password ===
          'string'
            ? credentials.password
            : '';

        if (
          !email ||
          !password
        ) {
          return null;
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
              image: true,
              passwordHash: true,
              role: true,
            },
          });

        if (
          !user ||
          !user.passwordHash
        ) {
          return null;
        }

        const passwordMatches =
          await compare(
            password,
            user.passwordHash,
          );

        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),

    Kakao({
      clientId:
        process.env.KAKAO_CLIENT_ID!,
      clientSecret:
        process.env
          .KAKAO_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking:
        true,
    }),

    Google({
      clientId:
        process.env.GOOGLE_CLIENT_ID!,
      clientSecret:
        process.env
          .GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking:
        true,
    }),

    Naver({
      clientId:
        process.env.NAVER_CLIENT_ID!,
      clientSecret:
        process.env
          .NAVER_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking:
        true,
    }),
  ],

  session: {
    strategy: 'jwt',
  },

  pages: {
    signIn: '/login',
  },

  callbacks: {
    async jwt({
      token,
      user,
    }) {
      if (user) {
        token.id = user.id;

        const dbUser =
          await prisma.user.findUnique({
            where: {
              id: user.id,
            },
            select: {
              role: true,
            },
          });

        token.role =
          dbUser?.role ?? 'USER';
      }

      return token;
    },

    async session({
      session,
      token,
    }) {
      if (session.user) {
        if (token.id) {
          session.user.id =
            token.id as string;
        }

        session.user.role =
          typeof token.role === 'string'
            ? token.role
            : 'USER';
      }

      return session;
    },
  },
});