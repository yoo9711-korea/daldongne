import { auth } from '@/auth';
import {
  PRODUCT_ADDONS,
} from '@/lib/products/catalog';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';

const STATUS_STEPS = [
  'REQUESTED',
  'CONTACTED',
  'IN_PROGRESS',
  'COMPLETED',
] as const;

export default async function MyProductApplicationsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect('/login');
  }

  const applications =
    await prisma.productApplication.findMany({
      where: {
        userId,
      },
      orderBy: [
        {
          createdAt: 'desc',
        },
        {
          updatedAt: 'desc',
        },
      ],
      select: {
        id: true,
        productCode: true,
        productName: true,
        category: true,
        billingType: true,
        price: true,
        name: true,
        phone: true,
        email: true,
        message: true,
        addonCodes: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

  const activeCount =
    applications.filter(
      (application) =>
        application.status ===
          'REQUESTED' ||
        application.status ===
          'CONTACTED' ||
        application.status ===
          'IN_PROGRESS',
    ).length;

  const completedCount =
    applications.filter(
      (application) =>
        application.status ===
        'COMPLETED',
    ).length;

  const canceledCount =
    applications.filter(
      (application) =>
        application.status ===
        'CANCELED',
    ).length;

  return (
    <main className="applications-page">
      <style>{`
        .applications-page {
          min-height: 100vh;
          padding: 34px 28px 80px;
          box-sizing: border-box;
          background:
            radial-gradient(
              circle at top right,
              rgba(222, 183, 111, 0.22),
              transparent 34%
            ),
            #f7eddc;
          color: #271a12;
        }

        .applications-container {
          width: 100%;
          max-width: 1220px;
          margin: 0 auto;
        }

        .applications-hero {
          padding: 38px;
          border-radius: 32px;
          background:
            linear-gradient(
              135deg,
              #2d1d15 0%,
              #53351f 62%,
              #73502c 100%
            );
          color: #fffaf0;
          box-shadow:
            0 22px 58px
            rgba(57, 35, 20, 0.18);
        }

        .applications-eyebrow {
          margin: 0;
          color: #f0c36a;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .applications-hero h1 {
          margin: 11px 0 0;
          font-family:
            Noto Serif KR, serif;
          font-size:
            clamp(34px, 5vw, 54px);
          line-height: 1.25;
          letter-spacing: -0.05em;
          word-break: keep-all;
        }

        .applications-hero-description {
          margin: 18px 0 0;
          max-width: 820px;
          color:
            rgba(255, 250, 240, 0.82);
          font-size: 16px;
          line-height: 1.8;
          word-break: keep-all;
        }

        .applications-summary {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-top: 20px;
        }

        .applications-summary-card {
          padding: 18px;
          border-radius: 18px;
          border: 1px solid #dfc9a4;
          background: #fffdf7;
        }

        .applications-summary-card span {
          display: block;
          color: #897867;
          font-size: 11px;
          font-weight: 900;
        }

        .applications-summary-card strong {
          display: block;
          margin-top: 7px;
          color: #372518;
          font-size: 26px;
        }

        .applications-list {
          display: grid;
          gap: 18px;
          margin-top: 24px;
        }

        .application-card {
          padding: 26px;
          border-radius: 26px;
          border: 1px solid #dfc9a4;
          background: #fffdf7;
          box-shadow:
            0 12px 32px
            rgba(75, 48, 27, 0.08);
        }

        .application-card-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
        }

        .application-category {
          margin: 0;
          color: #94622f;
          font-size: 12px;
          font-weight: 900;
        }

        .application-card-heading h2 {
          margin: 7px 0 0;
          color: #2d1c12;
          font-family:
            Noto Serif KR, serif;
          font-size: 26px;
          line-height: 1.4;
          letter-spacing: -0.04em;
        }

        .application-code {
          display: block;
          margin-top: 6px;
          color: #958473;
          font-size: 11px;
          word-break: break-all;
        }

        .application-status {
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 900;
          white-space: nowrap;
        }

        .application-status-requested {
          background: #fff0c9;
          color: #80520e;
        }

        .application-status-contacted {
          background: #e7efff;
          color: #28538a;
        }

        .application-status-progress {
          background: #eee7ff;
          color: #603a97;
        }

        .application-status-completed {
          background: #e3f4e6;
          color: #2f6938;
        }

        .application-status-canceled {
          background: #f0ebe6;
          color: #776b60;
        }

        .application-info-grid {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-top: 20px;
        }

        .application-info-box {
          padding: 14px;
          border-radius: 15px;
          border: 1px solid #ead7b7;
          background: #f7eddc;
        }

        .application-info-box span {
          display: block;
          color: #8b7b6c;
          font-size: 10px;
          font-weight: 900;
        }

        .application-info-box strong {
          display: block;
          margin-top: 6px;
          color: #3d2a1c;
          font-size: 14px;
          line-height: 1.55;
          word-break: break-word;
        }

        .application-progress {
          margin-top: 20px;
          padding: 18px;
          border-radius: 18px;
          border: 1px solid #e3cfad;
          background: #fffaf0;
        }

        .application-progress h3 {
          margin: 0;
          color: #4b3422;
          font-size: 14px;
        }

        .application-progress-steps {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 8px;
          margin-top: 14px;
        }

        .application-progress-step {
          position: relative;
          min-height: 52px;
          padding: 10px 8px;
          border-radius: 13px;
          border: 1px solid #dfd3c5;
          background: #f5f1eb;
          color: #9a8f83;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          font-size: 11px;
          font-weight: 900;
          line-height: 1.45;
        }

        .application-progress-step-active {
          border-color: #7b4c21;
          background: #7b4c21;
          color: #fffaf0;
        }

        .application-progress-step-passed {
          border-color: #d6b777;
          background: #f8e8c6;
          color: #744c20;
        }

        .application-canceled-notice {
          margin-top: 14px;
          padding: 14px;
          border-radius: 14px;
          background: #f2ece7;
          color: #75695e;
          font-size: 13px;
          font-weight: 800;
          line-height: 1.7;
        }

        .application-detail-grid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-top: 16px;
        }

        .application-detail-box {
          padding: 17px;
          border-radius: 17px;
          border: 1px solid #e4cfac;
          background: #fffaf0;
        }

        .application-detail-box h3 {
          margin: 0;
          color: #4a3423;
          font-size: 13px;
        }

        .application-contact-list {
          display: grid;
          gap: 8px;
          margin-top: 12px;
        }

        .application-contact-row {
          display: grid;
          grid-template-columns:
            75px 1fr;
          gap: 10px;
          color: #675445;
          font-size: 13px;
          line-height: 1.65;
        }

        .application-contact-row span {
          color: #948270;
          font-weight: 900;
        }

        .application-addon-list {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 12px;
        }

        .application-addon-chip {
          padding: 6px 9px;
          border-radius: 999px;
          background: #6e421d;
          color: #fffaf0;
          font-size: 11px;
          font-weight: 900;
        }

        .application-empty-text {
          margin: 12px 0 0;
          color: #887664;
          font-size: 13px;
          line-height: 1.7;
        }

        .application-message {
          margin-top: 16px;
          padding: 16px;
          border-radius: 16px;
          background: #f4e7d3;
          color: #584331;
          font-size: 13px;
          line-height: 1.8;
          white-space: pre-line;
          word-break: break-word;
        }

        .application-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 17px;
          padding-top: 15px;
          border-top: 1px solid #eadcc6;
          color: #8c7b6a;
          font-size: 11px;
        }

        .applications-empty {
          margin-top: 24px;
          padding: 54px 24px;
          border-radius: 26px;
          border: 1px dashed #cfb88f;
          background: #fffdf7;
          color: #796753;
          text-align: center;
        }

        .applications-empty h2 {
          margin: 0;
          color: #392719;
          font-family:
            Noto Serif KR, serif;
          font-size: 28px;
        }

        .applications-empty p {
          margin: 12px 0 0;
          font-size: 14px;
          line-height: 1.8;
        }

        .applications-empty a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
          margin-top: 20px;
          padding: 0 20px;
          border-radius: 14px;
          background: #6e421d;
          color: #fffaf0;
          font-size: 14px;
          font-weight: 900;
          text-decoration: none;
        }

        @media (max-width: 900px) {
          .applications-summary,
          .application-info-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 700px) {
          .applications-page {
            padding: 20px 14px 60px;
          }

          .applications-hero {
            padding: 29px 22px;
            border-radius: 26px;
          }

          .applications-summary,
          .application-info-grid,
          .application-detail-grid {
            grid-template-columns: 1fr;
          }

          .application-progress-steps {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .application-card {
            padding: 21px 17px;
          }

          .application-contact-row {
            grid-template-columns: 1fr;
            gap: 3px;
          }
        }
      `}</style>

      <div className="applications-container">
        <section className="applications-hero">
          <p className="applications-eyebrow">
            MY APPLICATIONS
          </p>

          <h1>
            내 상품 신청
          </h1>

          <p className="applications-hero-description">
            신청한 인생책 제작과 월간기록 상품의
            처리 상태를 확인할 수 있습니다. 신청
            내용이 확인되면 전화 또는 이메일로
            안내드립니다.
          </p>
        </section>

        <section className="applications-summary">
          <SummaryCard
            label="전체 신청"
            value={applications.length}
          />

          <SummaryCard
            label="처리 중"
            value={activeCount}
          />

          <SummaryCard
            label="완료"
            value={completedCount}
          />

          <SummaryCard
            label="취소"
            value={canceledCount}
          />
        </section>

        {applications.length === 0 ? (
          <section className="applications-empty">
            <h2>
              아직 신청한 상품이 없습니다
            </h2>

            <p>
              인생책 제작과 월간기록 상품을 확인하고
              필요한 상품을 신청해 보세요.
            </p>

            <Link href="/pricing">
              상품 안내 보기
            </Link>
          </section>
        ) : (
          <section className="applications-list">
            {applications.map(
              (application) => {
                const status = String(
                  application.status,
                );

                const addonNames =
                  getAddonNames(
                    application.addonCodes,
                  );

                return (
                  <article
                    key={application.id}
                    className="application-card"
                  >
                    <div className="application-card-heading">
                      <div>
                        <p className="application-category">
                          {getCategoryLabel(
                            application.category,
                          )}
                          {' · '}
                          {getBillingLabel(
                            application.billingType,
                          )}
                        </p>

                        <h2>
                          {application.productName}
                        </h2>

                        <span className="application-code">
                          상품코드{' '}
                          {application.productCode}
                        </span>
                      </div>

                      <span
                        className={`application-status ${getStatusClassName(
                          status,
                        )}`}
                      >
                        {getStatusLabel(status)}
                      </span>
                    </div>

                    <div className="application-info-grid">
                      <InfoBox
                        label="신청 당시 가격"
                        value={formatApplicationPrice(
                          application.price,
                          application.billingType,
                        )}
                      />

                      <InfoBox
                        label="신청일"
                        value={formatDateTime(
                          application.createdAt,
                        )}
                      />

                      <InfoBox
                        label="마지막 처리일"
                        value={formatDateTime(
                          application.updatedAt,
                        )}
                      />

                      <InfoBox
                        label="현재 상태"
                        value={getStatusLabel(
                          status,
                        )}
                      />
                    </div>

                    <ApplicationProgress
                      status={status}
                    />

                    <div className="application-detail-grid">
                      <section className="application-detail-box">
                        <h3>
                          신청자 정보
                        </h3>

                        <div className="application-contact-list">
                          <div className="application-contact-row">
                            <span>
                              이름
                            </span>

                            <strong>
                              {application.name ||
                                session.user.name ||
                                '미입력'}
                            </strong>
                          </div>

                          <div className="application-contact-row">
                            <span>
                              전화번호
                            </span>

                            <strong>
                              {application.phone ||
                                '미입력'}
                            </strong>
                          </div>

                          <div className="application-contact-row">
                            <span>
                              이메일
                            </span>

                            <strong>
                              {application.email ||
                                session.user.email ||
                                '미입력'}
                            </strong>
                          </div>
                        </div>
                      </section>

                      <section className="application-detail-box">
                        <h3>
                          선택 추가 옵션
                        </h3>

                        {addonNames.length > 0 ? (
                          <div className="application-addon-list">
                            {addonNames.map(
                              (addonName) => (
                                <span
                                  key={addonName}
                                  className="application-addon-chip"
                                >
                                  {addonName}
                                </span>
                              ),
                            )}
                          </div>
                        ) : (
                          <p className="application-empty-text">
                            선택한 추가 옵션이 없습니다.
                          </p>
                        )}
                      </section>
                    </div>

                    {application.message ? (
                      <div className="application-message">
                        <strong>
                          요청사항
                        </strong>
                        <br />
                        {application.message}
                      </div>
                    ) : null}

                    <footer className="application-card-footer">
                      <span>
                        접수번호 {application.id}
                      </span>

                      <span>
                        문의가 필요한 경우 접수번호를
                        알려 주세요.
                      </span>
                    </footer>
                  </article>
                );
              },
            )}
          </section>
        )}
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="applications-summary-card">
      <span>
        {label}
      </span>

      <strong>
        {value.toLocaleString('ko-KR')}
      </strong>
    </div>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="application-info-box">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function ApplicationProgress({
  status,
}: {
  status: string;
}) {
  if (status === 'CANCELED') {
    return (
      <section className="application-progress">
        <h3>
          처리 진행 상황
        </h3>

        <div className="application-canceled-notice">
          이 상품 신청은 취소된 상태입니다.
        </div>
      </section>
    );
  }

  const currentIndex =
    STATUS_STEPS.findIndex(
      (step) => step === status,
    );

  return (
    <section className="application-progress">
      <h3>
        처리 진행 상황
      </h3>

      <div className="application-progress-steps">
        {STATUS_STEPS.map(
          (step, index) => {
            const isCurrent =
              index === currentIndex;

            const isPassed =
              currentIndex > index;

            return (
              <div
                key={step}
                className={[
                  'application-progress-step',
                  isCurrent
                    ? 'application-progress-step-active'
                    : '',
                  isPassed
                    ? 'application-progress-step-passed'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {getStatusLabel(step)}
              </div>
            );
          },
        )}
      </div>
    </section>
  );
}

function getAddonNames(
  value: unknown,
) {
  if (!Array.isArray(value)) {
    return [];
  }

  const addonCodes = value.filter(
    (
      item,
    ): item is string =>
      typeof item === 'string',
  );

  return addonCodes.map(
    (addonCode) => {
      const addon =
        PRODUCT_ADDONS.find(
          (item) =>
            item.code === addonCode,
        );

      return addon?.name || addonCode;
    },
  );
}

function getCategoryLabel(
  category: string,
) {
  if (category === 'LIFE_BOOK') {
    return '인생책 제작';
  }

  if (category === 'MONTHLY_RECORD') {
    return '월간기록 구독';
  }

  return category;
}

function getBillingLabel(
  billingType: string,
) {
  if (billingType === 'ONE_TIME') {
    return '한 번 결제';
  }

  if (billingType === 'MONTHLY') {
    return '매월 결제';
  }

  return billingType;
}

function formatApplicationPrice(
  price: number,
  billingType: string,
) {
  const formatted =
    price.toLocaleString('ko-KR');

  if (billingType === 'MONTHLY') {
    return `${formatted}원 / 월`;
  }

  return `${formatted}원부터`;
}

function formatDateTime(
  date: Date,
) {
  return new Intl.DateTimeFormat(
    'ko-KR',
    {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(date);
}

function getStatusLabel(
  status: string,
) {
  if (status === 'REQUESTED') {
    return '신청 접수';
  }

  if (status === 'CONTACTED') {
    return '연락 완료';
  }

  if (status === 'IN_PROGRESS') {
    return '진행 중';
  }

  if (status === 'COMPLETED') {
    return '처리 완료';
  }

  if (status === 'CANCELED') {
    return '신청 취소';
  }

  return '상태 확인 필요';
}

function getStatusClassName(
  status: string,
) {
  if (status === 'REQUESTED') {
    return 'application-status-requested';
  }

  if (status === 'CONTACTED') {
    return 'application-status-contacted';
  }

  if (status === 'IN_PROGRESS') {
    return 'application-status-progress';
  }

  if (status === 'COMPLETED') {
    return 'application-status-completed';
  }

  return 'application-status-canceled';
}