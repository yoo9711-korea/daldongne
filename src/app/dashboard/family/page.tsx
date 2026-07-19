// src/app/dashboard/family/page.tsx
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import FamilyClient from './FamilyClient';

export default async function FamilyPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id;
  const now = new Date();

  const membership = await prisma.familyMember.findFirst({
    where: { userId },
    include: {
      family: {
        include: {
          members: {
            include: { user: true },
            orderBy: { joinedAt: 'asc' },
          },
          invitations: {
            where: {
              usedAt: null,
              expiresAt: { gt: now },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  });

  async function createFamily(formData: FormData) {
    'use server';

    const session = await auth();

    if (!session?.user?.id) {
      redirect('/login');
    }

    const name = String(
      formData.get('name') || '',
    ).trim();

    if (!name) {
      return;
    }

    await prisma.family.create({
      data: {
        name,
        members: {
          create: {
            userId: session.user.id,
            role: 'OWNER',
          },
        },
      },
    });

    revalidatePath('/dashboard/family');
  }

  return (
    <main className="family-page">
      <style>{`
        .family-page {
          width: 100%;
          min-height: 100vh;
          padding: 28px;
          color: #49362c;
        }

        .family-page-container {
          width: 100%;
          max-width: 1380px;
          margin: 0 auto;
        }

        .family-hero {
          position: relative;
          overflow: hidden;
          padding: 38px;
          border-radius: 34px;
          border:
            1px solid rgba(218, 143, 108, 0.22);
          background:
            radial-gradient(
              circle at 91% 4%,
              rgba(255, 210, 190, 0.58),
              transparent 25rem
            ),
            radial-gradient(
              circle at 5% 100%,
              rgba(255, 241, 202, 0.52),
              transparent 23rem
            ),
            linear-gradient(
              135deg,
              #fff8f3 0%,
              #ffffff 52%,
              #fff1e8 100%
            );
          box-shadow:
            0 18px 48px
            rgba(156, 91, 58, 0.08);
        }

        .family-eyebrow {
          margin: 0 0 13px;
          color: #dd765b;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .family-title {
          max-width: 920px;
          margin: 0;
          color: #49352b;
          font-family:
            'Noto Serif KR',
            serif;
          font-size:
            clamp(34px, 5vw, 56px);
          line-height: 1.2;
          letter-spacing: -0.05em;
          word-break: keep-all;
        }

        .family-description {
          max-width: 820px;
          margin: 22px 0 0;
          color: #725d52;
          font-size: 18px;
          line-height: 1.8;
          word-break: keep-all;
        }

        .family-guide {
          margin-top: 26px;
          padding: 18px 20px;
          border-radius: 20px;
          border:
            1px solid rgba(218, 143, 108, 0.2);
          background:
            rgba(255, 255, 255, 0.78);
          box-shadow:
            0 10px 26px
            rgba(147, 87, 55, 0.045);
        }

        .family-guide-label {
          margin: 0;
          color: #d56f55;
          font-size: 12px;
          font-weight: 900;
        }

        .family-guide strong {
          display: block;
          margin-top: 7px;
          color: #49352b;
          font-size: 20px;
          line-height: 1.5;
        }

        .family-guide p:last-child {
          margin: 6px 0 0;
          color: #80685c;
          font-size: 14px;
          line-height: 1.7;
        }

        .family-content {
          margin-top: 24px;
        }

        .family-create-card {
          max-width: 760px;
          padding: 30px;
          border-radius: 30px;
          border:
            1px solid rgba(196, 139, 108, 0.19);
          background:
            linear-gradient(
              145deg,
              #ffffff,
              #fffaf7
            );
          box-shadow:
            0 14px 34px
            rgba(132, 79, 48, 0.055);
        }

        .family-card-label {
          margin: 0;
          color: #d67358;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .family-card-title {
          margin: 10px 0 0;
          color: #49352b;
          font-family:
            'Noto Serif KR',
            serif;
          font-size: 30px;
          line-height: 1.4;
          letter-spacing: -0.04em;
          word-break: keep-all;
        }

        .family-card-description {
          margin: 14px 0 0;
          color: #725d52;
          font-size: 16px;
          line-height: 1.8;
          word-break: keep-all;
        }

        .family-create-form {
          display: flex;
          gap: 10px;
          margin-top: 22px;
        }

        .family-name-input {
          flex: 1;
          min-width: 0;
          height: 50px;
          padding: 0 15px;
          border-radius: 13px;
          border:
            1px solid rgba(192, 139, 108, 0.3);
          background: #fffdfb;
          color: #49352b;
          font-size: 16px;
          outline: none;
        }

        .family-name-input:focus {
          border-color: #e68a6f;
          box-shadow:
            0 0 0 3px
            rgba(230, 138, 111, 0.12);
        }

        .family-create-button {
          min-height: 50px;
          padding: 0 22px;
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
          white-space: nowrap;
          cursor: pointer;
          box-shadow:
            0 11px 25px
            rgba(220, 104, 77, 0.19);
        }

        .family-client-shell {
          padding: 28px;
          border-radius: 30px;
          border:
            1px solid rgba(196, 139, 108, 0.19);
          background:
            linear-gradient(
              145deg,
              #ffffff,
              #fffaf7
            );
          box-shadow:
            0 14px 34px
            rgba(132, 79, 48, 0.055);
        }

        .family-client-shell input,
        .family-client-shell textarea,
        .family-client-shell select {
          border-color:
            rgba(192, 139, 108, 0.28) !important;
          background: #fffdfb !important;
          color: #49352b !important;
        }

        @media (max-width: 700px) {
          .family-page {
            padding: 16px;
          }

          .family-hero {
            padding: 26px 20px;
            border-radius: 24px;
          }

          .family-create-card,
          .family-client-shell {
            padding: 21px 16px;
            border-radius: 24px;
          }

          .family-create-form {
            display: grid;
            grid-template-columns: 1fr;
          }

          .family-create-button {
            width: 100%;
          }
        }
      `}</style>

      <div className="family-page-container">
        <section className="family-hero">
          <p className="family-eyebrow">
            함께 기록하기
          </p>

          <h1 className="family-title">
            소중한 사람들과 함께
            <br />
            사진과 이야기를 모읍니다.
          </h1>

          <p className="family-description">
            부모님의 인생책은 혼자보다
            함께 만들 때 더 풍성해집니다.
            형제, 자녀, 배우자와 함께 각자가
            기억하는 사진과 이야기를
            차근차근 남겨보세요.
          </p>

          <div className="family-guide">
            <p className="family-guide-label">
              가족 공간 안내
            </p>

            <strong>
              하나의 공간에서 함께 기록합니다.
            </strong>

            <p>
              가족을 초대하면 서로 다른 기억과
              사진을 한곳에 모아 책의 재료로
              활용할 수 있습니다.
            </p>
          </div>
        </section>

        <section className="family-content">
          {!membership ? (
            <div className="family-create-card">
              <p className="family-card-label">
                아직 가족 공간이 없습니다
              </p>

              <h2 className="family-card-title">
                우리들의 이야기를 모을
                공간을 만들어보세요.
              </h2>

              <p className="family-card-description">
                가족 공간을 만들면 사진,
                기억나는 이야기와 인터뷰 답변을
                함께 모을 수 있습니다.
                사람마다 기억하는 장면이 다르기
                때문에 함께 기록할수록 책의
                내용이 더 따뜻하고 풍성해집니다.
              </p>

              <form
                action={createFamily}
                className="family-create-form"
              >
                <input
                  type="text"
                  name="name"
                  placeholder="예: 우리들의 기억 공간"
                  required
                  className="family-name-input"
                />

                <button
                  type="submit"
                  className="family-create-button"
                >
                  가족 공간 만들기
                </button>
              </form>
            </div>
          ) : (
            <div className="family-client-shell">
              <FamilyClient
                family={{
                  id: membership.familyId,
                  name: membership.family.name,
                  members:
                    membership.family.members.map(
                      (member) => {
                        const name =
                          member.user.name ||
                          member.user.email ||
                          '가족';

                        return {
                          id: member.id,
                          name,
                          email:
                            member.user.email || '',
                          role: member.role,
                          avatar: name[0] || '?',
                        };
                      },
                    ),
                  pendingInvitations:
                    membership.family.invitations.map(
                      (invitation) => ({
                        id: invitation.id,
                        email: invitation.email,
                        role: invitation.role,
                      }),
                    ),
                }}
                isOwner={
                  membership.role === 'OWNER'
                }
              />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}