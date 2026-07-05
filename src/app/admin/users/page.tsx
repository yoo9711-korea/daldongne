// src/app/admin/users/page.tsx
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const adminUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
    },
  });

  if (adminUser?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          memories: true,
          books: true,
        },
      },
    },
  });

  async function toggleAdmin(formData: FormData) {
    'use server';

    const session = await auth();

    if (!session?.user?.id) {
      return;
    }

    const actingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        role: true,
      },
    });

    if (actingUser?.role !== 'ADMIN') {
      return;
    }

    const targetId = String(formData.get('userId') || '').trim();

    if (!targetId) {
      return;
    }

    if (targetId === session.user.id) {
      return;
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        role: true,
      },
    });

    if (!targetUser) {
      return;
    }

    if (targetUser.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: {
          role: 'ADMIN',
        },
      });

      if (adminCount <= 1) {
        return;
      }
    }

    await prisma.user.update({
      where: { id: targetUser.id },
      data: {
        role: targetUser.role === 'ADMIN' ? 'USER' : 'ADMIN',
      },
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
        전체 {users.length}명의 회원을 관리합니다.
      </p>

      <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
            <thead>
              <tr
                style={{
                  background: 'var(--paper-shade)',
                  borderBottom: '1px solid rgba(34,28,22,.1)',
                }}
              >
                {['이름', '이메일', '기록', '책', '권한', '가입일', '관리'].map((heading) => (
                  <th
                    key={heading}
                    style={{
                      textAlign: 'left',
                      padding: '12px 16px',
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
              {users.map((user) => {
                const isSelf = user.id === session.user.id;
                const nextRoleLabel = user.role === 'ADMIN' ? 'USER로' : 'ADMIN으로';

                return (
                  <tr key={user.id} style={{ borderBottom: '1px solid rgba(34,28,22,.06)' }}>
                    <td style={{ padding: '12px 16px', fontSize: 14 }}>
                      {user.image ? (
                        <img
                          src={user.image}
                          alt=""
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            marginRight: 8,
                            verticalAlign: 'middle',
                          }}
                        />
                      ) : null}

                      {user.name || '-'}
                    </td>

                    <td
                      style={{
                        padding: '12px 16px',
                        fontSize: 13,
                        color: 'var(--ink-soft)',
                      }}
                    >
                      {user.email || '-'}
                    </td>

                    <td style={{ padding: '12px 16px', fontSize: 14, textAlign: 'center' }}>
                      {user._count.memories}
                    </td>

                    <td style={{ padding: '12px 16px', fontSize: 14, textAlign: 'center' }}>
                      {user._count.books}
                    </td>

                    <td style={{ padding: '12px 16px' }}>
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

                    <td
                      style={{
                        padding: '12px 16px',
                        fontSize: 12,
                        color: 'var(--ink-faint)',
                      }}
                    >
                      {user.createdAt.toLocaleDateString('ko-KR')}
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <form action={toggleAdmin}>
                        <input type="hidden" name="userId" value={user.id} />

                        <button
                          type="submit"
                          disabled={isSelf}
                          title={isSelf ? '본인의 권한은 여기서 변경할 수 없습니다.' : ''}
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            padding: '4px 10px',
                            borderRadius: 10,
                            cursor: isSelf ? 'not-allowed' : 'pointer',
                            border: '1px solid rgba(34,28,22,.2)',
                            background: isSelf ? 'rgba(34,28,22,.05)' : 'transparent',
                            color: isSelf ? 'var(--ink-faint)' : 'var(--ink-soft)',
                            opacity: isSelf ? 0.55 : 1,
                          }}
                        >
                          {isSelf ? '본인' : nextRoleLabel}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}