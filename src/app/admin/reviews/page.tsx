import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  CustomerReviewStatus,
} from '@prisma/client';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<
  CustomerReviewStatus,
  string
> = {
  PENDING: '승인 대기',
  APPROVED: '승인 완료',
  REJECTED: '거절',
};

const STATUS_SECTIONS = [
  {
    status: CustomerReviewStatus.PENDING,
    title: '승인 대기 후기',
    description:
      '내용을 확인하고 홈페이지 공개 여부를 결정합니다.',
  },
  {
    status: CustomerReviewStatus.APPROVED,
    title: '홈페이지 공개 후기',
    description:
      '승인되고 공개 중인 후기입니다.',
  },
  {
    status: CustomerReviewStatus.REJECTED,
    title: '거절한 후기',
    description:
      '홈페이지에 공개하지 않기로 결정한 후기입니다.',
  },
] as const;

async function requireAdmin() {
  const session = await auth();

  const role = (
    session?.user as
      | { role?: string }
      | undefined
  )?.role;

  if (!session?.user || role !== 'ADMIN') {
    throw new Error(
      '관리자만 고객 후기를 관리할 수 있습니다.',
    );
  }
}

function getFormValue(
  formData: FormData,
  key: string,
) {
  const value = formData.get(key);

  return typeof value === 'string'
    ? value.trim()
    : '';
}

async function updateReviewStatus(
  formData: FormData,
) {
  'use server';

  await requireAdmin();

  const reviewId = getFormValue(
    formData,
    'reviewId',
  );

  const statusValue = getFormValue(
    formData,
    'status',
  );

  if (!reviewId) {
    throw new Error(
      '고객 후기 ID가 없습니다.',
    );
  }

  if (
    !Object.values(
      CustomerReviewStatus,
    ).includes(
      statusValue as CustomerReviewStatus,
    )
  ) {
    throw new Error(
      '올바른 후기 상태가 아닙니다.',
    );
  }

  const status =
    statusValue as CustomerReviewStatus;

  await prisma.customerReview.update({
    where: {
      id: reviewId,
    },
    data: {
      status,
      approvedAt:
        status ===
        CustomerReviewStatus.APPROVED
          ? new Date()
          : null,
      isVisible:
        status ===
        CustomerReviewStatus.APPROVED,
      isFeatured:
        status ===
        CustomerReviewStatus.APPROVED
          ? undefined
          : false,
    },
  });

  revalidatePath('/admin/reviews');
  revalidatePath('/');
}

async function toggleFeaturedReview(
  formData: FormData,
) {
  'use server';

  await requireAdmin();

  const reviewId = getFormValue(
    formData,
    'reviewId',
  );

  if (!reviewId) {
    throw new Error(
      '고객 후기 ID가 없습니다.',
    );
  }

  const review =
    await prisma.customerReview.findUnique({
      where: {
        id: reviewId,
      },
      select: {
        status: true,
        isFeatured: true,
      },
    });

  if (!review) {
    throw new Error(
      '고객 후기를 찾을 수 없습니다.',
    );
  }

  if (
    review.status !==
    CustomerReviewStatus.APPROVED
  ) {
    throw new Error(
      '승인된 후기만 대표 후기로 지정할 수 있습니다.',
    );
  }

  await prisma.customerReview.update({
    where: {
      id: reviewId,
    },
    data: {
      isFeatured: !review.isFeatured,
    },
  });

  revalidatePath('/admin/reviews');
  revalidatePath('/');
}

async function toggleReviewVisibility(
  formData: FormData,
) {
  'use server';

  await requireAdmin();

  const reviewId = getFormValue(
    formData,
    'reviewId',
  );

  if (!reviewId) {
    throw new Error(
      '고객 후기 ID가 없습니다.',
    );
  }

  const review =
    await prisma.customerReview.findUnique({
      where: {
        id: reviewId,
      },
      select: {
        status: true,
        isVisible: true,
      },
    });

  if (!review) {
    throw new Error(
      '고객 후기를 찾을 수 없습니다.',
    );
  }

  if (
    review.status !==
    CustomerReviewStatus.APPROVED
  ) {
    throw new Error(
      '승인된 후기만 공개 상태를 변경할 수 있습니다.',
    );
  }

  await prisma.customerReview.update({
    where: {
      id: reviewId,
    },
    data: {
      isVisible: !review.isVisible,
    },
  });

  revalidatePath('/admin/reviews');
  revalidatePath('/');
}

function formatDate(
  value: Date | null,
) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat(
    'ko-KR',
    {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    },
  ).format(value);
}

const pageStyles = `
  .admin-review-page {
    min-height: 100vh;
    padding: 38px 26px 80px;
    color: #4f382f;
    background:
      radial-gradient(
        circle at 4% 5%,
        rgba(255, 218, 206, 0.42),
        transparent 24rem
      ),
      radial-gradient(
        circle at 96% 10%,
        rgba(216, 238, 228, 0.48),
        transparent 25rem
      ),
      #fffaf5;
  }

  .admin-review-inner {
    width: min(1280px, 100%);
    margin: 0 auto;
  }

  .admin-review-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 26px;
  }

  .admin-review-eyebrow {
    margin: 0 0 8px;
    color: #df755f;
    font-size: 14px;
    font-weight: 900;
    letter-spacing: 0.08em;
  }

  .admin-review-header h1 {
    margin: 0;
    font-size: clamp(30px, 4vw, 42px);
    line-height: 1.25;
    letter-spacing: -0.045em;
  }

  .admin-review-description {
    margin: 12px 0 0;
    color: #806c63;
    font-size: 15px;
    line-height: 1.7;
  }

  .admin-review-header-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .admin-review-link {
    display: inline-flex;
    min-height: 44px;
    align-items: center;
    justify-content: center;
    padding: 0 18px;
    border: 1px solid #edb4a4;
    border-radius: 999px;
    color: #bd5e4d;
    background: #fffdfb;
    font-size: 13px;
    font-weight: 900;
    text-decoration: none;
  }

  .admin-review-summary {
    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 30px;
  }

  .admin-review-summary-card {
    padding: 20px 22px;
    border: 1px solid
      rgba(224, 167, 149, 0.28);
    border-radius: 21px;
    background:
      rgba(255, 255, 255, 0.88);
    box-shadow:
      0 12px 30px
      rgba(126, 86, 70, 0.07);
  }

  .admin-review-summary-card span {
    display: block;
    color: #8b756b;
    font-size: 13px;
    font-weight: 800;
  }

  .admin-review-summary-card strong {
    display: block;
    margin-top: 8px;
    font-size: 30px;
    line-height: 1;
  }

  .admin-review-section {
    margin-top: 34px;
  }

  .admin-review-section-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 14px;
  }

  .admin-review-section-heading h2 {
    margin: 0;
    font-size: 23px;
    letter-spacing: -0.035em;
  }

  .admin-review-section-heading p {
    margin: 6px 0 0;
    color: #8b756b;
    font-size: 13px;
  }

  .admin-review-section-count {
    color: #d66f5b;
    font-size: 13px;
    font-weight: 900;
  }

  .admin-review-list {
    display: grid;
    gap: 16px;
  }

  .admin-review-card {
    padding: 25px;
    border: 1px solid
      rgba(224, 167, 149, 0.3);
    border-radius: 24px;
    background:
      rgba(255, 255, 255, 0.93);
    box-shadow:
      0 13px 32px
      rgba(126, 86, 70, 0.08);
  }

  .admin-review-card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
  }

  .admin-review-status-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .admin-review-badge {
    display: inline-flex;
    min-height: 28px;
    align-items: center;
    padding: 0 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 900;
  }

  .admin-review-badge.pending {
    color: #88631f;
    background: #fff1c7;
  }

  .admin-review-badge.approved {
    color: #2f6951;
    background: #dff4e9;
  }

  .admin-review-badge.rejected {
    color: #a2473b;
    background: #ffe3df;
  }

  .admin-review-badge.featured {
    color: #a45d14;
    background: #ffebc9;
  }

  .admin-review-badge.hidden {
    color: #655e75;
    background: #eceaf4;
  }

  .admin-review-date {
    color: #99867d;
    font-size: 12px;
    white-space: nowrap;
  }

  .admin-review-stars {
    margin-top: 17px;
    color: #e2d8d3;
    font-size: 19px;
    letter-spacing: 0.05em;
  }

  .admin-review-stars span.active {
    color: #f19a69;
  }

  .admin-review-card h3 {
    margin: 13px 0 0;
    color: #4a3127;
    font-size: 19px;
    line-height: 1.5;
  }

  .admin-review-content {
    margin: 12px 0 0;
    color: #604d44;
    font-size: 15px;
    line-height: 1.85;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .admin-review-customer {
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 9px 20px;
    margin-top: 20px;
    padding: 16px;
    border-radius: 16px;
    background: #fff7f2;
  }

  .admin-review-customer div {
    min-width: 0;
    color: #7a665d;
    font-size: 13px;
    line-height: 1.6;
    word-break: break-all;
  }

  .admin-review-customer strong {
    margin-right: 7px;
    color: #50382e;
  }

  .admin-review-actions {
    display: flex;
    gap: 9px;
    flex-wrap: wrap;
    margin-top: 20px;
  }

  .admin-review-actions form {
    margin: 0;
  }

  .admin-review-button {
    min-height: 40px;
    padding: 0 16px;
    border: 1px solid transparent;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 900;
    cursor: pointer;
  }

  .admin-review-button.approve {
    border-color: #9fd0bb;
    color: #2f6951;
    background: #e8f7ef;
  }

  .admin-review-button.reject {
    border-color: #edb1a7;
    color: #a2473b;
    background: #fff0ed;
  }

  .admin-review-button.pending {
    border-color: #e3c985;
    color: #80601d;
    background: #fff7d9;
  }

  .admin-review-button.feature {
    border-color: #edbd70;
    color: #965c19;
    background: #fff1d6;
  }

  .admin-review-button.visibility {
    border-color: #c8c1d9;
    color: #5c546d;
    background: #f3f1f8;
  }

  .admin-review-empty {
    padding: 34px 22px;
    border: 1px dashed
      rgba(133, 91, 69, 0.24);
    border-radius: 22px;
    color: #8b756b;
    background:
      rgba(255, 255, 255, 0.68);
    font-size: 14px;
    text-align: center;
  }

  @media (max-width: 760px) {
    .admin-review-page {
      padding: 26px 15px 70px;
    }

    .admin-review-header {
      flex-direction: column;
    }

    .admin-review-summary {
      grid-template-columns: 1fr;
    }

    .admin-review-card-top {
      flex-direction: column;
      gap: 10px;
    }

    .admin-review-customer {
      grid-template-columns: 1fr;
    }

    .admin-review-date {
      white-space: normal;
    }
  }
`;

export default async function AdminReviewsPage() {
  const [
    reviews,
    pendingCount,
    approvedCount,
    rejectedCount,
  ] = await Promise.all([
    prisma.customerReview.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 200,
    }),
    prisma.customerReview.count({
      where: {
        status:
          CustomerReviewStatus.PENDING,
      },
    }),
    prisma.customerReview.count({
      where: {
        status:
          CustomerReviewStatus.APPROVED,
      },
    }),
    prisma.customerReview.count({
      where: {
        status:
          CustomerReviewStatus.REJECTED,
      },
    }),
  ]);

  const countByStatus = {
    PENDING: pendingCount,
    APPROVED: approvedCount,
    REJECTED: rejectedCount,
  };

  return (
    <main className="admin-review-page">
      <div className="admin-review-inner">
        <header className="admin-review-header">
          <div>
            <p className="admin-review-eyebrow">
              CUSTOMER REVIEWS
            </p>

            <h1>고객 후기 관리</h1>

            <p className="admin-review-description">
              고객이 작성한 후기를 확인하고
              홈페이지 공개 여부를 관리합니다.
            </p>
          </div>

          <div className="admin-review-header-actions">
            <Link
              href="/reviews"
              className="admin-review-link"
            >
              후기 작성 화면
            </Link>

            <Link
              href="/"
              className="admin-review-link"
            >
              홈페이지 확인
            </Link>
          </div>
        </header>

        <section className="admin-review-summary">
          <article className="admin-review-summary-card">
            <span>승인 대기</span>
            <strong>{pendingCount}</strong>
          </article>

          <article className="admin-review-summary-card">
            <span>승인 완료</span>
            <strong>{approvedCount}</strong>
          </article>

          <article className="admin-review-summary-card">
            <span>거절</span>
            <strong>{rejectedCount}</strong>
          </article>
        </section>

        {STATUS_SECTIONS.map((section) => {
          const sectionReviews =
            reviews.filter(
              (review) =>
                review.status ===
                section.status,
            );

          return (
            <section
              key={section.status}
              className="admin-review-section"
            >
              <div className="admin-review-section-heading">
                <div>
                  <h2>{section.title}</h2>
                  <p>{section.description}</p>
                </div>

                <span className="admin-review-section-count">
                  {
                    countByStatus[
                      section.status
                    ]
                  }
                  건
                </span>
              </div>

              <div className="admin-review-list">
                {sectionReviews.length > 0 ? (
                  sectionReviews.map(
                    (review) => (
                      <article
                        key={review.id}
                        className="admin-review-card"
                      >
                        <div className="admin-review-card-top">
                          <div className="admin-review-status-row">
                            <span
                              className={[
                                'admin-review-badge',
                                review.status.toLowerCase(),
                              ].join(' ')}
                            >
                              {
                                STATUS_LABELS[
                                  review.status
                                ]
                              }
                            </span>

                            {review.isFeatured ? (
                              <span className="admin-review-badge featured">
                                대표 후기
                              </span>
                            ) : null}

                            {!review.isVisible &&
                            review.status ===
                              CustomerReviewStatus.APPROVED ? (
                              <span className="admin-review-badge hidden">
                                홈페이지 숨김
                              </span>
                            ) : null}
                          </div>

                          <span className="admin-review-date">
                            접수:{' '}
                            {formatDate(
                              review.createdAt,
                            )}
                          </span>
                        </div>

                        <div
                          className="admin-review-stars"
                          aria-label={`별점 ${review.rating}점`}
                        >
                          {[1, 2, 3, 4, 5].map(
                            (score) => (
                              <span
                                key={score}
                                className={
                                  score <=
                                  review.rating
                                    ? 'active'
                                    : ''
                                }
                              >
                                ★
                              </span>
                            ),
                          )}
                        </div>

                        {review.title ? (
                          <h3>{review.title}</h3>
                        ) : null}

                        <p className="admin-review-content">
                          {review.content}
                        </p>

                        <div className="admin-review-customer">
                          <div>
                            <strong>작성자</strong>
                            {review.displayName}
                          </div>

                          <div>
                            <strong>이메일</strong>
                            {review.email}
                          </div>

                          <div>
                            <strong>
                              주문·상담번호
                            </strong>
                            {review.orderReference ||
                              '-'}
                          </div>

                          <div>
                            <strong>승인일</strong>
                            {formatDate(
                              review.approvedAt,
                            )}
                          </div>
                        </div>

                        <div className="admin-review-actions">
                          {review.status !==
                          CustomerReviewStatus.APPROVED ? (
                            <form
                              action={
                                updateReviewStatus
                              }
                            >
                              <input
                                type="hidden"
                                name="reviewId"
                                value={review.id}
                              />

                              <input
                                type="hidden"
                                name="status"
                                value="APPROVED"
                              />

                              <button
                                type="submit"
                                className="admin-review-button approve"
                              >
                                승인하고 공개
                              </button>
                            </form>
                          ) : null}

                          {review.status !==
                          CustomerReviewStatus.PENDING ? (
                            <form
                              action={
                                updateReviewStatus
                              }
                            >
                              <input
                                type="hidden"
                                name="reviewId"
                                value={review.id}
                              />

                              <input
                                type="hidden"
                                name="status"
                                value="PENDING"
                              />

                              <button
                                type="submit"
                                className="admin-review-button pending"
                              >
                                승인 대기로 변경
                              </button>
                            </form>
                          ) : null}

                          {review.status !==
                          CustomerReviewStatus.REJECTED ? (
                            <form
                              action={
                                updateReviewStatus
                              }
                            >
                              <input
                                type="hidden"
                                name="reviewId"
                                value={review.id}
                              />

                              <input
                                type="hidden"
                                name="status"
                                value="REJECTED"
                              />

                              <button
                                type="submit"
                                className="admin-review-button reject"
                              >
                                후기 거절
                              </button>
                            </form>
                          ) : null}

                          {review.status ===
                          CustomerReviewStatus.APPROVED ? (
                            <>
                              <form
                                action={
                                  toggleFeaturedReview
                                }
                              >
                                <input
                                  type="hidden"
                                  name="reviewId"
                                  value={review.id}
                                />

                                <button
                                  type="submit"
                                  className="admin-review-button feature"
                                >
                                  {review.isFeatured
                                    ? '대표 후기 해제'
                                    : '대표 후기 지정'}
                                </button>
                              </form>

                              <form
                                action={
                                  toggleReviewVisibility
                                }
                              >
                                <input
                                  type="hidden"
                                  name="reviewId"
                                  value={review.id}
                                />

                                <button
                                  type="submit"
                                  className="admin-review-button visibility"
                                >
                                  {review.isVisible
                                    ? '홈페이지에서 숨기기'
                                    : '홈페이지에 다시 표시'}
                                </button>
                              </form>
                            </>
                          ) : null}
                        </div>
                      </article>
                    ),
                  )
                ) : (
                  <div className="admin-review-empty">
                    해당 상태의 고객 후기가
                    없습니다.
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: pageStyles,
        }}
      />
    </main>
  );
}