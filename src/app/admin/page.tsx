// src/app/admin/page.tsx
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function AdminDashboard() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const adminUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (adminUser?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const [totalUsers, totalMemories, totalFamilies, totalBooks, recentUsers] =
    await Promise.all([
      prisma.user.count(),
      prisma.memory.count(),
      prisma.family.count(),
      prisma.book.count(),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          role: true,
        },
      }),
    ]);

  const stats = [
    { label: '전체 회원', value: totalUsers, unit: '명', color: 'var(--wine)' },
    { label: '저장된 기록', value: totalMemories, unit: '개', color: 'var(--gold)' },
    { label: '가족 공간', value: totalFamilies, unit: '개', color: '#2E3F52' },
    { label: '출판된 작품', value: totalBooks, unit: '권', color: '#5C6B4F' },
  ];

  return (
    <div>
      <div className="runninghead">
        <span className="runninghead__chapter">ADMIN</span>
        <span className="runninghead__rule"></span>
        <span style={{ color: 'var(--ink-soft)' }}>대시보드</span>
      </div>

      <h1 className="dash-greeting">관리자 대시보드</h1>

      <p style={{ color: 'var(--ink-soft)', marginBottom: 40 }}>
        달동네 출판사 플랫폼의 회원, 기록, 가족 공간, 작품 현황을 확인합니다.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
          marginBottom: 40,
        }}
      >
        {stats.map((stat) => (
          <div key={stat.label} className="dash-card" style={{ textAlign: 'center' }}>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 36,
                color: stat.color,
                margin: '0 0 4px',
              }}
            >
              {stat.value.toLocaleString()}
            </p>

            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--ink-faint)',
                letterSpacing: '.06em',
              }}
            >
              {stat.label} ({stat.unit})
            </p>
          </div>
        ))}
      </div>

      <div className="dash-card">
        <p className="dash-card__label">최근 가입 회원</p>

        <div style={{ overflowX: 'auto', marginTop: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(34,28,22,.1)' }}>
                {['이름', '이메일', '권한', '가입일'].map((heading) => (
                  <th
                    key={heading}
                    style={{
                      textAlign: 'left',
                      padding: '8px 12px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      letterSpacing: '.06em',
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
              {recentUsers.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid rgba(34,28,22,.06)' }}>
                  <td style={{ padding: '10px 12px', fontSize: 14 }}>
                    {user.name || '-'}
                  </td>

                  <td style={{ padding: '10px 12px', fontSize: 14, color: 'var(--ink-soft)' }}>
                    {user.email || '-'}
                  </td>

                  <td style={{ padding: '10px 12px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        letterSpacing: '.04em',
                        padding: '3px 8px',
                        borderRadius: 10,
                        background:
                          user.role === 'ADMIN' ? 'var(--wine)' : 'rgba(34,28,22,.08)',
                        color: user.role === 'ADMIN' ? 'var(--cream)' : 'var(--ink-faint)',
                      }}
                    >
                      {user.role}
                    </span>
                  </td>

                  <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--ink-faint)' }}>
                    {user.createdAt.toLocaleDateString('ko-KR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}