'use client';
import { useState } from 'react';

export default function B2BPage() {
  const [org, setOrg] = useState('');
  const [size, setSize] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!org) newErrors.org = '소속 또는 단체명을 입력해주세요.';
    if (!contact) newErrors.contact = '연락받으실 방법을 입력해주세요.';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    const subject = encodeURIComponent(`[단체 출판 문의] ${org}`);
    const body = encodeURIComponent(`소속/단체명: ${org}\n예상 인원: ${size || '미입력'}\n연락처: ${contact}\n\n문의 내용:\n${message || '미입력'}`);
    window.location.href = `mailto:hello@daldongne.kr?subject=${subject}&body=${body}`;
    setSent(true);
  }

  const chips = ['퇴직 기념집', '졸업 기념집', '창립·행사 기념집', '동호회 출판'];

  return (
    <main>
      <section className="page">
        <div className="page__inner">
          <div className="runninghead">
            <span className="runninghead__chapter">CHAPTER 7</span>
            <span className="runninghead__rule"></span>
            <span style={{ color: 'var(--ink-soft)' }}>함께 출판하기</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(26px,3.6vw,38px)', marginBottom: 14 }}>
            혼자가 아니라, 함께 만드는 출판도 있습니다
          </h2>
          <p style={{ color: 'var(--ink-soft)', marginBottom: 48 }}>퇴직, 졸업, 창립 기념일 — 단체와 기업을 위한 출판 파이프라인입니다.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
                {chips.map(chip => (
                  <span key={chip} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-soft)', border: '1px solid rgba(34,28,22,.16)', padding: '8px 14px', borderRadius: 20 }}>{chip}</span>
                ))}
              </div>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'clamp(18px,2.1vw,22px)', lineHeight: 1.5, color: 'var(--ink)', marginBottom: 16 }}>
                한 사람의 이야기가 모이면, 한 조직의 역사가 됩니다.
              </p>
              <p style={{ color: 'var(--ink-soft)', fontSize: 15 }}>인원 규모나 일정에 맞춰 출판 방식을 함께 설계해드립니다.</p>
            </div>

            <div className="dash-card">
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.08em', color: 'var(--ink-faint)', marginBottom: 14 }}>단체·기업 문의</p>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <input type="text" placeholder="소속 / 단체명" value={org} onChange={e => setOrg(e.target.value)}
                    style={{ width: '100%', height: 44, border: `1px solid ${errors.org ? 'var(--rust)' : 'rgba(34,28,22,.18)'}`, borderRadius: 2, padding: '0 13px', background: 'var(--paper)', fontSize: 14.5 }} />
                  {errors.org && <p style={{ color: 'var(--rust)', fontSize: 12, marginTop: 4 }}>{errors.org}</p>}
                </div>
                <input type="text" placeholder="예상 인원" value={size} onChange={e => setSize(e.target.value)}
                  style={{ width: '100%', height: 44, border: '1px solid rgba(34,28,22,.18)', borderRadius: 2, padding: '0 13px', background: 'var(--paper)', fontSize: 14.5 }} />
                <div>
                  <input type="text" placeholder="연락처 (이메일 또는 전화번호)" value={contact} onChange={e => setContact(e.target.value)}
                    style={{ width: '100%', height: 44, border: `1px solid ${errors.contact ? 'var(--rust)' : 'rgba(34,28,22,.18)'}`, borderRadius: 2, padding: '0 13px', background: 'var(--paper)', fontSize: 14.5 }} />
                  {errors.contact && <p style={{ color: 'var(--rust)', fontSize: 12, marginTop: 4 }}>{errors.contact}</p>}
                </div>
                <textarea placeholder="문의 내용" value={message} onChange={e => setMessage(e.target.value)}
                  style={{ width: '100%', minHeight: 84, border: '1px solid rgba(34,28,22,.18)', borderRadius: 2, padding: 12, background: 'var(--paper)', fontSize: 14.5, resize: 'vertical', fontFamily: 'var(--font-body)' }} />
                <button type="submit" className="btn btn--gold btn--sm">문의 보내기</button>
                {sent && <p style={{ color: 'var(--wine)', fontSize: 13.5 }}>메일 작성 화면이 열립니다.</p>}
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}