"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useMemo,
  useState,
} from "react";

export type LibraryBookItem = {
  id: string;
  type: string;
  title: string;
  status: string;
  summary: string | null;
  pageCount: number | null;
  basedPhotoCount: number | null;
  basedStoryCount: number | null;
  createdAt: string;
  updatedAt: string;
  coverMemoryId: string | null;
  hasProductionRequest: boolean;
  productionRequestStatus:
    | string
    | null;
  orderStatus: string | null;
  orderId: string | null;
  orderProductName: string | null;
  orderQuantity: number | null;
  orderProductAmount: number | null;
  orderShippingFee: number | null;
  orderTotalAmount: number | null;
};

type Props = {
  books: LibraryBookItem[];
};

type FilterKey =
  | "ALL"
  | "DRAFT"
  | "PROGRESS"
  | "PAYMENT"
  | "DONE";

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

const PRODUCTION_LABEL: Record<
  string,
  string
> = {
  REQUESTED: "상담 접수",
  CONTACTED: "상담 연락",
  IN_PROGRESS: "제작 상담 중",
  COMPLETED: "상담 완료",
  CANCELED: "상담 취소",
};

const ORDER_LABEL: Record<string, string> = {
  READY: "결제 준비",
  FAILED: "결제 재시도",
  PAID: "결제 완료",
  IN_PRODUCTION: "인쇄 제작 중",
  COMPLETED: "제작 완료",
  CANCELED: "주문 취소",
};

const FILTERS: Array<{
  key: FilterKey;
  label: string;
}> = [
  {
    key: "ALL",
    label: "전체",
  },
  {
    key: "DRAFT",
    label: "원고 초안",
  },
  {
    key: "PROGRESS",
    label: "상담·제작",
  },
  {
    key: "PAYMENT",
    label: "결제 필요",
  },
  {
    key: "DONE",
    label: "완성",
  },
];

export default function LibraryBookList({
  books,
}: Props) {
  const router = useRouter();

  const [query, setQuery] =
    useState("");

  const [filter, setFilter] =
    useState<FilterKey>("ALL");

  const [selectedIds, setSelectedIds] =
    useState<string[]>([]);

  const [isDeleting, setIsDeleting] =
    useState(false);

  const filteredBooks = useMemo(() => {
    const normalizedQuery =
      query.trim().toLowerCase();

    return books.filter((book) => {
      if (
        normalizedQuery &&
        ![
          book.title,
          book.summary || "",
          TYPE_LABEL[book.type] || "",
          STATUS_LABEL[book.status] || "",
          book.orderProductName || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)
      ) {
        return false;
      }

      return matchesFilter(
        book,
        filter,
      );
    });
  }, [books, filter, query]);

  const visibleIds =
    filteredBooks.map(
      (book) => book.id,
    );

  const selectedCount =
    selectedIds.length;

  const allVisibleSelected =
    visibleIds.length > 0 &&
    visibleIds.every((id) =>
      selectedIds.includes(id),
    );

  const toggleBook = (
    bookId: string,
  ) => {
    setSelectedIds((current) =>
      current.includes(bookId)
        ? current.filter(
            (id) => id !== bookId,
          )
        : [...current, bookId],
    );
  };

  const toggleVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((current) =>
        current.filter(
          (id) =>
            !visibleIds.includes(id),
        ),
      );
      return;
    }

    setSelectedIds((current) =>
      Array.from(
        new Set([
          ...current,
          ...visibleIds,
        ]),
      ),
    );
  };

  const handleBulkDelete =
    async () => {
      if (
        isDeleting ||
        selectedIds.length === 0
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          `선택한 책 ${selectedIds.length}권을 삭제할까요?\n삭제한 책은 복구할 수 없습니다.\n원본 사진과 이야기는 삭제되지 않습니다.`,
        );

      if (!confirmed) {
        return;
      }

      setIsDeleting(true);

      try {
        const response = await fetch(
          "/api/book/bulk-delete",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              bookIds: selectedIds,
            }),
          },
        );

        const result =
          (await response.json()) as {
            ok?: boolean;
            message?: string;
            deletedCount?: number;
          };

        if (
          !response.ok ||
          !result.ok
        ) {
          alert(
            result.message ||
              "선택한 책을 삭제하지 못했습니다.",
          );
          return;
        }

        alert(
          result.message ||
            `선택한 책 ${
              result.deletedCount ??
              selectedIds.length
            }권을 삭제했습니다.`,
        );

        setSelectedIds([]);
        router.refresh();
      } catch {
        alert(
          "책을 삭제하는 중 오류가 발생했습니다.",
        );
      } finally {
        setIsDeleting(false);
      }
    };

  if (books.length === 0) {
    return <EmptyLibrary />;
  }

  return (
    <div className="library-book-list">
      <style>{libraryBookListStyles}</style>

      <section className="library-book-toolbar">
        <div className="library-book-search">
          <span aria-hidden="true">
            <SearchIcon />
          </span>

          <input
            type="search"
            value={query}
            onChange={(event) =>
              setQuery(
                event.target.value,
              )
            }
            placeholder="책 제목이나 종류를 검색하세요"
            aria-label="내 책 검색"
          />

          {query ? (
            <button
              type="button"
              onClick={() =>
                setQuery("")
              }
              aria-label="검색어 지우기"
            >
              ×
            </button>
          ) : null}
        </div>

        <div
          className="library-book-filters"
          role="tablist"
          aria-label="책 상태 필터"
        >
          {FILTERS.map((item) => {
            const count =
              books.filter((book) =>
                matchesFilter(
                  book,
                  item.key,
                ),
              ).length;

            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={
                  filter === item.key
                }
                data-active={
                  filter === item.key
                    ? "true"
                    : "false"
                }
                onClick={() =>
                  setFilter(item.key)
                }
              >
                {item.label}
                <small>{count}</small>
              </button>
            );
          })}
        </div>
      </section>

      <section className="library-book-selection">
        <div>
          <button
            type="button"
            onClick={toggleVisible}
            disabled={
              visibleIds.length === 0
            }
          >
            {allVisibleSelected
              ? "보이는 책 선택 해제"
              : "보이는 책 전체 선택"}
          </button>

          <button
            type="button"
            onClick={() =>
              setSelectedIds([])
            }
            disabled={
              selectedCount === 0
            }
          >
            선택 해제
          </button>
        </div>

        <div>
          <strong>
            선택 {selectedCount}권
          </strong>

          <button
            type="button"
            data-delete="true"
            onClick={handleBulkDelete}
            disabled={
              selectedCount === 0 ||
              isDeleting
            }
          >
            {isDeleting
              ? "삭제 중..."
              : "선택 삭제"}
          </button>
        </div>
      </section>

      {filteredBooks.length > 0 ? (
        <div className="library-book-grid">
          {filteredBooks.map(
            (book, index) => (
              <BookCard
                key={book.id}
                book={book}
                index={index}
                selected={selectedIds.includes(
                  book.id,
                )}
                onToggle={() =>
                  toggleBook(book.id)
                }
              />
            ),
          )}

          <Link
            href="/dashboard/book"
            className="library-new-book-card"
          >
            <span aria-hidden="true">
              +
            </span>

            <strong>
              새 책 원고 만들기
            </strong>

            <p>
              모아 둔 사진과 이야기를
              골라 새로운 원고를
              만듭니다.
            </p>
          </Link>
        </div>
      ) : (
        <div className="library-filter-empty">
          <span aria-hidden="true">
            <SearchIcon />
          </span>

          <strong>
            조건에 맞는 책이 없습니다.
          </strong>

          <p>
            검색어를 지우거나 다른 상태
            필터를 선택해 주세요.
          </p>

          <button
            type="button"
            onClick={() => {
              setQuery("");
              setFilter("ALL");
            }}
          >
            전체 책 보기
          </button>
        </div>
      )}
    </div>
  );
}

function BookCard({
  book,
  index,
  selected,
  onToggle,
}: {
  book: LibraryBookItem;
  index: number;
  selected: boolean;
  onToggle: () => void;
}) {
  const action =
    getPrimaryAction(book);

  const fallbackCover =
    `/dashboard/library-reference-v1/sample-library-${
      (index % 6) + 1
    }.webp`;

  return (
    <article
      className="library-book-card"
      data-selected={
        selected ? "true" : "false"
      }
    >
      <label className="library-book-checkbox">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
        />

        <span>
          {selected
            ? "선택됨"
            : "선택"}
        </span>
      </label>

      <div className="library-book-cover-wrap">
        <Link
          href={`/dashboard/library/${book.id}`}
          className="library-book-cover"
        >
          <img
            src={
              book.coverMemoryId
                ? `/api/blob/${book.coverMemoryId}`
                : fallbackCover
            }
            alt={`${book.title} 표지`}
          />

          <span>
            {TYPE_LABEL[book.type] ||
              "스토리북"}
          </span>
        </Link>
      </div>

      <div className="library-book-card-body">
        <div className="library-book-card-meta">
          <span>
            {TYPE_LABEL[book.type] ||
              "책 원고"}
          </span>

          <time>
            {formatDate(
              book.createdAt,
            )}
          </time>
        </div>

        <Link
          href={`/dashboard/library/${book.id}`}
          className="library-book-title"
        >
          {book.title}
        </Link>

        <p className="library-book-summary">
          {shorten(
            book.summary ||
              "사진과 이야기를 바탕으로 만든 책 원고입니다.",
            92,
          )}
        </p>

        <div className="library-book-badges">
          <StatusBadge
            label={
              STATUS_LABEL[
                book.status
              ] ||
              "상태 확인"
            }
            tone={
              book.status ===
              "PUBLISHED"
                ? "green"
                : book.status ===
                    "IN_PRODUCTION"
                  ? "blue"
                  : "cream"
            }
          />

          {book.orderStatus ? (
            <StatusBadge
              label={
                ORDER_LABEL[
                  book.orderStatus
                ] ||
                "주문 상태"
              }
              tone={
                ["READY", "FAILED"].includes(
                  book.orderStatus,
                )
                  ? "coral"
                  : book.orderStatus ===
                      "COMPLETED"
                    ? "green"
                    : "blue"
              }
            />
          ) : book.productionRequestStatus ? (
            <StatusBadge
              label={
                PRODUCTION_LABEL[
                  book
                    .productionRequestStatus
                ] ||
                "상담 상태"
              }
              tone="mint"
            />
          ) : (
            <StatusBadge
              label="제작 미신청"
              tone="gray"
            />
          )}
        </div>

        <div className="library-book-source">
          <span>
            사진{" "}
            {book.basedPhotoCount || 0}장
          </span>

          <span>
            이야기{" "}
            {book.basedStoryCount || 0}개
          </span>

          <span>
            {book.pageCount
              ? `${book.pageCount}쪽`
              : "분량 확인 전"}
          </span>
        </div>

        {book.orderStatus ? (
          <div className="library-book-order">
            <div>
              <span>주문 금액</span>

              <strong>
                {(
                  book.orderTotalAmount ||
                  0
                ).toLocaleString()}
                원
              </strong>
            </div>

            <div>
              <span>수량</span>

              <strong>
                {book.orderQuantity ||
                  0}
                권
              </strong>
            </div>
          </div>
        ) : null}

        <div className="library-book-actions">
          <Link
            href={action.href}
            data-primary="true"
          >
            {action.label}
            <span aria-hidden="true">
              →
            </span>
          </Link>

          <Link
            href={`/dashboard/library/${book.id}/print`}
          >
            인쇄용 원고
          </Link>
        </div>
      </div>
    </article>
  );
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone:
    | "coral"
    | "cream"
    | "mint"
    | "blue"
    | "green"
    | "gray";
}) {
  return (
    <span
      className="library-book-status"
      data-tone={tone}
    >
      {label}
    </span>
  );
}

function EmptyLibrary() {
  return (
    <section className="library-empty">
      <style>{libraryBookListStyles}</style>

      <div className="library-empty-covers">
        {[1, 2, 3].map(
          (number) => (
            <span key={number}>
              <img
                src={`/dashboard/library-reference-v1/sample-library-${number}.webp`}
                alt=""
              />
            </span>
          ),
        )}
      </div>

      <p>아직 저장된 책이 없습니다</p>

      <h2>
        첫 번째 이야기를
        <br />
        한 권의 책으로 만들어보세요
      </h2>

      <span>
        사진 3장 이상을 모으면
        기본 원고 만들기를 시작할 수
        있습니다.
      </span>

      <div>
        <Link href="/dashboard/timeline">
          사진 올리기
        </Link>

        <Link href="/dashboard/book">
          첫 책 만들기
          <span aria-hidden="true">
            →
          </span>
        </Link>
      </div>
    </section>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
    >
      <circle
        cx="17"
        cy="17"
        r="10"
        stroke="currentColor"
        strokeWidth="2.7"
      />

      <path
        d="m25 25 9 9"
        stroke="currentColor"
        strokeWidth="2.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function matchesFilter(
  book: LibraryBookItem,
  filter: FilterKey,
) {
  if (filter === "ALL") {
    return true;
  }

  if (filter === "DRAFT") {
    return book.status === "DRAFT";
  }

  if (filter === "PAYMENT") {
    return ["READY", "FAILED"].includes(
      book.orderStatus || "",
    );
  }

  if (filter === "DONE") {
    return (
      book.status === "PUBLISHED" ||
      book.orderStatus ===
        "COMPLETED"
    );
  }

  return (
    book.status ===
      "IN_PRODUCTION" ||
    [
      "REQUESTED",
      "CONTACTED",
      "IN_PROGRESS",
    ].includes(
      book.productionRequestStatus ||
        "",
    ) ||
    [
      "PAID",
      "IN_PRODUCTION",
    ].includes(
      book.orderStatus || "",
    )
  );
}

function getPrimaryAction(
  book: LibraryBookItem,
) {
  if (
    ["READY", "FAILED"].includes(
      book.orderStatus || "",
    )
  ) {
    return {
      href: `/dashboard/library/${book.id}/checkout`,
      label:
        book.orderStatus ===
        "FAILED"
          ? "결제 다시 하기"
          : "결제 화면",
    };
  }

  if (
    [
      "PAID",
      "IN_PRODUCTION",
      "COMPLETED",
    ].includes(
      book.orderStatus || "",
    )
  ) {
    return {
      href: `/dashboard/library/${book.id}`,
      label: "제작 상태 보기",
    };
  }

  if (
    book.hasProductionRequest
  ) {
    return {
      href: `/dashboard/library/${book.id}`,
      label: "상담 상태 보기",
    };
  }

  return {
    href: `/dashboard/library/${book.id}`,
    label:
      book.pageCount &&
      book.pageCount > 0
        ? "책 원고 보기"
        : "원고 확인",
  };
}

function shorten(
  text: string,
  maxLength: number,
) {
  const normalized =
    text.replace(/\s+/g, " ").trim();

  if (
    normalized.length <= maxLength
  ) {
    return normalized;
  }

  return `${normalized
    .slice(0, maxLength)
    .trim()}…`;
}

function formatDate(
  value: string,
) {
  const date = new Date(value);

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

const libraryBookListStyles = `
  .library-book-list,
  .library-book-list * {
    box-sizing: border-box;
  }

  .library-book-toolbar {
    margin-top: 20px;
    padding: 14px;
    display: grid;
    grid-template-columns:
      minmax(260px, 0.85fr)
      minmax(420px, 1.15fr);
    align-items: center;
    gap: 12px;
    border:
      1px solid
      rgba(136, 94, 74, 0.12);
    border-radius: 18px;
    background: #fff9f5;
  }

  .library-book-search {
    position: relative;
  }

  .library-book-search > span {
    position: absolute;
    left: 13px;
    top: 50%;
    width: 22px;
    height: 22px;
    color: #9a7d70;
    transform: translateY(-50%);
    pointer-events: none;
  }

  .library-book-search svg {
    width: 100%;
    height: 100%;
  }

  .library-book-search input {
    width: 100%;
    height: 46px;
    padding: 0 43px;
    border:
      1px solid
      rgba(142, 99, 78, 0.22);
    border-radius: 13px;
    color: #49362d;
    background: #ffffff;
    font: inherit;
    font-size: 12px;
  }

  .library-book-search button {
    position: absolute;
    right: 8px;
    top: 50%;
    width: 31px;
    height: 31px;
    border: 0;
    border-radius: 50%;
    color: #8d756a;
    background: #f7ebe5;
    font-size: 19px;
    transform: translateY(-50%);
    cursor: pointer;
  }

  .library-book-search button:hover {
    transform:
      translateY(-50%)
      translateY(-1px);
  }

  .library-book-filters {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
    overflow-x: auto;
  }

  .library-book-filters button {
    min-height: 40px;
    padding: 0 11px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex: 0 0 auto;
    border:
      1px solid
      rgba(142, 99, 78, 0.18);
    border-radius: 11px;
    color: #72594e;
    background: #ffffff;
    font-size: 10px;
    font-weight: 900;
    cursor: pointer;
  }

  .library-book-filters button[data-active="true"] {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
  }

  .library-book-filters small {
    min-width: 19px;
    height: 19px;
    padding: 0 5px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    color: inherit;
    background:
      rgba(120, 82, 64, 0.09);
    font-size: 8px;
  }

  .library-book-filters
  button[data-active="true"]
  small {
    background:
      rgba(255, 255, 255, 0.22);
  }

  .library-book-selection {
    margin-top: 11px;
    padding: 10px 13px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border-radius: 14px;
    background: #f8f5ee;
  }

  .library-book-selection > div {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 7px;
  }

  .library-book-selection button {
    min-height: 35px;
    padding: 0 11px;
    border:
      1px solid #d5b6a8;
    border-radius: 10px;
    color: #745448;
    background: #ffffff;
    font-size: 9px;
    font-weight: 900;
    cursor: pointer;
  }

  .library-book-selection button[data-delete="true"] {
    border-color: #d98d80;
    color: #b44436;
    background: #fff4f1;
  }

  .library-book-selection button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .library-book-selection strong {
    color: #70594f;
    font-size: 10px;
  }

  .library-book-grid {
    margin-top: 15px;
    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
    gap: 14px;
    align-items: stretch;
  }

  .library-book-card {
    position: relative;
    min-width: 0;
    padding: 15px;
    display: grid;
    grid-template-columns:
      145px minmax(0, 1fr);
    gap: 16px;
    overflow: hidden;
    border:
      1px solid
      rgba(136, 94, 74, 0.14);
    border-radius: 20px;
    background:
      linear-gradient(
        145deg,
        #ffffff,
        #fff9f5
      );
    box-shadow:
      0 12px 28px
      rgba(83, 53, 40, 0.055);
  }

  .library-book-card[data-selected="true"] {
    border-color: #ef7862;
    box-shadow:
      0 0 0 3px
      rgba(239, 120, 98, 0.13),
      0 15px 31px
      rgba(83, 53, 40, 0.08);
  }

  .library-book-checkbox {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 4;
    min-height: 28px;
    padding: 0 8px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    border-radius: 999px;
    color: #74594e;
    background:
      rgba(255, 255, 255, 0.91);
    box-shadow:
      0 4px 11px
      rgba(78, 48, 35, 0.1);
    font-size: 8px;
    font-weight: 900;
    cursor: pointer;
  }

  .library-book-checkbox input {
    width: 14px;
    height: 14px;
    accent-color: #ef6a54;
  }

  .library-book-cover-wrap {
    min-width: 0;
    padding: 4px 0 4px 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .library-book-cover {
    position: relative;
    width: 128px;
    aspect-ratio: 0.72 / 1;
    display: block;
    overflow: hidden;
    border:
      5px solid #ffffff;
    border-radius: 6px;
    background: #e8ddd3;
    box-shadow:
      0 13px 26px
      rgba(60, 38, 29, 0.19);
  }

  .library-book-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .library-book-cover > span {
    position: absolute;
    inset: 0;
    padding: 16px 10px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    color: #ffffff;
    background:
      linear-gradient(
        180deg,
        transparent 43%,
        rgba(29, 18, 13, 0.69)
      );
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 10px;
    font-weight: 900;
    line-height: 1.45;
    text-align: center;
    text-shadow:
      0 2px 7px
      rgba(0, 0, 0, 0.45);
  }

  .library-book-card-body {
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .library-book-card-meta {
    padding-right: 57px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .library-book-card-meta span {
    color: #e0644e;
    font-size: 9px;
    font-weight: 900;
  }

  .library-book-card-meta time {
    color: #a18a7f;
    font-size: 8px;
  }

  .library-book-title {
    margin-top: 7px;
    display: block;
    overflow: hidden;
    color: #423027;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 17px;
    font-weight: 900;
    line-height: 1.45;
    letter-spacing: -0.035em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .library-book-summary {
    min-height: 50px;
    margin: 6px 0 0;
    display: -webkit-box;
    overflow: hidden;
    color: #735f56;
    font-size: 9px;
    line-height: 1.65;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }

  .library-book-badges {
    margin-top: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  .library-book-status {
    min-height: 23px;
    padding: 0 7px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    font-size: 8px;
    font-weight: 900;
  }

  .library-book-status[data-tone="coral"] {
    color: #b84836;
    background: #ffe8e2;
  }

  .library-book-status[data-tone="cream"] {
    color: #845b1e;
    background: #fff1cf;
  }

  .library-book-status[data-tone="mint"] {
    color: #33725b;
    background: #e8f5ee;
  }

  .library-book-status[data-tone="blue"] {
    color: #3f668e;
    background: #eaf3ff;
  }

  .library-book-status[data-tone="green"] {
    color: #4b713c;
    background: #edf7e8;
  }

  .library-book-status[data-tone="gray"] {
    color: #776c66;
    background: #f0ece9;
  }

  .library-book-source {
    margin-top: 9px;
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  .library-book-source span {
    min-height: 22px;
    padding: 0 7px;
    display: inline-flex;
    align-items: center;
    border:
      1px solid
      rgba(140, 97, 75, 0.13);
    border-radius: 7px;
    color: #806a60;
    background: #ffffff;
    font-size: 8px;
    font-weight: 800;
  }

  .library-book-order {
    margin-top: 9px;
    padding: 8px 10px;
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 8px;
    border-radius: 10px;
    background: #fff4e7;
  }

  .library-book-order > div {
    min-width: 0;
  }

  .library-book-order span,
  .library-book-order strong {
    display: block;
  }

  .library-book-order span {
    color: #8c756a;
    font-size: 7px;
  }

  .library-book-order strong {
    margin-top: 3px;
    overflow: hidden;
    color: #d95d47;
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .library-book-actions {
    margin-top: auto;
    padding-top: 11px;
    display: grid;
    grid-template-columns:
      1.3fr 0.7fr;
    gap: 7px;
  }

  .library-book-actions > a {
    min-height: 38px;
    padding: 0 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    border:
      1px solid #d6b4a3;
    border-radius: 10px;
    color: #795347;
    background: #ffffff;
    font-size: 9px;
    font-weight: 900;
  }

  .library-book-actions
  > a[data-primary="true"] {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
  }

  .library-new-book-card {
    min-height: 255px;
    padding: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    border:
      2px dashed #e4a18d;
    border-radius: 20px;
    color: #735449;
    background:
      linear-gradient(
        145deg,
        #fffaf6,
        #fff1e9
      );
    text-align: center;
  }

  .library-new-book-card > span {
    width: 55px;
    height: 55px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
    font-size: 31px;
  }

  .library-new-book-card strong {
    margin-top: 14px;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 18px;
  }

  .library-new-book-card p {
    max-width: 210px;
    margin: 7px 0 0;
    color: #7d675e;
    font-size: 10px;
    line-height: 1.7;
  }

  .library-filter-empty {
    margin-top: 16px;
    padding: 50px 20px;
    border:
      1px dashed #ddb2a1;
    border-radius: 18px;
    background: #fffaf7;
    text-align: center;
  }

  .library-filter-empty > span {
    width: 54px;
    height: 54px;
    margin: 0 auto;
    display: block;
    color: #e57059;
  }

  .library-filter-empty svg {
    width: 100%;
    height: 100%;
  }

  .library-filter-empty strong {
    display: block;
    margin-top: 12px;
    font-size: 17px;
  }

  .library-filter-empty p {
    margin: 6px 0 0;
    color: #806b61;
    font-size: 11px;
  }

  .library-filter-empty button {
    min-height: 41px;
    margin-top: 15px;
    padding: 0 14px;
    border: 0;
    border-radius: 11px;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
    font-size: 10px;
    font-weight: 900;
    cursor: pointer;
  }

  .library-empty {
    margin-top: 20px;
    padding: 42px 24px;
    border:
      1px dashed #dfad9d;
    border-radius: 22px;
    background:
      linear-gradient(
        145deg,
        #fffaf7,
        #fff4ec
      );
    text-align: center;
  }

  .library-empty-covers {
    min-height: 155px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 9px;
  }

  .library-empty-covers > span {
    width: 84px;
    aspect-ratio: 0.72 / 1;
    overflow: hidden;
    border:
      4px solid #ffffff;
    border-radius: 5px;
    box-shadow:
      0 12px 24px
      rgba(69, 43, 32, 0.17);
  }

  .library-empty-covers > span:nth-child(1) {
    transform: rotate(-6deg);
  }

  .library-empty-covers > span:nth-child(3) {
    transform: rotate(6deg);
  }

  .library-empty-covers img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .library-empty > p {
    margin: 17px 0 0;
    color: #e0644e;
    font-size: 10px;
    font-weight: 900;
  }

  .library-empty h2 {
    margin: 8px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 30px;
    line-height: 1.4;
    letter-spacing: -0.045em;
  }

  .library-empty > span {
    display: block;
    margin-top: 8px;
    color: #78645a;
    font-size: 11px;
    line-height: 1.7;
  }

  .library-empty > div:last-child {
    margin-top: 18px;
    display: flex;
    justify-content: center;
    gap: 8px;
  }

  .library-empty > div:last-child a {
    min-height: 43px;
    padding: 0 15px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border:
      1px solid #d4b0a0;
    border-radius: 12px;
    color: #785448;
    background: #ffffff;
    font-size: 10px;
    font-weight: 900;
    text-decoration: none;
  }

  .library-empty
  > div:last-child
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

  @media (max-width: 1180px) {
    .library-book-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 900px) {
    .library-book-toolbar {
      grid-template-columns: 1fr;
    }

    .library-book-filters {
      justify-content: flex-start;
    }
  }

  @media (max-width: 700px) {
    .library-book-selection {
      align-items: stretch;
      flex-direction: column;
    }

    .library-book-selection > div {
      width: 100%;
    }

    .library-book-selection button {
      flex: 1;
    }

    .library-book-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 470px) {
    .library-book-card {
      grid-template-columns:
        105px minmax(0, 1fr);
      padding: 11px;
      gap: 11px;
    }

    .library-book-cover {
      width: 95px;
    }

    .library-book-card-meta {
      padding-right: 45px;
      display: block;
    }

    .library-book-card-meta time {
      display: block;
      margin-top: 3px;
    }

    .library-book-title {
      font-size: 15px;
    }

    .library-book-summary {
      min-height: 42px;
      font-size: 8px;
      -webkit-line-clamp: 2;
    }

    .library-book-actions {
      grid-template-columns: 1fr;
    }

    .library-empty
    > div:last-child {
      flex-direction: column;
    }

    .library-empty
    > div:last-child a {
      justify-content: center;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .library-book-list a,
    .library-book-list button {
      transition: none;
    }
  }
`;
