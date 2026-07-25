import { auth } from '@/auth';
import BookProductionRequestButton from '@/components/library/BookProductionRequestButton';
import DeleteBookButton from '@/components/library/DeleteBookButton';
import EditBookDraftButton from '@/components/library/EditBookDraftButton';
import BookRevisionHistoryButton from '@/components/library/BookRevisionHistoryButton';
import RefreshBookDraftButton from '@/components/library/RefreshBookDraftButton';
import DeleteMemoryButton from '@/components/memory/DeleteMemoryButton';
import EditMemoryButton from '@/components/memory/EditMemoryButton';
import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import {
  notFound,
  redirect,
} from 'next/navigation';
import type { CSSProperties } from 'react';

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type MemoryRecord =
  Record<string, unknown>;

type ParsedBookBlock = {
  type:
    | 'title'
    | 'heading'
    | 'numbered'
    | 'paragraph';
  text: string;
};

export default async function BookDetailPage({
  params,
}: PageProps) {
  const { id } = await params;

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect('/login');
  }

  const book =
    await prisma.book.findFirst({
      where: {
        id,
        authorId: userId,
      },
    });

  if (!book) {
    notFound();
  }

  const [
    productionRequest,
    linkedBookMemories,
  ] = await Promise.all([
    
       (async () => {
      const activeRequest =
        await prisma.bookProductionRequest.findFirst({
          where: {
            bookId: book.id,
            authorId: userId,
            status: {
              in: [
                'REQUESTED',
                'CONTACTED',
                'IN_PROGRESS',
              ],
            },
          },
          orderBy: [
            {
              updatedAt: 'desc',
            },
            {
              createdAt: 'desc',
            },
          ],
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
        });

      if (activeRequest) {
        return activeRequest;
      }

      return prisma.bookProductionRequest.findFirst({
        where: {
          bookId: book.id,
          authorId: userId,
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
      });
    })(),

    prisma.bookMemory.findMany({
      where: {
        bookId: book.id,
        memory: {
          authorId: userId,
        },
      },
      orderBy: {
        order: 'asc',
      },
      select: {
        memory: true,
      },
    }),
  ]);

  const linkedMemories =
    linkedBookMemories.map(
      (item) => item.memory,
    ) as unknown as MemoryRecord[];

  const fallbackMemories =
    linkedMemories.length > 0
      ? []
      : await prisma.memory.findMany({
          where: {
            authorId: userId,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 50,
        });

  const allMemories =
    linkedMemories.length > 0
      ? linkedMemories
      : (fallbackMemories as unknown as MemoryRecord[]);

    const photoMemories =
    allMemories.filter(
      isPhotoMemory,
    );

  const photos =
    photoMemories.slice(0, 8);

  const allPhotoStories =
    photoMemories.filter(
      hasStoryDescription,
    );

  const photoStories =
    allPhotoStories.slice(0, 8);

  const storyMemories =
    allMemories.filter(
      isStoryMemory,
    );

  const stories =
    storyMemories.slice(0, 8);

  const selectedMemoryIdsForRefresh =
    allMemories
      .map((memory) =>
        typeof memory.id === 'string'
          ? memory.id
          : '',
      )
      .filter(
        (memoryId) =>
          memoryId.length > 0,
      );

  const bookRecord =
    book as unknown as MemoryRecord;

  const content = cleanText(
    bookRecord.content,
  );

  const parsedContent =
    parseBookContent(content);

  const coverText =
    cleanText(bookRecord.coverText) ||
    '사진 한 장에 멈춰 있던 시간이, 이제 한 권의 이야기로 다시 피어납니다.';

  const summary =
    cleanText(bookRecord.summary) ||
    '사진과 이야기를 바탕으로 정리한 책 원고 초안입니다.';

    const displayedPhotoCount =
    book.basedPhotoCount ??
    photoMemories.length;

  const displayedStoryCount =
    book.basedStoryCount ??
    storyMemories.length +
      allPhotoStories.length;
  const coverMemoryId =
    photos.length > 0 &&
    typeof photos[0]?.id === "string"
      ? photos[0].id
      : "";

  const order =
    productionRequest?.bookOrder || null;

  const paymentAvailable =
    Boolean(order) &&
    ["READY", "FAILED"].includes(
      String(order?.status),
    );

  const paymentCompleted =
    Boolean(order) &&
    [
      "PAID",
      "IN_PRODUCTION",
      "COMPLETED",
    ].includes(
      String(order?.status),
    );

  return (
    <main className="book-detail-reference-page">
      <style>{bookDetailReferenceStyles}</style>

      <div className="book-detail-reference-shell">
        <nav
          className="book-detail-reference-breadcrumb"
          aria-label="책 상세 위치"
        >
          <Link href="/dashboard">
            작업실
          </Link>

          <span aria-hidden="true">›</span>

          <Link href="/dashboard/library">
            내 책장
          </Link>

          <span aria-hidden="true">›</span>

          <strong>{book.title}</strong>
        </nav>

        <section className="book-detail-reference-hero">
          <div className="book-detail-reference-cover-column">
            <div className="book-detail-reference-cover">
              {coverMemoryId ? (
                <Image
                  src={`/api/blob/${coverMemoryId}`}
                  alt={`${book.title} 표지 사진`}
                  fill
                  unoptimized
                  priority
                  sizes="(max-width: 760px) 78vw, 330px"
                />
              ) : (
                <Image
                  src="/dashboard/book-detail-reference-v1/sample-detail-cover.webp"
                  alt="달동네 스토리북 예시 표지"
                  fill
                  priority
                  sizes="(max-width: 760px) 78vw, 330px"
                />
              )}

              <div className="book-detail-reference-cover-overlay">
                <span>
                  {getBookTypeLabel(
                    String(book.type),
                  )}
                </span>

                <h2>{book.title}</h2>

                <p>
                  {book.subtitle ||
                    "사진과 이야기로 엮은 우리들의 기록"}
                </p>

                <small>
                  달동네 스토리북
                </small>
              </div>
            </div>

            <div className="book-detail-reference-cover-links">
              <Link
                href={`/dashboard/library/${book.id}/ebook`}
              >
                전자책 보기
              </Link>

              <Link
                href={`/dashboard/library/${book.id}/print`}
              >
                인쇄용 원고
              </Link>
            </div>
          </div>

          <div className="book-detail-reference-main-copy">
            <div className="book-detail-reference-badges">
              <span data-tone="coral">
                {getBookTypeLabel(
                  String(book.type),
                )}
              </span>

              <span data-tone="cream">
                {getStatusLabel(
                  String(book.status),
                )}
              </span>

              <span data-tone="mint">
                {productionRequest
                  ? getProductionRequestStatusLabel(
                      String(
                        productionRequest.status,
                      ),
                    )
                  : "제작 미신청"}
              </span>

              {order ? (
                <span
                  data-tone={
                    paymentAvailable
                      ? "yellow"
                      : paymentCompleted
                        ? "blue"
                        : "gray"
                  }
                >
                  {getBookOrderStatusLabel(
                    String(order.status),
                  )}
                </span>
              ) : null}
            </div>

            <p className="book-detail-reference-kicker">
              나의 책 상세 보기
            </p>

            <h1>{book.title}</h1>

            {book.subtitle ? (
              <p className="book-detail-reference-subtitle">
                {book.subtitle}
              </p>
            ) : null}

            <p className="book-detail-reference-summary">
              {summary}
            </p>

            <div className="book-detail-reference-date">
              <span>
                만든 날{" "}
                {formatDate(book.createdAt)}
              </span>

              <i aria-hidden="true">·</i>

              <span>
                마지막 정리{" "}
                {formatDate(book.updatedAt)}
              </span>
            </div>

            <div className="book-detail-reference-info-grid">
              <DetailInfo
                label="예상 분량"
                value={getPageCountLabel(
                  book.pageCount,
                )}
              />

              <DetailInfo
                label="사용 사진"
                value={`${displayedPhotoCount}장`}
              />

              <DetailInfo
                label="사용 이야기"
                value={`${displayedStoryCount}개`}
              />

              <DetailInfo
                label="연결 자료"
                value={
                  linkedMemories.length > 0
                    ? `${linkedMemories.length}개`
                    : "이전 방식"
                }
              />
            </div>

            <div className="book-detail-reference-actions">
              {String(book.status) !==
              "PUBLISHED" ? (
                <EditBookDraftButton
                  bookId={book.id}
                  initialTitle={book.title}
                  initialSubtitle={
                    book.subtitle
                  }
                  initialSummary={summary}
                  initialCoverText={
                    coverText
                  }
                  initialContent={content}
                />
              ) : null}

              {String(book.status) !==
              "PUBLISHED" ? (
                <BookRevisionHistoryButton
                  bookId={book.id}
                />
              ) : null}

              <RefreshBookDraftButton
                bookId={book.id}
                selectedMemoryIds={
                  selectedMemoryIdsForRefresh
                }
              />

              <BookProductionRequestButton
                bookId={book.id}
                defaultName={
                  productionRequest?.name ||
                  cleanText(
                    session.user.name,
                  )
                }
                defaultPhone={
                  productionRequest?.phone ||
                  ""
                }
                defaultEmail={
                  productionRequest?.email ||
                  cleanText(
                    session.user.email,
                  )
                }
                defaultMessage={
                  productionRequest?.message ||
                  ""
                }
                existingRequestId={
                  productionRequest
                    ? String(
                        productionRequest.id,
                      )
                    : null
                }
                existingStatus={
                  productionRequest
                    ? String(
                        productionRequest.status,
                      )
                    : null
                }
              />

              <DeleteBookButton
                bookId={book.id}
                redirectTo="/dashboard/library"
              />
            </div>
          </div>
        </section>

        <section className="book-detail-reference-status-grid">
          <article className="book-detail-reference-intro-card">
            <p>표지 문구</p>

            <h2>
              이 책이 전하고 싶은 마음
            </h2>

            <blockquote>
              {coverText}
            </blockquote>

            <div
              data-connected={
                linkedMemories.length > 0
                  ? "true"
                  : "false"
              }
            >
              <span aria-hidden="true">
                {linkedMemories.length > 0
                  ? "✓"
                  : "i"}
              </span>

              <p>
                {linkedMemories.length > 0
                  ? "원고를 만들 때 선택한 사진과 이야기가 이 책에 연결되어 있습니다."
                  : "이전 방식으로 만든 책입니다. 원고 다시 정리하기를 실행하면 현재 자료가 다시 연결됩니다."}
              </p>
            </div>
          </article>

          <article className="book-detail-reference-production-card">
            <div className="book-detail-reference-section-title">
              <p>제작·주문 상태</p>

              <h2>
                {order
                  ? "제작 견적과 결제 상태"
                  : productionRequest
                    ? "제작 상담이 진행 중입니다"
                    : "아직 제작 신청 전입니다"}
              </h2>
            </div>

            {productionRequest ? (
              <>
                <div className="book-detail-reference-request-meta">
                  <DetailInfo
                    label="신청자"
                    value={
                      productionRequest.name ||
                      "이름 미입력"
                    }
                  />

                  <DetailInfo
                    label="연락처"
                    value={
                      productionRequest.phone ||
                      "연락처 미입력"
                    }
                  />

                  <DetailInfo
                    label="이메일"
                    value={
                      productionRequest.email ||
                      "이메일 미입력"
                    }
                  />
                </div>

                {productionRequest.message ? (
                  <div className="book-detail-reference-request-message">
                    <strong>
                      제작 요청사항
                    </strong>

                    <p>
                      {productionRequest.message}
                    </p>
                  </div>
                ) : null}

                {order ? (
                  <div className="book-detail-reference-order-box">
                    <div className="book-detail-reference-order-head">
                      <div>
                        <span>
                          {order.productName}
                        </span>

                        <strong>
                          {getBookOrderStatusLabel(
                            String(
                              order.status,
                            ),
                          )}
                        </strong>
                      </div>

                      <b>
                        {order.totalAmount.toLocaleString()}
                        원
                      </b>
                    </div>

                    <div className="book-detail-reference-order-prices">
                      <PriceInfo
                        label="제작 수량"
                        value={`${order.quantity.toLocaleString()}권`}
                      />

                      <PriceInfo
                        label="상품 금액"
                        value={`${order.productAmount.toLocaleString()}원`}
                      />

                      <PriceInfo
                        label="배송비"
                        value={`${order.shippingFee.toLocaleString()}원`}
                      />
                    </div>

                    {order.specification ? (
                      <div className="book-detail-reference-specification">
                        <strong>
                          제작 사양
                        </strong>

                        <p>
                          {order.specification}
                        </p>
                      </div>
                    ) : null}

                    <div className="book-detail-reference-order-number">
                      <span>
                        주문번호
                      </span>

                      <strong>
                        {order.orderId}
                      </strong>
                    </div>

                    {paymentAvailable ? (
                      <Link
                        href={`/dashboard/library/${book.id}/checkout`}
                        className="book-detail-reference-checkout-link"
                      >
                        검토·결제 화면으로 이동
                        <span aria-hidden="true">
                          →
                        </span>
                      </Link>
                    ) : null}
                  </div>
                ) : (
                  <div className="book-detail-reference-waiting-box">
                    <strong>
                      관리자 검토와 견적을
                      기다리고 있습니다.
                    </strong>

                    <p>
                      신청일{" "}
                      {formatDate(
                        productionRequest.createdAt,
                      )}
                      {" · "}
                      최근 변경{" "}
                      {formatDate(
                        productionRequest.updatedAt,
                      )}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="book-detail-reference-no-request">
                <span aria-hidden="true">
                  4
                </span>

                <div>
                  <strong>
                    책 원고를 확인한 뒤
                    제작 상담을 신청하세요.
                  </strong>

                  <p>
                    관리자가 원고와 제작 사양을
                    검토한 후 연락하고 견적을
                    등록합니다.
                  </p>
                </div>
              </div>
            )}
          </article>
        </section>

        <section className="book-detail-reference-manuscript">
          <div className="book-detail-reference-section-head">
            <div>
              <p>책 원고 미리보기</p>

              <h2>
                한 권의 책처럼 읽히는
                원고
              </h2>

              <span>
                표지와 본문을 확인하고,
                필요한 부분은 상단의 원고
                수정 기능으로 고칠 수 있습니다.
              </span>
            </div>

            <div>
              <Link
                href={`/dashboard/library/${book.id}/ebook`}
              >
                전자책으로 읽기
              </Link>

              <Link
                href={`/dashboard/library/${book.id}/print`}
              >
                인쇄용 원고 보기
              </Link>
            </div>
          </div>

          <div className="book-detail-reference-content-wrap">
            <BookContentPreview
              blocks={parsedContent}
            />
          </div>
        </section>

        <section className="book-detail-reference-photos">
          <div className="book-detail-reference-section-head">
            <div>
              <p>이 책에 들어간 사진</p>

              <h2>
                사진에서 시작된 기억
              </h2>

              <span>
                현재 화면에는 최대 8장까지
                표시합니다. 전체 연결 사진은{" "}
                {photoMemories.length}장입니다.
              </span>
            </div>

            <Link href="/dashboard/timeline">
              사진 더 모으기
            </Link>
          </div>

          {photos.length > 0 ? (
            <div className="book-detail-reference-photo-grid">
              {photos.map(
                (photo, index) => (
                  <PhotoCard
                    key={String(
                      photo.id ?? index,
                    )}
                    photo={photo}
                  />
                ),
              )}
            </div>
          ) : (
            <EmptyBox text="아직 이 책에 연결된 사진이 없습니다." />
          )}
        </section>

        <section className="book-detail-reference-story-grid">
          <article>
            <div className="book-detail-reference-section-head">
              <div>
                <p>사진에 붙인 이야기</p>

                <h2>
                  사진 한 장에 담긴
                  기억
                </h2>

                <span>
                  사진의 제목과 설명으로
                  남긴 이야기입니다.
                </span>
              </div>
            </div>

            {photoStories.length > 0 ? (
              <div className="book-detail-reference-story-list">
                {photoStories.map(
                  (story, index) => (
                    <PhotoStoryCard
                      key={String(
                        story.id ?? index,
                      )}
                      story={story}
                    />
                  ),
                )}
              </div>
            ) : (
              <EmptyBox text="아직 사진에 붙인 이야기가 없습니다." />
            )}
          </article>

          <article>
            <div className="book-detail-reference-section-head">
              <div>
                <p>직접 남긴 이야기</p>

                <h2>
                  글로 남긴 우리들의
                  시간
                </h2>

                <span>
                  이야기 쓰기 화면에서
                  직접 작성한 기록입니다.
                </span>
              </div>

              <Link href="/dashboard/interview">
                이야기 더 남기기
              </Link>
            </div>

            {stories.length > 0 ? (
              <div className="book-detail-reference-story-list">
                {stories.map(
                  (story, index) => (
                    <StoryCard
                      key={String(
                        story.id ?? index,
                      )}
                      story={story}
                    />
                  ),
                )}
              </div>
            ) : (
              <EmptyBox text="아직 이 책에 연결된 이야기가 없습니다." />
            )}
          </article>
        </section>

        <section className="book-detail-reference-next">
          <div>
            <p>다음 작업</p>

            <h2>
              사진과 이야기를 보완하면
              원고를 더 풍부하게 만들 수
              있습니다.
            </h2>

            <span>
              자료를 추가한 뒤 상단의
              원고 다시 정리하기 기능을
              사용하세요.
            </span>
          </div>

          <div>
            <Link href="/dashboard/timeline">
              사진 더 모으기
            </Link>

            <Link href="/dashboard/interview">
              이야기 더 남기기
            </Link>

            <Link href="/dashboard/library">
              내 책장으로
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function DetailInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="book-detail-reference-info">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PriceInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="book-detail-reference-price">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

const bookDetailReferenceStyles = `
  .book-detail-reference-page,
  .book-detail-reference-page * {
    box-sizing: border-box;
  }

  .book-detail-reference-page {
    min-height: 100vh;
    padding: 24px 24px 56px;
    color: #432f26;
    background:
      radial-gradient(
        circle at 7% 8%,
        rgba(255, 230, 213, 0.56),
        transparent 28rem
      ),
      radial-gradient(
        circle at 95% 12%,
        rgba(231, 244, 229, 0.56),
        transparent 25rem
      ),
      linear-gradient(
        180deg,
        #fffdf9,
        #fff9f3
      );
    font-family:
      var(--font-daldongne-sans),
      "Noto Sans KR",
      sans-serif;
  }

  .book-detail-reference-page a {
    color: inherit;
    text-decoration: none;
  }

  .book-detail-reference-page a,
  .book-detail-reference-page button {
    transition:
      transform 160ms ease,
      box-shadow 160ms ease,
      border-color 160ms ease;
  }

  .book-detail-reference-page a:hover,
  .book-detail-reference-page button:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  .book-detail-reference-page a:focus-visible,
  .book-detail-reference-page button:focus-visible,
  .book-detail-reference-page input:focus-visible,
  .book-detail-reference-page textarea:focus-visible {
    outline:
      4px solid
      rgba(239, 105, 83, 0.2);
    outline-offset: 3px;
  }

  .book-detail-reference-shell {
    width: min(1380px, 100%);
    margin: 0 auto;
  }

  .book-detail-reference-breadcrumb {
    min-height: 40px;
    padding: 0 6px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #8d7469;
    font-size: 11px;
  }

  .book-detail-reference-breadcrumb strong {
    max-width: 420px;
    overflow: hidden;
    color: #4b382f;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .book-detail-reference-hero {
    padding: 28px;
    display: grid;
    grid-template-columns:
      minmax(280px, 0.72fr)
      minmax(0, 1.28fr);
    gap: 34px;
    border:
      1px solid
      rgba(136, 94, 74, 0.13);
    border-radius: 30px;
    background:
      linear-gradient(
        135deg,
        rgba(255, 253, 248, 0.97),
        rgba(255, 247, 240, 0.97)
      );
    box-shadow:
      0 22px 52px
      rgba(91, 59, 44, 0.075);
  }

  .book-detail-reference-cover-column {
    min-width: 0;
  }

  .book-detail-reference-cover {
    position: relative;
    width: min(350px, 100%);
    aspect-ratio: 0.73 / 1;
    margin: 0 auto;
    overflow: hidden;
    border:
      8px solid
      rgba(255, 255, 255, 0.96);
    border-radius: 10px;
    background: #e9dfd4;
    box-shadow:
      0 20px 38px
      rgba(63, 41, 31, 0.2);
  }

  .book-detail-reference-cover img {
    object-fit: cover;
  }

  .book-detail-reference-cover-overlay {
    position: absolute;
    inset: 0;
    z-index: 2;
    padding: 34px 27px;
    display: flex;
    align-items: center;
    flex-direction: column;
    color: #49372e;
    background:
      linear-gradient(
        180deg,
        rgba(255, 251, 243, 0.9),
        rgba(255, 250, 240, 0.5) 39%,
        rgba(29, 18, 13, 0.05) 63%,
        rgba(29, 18, 13, 0.55)
      );
    text-align: center;
  }

  .book-detail-reference-cover-overlay > span {
    color: #d9634d;
    font-size: 10px;
    font-weight: 900;
  }

  .book-detail-reference-cover-overlay h2 {
    margin: 15px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size:
      clamp(26px, 3vw, 39px);
    line-height: 1.35;
    letter-spacing: -0.05em;
    word-break: keep-all;
  }

  .book-detail-reference-cover-overlay p {
    margin: 12px 0 0;
    color: #735d51;
    font-size: 11px;
    line-height: 1.7;
  }

  .book-detail-reference-cover-overlay small {
    margin-top: auto;
    color: #ffffff;
    font-size: 10px;
    font-weight: 900;
    text-shadow:
      0 2px 8px
      rgba(0, 0, 0, 0.5);
  }

  .book-detail-reference-cover-links {
    width: min(350px, 100%);
    margin: 14px auto 0;
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .book-detail-reference-cover-links a {
    min-height: 43px;
    display: flex;
    align-items: center;
    justify-content: center;
    border:
      1px solid #d6b3a3;
    border-radius: 12px;
    color: #755247;
    background: #ffffff;
    font-size: 10px;
    font-weight: 900;
  }

  .book-detail-reference-main-copy {
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .book-detail-reference-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .book-detail-reference-badges > span {
    min-height: 27px;
    padding: 0 9px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    font-size: 9px;
    font-weight: 900;
  }

  .book-detail-reference-badges
  > span[data-tone="coral"] {
    color: #b44837;
    background: #ffe7df;
  }

  .book-detail-reference-badges
  > span[data-tone="cream"] {
    color: #845d20;
    background: #fff1cf;
  }

  .book-detail-reference-badges
  > span[data-tone="mint"] {
    color: #34705b;
    background: #e7f5ee;
  }

  .book-detail-reference-badges
  > span[data-tone="yellow"] {
    color: #7d5a14;
    background: #fff4bd;
  }

  .book-detail-reference-badges
  > span[data-tone="blue"] {
    color: #3d658b;
    background: #e9f3ff;
  }

  .book-detail-reference-badges
  > span[data-tone="gray"] {
    color: #756b66;
    background: #efebe8;
  }

  .book-detail-reference-kicker {
    margin: 25px 0 0;
    color: #e56852;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.07em;
  }

  .book-detail-reference-main-copy h1 {
    margin: 8px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size:
      clamp(40px, 5vw, 61px);
    line-height: 1.18;
    letter-spacing: -0.06em;
    word-break: keep-all;
  }

  .book-detail-reference-subtitle {
    margin: 12px 0 0;
    color: #725d53;
    font-size: 17px;
    line-height: 1.7;
  }

  .book-detail-reference-summary {
    max-width: 760px;
    margin: 18px 0 0;
    color: #68554c;
    font-size: 14px;
    line-height: 1.9;
    word-break: keep-all;
  }

  .book-detail-reference-date {
    margin-top: 14px;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    color: #9a8378;
    font-size: 10px;
  }

  .book-detail-reference-date i {
    font-style: normal;
  }

  .book-detail-reference-info-grid {
    margin-top: 19px;
    display: grid;
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    gap: 9px;
  }

  .book-detail-reference-info {
    min-width: 0;
    padding: 13px;
    border:
      1px solid
      rgba(139, 97, 75, 0.12);
    border-radius: 14px;
    background: #fffaf6;
  }

  .book-detail-reference-info span,
  .book-detail-reference-info strong {
    display: block;
  }

  .book-detail-reference-info span {
    color: #8c776d;
    font-size: 8px;
    font-weight: 850;
  }

  .book-detail-reference-info strong {
    margin-top: 5px;
    overflow: hidden;
    color: #4a352c;
    font-size: 13px;
    line-height: 1.45;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .book-detail-reference-actions {
    margin-top: auto;
    padding-top: 21px;
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  .book-detail-reference-actions button,
  .book-detail-reference-actions a {
    min-height: 42px !important;
    padding: 0 13px !important;
    border-radius: 11px !important;
    font-size: 10px !important;
    font-weight: 900 !important;
  }

  .book-detail-reference-actions button:first-child {
    border-color: transparent !important;
    color: #ffffff !important;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      ) !important;
  }

  .book-detail-reference-status-grid {
    margin-top: 17px;
    display: grid;
    grid-template-columns:
      minmax(0, 0.78fr)
      minmax(430px, 1.22fr);
    gap: 17px;
  }

  .book-detail-reference-intro-card,
  .book-detail-reference-production-card,
  .book-detail-reference-manuscript,
  .book-detail-reference-photos,
  .book-detail-reference-story-grid > article,
  .book-detail-reference-next {
    min-width: 0;
    padding: 25px;
    border:
      1px solid
      rgba(136, 94, 74, 0.13);
    border-radius: 24px;
    background:
      rgba(255, 255, 255, 0.92);
    box-shadow:
      0 15px 36px
      rgba(91, 59, 44, 0.055);
  }

  .book-detail-reference-intro-card > p,
  .book-detail-reference-section-title > p,
  .book-detail-reference-section-head p,
  .book-detail-reference-next > div:first-child > p {
    margin: 0;
    color: #e56852;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.07em;
  }

  .book-detail-reference-intro-card h2,
  .book-detail-reference-section-title h2,
  .book-detail-reference-section-head h2,
  .book-detail-reference-next h2 {
    margin: 7px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 25px;
    line-height: 1.42;
    letter-spacing: -0.045em;
  }

  .book-detail-reference-intro-card blockquote {
    margin: 17px 0 0;
    padding: 19px;
    border-left:
      4px solid #ef725b;
    border-radius: 0 14px 14px 0;
    color: #5d493f;
    background: #fff6ef;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 15px;
    line-height: 1.9;
  }

  .book-detail-reference-intro-card
  > div {
    margin-top: 17px;
    padding: 13px;
    display: flex;
    align-items: flex-start;
    gap: 9px;
    border-radius: 13px;
    color: #6f704b;
    background: #f4f7e9;
  }

  .book-detail-reference-intro-card
  > div[data-connected="false"] {
    color: #80613e;
    background: #fff5e5;
  }

  .book-detail-reference-intro-card
  > div > span {
    width: 24px;
    height: 24px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border:
      1px solid currentColor;
    border-radius: 50%;
    font-size: 11px;
    font-weight: 900;
  }

  .book-detail-reference-intro-card
  > div > p {
    margin: 0;
    font-size: 10px;
    line-height: 1.7;
  }

  .book-detail-reference-request-meta {
    margin-top: 16px;
    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .book-detail-reference-request-message {
    margin-top: 11px;
    padding: 13px;
    border-radius: 13px;
    background: #fffaf6;
  }

  .book-detail-reference-request-message strong {
    font-size: 9px;
  }

  .book-detail-reference-request-message p {
    margin: 6px 0 0;
    color: #715e55;
    font-size: 10px;
    line-height: 1.7;
    white-space: pre-line;
  }

  .book-detail-reference-order-box {
    margin-top: 14px;
    padding: 16px;
    border:
      1px solid #dfbd84;
    border-radius: 16px;
    background:
      linear-gradient(
        135deg,
        #fff7e7,
        #fffdf8
      );
  }

  .book-detail-reference-order-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 13px;
  }

  .book-detail-reference-order-head span,
  .book-detail-reference-order-head strong {
    display: block;
  }

  .book-detail-reference-order-head span {
    color: #725b4f;
    font-size: 10px;
  }

  .book-detail-reference-order-head strong {
    margin-top: 4px;
    color: #d85f48;
    font-size: 13px;
  }

  .book-detail-reference-order-head b {
    color: #e45f49;
    font-size: 23px;
    white-space: nowrap;
  }

  .book-detail-reference-order-prices {
    margin-top: 13px;
    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .book-detail-reference-price {
    padding: 11px;
    border-radius: 11px;
    background: #ffffff;
  }

  .book-detail-reference-price span,
  .book-detail-reference-price strong {
    display: block;
  }

  .book-detail-reference-price span {
    color: #8b756a;
    font-size: 8px;
  }

  .book-detail-reference-price strong {
    margin-top: 4px;
    font-size: 12px;
  }

  .book-detail-reference-specification {
    margin-top: 11px;
    padding: 12px;
    border-radius: 11px;
    background: #fffdf9;
  }

  .book-detail-reference-specification strong {
    font-size: 9px;
  }

  .book-detail-reference-specification p {
    margin: 5px 0 0;
    color: #725e54;
    font-size: 9px;
    line-height: 1.65;
    white-space: pre-line;
  }

  .book-detail-reference-order-number {
    margin-top: 11px;
    padding: 11px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 9px;
    border-radius: 11px;
    color: #ffffff;
    background: #3d2d25;
  }

  .book-detail-reference-order-number span {
    color: rgba(255, 255, 255, 0.7);
    font-size: 8px;
  }

  .book-detail-reference-order-number strong {
    overflow: hidden;
    font-size: 9px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .book-detail-reference-checkout-link {
    min-height: 46px;
    margin-top: 11px;
    padding: 0 15px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-radius: 12px;
    color: #ffffff !important;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
    font-size: 11px;
    font-weight: 900;
  }

  .book-detail-reference-waiting-box,
  .book-detail-reference-no-request {
    margin-top: 16px;
    padding: 16px;
    border:
      1px dashed #dcb19e;
    border-radius: 15px;
    background: #fff8f3;
  }

  .book-detail-reference-waiting-box strong {
    font-size: 13px;
  }

  .book-detail-reference-waiting-box p {
    margin: 6px 0 0;
    color: #7b685f;
    font-size: 9px;
  }

  .book-detail-reference-no-request {
    display: flex;
    align-items: center;
    gap: 13px;
  }

  .book-detail-reference-no-request > span {
    width: 45px;
    height: 45px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border-radius: 50%;
    color: #ffffff;
    background: #ed6e57;
    font-size: 18px;
    font-weight: 900;
  }

  .book-detail-reference-no-request strong {
    font-size: 13px;
  }

  .book-detail-reference-no-request p {
    margin: 5px 0 0;
    color: #766158;
    font-size: 10px;
    line-height: 1.65;
  }

  .book-detail-reference-manuscript,
  .book-detail-reference-photos {
    margin-top: 17px;
  }

  .book-detail-reference-section-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
  }

  .book-detail-reference-section-head
  div:first-child > span {
    display: block;
    margin-top: 6px;
    color: #7a675e;
    font-size: 10px;
    line-height: 1.65;
  }

  .book-detail-reference-section-head
  > div:last-child {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  .book-detail-reference-section-head
  a {
    min-height: 40px;
    padding: 0 13px;
    display: inline-flex;
    align-items: center;
    flex: 0 0 auto;
    border:
      1px solid #d6b3a3;
    border-radius: 11px;
    color: #755247;
    background: #ffffff;
    font-size: 10px;
    font-weight: 900;
  }

  .book-detail-reference-content-wrap {
    margin-top: 18px;
  }

  .book-detail-reference-content-wrap
  .book-content-paper {
    padding: 38px 42px !important;
    border:
      1px solid
      rgba(139, 97, 75, 0.15) !important;
    border-radius: 20px !important;
    background:
      linear-gradient(
        180deg,
        #fffdf9,
        #fffaf6
      ) !important;
    box-shadow:
      inset 0 0 0 1px
      rgba(255, 255, 255, 0.7);
  }

  .book-detail-reference-photo-grid {
    margin-top: 18px;
    display: grid;
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    gap: 13px;
  }

  .book-detail-reference-photo-grid
  > article {
    border:
      1px solid
      rgba(139, 97, 75, 0.14) !important;
    border-radius: 17px !important;
    background: #ffffff !important;
    box-shadow:
      0 10px 24px
      rgba(82, 52, 39, 0.05);
  }

  .book-detail-reference-photo-grid
  > article > div:first-child {
    height: 190px !important;
    background: #f3ece7 !important;
  }

  .book-detail-reference-photo-grid
  img {
    object-fit: contain !important;
  }

  .book-detail-reference-story-grid {
    margin-top: 17px;
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 17px;
  }

  .book-detail-reference-story-list {
    margin-top: 17px;
    display: grid;
    gap: 10px;
  }

  .book-detail-reference-story-list
  .photo-story-card {
    grid-template-columns:
      125px minmax(0, 1fr) !important;
    border:
      1px solid
      rgba(139, 97, 75, 0.14) !important;
    border-radius: 16px !important;
    background: #fffaf6 !important;
  }

  .book-detail-reference-story-list
  .photo-story-image {
    min-height: 132px !important;
    background: #f0e8e2 !important;
  }

  .book-detail-reference-story-list
  .photo-story-content {
    padding: 15px !important;
  }

  .book-detail-reference-story-list
  > article:not(.photo-story-card) {
    padding: 15px !important;
    border:
      1px solid
      rgba(139, 97, 75, 0.14) !important;
    border-radius: 15px !important;
    background: #fffaf6 !important;
  }

  .book-detail-reference-next {
    margin-top: 17px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    background:
      linear-gradient(
        135deg,
        #fff5e9,
        #f1f8ee
      );
  }

  .book-detail-reference-next
  > div:first-child > span {
    display: block;
    margin-top: 6px;
    color: #756158;
    font-size: 10px;
    line-height: 1.65;
  }

  .book-detail-reference-next
  > div:last-child {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 7px;
  }

  .book-detail-reference-next a {
    min-height: 42px;
    padding: 0 14px;
    display: inline-flex;
    align-items: center;
    border:
      1px solid #d4b2a2;
    border-radius: 11px;
    color: #755247;
    background: #ffffff;
    font-size: 10px;
    font-weight: 900;
  }

  .book-detail-reference-next
  a:last-child {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
  }

  @media (max-width: 1050px) {
    .book-detail-reference-hero {
      grid-template-columns:
        minmax(250px, 0.68fr)
        minmax(0, 1.32fr);
    }

    .book-detail-reference-info-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .book-detail-reference-status-grid {
      grid-template-columns: 1fr;
    }

    .book-detail-reference-photo-grid {
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 780px) {
    .book-detail-reference-page {
      padding: 18px 13px 40px;
    }

    .book-detail-reference-hero {
      padding: 20px;
      grid-template-columns: 1fr;
      border-radius: 23px;
    }

    .book-detail-reference-cover {
      width: min(390px, 82vw);
    }

    .book-detail-reference-main-copy {
      text-align: left;
    }

    .book-detail-reference-photo-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .book-detail-reference-story-grid {
      grid-template-columns: 1fr;
    }

    .book-detail-reference-next {
      align-items: stretch;
      flex-direction: column;
    }

    .book-detail-reference-next
    > div:last-child {
      justify-content: flex-start;
    }
  }

  @media (max-width: 520px) {
    .book-detail-reference-breadcrumb {
      overflow-x: auto;
      white-space: nowrap;
    }

    .book-detail-reference-main-copy h1 {
      font-size: 37px;
    }

    .book-detail-reference-cover-links {
      grid-template-columns: 1fr;
    }

    .book-detail-reference-info-grid,
    .book-detail-reference-request-meta,
    .book-detail-reference-order-prices {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .book-detail-reference-actions {
      display: grid;
      grid-template-columns: 1fr;
    }

    .book-detail-reference-actions > * {
      width: 100%;
    }

    .book-detail-reference-intro-card,
    .book-detail-reference-production-card,
    .book-detail-reference-manuscript,
    .book-detail-reference-photos,
    .book-detail-reference-story-grid > article,
    .book-detail-reference-next {
      padding: 18px;
      border-radius: 19px;
    }

    .book-detail-reference-section-head {
      align-items: stretch;
      flex-direction: column;
    }

    .book-detail-reference-section-head
    > div:last-child {
      display: grid;
      grid-template-columns: 1fr;
    }

    .book-detail-reference-content-wrap
    .book-content-paper {
      padding: 24px 18px !important;
    }

    .book-detail-reference-photo-grid {
      grid-template-columns: 1fr;
    }

    .book-detail-reference-story-list
    .photo-story-card {
      grid-template-columns: 1fr !important;
    }

    .book-detail-reference-story-list
    .photo-story-image {
      min-height: 210px !important;
    }

    .book-detail-reference-next
    > div:last-child {
      display: grid;
      grid-template-columns: 1fr;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .book-detail-reference-page a,
    .book-detail-reference-page button {
      transition: none;
    }
  }
`;

function BookContentPreview({
  blocks,
}: {
  blocks: ParsedBookBlock[];
}) {
  if (blocks.length === 0) {
    return (
      <EmptyBox text="아직 원고 내용이 없습니다. 상단의 원고 다시 정리하기 버튼을 누르면 이곳에 원고가 표시됩니다." />
    );
  }

  return (
    <article
      className="book-content-paper"
      style={{
        padding: '34px 42px',
        borderRadius: 24,
        border:
          '1px solid #ead7b7',
        background: '#fffdf6',
      }}
    >
      {blocks.map(
        (block, index) => {
          if (
            block.type === 'title'
          ) {
            return (
              <h1
                key={`${block.type}-${index}`}
                style={{
                  margin: '0 0 28px',
                  paddingBottom: 22,
                  borderBottom:
                    '1px solid #ead7b7',
                  color: '#20130d',
                  fontFamily:
                    'Noto Serif KR, serif',
                  fontSize: 34,
                  lineHeight: 1.35,
                  letterSpacing:
                    '-0.05em',
                }}
              >
                {block.text}
              </h1>
            );
          }

          if (
            block.type === 'heading'
          ) {
            return (
              <h2
                key={`${block.type}-${index}`}
                style={{
                  margin:
                    '34px 0 14px',
                  color: '#2d1c12',
                  fontFamily:
                    'Noto Serif KR, serif',
                  fontSize: 26,
                  lineHeight: 1.45,
                  letterSpacing:
                    '-0.04em',
                }}
              >
                {block.text}
              </h2>
            );
          }

          if (
            block.type ===
            'numbered'
          ) {
            return (
              <p
                key={`${block.type}-${index}`}
                style={{
                  margin: '14px 0',
                  padding:
                    '14px 18px',
                  borderRadius: 16,
                  background:
                    '#f7eddc',
                  color: '#4a3828',
                  fontSize: 16,
                  lineHeight: 1.8,
                }}
              >
                {block.text}
              </p>
            );
          }

          return (
            <p
              key={`${block.type}-${index}`}
              style={{
                margin: '0 0 18px',
                color: '#3b2b1d',
                fontSize: 17,
                lineHeight: 2,
                wordBreak: 'keep-all',
              }}
            >
              {block.text}
            </p>
          );
        },
      )}
    </article>
  );
}

function PhotoCard({
  photo,
}: {
  photo: MemoryRecord;
}) {
  const title =
    pickText(photo, [
      'title',
      'name',
      'caption',
      'originalName',
      'filename',
    ]) || '기억 속 사진';

  const rawDescription =
    pickText(photo, [
      'description',
      'content',
      'summary',
      'memo',
      'text',
    ]);

  const description =
    rawDescription ||
    '아직 사진 설명이 없습니다.';

  const id = cleanText(photo.id);
  const occurredAt =
    getDateInputValue(
      photo.occurredAt,
    );

  return (
    <article
      style={{
        overflow: 'hidden',
        borderRadius: 22,
        border:
          '1px solid #ead7b7',
        background: '#ffffff',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 210,
          overflow: 'hidden',
          background: '#f3e6cf',
        }}
      >
        {id ? (
          <Image
            src={`/api/blob/${id}`}
            alt={title}
            fill
            unoptimized
            sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
            style={{
              objectFit: 'contain',
            }}
          />
        ) : (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent:
                'center',
              color: '#9a6a24',
              fontSize: 13,
              fontWeight: 900,
            }}
          >
            사진을 불러오지 못했습니다
          </div>
        )}
      </div>

      <div
        style={{
          padding: 16,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 16,
            lineHeight: 1.45,
            fontWeight: 900,
          }}
        >
          {makeShortText(
            title,
            42,
          )}
        </h3>

        <p
          style={{
            margin: '8px 0 0',
            minHeight: 45,
            color: '#6b5a46',
            fontSize: 13,
            lineHeight: 1.65,
          }}
        >
          {makeShortText(
            description,
            90,
          )}
        </p>

        {id ? (
          <div
            style={{
              display: 'flex',
              justifyContent:
                'flex-end',
              flexWrap: 'wrap',
              gap: 8,
              marginTop: 12,
            }}
          >
            <EditMemoryButton
              memoryId={id}
              initialTitle={title}
              initialDescription={
                rawDescription
              }
              initialOccurredAt={
                occurredAt
              }
              label="사진 수정"
            />

            <DeleteMemoryButton
              memoryId={id}
              label="사진 삭제"
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}

function PhotoStoryCard({
  story,
}: {
  story: MemoryRecord;
}) {
  const title =
    pickText(story, [
      'title',
      'name',
      'caption',
      'originalName',
      'filename',
    ]) || '사진에 담긴 이야기';

  const rawDescription =
    pickText(story, [
      'description',
      'content',
      'summary',
      'memo',
      'text',
    ]);

  const description =
    rawDescription ||
    '아직 사진에 대한 이야기가 없습니다.';

  const id = cleanText(story.id);
  const occurredAt =
    getDateInputValue(
      story.occurredAt,
    );

  return (
    <article
      className="photo-story-card"
      style={{
        overflow: 'hidden',
        borderRadius: 22,
        border:
          '1px solid #ead7b7',
        background: '#f7eddc',
      }}
    >
      <div
        className="photo-story-image"
        style={{
          position: 'relative',
          minHeight: 145,
          background: '#eadcc5',
        }}
      >
        {id ? (
          <Image
            src={`/api/blob/${id}`}
            alt={title}
            fill
            unoptimized
            sizes="140px"
            style={{
              objectFit: 'cover',
            }}
          />
        ) : null}
      </div>

      <div
        className="photo-story-content"
        style={{
          padding:
            '18px 18px 18px 0',
        }}
      >
        <p
          style={{
            margin: 0,
            color: '#9a6a24',
            fontSize: 13,
            fontWeight: 900,
          }}
        >
          {makeShortText(
            title,
            80,
          )}
        </p>

        <p
          style={{
            margin: '10px 0 0',
            whiteSpace: 'pre-line',
            color: '#4a3828',
            fontSize: 14,
            lineHeight: 1.8,
          }}
        >
          {makeShortText(
            description,
            190,
          )}
        </p>

        {id ? (
          <div
            style={{
              display: 'flex',
              justifyContent:
                'flex-end',
              flexWrap: 'wrap',
              gap: 8,
              marginTop: 14,
            }}
          >
            <EditMemoryButton
              memoryId={id}
              initialTitle={title}
              initialDescription={
                rawDescription
              }
              initialOccurredAt={
                occurredAt
              }
              label="이야기 수정"
            />

            <DeleteMemoryButton
              memoryId={id}
              label="사진 삭제"
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}

function StoryCard({
  story,
}: {
  story: MemoryRecord;
}) {
  const question =
    pickText(story, [
      'question',
      'title',
      'prompt',
    ]) || '남겨진 이야기';

  const rawAnswer =
    pickText(story, [
      'answer',
      'content',
      'description',
      'summary',
      'memo',
    ]);

  const answer =
    rawAnswer ||
    '아직 이야기 내용이 없습니다.';

  const id = cleanText(story.id);

  return (
    <article
      style={{
        padding: 18,
        borderRadius: 22,
        border:
          '1px solid #ead7b7',
        background: '#fffdf6',
      }}
    >
      <p
        style={{
          margin: 0,
          color: '#9a6a24',
          fontSize: 13,
          fontWeight: 900,
        }}
      >
        {makeShortText(
          question,
          80,
        )}
      </p>

      <p
        style={{
          margin: '10px 0 0',
          color: '#4a3828',
          fontSize: 14,
          lineHeight: 1.75,
        }}
      >
        {makeShortText(
          answer,
          170,
        )}
      </p>

      {id ? (
        <div
          style={{
            display: 'flex',
            justifyContent:
              'flex-end',
            flexWrap: 'wrap',
            gap: 8,
            marginTop: 14,
          }}
        >
          <EditMemoryButton
            memoryId={id}
            initialTitle={question}
            initialDescription={
              rawAnswer
            }
            label="이야기 수정"
          />

          <DeleteMemoryButton
            memoryId={id}
            label="이야기 삭제"
          />
        </div>
      ) : null}
    </article>
  );
}

function InfoCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div
      style={{
        padding: 15,
        borderRadius: 18,
        border:
          '1px solid #ead7b7',
        background: '#f7eddc',
      }}
    >
      <p
        style={{
          margin: 0,
          color: '#8a806f',
          fontSize: 11,
          fontWeight: 900,
        }}
      >
        {title}
      </p>

      <p
        style={{
          margin: '7px 0 0',
          color: '#20130d',
          fontSize: 15,
          lineHeight: 1.4,
          fontWeight: 900,
          wordBreak: 'break-word',
        }}
      >
        {value}
      </p>
    </div>
  );
}

function SectionTitle({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description?: string;
}) {
  return (
    <div>
      <p
        style={{
          margin: 0,
          color: '#9a6a24',
          fontSize: 12,
          fontWeight: 900,
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </p>

      <h2
        style={{
          margin: '8px 0 0',
          color: '#20130d',
          fontFamily:
            'Noto Serif KR, serif',
          fontSize: 28,
          lineHeight: 1.4,
          letterSpacing: '-0.04em',
        }}
      >
        {title}
      </h2>

      {description ? (
        <p
          style={{
            margin: '8px 0 0',
            color: '#6b5a46',
            fontSize: 13,
            lineHeight: 1.7,
          }}
        >
          {description}
        </p>
      ) : null}
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
        marginTop: 20,
        padding: 26,
        borderRadius: 22,
        border:
          '1px dashed #d6b778',
        background: '#f7eddc',
        color: '#6b5a46',
        fontSize: 14,
        lineHeight: 1.75,
        textAlign: 'center',
      }}
    >
      {text}
    </div>
  );
}

function panelStyle(): CSSProperties {
  return {
    padding: 30,
    borderRadius: 30,
    border:
      '1px solid #e4cda3',
    background: '#fffaf0',
    boxShadow:
      '0 18px 45px rgba(80, 55, 20, 0.08)',
  };
}

function buttonStyle(
  background: string,
  color: string,
): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    padding: '0 17px',
    borderRadius: 999,
    border:
      '1px solid #d6b778',
    background,
    color,
    fontSize: 13,
    fontWeight: 900,
    textDecoration: 'none',
    textAlign: 'center',
    whiteSpace: 'nowrap',
  };
}

function bookTypeBadgeStyle(): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 26,
    padding: '0 9px',
    borderRadius: 999,
    background: '#f4ead8',
    color: '#7b4f2a',
    fontSize: 10,
    fontWeight: 900,
  };
}

function bookStatusBadgeStyle(
  status: string,
): CSSProperties {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 26,
    padding: '0 9px',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 900,
  };

  if (
    status === 'PUBLISHED'
  ) {
    return {
      ...base,
      background: '#e3f4e5',
      color: '#2f6b38',
    };
  }

  if (
    status ===
    'IN_PRODUCTION'
  ) {
    return {
      ...base,
      background: '#efe6ff',
      color: '#62438a',
    };
  }

  return {
    ...base,
    background: '#fff1c7',
    color: '#83540d',
  };
}

function productionStatusBadgeStyle(
  status: string | null,
): CSSProperties {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 26,
    padding: '0 9px',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 900,
  };

  if (!status) {
    return {
      ...base,
      background:
        'rgba(34, 28, 22, 0.08)',
      color: '#776868',
    };
  }

  if (
    status === 'COMPLETED'
  ) {
    return {
      ...base,
      background: '#e3f4e5',
      color: '#2f6b38',
    };
  }

  if (
    status === 'CANCELED'
  ) {
    return {
      ...base,
      background: '#f2eeee',
      color: '#776868',
    };
  }

  return {
    ...base,
    background: '#e4f2ff',
    color: '#245d8c',
  };
}

function isPhotoMemory(
  memory: MemoryRecord,
) {
  const type = String(
    memory.type ?? '',
  ).toUpperCase();

  const fileUrl = pickText(
    memory,
    [
      'fileUrl',
      'imageUrl',
      'photoUrl',
      'url',
    ],
  );

    return (
    type === 'PHOTO' &&
    Boolean(fileUrl)
  );
}

function hasStoryDescription(
  memory: MemoryRecord,
) {
  const description = pickText(
    memory,
    [
      'description',
      'content',
      'summary',
      'memo',
      'text',
    ],
  );

  return (
    description.length >= 10
  );
}

function isStoryMemory(
  memory: MemoryRecord,
) {
  if (isPhotoMemory(memory)) {
    return false;
  }

  if (
    isLegacyAiInterviewMemory(
      memory,
    )
  ) {
    return false;
  }

  const type = String(
    memory.type ?? '',
  ).toUpperCase();

  const storyText = pickText(
    memory,
    [
      'answer',
      'content',
      'description',
      'summary',
      'memo',
    ],
  );

    return (
    (type.includes('STORY') ||
      type.includes('TEXT')) &&
    storyText.length >= 10
  );
}

function isLegacyAiInterviewMemory(
  memory: MemoryRecord,
) {
  const title = pickText(
    memory,
    [
      'title',
      'question',
      'prompt',
    ],
  );

  const normalizedTitle =
    title.trim();

  return (
    normalizedTitle.startsWith(
      'AI 인터뷰',
    ) ||
    normalizedTitle.includes(
      'AI 인터뷰 -',
    )
  );
}

function parseBookContent(
  content: string,
): ParsedBookBlock[] {
  if (!content) {
    return [];
  }

  return content
    .split('\n')
    .map((line) => line.trim())
    .filter(
      (line) =>
        line &&
        line !== '---',
    )
    .map((line) => {
      if (
        line.startsWith('# ')
      ) {
        return {
          type: 'title' as const,
          text: line
            .replace(
              /^#\s+/,
              '',
            )
            .trim(),
        };
      }

      if (
        line.startsWith('## ')
      ) {
        return {
          type: 'heading' as const,
          text: line
            .replace(
              /^##\s+/,
              '',
            )
            .trim(),
        };
      }

      if (
        /^\d+\.\s+/.test(
          line,
        )
      ) {
        return {
          type: 'numbered' as const,
          text: line,
        };
      }

      return {
        type: 'paragraph' as const,
        text: line,
      };
    });
}

function cleanText(
  value: unknown,
) {
  if (
    typeof value !== 'string'
  ) {
    return '';
  }

  return value
    .replace(/\r\n/g, '\n')
    .replace(
      /\n{3,}/g,
      '\n\n',
    )
    .replace(
      /[ \t]{2,}/g,
      ' ',
    )
    .trim();
}

function pickText(
  item: MemoryRecord,
  keys: string[],
) {
  for (const key of keys) {
    const value = cleanText(
      item[key],
    );

    if (value) {
      return value;
    }
  }

  return '';
}

function makeShortText(
  text: string,
  maxLength = 120,
) {
  if (
    text.length <= maxLength
  ) {
    return text;
  }

  return `${text
    .slice(0, maxLength)
    .trim()}...`;
}

function getDateInputValue(
  value: unknown,
) {
  if (!value) {
    return '';
  }

  const date =
    value instanceof Date
      ? value
      : new Date(
          String(value),
        );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return '';
  }

  return date
    .toISOString()
    .slice(0, 10);
}

function formatDate(
  value: unknown,
) {
  if (!value) {
    return '-';
  }

  const date =
    value instanceof Date
      ? value
      : new Date(
          String(value),
        );

  if (
    Number.isNaN(
      date.getTime(),
    )
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
    return '분량 미정';
  }

  return `${pageCount}쪽`;
}

function getBookTypeLabel(
  type: string,
) {
  if (
    type === 'LIFE_BOOK'
  ) {
    return '인생 기록책';
  }

  if (
    type === 'FAMILY_BOOK'
  ) {
    return '가족 이야기책';
  }

  if (
    type === 'COUPLE_BOOK'
  ) {
    return '부부 이야기책';
  }

  if (
    type === 'BABY_BOOK'
  ) {
    return '성장 기록책';
  }

  if (
    type === 'TRAVEL_BOOK'
  ) {
    return '여행 기록책';
  }

  if (
    type === 'AI_MOVIE'
  ) {
    return 'AI 영상';
  }

  return '책 원고';
}

function getStatusLabel(
  status: string,
) {
  if (
    status === 'DRAFT'
  ) {
    return '원고 초안';
  }

  if (
    status ===
    'IN_PRODUCTION'
  ) {
    return '제작 진행 중';
  }

  if (
    status === 'PUBLISHED'
  ) {
    return '완성';
  }

  return '상태 확인 필요';
}

function getBookOrderStatusLabel(
  status: string,
) {
  if (status === 'READY') {
    return '결제 준비';
  }

  if (status === 'PAYMENT_PENDING') {
    return '결제 진행 중';
  }

  if (status === 'PAID') {
    return '결제 완료';
  }

  if (status === 'PARTIALLY_REFUNDED') {
    return '부분 환불';
  }

  if (status === 'REFUNDED') {
    return '환불 완료';
  }

  if (status === 'CANCELED') {
    return '주문 취소';
  }

  if (status === 'FAILED') {
    return '결제 실패';
  }

  return '결제 상태 확인 필요';
}

function getProductionRequestStatusLabel(
  status: string,
) {
  if (
    status === 'REQUESTED'
  ) {
    return '주문 신청 접수';
  }

  if (
    status === 'CONTACTED'
  ) {
    return '고객 연락 완료';
  }

  if (
    status === 'IN_PROGRESS'
  ) {
    return '제작 견적 협의 중';
  }

  if (
    status === 'COMPLETED'
  ) {
    return '주문 상담 완료';
  }

  if (
    status === 'CANCELED'
  ) {
    return '주문 신청 취소';
  }

  return '주문 신청 상태 확인 필요';
}

function gridPaperPageStyle(): CSSProperties {
  return {
    backgroundColor: '#f7eddc',
    backgroundImage: `
      linear-gradient(
        rgba(154, 106, 36, 0.08) 1px,
        transparent 1px
      ),
      linear-gradient(
        90deg,
        rgba(154, 106, 36, 0.08) 1px,
        transparent 1px
      ),
      linear-gradient(
        rgba(154, 106, 36, 0.14) 1px,
        transparent 1px
      ),
      linear-gradient(
        90deg,
        rgba(154, 106, 36, 0.14) 1px,
        transparent 1px
      )
    `,
    backgroundSize:
      '24px 24px, 24px 24px, 120px 120px, 120px 120px',
    backgroundPosition: '0 0',
  };
}