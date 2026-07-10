// src/app/dashboard/family/page.tsx
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import FamilyClient from './FamilyClient';

export default async function FamilyPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id;
  const now = new Date();

  const membership = await prisma.familyMember.findFirst({
    where: { userId },
    include: {
      family: {
        include: {
          members: {
            include: { user: true },
            orderBy: { joinedAt: 'asc' },
          },
          invitations: {
            where: {
              usedAt: null,
              expiresAt: { gt: now },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  });

  async function createFamily(formData: FormData) {
    'use server';

    const session = await auth();

    if (!session?.user?.id) {
      redirect('/login');
    }

    const name = String(formData.get('name') || '').trim();

    if (!name) {
      return;
    }

    await prisma.family.create({
      data: {
        name,
        members: {
          create: {
            userId: session.user.id,
            role: 'OWNER',
          },
        },
      },
    });

    revalidatePath('/dashboard/family');
  }

  return (
    <main className="page">
      <div className="runninghead">
        <span className="runninghead__chapter">FAMILY</span>
        <span className="runninghead__rule"></span>
        <span style={{ color: 'var(--ink-soft)' }}>가족 공간</span>
      </div>

      <h1 className="dash-greeting">가족이 함께 사진과 이야기를 모읍니다</h1>

      <p
        style={{
          color: 'var(--ink-soft)',
          marginBottom: 32,
          fontSize: 18,
          lineHeight: 1.75,
          maxWidth: 760,
        }}
      >
        부모님의 인생책은 혼자보다 가족이 함께 만들 때 더 풍성해집니다.
        형제, 자녀, 배우자를 초대해 각자가 기억하는 사진과 이야기를 함께 남겨보세요.
      </p>

      {!membership ? (
        <div className="dash-card" style={{ maxWidth: 620 }}>
          <p className="dash-card__label">아직 가족 공간이 없습니다</p>

          <h2
            style={{
              margin: '10px 0 0',
              fontFamily: 'Noto Serif KR, serif',
              fontSize: 30,
              lineHeight: 1.35,
              color: 'var(--ink)',
            }}
          >
            우리 가족의 인생책 작업실을 만들어보세요.
          </h2>

          <p
            style={{
              color: 'var(--ink-soft)',
              fontSize: 17,
              lineHeight: 1.75,
              marginTop: 14,
              marginBottom: 20,
            }}
          >
            가족 공간을 만들면 부모님 사진, 기억나는 이야기, 인터뷰 답변을
            가족과 함께 모을 수 있습니다. 가족마다 기억하는 장면이 다르기 때문에
            함께 기록할수록 책의 내용이 더 따뜻해집니다.
          </p>

          <form
            action={createFamily}
            style={{
              display: 'flex',
              gap: 10,
              marginTop: 14,
            }}
          >
            <input
              type="text"
              name="name"
              placeholder="예: 유씨 가족 인생책"
              required
              style={{
                flex: 1,
                height: 48,
                border: '1px solid rgba(34,28,22,.18)',
                borderRadius: 10,
                padding: '0 14px',
                background: 'var(--paper)',
                fontSize: 16,
              }}
            />

            <button type="submit" className="btn btn--gold btn--sm">
              가족 공간 만들기
            </button>
          </form>
        </div>
      ) : (
        <FamilyClient
          family={{
            id: membership.familyId,
            name: membership.family.name,
            members: membership.family.members.map((member) => {
              const name = member.user.name || member.user.email || '가족';

              return {
                id: member.id,
                name,
                email: member.user.email || '',
                role: member.role,
                avatar: name[0] || '?',
              };
            }),
            pendingInvitations: membership.family.invitations.map((invitation) => ({
              id: invitation.id,
              email: invitation.email,
              role: invitation.role,
            })),
          }}
          isOwner={membership.role === 'OWNER'}
        />
      )}
    </main>
  );
}