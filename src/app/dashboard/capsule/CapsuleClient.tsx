'use client';

import { useState } from 'react';

interface LockedCapsule {
  id: string;
  title: string;
  openAt: string;
  isPrivate: boolean;
  daysLeft: number;
}

interface OpenedCapsule {
  id: string;
  title: string;
  message: string;
  openAt: string;
  openedAt: string | null;
  isPrivate: boolean;
}

export default function CapsuleClient({ locked, opened, createCapsule }: {
  locked: LockedCapsule[];
  opened: OpenedCapsule[];
  createCapsule: (formData: FormData) => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [selectedCapsule, setSelectedCapsule] = useState<OpenedCapsule | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    await createCapsule(formData);
    setSubmitting(false);
    setShowForm(false);
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <button onClick={() => setShowForm(!showForm)} className="btn btn--gold">
          {showForm ? '✕ 닫기' : '+ 새 타임캡슐 만들기'}
        </button>
      </div>

      {showForm && (
        <div className="dash-card" style={{ marginBottom: 32, maxWidth: 560 }}>
          <p className="dash-card__label">새 타임캡슐</p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.06em', color: 'var(--ink-faint)', marginBottom: 6 }}>제목</label>
              <input type="text" name="title" required placeholder="예: 10년 후의 나에게"
                style={{ width: '100%', height: 44, border: '1px solid rgba(34,28,22,.18)', borderRadius: 2, padding: '0 12px', background: 'var(--paper)', fontSize: 14 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.06em', color: 'var(--ink-faint)', marginBottom: 6 }}>공개 예정일</label>
              <input type="date" name="openAt" required min={minDate}
                style={{ width: '100%', height: 44, border: '1px solid rgba(34,28,22,.18)', borderRadius: 2, padding: '0 12px', background: 'var(--paper)', fontSize: 14 }} />
              <p style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 4 }}>이 날짜가 지나면 자동으로 공개됩니다.</p>
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.06em', color: 'var(--ink-faint)', marginBottom: 6 }}>메시지</label>
              <textarea name="message" required placeholder="미래의 나에게, 또는 가족에게 전하고 싶은 말을 적어주세요."
                style={{ width: '100%', minHeight: 120, border: '1px solid rgba(34,28,22,.18)', borderRadius: 2, padding: 12, background: 'var(--paper)', fontSize: 14, fontFamily: 'var(--font-body)', resize: 'vertical' }} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
              <input type="checkbox" name="isPrivate" value="true" />
              <span style={{ color: 'var(--ink-soft)' }}>나만 보기 (체크 해제 시 가족과 공유)</span>
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn--gold btn--sm" disabled={submitting}>
                {submitting ? '저장 중...' : '🔒 봉인하기'}
              </button>
              <button type="button" className="btn btn--ghost-light btn--sm" onClick={() => setShowForm(false)}>취소</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 16 }}>🔒 봉인된 캡슐 ({locked.length})</h2>
        {locked.length === 0 ? (
          <div className="dash-card"><p style={{ color: 'var(--ink-faint)', fontSize: 14 }}>아직 봉인된 타임캡슐이 없습니다.</p></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {locked.map((c) => (
              <div key={c.id} style={{ background: 'var(--cover)', color: 'var(--cream)', borderRadius: 3, padding: '24px 20px', border: '1px solid rgba(182,137,47,.3)' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.1em', color: 'var(--gold-soft)', marginBottom: 10 }}>
                  🔒 {c.isPrivate ? '비공개' : '가족 공유'}
                </p>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, marginBottom: 12, color: 'var(--cream)' }}>{c.title}</h3>
                <p style={{ fontSize: 13, color: 'rgba(238,230,211,.6)', marginBottom: 4 }}>공개 예정: {new Date(c.openAt).toLocaleDateString('ko-KR')}</p>
                <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 15, color: 'var(--gold-soft)' }}>
                  {c.daysLeft > 0 ? `D-${c.daysLeft}` : '곧 공개됩니다'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 16 }}>📬 공개된 캡슐 ({opened.length})</h2>
        {opened.length === 0 ? (
          <div className="dash-card"><p style={{ color: 'var(--ink-faint)', fontSize: 14 }}>아직 공개된 타임캡슐이 없습니다.</p></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {opened.map((c) => (
              <div key={c.id} className="dash-card" style={{ cursor: 'pointer', border: '1px solid rgba(182,137,47,.2)' }} onClick={() => setSelectedCapsule(c)}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.1em', color: 'var(--gold)', marginBottom: 10 }}>📬 {c.isPrivate ? '비공개' : '가족 공유'}</p>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{c.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--ink-faint)' }}>{new Date(c.openAt).toLocaleDateString('ko-KR')} 공개</p>
                <p style={{ fontSize: 13, color: 'var(--wine)', marginTop: 4 }}>클릭해서 읽기 →</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedCapsule && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,22,17,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}
          onClick={() => setSelectedCapsule(null)}>
          <div style={{ background: 'var(--paper)', borderRadius: 3, padding: 'clamp(28px,4vw,48px)', maxWidth: 560, width: '100%', maxHeight: '80vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.1em', color: 'var(--gold)', marginBottom: 16 }}>
              📬 타임캡슐 · {new Date(selectedCapsule.openAt).toLocaleDateString('ko-KR')} 공개
            </p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, marginBottom: 24 }}>{selectedCapsule.title}</h2>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, lineHeight: 1.9, color: 'var(--ink-soft)', whiteSpace: 'pre-wrap' }}>{selectedCapsule.message}</p>
            <button onClick={() => setSelectedCapsule(null)} className="btn btn--ghost-light btn--sm" style={{ marginTop: 32 }}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}