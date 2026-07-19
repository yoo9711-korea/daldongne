'use client';

import {
  useState,
  type FormEvent,
} from 'react';
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
    title: '공간 관리자',
    desc: '가족 초대와 기록 관리를 할 수 있습니다.',
  },
  {
    role: 'EDITOR',
    title: '함께 기록',
    desc: '사진과 이야기를 함께 남길 수 있습니다.',
  },
  {
    role: 'VIEWER',
    title: '보기만',
    desc: '가족이 남긴 기록을 확인할 수 있습니다.',
  },
];

export default function FamilyClient({
  family,
  isOwner,
}: Props) {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('EDITOR');
  const [sending, setSending] =
    useState(false);
  const [message, setMessage] =
    useState('');

  async function handleInvite(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      return;
    }

    setSending(true);
    setMessage('');

    try {
      const response = await fetch(
        '/api/family/invite',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            familyId: family.id,
            email: normalizedEmail,
            role,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            '초대를 보내지 못했습니다.',
        );
        return;
      }

      setMessage(
        `✓ ${normalizedEmail} 님에게 가족 초대 메일을 보냈습니다.`,
      );
      setEmail('');
      router.refresh();
    } catch {
      setMessage(
        '초대 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="family-client">
      <style>{`
        .family-client {
          width: 100%;
          color: #49362c;
        }

        .family-client-grid {
          display: grid;
          grid-template-columns:
            minmax(0, 1.15fr)
            minmax(300px, 0.85fr);
          gap: 22px;
          align-items: start;
        }

        .family-client-card {
          padding: 28px;
          border-radius: 26px;
          border:
            1px solid
            rgba(196, 139, 108, 0.18);
          background: #ffffff;
          box-shadow:
            0 12px 30px
            rgba(132, 79, 48, 0.05);
        }

        .family-client-label {
          margin: 0;
          color: #d67358;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .family-client-title {
          margin: 9px 0 0;
          color: #49352b;
          font-family:
            'Noto Serif KR',
            serif;
          font-size: 30px;
          line-height: 1.4;
          letter-spacing: -0.04em;
          word-break: keep-all;
        }

        .family-client-description {
          margin: 11px 0 0;
          color: #725d52;
          font-size: 15px;
          line-height: 1.75;
          word-break: keep-all;
        }

        .family-member-list {
          display: grid;
          gap: 10px;
          margin-top: 22px;
        }

        .family-member-item {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 14px;
          border-radius: 18px;
          border:
            1px solid
            rgba(197, 145, 115, 0.16);
          background:
            linear-gradient(
              135deg,
              #fffdfb,
              #fff7f2
            );
        }

        .family-member-avatar {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          flex: 0 0 44px;
          border-radius: 50%;
          background:
            linear-gradient(
              135deg,
              #f5a088,
              #e87b65
            );
          color: #ffffff;
          font-size: 16px;
          font-weight: 900;
          box-shadow:
            0 8px 18px
            rgba(222, 111, 84, 0.16);
        }

        .family-member-information {
          min-width: 0;
          flex: 1;
        }

        .family-member-name {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 7px;
          margin: 0;
          color: #49352b;
          font-size: 15px;
          font-weight: 900;
        }

        .family-member-email {
          margin: 5px 0 0;
          overflow: hidden;
          color: #806b5f;
          font-size: 12px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .family-role-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 25px;
          padding: 0 9px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 900;
          white-space: nowrap;
        }

        .family-role-owner {
          border:
            1px solid
            rgba(204, 126, 90, 0.2);
          background: #fff0e9;
          color: #b45e46;
        }

        .family-role-editor {
          border:
            1px solid
            rgba(98, 148, 104, 0.2);
          background: #edf8ef;
          color: #43724a;
        }

        .family-role-viewer {
          border:
            1px solid
            rgba(92, 127, 164, 0.18);
          background: #eef5fb;
          color: #486c8b;
        }

        .family-subsection {
          margin-top: 24px;
          padding-top: 22px;
          border-top:
            1px solid
            rgba(196, 139, 108, 0.15);
        }

        .family-subsection-label {
          margin: 0 0 11px;
          color: #b56850;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.06em;
        }

        .family-pending-list {
          display: grid;
          gap: 8px;
        }

        .family-pending-item {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          padding: 12px 13px;
          border-radius: 15px;
          border:
            1px solid
            rgba(192, 139, 108, 0.16);
          background: #fffaf7;
        }

        .family-pending-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          flex: 0 0 30px;
          border-radius: 50%;
          background: #fff0e9;
          color: #bb664e;
          font-size: 13px;
          font-weight: 900;
        }

        .family-pending-email {
          min-width: 0;
          flex: 1;
          overflow: hidden;
          color: #725d52;
          font-size: 13px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .family-invite-description {
          margin: 0 0 15px;
          color: #725d52;
          font-size: 14px;
          line-height: 1.75;
          word-break: keep-all;
        }

        .family-invite-fields {
          display: grid;
          grid-template-columns:
            minmax(0, 1fr)
            150px;
          gap: 9px;
        }

        .family-invite-input,
        .family-invite-select {
          width: 100%;
          min-width: 0;
          height: 47px;
          padding: 0 13px;
          border-radius: 12px;
          border:
            1px solid
            rgba(192, 139, 108, 0.28);
          background: #fffdfb;
          color: #49352b;
          font-size: 14px;
          outline: none;
        }

        .family-invite-input:focus,
        .family-invite-select:focus {
          border-color: #e68a6f;
          box-shadow:
            0 0 0 3px
            rgba(230, 138, 111, 0.12);
        }

        .family-invite-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: 48px;
          margin-top: 10px;
          padding: 0 18px;
          border: 0;
          border-radius: 999px;
          background:
            linear-gradient(
              135deg,
              #f49378,
              #e97861
            );
          color: #ffffff;
          font-size: 14px;
          font-weight: 900;
          cursor: pointer;
          box-shadow:
            0 10px 23px
            rgba(220, 104, 77, 0.18);
        }

        .family-invite-button:disabled {
          cursor: wait;
          opacity: 0.65;
        }

        .family-invite-message {
          margin: 11px 0 0;
          padding: 11px 13px;
          border-radius: 13px;
          font-size: 13px;
          line-height: 1.65;
        }

        .family-invite-message-success {
          border:
            1px solid #b8d9be;
          background: #eff9f1;
          color: #397246;
        }

        .family-invite-message-error {
          border:
            1px solid #ebc1b5;
          background: #fff2ee;
          color: #a94f3c;
        }

        .family-invite-notice {
          margin: 11px 0 0;
          color: #907c70;
          font-size: 11px;
          line-height: 1.65;
        }

        .family-role-guide {
          display: grid;
          gap: 11px;
          margin-top: 22px;
        }

        .family-role-guide-item {
          padding: 15px;
          border-radius: 17px;
          border:
            1px solid
            rgba(192, 139, 108, 0.16);
          background: #fffaf7;
        }

        .family-role-guide-header {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .family-role-guide-title {
          color: #49352b;
          font-size: 14px;
          font-weight: 900;
        }

        .family-role-guide-description {
          margin: 8px 0 0;
          color: #725d52;
          font-size: 13px;
          line-height: 1.65;
        }

        @media (max-width: 920px) {
          .family-client-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .family-client-card {
            padding: 21px 16px;
            border-radius: 22px;
          }

          .family-invite-fields {
            grid-template-columns: 1fr;
          }

          .family-member-item {
            align-items: flex-start;
          }

          .family-pending-item {
            flex-wrap: wrap;
          }

          .family-pending-email {
            width: calc(100% - 44px);
            flex: none;
          }
        }
      `}</style>

      <div className="family-client-grid">
        <section className="family-client-card">
          <p className="family-client-label">
            {family.name}
          </p>

          <h2 className="family-client-title">
            함께 기록하는 사람들
          </h2>

          <p className="family-client-description">
            서로 다른 기억과 사진을 한곳에
            모아 우리들의 책을 만들어갑니다.
          </p>

          <div className="family-member-list">
            {family.members.map((member) => (
              <div
                className="family-member-item"
                key={member.id}
              >
                <div className="family-member-avatar">
                  {member.avatar}
                </div>

                <div className="family-member-information">
                  <p className="family-member-name">
                    {member.name}

                    <RoleBadge
                      role={member.role}
                    />
                  </p>

                  <p className="family-member-email">
                    {member.email}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {family.pendingInvitations.length >
            0 && (
            <div className="family-subsection">
              <p className="family-subsection-label">
                아직 수락하지 않은 초대
              </p>

              <div className="family-pending-list">
                {family.pendingInvitations.map(
                  (invitation) => (
                    <div
                      key={invitation.id}
                      className="family-pending-item"
                    >
                      <span className="family-pending-icon">
                        ✉
                      </span>

                      <span className="family-pending-email">
                        {invitation.email}
                      </span>

                      <RoleBadge
                        role={invitation.role}
                      />
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          {isOwner && (
            <form
              onSubmit={handleInvite}
              className="family-subsection"
            >
              <p className="family-subsection-label">
                새로운 사람 초대하기
              </p>

              <p className="family-invite-description">
                사진과 이야기를 함께 남길
                사람의 이메일과 참여 권한을
                선택해주세요.
              </p>

              <div className="family-invite-fields">
                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value,
                    )
                  }
                  placeholder="초대할 이메일"
                  required
                  className="family-invite-input"
                />

                <select
                  value={role}
                  onChange={(event) =>
                    setRole(
                      event.target.value,
                    )
                  }
                  className="family-invite-select"
                >
                  <option value="EDITOR">
                    함께 기록
                  </option>

                  <option value="VIEWER">
                    보기만
                  </option>
                </select>
              </div>

              <button
                type="submit"
                disabled={sending}
                className="family-invite-button"
              >
                {sending
                  ? '초대 보내는 중...'
                  : '초대 메일 보내기'}
              </button>

              {message && (
                <p
                  className={`family-invite-message ${
                    message.startsWith('✓')
                      ? 'family-invite-message-success'
                      : 'family-invite-message-error'
                  }`}
                >
                  {message}
                </p>
              )}

              <p className="family-invite-notice">
                가입하지 않은 이메일도 초대할
                수 있습니다. 초대 링크는
                48시간 동안 유효합니다.
              </p>
            </form>
          )}
        </section>

        <aside className="family-client-card">
          <p className="family-client-label">
            참여 권한 안내
          </p>

          <h2 className="family-client-title">
            역할에 따라
            <br />
            할 수 있는 일이 다릅니다.
          </h2>

          <p className="family-client-description">
            초대할 사람에게 필요한 권한을
            선택해 안전하게 함께 기록할 수
            있습니다.
          </p>

          <div className="family-role-guide">
            {ROLE_DESCRIPTION.map((item) => (
              <div
                key={item.role}
                className="family-role-guide-item"
              >
                <div className="family-role-guide-header">
                  <RoleBadge role={item.role} />

                  <strong className="family-role-guide-title">
                    {item.title}
                  </strong>
                </div>

                <p className="family-role-guide-description">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function RoleBadge({
  role,
}: {
  role: string;
}) {
  const normalizedRole =
    role.toLowerCase();

  return (
    <span
      className={`family-role-badge family-role-${normalizedRole}`}
    >
      {ROLE_LABEL[role] || role}
    </span>
  );
}