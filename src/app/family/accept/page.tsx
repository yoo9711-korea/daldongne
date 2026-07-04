// src/app/family/accept/page.tsx
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';

function normalizeEmail(email: string | null | undefined) {
  return String(email || '').trim().toLowerCase();
}

function getSafeRole(role: string) {
  if (role === 'EDITOR' || role === 'VIEWER') {
    return role;
  }

  return 'VIEWER';
}

async function acceptInvite(formData: FormData) {
  'use server';

  const token = String(formData.get('token') || '').trim();

  if (!token) {
    redirect('/');
  }

  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/family/accept?token=${token}`)}`);
  }

  const invitation = await prisma.familyInvitation.findUnique({
    where: { token },
    include: { family: true },
  });

  if (!invitation || invitation.usedAt || invitation.expiresAt < new Date()) {
    redirect(`/family/accept?token=${encodeURIComponent(token)}`);
  }

  const loginEmail = normalizeEmail(session.user.email);
  const invitedEmail = normalizeEmail(invitation.email);

  if (loginEmail !== invitedEmail) {
    redirect(`/family/accept?token=${encodeURIComponent(token)}`);
  }

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
        role: getSafeRole(invitation.role),
      },
    }),

    prisma.familyInvitation.update({
      where: { id: invitation.id },
      data: { usedAt: new Date() },
    }),
  ]);

  redirect('/dashboard/family');
}

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <main className="page" style={{ textAlign: 'center' }}>
        <div className="dash-card" style={{ maxWidth: 480, margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: 12 }}>
            유효하지 않은 초대링크입니다.
          </h1>

          <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 24 }}>
            초대 링크에 필요한 정보가 없습니다.
          </p>

          <Link href="/" className="btn btn--gold">
            홈으로
          </Link>
        </div>
      </main>
    );
  }

  const invitation = await prisma.familyInvitation.findUnique({
    where: { token },
    include: { family: true },
  });

  if (!invitation) {
    return (
      <main className="page" style={{ textAlign: 'center' }}>
        <div className="dash-card" style={{ maxWidth: 480, margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: 12 }}>
            존재하지 않는 초대링크입니다.
          </h1>

          <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 24 }}>
            초대 링크가 잘못되었거나 삭제되었을 수 있습니다.
          </p>

          <Link href="/" className="btn btn--gold">
            홈으로
          </Link>
        </div>
      </main>
    );
  }

  if (invitation.usedAt) {
    return (
      <main className="page" style={{ textAlign: 'center' }}>
        <div className="dash-card" style={{ maxWidth: 480, margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: 12 }}>
            이미 사용된 초대링크입니다.
          </h1>

          <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 24 }}>
            이미 가족 공간에 합류했거나 사용이 완료된 링크입니다.
          </p>

          <Link href="/dashboard/family" className="btn btn--gold">
            가족 공간으로 이동
          </Link>
        </div>
      </main>
    );
  }

  if (invitation.expiresAt < new Date()) {
    return (
      <main className="page" style={{ textAlign: 'center' }}>
        <div className="dash-card" style={{ maxWidth: 480, margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: 12 }}>
            만료된 초대링크입니다.
          </h1>

          <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 24 }}>
            초대링크는 48시간 후 만료됩니다. 다시 초대를 요청해주세요.
          </p>

          <Link href="/" className="btn btn--gold">
            홈으로
          </Link>
        </div>
      </main>
    );
  }

  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/family/accept?token=${token}`)}`);
  }

  const loginEmail = normalizeEmail(session.user.email);
  const invitedEmail = normalizeEmail(invitation.email);

  if (loginEmail !== invitedEmail) {
    return (
      <main className="page" style={{ textAlign: 'center' }}>
        <div className="dash-card" style={{ maxWidth: 520, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 12 }}>
            이메일이 일치하지 않습니다
          </h2>

          <p style={{ color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.7 }}>
            이 초대는 <strong>{invitation.email}</strong> 계정으로 발송됐습니다.
            <br />
            현재 로그인된 계정: <strong>{session.user.email}</strong>
          </p>

          <Link
            href={`/login?callbackUrl=${encodeURIComponent(`/family/accept?token=${token}`)}`}
            className="btn btn--gold btn--sm"
            style={{ marginTop: 20, display: 'inline-flex' }}
          >
            다른 계정으로 로그인
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page" style={{ textAlign: 'center' }}>
      <div className="dash-card" style={{ maxWidth: 520, margin: '0 auto' }}>
        <p style={{ fontSize: 32, marginBottom: 16 }}>✉️</p>

        <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: 12 }}>
          가족 공간 초대장
        </h1>

        <p style={{ color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
          <strong>{invitation.family.name}</strong> 가족 공간에 초대되었습니다.
          <br />
          수락하면 가족의 사진, 인터뷰, 기억 기록을 함께 볼 수 있습니다.
        </p>

        <form action={acceptInvite}>
          <input type="hidden" name="token" value={token} />

          <button type="submit" className="btn btn--gold">
            초대 수락하기
          </button>
        </form>

        <p style={{ color: 'var(--ink-faint)', fontSize: 12, marginTop: 16 }}>
          수락 후 가족 공간으로 이동합니다.
        </p>
      </div>
    </main>
  );
}