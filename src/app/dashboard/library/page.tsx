import { auth } from "@/auth";
import LibraryBookList, {
  type LibraryBookItem,
} from "@/components/library/LibraryBookList";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

const TYPE_LABEL: Record<string, string> = {
  LIFE_BOOK: "인생 기록책",
  FAMILY_BOOK: "가족 이야기책",
  COUPLE_BOOK: "부부 이야기책",
  BABY_BOOK: "성장 기록책",
  TRAVEL_BOOK: "여행 기록책",
  AI_MOVIE: "AI 영상",
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "원고 초안",
  IN_PRODUCTION: "제작 진행 중",
  PUBLISHED: "완성",
};

const ACTIVE_PRODUCTION_STATUSES = new Set([
  "REQUESTED",
  "CONTACTED",
  "IN_PROGRESS",
]);

const PAYMENT_READY_STATUSES = new Set([
  "READY",
  "FAILED",
]);

const PAID_OR_PRODUCTION_ORDER_STATUSES = new Set([
  "PAID",
  "IN_PRODUCTION",
]);

export default async function LibraryPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const books = await prisma.book.findMany({
    where: {
      authorId: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const bookIds = books.map(
    (book) => book.id,
  );

  const [
    productionRequests,
    coverLinks,
  ] = await Promise.all([
    bookIds.length > 0
      ? prisma.bookProductionRequest.findMany({
          where: {
            authorId: userId,
            bookId: {
              in: bookIds,
            },
          },
          orderBy: [
            {
              updatedAt: "desc",
            },
            {
              createdAt: "desc",
            },
          ],
          select: {
            bookId: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            bookOrder: {
              select: {
                status: true,
                orderId: true,
                productName: true,
                quantity: true,
                productAmount: true,
                shippingFee: true,
                totalAmount: true,
              },
            },
          },
        })
      : Promise.resolve([]),

    bookIds.length > 0
      ? prisma.bookMemory.findMany({
          where: {
            bookId: {
              in: bookIds,
            },
            memory: {
              authorId: userId,
              type: "PHOTO",
              fileUrl: {
                not: null,
              },
            },
          },
          orderBy: {
            order: "asc",
          },
          select: {
            bookId: true,
            memory: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  type ProductionRequest =
    (typeof productionRequests)[number];

  const requestsByBookId =
    new Map<
      string,
      ProductionRequest[]
    >();

  for (
    const request of productionRequests
  ) {
    const current =
      requestsByBookId.get(
        request.bookId,
      ) || [];

    current.push(request);

    requestsByBookId.set(
      request.bookId,
      current,
    );
  }

  const representativeRequestByBookId =
    new Map<
      string,
      ProductionRequest
    >();

  for (
    const [
      bookId,
      requests,
    ] of requestsByBookId
  ) {
    const activeRequest = requests.find(
      (request) =>
        ACTIVE_PRODUCTION_STATUSES.has(
          String(request.status),
        ),
    );

    representativeRequestByBookId.set(
      bookId,
      activeRequest || requests[0],
    );
  }

  const coverMemoryByBookId =
    new Map<string, string>();

  for (const link of coverLinks) {
    if (
      !coverMemoryByBookId.has(
        link.bookId,
      )
    ) {
      coverMemoryByBookId.set(
        link.bookId,
        link.memory.id,
      );
    }
  }

  const listBooks: LibraryBookItem[] =
    books.map((book) => {
      const request =
        representativeRequestByBookId.get(
          book.id,
        );

      const order =
        request?.bookOrder || null;

      return {
        id: book.id,
        type: String(book.type),
        title: book.title,
        status: String(book.status),
        summary: book.summary,
        pageCount: book.pageCount,
        basedPhotoCount:
          book.basedPhotoCount,
        basedStoryCount:
          book.basedStoryCount,
        createdAt:
          book.createdAt.toISOString(),
        updatedAt:
          book.updatedAt.toISOString(),
        coverMemoryId:
          coverMemoryByBookId.get(
            book.id,
          ) || null,
        hasProductionRequest:
          Boolean(request),
        productionRequestStatus:
          request
            ? String(request.status)
            : null,
        orderStatus: order
          ? String(order.status)
          : null,
        orderId:
          order?.orderId || null,
        orderProductName:
          order?.productName || null,
        orderQuantity:
          order?.quantity || null,
        orderProductAmount:
          order?.productAmount || null,
        orderShippingFee:
          order?.shippingFee || null,
        orderTotalAmount:
          order?.totalAmount || null,
      };
    });

  const draftCount =
    listBooks.filter(
      (book) =>
        book.status === "DRAFT",
    ).length;

  const inProgressCount =
    listBooks.filter(
      (book) =>
        book.status ===
          "IN_PRODUCTION" ||
        ACTIVE_PRODUCTION_STATUSES.has(
          book.productionRequestStatus ||
            "",
        ) ||
        PAID_OR_PRODUCTION_ORDER_STATUSES.has(
          book.orderStatus || "",
        ),
    ).length;

  const completedCount =
    listBooks.filter(
      (book) =>
        book.status === "PUBLISHED" ||
        book.orderStatus ===
          "COMPLETED",
    ).length;

  const paymentReadyCount =
    listBooks.filter((book) =>
      PAYMENT_READY_STATUSES.has(
        book.orderStatus || "",
      ),
    ).length;

  const paidOrderCount =
    listBooks.filter((book) =>
      PAID_OR_PRODUCTION_ORDER_STATUSES.has(
        book.orderStatus || "",
      ),
    ).length;

  const recentBooks =
    listBooks.slice(0, 4);

  return (
    <main className="library-reference-page">
      <style>{libraryReferenceStyles}</style>

      <div className="library-reference-shell">
        <section className="library-reference-hero">
          <div className="library-reference-hero-copy">
            <p>내 책장 · 주문</p>

            <h1>
              나의 이야기가
              <br />
              한 권씩 쌓이는 곳
            </h1>

            <span>
              만든 원고를 다시 읽고,
              제작 상담·결제·제작 진행
              상태를 한 화면에서 확인합니다.
            </span>

            <div className="library-reference-hero-actions">
              <Link href="/dashboard/book">
                새 책 원고 만들기
                <span aria-hidden="true">
                  →
                </span>
              </Link>

              <Link href="/dashboard">
                작업실로 돌아가기
              </Link>
            </div>
          </div>

          <div className="library-reference-hero-books">
            {recentBooks.length > 0 ? (
              recentBooks.map(
                (book, index) => (
                  <Link
                    key={book.id}
                    href={`/dashboard/library/${book.id}`}
                    className="library-reference-hero-book"
                    style={
                      {
                        "--book-index":
                          index,
                      } as React.CSSProperties
                    }
                  >
                    <span className="library-reference-hero-cover">
                      <img
                        src={
                          book.coverMemoryId
                            ? `/api/blob/${book.coverMemoryId}`
                            : `/dashboard/library-reference-v1/sample-library-${
                                (index % 6) + 1
                              }.webp`
                        }
                        alt={
                          book.title ||
                          "책 표지"
                        }
                      />

                      <span>
                        {TYPE_LABEL[
                          book.type
                        ] || "스토리북"}
                      </span>
                    </span>

                    <strong>
                      {book.title}
                    </strong>
                  </Link>
                ),
              )
            ) : (
              [1, 2, 3, 4].map(
                (number, index) => (
                  <div
                    key={number}
                    className="library-reference-hero-book"
                    style={
                      {
                        "--book-index":
                          index,
                      } as React.CSSProperties
                    }
                  >
                    <span className="library-reference-hero-cover">
                      <img
                        src={`/dashboard/library-reference-v1/sample-library-${number}.webp`}
                        alt="스토리북 예시 표지"
                      />

                      <span>
                        스토리북
                      </span>
                    </span>

                    <strong>
                      기억을 담는 책
                    </strong>
                  </div>
                ),
              )
            )}

            <div
              className="library-reference-shelf"
              aria-hidden="true"
            />
          </div>
        </section>

        <section className="library-reference-summary">
          <SummaryCard
            label="전체 책"
            value={listBooks.length}
            unit="권"
            tone="coral"
          />

          <SummaryCard
            label="원고 초안"
            value={draftCount}
            unit="권"
            tone="cream"
          />

          <SummaryCard
            label="상담·제작 진행"
            value={inProgressCount}
            unit="권"
            tone="mint"
          />

          <SummaryCard
            label="결제할 주문"
            value={paymentReadyCount}
            unit="건"
            tone="yellow"
          />

          <SummaryCard
            label="결제·제작 중"
            value={paidOrderCount}
            unit="건"
            tone="blue"
          />

          <SummaryCard
            label="완성"
            value={completedCount}
            unit="권"
            tone="green"
          />
        </section>

        {paymentReadyCount > 0 ? (
          <section className="library-reference-payment-notice">
            <span aria-hidden="true">
              ₩
            </span>

            <div>
              <strong>
                결제를 기다리는 주문이{" "}
                {paymentReadyCount}건
                있습니다.
              </strong>

              <p>
                아래 책 목록에서
                `결제 화면` 버튼을 눌러
                관리자 견적과 최종 금액을
                확인하세요.
              </p>
            </div>

            <a href="#library-book-list">
              주문 확인
              <span aria-hidden="true">
                ↓
              </span>
            </a>
          </section>
        ) : (
          <section className="library-reference-guide">
            <div>
              <span aria-hidden="true">
                1
              </span>
              <p>
                <strong>
                  원고 확인
                </strong>
                만든 책의 제목과 본문을
                읽습니다.
              </p>
            </div>

            <i aria-hidden="true">→</i>

            <div>
              <span aria-hidden="true">
                2
              </span>
              <p>
                <strong>
                  제작 상담
                </strong>
                실제 인쇄를 원하는 책을
                신청합니다.
              </p>
            </div>

            <i aria-hidden="true">→</i>

            <div>
              <span aria-hidden="true">
                3
              </span>
              <p>
                <strong>
                  견적·결제
                </strong>
                관리자 검토 후 금액을
                확인합니다.
              </p>
            </div>

            <i aria-hidden="true">→</i>

            <div>
              <span aria-hidden="true">
                4
              </span>
              <p>
                <strong>
                  제작 완료
                </strong>
                진행 상태를 내 책장에서
                확인합니다.
              </p>
            </div>
          </section>
        )}

        <section
          id="library-book-list"
          className="library-reference-list-section"
        >
          <div className="library-reference-section-head">
            <div>
              <p>내 책과 주문</p>

              <h2>
                책 상태와 제작 과정을
                한눈에 확인하세요
              </h2>

              <span>
                제목 검색과 상태 필터를
                이용해 필요한 책을 빠르게
                찾을 수 있습니다.
              </span>
            </div>

            <Link href="/dashboard/book">
              + 새 책 만들기
            </Link>
          </div>

          <LibraryBookList
            books={listBooks}
          />
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: number;
  unit: string;
  tone:
    | "coral"
    | "cream"
    | "mint"
    | "yellow"
    | "blue"
    | "green";
}) {
  return (
    <article data-tone={tone}>
      <span>{label}</span>

      <strong>
        {value.toLocaleString()}
        <small>{unit}</small>
      </strong>
    </article>
  );
}

const libraryReferenceStyles = `
  .library-reference-page,
  .library-reference-page * {
    box-sizing: border-box;
  }

  .library-reference-page {
    min-height: 100vh;
    padding: 28px 24px 56px;
    color: #432f26;
    background:
      radial-gradient(
        circle at 6% 8%,
        rgba(255, 231, 215, 0.55),
        transparent 29rem
      ),
      radial-gradient(
        circle at 95% 11%,
        rgba(230, 244, 231, 0.55),
        transparent 26rem
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

  .library-reference-page a {
    color: inherit;
    text-decoration: none;
  }

  .library-reference-page a,
  .library-reference-page button {
    transition:
      transform 160ms ease,
      box-shadow 160ms ease,
      border-color 160ms ease;
  }

  .library-reference-page a:hover,
  .library-reference-page button:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  .library-reference-page a:focus-visible,
  .library-reference-page button:focus-visible,
  .library-reference-page input:focus-visible {
    outline:
      4px solid
      rgba(239, 105, 83, 0.2);
    outline-offset: 3px;
  }

  .library-reference-shell {
    width:
      min(1380px, 100%);
    margin: 0 auto;
  }

  .library-reference-hero {
    position: relative;
    min-height: 390px;
    padding: 48px 52px;
    display: grid;
    grid-template-columns:
      minmax(340px, 0.82fr)
      minmax(520px, 1.18fr);
    align-items: center;
    gap: 35px;
    overflow: hidden;
    border:
      1px solid
      rgba(135, 94, 74, 0.13);
    border-radius: 32px;
    background:
      linear-gradient(
        135deg,
        rgba(255, 253, 248, 0.98),
        rgba(255, 249, 242, 0.95)
      );
    box-shadow:
      0 23px 56px
      rgba(92, 60, 45, 0.075);
  }

  .library-reference-hero::before {
    position: absolute;
    left: -11%;
    bottom: -66%;
    width: 61%;
    height: 95%;
    border-radius: 50%;
    background:
      rgba(199, 235, 222, 0.68);
    content: "";
  }

  .library-reference-hero-copy {
    position: relative;
    z-index: 2;
  }

  .library-reference-hero-copy > p {
    margin: 0;
    color: #ed6852;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.08em;
  }

  .library-reference-hero h1 {
    margin: 12px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size:
      clamp(43px, 5vw, 66px);
    line-height: 1.18;
    letter-spacing: -0.065em;
  }

  .library-reference-hero-copy > span {
    display: block;
    max-width: 520px;
    margin-top: 19px;
    color: #725f56;
    font-size: 16px;
    line-height: 1.8;
    word-break: keep-all;
  }

  .library-reference-hero-actions {
    margin-top: 24px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .library-reference-hero-actions > a {
    min-height: 48px;
    padding: 0 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 13px;
    border:
      1px solid #d7b6a5;
    border-radius: 14px;
    color: #785348;
    background: #ffffff;
    font-size: 12px;
    font-weight: 900;
  }

  .library-reference-hero-actions > a:first-child {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
    box-shadow:
      0 14px 28px
      rgba(219, 82, 64, 0.19);
  }

  .library-reference-hero-books {
    position: relative;
    z-index: 2;
    min-height: 300px;
    padding: 26px 20px 36px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 15px;
  }

  .library-reference-hero-book {
    position: relative;
    z-index:
      calc(10 - var(--book-index));
    width: 128px;
    flex: 0 0 auto;
    transform:
      translateY(
        calc(var(--book-index) * 4px)
      )
      rotate(
        calc(
          (var(--book-index) - 1.5) *
          2deg
        )
      );
    text-align: center;
  }

  .library-reference-hero-book:hover {
    transform:
      translateY(-8px)
      rotate(0deg) !important;
  }

  .library-reference-hero-cover {
    position: relative;
    width: 100%;
    aspect-ratio: 0.72 / 1;
    display: block;
    overflow: hidden;
    border:
      6px solid
      rgba(255, 255, 255, 0.96);
    border-radius: 8px;
    background: #eee4da;
    box-shadow:
      0 18px 31px
      rgba(63, 42, 33, 0.2);
  }

  .library-reference-hero-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .library-reference-hero-cover > span {
    position: absolute;
    inset: 0;
    padding: 15px 11px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    color: #ffffff;
    background:
      linear-gradient(
        180deg,
        transparent 45%,
        rgba(32, 20, 15, 0.64)
      );
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 10px;
    font-weight: 900;
    line-height: 1.5;
    text-shadow:
      0 2px 7px
      rgba(0, 0, 0, 0.45);
  }

  .library-reference-hero-book > strong {
    display: block;
    margin-top: 10px;
    overflow: hidden;
    color: #59453c;
    font-size: 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .library-reference-shelf {
    position: absolute;
    left: 4%;
    right: 4%;
    bottom: 7px;
    height: 22px;
    border-radius: 8px;
    background:
      linear-gradient(
        180deg,
        #e3ad80,
        #bc7353
      );
    box-shadow:
      0 9px 19px
      rgba(93, 53, 36, 0.19);
  }

  .library-reference-summary {
    margin-top: 18px;
    display: grid;
    grid-template-columns:
      repeat(6, minmax(0, 1fr));
    gap: 10px;
  }

  .library-reference-summary article {
    min-width: 0;
    padding: 16px;
    border:
      1px solid
      rgba(135, 94, 74, 0.11);
    border-radius: 16px;
    background: #ffffff;
    box-shadow:
      0 9px 22px
      rgba(92, 60, 45, 0.04);
  }

  .library-reference-summary article[data-tone="coral"] {
    background: #fff0eb;
  }

  .library-reference-summary article[data-tone="cream"] {
    background: #fff7e8;
  }

  .library-reference-summary article[data-tone="mint"] {
    background: #edf8f1;
  }

  .library-reference-summary article[data-tone="yellow"] {
    background: #fff8d9;
  }

  .library-reference-summary article[data-tone="blue"] {
    background: #edf5ff;
  }

  .library-reference-summary article[data-tone="green"] {
    background: #eef7e9;
  }

  .library-reference-summary span {
    color: #7a675e;
    font-size: 10px;
    font-weight: 850;
  }

  .library-reference-summary strong {
    display: block;
    margin-top: 7px;
    color: #e3634e;
    font-size: 26px;
  }

  .library-reference-summary small {
    margin-left: 3px;
    color: #806d64;
    font-size: 10px;
  }

  .library-reference-payment-notice,
  .library-reference-guide {
    margin-top: 17px;
    border:
      1px solid
      rgba(136, 94, 74, 0.13);
    border-radius: 20px;
    background:
      rgba(255, 255, 255, 0.9);
    box-shadow:
      0 12px 29px
      rgba(91, 59, 44, 0.045);
  }

  .library-reference-payment-notice {
    padding: 18px 22px;
    display: grid;
    grid-template-columns:
      44px minmax(0, 1fr) auto;
    align-items: center;
    gap: 14px;
    border-color: #e0b37e;
    background:
      linear-gradient(
        135deg,
        #fff7e4,
        #fffdf9
      );
  }

  .library-reference-payment-notice > span {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    color: #ffffff;
    background: #ed735b;
    font-size: 20px;
    font-weight: 900;
  }

  .library-reference-payment-notice strong {
    display: block;
    font-size: 15px;
  }

  .library-reference-payment-notice p {
    margin: 4px 0 0;
    color: #79665d;
    font-size: 10px;
    line-height: 1.6;
  }

  .library-reference-payment-notice > a {
    min-height: 42px;
    padding: 0 14px;
    display: inline-flex;
    align-items: center;
    gap: 9px;
    border-radius: 12px;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
    font-size: 11px;
    font-weight: 900;
  }

  .library-reference-guide {
    padding: 17px 20px;
    display: grid;
    grid-template-columns:
      minmax(0, 1fr) auto
      minmax(0, 1fr) auto
      minmax(0, 1fr) auto
      minmax(0, 1fr);
    align-items: center;
    gap: 12px;
  }

  .library-reference-guide > div {
    min-width: 0;
    display: grid;
    grid-template-columns:
      33px minmax(0, 1fr);
    align-items: center;
    gap: 9px;
  }

  .library-reference-guide > div > span {
    width: 33px;
    height: 33px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    color: #ffffff;
    background: #ef7059;
    font-size: 12px;
    font-weight: 900;
  }

  .library-reference-guide p {
    margin: 0;
    color: #765f55;
    font-size: 10px;
    line-height: 1.5;
  }

  .library-reference-guide p strong {
    display: block;
    color: #49362d;
    font-size: 12px;
  }

  .library-reference-guide > i {
    color: #e99a7a;
    font-style: normal;
    font-size: 21px;
  }

  .library-reference-list-section {
    margin-top: 17px;
    padding: 25px;
    border:
      1px solid
      rgba(136, 94, 74, 0.13);
    border-radius: 27px;
    background:
      rgba(255, 255, 255, 0.92);
    box-shadow:
      0 18px 42px
      rgba(91, 59, 44, 0.06);
  }

  .library-reference-section-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
  }

  .library-reference-section-head p {
    margin: 0;
    color: #e56953;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.07em;
  }

  .library-reference-section-head h2 {
    margin: 7px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 29px;
    line-height: 1.4;
    letter-spacing: -0.045em;
  }

  .library-reference-section-head div > span {
    display: block;
    margin-top: 6px;
    color: #7b685f;
    font-size: 11px;
    line-height: 1.65;
  }

  .library-reference-section-head > a {
    min-height: 42px;
    padding: 0 14px;
    display: inline-flex;
    align-items: center;
    flex: 0 0 auto;
    border-radius: 12px;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
    font-size: 11px;
    font-weight: 900;
  }

  @media (max-width: 1100px) {
    .library-reference-hero {
      grid-template-columns:
        minmax(300px, 0.8fr)
        minmax(440px, 1.2fr);
    }

    .library-reference-hero-book {
      width: 105px;
    }

    .library-reference-summary {
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 820px) {
    .library-reference-page {
      padding: 20px 13px 40px;
    }

    .library-reference-hero {
      padding: 34px 27px;
      display: block;
      border-radius: 24px;
    }

    .library-reference-hero-books {
      min-height: 270px;
      margin-top: 22px;
      overflow-x: auto;
      justify-content: flex-start;
    }

    .library-reference-guide {
      overflow-x: auto;
      grid-template-columns:
        220px 30px
        220px 30px
        220px 30px
        220px;
    }

    .library-reference-list-section {
      padding: 18px;
      border-radius: 21px;
    }
  }

  @media (max-width: 560px) {
    .library-reference-hero {
      padding: 27px 20px 22px;
    }

    .library-reference-hero h1 {
      font-size: 38px;
    }

    .library-reference-hero-copy > span {
      font-size: 13px;
    }

    .library-reference-hero-actions {
      display: grid;
      grid-template-columns: 1fr;
    }

    .library-reference-hero-actions > a {
      width: 100%;
    }

    .library-reference-hero-books {
      min-height: 235px;
      padding-left: 4px;
      padding-right: 4px;
    }

    .library-reference-hero-book {
      width: 92px;
    }

    .library-reference-summary {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
      gap: 7px;
    }

    .library-reference-summary article {
      padding: 13px;
    }

    .library-reference-summary strong {
      font-size: 21px;
    }

    .library-reference-payment-notice {
      grid-template-columns:
        37px minmax(0, 1fr);
      padding: 14px;
    }

    .library-reference-payment-notice > span {
      width: 37px;
      height: 37px;
    }

    .library-reference-payment-notice > a {
      grid-column: 1 / -1;
      justify-content: center;
    }

    .library-reference-section-head {
      flex-direction: column;
      align-items: stretch;
    }

    .library-reference-section-head > a {
      justify-content: center;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .library-reference-page a,
    .library-reference-page button {
      transition: none;
    }
  }
`;
