// src/app/family/accept/page.tsx
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <main className="page" style={{ textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-display)' }}>유효하지 않은 초대링크입니다.</h1>
        <Link href="/" className="btn btn--gold" style={{ marginTop: 24, display: 'inline-flex' }}>홈으로</Link>
      </main>
    );
  }

  // 토큰 확인
  const invitation = await prisma.familyInvitation.findUnique({
    where: { token },
    include: { family: true },
  });

  if (!invitation || invitation.usedAt || invitation.expiresAt < new Date()) {
    return (
      <main className="page" style={{ textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-display)' }}>만료된 초대링크입니다.</h1>
        <p style={{ color: 'var(--ink-soft)' }}>초대링크는 48시간 후 만료됩니다. 다시 초대를 요청해주세요.</p>
        <Link href="/" className="btn btn--gold" style={{ marginTop: 24, display: 'inline-flex' }}>홈으로</Link>
      </main>
    );
  }

  const session = await auth();

  // 로그인 안 된 경우 → 로그인 후 돌아오게
  if (!session?.user) {
    redirect(`/login?callbackUrl=/family/accept?token=${token}`);
  }

  // 이메일 불일치 확인
  if (session.user.email !== invitation.email) {
    return (
      <main className="page" style={{ textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
        <div className="dash-card">
          <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 12 }}>이메일이 일치하지 않습니다</h2>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>
            이 초대는 <strong>{invitation.email}</strong> 계정으로 발송됐습니다.<br />
            현재 로그인된 계정: <strong>{session.user.email}</strong>
          </p>
          <Link href="/login" className="btn btn--gold btn--sm" style={{ marginTop: 16, display: 'inline-flex' }}>
            다른 계정으로 로그인
          </Link>
        </div>
      </main>
    );
  }

  // 초대 수락 처리
  await prisma.$transaction([
    prisma.familyMember.upsert({
      where: {
        familyId_userId: {
          familyId: invitation.familyId,
          userId: session.user.id,
        },
      },
      update: {},
      create: {
        familyId: invitation.familyId,
        userId: session.user.id,
        role: invitation.role,
      },
    }),
    prisma.familyInvitation.update({
      where: { id: invitation.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return (
    <main className="page" style={{ textAlign: 'center' }}>
      <div className="dash-card" style={{ maxWidth: 480, margin: '0 auto' }}>
        <p style={{ fontSize: 32, marginBottom: 16 }}>🎉</p>
        <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 12 }}>
          "{invitation.family.name}" 가족 공간에 합류했습니다!
        </h2>
        <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 24 }}>
          이제 가족의 기억을 함께 기록할 수 있어요.
        </p>
        <Link href="/dashboard/family" className="btn btn--gold">
          가족 공간 바로 가기
        </Link>
      </div>
    </main>
  );
}