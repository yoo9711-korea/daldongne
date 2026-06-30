// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// Next.js dev 모드는 파일이 바뀔 때마다 모듈을 다시 로드합니다.
// 매번 새 PrismaClient를 만들면 DB 커넥션이 누적되어 고갈되므로,
// globalThis에 캐싱해서 동일 인스턴스를 재사용합니다.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
