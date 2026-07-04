'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const PLANS = [
  { value: 'PDF 다운로드', label: 'PDF 다운로드 — 39,000원', price: '39,000원' },
  { value: 'Life Book', label: 'Life Book — 89,000원', price: '89,000원' },
  { value: 'Heritage Edition', label: 'Heritage Edition — 189,000원', price: '189,000원' },
  { value: 'Movie Premium (부록)', label: 'Movie Premium 추가 — 59,000원', price: '59,000원 추가' },
];

function ApplyForm() {
  const searchParams = useSearchParams();
  const [plan, setPlan] = useState('Life Book');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const p = searchParams.get('plan');
    if (p && PLANS.find(pl => pl.value === p)) setPlan(p);
  }, [searchParams]);

  const currentPlan = PLANS.find(p => p.value === plan) || PLANS[1];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!name) newErrors.name = '이름을 입력해주세요.';
    if (!contact) newErrors.contact = '연락받으실 방법을 입력해주세요.';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    const subject = encodeURIComponent(`[출판 신청] ${plan} — ${name}`);
    const body = encodeURIComponent(`이름: ${name}\n연락처: ${contact}\n선택 구성: ${plan} (${currentPlan.price})\n\n전하고 싶은 말:\n${message || '미입력'}`);
    window.location.href = `mailto:hello@daldongne.kr?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
      <div className="dash-card">
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.08em', color: 'var(--ink-faint)', marginBottom: 14 }}>출판 신청</p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <select value={plan} onChange={e => setPlan(e.target.value)}
            style={{ width: '100%', height: 44, border: '1px solid rgba(34,28,22,.18)', borderRadius: 2, padding: '0 13px', background: 'var(--paper)', fontSize: 14.5 }}>
            {PLANS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <div>
            <input type="text" placeholder="이름" value={name} onChange={e => setName(e.target.value)}
              style={{ width: '100%', height: 44, border: `1px solid ${errors.name ? 'var(--rust)' : 'rgba(34,28,22,.18)'}`, borderRadius: 2, padding: '0 13px', background: 'var(--paper)', fontSize: 14.5 }} />
            {errors.name && <p style={{ color: 'var(--rust)', fontSize: 12, marginTop: 4 }}>{errors.name}</p>}
          </div>
          <div>
            <input type="text" placeholder="연락처 (이메일 또는 전화번호)" value={contact} onChange={e => setContact(e.target.value)}
              style={{ width: '100%', height: 44, border: `1px solid ${errors.contact ? 'var(--rust)' : 'rgba(34,28,22,.18)'}`, borderRadius: 2, padding: '0 13px', background: 'var(--paper)', fontSize: 14.5 }} />
            {errors.contact && <p style={{ color: 'var(--rust)', fontSize: 12, marginTop: 4 }}>{errors.contact}</p>}
          </div>
          <textarea placeholder="전하고 싶은 말 (선택)" value={message} onChange={e => setMessage(e.target.value)}
            style={{ width: '100%', minHeight: 84, border: '1px solid rgba(34,28,22,.18)', borderRadius: 2, padding: 12, background: 'var(--paper)', fontSize: 14.5, resize: 'vertical', fontFamily: 'var(--font-body)' }} />
          <button type="submit" className="btn btn--gold btn--sm">출판 신청서 보내기</button>
          {sent && <p style={{ color: 'var(--wine)', fontSize: 13.5 }}>메일 작성 화면이 열립니다.</p>}
        </form>
      </div>

      <div className="dash-card">
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.08em', color: 'var(--ink-faint)', marginBottom: 14 }}>견적 요약</p>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid rgba(34,28,22,.08)', fontSize: 13.5 }}>
            <span style={{ color: 'var(--ink-faint)' }}>선택한 구성</span>
            <span style={{ fontWeight: 500 }}>{plan}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid rgba(34,28,22,.08)', fontSize: 13.5 }}>
            <span style={{ color: 'var(--ink-faint)' }}>예상 제작 기간</span>
            <span style={{ fontWeight: 500 }}>2~3주</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid rgba(34,28,22,.08)', fontSize: 13.5 }}>
            <span style={{ color: 'var(--ink-faint)' }}>포함 부수</span>
            <span style={{ fontWeight: 500 }}>1권</span>
          </div>
          <div style={{ margin: '14px 0', borderTop: '1px dashed rgba(34,28,22,.18)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15 }}>예상 가격</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--wine)' }}>{currentPlan.price}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <main>
      <section className="page">
        <div className="page__inner">
          <div className="runninghead">
            <span className="runninghead__chapter">CHAPTER 9</span>
            <span className="runninghead__rule"></span>
            <span style={{ color: 'var(--ink-soft)' }}>출판 신청</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(26px,3.6vw,38px)', marginBottom: 14 }}>
            이제, 당신의 책을 출판할 차례입니다
          </h2>
          <p style={{ color: 'var(--ink-soft)', marginBottom: 48 }}>아래 정보를 입력해주시면, 선택하신 구성에 맞춰 담당자가 연락드립니다.</p>
          <Suspense fallback={<div>로딩 중...</div>}>
            <ApplyForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}