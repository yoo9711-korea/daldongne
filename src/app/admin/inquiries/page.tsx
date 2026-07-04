// src/app/admin/inquiries/page.tsx
import { prisma } from '@/lib/prisma';

export default async function AdminInquiriesPage() {
  // B2B 초대 현황 및 가족 공간 현황 조회
  const [families, invitations] = await Promise.all([
    prisma.family.findMany({
      include: {
        members: { include: { user: true } },
        _count: { select: { memories: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.familyInvitation.findMany({
      include: { family: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  return (
    <div>
      <div className="runninghead">
        <span className="runninghead__chapter">ADMIN</span>
        <span className="runninghead__rule"></span>
        <span style={{ color: 'var(--ink-soft)' }}>문의 관리</span>
      </div>

      <h1 className="dash-greeting">가족 공간 현황</h1>
      <p style={{ color: 'var(--ink-soft)', marginBottom: 32 }}>
        전체 {families.length}개 가족 공간
      </p>

      {/* 가족 공간 목록 */}
      <div className="dash-card" style={{ marginBottom: 32 }}>
        <p className="dash-card__label">가족 공간 목록</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(34,28,22,.1)' }}>
              {['가족 이름', '구성원', '기록 수', '생성일'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)', fontWeight: 400 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {families.map((f: any) => (
              <tr key={f.id} style={{ borderBottom: '1px solid rgba(34,28,22,.06)' }}>
                <td style={{ padding: '10px 12px', fontSize: 14, fontWeight: 600 }}>{f.name}</td>
                <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--ink-soft)' }}>
                  {f.members.map((m: any) => m.user.name || m.user.email).join(", ")}
                </td>
                <td style={{ padding: '10px 12px', fontSize: 14, textAlign: 'center' }}>{f._count.memories}</td>
                <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--ink-faint)' }}>
                  {f.createdAt.toLocaleDateString('ko-KR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 초대 현황 */}
      <div className="dash-card">
        <p className="dash-card__label">최근 초대 현황</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(34,28,22,.1)' }}>
              {['가족 공간', '초대 이메일', '권한', '상태', '만료일'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)', fontWeight: 400 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
           {invitations.map((inv: any) => {
              const isExpired = inv.expiresAt < new Date();
              const isUsed = !!inv.usedAt;
              const status = isUsed ? '수락됨' : isExpired ? '만료됨' : '대기 중';
              const statusColor = isUsed ? 'var(--moss, #5C6B4F)' : isExpired ? 'var(--ink-faint)' : 'var(--wine)';

              return (
                <tr key={inv.id} style={{ borderBottom: '1px solid rgba(34,28,22,.06)' }}>
                  <td style={{ padding: '10px 12px', fontSize: 14 }}>{inv.family.name}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--ink-soft)' }}>{inv.email}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12 }}>{inv.role}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: statusColor }}>
                      {status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--ink-faint)' }}>
                    {inv.expiresAt.toLocaleDateString('ko-KR')}
                  </td>
                </tr>
              );
            })}
            {invitations.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--ink-faint)', fontSize: 14 }}>
                  초대 내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}