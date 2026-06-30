// src/app/dashboard/page.tsx
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  // 실제 DB 조회 — 로그인 시 Auth.js가 만든 User 행을 그대로 읽어온다.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      familyMemberships: { include: { family: true } },
      memories: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });

  if (!user) {
    redirect('/login');
  }

  return (
    <main className="page">
      <div className="runninghead">
        <span className="runninghead__chapter">DASHBOARD</span>
        <span className="runninghead__rule"></span>
        <span style={{ color: 'var(--ink-soft)' }}>내 서재</span>
      </div>

      <h1 className="dash-greeting">{user.name || user.email}님, 환영합니다.</h1>
      <p style={{ color: 'var(--ink-soft)', marginBottom: 32 }}>
        이 페이지는 실제 데이터베이스에서 사용자 정보를 조회해 보여주고 있습니다.
      </p>

      <div className="dash-card">
        <p className="dash-card__label">계정 정보</p>
        <p className="dash-card__value">{user.email}</p>
        <p style={{ color: 'var(--ink-faint)', fontSize: 12, marginTop: 4 }}>
          가입일: {user.createdAt.toLocaleDateString('ko-KR')}
        </p>
      </div>

      <Link href="/dashboard/family" className="dash-card dash-card--link">
        <p className="dash-card__label">가족 공간</p>
        {user.familyMemberships.length === 0 ? (
          <p style={{ color: 'var(--ink-faint)', fontSize: 13.5 }}>
            아직 소속된 가족 공간이 없습니다. 클릭해서 만들어보세요 →
          </p>
        ) : (
          user.familyMemberships.map((m) => (
            <p key={m.id} className="dash-card__value">
              {m.family.name} <span style={{ color: 'var(--ink-faint)', fontWeight: 400, fontSize: 12 }}>({m.role})</span>
            </p>
          ))
        )}
      </Link>

      <Link href="/dashboard/timeline" className="dash-card dash-card--link">
        <p className="dash-card__label">최근 기록 (Memory)</p>
        {user.memories.length === 0 ? (
          <p style={{ color: 'var(--ink-faint)', fontSize: 13.5 }}>
            아직 저장된 기록이 없습니다. AI Interview에서 첫 기록을 남겨보세요 →
          </p>
        ) : (
          user.memories.map((m) => (
            <p key={m.id} className="dash-card__value">{m.title || m.type}</p>
          ))
        )}
      </Link>
    </main>
  );
}
