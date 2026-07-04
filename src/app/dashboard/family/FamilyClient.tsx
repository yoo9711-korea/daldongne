'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';

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
  OWNER: '소유자',
  EDITOR: '편집자',
  VIEWER: '열람자',
};

const ROLE_DESCRIPTION = [
  { role: 'OWNER', desc: '가족 공간 관리, 초대, 수정 권한을 가집니다.' },
  { role: 'EDITOR', desc: '사진과 기억 기록을 작성하고 수정할 수 있습니다.' },
  { role: 'VIEWER', desc: '가족의 기록을 열람할 수 있습니다.' },
];

export default function FamilyClient({ family, isOwner }: Props) {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('EDITOR');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const targetEmail = email.trim();

    if (!targetEmail) {
      return;
    }

    setSending(true);
    setMessage('');

    try {
      const response = await fetch('/api/family/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId: family.id,
          email: targetEmail,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || '초대에 실패했습니다.');
        return;
      }

      setMessage(`${targetEmail} 주소로 초대 메일을 보냈습니다.`);
      setEmail('');
      router.refresh();
    } catch {
      setMessage('초대 처리 중 오류가 발생했습니다.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="family-grid">
      <div className="dash-card">
        <p className="dash-card__label">가족 공간</p>

        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(22px,3vw,30px)',
            marginBottom: 18,
            color: 'var(--ink)',
          }}
        >
          {family.name}
        </h2>

        <p
          style={{
            color: 'var(--ink-soft)',
            fontSize: 14,
            lineHeight: 1.7,
            marginBottom: 22,
          }}
        >
          가족이 함께 사진, 인터뷰, 기억 기록을 모아 한 사람의 삶을 정리하는 공간입니다.
        </p>

        <div style={{ display: 'grid', gap: 10 }}>
          {family.members.map((member) => (
            <div className="family-member" key={member.id}>
              <div className="family-member__avatar">{member.avatar}</div>

              <div>
                <p className="family-member__name">
                  {member.name}{' '}
                  <span className={`family-role family-role--${member.role.toLowerCase()}`}>
                    {ROLE_LABEL[member.role] || member.role}
                  </span>
                </p>

                <p className="family-member__sub">{member.email}</p>
              </div>
            </div>
          ))}
        </div>

        {family.pendingInvitations.length > 0 ? (
          <div style={{ marginTop: 22 }}>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: '.08em',
                color: 'var(--ink-faint)',
                marginBottom: 10,
              }}
            >
              초대 대기 중
            </p>

            {family.pendingInvitations.map((invitation) => (
              <div
                key={invitation.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 0',
                  borderBottom: '1px solid rgba(34,28,22,.06)',
                  fontSize: 13.5,
                }}
              >
                <span style={{ color: 'var(--ink-faint)' }}>✉️</span>
                <span style={{ color: 'var(--ink-soft)' }}>{invitation.email}</span>

                <span
                  className={`family-role family-role--${invitation.role.toLowerCase()}`}
                  style={{ marginLeft: 'auto' }}
                >
                  {ROLE_LABEL[invitation.role] || invitation.role}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        {isOwner ? (
          <form onSubmit={handleInvite} style={{ marginTop: 24 }}>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: '.08em',
                color: 'var(--ink-faint)',
                marginBottom: 10,
              }}
            >
              가족 초대하기
            </p>

            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="초대할 가족의 이메일"
                required
                style={{
                  flex: 1,
                  height: 40,
                  border: '1px solid rgba(34,28,22,.18)',
                  borderRadius: 2,
                  padding: '0 12px',
                  background: 'var(--paper)',
                  fontSize: 13.5,
                }}
              />

              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                style={{
                  height: 40,
                  border: '1px solid rgba(34,28,22,.18)',
                  borderRadius: 2,
                  padding: '0 8px',
                  background: 'var(--paper)',
                  fontSize: 13.5,
                }}
              >
                <option value="EDITOR">편집자</option>
                <option value="VIEWER">열람자</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn--ghost-light btn--sm"
              disabled={sending}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {sending ? '전송 중...' : '초대 메일 보내기'}
            </button>

            {message ? (
              <p
                style={{
                  fontSize: 13,
                  color: message.includes('보냈습니다') ? 'var(--wine)' : 'var(--rust)',
                  marginTop: 8,
                }}
              >
                {message}
              </p>
            ) : null}

            <p style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 8 }}>
              초대 링크는 48시간 동안 유효합니다.
            </p>
          </form>
        ) : (
          <p
            style={{
              fontSize: 13,
              color: 'var(--ink-faint)',
              marginTop: 20,
              lineHeight: 1.6,
            }}
          >
            가족 초대는 소유자만 할 수 있습니다.
          </p>
        )}
      </div>

      <div className="dash-card">
        <p className="dash-card__label">가족 공간 안내</p>

        <p
          style={{
            color: 'var(--ink-soft)',
            fontSize: 14,
            lineHeight: 1.7,
            marginTop: 8,
            marginBottom: 18,
          }}
        >
          가족마다 역할을 나누어 기록을 안전하게 관리할 수 있습니다.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {ROLE_DESCRIPTION.map((item) => (
            <div key={item.role} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className={`family-role family-role--${item.role.toLowerCase()}`}>
                {ROLE_LABEL[item.role]}
              </span>

              <span style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>{item.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}