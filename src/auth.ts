// src/auth.ts
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Kakao from 'next-auth/providers/kakao';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

export const { handlers, signIn, signOut, auth } = NextAuth({
  // PrismaAdapter가 User/Account/Session 테이블에 직접 읽고 쓴다.
  // 즉, 로그인 성공 시 실제로 PostgreSQL에 사용자 행이 생성된다 (가짜 로그인 아님).
  adapter: PrismaAdapter(prisma),

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Kakao({
      clientId: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET,
    }),

    // ---- Apple 로그인 (추후 활성화) ----
    // Apple은 유료 Apple Developer Program 가입(연 99달러)과
    // Services ID, Key ID, Team ID, .p8 개인키로 client secret을 직접 생성해야 합니다.
    // 준비되면 아래 주석을 해제하고 .env에 값을 채워주세요.
    //
    // Apple({
    //   clientId: process.env.APPLE_CLIENT_ID,
    //   clientSecret: process.env.APPLE_CLIENT_SECRET, // 직접 서명한 JWT
    // }),
  ],

  session: {
    strategy: 'database', // DB에 세션을 저장 — 가족 초대/권한관리 같은 서버 로직과 궁합이 좋음
  },

  pages: {
    signIn: '/login',
  },

  callbacks: {
    // 세션 객체에 user.id를 노출시켜, 서버 컴포넌트/API에서 바로 사용할 수 있게 한다.
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
