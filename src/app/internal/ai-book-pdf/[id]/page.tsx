/* eslint-disable @next/next/no-img-element */

import { auth } from "@/auth";
import type {
  AIBookLayoutPlan,
} from "@/lib/ai-book-production-layout";
import { prisma } from "@/lib/prisma";
import {
  notFound,
  redirect,
} from "next/navigation";
import type {
  ReactNode,
} from "react";

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type LayoutPage =
  AIBookLayoutPlan["pages"][number];

type LayoutPhoto =
  LayoutPage["photos"][number];

type BookMeta = {
  authorName: string;
  orderNumber: string;
  productName: string;
  specification: string;
  quantity: number;
  createdAt: Date;
};

export default async function AIBookPdfPage({
  params,
}: PageProps) {
  const session =
    await auth();

  const adminId =
    session?.user?.id;

  if (!adminId) {
    redirect("/login");
  }

  const admin =
    await prisma.user.findUnique({
      where: {
        id: adminId,
      },
      select: {
        role: true,
      },
    });

  if (
    admin?.role !==
    "ADMIN"
  ) {
    redirect("/dashboard");
  }

  const { id } =
    await params;

  const orderId =
    id.trim();

  if (!orderId) {
    notFound();
  }

  const order =
    await prisma.bookOrder.findUnique({
      where: {
        id: orderId,
      },
      select: {
        id: true,
        orderId: true,
        authorId: true,
        productName: true,
        specification: true,
        quantity: true,
        createdAt: true,
        book: {
          select: {
            id: true,
            title: true,
            subtitle: true,
            summary: true,
            coverText: true,
            pageCount: true,
          },
        },
      },
    });

  if (!order) {
    notFound();
  }

  const run =
    await prisma.aIBookProductionRun.findFirst({
      where: {
        orderId:
          order.id,
      },
      orderBy: {
        attempt:
          "desc",
      },
      select: {
        id: true,
        attempt: true,
        status: true,
        currentStep: true,
        layoutData: true,
        qualityReport: true,
        createdAt: true,
        updatedAt: true,
      },
    });

  if (!run) {
    notFound();
  }

  const layout =
    parseLayoutPlan(
      run.layoutData,
    );

  if (
    !layout ||
    layout.pages.length === 0
  ) {
    notFound();
  }

  const author =
    await prisma.user.findUnique({
      where: {
        id:
          order.authorId,
      },
      select: {
        name: true,
        email: true,
      },
    });

  const authorName =
    cleanText(
      author?.name,
    ) ||
    cleanText(
      author?.email,
    ) ||
    "달동네 스토리 고객";

  const meta: BookMeta = {
    authorName,
    orderNumber:
      order.orderId,
    productName:
      cleanText(
        order.productName,
      ) ||
      "스토리북",
    specification:
      cleanText(
        order.specification,
      ),
    quantity:
      order.quantity,
    createdAt:
      order.createdAt,
  };

  const chapterPageMap =
    createChapterPageMap(
      layout.pages,
    );

  return (
    <main className="pdf-root">
      <style>
        {pdfStyles}
      </style>

      <header className="pdf-preview-header">
        <div>
          <p>
            AI FINAL PDF PREVIEW
          </p>

          <h1>
            {layout.book.title}
          </h1>

          <span>
            주문번호{" "}
            {order.orderId}
          </span>
        </div>

        <div className="pdf-preview-status">
          <span>
            AI 제작{" "}
            {run.attempt}차
          </span>

          <span>
            {String(
              run.status,
            )}
          </span>

          <span>
            {layout.summary
              .totalPageCount}
            쪽
          </span>
        </div>
      </header>

      <div className="pdf-stage">
        <article
          className="pdf-book"
          data-pdf-ready="true"
          data-run-id={
            run.id
          }
          data-order-id={
            order.id
          }
        >
          {layout.pages.map(
            (page) => (
              <BookPage
                key={
                  page.sequence
                }
                page={page}
                layout={layout}
                meta={meta}
                chapterPageMap={
                  chapterPageMap
                }
              />
            ),
          )}
        </article>
      </div>
    </main>
  );
}

function BookPage({
  page,
  layout,
  meta,
  chapterPageMap,
}: {
  page: LayoutPage;
  layout: AIBookLayoutPlan;
  meta: BookMeta;
  chapterPageMap: Map<
    number,
    number
  >;
}) {
  if (
    page.pageType ===
    "COVER"
  ) {
    return (
      <PageShell
        page={page}
        hidePageNumber
      >
        <CoverPage
          page={page}
          layout={layout}
        />
      </PageShell>
    );
  }

  if (
    page.pageType ===
    "TITLE"
  ) {
    return (
      <PageShell
        page={page}
        hidePageNumber
      >
        <div className="title-page">
          <p className="title-page-brand">
            DALDONGNE STORY
          </p>

          <h1>
            {page.title ||
              layout.book
                .title}
          </h1>

          {page.subtitle ? (
            <h2>
              {
                page.subtitle
              }
            </h2>
          ) : null}

          <div className="title-page-line" />

          {page.textBlocks.map(
            (
              block,
              index,
            ) => (
              <p
                key={
                  index
                }
              >
                {block.body}
              </p>
            ),
          )}

          <strong>
            {meta.authorName}
          </strong>
        </div>
      </PageShell>
    );
  }

  if (
    page.pageType ===
    "COPYRIGHT"
  ) {
    return (
      <PageShell
        page={page}
        hidePageNumber
      >
        <div className="copyright-page">
          <div>
            <p className="page-kicker">
              BOOK INFORMATION
            </p>

            <h2>
              {page.title ||
                "책 정보"}
            </h2>

            {page.textBlocks.map(
              (
                block,
                index,
              ) => (
                <p
                  key={
                    index
                  }
                  className="copyright-description"
                >
                  {
                    block.body
                  }
                </p>
              ),
            )}
          </div>

          <dl>
            <InfoRow
              label="제목"
              value={
                layout.book
                  .title
              }
            />

            <InfoRow
              label="지은이"
              value={
                meta.authorName
              }
            />

            <InfoRow
              label="제작"
              value="달동네 스토리"
            />

            <InfoRow
              label="상품"
              value={
                meta.productName
              }
            />

            <InfoRow
              label="주문번호"
              value={
                meta.orderNumber
              }
            />

            <InfoRow
              label="제작 수량"
              value={`${meta.quantity.toLocaleString()}권`}
            />

            <InfoRow
              label="주문일"
              value={formatDate(
                meta.createdAt,
              )}
            />

            {meta.specification ? (
              <InfoRow
                label="제작 사양"
                value={
                  meta.specification
                }
              />
            ) : null}
          </dl>

          <p className="copyright-notice">
            이 책은 사용자가 제공한
            사진과 이야기를 바탕으로
            제작됐습니다. AI는 원본을
            삭제하거나 변경하지 않고
            편집과 구성을 돕는
            조력자로 사용됐습니다.
          </p>
        </div>
      </PageShell>
    );
  }

  if (
    page.pageType ===
    "CONTENTS"
  ) {
    return (
      <PageShell
        page={page}
        hidePageNumber
      >
        <div className="standard-page">
          <PageHeading
            kicker="CONTENTS"
            title={
              page.title ||
              "차례"
            }
          />

          <div className="contents-list">
            {page.textBlocks.map(
              (
                block,
                index,
              ) => {
                const chapterNumber =
                  parseChapterNumber(
                    block.heading,
                  );

                const printedPage =
                  chapterNumber ===
                  null
                    ? null
                    : chapterPageMap.get(
                        chapterNumber,
                      );

                return (
                  <div
                    className="contents-row"
                    key={
                      index
                    }
                  >
                    <span>
                      {
                        block.heading
                      }
                    </span>

                    <i />

                    <strong>
                      {printedPage ??
                        ""}
                    </strong>
                  </div>
                );
              },
            )}
          </div>
        </div>
      </PageShell>
    );
  }

  if (
    page.pageType ===
    "CHAPTER_OPENER"
  ) {
    return (
      <PageShell
        page={page}
      >
        <ChapterOpener
          page={page}
        />
      </PageShell>
    );
  }

  if (
    page.pageType ===
    "PHOTO"
  ) {
    return (
      <PageShell
        page={page}
      >
        <PhotoPage
          page={page}
        />
      </PageShell>
    );
  }

  if (
    page.pageType ===
    "PHOTO_GALLERY"
  ) {
    return (
      <PageShell
        page={page}
      >
        <GalleryPage
          page={page}
        />
      </PageShell>
    );
  }

  if (
    page.pageType ===
    "BLANK"
  ) {
    return (
      <PageShell
        page={page}
        hidePageNumber
      >
        <div className="blank-page">
          <span>
            This page is
            intentionally blank.
          </span>
        </div>
      </PageShell>
    );
  }

  if (
    page.pageType ===
    "COLOPHON"
  ) {
    return (
      <PageShell
        page={page}
      >
        <div className="colophon-page">
          <p className="page-kicker">
            DALDONGNE STORY
          </p>

          <h2>
            {layout.book.title}
          </h2>

          <p>
            {page.textBlocks[0]
              ?.body ||
              "한 사람의 시간과 마음이 한 권의 이야기로 남았습니다."}
          </p>

          <div className="colophon-line" />

          <dl>
            <InfoRow
              label="지은이"
              value={
                meta.authorName
              }
            />

            <InfoRow
              label="제작"
              value="달동네 스토리"
            />

            <InfoRow
              label="주문번호"
              value={
                meta.orderNumber
              }
            />

            <InfoRow
              label="발행 기준일"
              value={formatDate(
                new Date(),
              )}
            />
          </dl>

          <strong className="colophon-brand">
            달동네 스토리
          </strong>
        </div>
      </PageShell>
    );
  }

  const kicker =
    page.pageType ===
    "INTRODUCTION"
      ? "PROLOGUE"
      : page.pageType ===
          "EPILOGUE"
        ? "EPILOGUE"
        : page.chapterNumber
          ? `CHAPTER ${page.chapterNumber}`
          : "STORY";

  return (
    <PageShell
      page={page}
    >
      <div className="standard-page text-page">
        <PageHeading
          kicker={kicker}
          title={
            page.title ||
            page.textBlocks.find(
              (block) =>
                Boolean(
                  block.heading,
                ),
            )?.heading ||
            (page.pageType ===
            "INTRODUCTION"
              ? "머리말"
              : page.pageType ===
                  "EPILOGUE"
                ? "맺음말"
                : "")
          }
        />

        <div className="text-block-list">
          {page.textBlocks.map(
            (
              block,
              index,
            ) => (
              <section
                key={
                  index
                }
                className="text-block"
              >
                {block.heading &&
                block.heading !==
                  page.title ? (
                  <h3>
                    {
                      block.heading
                    }
                  </h3>
                ) : null}

                <p>
                  {block.body}
                </p>
              </section>
            ),
          )}
        </div>
      </div>
    </PageShell>
  );
}

function PageShell({
  page,
  children,
  hidePageNumber = false,
}: {
  page: LayoutPage;
  children: ReactNode;
  hidePageNumber?: boolean;
}) {
  const pageClass =
    page.pageType
      .toLowerCase()
      .replaceAll(
        "_",
        "-",
      );

  const shouldShowPageNumber =
    !hidePageNumber &&
    page.printedPageNumber !==
      null &&
    page.pageType !==
      "BLANK";

  return (
    <section
      className={`book-page page-${pageClass}`}
      data-page-sequence={
        page.sequence
      }
      data-page-type={
        page.pageType
      }
    >
      {children}

      {shouldShowPageNumber ? (
        <footer className="page-number">
          {
            page.printedPageNumber
          }
        </footer>
      ) : null}
    </section>
  );
}

function CoverPage({
  page,
  layout,
}: {
  page: LayoutPage;
  layout: AIBookLayoutPlan;
}) {
  const photo =
    page.photos[0] ||
    null;

  return (
    <div className="cover-page">
      {photo ? (
        <img
          className="cover-image"
          src={getPhotoSrc(
            photo,
          )}
          alt={
            photo.caption ||
            layout.book.title
          }
        />
      ) : null}

      <div className="cover-overlay" />

      <div className="cover-content">
        <p>
          DALDONGNE MEMORY
          BOOK
        </p>

        <div>
          <h1>
            {page.title ||
              layout.book
                .title}
          </h1>

          {page.subtitle ? (
            <h2>
              {
                page.subtitle
              }
            </h2>
          ) : null}

          <span />
        </div>

        <strong>
          달동네 스토리
        </strong>
      </div>
    </div>
  );
}

function ChapterOpener({
  page,
}: {
  page: LayoutPage;
}) {
  const photo =
    page.photos[0] ||
    null;

  return (
    <div className="chapter-opener">
      {photo ? (
        <img
          src={getPhotoSrc(
            photo,
          )}
          alt={
            photo.caption ||
            page.title
          }
        />
      ) : null}

      <div className="chapter-opener-overlay" />

      <div className="chapter-opener-content">
        <p>
          CHAPTER{" "}
          {page.chapterNumber ??
            ""}
        </p>

        <h2>
          {page.title}
        </h2>

        {page.subtitle ? (
          <span>
            {page.subtitle}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function PhotoPage({
  page,
}: {
  page: LayoutPage;
}) {
  const photo =
    page.photos[0] ||
    null;

  return (
    <div className="photo-page">
      <p className="photo-page-kicker">
        MEMORY PHOTO
      </p>

      {photo ? (
        <>
          <div
            className="single-photo-frame"
            data-fit={
              photo.fit
            }
          >
            <img
              src={getPhotoSrc(
                photo,
              )}
              alt={
                photo.caption ||
                "기억 사진"
              }
            />
          </div>

          {photo.caption ? (
            <p className="photo-caption">
              {
                photo.caption
              }
            </p>
          ) : null}
        </>
      ) : (
        <div className="missing-photo">
          사진 파일을 연결할 수
          없습니다.
        </div>
      )}
    </div>
  );
}

function GalleryPage({
  page,
}: {
  page: LayoutPage;
}) {
  return (
    <div className="gallery-page">
      <PageHeading
        kicker="PHOTO GALLERY"
        title={
          page.title ||
          "기억의 장면들"
        }
      />

      <div
        className="gallery-grid"
        data-count={
          page.photos.length
        }
      >
        {page.photos.map(
          (
            photo,
            index,
          ) => (
            <figure
              key={`${photo.sourceRef}-${index}`}
            >
              <div
                className="gallery-photo-frame"
                data-fit={
                  photo.fit
                }
              >
                <img
                  src={getPhotoSrc(
                    photo,
                  )}
                  alt={
                    photo.caption ||
                    `기억 사진 ${
                      index + 1
                    }`
                  }
                />
              </div>

              {photo.caption ? (
                <figcaption>
                  {
                    photo.caption
                  }
                </figcaption>
              ) : null}
            </figure>
          ),
        )}
      </div>
    </div>
  );
}

function PageHeading({
  kicker,
  title,
}: {
  kicker: string;
  title: string;
}) {
  return (
    <header className="page-heading">
      <p>
        {kicker}
      </p>

      {title ? (
        <h2>
          {title}
        </h2>
      ) : null}
    </header>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt>
        {label}
      </dt>

      <dd>
        {value}
      </dd>
    </div>
  );
}

function createChapterPageMap(
  pages: LayoutPage[],
) {
  const map =
    new Map<
      number,
      number
    >();

  for (
    const page of pages
  ) {
    if (
      page.pageType !==
        "CHAPTER_OPENER" ||
      page.chapterNumber ===
        null ||
      page.printedPageNumber ===
        null
    ) {
      continue;
    }

    map.set(
      page.chapterNumber,
      page.printedPageNumber,
    );
  }

  return map;
}

function parseChapterNumber(
  heading: string,
) {
  const match =
    heading.match(
      /^\s*(\d+)\s*\./,
    );

  if (!match) {
    return null;
  }

  const value =
    Number(
      match[1],
    );

  return Number.isInteger(
    value,
  )
    ? value
    : null;
}

function getPhotoSrc(
  photo: LayoutPhoto,
) {
  return `/api/blob/${encodeURIComponent(
    photo.sourceRef,
  )}`;
}

function parseLayoutPlan(
  value: unknown,
): AIBookLayoutPlan | null {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  const candidate =
    value as Partial<AIBookLayoutPlan>;

  if (
    candidate.version !==
      1 ||
    !candidate.book ||
    !candidate.format ||
    !candidate.summary ||
    !Array.isArray(
      candidate.pages,
    )
  ) {
    return null;
  }

  return candidate as AIBookLayoutPlan;
}

function cleanText(
  value: unknown,
) {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value.trim();
}

function formatDate(
  value: Date,
) {
  return new Intl.DateTimeFormat(
    "ko-KR",
    {
      year:
        "numeric",
      month:
        "2-digit",
      day:
        "2-digit",
    },
  ).format(value);
}

const pdfStyles = `
  @page {
    size: 148mm 210mm;
    margin: 0;
  }

  * {
    box-sizing: border-box;
  }

  html,
  body {
    margin: 0;
    padding: 0;
    background: #e8e4df;
  }

  body {
    color: #2d241e;
    font-family:
      "Noto Sans KR",
      "Malgun Gothic",
      sans-serif;
  }

  .pdf-root {
    min-height: 100vh;
  }

  .pdf-preview-header {
    max-width: 900px;
    margin: 20px auto 0;
    padding: 18px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    border: 1px solid #d7cec6;
    border-radius: 16px;
    background: #ffffff;
  }

  .pdf-preview-header p {
    margin: 0;
    color: #d66551;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.1em;
  }

  .pdf-preview-header h1 {
    margin: 5px 0 0;
    font-family:
      "Noto Serif KR",
      "Batang",
      serif;
    font-size: 22px;
  }

  .pdf-preview-header > div:first-child > span {
    display: block;
    margin-top: 6px;
    color: #81736a;
    font-size: 11px;
  }

  .pdf-preview-status {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 6px;
  }

  .pdf-preview-status span {
    padding: 7px 10px;
    border-radius: 999px;
    color: #705c50;
    background: #f6f1ed;
    font-size: 10px;
    font-weight: 800;
  }

  .pdf-stage {
    padding: 24px 16px 60px;
  }

  .pdf-book {
    display: grid;
    justify-content: center;
    gap: 24px;
  }

  .book-page {
    position: relative;
    width: 148mm;
    height: 210mm;
    overflow: hidden;
    color: #30261f;
    background: #fffdf9;
    box-shadow:
      0 16px 45px
      rgba(65, 49, 38, 0.17);
  }

  .page-number {
    position: absolute;
    right: 12mm;
    bottom: 7mm;
    margin: 0;
    color: #a39284;
    font-size: 8pt;
    font-weight: 800;
  }

  .standard-page,
  .text-page,
  .photo-page,
  .gallery-page {
    height: 100%;
    padding:
      15mm 15mm 17mm;
  }

  .page-heading {
    padding-bottom: 5mm;
    border-bottom:
      0.3mm solid #dfd4c8;
  }

  .page-heading p,
  .page-kicker {
    margin: 0;
    color: #c56b4f;
    font-size: 8pt;
    font-weight: 900;
    letter-spacing: 0.12em;
  }

  .page-heading h2 {
    margin: 3mm 0 0;
    color: #33251d;
    font-family:
      "Noto Serif KR",
      "Batang",
      serif;
    font-size: 19pt;
    line-height: 1.35;
    letter-spacing: -0.04em;
    word-break: keep-all;
  }

  .cover-page {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background:
      linear-gradient(
        145deg,
        #4f3528,
        #b06c4b
      );
  }

  .cover-image {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .cover-overlay {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(
        90deg,
        rgba(25, 18, 14, 0.84),
        rgba(25, 18, 14, 0.48) 62%,
        rgba(25, 18, 14, 0.22)
      ),
      linear-gradient(
        180deg,
        rgba(20, 14, 11, 0.08),
        rgba(20, 14, 11, 0.62)
      );
  }

  .cover-content {
    position: relative;
    z-index: 1;
    height: 100%;
    padding:
      18mm 16mm 16mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    color: #ffffff;
  }

  .cover-content > p {
    margin: 0;
    color: #f2d4b6;
    font-size: 8pt;
    font-weight: 900;
    letter-spacing: 0.14em;
  }

  .cover-content h1 {
    max-width: 105mm;
    margin: 0;
    font-family:
      "Noto Serif KR",
      "Batang",
      serif;
    font-size: 30pt;
    line-height: 1.28;
    letter-spacing: -0.055em;
    word-break: keep-all;
  }

  .cover-content h2 {
    max-width: 100mm;
    margin: 5mm 0 0;
    color: #f4ddc7;
    font-size: 13pt;
    line-height: 1.65;
  }

  .cover-content div span {
    width: 18mm;
    height: 0.8mm;
    margin-top: 8mm;
    display: block;
    background: #edb87f;
  }

  .cover-content > strong {
    padding-top: 5mm;
    border-top:
      0.3mm solid
      rgba(255, 255, 255, 0.3);
    color: #f2d4b6;
    font-size: 9pt;
  }

  .title-page {
    height: 100%;
    padding: 24mm 18mm;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .title-page-brand {
    margin: 0 0 13mm;
    color: #c56b4f;
    font-size: 8pt;
    font-weight: 900;
    letter-spacing: 0.18em;
  }

  .title-page h1 {
    margin: 0;
    font-family:
      "Noto Serif KR",
      "Batang",
      serif;
    font-size: 27pt;
    line-height: 1.35;
    letter-spacing: -0.05em;
    word-break: keep-all;
  }

  .title-page h2 {
    margin: 5mm 0 0;
    color: #806d5f;
    font-size: 12pt;
    line-height: 1.7;
  }

  .title-page-line {
    width: 16mm;
    height: 0.6mm;
    margin: 10mm auto;
    background: #c78c65;
  }

  .title-page > p:not(.title-page-brand) {
    max-width: 90mm;
    margin: 0;
    color: #6e5b4f;
    font-size: 10pt;
    line-height: 1.9;
    white-space: pre-line;
  }

  .title-page > strong {
    margin-top: 13mm;
    color: #4b3a30;
    font-size: 10pt;
  }

  .copyright-page {
    height: 100%;
    padding: 17mm 15mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .copyright-page h2 {
    margin: 3mm 0 0;
    font-family:
      "Noto Serif KR",
      "Batang",
      serif;
    font-size: 22pt;
  }

  .copyright-description {
    margin: 7mm 0 0;
    color: #655349;
    font-size: 9.5pt;
    line-height: 1.85;
    white-space: pre-line;
  }

  .copyright-page dl,
  .colophon-page dl {
    margin: 0;
    border-top:
      0.3mm solid #d8cabd;
  }

  .copyright-page dl > div,
  .colophon-page dl > div {
    padding: 3mm 0;
    display: grid;
    grid-template-columns:
      26mm minmax(0, 1fr);
    gap: 4mm;
    border-bottom:
      0.3mm solid #e8dfd7;
  }

  .copyright-page dt,
  .colophon-page dt {
    color: #947e70;
    font-size: 8pt;
    font-weight: 800;
  }

  .copyright-page dd,
  .colophon-page dd {
    margin: 0;
    color: #3e3028;
    font-size: 8.5pt;
    line-height: 1.55;
    word-break: break-word;
  }

  .copyright-notice {
    margin: 0;
    padding: 4mm;
    border-radius: 3mm;
    color: #705d51;
    background: #f5eee7;
    font-size: 7.5pt;
    line-height: 1.75;
  }

  .contents-list {
    margin-top: 8mm;
    display: grid;
    gap: 5mm;
  }

  .contents-row {
    display: grid;
    grid-template-columns:
      auto minmax(12mm, 1fr) auto;
    align-items: end;
    gap: 3mm;
  }

  .contents-row span {
    font-family:
      "Noto Serif KR",
      "Batang",
      serif;
    font-size: 11pt;
    font-weight: 700;
  }

  .contents-row i {
    min-width: 10mm;
    border-bottom:
      0.3mm dotted #bca99a;
  }

  .contents-row strong {
    color: #aa745b;
    font-size: 8pt;
  }

  .chapter-opener {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background:
      linear-gradient(
        145deg,
        #5c4437,
        #c58b69
      );
  }

  .chapter-opener > img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .chapter-opener-overlay {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(
        180deg,
        rgba(27, 19, 15, 0.1),
        rgba(27, 19, 15, 0.78)
      );
  }

  .chapter-opener-content {
    position: absolute;
    z-index: 1;
    left: 16mm;
    right: 16mm;
    bottom: 24mm;
    color: #ffffff;
  }

  .chapter-opener-content p {
    margin: 0;
    color: #f1c49b;
    font-size: 8pt;
    font-weight: 900;
    letter-spacing: 0.14em;
  }

  .chapter-opener-content h2 {
    max-width: 105mm;
    margin: 5mm 0 0;
    font-family:
      "Noto Serif KR",
      "Batang",
      serif;
    font-size: 27pt;
    line-height: 1.35;
    letter-spacing: -0.05em;
    word-break: keep-all;
  }

  .chapter-opener-content span {
    max-width: 100mm;
    margin-top: 5mm;
    display: block;
    color: #f5e5d7;
    font-size: 10pt;
    line-height: 1.8;
    word-break: keep-all;
  }

  .text-block-list {
    margin-top: 8mm;
  }

  .text-block {
    margin-bottom: 5mm;
  }

  .text-block h3 {
    margin: 0 0 4mm;
    color: #4b3428;
    font-family:
      "Noto Serif KR",
      "Batang",
      serif;
    font-size: 14pt;
    line-height: 1.5;
    letter-spacing: -0.03em;
  }

  .text-block p {
    margin: 0;
    color: #3f332c;
    font-family:
      "Noto Serif KR",
      "Batang",
      serif;
    font-size: 10.2pt;
    line-height: 1.92;
    letter-spacing: -0.015em;
    text-align: justify;
    white-space: pre-line;
    word-break: keep-all;
    overflow-wrap: break-word;
  }

  .photo-page {
    display: flex;
    flex-direction: column;
  }

  .photo-page-kicker {
    margin: 0 0 5mm;
    color: #c56b4f;
    font-size: 8pt;
    font-weight: 900;
    letter-spacing: 0.12em;
  }

  .single-photo-frame {
    flex: 1;
    min-height: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
    border-radius: 2mm;
    background: #eee8e2;
  }

  .single-photo-frame img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .single-photo-frame[data-fit="COVER"] img {
    object-fit: cover;
  }

  .photo-caption {
    margin: 5mm 3mm 0;
    color: #5f4d43;
    font-family:
      "Noto Serif KR",
      "Batang",
      serif;
    font-size: 9pt;
    line-height: 1.65;
    text-align: center;
  }

  .missing-photo {
    flex: 1;
    display: grid;
    place-items: center;
    border: 0.4mm dashed #c9b8a9;
    color: #9a8171;
    font-size: 9pt;
  }

  .gallery-grid {
    height: calc(100% - 27mm);
    margin-top: 7mm;
    display: grid;
    grid-template-rows:
      repeat(2, minmax(0, 1fr));
    gap: 6mm;
  }

  .gallery-grid[data-count="1"] {
    grid-template-rows:
      minmax(0, 1fr);
  }

  .gallery-grid figure {
    min-height: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
  }

  .gallery-photo-frame {
    flex: 1;
    min-height: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
    border-radius: 2mm;
    background: #eee8e2;
  }

  .gallery-photo-frame img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .gallery-photo-frame[data-fit="COVER"] img {
    object-fit: cover;
  }

  .gallery-grid figcaption {
    margin-top: 3mm;
    color: #67564b;
    font-size: 8pt;
    line-height: 1.55;
    text-align: center;
  }

  .blank-page {
    height: 100%;
    display: grid;
    place-items: center;
  }

  .blank-page span {
    color: transparent;
    font-size: 1px;
  }

  .colophon-page {
    height: 100%;
    padding: 23mm 18mm;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .colophon-page h2 {
    margin: 5mm 0 0;
    font-family:
      "Noto Serif KR",
      "Batang",
      serif;
    font-size: 23pt;
    line-height: 1.4;
  }

  .colophon-page > p:not(.page-kicker) {
    margin: 9mm 0 0;
    color: #665349;
    font-family:
      "Noto Serif KR",
      "Batang",
      serif;
    font-size: 11pt;
    line-height: 1.9;
  }

  .colophon-line {
    width: 18mm;
    height: 0.7mm;
    margin: 12mm 0;
    background: #c78c65;
  }

  .colophon-brand {
    margin-top: 12mm;
    color: #b46e4e;
    font-size: 10pt;
  }

  @media screen and (max-width: 700px) {
    .pdf-preview-header {
      margin:
        12px 10px 0;
      align-items: flex-start;
      flex-direction: column;
    }

    .pdf-preview-status {
      justify-content: flex-start;
    }

    .pdf-stage {
      padding:
        16px 0 40px;
      overflow-x: auto;
    }

    .pdf-book {
      width: 148mm;
      margin: 0 auto;
    }

    .book-page {
      box-shadow: none;
    }
  }

  @media print {
    html,
    body {
      width: 148mm;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      -webkit-print-color-adjust:
        exact !important;
      print-color-adjust:
        exact !important;
    }

    .pdf-preview-header {
      display: none !important;
    }

    .pdf-stage {
      padding: 0 !important;
    }

    .pdf-book {
      display: block !important;
    }

    .book-page {
      width: 148mm !important;
      height: 210mm !important;
      margin: 0 !important;
      box-shadow: none !important;
      break-after: page !important;
      page-break-after:
        always !important;
    }

    .book-page:last-child {
      break-after: auto !important;
      page-break-after:
        auto !important;
    }
  }
`;