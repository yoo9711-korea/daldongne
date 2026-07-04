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
        <span style={{ color: 'var(--ink-soft)' }}>Family Space</span>
      </div>

      <h1 className="dash-greeting">가족이 함께 기록하고, 함께 추억합니다</h1>

      {!membership ? (
        <div className="dash-card" style={{ maxWidth: 520 }}>
          <p className="dash-card__label">아직 가족 공간이 없습니다</p>

          <p
            style={{
              color: 'var(--ink-soft)',
              fontSize: 14,
              lineHeight: 1.7,
              marginTop: 8,
              marginBottom: 16,
            }}
          >
            가족 공간을 만들면 사진, 인터뷰, 기억 기록을 가족 단위로 함께 관리할 수 있습니다.
          </p>

          <form action={createFamily} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input
              type="text"
              name="name"
              placeholder="예: 김씨네 가족"
              required
              style={{
                flex: 1,
                height: 44,
                border: '1px solid rgba(34,28,22,.18)',
                borderRadius: 2,
                padding: '0 12px',
                background: 'var(--paper)',
                fontSize: 14,
              }}
            />

            <button type="submit" className="btn btn--gold btn--sm">
              만들기
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