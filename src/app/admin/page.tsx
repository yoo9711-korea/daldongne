import { auth } from "@/auth";
import AdminOrderDashboardPanel from "@/components/admin/AdminOrderDashboardPanel";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

type FamilyWarning = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  members: {
    id: string;
    role: string;
  }[];
  warningType: "EMPTY" | "NO_OWNER";
};

export default async function AdminDashboard() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const adminUser =
    await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        role: true,
      },
    });

  if (adminUser?.role !== "ADMIN") {
    redirect("/dashboard");
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
        status: "REQUESTED",
      },
    }),

    prisma.bookProductionRequest.count({
      where: {
        status: {
          in: [
            "CONTACTED",
            "IN_PROGRESS",
          ],
        },
      },
    }),

    prisma.bookProductionRequest.count({
      where: {
        status: "COMPLETED",
      },
    }),

    prisma.bookProductionRequest.count({
      where: {
        status: "CANCELED",
      },
    }),

    prisma.book.count({
      where: {
        status: "IN_PRODUCTION",
      },
    }),

    prisma.productApplication.count(),

    prisma.productApplication.count({
      where: {
        status: "REQUESTED",
      },
    }),

    prisma.productApplication.count({
      where: {
        status: {
          in: [
            "CONTACTED",
            "IN_PROGRESS",
          ],
        },
      },
    }),

    prisma.productApplication.count({
      where: {
        status: "COMPLETED",
      },
    }),

    prisma.productApplication.findMany({
      orderBy: {
        createdAt: "desc",
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
        updatedAt: "desc",
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
        status: "REQUESTED",
      },
      orderBy: {
        createdAt: "asc",
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
        status: "IN_PRODUCTION",
      },
      orderBy: {
        updatedAt: "desc",
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
        createdAt: "desc",
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

  const totalFamilies =
    familyHealthRows.length;

  const warningFamilyMap =
    new Map<string, FamilyWarning>();

  for (const family of familyHealthRows) {
    if (family.members.length === 0) {
      warningFamilyMap.set(family.id, {
        ...family,
        warningType: "EMPTY",
      });

      continue;
    }

    const hasOwner =
      family.members.some(
        (member) =>
          member.role === "OWNER",
      );

    if (!hasOwner) {
      warningFamilyMap.set(family.id, {
        ...family,
        warningType: "NO_OWNER",
      });
    }
  }

  const warningFamilies =
    Array.from(
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

  const requestBookIds =
    Array.from(
      new Set(
        pendingProductionRequests.map(
          (request) =>
            request.bookId,
        ),
      ),
    );

  const inProductionBookAuthorIds =
    Array.from(
      new Set(
        inProductionBooks.map(
          (book) =>
            book.authorId,
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

    inProductionBookAuthorIds.length >
    0
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

  const requestBookMap =
    new Map(
      requestBooks.map((book) => [
        book.id,
        book,
      ]),
    );

  const authorMap =
    new Map(
      inProductionBookAuthors.map(
        (author) => [
          author.id,
          author,
        ],
      ),
    );

  const urgentTaskCount =
    requestedProductionRequests +
    requestedProductApplications +
    familyWarningCount;

  const hasUrgentTasks =
    urgentTaskCount > 0;

  return (
    <main className="admin-home-page">
      <style>
        {adminHomeStyles}
      </style>

      <div className="admin-home-shell">
        <header className="admin-home-hero">
          <div className="admin-home-hero-copy">
            <p>
              DALDONGNE ADMIN
            </p>

            <h1>
              오늘 처리할 운영 업무를
              한눈에 확인합니다
            </h1>

            <span>
              회원, 기록, 가족 공간,
              책 원고, 제작 상담과 상품
              신청 현황을 빠르게
              점검하세요.
            </span>
          </div>

          <div className="admin-home-hero-actions">
            <Link href="/admin/production-requests">
              제작 상담 관리
              {requestedProductionRequests >
              0 ? (
                <small>
                  {
                    requestedProductionRequests
                  }
                </small>
              ) : null}
            </Link>

            <Link href="/admin/product-applications">
              상품 신청 관리
              {requestedProductApplications >
              0 ? (
                <small>
                  {
                    requestedProductApplications
                  }
                </small>
              ) : null}
            </Link>

            <Link href="/dashboard">
              사용자 화면
              <span aria-hidden="true">
                →
              </span>
            </Link>
          </div>
        </header>

        <section
          className="admin-home-priority"
          data-urgent={
            hasUrgentTasks
              ? "true"
              : "false"
          }
        >
          <div className="admin-home-priority-icon">
            {hasUrgentTasks ? (
              <AlertIcon />
            ) : (
              <CheckIcon />
            )}
          </div>

          <div className="admin-home-priority-copy">
            <p>오늘의 운영 확인</p>

            <h2>
              {hasUrgentTasks
                ? `우선 확인할 업무가 ${urgentTaskCount.toLocaleString()}건 있습니다.`
                : "현재 우선 확인할 운영 업무가 없습니다."}
            </h2>

            <span>
              {hasUrgentTasks
                ? `미처리 제작 상담 ${requestedProductionRequests.toLocaleString()}건 · 새 상품 신청 ${requestedProductApplications.toLocaleString()}건 · 가족 공간 경고 ${familyWarningCount.toLocaleString()}개`
                : `상담 처리 중 ${activeProductionRequests.toLocaleString()}건 · 상품 처리 중 ${activeProductApplications.toLocaleString()}건`}
            </span>
          </div>

          <div className="admin-home-priority-actions">
            {requestedProductionRequests >
            0 ? (
              <Link href="/admin/production-requests?status=REQUESTED">
                미처리 상담
              </Link>
            ) : null}

            {requestedProductApplications >
            0 ? (
              <Link href="/admin/product-applications?status=REQUESTED">
                새 상품 신청
              </Link>
            ) : null}

            {familyWarningCount > 0 ? (
              <Link href="/admin/families">
                가족 공간 확인
              </Link>
            ) : null}

            {!hasUrgentTasks ? (
              <Link href="/admin/production-requests">
                전체 상담 보기
              </Link>
            ) : null}
          </div>
        </section>

        <section className="admin-home-primary-stats">
          <PrimaryStat
            label="미처리 제작 상담"
            value={
              requestedProductionRequests
            }
            unit="건"
            href="/admin/production-requests?status=REQUESTED"
            tone="coral"
            description={`전체 ${totalProductionRequests.toLocaleString()}건 중 확인 전`}
          />

          <PrimaryStat
            label="새 상품 신청"
            value={
              requestedProductApplications
            }
            unit="건"
            href="/admin/product-applications?status=REQUESTED"
            tone="yellow"
            description={`전체 ${totalProductApplications.toLocaleString()}건 중 확인 전`}
          />

          <PrimaryStat
            label="제작 준비 중인 책"
            value={
              inProductionBookCount
            }
            unit="권"
            href="/admin/books?status=IN_PRODUCTION"
            tone="purple"
            description="현재 제작 진행 확인 필요"
          />

          <PrimaryStat
            label="가족 공간 경고"
            value={familyWarningCount}
            unit="개"
            href="/admin/families"
            tone="blue"
            description={`전체 ${totalFamilies.toLocaleString()}개 공간 중 점검 필요`}
          />
        </section>

        <AdminOrderDashboardPanel />

        <section className="admin-home-overview">
          <div className="admin-home-overview-heading">
            <div>
              <p>서비스 전체 현황</p>

              <h2>
                달동네 운영 규모
              </h2>

              <span>
                회원과 기록, 가족 공간,
                책 원고의 누적 현황입니다.
              </span>
            </div>

            <Link href="/admin/users">
              회원 관리
            </Link>
          </div>

          <div className="admin-home-overview-grid">
            <OverviewStat
              label="전체 회원"
              value={totalUsers}
              unit="명"
              href="/admin/users"
            />

            <OverviewStat
              label="저장된 기록"
              value={totalMemories}
              unit="개"
              href="/dashboard/timeline"
            />

            <OverviewStat
              label="가족 공간"
              value={totalFamilies}
              unit="개"
              href="/admin/families"
            />

            <OverviewStat
              label="전체 책"
              value={totalBooks}
              unit="권"
              href="/admin/books"
            />
          </div>
        </section>

        <section className="admin-home-workflow">
          <div className="admin-home-section-heading">
            <div>
              <p>운영 진행 현황</p>

              <h2>
                상담과 상품 신청 처리 단계
              </h2>

              <span>
                접수부터 완료·취소까지
                현재 진행 건수를
                확인합니다.
              </span>
            </div>
          </div>

          <div className="admin-home-workflow-grid">
            <WorkflowGroup
              title="제작 상담"
              href="/admin/production-requests"
              items={[
                {
                  label: "접수",
                  value:
                    requestedProductionRequests,
                  tone: "yellow",
                },
                {
                  label: "처리 중",
                  value:
                    activeProductionRequests,
                  tone: "blue",
                },
                {
                  label: "완료",
                  value:
                    completedProductionRequests,
                  tone: "green",
                },
                {
                  label: "취소",
                  value:
                    canceledProductionRequests,
                  tone: "gray",
                },
              ]}
            />

            <WorkflowGroup
              title="상품 신청"
              href="/admin/product-applications"
              items={[
                {
                  label: "전체 신청",
                  value:
                    totalProductApplications,
                  tone: "coral",
                },
                {
                  label: "새 신청",
                  value:
                    requestedProductApplications,
                  tone: "yellow",
                },
                {
                  label: "처리 중",
                  value:
                    activeProductApplications,
                  tone: "blue",
                },
                {
                  label: "완료",
                  value:
                    completedProductApplications,
                  tone: "green",
                },
              ]}
            />
          </div>
        </section>

        <section className="admin-home-quick-links">
          <div className="admin-home-section-heading">
            <div>
              <p>운영 바로가기</p>

              <h2>
                자주 사용하는 관리자 화면
              </h2>

              <span>
                현재 처리할 업무와 운영
                화면으로 바로 이동합니다.
              </span>
            </div>
          </div>

          <div className="admin-home-quick-grid">
            <QuickLink
              href="/admin/production-requests"
              title="제작 상담 관리"
              description={`미처리 ${requestedProductionRequests.toLocaleString()}건 · 처리 중 ${activeProductionRequests.toLocaleString()}건`}
              emphasized={
                requestedProductionRequests >
                0
              }
              icon={<ConsultationIcon />}
            />

            <QuickLink
              href="/admin/product-applications"
              title="상품 신청 관리"
              description={`새 신청 ${requestedProductApplications.toLocaleString()}건 · 처리 중 ${activeProductApplications.toLocaleString()}건`}
              emphasized={
                requestedProductApplications >
                0
              }
              icon={<ApplicationIcon />}
            />

            <QuickLink
              href="/admin/books"
              title="전체 책 관리"
              description={`전체 ${totalBooks.toLocaleString()}권 · 제작 준비 ${inProductionBookCount.toLocaleString()}권`}
              emphasized={
                inProductionBookCount > 0
              }
              icon={<BookIcon />}
            />

            <QuickLink
              href="/admin/users"
              title="회원 관리"
              description={`전체 회원 ${totalUsers.toLocaleString()}명과 관리자 권한 확인`}
              icon={<UserIcon />}
            />

            <QuickLink
              href="/admin/families"
              title="가족 공간 관리"
              description={`전체 ${totalFamilies.toLocaleString()}개 · 확인 필요 ${familyWarningCount.toLocaleString()}개`}
              emphasized={
                familyWarningCount > 0
              }
              icon={<FamilyIcon />}
            />

            <QuickLink
              href="/admin/reviews"
              title="고객 후기 관리"
              description="등록된 고객 후기와 노출 상태 확인"
              icon={<ReviewIcon />}
            />
          </div>
        </section>

        <section className="admin-home-operation-grid">
          <OperationPanel
            eyebrow="제작 상담"
            title="오래된 미처리 상담"
            description="접수된 순서가 오래된 상담 5건"
            href="/admin/production-requests?status=REQUESTED"
            buttonLabel="전체 보기"
          >
            {pendingProductionRequests.length >
            0 ? (
              <div className="admin-home-list">
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
                        className="admin-home-list-item"
                      >
                        <div>
                          <div className="admin-home-list-badges">
                            <StatusBadge
                              status={
                                request.status
                              }
                              label="상담 접수"
                            />

                            <small>
                              {formatDate(
                                request.createdAt,
                              )}
                            </small>
                          </div>

                          <strong>
                            {book?.title ||
                              "책 제목 확인 필요"}
                          </strong>

                          <span>
                            {request.name ||
                              "신청자 이름 없음"}
                            {" · "}
                            {request.phone ||
                              request.email ||
                              "연락처 없음"}
                          </span>
                        </div>

                        <em>
                          상세
                          <span aria-hidden="true">
                            →
                          </span>
                        </em>
                      </Link>
                    );
                  },
                )}
              </div>
            ) : (
              <EmptyState text="미처리 제작 상담이 없습니다." />
            )}
          </OperationPanel>

          <OperationPanel
            eyebrow="가족 공간"
            title="운영 점검이 필요한 공간"
            description={`소유자 또는 구성원 확인 필요 ${familyWarningCount.toLocaleString()}개`}
            href="/admin/families"
            buttonLabel="가족 관리"
          >
            {warningFamilies.length >
            0 ? (
              <div className="admin-home-list">
                {warningFamilies.map(
                  (family) => (
                    <Link
                      key={family.id}
                      href={buildSearchHref(
                        "/admin/families",
                        family.name,
                      )}
                      className="admin-home-list-item"
                    >
                      <div>
                        <div className="admin-home-list-badges">
                          <FamilyWarningBadge
                            type={
                              family.warningType
                            }
                          />

                          <small>
                            {formatDate(
                              family.updatedAt,
                            )}
                          </small>
                        </div>

                        <strong>
                          {family.name}
                        </strong>

                        <span>
                          구성원{" "}
                          {
                            family.members
                              .length
                          }
                          명 · 최근 수정{" "}
                          {formatDate(
                            family.updatedAt,
                          )}
                        </span>
                      </div>

                      <em>
                        확인
                        <span aria-hidden="true">
                          →
                        </span>
                      </em>
                    </Link>
                  ),
                )}
              </div>
            ) : (
              <EmptyState text="운영 상태를 확인할 가족 공간이 없습니다." />
            )}
          </OperationPanel>

          <OperationPanel
            eyebrow="책 제작"
            title="현재 제작 준비 중인 책"
            description={`최근 수정된 책 ${inProductionBooks.length.toLocaleString()}권 표시`}
            href="/admin/books?status=IN_PRODUCTION"
            buttonLabel="전체 보기"
          >
            {inProductionBooks.length >
            0 ? (
              <div className="admin-home-list">
                {inProductionBooks.map(
                  (book) => {
                    const author =
                      authorMap.get(
                        book.authorId,
                      );

                    return (
                      <Link
                        key={book.id}
                        href={`/admin/books/${book.id}`}
                        className="admin-home-list-item"
                      >
                        <div>
                          <div className="admin-home-list-badges">
                            <BookStatusBadge
                              status={
                                book.status
                              }
                            />

                            <small>
                              {getBookTypeLabel(
                                book.type,
                              )}
                            </small>
                          </div>

                          <strong>
                            {book.title}
                          </strong>

                          <span>
                            {author?.name ||
                              author?.email ||
                              "작성자 확인 필요"}
                            {" · "}
                            최근 수정{" "}
                            {formatDate(
                              book.updatedAt,
                            )}
                          </span>
                        </div>

                        <em>
                          상세
                          <span aria-hidden="true">
                            →
                          </span>
                        </em>
                      </Link>
                    );
                  },
                )}
              </div>
            ) : (
              <EmptyState text="현재 제작 중인 책이 없습니다." />
            )}
          </OperationPanel>
        </section>

        <section className="admin-home-lower-grid">
          <OperationPanel
            eyebrow="상품 신청"
            title="최근 상품 신청"
            description="가장 최근에 접수된 상품 신청 5건"
            href="/admin/product-applications"
            buttonLabel="신청 관리"
          >
            {recentProductApplications.length >
            0 ? (
              <div className="admin-home-list">
                {recentProductApplications.map(
                  (application) => {
                    const customerName =
                      application.name ||
                      application.user
                        .name ||
                      application.email ||
                      application.user
                        .email ||
                      "신청자 확인 필요";

                    return (
                      <Link
                        key={
                          application.id
                        }
                        href={buildSearchHref(
                          "/admin/product-applications",
                          application.productName,
                        )}
                        className="admin-home-list-item"
                      >
                        <div>
                          <div className="admin-home-list-badges">
                            <StatusBadge
                              status={String(
                                application.status,
                              )}
                              label={getProductApplicationStatusLabel(
                                String(
                                  application.status,
                                ),
                              )}
                            />

                            <small>
                              {formatDate(
                                application.createdAt,
                              )}
                            </small>
                          </div>

                          <strong>
                            {
                              application.productName
                            }
                          </strong>

                          <span>
                            {customerName}
                            {" · "}
                            {formatProductApplicationPrice(
                              application.price,
                              application.billingType,
                            )}
                          </span>
                        </div>

                        <em>
                          확인
                          <span aria-hidden="true">
                            →
                          </span>
                        </em>
                      </Link>
                    );
                  },
                )}
              </div>
            ) : (
              <EmptyState text="최근 상품 신청이 없습니다." />
            )}
          </OperationPanel>

          <OperationPanel
            eyebrow="회원"
            title="최근 가입 회원"
            description="가장 최근에 가입한 회원 5명"
            href="/admin/users"
            buttonLabel="회원 관리"
          >
            {recentUsers.length > 0 ? (
              <div className="admin-home-user-list">
                {recentUsers.map(
                  (user) => (
                    <Link
                      key={user.id}
                      href={buildSearchHref(
                        "/admin/users",
                        user.email ||
                          user.name ||
                          "",
                      )}
                      className="admin-home-user-row"
                    >
                      <div>
                        <strong>
                          {user.name ||
                            "이름 없음"}
                        </strong>

                        <span>
                          {user.email ||
                            "이메일 없음"}
                        </span>
                      </div>

                      <RoleBadge
                        role={user.role}
                      />

                      <small>
                        {formatDate(
                          user.createdAt,
                        )}
                      </small>

                      <em>
                        확인
                        <span aria-hidden="true">
                          →
                        </span>
                      </em>
                    </Link>
                  ),
                )}
              </div>
            ) : (
              <EmptyState text="가입한 회원이 없습니다." />
            )}
          </OperationPanel>
        </section>
      </div>
    </main>
  );
}

function PrimaryStat({
  label,
  value,
  unit,
  href,
  tone,
  description,
}: {
  label: string;
  value: number;
  unit: string;
  href: string;
  tone:
    | "coral"
    | "yellow"
    | "purple"
    | "blue";
  description: string;
}) {
  return (
    <Link
      href={href}
      className="admin-home-primary-stat"
      data-tone={tone}
    >
      <span>{label}</span>

      <strong>
        {value.toLocaleString()}
        <small>{unit}</small>
      </strong>

      <p>{description}</p>

      <em>
        확인하기
        <span aria-hidden="true">
          →
        </span>
      </em>
    </Link>
  );
}

function OverviewStat({
  label,
  value,
  unit,
  href,
}: {
  label: string;
  value: number;
  unit: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="admin-home-overview-stat"
    >
      <span>{label}</span>

      <strong>
        {value.toLocaleString()}
        <small>{unit}</small>
      </strong>

      <em aria-hidden="true">
        →
      </em>
    </Link>
  );
}

function WorkflowGroup({
  title,
  href,
  items,
}: {
  title: string;
  href: string;
  items: Array<{
    label: string;
    value: number;
    tone:
      | "coral"
      | "yellow"
      | "blue"
      | "green"
      | "gray";
  }>;
}) {
  return (
    <article className="admin-home-workflow-group">
      <div className="admin-home-workflow-head">
        <h3>{title}</h3>

        <Link href={href}>
          전체 관리
          <span aria-hidden="true">
            →
          </span>
        </Link>
      </div>

      <div className="admin-home-workflow-items">
        {items.map((item) => (
          <div
            key={item.label}
            data-tone={item.tone}
          >
            <span>
              {item.label}
            </span>

            <strong>
              {item.value.toLocaleString()}
            </strong>
          </div>
        ))}
      </div>
    </article>
  );
}

function QuickLink({
  href,
  title,
  description,
  icon,
  emphasized = false,
}: {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
  emphasized?: boolean;
}) {
  return (
    <Link
      href={href}
      className="admin-home-quick-link"
      data-emphasized={
        emphasized
          ? "true"
          : "false"
      }
    >
      <span className="admin-home-quick-icon">
        {icon}
      </span>

      <div>
        <strong>{title}</strong>

        <span>{description}</span>
      </div>

      <em aria-hidden="true">
        →
      </em>
    </Link>
  );
}

function OperationPanel({
  eyebrow,
  title,
  description,
  href,
  buttonLabel,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  buttonLabel: string;
  children: ReactNode;
}) {
  return (
    <article className="admin-home-panel">
      <div className="admin-home-panel-head">
        <div>
          <p>{eyebrow}</p>

          <h2>{title}</h2>

          <span>
            {description}
          </span>
        </div>

        <Link href={href}>
          {buttonLabel}
        </Link>
      </div>

      {children}
    </article>
  );
}

function StatusBadge({
  status,
  label,
}: {
  status: string;
  label: string;
}) {
  return (
    <span
      className="admin-home-status-badge"
      data-status={status}
    >
      {label}
    </span>
  );
}

function BookStatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span
      className="admin-home-book-badge"
      data-status={status}
    >
      {status ===
      "IN_PRODUCTION"
        ? "제작 준비 중"
        : status === "PUBLISHED"
          ? "완성"
          : "원고 초안"}
    </span>
  );
}

function FamilyWarningBadge({
  type,
}: {
  type: "EMPTY" | "NO_OWNER";
}) {
  return (
    <span
      className="admin-home-family-badge"
      data-warning={type}
    >
      {type === "EMPTY"
        ? "구성원 없음"
        : "소유자 없음"}
    </span>
  );
}

function RoleBadge({
  role,
}: {
  role: string;
}) {
  return (
    <span
      className="admin-home-role-badge"
      data-role={role}
    >
      {role === "ADMIN"
        ? "관리자"
        : "일반 회원"}
    </span>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="admin-home-empty">
      <CheckIcon />

      <span>{text}</span>
    </div>
  );
}

function buildSearchHref(
  path: string,
  searchQuery: string,
) {
  const query =
    searchQuery.trim();

  if (!query) {
    return path;
  }

  const params =
    new URLSearchParams();

  params.set("q", query);

  return `${path}?${params.toString()}`;
}

function formatProductApplicationPrice(
  price: number,
  billingType: string,
) {
  const formattedPrice =
    price.toLocaleString("ko-KR");

  if (billingType === "MONTHLY") {
    return `${formattedPrice}원 / 월`;
  }

  return `${formattedPrice}원부터`;
}

function getProductApplicationStatusLabel(
  status: string,
) {
  if (status === "REQUESTED") {
    return "새 신청";
  }

  if (status === "CONTACTED") {
    return "연락 완료";
  }

  if (status === "IN_PROGRESS") {
    return "처리 중";
  }

  if (status === "COMPLETED") {
    return "처리 완료";
  }

  if (status === "CANCELED") {
    return "신청 취소";
  }

  return "상태 확인";
}

function getBookTypeLabel(
  type: string,
) {
  if (type === "LIFE_BOOK") {
    return "부모님 인생책";
  }

  if (type === "FAMILY_BOOK") {
    return "가족 이야기책";
  }

  if (type === "COUPLE_BOOK") {
    return "부부 이야기책";
  }

  if (type === "BABY_BOOK") {
    return "성장 기록책";
  }

  if (type === "TRAVEL_BOOK") {
    return "여행 기록책";
  }

  if (type === "AI_MOVIE") {
    return "AI 영상";
  }

  return "종류 확인";
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
    return "-";
  }

  return new Intl.DateTimeFormat(
    "ko-KR",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
  ).format(date);
}

function AlertIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M32 8 58 53H6L32 8Z"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinejoin="round"
      />

      <path
        d="M32 23v14M32 46h.01"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="32"
        cy="32"
        r="24"
        stroke="currentColor"
        strokeWidth="4"
      />

      <path
        d="m20 33 8 8 17-19"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ConsultationIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 13h40v30H31l-11 9v-9h-8V13Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      <path
        d="M21 24h22M21 32h15"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ApplicationIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M17 10h30v44H17V10Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      <path
        d="M24 22h16M24 30h16M24 38h10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10 13.5c9.5-2.1 16.7.2 22 6.9 5.3-6.7 12.5-9 22-6.9v38.2c-9.5-2.1-16.7.2-22 6.8-5.3-6.6-12.5-8.9-22-6.8V13.5Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      <path
        d="M32 20.4v38.1"
        stroke="currentColor"
        strokeWidth="3"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="32"
        cy="23"
        r="11"
        stroke="currentColor"
        strokeWidth="3"
      />

      <path
        d="M13 53c2.7-10 9-15 19-15s16.3 5 19 15"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FamilyIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="24"
        cy="23"
        r="8"
        stroke="currentColor"
        strokeWidth="3"
      />

      <circle
        cx="43"
        cy="25"
        r="6"
        stroke="currentColor"
        strokeWidth="3"
      />

      <path
        d="M9 51c2.4-9 7.4-13.5 15-13.5S36.6 42 39 51M37 51c1.5-6.3 4.8-9.5 10-9.5 4.1 0 7 2.5 8.7 7.5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ReviewIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m32 9 6.7 13.6 15 2.2-10.8 10.5 2.5 14.9L32 43.1l-13.4 7.1 2.5-14.9L10.3 24.8l15-2.2L32 9Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const adminHomeStyles = `
  .admin-home-page,
  .admin-home-page * {
    box-sizing: border-box;
  }

  .admin-home-page {
    min-height: 100%;
    color: #432f26;
    font-family:
      var(--font-daldongne-sans),
      "Noto Sans KR",
      sans-serif;
  }

  .admin-home-page a {
    color: inherit;
    text-decoration: none;
  }

  .admin-home-page a {
    transition:
      transform 160ms ease,
      box-shadow 160ms ease,
      border-color 160ms ease;
  }

  .admin-home-page a:hover {
    transform: translateY(-2px);
  }

  .admin-home-page a:focus-visible {
    outline:
      4px solid
      rgba(239, 105, 83, 0.2);
    outline-offset: 3px;
  }

  .admin-home-shell {
    width: min(1480px, 100%);
    margin: 0 auto;
  }

  .admin-home-hero {
    padding: 31px 35px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 25px;
    border:
      1px solid
      rgba(136, 94, 74, 0.13);
    border-radius: 26px;
    background:
      radial-gradient(
        circle at 88% 0%,
        rgba(255, 222, 203, 0.58),
        transparent 22rem
      ),
      linear-gradient(
        135deg,
        rgba(255, 253, 248, 0.99),
        rgba(255, 247, 240, 0.98)
      );
    box-shadow:
      0 19px 46px
      rgba(91, 59, 44, 0.065);
  }

  .admin-home-hero-copy {
    min-width: 0;
  }

  .admin-home-hero-copy > p {
    margin: 0;
    color: #e56852;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.1em;
  }

  .admin-home-hero h1 {
    margin: 8px 0 0;
    max-width: 760px;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size:
      clamp(33px, 4vw, 52px);
    line-height: 1.24;
    letter-spacing: -0.055em;
  }

  .admin-home-hero-copy > span {
    display: block;
    max-width: 720px;
    margin-top: 10px;
    color: #76635a;
    font-size: 13px;
    line-height: 1.78;
  }

  .admin-home-hero-actions {
    min-width: 270px;
    display: grid;
    gap: 8px;
  }

  .admin-home-hero-actions a {
    min-height: 46px;
    padding: 0 15px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    border:
      1px solid #d6b3a3;
    border-radius: 12px;
    color: #755247;
    background: #ffffff;
    font-size: 10px;
    font-weight: 900;
  }

  .admin-home-hero-actions a:first-child {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
  }

  .admin-home-hero-actions small {
    min-width: 22px;
    height: 22px;
    padding: 0 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    color: inherit;
    background:
      rgba(255, 255, 255, 0.2);
    font-size: 8px;
  }

  .admin-home-hero-actions a:nth-child(2) small {
    color: #9a5e49;
    background: #fff0e8;
  }

  .admin-home-priority {
    margin-top: 16px;
    padding: 19px 21px;
    display: grid;
    grid-template-columns:
      52px minmax(0, 1fr) auto;
    align-items: center;
    gap: 15px;
    border:
      1px solid #9dcca4;
    border-radius: 20px;
    background:
      linear-gradient(
        135deg,
        #edf8ee,
        #fbfffb
      );
    box-shadow:
      0 12px 30px
      rgba(91, 59, 44, 0.045);
  }

  .admin-home-priority[data-urgent="true"] {
    border-color: #e2a26e;
    background:
      linear-gradient(
        135deg,
        #fff1df,
        #fffaf2
      );
  }

  .admin-home-priority-icon {
    width: 52px;
    height: 52px;
    padding: 10px;
    display: grid;
    place-items: center;
    border-radius: 15px;
    color: #3f7948;
    background: #ffffff;
  }

  .admin-home-priority[data-urgent="true"]
  .admin-home-priority-icon {
    color: #a34d29;
  }

  .admin-home-priority-icon svg {
    width: 100%;
    height: 100%;
  }

  .admin-home-priority-copy p {
    margin: 0;
    color: #3f7948;
    font-size: 8px;
    font-weight: 900;
    letter-spacing: 0.08em;
  }

  .admin-home-priority[data-urgent="true"]
  .admin-home-priority-copy p {
    color: #a34d29;
  }

  .admin-home-priority-copy h2 {
    margin: 5px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 20px;
    line-height: 1.45;
    letter-spacing: -0.035em;
  }

  .admin-home-priority-copy span {
    display: block;
    margin-top: 4px;
    color: #77645b;
    font-size: 9px;
    line-height: 1.65;
  }

  .admin-home-priority-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 6px;
  }

  .admin-home-priority-actions a {
    min-height: 36px;
    padding: 0 10px;
    display: inline-flex;
    align-items: center;
    border:
      1px solid #d6b3a3;
    border-radius: 9px;
    color: #755247;
    background: #ffffff;
    font-size: 8px;
    font-weight: 900;
    white-space: nowrap;
  }

  .admin-home-primary-stats {
    margin-top: 16px;
    display: grid;
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .admin-home-primary-stat {
    min-width: 0;
    padding: 17px;
    border:
      1px solid
      rgba(136, 94, 74, 0.12);
    border-radius: 17px;
    background: #ffffff;
    box-shadow:
      0 10px 25px
      rgba(91, 59, 44, 0.045);
  }

  .admin-home-primary-stat[data-tone="coral"] {
    background: #fff0eb;
  }

  .admin-home-primary-stat[data-tone="yellow"] {
    background: #fff7da;
  }

  .admin-home-primary-stat[data-tone="purple"] {
    background: #f3edff;
  }

  .admin-home-primary-stat[data-tone="blue"] {
    background: #edf5ff;
  }

  .admin-home-primary-stat > span {
    color: #715d54;
    font-size: 9px;
    font-weight: 900;
  }

  .admin-home-primary-stat > strong {
    display: block;
    margin-top: 7px;
    color: #e0644e;
    font-size: 30px;
    line-height: 1.1;
  }

  .admin-home-primary-stat > strong small {
    margin-left: 4px;
    color: #806d64;
    font-size: 9px;
  }

  .admin-home-primary-stat p {
    margin: 8px 0 0;
    color: #806d64;
    font-size: 8px;
    line-height: 1.55;
  }

  .admin-home-primary-stat em {
    margin-top: 13px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #8d5543;
    font-size: 8px;
    font-style: normal;
    font-weight: 900;
  }

  .admin-home-overview,
  .admin-home-workflow,
  .admin-home-quick-links,
  .admin-home-panel {
    border:
      1px solid
      rgba(136, 94, 74, 0.13);
    border-radius: 22px;
    background:
      rgba(255, 255, 255, 0.94);
    box-shadow:
      0 14px 36px
      rgba(91, 59, 44, 0.052);
  }

  .admin-home-overview,
  .admin-home-workflow,
  .admin-home-quick-links {
    margin-top: 16px;
    padding: 21px;
  }

  .admin-home-overview-heading,
  .admin-home-section-heading,
  .admin-home-panel-head,
  .admin-home-workflow-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 15px;
  }

  .admin-home-overview-heading p,
  .admin-home-section-heading p,
  .admin-home-panel-head p {
    margin: 0;
    color: #e56852;
    font-size: 8px;
    font-weight: 900;
    letter-spacing: 0.08em;
  }

  .admin-home-overview-heading h2,
  .admin-home-section-heading h2,
  .admin-home-panel-head h2 {
    margin: 5px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 23px;
    line-height: 1.42;
    letter-spacing: -0.04em;
  }

  .admin-home-overview-heading div > span,
  .admin-home-section-heading div > span,
  .admin-home-panel-head div > span {
    display: block;
    margin-top: 5px;
    color: #7c6960;
    font-size: 9px;
    line-height: 1.65;
  }

  .admin-home-overview-heading > a,
  .admin-home-panel-head > a {
    min-height: 36px;
    padding: 0 11px;
    display: inline-flex;
    align-items: center;
    flex: 0 0 auto;
    border:
      1px solid #d6b3a3;
    border-radius: 9px;
    color: #755247;
    background: #ffffff;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-home-overview-grid {
    margin-top: 15px;
    display: grid;
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    gap: 8px;
  }

  .admin-home-overview-stat {
    min-width: 0;
    padding: 14px;
    display: grid;
    grid-template-columns:
      minmax(0, 1fr) auto;
    align-items: end;
    gap: 5px;
    border:
      1px solid
      rgba(139, 97, 75, 0.1);
    border-radius: 13px;
    background: #fffaf6;
  }

  .admin-home-overview-stat > span {
    grid-column: 1 / -1;
    color: #8a756a;
    font-size: 8px;
    font-weight: 850;
  }

  .admin-home-overview-stat > strong {
    color: #4a352c;
    font-size: 24px;
  }

  .admin-home-overview-stat > strong small {
    margin-left: 4px;
    color: #8a756a;
    font-size: 8px;
  }

  .admin-home-overview-stat > em {
    color: #d2654e;
    font-size: 13px;
    font-style: normal;
    font-weight: 900;
  }

  .admin-home-workflow-grid {
    margin-top: 15px;
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .admin-home-workflow-group {
    min-width: 0;
    padding: 14px;
    border:
      1px solid
      rgba(139, 97, 75, 0.1);
    border-radius: 14px;
    background: #fffaf6;
  }

  .admin-home-workflow-head h3 {
    margin: 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 16px;
  }

  .admin-home-workflow-head a {
    color: #d2614b;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-home-workflow-items {
    margin-top: 11px;
    display: grid;
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    gap: 6px;
  }

  .admin-home-workflow-items > div {
    min-width: 0;
    padding: 10px;
    border-radius: 10px;
    background: #ffffff;
  }

  .admin-home-workflow-items > div[data-tone="coral"] {
    background: #fff0eb;
  }

  .admin-home-workflow-items > div[data-tone="yellow"] {
    background: #fff6d9;
  }

  .admin-home-workflow-items > div[data-tone="blue"] {
    background: #edf5ff;
  }

  .admin-home-workflow-items > div[data-tone="green"] {
    background: #edf7e9;
  }

  .admin-home-workflow-items > div[data-tone="gray"] {
    background: #f2efed;
  }

  .admin-home-workflow-items span,
  .admin-home-workflow-items strong {
    display: block;
  }

  .admin-home-workflow-items span {
    overflow: hidden;
    color: #7a675e;
    font-size: 7px;
    font-weight: 850;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .admin-home-workflow-items strong {
    margin-top: 5px;
    color: #4b362d;
    font-size: 17px;
  }

  .admin-home-quick-grid {
    margin-top: 15px;
    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .admin-home-quick-link {
    min-width: 0;
    min-height: 90px;
    padding: 13px;
    display: grid;
    grid-template-columns:
      38px minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    border:
      1px solid
      rgba(139, 97, 75, 0.11);
    border-radius: 13px;
    background: #fffaf6;
  }

  .admin-home-quick-link[data-emphasized="true"] {
    border-color: #df9d86;
    background: #fff1e9;
  }

  .admin-home-quick-icon {
    width: 38px;
    height: 38px;
    padding: 7px;
    display: grid;
    place-items: center;
    border-radius: 11px;
    color: #db674f;
    background: #ffffff;
  }

  .admin-home-quick-icon svg {
    width: 100%;
    height: 100%;
  }

  .admin-home-quick-link > div {
    min-width: 0;
  }

  .admin-home-quick-link strong,
  .admin-home-quick-link > div > span {
    display: block;
  }

  .admin-home-quick-link strong {
    font-size: 10px;
  }

  .admin-home-quick-link > div > span {
    margin-top: 4px;
    overflow: hidden;
    color: #7b685e;
    font-size: 7px;
    line-height: 1.55;
    text-overflow: ellipsis;
  }

  .admin-home-quick-link > em {
    color: #dc674f;
    font-size: 12px;
    font-style: normal;
    font-weight: 900;
  }

  .admin-home-operation-grid {
    margin-top: 16px;
    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
    align-items: start;
    gap: 12px;
  }

  .admin-home-lower-grid {
    margin-top: 16px;
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    align-items: start;
    gap: 12px;
  }

  .admin-home-panel {
    min-width: 0;
    padding: 19px;
  }

  .admin-home-list,
  .admin-home-user-list {
    margin-top: 14px;
    display: grid;
    gap: 7px;
  }

  .admin-home-list-item,
  .admin-home-user-row {
    min-width: 0;
    padding: 11px;
    border:
      1px solid
      rgba(139, 97, 75, 0.1);
    border-radius: 11px;
    background: #fffaf6;
  }

  .admin-home-list-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .admin-home-list-item > div {
    min-width: 0;
  }

  .admin-home-list-badges {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 5px;
  }

  .admin-home-list-badges small {
    color: #967e72;
    font-size: 6px;
  }

  .admin-home-list-item strong {
    display: block;
    margin-top: 6px;
    overflow: hidden;
    font-size: 10px;
    line-height: 1.5;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .admin-home-list-item > div > span {
    display: block;
    margin-top: 4px;
    overflow: hidden;
    color: #7c6960;
    font-size: 7px;
    line-height: 1.55;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .admin-home-list-item > em,
  .admin-home-user-row > em {
    flex: 0 0 auto;
    color: #d4624c;
    font-size: 7px;
    font-style: normal;
    font-weight: 900;
    white-space: nowrap;
  }

  .admin-home-status-badge,
  .admin-home-book-badge,
  .admin-home-family-badge,
  .admin-home-role-badge {
    min-height: 22px;
    padding: 0 7px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    font-size: 6px;
    font-weight: 900;
    white-space: nowrap;
  }

  .admin-home-status-badge[data-status="REQUESTED"] {
    color: #83540d;
    background: #fff1c7;
  }

  .admin-home-status-badge[data-status="CONTACTED"] {
    color: #245d8c;
    background: #e4f2ff;
  }

  .admin-home-status-badge[data-status="IN_PROGRESS"] {
    color: #62438a;
    background: #efe6ff;
  }

  .admin-home-status-badge[data-status="COMPLETED"] {
    color: #2f6b38;
    background: #e3f4e5;
  }

  .admin-home-status-badge[data-status="CANCELED"] {
    color: #776868;
    background: #f2eeee;
  }

  .admin-home-book-badge[data-status="IN_PRODUCTION"] {
    color: #62438a;
    background: #efe6ff;
  }

  .admin-home-book-badge[data-status="PUBLISHED"] {
    color: #2f6b38;
    background: #e3f4e5;
  }

  .admin-home-book-badge[data-status="DRAFT"] {
    color: #83540d;
    background: #fff1c7;
  }

  .admin-home-family-badge[data-warning="EMPTY"] {
    color: #776868;
    background: #f2eeee;
  }

  .admin-home-family-badge[data-warning="NO_OWNER"] {
    color: #83540d;
    background: #fff1c7;
  }

  .admin-home-role-badge[data-role="ADMIN"] {
    color: #ffffff;
    background: #7b3730;
  }

  .admin-home-role-badge {
    color: #76665e;
    background: #eee9e5;
  }

  .admin-home-user-row {
    display: grid;
    grid-template-columns:
      minmax(0, 1fr) auto auto auto;
    align-items: center;
    gap: 9px;
  }

  .admin-home-user-row > div {
    min-width: 0;
  }

  .admin-home-user-row strong,
  .admin-home-user-row > div > span {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .admin-home-user-row strong {
    font-size: 9px;
  }

  .admin-home-user-row > div > span {
    margin-top: 3px;
    color: #7c6960;
    font-size: 7px;
  }

  .admin-home-user-row > small {
    color: #967e72;
    font-size: 6px;
    white-space: nowrap;
  }

  .admin-home-empty {
    margin-top: 14px;
    padding: 24px 14px;
    display: grid;
    justify-items: center;
    gap: 8px;
    border:
      1px dashed #d8b8aa;
    border-radius: 12px;
    color: #806b61;
    background: #fffaf7;
    text-align: center;
  }

  .admin-home-empty svg {
    width: 31px;
    height: 31px;
    color: #6e9a74;
  }

  .admin-home-empty span {
    font-size: 8px;
    line-height: 1.65;
  }

  @media (max-width: 1180px) {
    .admin-home-primary-stats,
    .admin-home-overview-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .admin-home-quick-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .admin-home-operation-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 900px) {
    .admin-home-hero {
      align-items: stretch;
      flex-direction: column;
      padding: 25px;
      border-radius: 22px;
    }

    .admin-home-hero-actions {
      min-width: 0;
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
    }

    .admin-home-priority {
      grid-template-columns:
        46px minmax(0, 1fr);
    }

    .admin-home-priority-actions {
      grid-column: 1 / -1;
      justify-content: flex-start;
    }

    .admin-home-workflow-grid,
    .admin-home-lower-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 660px) {
    .admin-home-hero-actions,
    .admin-home-primary-stats,
    .admin-home-overview-grid,
    .admin-home-quick-grid {
      grid-template-columns: 1fr;
    }

    .admin-home-priority {
      grid-template-columns: 1fr;
    }

    .admin-home-priority-icon {
      width: 45px;
      height: 45px;
    }

    .admin-home-workflow-items {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .admin-home-overview,
    .admin-home-workflow,
    .admin-home-quick-links,
    .admin-home-panel {
      padding: 16px;
      border-radius: 18px;
    }

    .admin-home-overview-heading,
    .admin-home-panel-head {
      align-items: stretch;
      flex-direction: column;
    }

    .admin-home-overview-heading > a,
    .admin-home-panel-head > a {
      justify-content: center;
    }

    .admin-home-user-row {
      grid-template-columns:
        minmax(0, 1fr) auto;
    }

    .admin-home-user-row > small {
      grid-column: 1 / 2;
    }

    .admin-home-user-row > em {
      grid-column: 2 / 3;
      grid-row: 2;
    }
  }

  @media (max-width: 430px) {
    .admin-home-workflow-items {
      grid-template-columns: 1fr;
    }

    .admin-home-list-item {
      align-items: stretch;
      flex-direction: column;
    }

    .admin-home-list-item > em {
      text-align: right;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .admin-home-page a {
      transition: none;
    }
  }
`;
