import { auth } from '@/auth';
import BookProductionRequestButton from '@/components/library/BookProductionRequestButton';
import DeleteBookButton from '@/components/library/DeleteBookButton';
import EditBookDraftButton from '@/components/library/EditBookDraftButton';
import RefreshBookDraftButton from '@/components/library/RefreshBookDraftButton';
import DeleteMemoryButton from '@/components/memory/DeleteMemoryButton';
import EditMemoryButton from '@/components/memory/EditMemoryButton';
import TossPaymentWidget from '@/components/payment/TossPaymentWidget';
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
  return (
    <main
    className="book-detail-main"  
    style={{
        minHeight: '100vh',
        ...gridPaperPageStyle(),
        color: '#24170f',
      }}
    >
      <style>{`
                .book-detail-main {
          min-height: 100vh;
          color: #4a352b;
          background-color: #fffdf9 !important;
          background-image:
            linear-gradient(
              rgba(220, 167, 136, 0.032) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(220, 167, 136, 0.032) 1px,
              transparent 1px
            ) !important;
          background-size: 32px 32px !important;
          background-position: 0 0 !important;
        }

        .book-detail-panel {
          background:
            linear-gradient(
              145deg,
              #ffffff,
              #fffaf7
            ) !important;
          border:
            1px solid rgba(196, 139, 108, 0.19) !important;
          box-shadow:
            0 14px 34px
            rgba(132, 79, 48, 0.055) !important;
        }

        .book-detail-hero {
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 92% 4%,
              rgba(255, 210, 190, 0.58),
              transparent 24rem
            ),
            radial-gradient(
              circle at 4% 100%,
              rgba(255, 241, 202, 0.52),
              transparent 22rem
            ),
            linear-gradient(
              135deg,
              #fff8f3 0%,
              #ffffff 52%,
              #fff1e8 100%
            ) !important;
          border:
            1px solid rgba(218, 143, 108, 0.22) !important;
          box-shadow:
            0 18px 48px
            rgba(156, 91, 58, 0.08) !important;
        }

        .book-detail-hero h1,
        .book-detail-hero h2,
        .book-detail-hero strong {
          color: #49352b !important;
        }

        .book-detail-hero > p:first-child {
          color: #d56f55 !important;
        }

        .book-detail-hero p {
          color: #725d52 !important;
        }

        .book-detail-actions > a,
        .book-detail-actions > button {
          border:
            1px solid rgba(210, 126, 90, 0.18) !important;
          background:
            linear-gradient(
              135deg,
              #f49378,
              #e97861
            ) !important;
          color: #ffffff !important;
          box-shadow:
            0 10px 23px
            rgba(220, 104, 77, 0.17) !important;
        }

        .book-cover-card {
          background:
            radial-gradient(
              circle at 88% 8%,
              rgba(255, 205, 184, 0.64),
              transparent 19rem
            ),
            linear-gradient(
              145deg,
              #fff7f1 0%,
              #ffffff 54%,
              #ffede4 100%
            ) !important;
          color: #49352b !important;
          border:
            1px solid rgba(218, 143, 108, 0.25) !important;
          box-shadow:
            0 18px 42px
            rgba(166, 91, 56, 0.09) !important;
        }

        .book-cover-card h1,
        .book-cover-card h2,
        .book-cover-card h3,
        .book-cover-card strong {
          color: #49352b !important;
        }

        .book-cover-card p {
          color: #725d52 !important;
        }

        .book-cover-card > p:first-child {
          color: #d56f55 !important;
        }

        .book-cover-card > p:last-child {
          border-color:
            rgba(201, 126, 92, 0.22) !important;
          color: #b2644c !important;
        }

        .book-content-paper {
          background: #ffffff !important;
          border:
            1px solid rgba(196, 139, 108, 0.2) !important;
          box-shadow:
            0 12px 30px
            rgba(132, 79, 48, 0.05) !important;
        }

        .book-content-paper h1,
        .book-content-paper h2,
        .book-content-paper h3 {
          color: #49352b !important;
        }

        .book-content-paper p {
          color: #584338;
        }

        .photo-story-card {
          background: #ffffff !important;
          border-color:
            rgba(191, 137, 106, 0.19) !important;
          box-shadow:
            0 10px 26px
            rgba(127, 76, 47, 0.045) !important;
        }

        .photo-story-image {
          background: #fff3ed !important;
        }

        .book-next-section {
          background:
            linear-gradient(
              135deg,
              #fff8f3,
              #ffffff
            ) !important;
        }

        .book-detail-panel h1,
        .book-detail-panel h2,
        .book-detail-panel h3 {
          color: #49352b;
        }

        .book-detail-panel
        > p:first-child,
        .book-detail-panel
        > div
        > p:first-child {
          color: #d67358 !important;
        }

        .book-detail-panel input,
        .book-detail-panel textarea,
        .book-detail-panel select {
          border:
            1px solid rgba(192, 139, 108, 0.28) !important;
          background: #fffdfb !important;
          color: #49352b !important;
        }

        .book-detail-panel input:focus,
        .book-detail-panel textarea:focus,
        .book-detail-panel select:focus {
          border-color: #e68a6f !important;
          outline:
            3px solid rgba(230, 138, 111, 0.12) !important;
        }
        .book-detail-container {
          width: 100%;
          max-width: 1240px;
          margin: 0 auto;
          padding: 28px 28px 80px;
        }

        .book-detail-header {
          display: grid;
          grid-template-columns:
            minmax(0, 1fr) auto;
          gap: 24px;
          align-items: start;
        }

        .book-detail-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 8px;
          max-width: 620px;
        }

        .book-overview-grid {
          display: grid;
          grid-template-columns:
            minmax(280px, 0.9fr)
            minmax(360px, 1.35fr);
          gap: 24px;
        }

        .book-info-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .book-section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 14px;
        }

        .book-preview-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .book-photo-grid {
          display: grid;
          grid-template-columns:
            repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }

        .book-story-grid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 24px;
        }

        .photo-story-card {
          display: grid;
          grid-template-columns:
            140px minmax(0, 1fr);
        }

        .book-next-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .book-next-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        @media (max-width: 1000px) {
          .book-detail-header {
            grid-template-columns: 1fr;
          }

          .book-detail-actions {
            justify-content: flex-start;
            max-width: none;
          }

          .book-overview-grid {
            grid-template-columns: 1fr;
          }

          .book-story-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .book-detail-container {
            padding: 16px 16px 60px;
          }

          .book-detail-panel {
            padding: 20px 16px !important;
            border-radius: 24px !important;
          }

          .book-detail-actions {
            display: grid;
            grid-template-columns: 1fr;
            width: 100%;
          }

          .book-detail-actions > * {
            width: 100%;
          }

          .book-info-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .book-preview-actions {
            display: grid;
            grid-template-columns: 1fr;
            width: 100%;
          }

          .book-preview-actions a {
            width: 100%;
          }

          .book-photo-grid {
            grid-template-columns: 1fr;
          }

          .photo-story-card {
            grid-template-columns: 1fr;
          }

          .photo-story-image {
            min-height: 220px !important;
          }

          .photo-story-content {
            padding: 18px !important;
          }

          .book-content-paper {
            padding: 24px 18px !important;
          }

          .book-next-section {
            display: grid;
            grid-template-columns: 1fr;
          }

          .book-next-actions {
            display: grid;
            grid-template-columns: 1fr;
          }

          .book-next-actions a {
            width: 100%;
          }
        }
      `}</style>

      <div className="book-detail-container">
        <section
          className="book-detail-panel book-detail-hero"
           style={{
            padding: 30,
            borderRadius: 30,
            border:
              '1px solid #e4cda3',
            background: '#fffaf0',
            boxShadow:
              '0 18px 45px rgba(80, 55, 20, 0.10)',
            marginBottom: 24,
          }}
        >
          <p
            style={{
              margin: 0,
              color: '#9a6a24',
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: '0.06em',
            }}
          >
            내 책장 / 책 상세 보기
          </p>

          <div
            className="book-detail-header"
            style={{
              marginTop: 12,
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 7,
                  marginBottom: 12,
                }}
              >
                <span
                  style={bookTypeBadgeStyle()}
                >
                  {getBookTypeLabel(
                    String(book.type),
                  )}
                </span>

                <span
                  style={bookStatusBadgeStyle(
                    String(book.status),
                  )}
                >
                  {getStatusLabel(
                    String(book.status),
                  )}
                </span>

                <span
                  style={productionStatusBadgeStyle(
                    productionRequest
                      ? String(
                          productionRequest.status,
                        )
                      : null,
                  )}
                >
                  {productionRequest
                    ? getProductionRequestStatusLabel(
                        String(
                          productionRequest.status,
                        ),
                      )
                    : '주문 신청 전'}
                </span>
              </div>

              <h1
                style={{
                  margin: 0,
                  color: '#20130d',
                  fontFamily:
                    'Noto Serif KR, serif',
                  fontSize:
                    'clamp(34px, 5vw, 46px)',
                  lineHeight: 1.25,
                  letterSpacing: '-0.05em',
                  wordBreak: 'break-word',
                }}
              >
                {book.title}
              </h1>

              {book.subtitle ? (
                <p
                  style={{
                    margin: '13px 0 0',
                    color: '#6b5a46',
                    fontSize: 17,
                    lineHeight: 1.7,
                  }}
                >
                  {book.subtitle}
                </p>
              ) : null}

              <p
                style={{
                  margin: '12px 0 0',
                  color: '#8a806f',
                  fontSize: 12,
                }}
              >
                생성일{' '}
                {formatDate(
                  book.createdAt,
                )}
                {' · '}
                마지막 정리일{' '}
                {formatDate(
                  book.updatedAt,
                )}
              </p>
            </div>

            <div className="book-detail-actions">
              {String(book.status) !== 'PUBLISHED' ? (
            <EditBookDraftButton
               bookId={book.id}
               initialTitle={book.title}
               initialSubtitle={book.subtitle}
               initialSummary={summary}
               initialCoverText={coverText}
               initialContent={content}
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
                  ''
                }
                defaultEmail={
                  productionRequest?.email ||
                  cleanText(
                    session.user.email,
                  )
                }
                defaultMessage={
                  productionRequest?.message ||
                  ''
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

              <Link
                href="/dashboard/library"
                style={buttonStyle(
                  '#fffaf0',
                  '#4a3828',
                )}
              >
                내 책장으로
              </Link>

              <DeleteBookButton
                bookId={book.id}
                redirectTo="/dashboard/library"
              />
            </div>
          </div>
        </section>

        <section
          className="book-overview-grid"
          style={{
            marginBottom: 24,
          }}
        >
          <article
              className="book-detail-panel book-cover-card"
              style={{
              minHeight: 350,
              padding: 34,
              borderRadius: 30,
              background:
                'linear-gradient(135deg, #21150f 0%, #332016 58%, #6e3c22 100%)',
              color: '#fffaf0',
              boxShadow:
                '0 18px 40px rgba(70, 45, 20, 0.18)',
            }}
          >
            <p
              style={{
                margin: 0,
                color: '#f3d28a',
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: '0.06em',
              }}
            >
              DALDONGNE MEMORY BOOK
            </p>

            <h2
              style={{
                margin: '18px 0 0',
                fontFamily:
                  'Noto Serif KR, serif',
                fontSize: 34,
                lineHeight: 1.32,
                letterSpacing: '-0.05em',
              }}
            >
              {book.title}
            </h2>

            <p
              style={{
                margin: '38px 0 0',
                color: '#fff2d8',
                fontSize: 18,
                lineHeight: 1.85,
                wordBreak: 'keep-all',
              }}
            >
              {coverText}
            </p>

            <p
              style={{
                margin: '38px 0 0',
                paddingTop: 17,
                borderTop:
                  '1px solid rgba(255,255,255,0.18)',
                color: '#f3d28a',
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              사진과 이야기로 엮은
              우리들의 기록
            </p>
          </article>

          <article
            className="book-detail-panel"
            style={panelStyle()}
          >
            <p
              style={{
                margin: 0,
                color: '#9a6a24',
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: '0.06em',
              }}
            >
              책 소개
            </p>

            <p
              style={{
                margin: '12px 0 0',
                color: '#4a3828',
                fontSize: 17,
                lineHeight: 1.85,
                wordBreak: 'keep-all',
              }}
            >
              {summary}
            </p>

            <div
              className="book-info-grid"
              style={{
                marginTop: 24,
              }}
            >
              <InfoCard
                title="책 종류"
                value={getBookTypeLabel(
                  String(book.type),
                )}
              />

              <InfoCard
                title="책 상태"
                value={getStatusLabel(
                  String(book.status),
                )}
              />

              <InfoCard
                title="주문 신청"
                value={
                  productionRequest
                    ? getProductionRequestStatusLabel(
                        String(
                          productionRequest.status,
                        ),
                      )
                    : '신청 전'
                }
              />

              <InfoCard
                title="예상 분량"
                value={getPageCountLabel(
                  book.pageCount,
                )}
              />

              <InfoCard
                title="사용 사진"
                value={`${displayedPhotoCount}장`}
              />

              <InfoCard
                title="사용 이야기"
                value={`${displayedStoryCount}개`}
              />
            </div>

            {productionRequest ? (
              <div
                style={{
                  marginTop: 20,
                  padding: 16,
                  borderRadius: 18,
                  border:
                    '1px solid #b9d5e9',
                  background: '#eef7ff',
                }}
              >

                           {productionRequest?.bookOrder ? (
              <section
                style={{
                  marginTop: 18,
                  padding: 22,
                  borderRadius: 22,
                  border: '1px solid #d8b97c',
                  background: '#fff8e9',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
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
                      제작 견적
                    </p>

                    <h2
                      style={{
                        margin: '7px 0 0',
                        color: '#2d1c12',
                        fontFamily: 'Noto Serif KR, serif',
                        fontSize: 24,
                        lineHeight: 1.4,
                      }}
                    >
                      {productionRequest.bookOrder.productName}
                    </h2>
                  </div>

                  <span
                    style={{
                      padding: '7px 11px',
                      borderRadius: 999,
                      background: '#6e421d',
                      color: '#fffaf0',
                      fontSize: 12,
                      fontWeight: 900,
                    }}
                  >
                    {getBookOrderStatusLabel(
                      productionRequest.bookOrder.status,
                    )}
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: 10,
                    marginTop: 18,
                  }}
                >
                  <InfoCard
                    title="제작 수량"
                    value={`${productionRequest.bookOrder.quantity.toLocaleString()}권`}
                  />

                  <InfoCard
                    title="상품 금액"
                    value={`${productionRequest.bookOrder.productAmount.toLocaleString()}원`}
                  />

                  <InfoCard
                    title="배송비"
                    value={`${productionRequest.bookOrder.shippingFee.toLocaleString()}원`}
                  />

                  <InfoCard
                    title="최종 결제 금액"
                    value={`${productionRequest.bookOrder.totalAmount.toLocaleString()}원`}
                  />
                </div>

                {productionRequest.bookOrder.specification ? (
                  <div
                    style={{
                      marginTop: 14,
                      padding: 15,
                      borderRadius: 16,
                      background: '#fffdf7',
                      border: '1px solid #ead7b7',
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
                      제작 사양
                    </p>

                    <p
                      style={{
                        margin: '8px 0 0',
                        color: '#3b2b1d',
                        fontSize: 14,
                        lineHeight: 1.75,
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {productionRequest.bookOrder.specification}
                    </p>
                  </div>
                ) : null}

                <div
                  style={{
                    marginTop: 14,
                    padding: 14,
                    borderRadius: 16,
                    background: '#2d2119',
                    color: '#fffaf0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 10,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: 'rgba(255, 250, 240, 0.74)',
                    }}
                  >
                    주문번호 {productionRequest.bookOrder.orderId}
                  </span>

                  <strong
                    style={{
                      fontSize: 21,
                    }}
                  >
                    {productionRequest.bookOrder.totalAmount.toLocaleString()}원
                  </strong>
                </div>

                {[
                   'READY',
                    'FAILED',
                    ].includes(
                    productionRequest.bookOrder.status,
                   ) ? (
                  <TossPaymentWidget
                    bookId={book.id}
                    orderId={
                      productionRequest.bookOrder.orderId
                    }
                    orderName={
                      productionRequest.bookOrder.productName
                    }
                    amount={
                      productionRequest.bookOrder.totalAmount
                    }
                    customerKey={userId}
                    customerName={
                      productionRequest.name
                    }
                    customerEmail={
                      productionRequest.email
                    }
                    customerMobilePhone={
                      productionRequest.phone
                    }
                  />
                ) : null}
              </section>
            ) : null}
                <p
                  style={{
                    margin: 0,
                    color: '#245d8c',
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  주문 신청 현황'
                </p>

                <strong
                  style={{
                    display: 'block',
                    marginTop: 6,
                    color: '#33271d',
                    fontSize: 15,
                    lineHeight: 1.55,
                  }}
                >
                  {getProductionRequestStatusLabel(
                    String(
                      productionRequest.status,
                    ),
                  )}
                </strong>

                <p
                  style={{
                    margin: '7px 0 0',
                    color: '#5f7180',
                    fontSize: 12,
                    lineHeight: 1.65,
                  }}
                >
                  신청일{' '}
                  {formatDate(
                    productionRequest.createdAt,
                  )}
                  {' · '}
                  최근 변경{' '}
                  {formatDate(
                    productionRequest.updatedAt,
                  )}
                </p>
              </div>
            ) : (
              <div
                style={{
                  marginTop: 20,
                  padding: 16,
                  borderRadius: 18,
                  border:
                    '1px solid #e3bd7a',
                  background: '#fff4df',
                  color: '#83540d',
                  fontSize: 13,
                  lineHeight: 1.7,
                  fontWeight: 800,
                }}
              >
                이 책은 아직 책 제작 주문을
                신청하지 않았습니다. 상단의
                책 제작 주문 신청 버튼을 누르면
                관리자가 1차 검토 후 연락드립니다.
              </div>
            )}

            <p
              style={{
                margin: '18px 0 0',
                padding: '12px 14px',
                borderRadius: 16,
                background:
                  linkedMemories.length > 0
                    ? '#f3fbf5'
                    : '#fff9e8',
                border:
                  linkedMemories.length > 0
                    ? '1px solid #9ec9a8'
                    : '1px solid #e1bd67',
                color:
                  linkedMemories.length > 0
                    ? '#2f6b3f'
                    : '#7a4b00',
                fontSize: 12,
                lineHeight: 1.7,
                fontWeight: 800,
              }}
            >
              {linkedMemories.length > 0
                ? '이 책은 원고를 만들 때 선택한 사진과 이야기를 기준으로 표시됩니다.'
                : '이전 방식으로 만든 책이라 연결된 자료가 없습니다. 원고 다시 정리하기를 실행하면 현재 자료가 책에 다시 연결됩니다.'}
            </p>
          </article>
        </section>

        <section
          className="book-detail-panel"
          style={{
            ...panelStyle(),
            marginBottom: 24,
          }}
        >
          <div className="book-section-header">
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
                책 원고 미리보기
              </p>

              <h2
                style={{
                  margin: '8px 0 0',
                  color: '#20130d',
                  fontFamily:
                    'Noto Serif KR, serif',
                  fontSize: 30,
                  lineHeight: 1.35,
                  letterSpacing: '-0.04em',
                }}
              >
                한 권의 책처럼 읽히는 원고
              </h2>

              <p
                style={{
                  margin: '9px 0 0',
                  maxWidth: 720,
                  color: '#6b5a46',
                  fontSize: 14,
                  lineHeight: 1.75,
                }}
              >
                전자책 화면에서는 실제 책처럼
                읽고, 인쇄용 원고에서는 표지와
                목차를 포함한 출력 형태를
                확인할 수 있습니다.
              </p>
            </div>

            <div className="book-preview-actions">
              <Link
                href={`/dashboard/library/${book.id}/ebook`}
                style={buttonStyle(
                  '#fff4df',
                  '#5a3510',
                )}
              >
                전자책 보기
              </Link>

              <Link
                href={`/dashboard/library/${book.id}/print`}
                style={buttonStyle(
                  '#f3d28a',
                  '#6d4512',
                )}
              >
                인쇄용 원고
              </Link>
            </div>
          </div>

          <div
            style={{
              marginTop: 24,
            }}
          >
            <BookContentPreview
              blocks={parsedContent}
            />
          </div>
        </section>

        <section
          className="book-detail-panel"
          style={{
            ...panelStyle(),
            marginBottom: 24,
          }}
        >
          <SectionTitle
            label="이 책에 들어간 사진"
            title="사진에서 시작된 기억"
            description={`현재 화면에는 최대 8장까지 표시합니다. 전체 연결 사진은 ${photoMemories.length}장입니다.`}
          />

          {photos.length > 0 ? (
            <div
              className="book-photo-grid"
              style={{
                marginTop: 20,
              }}
            >
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

        <section
          className="book-story-grid"
          style={{
            marginBottom: 24,
          }}
        >
          <article
            className="book-detail-panel"
            style={panelStyle()}
          >
            <SectionTitle
              label="사진에 붙인 이야기"
              title="사진 한 장에 담긴 기억"
              description="사진의 제목과 설명으로 남긴 이야기입니다."
            />

            {photoStories.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gap: 14,
                  marginTop: 20,
                }}
              >
                {photoStories.map(
                  (story, index) => (
                    <PhotoStoryCard
                      key={String(
                        story.id ??
                          index,
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

          <article
            className="book-detail-panel"
            style={panelStyle()}
          >
            <SectionTitle
              label="직접 남긴 이야기"
              title="글로 남긴 우리들의 시간"
              description="이야기 남기기 화면에서 직접 작성한 기록입니다."
            />

            {stories.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gap: 14,
                  marginTop: 20,
                }}
              >
                {stories.map(
                  (story, index) => (
                    <StoryCard
                      key={String(
                        story.id ??
                          index,
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

        <section
          className="book-detail-panel book-next-section"
          style={panelStyle()}
        >
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
              다음 작업
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
              사진과 이야기를 보완하면
              원고를 더 풍부하게 만들 수
              있습니다.
            </h2>

            <p
              style={{
                margin: '9px 0 0',
                maxWidth: 720,
                color: '#6b5a46',
                fontSize: 14,
                lineHeight: 1.75,
              }}
            >
              자료를 추가한 다음 상단의
              원고 다시 정리하기 버튼을
              사용하세요.
            </p>
          </div>

          <div className="book-next-actions">
            <Link
              href="/dashboard/timeline"
              style={buttonStyle(
                '#fffaf0',
                '#4a3828',
              )}
            >
              사진 더 모으기
            </Link>

            <Link
              href="/dashboard/interview"
              style={buttonStyle(
                '#fffaf0',
                '#4a3828',
              )}
            >
              이야기 더 남기기
            </Link>

            <Link
              href="/dashboard/library"
              style={buttonStyle(
                '#24170f',
                '#fffaf0',
              )}
            >
              내 책장으로
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

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