'use client';

import { useState, type FormEvent } from 'react';
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
  OWNER: '관리자',
  EDITOR: '함께 기록',
  VIEWER: '보기만',
};

const ROLE_DESCRIPTION = [
  {
    role: 'OWNER',
    desc: '가족 공간 관리자 — 가족 초대와 기록 관리를 할 수 있습니다.',
  },
  {
    role: 'EDITOR',
    desc: '함께 기록하기 — 사진과 이야기를 함께 남길 수 있습니다.',
  },
  {
    role: 'VIEWER',
    desc: '보기만 가능 — 가족이 남긴 기록을 확인할 수 있습니다.',
  },
];

export default function FamilyClient({ family, isOwner }: Props) {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('EDITOR');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  async function handleInvite(e: FormEvent) {
    e.preventDefault();

    if (!email.trim()) {
      return;
    }

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
        setMessage(data.error || '초대를 보내지 못했습니다.');
      } else {
        setMessage(`✓ ${email} 님에게 가족 초대 메일을 보냈습니다.`);
        setEmail('');
        router.refresh();
      }
    } catch {
      setMessage('초대 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="family-grid">
      <div className="dash-card">
        <p className="dash-card__label">{family.name}</p>

        <h2
          style={{
            margin: '8px 0 18px',
            fontFamily: 'Noto Serif KR, serif',
            fontSize: 30,
            lineHeight: 1.35,
            color: 'var(--ink)',
          }}
        >
          함께 기록할 가족
        </h2>

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

        {family.pendingInvitations.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                letterSpacing: '.08em',
                color: 'var(--ink-faint)',
                marginBottom: 10,
              }}
            >
              아직 수락하지 않은 가족
            </p>

            {family.pendingInvitations.map((invitation) => (
              <div
                key={invitation.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 0',
                  borderBottom: '1px solid rgba(34,28,22,.06)',
                  fontSize: 15,
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
        )}

        {isOwner && (
          <form onSubmit={handleInvite} style={{ marginTop: 24 }}>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                letterSpacing: '.08em',
                color: 'var(--ink-faint)',
                marginBottom: 10,
              }}
            >
              가족 초대하기
            </p>

            <p
              style={{
                color: 'var(--ink-soft)',
                fontSize: 16,
                lineHeight: 1.7,
                marginTop: 0,
                marginBottom: 14,
              }}
            >
              부모님 인생책을 함께 만들 가족을 초대하세요. 가족마다 기억하는 사진과
              이야기가 달라서, 함께 기록할수록 책의 내용이 더 풍성해집니다.
            </p>

            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="초대할 가족의 이메일"
                required
                style={{
                  flex: 1,
                  height: 44,
                  border: '1px solid rgba(34,28,22,.18)',
                  borderRadius: 10,
                  padding: '0 12px',
                  background: 'var(--paper)',
                  fontSize: 15,
                }}
              />

              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  height: 44,
                  border: '1px solid rgba(34,28,22,.18)',
                  borderRadius: 10,
                  padding: '0 10px',
                  background: 'var(--paper)',
                  fontSize: 15,
                }}
              >
                <option value="EDITOR">함께 기록하기</option>
                <option value="VIEWER">보기만 가능</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn--ghost-light btn--sm"
              disabled={sending}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {sending ? '초대 보내는 중...' : '✉️ 인생책 함께 만들 가족 초대'}
            </button>

            {message && (
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: message.startsWith('✓') ? 'var(--wine)' : 'var(--rust)',
                  marginTop: 10,
                }}
              >
                {message}
              </p>
            )}

            <p
              style={{
                fontSize: 13,
                color: 'var(--ink-faint)',
                lineHeight: 1.6,
                marginTop: 10,
              }}
            >
              ※ 가입하지 않은 이메일도 초대할 수 있습니다. 초대 링크는 48시간 동안 유효합니다.
            </p>
          </form>
        )}
      </div>

      <div className="dash-card">
        <p className="dash-card__label">가족 공간 안내</p>

        <h2
          style={{
            margin: '8px 0 16px',
            fontFamily: 'Noto Serif KR, serif',
            fontSize: 28,
            lineHeight: 1.35,
            color: 'var(--ink)',
          }}
        >
          가족과 함께 기록하면
          <br />
          인생책이 더 따뜻해집니다.
        </h2>

        <p
          style={{
            color: 'var(--ink-soft)',
            fontSize: 16,
            lineHeight: 1.7,
            marginTop: 0,
            marginBottom: 18,
          }}
        >
          한 사람의 삶은 가족마다 다르게 기억됩니다. 누군가는 사진을 기억하고,
          누군가는 그날의 말을 기억합니다. 가족 공간은 그 기억들을 함께 모으는 곳입니다.
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            marginTop: 8,
          }}
        >
          {ROLE_DESCRIPTION.map((item) => (
            <div
              key={item.role}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              <span className={`family-role family-role--${item.role.toLowerCase()}`}>
                {ROLE_LABEL[item.role]}
              </span>

              <span
                style={{
                  fontSize: 15,
                  lineHeight: 1.65,
                  color: 'var(--ink-soft)',
                }}
              >
                {item.desc}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}