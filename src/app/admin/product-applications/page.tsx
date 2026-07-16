import { auth } from '@/auth';
import ProductApplicationAdminNote from '@/components/admin/ProductApplicationAdminNote';
import ProductApplicationStatusButton from '@/components/admin/ProductApplicationStatusButton';
import {
  PRODUCT_ADDONS,
} from '@/lib/products/catalog';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';

const ACTIVE_STATUSES = [
  'REQUESTED',
  'CONTACTED',
  'IN_PROGRESS',
] as const;

type AdminProductApplicationsPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
  }>;
};

const STATUS_FILTERS = [
  'ALL',
  'REQUESTED',
  'CONTACTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELED',
] as const;

type StatusFilter =
  (typeof STATUS_FILTERS)[number];

export default async function AdminProductApplicationsPage({
  searchParams,
}: AdminProductApplicationsPageProps) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect('/login');
  }

  const adminUser =
    await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        role: true,
      },
    });

   if (adminUser?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const params = await searchParams;

  const rawQuery =
    Array.isArray(params.q)
      ? params.q[0]
      : params.q;

  const query =
    rawQuery?.trim() || '';

  const rawStatus =
    Array.isArray(params.status)
      ? params.status[0]
      : params.status;

    const statusFilter: StatusFilter =
    typeof rawStatus === 'string' &&
    STATUS_FILTERS.includes(
      rawStatus as StatusFilter,
    )
      ? (rawStatus as StatusFilter)
      : 'ALL';

  const applications =
    await prisma.productApplication.findMany({
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
        adminNote: true,
        adminNoteUpdatedAt: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

   const normalizedQuery =
    query.toLocaleLowerCase('ko-KR');

  const filteredApplications =
    applications.filter(
      (application) => {
        const matchesStatus =
          statusFilter === 'ALL' ||
          application.status ===
            statusFilter;

        if (!matchesStatus) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        const searchableText = [
          application.productName,
          application.productCode,
          application.name,
          application.phone,
          application.email,
          application.message,
          application.adminNote,
          application.user.name,
          application.user.email,
        ]
          .filter(
            (
              value,
            ): value is string =>
              typeof value ===
                'string' &&
              value.length > 0,
          )
          .join(' ')
          .toLocaleLowerCase(
            'ko-KR',
          );

        return searchableText.includes(
          normalizedQuery,
        );
      },
    );

  const requestedCount =
    applications.filter(
      (application) =>
        application.status ===
        'REQUESTED',
    ).length;

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
    <main className="product-admin-page">
      <style>{`
        .product-admin-page {
          width: 100%;
          color: var(--ink, #271a12);
        }

        .product-admin-header {
          padding: 28px;
          border-radius: 26px;
          background:
            linear-gradient(
              135deg,
              #2d1d15 0%,
              #593a23 100%
            );
          color: #fffaf0;
          box-shadow:
            0 18px 46px
            rgba(57, 35, 20, 0.16);
        }

        .product-admin-eyebrow {
          margin: 0;
          color: #f0c36a;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .product-admin-header h1 {
          margin: 9px 0 0;
          font-family:
            Noto Serif KR, serif;
          font-size:
            clamp(28px, 4vw, 42px);
          line-height: 1.3;
          letter-spacing: -0.05em;
        }

        .product-admin-header p:last-child {
          margin: 12px 0 0;
          color:
            rgba(255, 250, 240, 0.8);
          font-size: 14px;
          line-height: 1.75;
        }

        .product-summary-grid {
          display: grid;
          grid-template-columns:
            repeat(5, minmax(0, 1fr));
          gap: 12px;
          margin-top: 20px;
        }

        .product-summary-card {
          padding: 18px;
          border-radius: 18px;
          border:
            1px solid #dfc9a4;
          background: #fffdf7;
        }

        .product-summary-card span {
          display: block;
          color: #867462;
          font-size: 11px;
          font-weight: 900;
        }

        .product-summary-card strong {
          display: block;
          margin-top: 7px;
          color: #392719;
          font-size: 25px;
        }
    
               .product-filter-panel {
          display: grid;
          grid-template-columns:
            minmax(0, 1fr) 190px auto auto;
          gap: 10px;
          margin-top: 20px;
          padding: 18px;
          border-radius: 20px;
          border: 1px solid #dfc9a4;
          background: #fffdf7;
        }

        .product-filter-panel input,
        .product-filter-panel select {
          width: 100%;
          min-height: 44px;
          box-sizing: border-box;
          border: 1px solid #d8c3a1;
          border-radius: 12px;
          background: #fffefb;
          color: #35251a;
          font: inherit;
          font-size: 13px;
          outline: none;
        }

        .product-filter-panel input {
          padding: 0 13px;
        }

        .product-filter-panel select {
          padding: 0 11px;
        }

        .product-filter-panel input:focus,
        .product-filter-panel select:focus {
          border-color: #8a5a2c;
          box-shadow:
            0 0 0 3px
            rgba(138, 90, 44, 0.12);
        }

        .product-filter-button,
        .product-filter-reset {
          min-height: 44px;
          padding: 0 16px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          font-size: 13px;
          font-weight: 900;
          text-decoration: none;
          white-space: nowrap;
        }

        .product-filter-button {
          border: 1px solid #6e421d;
          background: #6e421d;
          color: #fffaf0;
          cursor: pointer;
        }

        .product-filter-reset {
          border: 1px solid #d8c3a1;
          background: #fffaf0;
          color: #6e421d;
        }

        .product-filter-result {
          margin: 12px 2px 0;
          color: #786654;
          font-size: 12px;
          line-height: 1.65;
        }
        .product-admin-list {
          display: grid;
          gap: 16px;
          margin-top: 22px;
        }

        .product-application-card {
          padding: 24px;
          border-radius: 24px;
          border:
            1px solid #dfc9a4;
          background: #fffdf7;
          box-shadow:
            0 10px 28px
            rgba(75, 48, 27, 0.07);
        }

        .product-card-heading {
          display: flex;
          justify-content:
            space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 14px;
        }

        .product-card-category {
          margin: 0;
          color: #94622f;
          font-size: 12px;
          font-weight: 900;
        }

        .product-card-heading h2 {
          margin: 7px 0 0;
          color: #2d1c12;
          font-family:
            Noto Serif KR, serif;
          font-size: 24px;
          line-height: 1.4;
          letter-spacing: -0.04em;
        }

        .product-code {
          display: block;
          margin-top: 6px;
          color: #968675;
          font-size: 11px;
          word-break: break-all;
        }

        .product-status {
          padding: 7px 11px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 900;
          white-space: nowrap;
        }

        .product-status-requested {
          background: #fff0c9;
          color: #80520e;
        }

        .product-status-contacted {
          background: #e7efff;
          color: #28538a;
        }

        .product-status-progress {
          background: #eee7ff;
          color: #603a97;
        }

        .product-status-completed {
          background: #e3f4e6;
          color: #2f6938;
        }

        .product-status-canceled {
          background: #f0ebe6;
          color: #776b60;
        }

        .product-info-grid {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-top: 20px;
        }

        .product-info-box {
          padding: 14px;
          border-radius: 15px;
          background: #f7eddc;
          border:
            1px solid #ead7b7;
        }

        .product-info-box span {
          display: block;
          color: #8a806f;
          font-size: 10px;
          font-weight: 900;
        }

        .product-info-box strong {
          display: block;
          margin-top: 6px;
          color: #3d2a1c;
          font-size: 14px;
          line-height: 1.55;
          word-break: break-word;
        }

        .product-detail-grid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-top: 16px;
        }

        .product-detail-section {
          padding: 17px;
          border-radius: 17px;
          border:
            1px solid #e4cfac;
          background: #fffaf0;
        }

        .product-detail-section h3 {
          margin: 0;
          color: #4a3423;
          font-size: 13px;
        }

        .product-contact-list {
          display: grid;
          gap: 9px;
          margin-top: 12px;
        }

        .product-contact-row {
          display: grid;
          grid-template-columns:
            78px 1fr;
          gap: 10px;
          color: #675445;
          font-size: 13px;
          line-height: 1.65;
        }

        .product-contact-row span {
          color: #948270;
          font-weight: 900;
        }

        .product-contact-row a {
          color: #6e421d;
          font-weight: 800;
          text-decoration: none;
          word-break: break-all;
        }

        .product-addon-list {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 12px;
        }

        .product-addon-chip {
          padding: 6px 9px;
          border-radius: 999px;
          background: #6e421d;
          color: #fffaf0;
          font-size: 11px;
          font-weight: 900;
        }

        .product-empty-text {
          margin: 12px 0 0;
          color: #887664;
          font-size: 13px;
          line-height: 1.7;
        }

        .product-message {
          margin: 16px 0 0;
          padding: 16px;
          border-radius: 16px;
          background: #f4e7d3;
          color: #584331;
          font-size: 13px;
          line-height: 1.8;
          white-space: pre-line;
          word-break: break-word;
        }

        .product-card-footer {
          display: flex;
          justify-content:
            space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 17px;
          padding-top: 15px;
          border-top:
            1px solid #eadcc6;
          color: #8c7b6a;
          font-size: 11px;
        }

        .product-empty-card {
          margin-top: 22px;
          padding: 48px 24px;
          border-radius: 24px;
          border:
            1px dashed #cfb88f;
          background: #fffdf7;
          color: #796753;
          text-align: center;
          line-height: 1.8;
        }

        .product-pricing-link {
          color: #6e421d;
          font-weight: 900;
        }

        @media (max-width: 1050px) {
          .product-summary-grid {
            grid-template-columns:
              repeat(3, minmax(0, 1fr));
          }

          .product-info-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 720px) {
                     .product-filter-panel {
            grid-template-columns: 1fr;
          }

          .product-filter-button,
          .product-filter-reset {
            width: 100%;
          }
          .product-summary-grid,
          .product-info-grid,
          .product-detail-grid {
            grid-template-columns: 1fr;
          }

          .product-application-card {
            padding: 20px 17px;
          }

          .product-contact-row {
            grid-template-columns: 1fr;
            gap: 3px;
          }
        }
      `}</style>

      <section className="product-admin-header">
        <p className="product-admin-eyebrow">
          PRODUCT APPLICATIONS
        </p>

        <h1>
          상품 신청 관리
        </h1>

        <p>
          인생책 제작과 월간기록 구독 신청,
          선택 옵션과 신청자 연락처를 확인합니다.
        </p>
      </section>

            <section className="product-summary-grid">
        <SummaryCard
          label="전체 신청"
          value={applications.length}
        />

        <SummaryCard
          label="새로운 접수"
          value={requestedCount}
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

      <form
        method="get"
        className="product-filter-panel"
      >
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="상품명, 신청자, 연락처, 요청사항, 관리자 메모 검색"
          aria-label="상품 신청 검색"
        />

        <select
          name="status"
          defaultValue={statusFilter}
          aria-label="신청 상태 필터"
        >
          <option value="ALL">
            전체 상태
          </option>

          <option value="REQUESTED">
            새로운 접수
          </option>

          <option value="CONTACTED">
            연락 완료
          </option>

          <option value="IN_PROGRESS">
            진행 중
          </option>

          <option value="COMPLETED">
            처리 완료
          </option>

          <option value="CANCELED">
            신청 취소
          </option>
        </select>

        <button
          type="submit"
          className="product-filter-button"
        >
          검색
        </button>

        <Link
          href="/admin/product-applications"
          className="product-filter-reset"
        >
          초기화
        </Link>
      </form>

      <p className="product-filter-result">
        전체{' '}
        {applications.length.toLocaleString(
          'ko-KR',
        )}
        건 중{' '}
        {filteredApplications.length.toLocaleString(
          'ko-KR',
        )}
        건이 표시됩니다.
      </p>

      {applications.length === 0 ? (
        <section className="product-empty-card">
          아직 접수된 상품 신청이 없습니다.
          <br />

          <Link
            href="/pricing"
            className="product-pricing-link"
          >
            상품 안내 페이지 확인
          </Link>
        </section>
            ) : filteredApplications.length === 0 ? (
        <section className="product-empty-card">
          검색 조건에 맞는 상품 신청이 없습니다.
          <br />

          <Link
            href="/admin/product-applications"
            className="product-pricing-link"
          >
            검색 조건 초기화
          </Link>
        </section>
      ) : (
        <section className="product-admin-list">
          {filteredApplications.map(
            (application) => {
              const addonNames =
                getAddonNames(
                  application.addonCodes,
                );

              const customerName =
                application.name ||
                application.user.name ||
                '이름 미입력';

              const customerEmail =
                application.email ||
                application.user.email ||
                '';

              return (
                <article
                  key={application.id}
                  className="product-application-card"
                >
                  <div className="product-card-heading">
                    <div>
                      <p className="product-card-category">
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

                      <span className="product-code">
                        상품코드{' '}
                        {application.productCode}
                      </span>
                    </div>

                    <span
                      className={`product-status ${getStatusClassName(
                        application.status,
                      )}`}
                    >
                      {getStatusLabel(
                        application.status,
                      )}
                    </span>
                  </div>

                  <div className="product-info-grid">
                    <InfoBox
                      label="신청 당시 가격"
                      value={formatApplicationPrice(
                        application.price,
                        application.billingType,
                      )}
                    />

                    <InfoBox
                      label="신청자"
                      value={customerName}
                    />

                    <InfoBox
                      label="접수일"
                      value={formatDateTime(
                        application.createdAt,
                      )}
                    />

                    <InfoBox
                      label="마지막 변경"
                      value={formatDateTime(
                        application.updatedAt,
                      )}
                    />
                  </div>

                  <div className="product-detail-grid">
                    <section className="product-detail-section">
                      <h3>
                        신청자 연락처
                      </h3>

                      <div className="product-contact-list">
                        <div className="product-contact-row">
                          <span>
                            이름
                          </span>

                          <strong>
                            {customerName}
                          </strong>
                        </div>

                        <div className="product-contact-row">
                          <span>
                            전화번호
                          </span>

                          {application.phone ? (
                            <a
                              href={`tel:${application.phone}`}
                            >
                              {application.phone}
                            </a>
                          ) : (
                            <strong>
                              미입력
                            </strong>
                          )}
                        </div>

                        <div className="product-contact-row">
                          <span>
                            이메일
                          </span>

                          {customerEmail ? (
                            <a
                              href={`mailto:${customerEmail}`}
                            >
                              {customerEmail}
                            </a>
                          ) : (
                            <strong>
                              미입력
                            </strong>
                          )}
                        </div>
                      </div>
                    </section>

                    <section className="product-detail-section">
                      <h3>
                        선택 추가 옵션
                      </h3>

                      {addonNames.length > 0 ? (
                        <div className="product-addon-list">
                          {addonNames.map(
                            (addonName) => (
                              <span
                                key={addonName}
                                className="product-addon-chip"
                              >
                                {addonName}
                              </span>
                            ),
                          )}
                        </div>
                      ) : (
                        <p className="product-empty-text">
                          선택한 추가 옵션이 없습니다.
                        </p>
                      )}
                    </section>
                  </div>

                                  {application.message ? (
                    <div className="product-message">
                      <strong>
                        요청사항
                      </strong>
                      <br />
                      {application.message}
                    </div>
                  ) : null}

                  <ProductApplicationAdminNote
                    applicationId={application.id}
                    initialNote={
                      application.adminNote || ''
                    }
                    updatedAt={
                      application.adminNoteUpdatedAt
                        ? formatDateTime(
                            application.adminNoteUpdatedAt,
                          )
                        : null
                    }
                  />

                  <ProductApplicationStatusButton
                    applicationId={application.id}
                    currentStatus={application.status}
                  />

                  <footer className="product-card-footer">
                    <span>
                      접수번호 {application.id}
                    </span>

                                        <span>
                      현재 상태{' '}
                      {getStatusLabel(
                        application.status,
                      )}
                    </span>
                  </footer>
                </article>
              );
            },
          )}
        </section>
      )}
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
    <div className="product-summary-card">
      <span>
        {label}
      </span>

      <strong>
        {value.toLocaleString(
          'ko-KR',
        )}
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
    <div className="product-info-box">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
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
    return '새로운 접수';
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
    return 'product-status-requested';
  }

  if (status === 'CONTACTED') {
    return 'product-status-contacted';
  }

  if (status === 'IN_PROGRESS') {
    return 'product-status-progress';
  }

  if (status === 'COMPLETED') {
    return 'product-status-completed';
  }

  return 'product-status-canceled';
}

getStatusClassName