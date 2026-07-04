'use client';

import { useState } from 'react';

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
}

interface Props {
  family: {
    id: string;
    name: string;
    members: Member[];
    pendingInvitations: Invitation[];
  };
  isOwner: boolean;
}

const ROLE_LABEL: Record<string, string> = {
  OWNER: 'OWNER',
  EDITOR: 'EDITOR',
  VIEWER: 'VIEWER',
};

export default function FamilyClient({ family, isOwner }: Props) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('EDITOR');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setMessage('');

    try {
      const res = await fetch('/api/family/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyId: family.id, email, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || '초대 실패');
      } else {
        setMessage(`✓ ${email} 로 초대 메일을 보냈습니다!`);
        setEmail('');
      }
    } catch {
      setMessage('오류가 발생했습니다.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="family-grid">
      {/* 구성원 목록 */}
      <div className="dash-card">
        <p className="dash-card__label">{family.name}</p>
        {family.members.map((m) => (
          <div className="family-member" key={m.id}>
            <div className="family-member__avatar">{m.avatar}</div>
            <div>
              <p className="family-member__name">
                {m.name}{' '}
                <span className={`family-role family-role--${m.role.toLowerCase()}`}>
                  {ROLE_LABEL[m.role]}
                </span>
              </p>
              <p className="family-member__sub">{m.email}</p>
            </div>
          </div>
        ))}

        {/* 초대 대기 중 */}
        {family.pendingInvitations.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.08em', color: 'var(--ink-faint)', marginBottom: 10 }}>
              초대 대기 중
            </p>
            {family.pendingInvitations.map((inv) => (
              <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid rgba(34,28,22,.06)', fontSize: 13.5 }}>
                <span style={{ color: 'var(--ink-faint)' }}>✉️</span>
                <span style={{ color: 'var(--ink-soft)' }}>{inv.email}</span>
                <span className={`family-role family-role--${inv.role.toLowerCase()}`} style={{ marginLeft: 'auto' }}>
                  {ROLE_LABEL[inv.role]}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 초대 폼 */}
        {isOwner && (
          <form onSubmit={handleInvite} style={{ marginTop: 20 }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.08em', color: 'var(--ink-faint)', marginBottom: 10 }}>
              가족 초대하기
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="초대할 가족의 이메일"
                required
                style={{ flex: 1, height: 40, border: '1px solid rgba(34,28,22,.18)', borderRadius: 2, padding: '0 12px', background: 'var(--paper)', fontSize: 13.5 }}
              />
              <select value={role} onChange={e => setRole(e.target.value)}
                style={{ height: 40, border: '1px solid rgba(34,28,22,.18)', borderRadius: 2, padding: '0 8px', background: 'var(--paper)', fontSize: 13.5 }}>
                <option value="EDITOR">편집자</option>
                <option value="VIEWER">열람자</option>
              </select>
            </div>
            <button type="submit" className="btn btn--ghost-light btn--sm" disabled={sending} style={{ width: '100%', justifyContent: 'center' }}>
              {sending ? '전송 중...' : '✉️ 초대 메일 보내기'}
            </button>
            {message && (
              <p style={{ fontSize: 13, color: message.startsWith('✓') ? 'var(--wine)' : 'var(--rust)', marginTop: 8 }}>
                {message}
              </p>
            )}
            <p style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 8 }}>
              ※ 가입하지 않은 이메일도 초대 가능합니다. 링크는 48시간 유효합니다.
            </p>
          </form>
        )}
      </div>

      {/* 안내 */}
      <div className="dash-card">
        <p className="dash-card__label">가족 공간 안내</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
          {[
            { role: 'OWNER', desc: '모든 권한 — 초대, 삭제, 수정 가능' },
            { role: 'EDITOR', desc: '기록 작성 및 수정 가능' },
            { role: 'VIEWER', desc: '열람만 가능' },
          ].map(item => (
            <div key={item.role} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className={`family-role family-role--${item.role.toLowerCase()}`}>{item.role}</span>
              <span style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>{item.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}