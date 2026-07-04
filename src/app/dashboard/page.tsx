// src/app/dashboard/page.tsx
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      familyMemberships: {
        include: { family: true },
      },
      memories: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });

  if (!user) {
    redirect('/login');
  }

  const displayName = user.name || user.email || '회원';
  const familyCount = user.familyMemberships.length;
  const memoryCount = user.memories.length;
  const isAdmin = user.role === 'ADMIN';

  return (
    <main className="page">
      <div className="runninghead">
        <span className="runninghead__chapter">DASHBOARD</span>
        <span className="runninghead__rule"></span>
        <span style={{ color: 'var(--ink-soft)' }}>내 서재</span>
      </div>

      <section
        className="dash-card"
        style={{
          padding: 28,
          marginBottom: 24,
        }}
      >
        <p className="dash-card__label">달동네 출판사</p>
        <h1 className="dash-greeting" style={{ marginBottom: 12 }}>
          {displayName}님, 오늘의 기억을 정리해볼까요?
        </h1>
        <p style={{ color: 'var(--ink-soft)', lineHeight: 1.7, marginBottom: 0 }}>
          사진, 인터뷰, 가족의 이야기를 모아 한 사람의 삶을 다음 세대에게 전달하는 공간입니다.
          동영상 제작은 잠시 뒤로 미루고, 지금은 가족과 기억의 기본 흐름을 먼저 정리합니다.
        </p>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div className="dash-card">
          <p className="dash-card__label">가족 공간</p>
          <p className="dash-card__value">{familyCount}개</p>
          <p style={{ color: 'var(--ink-faint)', fontSize: 13, marginTop: 6 }}>
            함께 기록을 남길 가족 공간입니다.
          </p>
        </div>

        <div className="dash-card">
          <p className="dash-card__label">최근 기억</p>
          <p className="dash-card__value">{memoryCount}개</p>
          <p style={{ color: 'var(--ink-faint)', fontSize: 13, marginTop: 6 }}>
            최근 저장된 Memory 기록입니다.
          </p>
        </div>

        <div className="dash-card">
          <p className="dash-card__label">계정</p>
          <p className="dash-card__value">{user.email}</p>
          <p style={{ color: 'var(--ink-faint)', fontSize: 13, marginTop: 6 }}>
            가입일: {user.createdAt.toLocaleDateString('ko-KR')}
          </p>
        </div>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <Link href="/dashboard/family" className="dash-card dash-card--link">
          <p className="dash-card__label">가족 공간</p>

          {user.familyMemberships.length === 0 ? (
            <p style={{ color: 'var(--ink-faint)', fontSize: 13.5, lineHeight: 1.6 }}>
              아직 소속된 가족 공간이 없습니다. 가족 공간을 만들고 함께 기록을 시작하세요 →
            </p>
          ) : (
            <div style={{ display: 'grid', gap: 6 }}>
              {user.familyMemberships.map((membership) => (
                <p key={membership.id} className="dash-card__value">
                  {membership.family.name}{' '}
                  <span
                    style={{
                      color: 'var(--ink-faint)',
                      fontWeight: 400,
                      fontSize: 12,
                    }}
                  >
                    ({membership.role})
                  </span>
                </p>
              ))}
            </div>
          )}
        </Link>

        <Link href="/dashboard/timeline" className="dash-card dash-card--link">
          <p className="dash-card__label">Memory Timeline</p>

          {user.memories.length === 0 ? (
            <p style={{ color: 'var(--ink-faint)', fontSize: 13.5, lineHeight: 1.6 }}>
              아직 저장된 기억이 없습니다. 사진과 인터뷰를 통해 첫 기록을 남겨보세요 →
            </p>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {user.memories.map((memory) => (
                <div key={memory.id}>
                  <p className="dash-card__value">
                    {memory.title || memory.type}
                  </p>
                  <p style={{ color: 'var(--ink-faint)', fontSize: 12 }}>
                    {memory.createdAt.toLocaleDateString('ko-KR')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Link>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        <Link href="/dashboard/timeline" className="dash-card dash-card--link">
          <p className="dash-card__label">기억 정리</p>
          <p style={{ color: 'var(--ink-soft)', fontSize: 13.5, lineHeight: 1.6 }}>
            흩어진 기록을 시간순으로 정리합니다 →
          </p>
        </Link>

        <Link href="/dashboard/family" className="dash-card dash-card--link">
          <p className="dash-card__label">가족 초대</p>
          <p style={{ color: 'var(--ink-soft)', fontSize: 13.5, lineHeight: 1.6 }}>
            가족을 초대해 함께 추억을 남깁니다 →
          </p>
        </Link>

        <div className="dash-card">
          <p className="dash-card__label">AI Documentary Movie</p>
          <p style={{ color: 'var(--ink-faint)', fontSize: 13.5, lineHeight: 1.6 }}>
            동영상 제작 기능은 안정화 후 다시 진행합니다.
          </p>
        </div>

        {isAdmin ? (
          <Link href="/admin" className="dash-card dash-card--link">
            <p className="dash-card__label">관리자</p>
            <p style={{ color: 'var(--ink-soft)', fontSize: 13.5, lineHeight: 1.6 }}>
              사용자, 가족, 기록 상태를 관리합니다 →
            </p>
          </Link>
        ) : null}
      </section>
    </main>
  );
}