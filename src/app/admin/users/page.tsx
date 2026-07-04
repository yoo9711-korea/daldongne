// src/app/admin/users/page.tsx
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { memories: true, books: true },
      },
    },
  });

  async function toggleAdmin(formData: FormData) {
    'use server';
    const session = await auth();
    if (!session?.user) return;

    const targetId = String(formData.get('userId'));
    const currentRole = String(formData.get('currentRole'));

    // 본인 권한은 변경 불가
    if (targetId === session.user.id) return;

    await prisma.user.update({
      where: { id: targetId },
      data: { role: currentRole === 'ADMIN' ? 'USER' : 'ADMIN' },
    });
    revalidatePath('/admin/users');
  }

  return (
    <div>
      <div className="runninghead">
        <span className="runninghead__chapter">ADMIN</span>
        <span className="runninghead__rule"></span>
        <span style={{ color: 'var(--ink-soft)' }}>회원 관리</span>
      </div>

      <h1 className="dash-greeting">회원 관리</h1>
      <p style={{ color: 'var(--ink-soft)', marginBottom: 32 }}>
        전체 {users.length}명
      </p>

      <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--paper-shade)', borderBottom: '1px solid rgba(34,28,22,.1)' }}>
              {['이름', '이메일', '기록', '책', '권한', '가입일', '관리'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.06em', color: 'var(--ink-faint)', fontWeight: 400 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id} style={{ borderBottom: '1px solid rgba(34,28,22,.06)' }}>
                <td style={{ padding: '12px 16px', fontSize: 14 }}>
                  {u.image && <img src={u.image} alt="" style={{ width: 24, height: 24, borderRadius: '50%', marginRight: 8, verticalAlign: 'middle' }} />}
                  {u.name || '-'}
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--ink-soft)' }}>{u.email}</td>
                <td style={{ padding: '12px 16px', fontSize: 14, textAlign: 'center' }}>{u._count.memories}</td>
                <td style={{ padding: '12px 16px', fontSize: 14, textAlign: 'center' }}>{u._count.books}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.04em',
                    padding: '3px 8px', borderRadius: 10,
                    background: u.role === 'ADMIN' ? 'var(--wine)' : 'rgba(34,28,22,.08)',
                    color: u.role === 'ADMIN' ? 'var(--cream)' : 'var(--ink-faint)',
                  }}>
                    {u.role}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--ink-faint)' }}>
                  {u.createdAt.toLocaleDateString('ko-KR')}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <form action={toggleAdmin}>
                    <input type="hidden" name="userId" value={u.id} />
                    <input type="hidden" name="currentRole" value={u.role} />
                    <button type="submit" style={{
                      fontFamily: 'var(--font-mono)', fontSize: 10,
                      padding: '4px 10px', borderRadius: 10, cursor: 'pointer',
                      border: '1px solid rgba(34,28,22,.2)', background: 'transparent',
                      color: 'var(--ink-soft)',
                    }}>
                      {u.role === 'ADMIN' ? 'USER로' : 'ADMIN으로'}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}