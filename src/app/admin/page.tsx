import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { CSSProperties } from 'react';

export default async function AdminDashboard() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const adminUser = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      role: true,
    },
  });

  if (adminUser?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const [
    totalUsers,
    totalMemories,
    totalBooks,
    totalProductionRequests,
    requestedProductionRequests,
    activeProductionRequests,
    completedProductionRequests,
    canceledProductionRequests,
    inProductionBookCount,
    totalProductApplications,
    requestedProductApplications,
    activeProductApplications,
    completedProductApplications,
    recentProductApplications,
    familyHealthRows,
    pendingProductionRequests,
    inProductionBooks,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),

    prisma.memory.count(),

    prisma.book.count(),

       prisma.bookProductionRequest.count(),

    prisma.bookProductionRequest.count({
      where: {
        status: 'REQUESTED',
      },
    }),

    prisma.bookProductionRequest.count({
      where: {
        status: {
          in: [
            'CONTACTED',
            'IN_PROGRESS',
          ],
        },
      },
    }),

    prisma.bookProductionRequest.count({
      where: {
        status: 'COMPLETED',
      },
    }),

    prisma.bookProductionRequest.count({
      where: {
        status: 'CANCELED',
      },
    }),

            prisma.book.count({
      where: {
        status: 'IN_PRODUCTION',
      },
    }),

    prisma.productApplication.count(),

    prisma.productApplication.count({
      where: {
        status: 'REQUESTED',
      },
    }),

    prisma.productApplication.count({
      where: {
        status: {
          in: [
            'CONTACTED',
            'IN_PROGRESS',
          ],
        },
      },
    }),

    prisma.productApplication.count({
      where: {
        status: 'COMPLETED',
      },
    }),

    prisma.productApplication.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
      select: {
        id: true,
        productName: true,
        billingType: true,
        price: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),

    prisma.family.findMany({
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        members: {
          select: {
            id: true,
            role: true,
          },
        },
      },
    }),

    prisma.bookProductionRequest.findMany({
      where: {
        status: 'REQUESTED',
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 5,
      select: {
        id: true,
        bookId: true,
        name: true,
        phone: true,
        email: true,
        status: true,
        createdAt: true,
      },
    }),

    prisma.book.findMany({
      where: {
        status: 'IN_PRODUCTION',
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 5,
      select: {
        id: true,
        authorId: true,
        title: true,
        type: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    }),

    prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
  ]);

  const totalFamilies = familyHealthRows.length;

  const emptyFamilies = familyHealthRows.filter(
    (family) => family.members.length === 0,
  );

  const noOwnerFamilies = familyHealthRows.filter(
    (family) =>
      family.members.length > 0 &&
      !family.members.some(
        (member) => member.role === 'OWNER',
      ),
  );

  const warningFamilyMap = new Map<
    string,
    {
      id: string;
      name: string;
      createdAt: Date;
      updatedAt: Date;
      members: {
        id: string;
        role: string;
      }[];
      warningType: 'EMPTY' | 'NO_OWNER';
    }
  >();

  for (const family of emptyFamilies) {
    warningFamilyMap.set(family.id, {
      ...family,
      warningType: 'EMPTY',
    });
  }

  for (const family of noOwnerFamilies) {
    warningFamilyMap.set(family.id, {
      ...family,
      warningType: 'NO_OWNER',
    });
  }

  const warningFamilies = Array.from(
    warningFamilyMap.values(),
  )
    .sort(
      (first, second) =>
        second.updatedAt.getTime() -
        first.updatedAt.getTime(),
    )
    .slice(0, 5);

  const familyWarningCount =
    warningFamilyMap.size;

  const requestBookIds = Array.from(
    new Set(
      pendingProductionRequests.map(
        (request) => request.bookId,
      ),
    ),
  );

  const inProductionBookAuthorIds = Array.from(
    new Set(
      inProductionBooks.map(
        (book) => book.authorId,
      ),
    ),
  );

  const [
    requestBooks,
    inProductionBookAuthors,
  ] = await Promise.all([
    requestBookIds.length > 0
      ? prisma.book.findMany({
          where: {
            id: {
              in: requestBookIds,
            },
          },
          select: {
            id: true,
            title: true,
          },
        })
      : Promise.resolve([]),

    inProductionBookAuthorIds.length > 0
      ? prisma.user.findMany({
          where: {
            id: {
              in: inProductionBookAuthorIds,
            },
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const requestBookMap = new Map(
    requestBooks.map((book) => [
      book.id,
      book,
    ]),
  );

  const authorMap = new Map(
    inProductionBookAuthors.map((author) => [
      author.id,
      author,
    ]),
  );

  const stats = [
    {
      label: '전체 회원',
      value: totalUsers,
      unit: '명',
      color: 'var(--wine)',
    },
    {
      label: '저장된 기록',
      value: totalMemories,
      unit: '개',
      color: 'var(--gold)',
    },
    {
      label: '가족 공간',
      value: totalFamilies,
      unit: '개',
      color: '#2e3f52',
    },
    {
      label: '전체 책',
      value: totalBooks,
      unit: '권',
      color: '#7b4f2a',
    },
       {
      label: '전체 상품 신청',
      value: totalProductApplications,
      unit: '건',
      color: '#7b4f2a',
    },
    {
      label: '새 상품 신청',
      value: requestedProductApplications,
      unit: '건',
      color: '#a25b20',
    },
    {
      label: '상품 처리 중',
      value: activeProductApplications,
      unit: '건',
      color: '#435d83',
    },
    {
      label: '상품 처리 완료',
      value: completedProductApplications,
      unit: '건',
      color: '#2f6b38',
    },
    {
      label: '미처리 상담',
      value: requestedProductionRequests,
      unit: '건',
      color: '#9a4b24',
    },
       {
      label: '상담 처리 중',
      value: activeProductionRequests,
      unit: '건',
      color: '#2e3f52',
    },
    {
      label: '상담 완료',
      value: completedProductionRequests,
      unit: '건',
      color: '#2f6b38',
    },
    {
      label: '상담 취소',
      value: canceledProductionRequests,
      unit: '건',
      color: '#776868',
    },
    {
      label: '제작 중인 책',
      value: inProductionBookCount,
      unit: '권',
      color: '#62438a',
    },
  ];

  return (
    <main>
      <style>{`
        .admin-dashboard-operation-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 20px;
        }

        @media (max-width: 1050px) {
          .admin-dashboard-operation-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .admin-dashboard-alert {
            padding: 18px !important;
          }

          .admin-dashboard-alert-inner {
            display: grid !important;
            grid-template-columns: 1fr !important;
          }

          .admin-dashboard-user-row {
            display: grid !important;
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div className="runninghead">
        <span className="runninghead__chapter">
          ADMIN
        </span>

        <span className="runninghead__rule" />

        <span
          style={{
            color: 'var(--ink-soft)',
          }}
        >
          관리자 대시보드
        </span>
      </div>

      <section
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20,
          marginBottom: 28,
        }}
      >
        <div>
          <h1
            className="dash-greeting"
            style={{
              marginBottom: 10,
            }}
          >
            관리자 대시보드
          </h1>

          <p
            style={{
              margin: 0,
              maxWidth: 760,
              color: 'var(--ink-soft)',
              fontSize: 15,
              lineHeight: 1.8,
            }}
          >
            달동네 출판사의 회원, 기록, 가족 공간,
            책 원고와 제작 상담, 상품 신청 현황을
            한눈에 확인합니다.
          </p>
        </div>

        <Link
          href="/admin/production-requests"
          style={primaryButtonStyle()}
        >
          제작 상담 관리
          {requestedProductionRequests > 0
            ? ` (${requestedProductionRequests})`
            : ''}
        </Link>
      </section>

      <section
        className="admin-dashboard-alert"
        style={urgentAlertStyle(
          requestedProductionRequests,
        )}
      >
        <div
          className="admin-dashboard-alert-inner"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 18,
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: '.04em',
                color:
                  requestedProductionRequests > 0
                    ? '#8b3f18'
                    : '#2f6b38',
              }}
            >
              운영 확인
            </p>

            <h2
              style={{
                margin: '7px 0 0',
                fontSize: 22,
                lineHeight: 1.45,
                color: 'var(--ink)',
              }}
            >
              {requestedProductionRequests > 0
                ? `아직 확인하지 않은 제작 상담이 ${requestedProductionRequests}건 있습니다.`
                : '새로 접수된 미처리 상담이 없습니다.'}
            </h2>

            <p
              style={{
                margin: '7px 0 0',
                color: 'var(--ink-soft)',
                fontSize: 13,
                lineHeight: 1.7,
              }}
            >
              {requestedProductionRequests > 0
                ? '접수 순서가 오래된 상담부터 확인하고 고객 연락 상태로 변경해 주세요.'
                : `현재 상담 처리 중 ${activeProductionRequests}건, 상담 완료 ${completedProductionRequests}건입니다.`}
            </p>
          </div>

          <Link
            href={
              requestedProductionRequests > 0
                ? '/admin/production-requests?status=REQUESTED'
                : '/admin/production-requests'
            }
            style={
              requestedProductionRequests > 0
                ? alertButtonStyle()
                : smallButtonStyle()
            }
          >
            {requestedProductionRequests > 0
              ? '미처리 상담 확인'
              : '전체 상담 보기'}
          </Link>
        </div>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 14,
          marginTop: 24,
          marginBottom: 28,
        }}
      >
        {stats.map((stat) => (
          <SummaryCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            unit={stat.unit}
            color={stat.color}
          />
        ))}
      </section>

      <section
        className="dash-card"
        style={{
          marginBottom: 28,
        }}
      >
        <div>
          <p
            className="dash-card__label"
            style={{
              margin: 0,
            }}
          >
            운영 바로가기
          </p>

          <p
            style={{
              margin: '8px 0 0',
              color: 'var(--ink-soft)',
              fontSize: 13,
              lineHeight: 1.7,
            }}
          >
            자주 사용하는 관리자 화면과 현재 처리할
            업무로 이동합니다.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(185px, 1fr))',
            gap: 12,
            marginTop: 18,
          }}
        >
          <Link
            href="/admin/production-requests"
            style={quickLinkStyle(
              requestedProductionRequests > 0,
            )}
          >
            <strong>제작 상담 관리</strong>

            <span>
              미처리 {requestedProductionRequests}건 ·
              처리 중 {activeProductionRequests}건
            </span>
          </Link>

                    <Link
            href="/admin/product-applications"
            style={quickLinkStyle(
              requestedProductApplications > 0,
            )}
          >
            <strong>
              상품 신청 관리
            </strong>

            <span>
              새 신청{' '}
              {requestedProductApplications}건 ·
              처리 중{' '}
              {activeProductApplications}건
            </span>
          </Link>

          <Link
            href="/admin/families"
            style={quickLinkStyle(
              familyWarningCount > 0,
            )}
          >
            <strong>가족 공간 관리</strong>

            <span>
              운영 확인 필요 {familyWarningCount}개
            </span>
          </Link>

          <Link
            href="/admin/books?status=IN_PRODUCTION"
            style={quickLinkStyle(
              inProductionBookCount > 0,
            )}
          >
            <strong>제작 중인 책</strong>

            <span>
              현재 제작 준비 중 {inProductionBookCount}권
            </span>
          </Link>

          <Link
            href="/admin/users"
            style={quickLinkStyle(false)}
          >
            <strong>회원 관리</strong>

            <span>
              전체 회원 {totalUsers}명과 권한 확인
            </span>
          </Link>

          <Link
            href="/admin/books"
            style={quickLinkStyle(false)}
          >
            <strong>전체 책 관리</strong>

            <span>
              원고, 종류, 제작 상태 확인
            </span>
          </Link>

          <Link
            href="/dashboard"
            style={quickLinkStyle(false)}
          >
            <strong>사용자 화면</strong>

            <span>
              일반 회원 대시보드 확인
            </span>
          </Link>
        </div>
      </section>

      <section className="admin-dashboard-operation-grid">
        <article className="dash-card">
          <OperationHeader
            label="미처리 제작 상담"
            description="접수된 순서가 오래된 상담 5건"
            href="/admin/production-requests?status=REQUESTED"
            buttonLabel="전체 보기"
          />

          {pendingProductionRequests.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gap: 10,
                marginTop: 18,
              }}
            >
              {pendingProductionRequests.map(
                (request) => {
                  const book =
                    requestBookMap.get(
                      request.bookId,
                    );

                  return (
                    <Link
                      key={request.id}
                      href={`/admin/books/${request.bookId}`}
                      style={listItemStyle()}
                    >
                      <div
                        style={{
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 7,
                          }}
                        >
                          <span
                            style={statusBadgeStyle(
                              request.status,
                            )}
                          >
                            상담 접수
                          </span>

                          <span
                            style={{
                              fontSize: 11,
                              color:
                                'var(--ink-faint)',
                            }}
                          >
                            {formatDate(
                              request.createdAt,
                            )}
                          </span>
                        </div>

                        <strong
                          style={{
                            display: 'block',
                            marginTop: 8,
                            color: 'var(--ink)',
                            fontSize: 14,
                            lineHeight: 1.45,
                            wordBreak: 'break-word',
                          }}
                        >
                          {book?.title ||
                            '책 제목 확인 필요'}
                        </strong>

                        <span
                          style={{
                            display: 'block',
                            marginTop: 5,
                            color:
                              'var(--ink-soft)',
                            fontSize: 12,
                            lineHeight: 1.5,
                            wordBreak: 'break-all',
                          }}
                        >
                          {request.name ||
                            '신청자 이름 없음'}
                          {' · '}
                          {request.phone ||
                            request.email ||
                            '연락처 없음'}
                        </span>
                      </div>

                      <span style={detailTextStyle()}>
                        상세
                      </span>
                    </Link>
                  );
                },
              )}
            </div>
          ) : (
            <EmptyBox text="미처리 제작 상담이 없습니다." />
          )}
        </article>

        <article className="dash-card">
          <OperationHeader
            label="가족 공간 운영 경고"
            description={`소유자 또는 구성원 확인 필요 ${familyWarningCount}개`}
            href="/admin/families"
            buttonLabel="가족 관리"
          />

          {warningFamilies.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gap: 10,
                marginTop: 18,
              }}
            >
              {warningFamilies.map((family) => (
                <Link
                  key={family.id}
                  href={buildSearchHref(
                    '/admin/families',
                    family.name,
                  )}
                  style={listItemStyle()}
                >
                  <div
                    style={{
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={familyWarningBadgeStyle(
                        family.warningType,
                      )}
                    >
                      {family.warningType === 'EMPTY'
                        ? '구성원 없음'
                        : '소유자 없음'}
                    </span>

                    <strong
                      style={{
                        display: 'block',
                        marginTop: 8,
                        color: 'var(--ink)',
                        fontSize: 14,
                        lineHeight: 1.45,
                        wordBreak: 'break-word',
                      }}
                    >
                      {family.name}
                    </strong>

                    <span
                      style={{
                        display: 'block',
                        marginTop: 5,
                        color:
                          'var(--ink-soft)',
                        fontSize: 12,
                      }}
                    >
                      구성원 {family.members.length}명 ·
                      최근 수정{' '}
                      {formatDate(family.updatedAt)}
                    </span>
                  </div>

                  <span style={detailTextStyle()}>
                    확인
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyBox text="운영 상태를 확인할 가족 공간이 없습니다." />
          )}
        </article>

        <article className="dash-card">
          <OperationHeader
            label="제작 중인 책"
            description={`현재 제작 준비 중인 책 ${inProductionBookCount}권`}
            href="/admin/books?status=IN_PRODUCTION"
            buttonLabel="전체 보기"
          />

          {inProductionBooks.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gap: 10,
                marginTop: 18,
              }}
            >
              {inProductionBooks.map((book) => {
                const author =
                  authorMap.get(book.authorId);

                return (
                  <Link
                    key={book.id}
                    href={`/admin/books/${book.id}`}
                    style={listItemStyle()}
                  >
                    <div
                      style={{
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: 7,
                        }}
                      >
                        <span
                          style={bookStatusBadgeStyle(
                            book.status,
                          )}
                        >
                          제작 준비 중
                        </span>

                        <span
                          style={{
                            fontSize: 11,
                            color:
                              'var(--ink-faint)',
                          }}
                        >
                          {getBookTypeLabel(
                            book.type,
                          )}
                        </span>
                      </div>

                      <strong
                        style={{
                          display: 'block',
                          marginTop: 8,
                          color: 'var(--ink)',
                          fontSize: 14,
                          lineHeight: 1.45,
                          wordBreak: 'break-word',
                        }}
                      >
                        {book.title}
                      </strong>

                      <span
                        style={{
                          display: 'block',
                          marginTop: 5,
                          color:
                            'var(--ink-soft)',
                          fontSize: 12,
                          lineHeight: 1.5,
                          wordBreak: 'break-all',
                        }}
                      >
                        {author?.name ||
                          author?.email ||
                          '작성자 확인 필요'}
                        {' · '}
                        최근 수정{' '}
                        {formatDate(book.updatedAt)}
                      </span>
                    </div>

                    <span style={detailTextStyle()}>
                      상세
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyBox text="현재 제작 중인 책이 없습니다." />
          )}
        </article>
      </section>

             <section
        className="dash-card"
        style={{
          marginTop: 28,
        }}
      >
        <OperationHeader
          label="최근 상품 신청"
          description="가장 최근에 접수된 상품 신청 5건"
          href="/admin/product-applications"
          buttonLabel="신청 관리"
        />

        {recentProductApplications.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gap: 10,
              marginTop: 18,
            }}
          >
            {recentProductApplications.map(
              (application) => {
                const customerName =
                  application.name ||
                  application.user.name ||
                  application.email ||
                  application.user.email ||
                  '신청자 확인 필요';

                return (
                  <Link
                    key={application.id}
                    href={buildSearchHref(
                      '/admin/product-applications',
                      application.productName,
                    )}
                    style={listItemStyle()}
                  >
                    <div
                      style={{
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: 7,
                        }}
                      >
                        <span
                          style={productApplicationStatusBadgeStyle(
                            String(
                              application.status,
                            ),
                          )}
                        >
                          {getProductApplicationStatusLabel(
                            String(
                              application.status,
                            ),
                          )}
                        </span>

                        <strong
                          style={{
                            color:
                              'var(--ink)',
                            fontSize: 14,
                            lineHeight: 1.5,
                            wordBreak:
                              'break-word',
                          }}
                        >
                          {application.productName}
                        </strong>
                      </div>

                      <span
                        style={{
                          display: 'block',
                          marginTop: 7,
                          color:
                            'var(--ink-soft)',
                          fontSize: 12,
                          lineHeight: 1.65,
                          wordBreak:
                            'break-word',
                        }}
                      >
                        {customerName}
                        {' · '}
                        {formatProductApplicationPrice(
                          application.price,
                          application.billingType,
                        )}
                        {' · '}
                        {formatDate(
                          application.createdAt,
                        )}
                      </span>
                    </div>

                    <span
                      style={detailTextStyle()}
                    >
                      확인
                    </span>
                  </Link>
                );
              },
            )}
          </div>
        ) : (
          <EmptyBox text="최근 상품 신청이 없습니다." />
        )}
      </section>

      <section
        className="dash-card"
        style={{
          marginTop: 28,
        }}
      >
        <OperationHeader
          label="최근 가입 회원"
          description="가장 최근에 가입한 회원 5명"
          href="/admin/users"
          buttonLabel="회원 관리"
        />

        {recentUsers.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gap: 9,
              marginTop: 18,
            }}
          >
            {recentUsers.map((user) => (
              <Link
                key={user.id}
                href={buildSearchHref(
                  '/admin/users',
                  user.email ||
                    user.name ||
                    '',
                )}
                className="admin-dashboard-user-row"
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'minmax(150px, 1fr) minmax(210px, 1.4fr) 100px 110px',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 14,
                  border:
                    '1px solid rgba(34, 28, 22, 0.08)',
                  background:
                    'rgba(255, 255, 255, 0.3)',
                  color: 'inherit',
                  textDecoration: 'none',
                }}
              >
                <strong
                  style={{
                    fontSize: 14,
                    color: 'var(--ink)',
                    wordBreak: 'break-word',
                  }}
                >
                  {user.name || '이름 없음'}
                </strong>

                <span
                  style={{
                    fontSize: 13,
                    color: 'var(--ink-soft)',
                    wordBreak: 'break-all',
                  }}
                >
                  {user.email || '이메일 없음'}
                </span>

                <span
                  style={roleBadgeStyle(
                    user.role,
                  )}
                >
                  {user.role === 'ADMIN'
                    ? '관리자'
                    : '일반 회원'}
                </span>

                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--ink-faint)',
                  }}
                >
                  {formatDate(user.createdAt)}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyBox text="가입한 회원이 없습니다." />
        )}
      </section>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
}) {
  return (
    <article
      className="dash-card"
      style={{
        textAlign: 'center',
        minWidth: 0,
      }}
    >
      <p
        style={{
          margin: '0 0 5px',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 34,
          lineHeight: 1.2,
          color,
        }}
      >
        {value.toLocaleString()}
      </p>

      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--ink-faint)',
          letterSpacing: '.05em',
        }}
      >
        {label} ({unit})
      </p>
    </article>
  );
}

function OperationHeader({
  label,
  description,
  href,
  buttonLabel,
}: {
  label: string;
  description: string;
  href: string;
  buttonLabel: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
      }}
    >
      <div>
        <p
          className="dash-card__label"
          style={{
            margin: 0,
          }}
        >
          {label}
        </p>

        <p
          style={{
            margin: '7px 0 0',
            color: 'var(--ink-soft)',
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          {description}
        </p>
      </div>

      <Link
        href={href}
        style={smallButtonStyle()}
      >
        {buttonLabel}
      </Link>
    </div>
  );
}

function EmptyBox({
  text,
}: {
  text: string;
}) {
  return (
    <div
      style={{
        marginTop: 18,
        padding: 22,
        borderRadius: 18,
        border:
          '1px dashed rgba(34, 28, 22, 0.18)',
        color: 'var(--ink-soft)',
        fontSize: 13,
        lineHeight: 1.7,
        textAlign: 'center',
      }}
    >
      {text}
    </div>
  );
}

function buildSearchHref(
  path: string,
  searchQuery: string,
) {
  const query = searchQuery.trim();

  if (!query) {
    return path;
  }

  const params = new URLSearchParams();

  params.set('q', query);

  return `${path}?${params.toString()}`;
}

function primaryButtonStyle(): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    padding: '0 20px',
    borderRadius: 999,
    border: '1px solid var(--wine)',
    background: 'var(--wine)',
    color: 'var(--cream)',
    fontSize: 14,
    fontWeight: 900,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  };
}

function alertButtonStyle(): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    padding: '0 18px',
    borderRadius: 999,
    border: '1px solid #9a4b24',
    background: '#9a4b24',
    color: '#fffaf0',
    fontSize: 13,
    fontWeight: 900,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  };
}

function smallButtonStyle(): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 34,
    padding: '0 12px',
    borderRadius: 999,
    border:
      '1px solid rgba(34, 28, 22, 0.15)',
    background: 'transparent',
    color: 'var(--wine)',
    fontSize: 12,
    fontWeight: 900,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  };
}

function urgentAlertStyle(
  requestedCount: number,
): CSSProperties {
  return {
    borderRadius: 22,
    border:
      requestedCount > 0
        ? '1px solid #e2a26e'
        : '1px solid #9dcca4',
    background:
      requestedCount > 0
        ? '#fff1df'
        : '#edf8ee',
    padding: '22px 24px',
    boxShadow:
      '0 12px 30px rgba(34, 28, 22, 0.05)',
  };
}

function quickLinkStyle(
  emphasized: boolean,
): CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    minHeight: 88,
    padding: 16,
    borderRadius: 18,
    border: emphasized
      ? '1px solid rgba(154, 75, 36, 0.38)'
      : '1px solid rgba(34, 28, 22, 0.1)',
    background: emphasized
      ? '#fff1df'
      : 'rgba(255, 255, 255, 0.35)',
    color: 'var(--ink)',
    textDecoration: 'none',
    lineHeight: 1.5,
  };
}

function listItemStyle(): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 13,
    borderRadius: 15,
    border:
      '1px solid rgba(34, 28, 22, 0.08)',
    background:
      'rgba(255, 255, 255, 0.3)',
    color: 'inherit',
    textDecoration: 'none',
  };
}

function detailTextStyle(): CSSProperties {
  return {
    flexShrink: 0,
    color: 'var(--wine)',
    fontSize: 12,
    fontWeight: 900,
  };
}

function statusBadgeStyle(
  status: string,
): CSSProperties {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 24,
    padding: '0 8px',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 900,
    whiteSpace: 'nowrap',
  };

  if (status === 'REQUESTED') {
    return {
      ...base,
      background: '#fff1c7',
      color: '#83540d',
    };
  }

  if (status === 'CONTACTED') {
    return {
      ...base,
      background: '#e4f2ff',
      color: '#245d8c',
    };
  }

  if (status === 'IN_PROGRESS') {
    return {
      ...base,
      background: '#efe6ff',
      color: '#62438a',
    };
  }

  if (status === 'COMPLETED') {
    return {
      ...base,
      background: '#e3f4e5',
      color: '#2f6b38',
    };
  }

  return {
    ...base,
    background: '#f2eeee',
    color: '#776868',
  };
}

function formatProductApplicationPrice(
  price: number,
  billingType: string,
) {
  const formattedPrice =
    price.toLocaleString('ko-KR');

  if (billingType === 'MONTHLY') {
    return `${formattedPrice}원 / 월`;
  }

  return `${formattedPrice}원부터`;
}

function getProductApplicationStatusLabel(
  status: string,
) {
  if (status === 'REQUESTED') {
    return '새 신청';
  }

  if (status === 'CONTACTED') {
    return '연락 완료';
  }

  if (status === 'IN_PROGRESS') {
    return '처리 중';
  }

  if (status === 'COMPLETED') {
    return '처리 완료';
  }

  if (status === 'CANCELED') {
    return '신청 취소';
  }

  return '상태 확인';
}

function productApplicationStatusBadgeStyle(
  status: string,
): CSSProperties {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 24,
    padding: '0 8px',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 900,
    whiteSpace: 'nowrap',
  };

  if (status === 'REQUESTED') {
    return {
      ...base,
      background: '#fff0c9',
      color: '#80520e',
    };
  }

  if (status === 'CONTACTED') {
    return {
      ...base,
      background: '#e7efff',
      color: '#28538a',
    };
  }

  if (status === 'IN_PROGRESS') {
    return {
      ...base,
      background: '#eee7ff',
      color: '#603a97',
    };
  }

  if (status === 'COMPLETED') {
    return {
      ...base,
      background: '#e3f4e6',
      color: '#2f6938',
    };
  }

  return {
    ...base,
    background: '#f0ebe6',
    color: '#776b60',
  };
}

function bookStatusBadgeStyle(
  status: string,
): CSSProperties {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 24,
    padding: '0 8px',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 900,
    whiteSpace: 'nowrap',
  };

  if (status === 'IN_PRODUCTION') {
    return {
      ...base,
      background: '#efe6ff',
      color: '#62438a',
    };
  }

  if (status === 'PUBLISHED') {
    return {
      ...base,
      background: '#e3f4e5',
      color: '#2f6b38',
    };
  }

  return {
    ...base,
    background: '#f1eee8',
    color: '#6b5a46',
  };
}

function familyWarningBadgeStyle(
  warningType: 'EMPTY' | 'NO_OWNER',
): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 24,
    padding: '0 8px',
    borderRadius: 999,
    background:
      warningType === 'EMPTY'
        ? '#f2eeee'
        : '#fff1c7',
    color:
      warningType === 'EMPTY'
        ? '#776868'
        : '#83540d',
    fontSize: 10,
    fontWeight: 900,
    whiteSpace: 'nowrap',
  };
}

function roleBadgeStyle(
  role: string,
): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 24,
    padding: '0 8px',
    borderRadius: 999,
    background:
      role === 'ADMIN'
        ? 'var(--wine)'
        : 'rgba(34, 28, 22, 0.08)',
    color:
      role === 'ADMIN'
        ? 'var(--cream)'
        : 'var(--ink-faint)',
    fontSize: 10,
    fontWeight: 900,
    whiteSpace: 'nowrap',
  };
}

function getBookTypeLabel(
  type: string,
) {
  if (type === 'LIFE_BOOK') {
    return '부모님 인생책';
  }

  if (type === 'FAMILY_BOOK') {
    return '가족 이야기책';
  }

  if (type === 'COUPLE_BOOK') {
    return '부부 이야기책';
  }

  if (type === 'BABY_BOOK') {
    return '성장 기록책';
  }

  if (type === 'TRAVEL_BOOK') {
    return '여행 기록책';
  }

  if (type === 'AI_MOVIE') {
    return 'AI 영상';
  }

  return '종류 확인';
}

function formatDate(
  value: Date | string,
) {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return '-';
  }

  return new Intl.DateTimeFormat(
    'ko-KR',
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    },
  ).format(date);
}