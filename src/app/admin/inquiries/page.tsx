// src/app/admin/inquiries/page.tsx
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function AdminInquiriesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const adminUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
    },
  });

  if (adminUser?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const now = new Date();

  const [families, invitations] = await Promise.all([
    prisma.family.findMany({
      include: {
        members: {
          include: {
            user: true,
          },
          orderBy: {
            joinedAt: 'asc',
          },
        },
        _count: {
          select: {
            memories: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),

    prisma.familyInvitation.findMany({
      include: {
        family: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    }),
  ]);

  return (
    <div>
      <div className="runninghead">
        <span className="runninghead__chapter">ADMIN</span>
        <span className="runninghead__rule"></span>
        <span style={{ color: 'var(--ink-soft)' }}>가족 공간 관리</span>
      </div>

      <h1 className="dash-greeting">가족 공간 현황</h1>

      <p style={{ color: 'var(--ink-soft)', marginBottom: 32 }}>
        전체 {families.length}개의 가족 공간과 최근 초대 현황을 확인합니다.
      </p>

      <div className="dash-card" style={{ marginBottom: 32, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px 0' }}>
          <p className="dash-card__label">가족 공간 목록</p>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(34,28,22,.1)' }}>
                {['가족 이름', '구성원', '기록 수', '생성일'].map((heading) => (
                  <th
                    key={heading}
                    style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--ink-faint)',
                      fontWeight: 400,
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {families.map((family) => {
                const memberNames = family.members
                  .map((member) => member.user.name || member.user.email || '이름 없음')
                  .join(', ');

                return (
                  <tr key={family.id} style={{ borderBottom: '1px solid rgba(34,28,22,.06)' }}>
                    <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600 }}>
                      {family.name}
                    </td>

                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--ink-soft)' }}>
                      {memberNames || '-'}
                    </td>

                    <td style={{ padding: '12px 16px', fontSize: 14, textAlign: 'center' }}>
                      {family._count.memories}
                    </td>

                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--ink-faint)' }}>
                      {family.createdAt.toLocaleDateString('ko-KR')}
                    </td>
                  </tr>
                );
              })}

              {families.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: '20px 12px',
                      textAlign: 'center',
                      color: 'var(--ink-faint)',
                      fontSize: 14,
                    }}
                  >
                    아직 생성된 가족 공간이 없습니다.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px 0' }}>
          <p className="dash-card__label">최근 초대 현황</p>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(34,28,22,.1)' }}>
                {['가족 공간', '초대 이메일', '권한', '상태', '만료일'].map((heading) => (
                  <th
                    key={heading}
                    style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--ink-faint)',
                      fontWeight: 400,
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {invitations.map((invitation) => {
                const isExpired = invitation.expiresAt < now;
                const isUsed = Boolean(invitation.usedAt);
                const status = isUsed ? '수락됨' : isExpired ? '만료됨' : '대기 중';

                const statusColor = isUsed
                  ? 'var(--moss, #5C6B4F)'
                  : isExpired
                    ? 'var(--ink-faint)'
                    : 'var(--wine)';

                return (
                  <tr key={invitation.id} style={{ borderBottom: '1px solid rgba(34,28,22,.06)' }}>
                    <td style={{ padding: '12px 16px', fontSize: 14 }}>
                      {invitation.family.name}
                    </td>

                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--ink-soft)' }}>
                      {invitation.email}
                    </td>

                    <td style={{ padding: '12px 16px', fontSize: 12 }}>
                      {invitation.role}
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          color: statusColor,
                        }}
                      >
                        {status}
                      </span>
                    </td>

                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--ink-faint)' }}>
                      {invitation.expiresAt.toLocaleDateString('ko-KR')}
                    </td>
                  </tr>
                );
              })}

              {invitations.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: '20px 12px',
                      textAlign: 'center',
                      color: 'var(--ink-faint)',
                      fontSize: 14,
                    }}
                  >
                    초대 내역이 없습니다.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
