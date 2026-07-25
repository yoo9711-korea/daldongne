import { auth } from "@/auth";
import CopyTextButton from "@/components/admin/CopyTextButton";
import ProductionRequestStatusButton from "@/components/admin/ProductionRequestStatusButton";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";
import type { ReactNode } from "react";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type BookRecord = {
  id: string;
  authorId: string;
  type: string;
  title: string;
  subtitle: string | null;
  summary: string | null;
  content: string | null;
  coverText: string | null;
  status: string;
  pageCount: number | null;
  basedPhotoCount: number | null;
  basedStoryCount: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type UserRecord = {
  id: string;
  name: string | null;
  email: string | null;
};

type BookOrderRecord = {
  productType: string;
  productName: string;
  specification: string | null;
  quantity: number;
  productAmount: number;
  shippingFee: number;
  totalAmount: number;
  status: string;
  orderId: string;
};

type ProductionRequestRecord = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  message: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  bookOrder: BookOrderRecord | null;
};

type LinkedMemoryRecord = {
  id: string;
  order: number;
  memory: {
    id: string;
    type: string;
    title: string | null;
    description: string | null;
    fileUrl: string | null;
    occurredAt: Date | null;
    createdAt: Date;
  };
};

export default async function AdminBookDetailPage({
  params,
}: PageProps) {
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
        id: true,
        role: true,
      },
    });

  if (adminUser?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { id } = await params;

  const book =
    (await prisma.book.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        authorId: true,
        type: true,
        title: true,
        subtitle: true,
        summary: true,
        content: true,
        coverText: true,
        status: true,
        pageCount: true,
        basedPhotoCount: true,
        basedStoryCount: true,
        createdAt: true,
        updatedAt: true,
      },
    })) as BookRecord | null;

  if (!book) {
    notFound();
  }

  const [
    author,
    productionRequests,
    linkedMemories,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: book.authorId,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    }) as Promise<UserRecord | null>,

    prisma.bookProductionRequest.findMany({
      where: {
        bookId: book.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        message: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        bookOrder: {
          select: {
            productType: true,
            productName: true,
            specification: true,
            quantity: true,
            productAmount: true,
            shippingFee: true,
            totalAmount: true,
            status: true,
            orderId: true,
          },
        },
      },
    }) as Promise<
      ProductionRequestRecord[]
    >,

    prisma.bookMemory.findMany({
      where: {
        bookId: book.id,
      },
      orderBy: {
        order: "asc",
      },
      include: {
        memory: {
          select: {
            id: true,
            type: true,
            title: true,
            description: true,
            fileUrl: true,
            occurredAt: true,
            createdAt: true,
          },
        },
      },
    }) as Promise<
      LinkedMemoryRecord[]
    >,
  ]);

  const activeStatuses = new Set([
    "REQUESTED",
    "CONTACTED",
    "IN_PROGRESS",
  ]);

  const productionRequest =
    productionRequests.find((request) =>
      activeStatuses.has(
        request.status,
      ),
    ) ??
    productionRequests[0] ??
    null;

  const pastProductionRequests =
    productionRequest
      ? productionRequests.filter(
          (request) =>
            request.id !==
            productionRequest.id,
        )
      : productionRequests;

  const photoMemories =
    linkedMemories.filter(
      ({ memory }) =>
        memory.type === "PHOTO" ||
        Boolean(memory.fileUrl),
    );

  const storyMemories =
    linkedMemories.filter(
      ({ memory }) =>
        memory.type !== "PHOTO" &&
        !memory.fileUrl,
    );

  const coverPhoto =
    photoMemories[0]?.memory ??
    null;

  const displayedPhotoCount =
    book.basedPhotoCount ??
    photoMemories.length;

  const displayedStoryCount =
    book.basedStoryCount ??
    storyMemories.length;

  const contentParagraphs =
    splitContent(book.content);

  return (
    <main className="admin-book-detail-page">
      <style>
        {adminBookDetailStyles}
      </style>

      <div className="admin-book-detail-shell">
        <header className="admin-book-detail-hero">
          <div className="admin-book-detail-hero-copy">
            <p>관리자 · 책 상세 관리</p>

            <div className="admin-book-detail-badges">
              <BookStatusBadge
                status={book.status}
              />

              <span>
                {getBookTypeLabel(
                  book.type,
                )}
              </span>

              {productionRequest ? (
                <RequestStatusBadge
                  status={
                    productionRequest.status
                  }
                />
              ) : (
                <span>
                  제작 상담 없음
                </span>
              )}
            </div>

            <h1>{book.title}</h1>

            <strong>
              {book.subtitle ||
                "등록된 부제가 없습니다."}
            </strong>

            <span className="admin-book-detail-hero-description">
              책 원고, 사용 자료,
              소유자 정보와 제작 상담·주문
              상태를 한 화면에서
              확인합니다.
            </span>
          </div>

          <div className="admin-book-detail-hero-actions">
            <Link href="/admin/books">
              전체 책 목록
            </Link>

            <Link href="/admin/production-requests">
              제작 상담 목록
            </Link>

            {productionRequest ? (
              <Link
                href={`/admin/production-requests?q=${encodeURIComponent(
                  book.title,
                )}`}
              >
                상담·견적 관리
                <span aria-hidden="true">
                  →
                </span>
              </Link>
            ) : null}
          </div>
        </header>

        <section className="admin-book-detail-overview">
          <div className="admin-book-detail-cover">
            {coverPhoto ? (
              <Image
                src={`/api/blob/${coverPhoto.id}`}
                alt={
                  coverPhoto.title ||
                  `${book.title} 표지 사진`
                }
                fill
                unoptimized
                priority
                sizes="(max-width: 720px) 100vw, 310px"
              />
            ) : (
              <div className="admin-book-detail-cover-empty">
                <BookIcon />

                <span>
                  등록된 표지 사진이
                  없습니다.
                </span>
              </div>
            )}

            <div className="admin-book-detail-cover-shade" />

            <div className="admin-book-detail-cover-copy">
              <small>
                {getBookTypeLabel(
                  book.type,
                )}
              </small>

              <strong>
                {book.title}
              </strong>

              <span>
                {book.coverText ||
                  book.subtitle ||
                  "달동네 스토리북"}
              </span>
            </div>
          </div>

          <div className="admin-book-detail-overview-copy">
            <div className="admin-book-detail-metrics">
              <MetricBox
                label="책 상태"
                value={getBookStatusLabel(
                  book.status,
                )}
              />

              <MetricBox
                label="예상 분량"
                value={getPageCountLabel(
                  book.pageCount,
                )}
              />

              <MetricBox
                label="사용 사진"
                value={`${displayedPhotoCount.toLocaleString()}장`}
              />

              <MetricBox
                label="사용 이야기"
                value={`${displayedStoryCount.toLocaleString()}개`}
              />
            </div>

            <section className="admin-book-detail-owner">
              <div>
                <p>책 소유자</p>

                <h2>
                  {author?.name ||
                    "이름 미등록"}
                </h2>

                <span>
                  {author?.email ||
                    "이메일 미등록"}
                </span>
              </div>

              <div>
                <InfoBox
                  title="회원 ID"
                  value={
                    author?.id ||
                    book.authorId
                  }
                />

                <InfoBox
                  title="책 생성일"
                  value={formatDateTime(
                    book.createdAt,
                  )}
                />

                <InfoBox
                  title="최근 수정"
                  value={formatDateTime(
                    book.updatedAt,
                  )}
                />
              </div>
            </section>

            <section className="admin-book-detail-summary">
              <p>책 소개</p>

              <h2>
                원고의 핵심 내용을
                확인합니다
              </h2>

              <div>
                {book.summary ||
                  "등록된 책 소개가 없습니다."}
              </div>
            </section>
          </div>
        </section>

        <section className="admin-book-detail-main-grid">
          <div className="admin-book-detail-main-column">
            <section className="admin-book-detail-panel">
              <SectionHeading
                eyebrow="원고 내용"
                title="표지 문구와 책 본문"
                description="고객에게 제공되는 원고의 주요 문장과 전체 본문을 확인합니다."
              />

              <div className="admin-book-detail-copy-grid">
                <article>
                  <span>표지 문구</span>

                  <p>
                    {book.coverText ||
                      "등록된 표지 문구가 없습니다."}
                  </p>
                </article>

                <article>
                  <span>책 부제</span>

                  <p>
                    {book.subtitle ||
                      "등록된 부제가 없습니다."}
                  </p>
                </article>
              </div>

              <div className="admin-book-detail-content">
                {contentParagraphs.length >
                0 ? (
                  contentParagraphs.map(
                    (
                      paragraph,
                      index,
                    ) => (
                      <p key={index}>
                        {paragraph}
                      </p>
                    ),
                  )
                ) : (
                  <EmptyBox text="등록된 책 본문이 없습니다." />
                )}
              </div>
            </section>

            <section className="admin-book-detail-panel">
              <SectionHeading
                eyebrow="선택 자료"
                title="원고에 사용된 사진과 이야기"
                description={`연결된 자료 ${linkedMemories.length.toLocaleString()}개를 원고 순서대로 표시합니다.`}
              />

              {linkedMemories.length >
              0 ? (
                <div className="admin-book-detail-memory-grid">
                  {linkedMemories.map(
                    (
                      linkedMemory,
                      index,
                    ) => (
                      <MemoryCard
                        key={
                          linkedMemory.id
                        }
                        linkedMemory={
                          linkedMemory
                        }
                        number={
                          index + 1
                        }
                      />
                    ),
                  )}
                </div>
              ) : (
                <EmptyBox text="이 책에 연결된 사진이나 이야기가 없습니다." />
              )}
            </section>
          </div>

          <aside className="admin-book-detail-side-column">
            <section className="admin-book-detail-panel admin-book-detail-consultation">
              <SectionHeading
                eyebrow="제작 상담"
                title="현재 상담 신청"
                description="고객 연락처와 요청 내용을 확인하고 상담 상태를 관리합니다."
              />

              {productionRequest ? (
                <>
                  <div className="admin-book-detail-request-head">
                    <RequestStatusBadge
                      status={
                        productionRequest.status
                      }
                    />

                    <div>
                      <span>
                        신청{" "}
                        {formatDateTime(
                          productionRequest.createdAt,
                        )}
                      </span>

                      <span>
                        최근 처리{" "}
                        {formatDateTime(
                          productionRequest.updatedAt,
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="admin-book-detail-request-info">
                    <InfoBox
                      title="신청자"
                      value={
                        productionRequest.name ||
                        "이름 없음"
                      }
                    />

                    <InfoBox
                      title="연락처"
                      value={
                        productionRequest.phone ||
                        "연락처 없음"
                      }
                      action={
                        <CopyTextButton
                          value={
                            productionRequest.phone
                          }
                          label="번호 복사"
                        />
                      }
                    />

                    <InfoBox
                      title="상담 이메일"
                      value={
                        productionRequest.email ||
                        "이메일 없음"
                      }
                      action={
                        <CopyTextButton
                          value={
                            productionRequest.email
                          }
                          label="메일 복사"
                        />
                      }
                    />
                  </div>

                  <div className="admin-book-detail-request-message">
                    <span>
                      고객 요청 내용
                    </span>

                    <p>
                      {productionRequest.message ||
                        "별도로 작성한 요청 내용이 없습니다."}
                    </p>
                  </div>

                  <div className="admin-book-detail-status-control">
                    <span>
                      상담 진행 상태 변경
                    </span>

                    <ProductionRequestStatusButton
                      requestId={
                        productionRequest.id
                      }
                      currentStatus={
                        productionRequest.status
                      }
                    />
                  </div>
                </>
              ) : (
                <EmptyBox text="아직 제작 상담 신청이 없습니다." />
              )}
            </section>

            <section className="admin-book-detail-panel admin-book-detail-order-panel">
              <SectionHeading
                eyebrow="제작 주문"
                title="견적과 결제 상태"
                description="등록된 제작 사양과 고객 결제 진행 상태를 확인합니다."
              />

              {productionRequest?.bookOrder ? (
                <OrderSummary
                  order={
                    productionRequest.bookOrder
                  }
                />
              ) : (
                <div className="admin-book-detail-no-order">
                  <strong>
                    등록된 제작 견적이
                    없습니다.
                  </strong>

                  <p>
                    제작 상담 관리 화면에서
                    상품·수량·배송비를
                    등록할 수 있습니다.
                  </p>

                  <Link
                    href={`/admin/production-requests?q=${encodeURIComponent(
                      book.title,
                    )}`}
                  >
                    상담·견적 관리로 이동
                  </Link>
                </div>
              )}
            </section>

            {pastProductionRequests.length >
            0 ? (
              <section className="admin-book-detail-panel">
                <SectionHeading
                  eyebrow="상담 이력"
                  title={`이전 상담 ${pastProductionRequests.length.toLocaleString()}건`}
                  description="현재 상담을 제외한 과거 신청과 처리 상태입니다."
                />

                <div className="admin-book-detail-history">
                  {pastProductionRequests.map(
                    (request) => (
                      <article
                        key={
                          request.id
                        }
                      >
                        <div>
                          <RequestStatusBadge
                            status={
                              request.status
                            }
                          />

                          <span>
                            {formatDateTime(
                              request.createdAt,
                            )}
                          </span>
                        </div>

                        <strong>
                          {request.name ||
                            "이름 없음"}
                        </strong>

                        <p>
                          {request.message ||
                            "요청 내용 없음"}
                        </p>
                      </article>
                    ),
                  )}
                </div>
              </section>
            ) : null}
          </aside>
        </section>
      </div>
    </main>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="admin-book-detail-section-heading">
      <p>{eyebrow}</p>

      <h2>{title}</h2>

      <span>{description}</span>
    </div>
  );
}

function MetricBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <article className="admin-book-detail-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function InfoBox({
  title,
  value,
  action,
}: {
  title: string;
  value: string;
  action?: ReactNode;
}) {
  return (
    <div className="admin-book-detail-info-box">
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
      </div>

      {action ? (
        <div className="admin-book-detail-info-action">
          {action}
        </div>
      ) : null}
    </div>
  );
}

function MemoryCard({
  linkedMemory,
  number,
}: {
  linkedMemory: LinkedMemoryRecord;
  number: number;
}) {
  const { memory } =
    linkedMemory;

  const isPhoto =
    memory.type === "PHOTO" ||
    Boolean(memory.fileUrl);

  return (
    <article className="admin-book-detail-memory-card">
      {isPhoto ? (
        <div className="admin-book-detail-memory-image">
          <Image
            src={`/api/blob/${memory.id}`}
            alt={
              memory.title ||
              `원고 사진 ${number}`
            }
            fill
            unoptimized
            sizes="(max-width: 680px) 100vw, 260px"
          />

          <span>
            사진 {number}
          </span>
        </div>
      ) : (
        <div className="admin-book-detail-story-icon">
          <StoryIcon />

          <span>
            이야기 {number}
          </span>
        </div>
      )}

      <div className="admin-book-detail-memory-copy">
        <div>
          <span>
            {getMemoryTypeLabel(
              memory.type,
            )}
          </span>

          <small>
            {memory.occurredAt
              ? formatDate(
                  memory.occurredAt,
                )
              : formatDate(
                  memory.createdAt,
                )}
          </small>
        </div>

        <h3>
          {memory.title ||
            `${getMemoryTypeLabel(
              memory.type,
            )} ${number}`}
        </h3>

        <p>
          {memory.description ||
            "등록된 설명이 없습니다."}
        </p>
      </div>
    </article>
  );
}

function OrderSummary({
  order,
}: {
  order: BookOrderRecord;
}) {
  return (
    <div className="admin-book-detail-order">
      <div className="admin-book-detail-order-head">
        <div>
          <OrderStatusBadge
            status={order.status}
          />

          <h3>
            {order.productName}
          </h3>

          <p>
            {order.specification ||
              "별도 제작 사양이 없습니다."}
          </p>
        </div>

        <span>
          {getProductTypeLabel(
            order.productType,
          )}
        </span>
      </div>

      <div className="admin-book-detail-order-metrics">
        <MetricBox
          label="수량"
          value={`${order.quantity.toLocaleString()}권`}
        />

        <MetricBox
          label="상품 금액"
          value={`${order.productAmount.toLocaleString()}원`}
        />

        <MetricBox
          label="배송비"
          value={`${order.shippingFee.toLocaleString()}원`}
        />
      </div>

      <div className="admin-book-detail-order-total">
        <span>총 결제금액</span>

        <strong>
          {order.totalAmount.toLocaleString()}
          원
        </strong>
      </div>

      <div className="admin-book-detail-order-id">
        <span>주문번호</span>

        <strong>
          {order.orderId}
        </strong>
      </div>
    </div>
  );
}

function EmptyBox({
  text,
}: {
  text: string;
}) {
  return (
    <div className="admin-book-detail-empty">
      {text}
    </div>
  );
}

function BookStatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span
      className="admin-book-detail-book-status"
      data-status={status}
    >
      {getBookStatusLabel(status)}
    </span>
  );
}

function RequestStatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span
      className="admin-book-detail-request-status"
      data-status={status}
    >
      {getProductionRequestStatusLabel(
        status,
      )}
    </span>
  );
}

function OrderStatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span
      className="admin-book-detail-order-status"
      data-status={status}
    >
      {getOrderStatusLabel(
        status,
      )}
    </span>
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

function StoryIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M15 10h27l9 9v35H15V10Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      <path
        d="M42 10v10h9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      <path
        d="M23 30h20M23 38h20M23 46h13"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function splitContent(
  content: string | null,
) {
  if (!content?.trim()) {
    return [];
  }

  return content
    .split(/\n{2,}/)
    .map((paragraph) =>
      paragraph.trim(),
    )
    .filter(Boolean);
}

function getBookStatusLabel(
  status: string,
) {
  if (status === "DRAFT") {
    return "원고 초안";
  }

  if (
    status === "IN_PRODUCTION"
  ) {
    return "제작 준비 중";
  }

  if (status === "PUBLISHED") {
    return "완성";
  }

  return "상태 확인 필요";
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

  return "종류 확인 필요";
}

function getProductionRequestStatusLabel(
  status: string,
) {
  if (status === "REQUESTED") {
    return "상담 신청 접수";
  }

  if (status === "CONTACTED") {
    return "고객 연락 완료";
  }

  if (status === "IN_PROGRESS") {
    return "제작 상담 진행 중";
  }

  if (status === "COMPLETED") {
    return "상담 완료";
  }

  if (status === "CANCELED") {
    return "상담 취소";
  }

  return "상담 상태 확인 필요";
}

function getOrderStatusLabel(
  status: string,
) {
  if (status === "READY") {
    return "결제 준비";
  }

  if (status === "FAILED") {
    return "결제 재시도";
  }

  if (status === "PAID") {
    return "결제 완료";
  }

  if (
    status === "IN_PRODUCTION"
  ) {
    return "인쇄 제작 중";
  }

  if (status === "COMPLETED") {
    return "제작 완료";
  }

  if (status === "CANCELED") {
    return "주문 취소";
  }

  return "주문 상태 확인";
}

function getProductTypeLabel(
  productType: string,
) {
  if (
    productType ===
    "DIGITAL_MANUSCRIPT"
  ) {
    return "디지털 원고";
  }

  if (
    productType ===
    "BASIC_SOFTCOVER"
  ) {
    return "기본 소프트커버";
  }

  if (
    productType ===
    "CUSTOM_BOOK"
  ) {
    return "맞춤 제작";
  }

  return "제작 상품";
}

function getPageCountLabel(
  pageCount:
    | number
    | null
    | undefined,
) {
  if (
    !pageCount ||
    pageCount <= 0
  ) {
    return "분량 미정";
  }

  return `${pageCount.toLocaleString()}쪽`;
}

function getMemoryTypeLabel(
  type: string,
) {
  if (type === "PHOTO") {
    return "사진";
  }

  if (type === "STORY") {
    return "이야기";
  }

  if (type === "TEXT") {
    return "글";
  }

  return "기록";
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

function formatDateTime(
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
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    },
  ).format(date);
}

const adminBookDetailStyles = `
  .admin-book-detail-page,
  .admin-book-detail-page * {
    box-sizing: border-box;
  }

  .admin-book-detail-page {
    min-height: 100vh;
    padding: 28px 24px 60px;
    color: #432f26;
    background:
      radial-gradient(
        circle at 6% 8%,
        rgba(255, 228, 211, 0.52),
        transparent 29rem
      ),
      radial-gradient(
        circle at 95% 10%,
        rgba(230, 243, 229, 0.52),
        transparent 26rem
      ),
      linear-gradient(
        180deg,
        #fffdf9,
        #fff8f2
      );
    font-family:
      var(--font-daldongne-sans),
      "Noto Sans KR",
      sans-serif;
  }

  .admin-book-detail-page a {
    color: inherit;
    text-decoration: none;
  }

  .admin-book-detail-page a,
  .admin-book-detail-page button {
    transition:
      transform 160ms ease,
      box-shadow 160ms ease,
      border-color 160ms ease;
  }

  .admin-book-detail-page a:hover,
  .admin-book-detail-page button:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  .admin-book-detail-page a:focus-visible,
  .admin-book-detail-page button:focus-visible,
  .admin-book-detail-page select:focus-visible {
    outline:
      4px solid
      rgba(239, 105, 83, 0.2);
    outline-offset: 3px;
  }

  .admin-book-detail-shell {
    width: min(1420px, 100%);
    margin: 0 auto;
  }

  .admin-book-detail-hero {
    padding: 30px 34px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    border:
      1px solid
      rgba(136, 94, 74, 0.13);
    border-radius: 26px;
    background:
      linear-gradient(
        135deg,
        rgba(255, 253, 248, 0.98),
        rgba(255, 247, 240, 0.96)
      );
    box-shadow:
      0 19px 46px
      rgba(91, 59, 44, 0.065);
  }

  .admin-book-detail-hero-copy {
    min-width: 0;
  }

  .admin-book-detail-hero-copy > p {
    margin: 0;
    color: #e56852;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.08em;
  }

  .admin-book-detail-badges {
    margin-top: 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .admin-book-detail-badges > span {
    min-height: 25px;
    padding: 0 9px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    color: #8d5f4d;
    background: #ffede7;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-book-detail-hero h1 {
    margin: 9px 0 0;
    overflow-wrap: anywhere;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size:
      clamp(31px, 4vw, 49px);
    line-height: 1.24;
    letter-spacing: -0.055em;
  }

  .admin-book-detail-hero-copy > strong {
    display: block;
    margin-top: 6px;
    color: #6f5b52;
    font-size: 14px;
    line-height: 1.55;
  }

  .admin-book-detail-hero-description {
    display: block;
    margin-top: 9px;
    color: #817068;
    font-size: 11px;
    line-height: 1.7;
  }

  .admin-book-detail-hero-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 7px;
  }

  .admin-book-detail-hero-actions a {
    min-height: 43px;
    padding: 0 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border:
      1px solid #d6b3a3;
    border-radius: 11px;
    color: #755247;
    background: #ffffff;
    font-size: 9px;
    font-weight: 900;
    white-space: nowrap;
  }

  .admin-book-detail-hero-actions a:last-child {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
  }

  .admin-book-detail-book-status,
  .admin-book-detail-request-status,
  .admin-book-detail-order-status {
    min-height: 25px;
    padding: 0 9px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-book-detail-book-status[data-status="DRAFT"] {
    color: #8a5b15;
    background: #fff2ce;
  }

  .admin-book-detail-book-status[data-status="IN_PRODUCTION"] {
    color: #2b628e;
    background: #e8f3ff;
  }

  .admin-book-detail-book-status[data-status="PUBLISHED"] {
    color: #376e42;
    background: #e7f5e8;
  }

  .admin-book-detail-request-status[data-status="REQUESTED"] {
    color: #83540d;
    background: #fff1c7;
  }

  .admin-book-detail-request-status[data-status="CONTACTED"] {
    color: #245d8c;
    background: #e4f2ff;
  }

  .admin-book-detail-request-status[data-status="IN_PROGRESS"] {
    color: #62438a;
    background: #efe6ff;
  }

  .admin-book-detail-request-status[data-status="COMPLETED"] {
    color: #2f6b38;
    background: #e3f4e5;
  }

  .admin-book-detail-request-status[data-status="CANCELED"] {
    color: #776868;
    background: #f2eeee;
  }

  .admin-book-detail-order-status {
    color: #3f668e;
    background: #eaf3ff;
  }

  .admin-book-detail-order-status[data-status="READY"],
  .admin-book-detail-order-status[data-status="FAILED"] {
    color: #b84836;
    background: #ffe8e2;
  }

  .admin-book-detail-order-status[data-status="COMPLETED"] {
    color: #4b713c;
    background: #edf7e8;
  }

  .admin-book-detail-overview {
    margin-top: 16px;
    display: grid;
    grid-template-columns:
      minmax(260px, 0.52fr)
      minmax(0, 1.48fr);
    gap: 16px;
  }

  .admin-book-detail-cover {
    position: relative;
    min-height: 445px;
    overflow: hidden;
    isolation: isolate;
    border:
      1px solid
      rgba(136, 94, 74, 0.14);
    border-radius: 23px;
    color: #ffffff;
    background: #d9c5b5;
    box-shadow:
      0 17px 42px
      rgba(91, 59, 44, 0.075);
  }

  .admin-book-detail-cover > img {
    z-index: -3;
    object-fit: cover;
  }

  .admin-book-detail-cover-shade {
    position: absolute;
    inset: 0;
    z-index: -2;
    background:
      linear-gradient(
        180deg,
        rgba(31, 20, 15, 0.08),
        rgba(31, 20, 15, 0.72)
      );
  }

  .admin-book-detail-cover-empty {
    position: absolute;
    inset: 0;
    z-index: -4;
    display: grid;
    place-content: center;
    justify-items: center;
    gap: 10px;
    color: #8d7569;
    background:
      linear-gradient(
        145deg,
        #f4e9df,
        #dec8b7
      );
  }

  .admin-book-detail-cover-empty svg {
    width: 73px;
    height: 73px;
  }

  .admin-book-detail-cover-empty span {
    max-width: 180px;
    font-size: 10px;
    line-height: 1.6;
    text-align: center;
  }

  .admin-book-detail-cover-copy {
    position: absolute;
    inset:
      auto 25px 28px;
  }

  .admin-book-detail-cover-copy small {
    display: block;
    color:
      rgba(255, 255, 255, 0.78);
    font-size: 8px;
    font-weight: 900;
  }

  .admin-book-detail-cover-copy strong {
    display: block;
    margin-top: 7px;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 25px;
    line-height: 1.35;
    text-shadow:
      0 2px 13px
      rgba(0, 0, 0, 0.34);
  }

  .admin-book-detail-cover-copy span {
    display: block;
    margin-top: 6px;
    color:
      rgba(255, 255, 255, 0.86);
    font-size: 10px;
    line-height: 1.6;
  }

  .admin-book-detail-overview-copy {
    min-width: 0;
    display: grid;
    gap: 12px;
  }

  .admin-book-detail-metrics {
    display: grid;
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    gap: 8px;
  }

  .admin-book-detail-metric {
    min-width: 0;
    padding: 14px;
    border:
      1px solid
      rgba(136, 94, 74, 0.11);
    border-radius: 14px;
    background: #ffffff;
    box-shadow:
      0 8px 20px
      rgba(91, 59, 44, 0.035);
  }

  .admin-book-detail-metric span,
  .admin-book-detail-metric strong {
    display: block;
  }

  .admin-book-detail-metric span {
    color: #8a756a;
    font-size: 8px;
    font-weight: 850;
  }

  .admin-book-detail-metric strong {
    margin-top: 5px;
    overflow: hidden;
    color: #4a352c;
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .admin-book-detail-owner,
  .admin-book-detail-summary,
  .admin-book-detail-panel {
    border:
      1px solid
      rgba(136, 94, 74, 0.13);
    border-radius: 20px;
    background:
      rgba(255, 255, 255, 0.94);
    box-shadow:
      0 13px 32px
      rgba(91, 59, 44, 0.048);
  }

  .admin-book-detail-owner {
    padding: 19px;
    display: grid;
    grid-template-columns:
      minmax(170px, 0.58fr)
      minmax(0, 1.42fr);
    align-items: center;
    gap: 13px;
  }

  .admin-book-detail-owner p,
  .admin-book-detail-summary > p {
    margin: 0;
    color: #e56852;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-book-detail-owner h2,
  .admin-book-detail-summary h2 {
    margin: 5px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 20px;
    line-height: 1.4;
  }

  .admin-book-detail-owner > div:first-child > span {
    display: block;
    margin-top: 4px;
    color: #78645a;
    font-size: 9px;
  }

  .admin-book-detail-owner > div:last-child {
    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
    gap: 7px;
  }

  .admin-book-detail-info-box {
    min-width: 0;
    min-height: 68px;
    padding: 10px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 7px;
    border:
      1px solid
      rgba(139, 97, 75, 0.11);
    border-radius: 11px;
    background: #fffaf6;
  }

  .admin-book-detail-info-box > div:first-child {
    min-width: 0;
  }

  .admin-book-detail-info-box span,
  .admin-book-detail-info-box strong {
    display: block;
  }

  .admin-book-detail-info-box span {
    color: #8b766c;
    font-size: 7px;
    font-weight: 850;
  }

  .admin-book-detail-info-box strong {
    margin-top: 5px;
    overflow: hidden;
    color: #4a352c;
    font-size: 9px;
    line-height: 1.5;
    word-break: break-word;
  }

  .admin-book-detail-info-action {
    flex: 0 0 auto;
  }

  .admin-book-detail-info-action button {
    min-height: 27px !important;
    padding: 0 7px !important;
    border-radius: 7px !important;
    font-size: 7px !important;
  }

  .admin-book-detail-summary {
    padding: 19px;
  }

  .admin-book-detail-summary > div {
    margin-top: 10px;
    padding: 13px;
    border-radius: 12px;
    color: #705d54;
    background: #fff6ef;
    font-size: 10px;
    line-height: 1.75;
    white-space: pre-line;
  }

  .admin-book-detail-main-grid {
    margin-top: 16px;
    display: grid;
    grid-template-columns:
      minmax(0, 1.35fr)
      minmax(330px, 0.65fr);
    align-items: start;
    gap: 16px;
  }

  .admin-book-detail-main-column,
  .admin-book-detail-side-column {
    min-width: 0;
    display: grid;
    gap: 16px;
  }

  .admin-book-detail-panel {
    padding: 21px;
  }

  .admin-book-detail-section-heading p {
    margin: 0;
    color: #e56852;
    font-size: 8px;
    font-weight: 900;
    letter-spacing: 0.07em;
  }

  .admin-book-detail-section-heading h2 {
    margin: 6px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 24px;
    line-height: 1.4;
    letter-spacing: -0.04em;
  }

  .admin-book-detail-section-heading span {
    display: block;
    margin-top: 5px;
    color: #7c6960;
    font-size: 9px;
    line-height: 1.65;
  }

  .admin-book-detail-copy-grid {
    margin-top: 15px;
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .admin-book-detail-copy-grid article {
    padding: 13px;
    border:
      1px solid
      rgba(139, 97, 75, 0.11);
    border-radius: 12px;
    background: #fff7f1;
  }

  .admin-book-detail-copy-grid span {
    color: #8a756a;
    font-size: 7px;
    font-weight: 900;
  }

  .admin-book-detail-copy-grid p {
    margin: 6px 0 0;
    color: #59443a;
    font-size: 10px;
    line-height: 1.7;
    white-space: pre-line;
  }

  .admin-book-detail-content {
    margin-top: 10px;
    padding: 18px;
    border:
      1px solid
      rgba(139, 97, 75, 0.11);
    border-radius: 14px;
    background:
      linear-gradient(
        180deg,
        #fffefb,
        #fff9f5
      );
  }

  .admin-book-detail-content > p {
    margin: 0;
    color: #59473e;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 12px;
    line-height: 2;
    white-space: pre-line;
  }

  .admin-book-detail-content > p + p {
    margin-top: 16px;
  }

  .admin-book-detail-memory-grid {
    margin-top: 15px;
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .admin-book-detail-memory-card {
    min-width: 0;
    overflow: hidden;
    border:
      1px solid
      rgba(139, 97, 75, 0.13);
    border-radius: 14px;
    background: #ffffff;
  }

  .admin-book-detail-memory-image,
  .admin-book-detail-story-icon {
    position: relative;
    min-height: 185px;
    overflow: hidden;
    background: #f1e8e1;
  }

  .admin-book-detail-memory-image img {
    object-fit: cover;
  }

  .admin-book-detail-memory-image > span,
  .admin-book-detail-story-icon > span {
    position: absolute;
    left: 10px;
    bottom: 10px;
    min-height: 24px;
    padding: 0 8px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    color: #ffffff;
    background:
      rgba(53, 37, 29, 0.78);
    font-size: 7px;
    font-weight: 900;
  }

  .admin-book-detail-story-icon {
    display: grid;
    place-items: center;
    color: #d66d57;
    background:
      linear-gradient(
        145deg,
        #fff2e9,
        #f3e7dd
      );
  }

  .admin-book-detail-story-icon svg {
    width: 67px;
    height: 67px;
  }

  .admin-book-detail-memory-copy {
    padding: 12px;
  }

  .admin-book-detail-memory-copy > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .admin-book-detail-memory-copy > div span {
    color: #e36952;
    font-size: 7px;
    font-weight: 900;
  }

  .admin-book-detail-memory-copy small {
    color: #927b70;
    font-size: 7px;
  }

  .admin-book-detail-memory-copy h3 {
    margin: 6px 0 0;
    overflow: hidden;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 14px;
    line-height: 1.45;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .admin-book-detail-memory-copy p {
    margin: 5px 0 0;
    display: -webkit-box;
    overflow: hidden;
    color: #756158;
    font-size: 9px;
    line-height: 1.65;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }

  .admin-book-detail-request-head {
    margin-top: 14px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 9px;
  }

  .admin-book-detail-request-head > div {
    display: grid;
    gap: 3px;
    color: #8c776c;
    font-size: 7px;
    text-align: right;
  }

  .admin-book-detail-request-info {
    margin-top: 10px;
    display: grid;
    gap: 7px;
  }

  .admin-book-detail-request-message {
    margin-top: 10px;
    padding: 12px;
    border-radius: 12px;
    background: #fff6ef;
  }

  .admin-book-detail-request-message span {
    color: #8a756a;
    font-size: 7px;
    font-weight: 900;
  }

  .admin-book-detail-request-message p {
    margin: 6px 0 0;
    color: #715e55;
    font-size: 9px;
    line-height: 1.75;
    white-space: pre-line;
    word-break: break-word;
  }

  .admin-book-detail-status-control {
    margin-top: 10px;
    padding-top: 10px;
    border-top:
      1px solid
      rgba(136, 94, 74, 0.11);
  }

  .admin-book-detail-status-control > span {
    display: block;
    margin-bottom: 7px;
    color: #78645a;
    font-size: 7px;
    font-weight: 900;
  }

  .admin-book-detail-order {
    margin-top: 14px;
  }

  .admin-book-detail-order-head {
    padding: 13px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    border:
      1px solid #dfbd84;
    border-radius: 13px;
    background:
      linear-gradient(
        135deg,
        #fff7e7,
        #fffdf9
      );
  }

  .admin-book-detail-order-head > div {
    min-width: 0;
  }

  .admin-book-detail-order-head h3 {
    margin: 7px 0 0;
    font-size: 14px;
    line-height: 1.45;
  }

  .admin-book-detail-order-head p {
    margin: 4px 0 0;
    color: #78645a;
    font-size: 8px;
    line-height: 1.6;
    white-space: pre-line;
  }

  .admin-book-detail-order-head > span {
    flex: 0 0 auto;
    color: #9d604b;
    font-size: 7px;
    font-weight: 900;
  }

  .admin-book-detail-order-metrics {
    margin-top: 7px;
    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
    gap: 6px;
  }

  .admin-book-detail-order-total,
  .admin-book-detail-order-id {
    margin-top: 7px;
    padding: 11px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    border-radius: 11px;
    color: #ffffff;
    background: #3d2d25;
  }

  .admin-book-detail-order-total span,
  .admin-book-detail-order-id span {
    color:
      rgba(255, 255, 255, 0.68);
    font-size: 7px;
  }

  .admin-book-detail-order-total strong {
    font-size: 15px;
  }

  .admin-book-detail-order-id strong {
    overflow: hidden;
    font-size: 8px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .admin-book-detail-no-order {
    margin-top: 14px;
    padding: 17px;
    border:
      1px dashed #d8b8aa;
    border-radius: 13px;
    background: #fffaf7;
    text-align: center;
  }

  .admin-book-detail-no-order strong {
    display: block;
    font-size: 12px;
  }

  .admin-book-detail-no-order p {
    margin: 6px 0 0;
    color: #806b61;
    font-size: 8px;
    line-height: 1.65;
  }

  .admin-book-detail-no-order a {
    min-height: 36px;
    margin-top: 11px;
    padding: 0 11px;
    display: inline-flex;
    align-items: center;
    border-radius: 9px;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
    font-size: 8px;
    font-weight: 900;
  }

  .admin-book-detail-history {
    margin-top: 14px;
    display: grid;
    gap: 8px;
  }

  .admin-book-detail-history article {
    padding: 11px;
    border:
      1px solid
      rgba(139, 97, 75, 0.11);
    border-radius: 11px;
    background: #fffaf6;
  }

  .admin-book-detail-history article > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 7px;
  }

  .admin-book-detail-history article > div > span:last-child {
    color: #90796e;
    font-size: 7px;
  }

  .admin-book-detail-history strong {
    display: block;
    margin-top: 7px;
    font-size: 10px;
  }

  .admin-book-detail-history p {
    margin: 4px 0 0;
    display: -webkit-box;
    overflow: hidden;
    color: #79655c;
    font-size: 8px;
    line-height: 1.6;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .admin-book-detail-empty {
    margin-top: 14px;
    padding: 22px 15px;
    border:
      1px dashed #d8b8aa;
    border-radius: 12px;
    color: #806b61;
    background: #fffaf7;
    font-size: 9px;
    line-height: 1.7;
    text-align: center;
  }

  @media (max-width: 1120px) {
    .admin-book-detail-overview {
      grid-template-columns:
        minmax(230px, 0.65fr)
        minmax(0, 1.35fr);
    }

    .admin-book-detail-metrics {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .admin-book-detail-owner {
      grid-template-columns: 1fr;
    }

    .admin-book-detail-main-grid {
      grid-template-columns:
        minmax(0, 1fr)
        minmax(300px, 0.72fr);
    }
  }

  @media (max-width: 880px) {
    .admin-book-detail-page {
      padding: 18px 13px 43px;
    }

    .admin-book-detail-hero {
      align-items: stretch;
      flex-direction: column;
      padding: 24px;
      border-radius: 21px;
    }

    .admin-book-detail-hero-actions {
      justify-content: flex-start;
    }

    .admin-book-detail-overview,
    .admin-book-detail-main-grid {
      grid-template-columns: 1fr;
    }

    .admin-book-detail-cover {
      min-height: 520px;
    }

    .admin-book-detail-side-column {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
      align-items: start;
    }

    .admin-book-detail-side-column > section:last-child:nth-child(odd) {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: 680px) {
    .admin-book-detail-cover {
      min-height: 430px;
    }

    .admin-book-detail-owner > div:last-child,
    .admin-book-detail-copy-grid,
    .admin-book-detail-memory-grid,
    .admin-book-detail-side-column {
      grid-template-columns: 1fr;
    }

    .admin-book-detail-side-column > section:last-child:nth-child(odd) {
      grid-column: auto;
    }

    .admin-book-detail-order-metrics {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 430px) {
    .admin-book-detail-metrics {
      grid-template-columns: 1fr;
    }

    .admin-book-detail-hero-actions {
      display: grid;
      grid-template-columns: 1fr;
    }

    .admin-book-detail-hero-actions a {
      width: 100%;
    }

    .admin-book-detail-cover {
      min-height: 390px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .admin-book-detail-page a,
    .admin-book-detail-page button {
      transition: none;
    }
  }
`;
