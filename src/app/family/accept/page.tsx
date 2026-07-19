// src/app/family/accept/page.tsx
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { ReactNode } from 'react';

function normalizeEmail(
  email: string | null | undefined,
) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

function getSafeRole(role: string) {
  if (
    role === 'EDITOR' ||
    role === 'VIEWER'
  ) {
    return role;
  }

  return 'VIEWER';
}

async function acceptInvite(
  formData: FormData,
) {
  'use server';

  const token = String(
    formData.get('token') || '',
  ).trim();

  if (!token) {
    redirect('/');
  }

  const session = await auth();

  if (!session?.user?.id) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent(
        `/family/accept?token=${token}`,
      )}`,
    );
  }

  const invitation =
    await prisma.familyInvitation.findUnique({
      where: { token },
      include: { family: true },
    });

  if (
    !invitation ||
    invitation.usedAt ||
    invitation.expiresAt < new Date()
  ) {
    redirect(
      `/family/accept?token=${encodeURIComponent(
        token,
      )}`,
    );
  }

  const loginEmail = normalizeEmail(
    session.user.email,
  );
  const invitedEmail = normalizeEmail(
    invitation.email,
  );

  if (loginEmail !== invitedEmail) {
    redirect(
      `/family/accept?token=${encodeURIComponent(
        token,
      )}`,
    );
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
        role: getSafeRole(
          invitation.role,
        ),
      },
    }),

    prisma.familyInvitation.update({
      where: {
        id: invitation.id,
      },
      data: {
        usedAt: new Date(),
      },
    }),
  ]);

  redirect('/dashboard/family');
}

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{
    token?: string;
  }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <InviteStateCard
        eyebrow="초대 링크 확인"
        icon="!"
        title="유효하지 않은 초대 링크입니다."
        description={
          <>
            초대 링크에 필요한 정보가
            없습니다.
            <br />
            전달받은 주소 전체를 다시
            확인해주세요.
          </>
        }
        action={
          <Link
            href="/"
            className="invite-primary-button"
          >
            홈으로 이동
          </Link>
        }
      />
    );
  }

  const invitation =
    await prisma.familyInvitation.findUnique({
      where: { token },
      include: { family: true },
    });

  if (!invitation) {
    return (
      <InviteStateCard
        eyebrow="초대 링크 확인"
        icon="!"
        title="존재하지 않는 초대 링크입니다."
        description={
          <>
            초대 링크가 잘못되었거나
            삭제되었을 수 있습니다.
            <br />
            초대한 사람에게 새로운 링크를
            요청해주세요.
          </>
        }
        action={
          <Link
            href="/"
            className="invite-primary-button"
          >
            홈으로 이동
          </Link>
        }
      />
    );
  }

  if (invitation.usedAt) {
    return (
      <InviteStateCard
        eyebrow="초대 처리 완료"
        icon="✓"
        title="이미 사용된 초대 링크입니다."
        description={
          <>
            이미 가족 공간에 합류했거나
            초대 처리가 완료된 링크입니다.
          </>
        }
        action={
          <Link
            href="/dashboard/family"
            className="invite-primary-button"
          >
            가족 공간으로 이동
          </Link>
        }
      />
    );
  }

  if (
    invitation.expiresAt <
    new Date()
  ) {
    return (
      <InviteStateCard
        eyebrow="초대 기간 만료"
        icon="!"
        title="만료된 초대 링크입니다."
        description={
          <>
            초대 링크는 발송 후 48시간
            동안만 사용할 수 있습니다.
            <br />
            초대한 사람에게 다시 초대를
            요청해주세요.
          </>
        }
        action={
          <Link
            href="/"
            className="invite-primary-button"
          >
            홈으로 이동
          </Link>
        }
      />
    );
  }

  const session = await auth();

  if (!session?.user?.id) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent(
        `/family/accept?token=${token}`,
      )}`,
    );
  }

  const loginEmail = normalizeEmail(
    session.user.email,
  );
  const invitedEmail = normalizeEmail(
    invitation.email,
  );

  if (loginEmail !== invitedEmail) {
    return (
      <InviteStateCard
        eyebrow="로그인 계정 확인"
        icon="@"
        title="초대받은 이메일과 일치하지 않습니다."
        description={
          <>
            이 초대는
            <strong className="invite-highlight">
              {' '}
              {invitation.email}
            </strong>
            계정으로 발송되었습니다.
            <br />
            현재 로그인된 계정은
            <strong className="invite-highlight">
              {' '}
              {session.user.email}
            </strong>
            입니다.
          </>
        }
        notice="초대받은 이메일 계정으로 다시 로그인해주세요."
        action={
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(
              `/family/accept?token=${token}`,
            )}`}
            className="invite-primary-button"
          >
            다른 계정으로 로그인
          </Link>
        }
      />
    );
  }

  return (
    <InviteStateCard
      eyebrow="함께 기록하기"
      icon="✉"
      title="가족 공간 초대장이 도착했습니다."
      description={
        <>
          <strong className="invite-highlight">
            {invitation.family.name}
          </strong>
          에 초대되었습니다.
          <br />
          초대를 수락하면 함께 사진과
          이야기를 모을 수 있습니다.
        </>
      }
      notice="수락이 완료되면 가족 공간으로 자동 이동합니다."
      action={
        <form action={acceptInvite}>
          <input
            type="hidden"
            name="token"
            value={token}
          />

          <button
            type="submit"
            className="invite-primary-button invite-submit-button"
          >
            초대 수락하기
          </button>
        </form>
      }
    />
  );
}

function InviteStateCard({
  eyebrow,
  icon,
  title,
  description,
  action,
  notice,
}: {
  eyebrow: string;
  icon: string;
  title: string;
  description: ReactNode;
  action: ReactNode;
  notice?: string;
}) {
  return (
    <main className="invite-page">
      <style>{`
        .invite-page {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: 100vh;
          padding: 32px 20px;
          color: #49362c;
          background-color: #fffdf9;
          background-image:
            linear-gradient(
              rgba(220, 167, 136, 0.032) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(220, 167, 136, 0.032) 1px,
              transparent 1px
            );
          background-size: 32px 32px;
        }

        .invite-card {
          position: relative;
          overflow: hidden;
          width: 100%;
          max-width: 620px;
          padding: 42px;
          border-radius: 34px;
          border:
            1px solid
            rgba(218, 143, 108, 0.22);
          background:
            radial-gradient(
              circle at 92% 4%,
              rgba(255, 210, 190, 0.6),
              transparent 22rem
            ),
            radial-gradient(
              circle at 4% 100%,
              rgba(255, 241, 202, 0.5),
              transparent 20rem
            ),
            linear-gradient(
              145deg,
              #fff8f3 0%,
              #ffffff 56%,
              #fff1e8 100%
            );
          text-align: center;
          box-shadow:
            0 22px 60px
            rgba(156, 91, 58, 0.1);
        }

        .invite-eyebrow {
          margin: 0;
          color: #d67358;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.09em;
        }

        .invite-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 68px;
          height: 68px;
          margin-top: 22px;
          border-radius: 50%;
          border:
            1px solid
            rgba(218, 132, 96, 0.18);
          background:
            linear-gradient(
              135deg,
              #fff1e9,
              #ffe2d6
            );
          color: #d4674e;
          font-size: 27px;
          font-weight: 900;
          box-shadow:
            0 12px 28px
            rgba(211, 105, 77, 0.13);
        }

        .invite-title {
          margin: 23px 0 0;
          color: #49352b;
          font-family:
            'Noto Serif KR',
            serif;
          font-size:
            clamp(29px, 5vw, 39px);
          line-height: 1.35;
          letter-spacing: -0.045em;
          word-break: keep-all;
        }

        .invite-description {
          margin: 18px auto 0;
          max-width: 500px;
          color: #725d52;
          font-size: 16px;
          line-height: 1.85;
          word-break: keep-all;
        }

        .invite-highlight {
          color: #b75f47;
          font-weight: 900;
        }

        .invite-action {
          display: flex;
          justify-content: center;
          margin-top: 27px;
        }

        .invite-primary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 180px;
          min-height: 50px;
          padding: 0 24px;
          border: 0;
          border-radius: 999px;
          background:
            linear-gradient(
              135deg,
              #f49378,
              #e97861
            );
          color: #ffffff;
          font-size: 14px;
          font-weight: 900;
          text-decoration: none;
          cursor: pointer;
          box-shadow:
            0 11px 25px
            rgba(220, 104, 77, 0.2);
        }

        .invite-submit-button {
          font-family: inherit;
        }

        .invite-notice {
          margin: 17px 0 0;
          color: #907c70;
          font-size: 12px;
          line-height: 1.65;
        }

        .invite-security {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 9px;
          margin-top: 28px;
          padding-top: 22px;
          border-top:
            1px solid
            rgba(196, 139, 108, 0.16);
        }

        .invite-security-item {
          padding: 11px 8px;
          border-radius: 14px;
          background:
            rgba(255, 255, 255, 0.7);
          color: #80685c;
          font-size: 11px;
          font-weight: 800;
          line-height: 1.55;
        }

        @media (max-width: 600px) {
          .invite-page {
            padding: 18px 14px;
          }

          .invite-card {
            padding: 32px 18px;
            border-radius: 25px;
          }

          .invite-primary-button {
            width: 100%;
          }

          .invite-action,
          .invite-action form {
            width: 100%;
          }

          .invite-security {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <section className="invite-card">
        <p className="invite-eyebrow">
          {eyebrow}
        </p>

        <div className="invite-icon">
          {icon}
        </div>

        <h1 className="invite-title">
          {title}
        </h1>

        <p className="invite-description">
          {description}
        </p>

        <div className="invite-action">
          {action}
        </div>

        {notice ? (
          <p className="invite-notice">
            {notice}
          </p>
        ) : null}

        <div className="invite-security">
          <div className="invite-security-item">
            초대받은 계정 확인
          </div>

          <div className="invite-security-item">
            48시간 동안 유효
          </div>

          <div className="invite-security-item">
            수락 후 가족 공간 이동
          </div>
        </div>
      </section>
    </main>
  );
}