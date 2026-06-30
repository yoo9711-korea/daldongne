// src/app/dashboard/family/page.tsx
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

const ROLE_LABEL: Record<string, string> = {
  OWNER: 'OWNER',
  EDITOR: 'EDITOR',
  VIEWER: 'VIEWER',
};

export default async function FamilyPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const userId = session.user.id;

  // 실제 쿼리: 본인이 속한 첫 번째 가족 공간 (1단계는 1인 1가족으로 단순화)
  const membership = await prisma.familyMember.findFirst({
    where: { userId },
    include: {
      family: {
        include: {
          members: { include: { user: true }, orderBy: { joinedAt: 'asc' } },
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

    // 실제 쓰기: Family 생성 + 본인을 OWNER로 등록
    await prisma.family.create({
      data: {
        name,
        members: {
          create: { userId: session.user.id, role: 'OWNER' },
        },
      },
    });
    revalidatePath('/dashboard/family');
  }

  async function inviteMember(formData: FormData) {
    'use server';
    const session = await auth();
    if (!session?.user) redirect('/login');

    const familyId = String(formData.get('familyId') || '');
    const email = String(formData.get('email') || '').trim().toLowerCase();
    if (!familyId || !email) return;

    // 실제 권한 확인: 요청자가 이 가족의 OWNER인지 DB에서 확인
    const requester = await prisma.familyMember.findUnique({
      where: { familyId_userId: { familyId, userId: session.user.id } },
    });
    if (!requester || requester.role !== 'OWNER') return;

    // 초대 대상이 이미 가입한 사용자인지 조회 (1단계는 이메일 매칭만 지원,
    // 이후 단계에서 가입 전 사용자를 위한 초대 메일 발송으로 확장)
    const invitee = await prisma.user.findUnique({ where: { email } });
    if (!invitee) return; // TODO: 다음 단계 — 미가입자에게 초대 메일 발송

    await prisma.familyMember.upsert({
      where: { familyId_userId: { familyId, userId: invitee.id } },
      update: {},
      create: { familyId, userId: invitee.id, role: 'EDITOR' },
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
              type="text"
              name="name"
              placeholder="예: 김씨네 가족"
              required
              style={{
                flex: 1, height: 44, border: '1px solid rgba(34,28,22,.18)',
                borderRadius: 2, padding: '0 12px', background: 'var(--paper)', fontSize: 14,
              }}
            />
            <button type="submit" className="btn btn--gold btn--sm">만들기</button>
          </form>
        </div>
      ) : (
        <div className="family-grid">
          <div className="dash-card">
            <p className="dash-card__label">{membership.family.name}</p>
            {membership.family.members.map((m) => (
              <div className="family-member" key={m.id}>
                <div className="family-member__avatar">{(m.user.name || m.user.email || '?')[0]}</div>
                <div>
                  <p className="family-member__name">
                    {m.user.name || m.user.email}{' '}
                    <span className={`family-role family-role--${m.role.toLowerCase()}`}>
                      {ROLE_LABEL[m.role]}
                    </span>
                  </p>
                  <p className="family-member__sub">{m.user.email}</p>
                </div>
              </div>
            ))}

            {membership.role === 'OWNER' && (
              <form action={inviteMember} style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <input type="hidden" name="familyId" value={membership.familyId} />
                <input
                  type="email"
                  name="email"
                  placeholder="초대할 가족의 이메일"
                  required
                  style={{
                    flex: 1, height: 40, border: '1px solid rgba(34,28,22,.18)',
                    borderRadius: 2, padding: '0 12px', background: 'var(--paper)', fontSize: 13.5,
                  }}
                />
                <button type="submit" className="btn btn--ghost-light btn--sm">초대</button>
              </form>
            )}
            <p style={{ color: 'var(--ink-faint)', fontSize: 11.5, marginTop: 8 }}>
              ※ 1단계는 이미 가입한 이메일만 초대 가능합니다. 미가입자 초대 메일 발송은 다음 단계입니다.
            </p>
          </div>

          <div className="dash-card">
            <p className="dash-card__label">가족 활동 피드</p>
            <p style={{ color: 'var(--ink-faint)', fontSize: 13.5 }}>
              아직 활동 피드 기능은 연결되지 않았습니다. (Memory에 likes/comments 모델을
              추가하는 다음 단계에서 실제 데이터로 채워집니다.)
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
