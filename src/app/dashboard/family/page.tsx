// src/app/dashboard/family/page.tsx
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import FamilyClient from './FamilyClient';

const ROLE_LABEL: Record<string, string> = {
  OWNER: 'OWNER',
  EDITOR: 'EDITOR',
  VIEWER: 'VIEWER',
};

export default async function FamilyPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const userId = session.user.id;

  const membership = await prisma.familyMember.findFirst({
    where: { userId },
    include: {
      family: {
        include: {
          members: { include: { user: true }, orderBy: { joinedAt: 'asc' } },
          invitations: {
            where: { usedAt: null, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  });

  async function createFamily(formData: FormData) {
    'use server';
    const session = await auth();
    if (!session?.user) redirect('/login');
    const name = String(formData.get('name') || '').trim();
    if (!name) return;
    await prisma.family.create({
      data: {
        name,
        members: { create: { userId: session.user.id, role: 'OWNER' } },
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
        <div className="dash-card" style={{ maxWidth: 420 }}>
          <p className="dash-card__label">아직 가족 공간이 없습니다</p>
          <form action={createFamily} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input
              type="text" name="name" placeholder="예: 김씨네 가족" required
              style={{ flex: 1, height: 44, border: '1px solid rgba(34,28,22,.18)', borderRadius: 2, padding: '0 12px', background: 'var(--paper)', fontSize: 14 }}
            />
            <button type="submit" className="btn btn--gold btn--sm">만들기</button>
          </form>
        </div>
      ) : (
        <FamilyClient
          family={{
            id: membership.familyId,
            name: membership.family.name,
            members: membership.family.members.map(m => ({
              id: m.id,
              name: m.user.name || m.user.email || '?',
              email: m.user.email || '',
              role: m.role,
              avatar: (m.user.name || m.user.email || '?')[0],
            })),
            pendingInvitations: membership.family.invitations.map(i => ({
              id: i.id,
              email: i.email,
              role: i.role,
            })),
          }}
          isOwner={membership.role === 'OWNER'}
        />
      )}
    </main>
  );
}