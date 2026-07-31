"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

const PAGE_SIZE = 10;

type EmailTypeFilter =
  | "ALL"
  | "SHIPPING"
  | "COMPLETION";

type EmailStatusFilter =
  | "ALL"
  | "SENT"
  | "SKIPPED"
  | "FAILED";

type AdminOrderEmailAuditFiltersProps = {
  loadedCount: number;
};

export default function AdminOrderEmailAuditFilters({
  loadedCount,
}: AdminOrderEmailAuditFiltersProps) {
  const filterRootRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const [
    typeFilter,
    setTypeFilter,
  ] = useState<EmailTypeFilter>(
    "ALL",
  );

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<EmailStatusFilter>(
    "ALL",
  );

  const [
    visibleLimit,
    setVisibleLimit,
  ] = useState(PAGE_SIZE);

  const [
    matchedCount,
    setMatchedCount,
  ] = useState(loadedCount);

  const [
    visibleCount,
    setVisibleCount,
  ] = useState(
    Math.min(
      loadedCount,
      PAGE_SIZE,
    ),
  );

  const hasActiveFilter =
    typeFilter !== "ALL" ||
    statusFilter !== "ALL";

  const remainingCount =
    Math.max(
      matchedCount -
        visibleCount,
      0,
    );

  const nextLoadCount =
    Math.min(
      PAGE_SIZE,
      remainingCount,
    );

  const hasMoreRecords =
    remainingCount > 0;

  useEffect(() => {
    setVisibleLimit(
      PAGE_SIZE,
    );
  }, [
    loadedCount,
    statusFilter,
    typeFilter,
  ]);

  useEffect(() => {
    const section =
      filterRootRef.current?.closest(
        ".admin-order-email-audit",
      );

    if (!section) {
      return;
    }

    const items =
      Array.from(
        section.querySelectorAll<HTMLElement>(
          '[data-email-audit-item="true"]',
        ),
      );

    let nextMatchedCount = 0;
    let nextVisibleCount = 0;

    items.forEach((item) => {
      const emailType =
        item.dataset.emailType;

      const emailStatus =
        item.dataset.emailStatus;

      const matchesType =
        typeFilter === "ALL" ||
        emailType === typeFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        emailStatus === statusFilter;

      const matchesFilters =
        matchesType &&
        matchesStatus;

      if (matchesFilters) {
        nextMatchedCount += 1;
      }

      const isVisible =
        matchesFilters &&
        nextMatchedCount <=
          visibleLimit;

      item.hidden = !isVisible;

      if (isVisible) {
        nextVisibleCount += 1;
      }
    });

    setMatchedCount(
      nextMatchedCount,
    );

    setVisibleCount(
      nextVisibleCount,
    );
  }, [
    loadedCount,
    statusFilter,
    typeFilter,
    visibleLimit,
  ]);

  const resetFilters = () => {
    setTypeFilter("ALL");
    setStatusFilter("ALL");
    setVisibleLimit(
      PAGE_SIZE,
    );
  };

  const showMoreRecords =
    () => {
      setVisibleLimit(
        (currentLimit) =>
          currentLimit +
          PAGE_SIZE,
      );
    };

  return (
    <div
      ref={filterRootRef}
      className="admin-order-email-audit-filters"
    >
      <div className="admin-order-email-audit-filter-fields">
        <label>
          <span>
            알림 종류
          </span>

          <select
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(
                event.target
                  .value as EmailTypeFilter,
              );
            }}
          >
            <option value="ALL">
              전체 알림
            </option>

            <option value="SHIPPING">
              배송 시작 안내
            </option>

            <option value="COMPLETION">
              제작 완료 안내
            </option>
          </select>
        </label>

        <label>
          <span>
            발송 상태
          </span>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(
                event.target
                  .value as EmailStatusFilter,
              );
            }}
          >
            <option value="ALL">
              전체 상태
            </option>

            <option value="SENT">
              발송 성공
            </option>

            <option value="SKIPPED">
              발송 건너뜀
            </option>

            <option value="FAILED">
              발송 실패
            </option>
          </select>
        </label>

        <button
          type="button"
          onClick={resetFilters}
          disabled={!hasActiveFilter}
        >
          필터 초기화
        </button>
      </div>

      <div
        className="admin-order-email-audit-filter-result"
        aria-live="polite"
      >
        <strong>
          현재{" "}
          {visibleCount.toLocaleString()}
          건 표시
        </strong>

        <span>
          조건 일치{" "}
          {matchedCount.toLocaleString()}
          건
        </span>

        <span>
          최근 불러온 기록{" "}
          {loadedCount.toLocaleString()}
          건 중
        </span>
      </div>

      {matchedCount === 0 ? (
        <p
          className="admin-order-email-audit-filter-empty"
          role="status"
        >
          선택한 조건에 맞는 이메일
          발송 기록이 없습니다.
        </p>
      ) : null}

      {hasMoreRecords ? (
        <button
          className="admin-order-email-audit-load-more"
          type="button"
          onClick={showMoreRecords}
        >
          이전 기록{" "}
          {nextLoadCount.toLocaleString()}
          건 더 보기
        </button>
      ) : null}

      {matchedCount > 0 &&
      !hasMoreRecords ? (
        <p className="admin-order-email-audit-load-complete">
          불러온 기록을 모두
          표시했습니다.
        </p>
      ) : null}

      <style jsx>
        {`
          .admin-order-email-audit-filters {
            margin: 18px 0;
            padding: 14px;
            border: 1px solid #eaded8;
            border-radius: 14px;
            background: #fffaf7;
          }

          .admin-order-email-audit-filter-fields {
            display: grid;
            grid-template-columns:
              minmax(150px, 1fr)
              minmax(150px, 1fr)
              auto;
            gap: 10px;
            align-items: end;
          }

          .admin-order-email-audit-filter-fields label {
            display: block;
          }

          .admin-order-email-audit-filter-fields label span {
            display: block;
            margin-bottom: 6px;
            color: #765449;
            font-size: 9.6px;
            font-weight: 900;
          }

          .admin-order-email-audit-filter-fields select {
            width: 100%;
            min-height: 40px;
            padding: 0 34px 0 11px;
            border: 1px solid #ddc6bc;
            border-radius: 10px;
            color: #4c382f;
            background: #ffffff;
            font: inherit;
            font-size: 10.8px;
            outline: none;
            cursor: pointer;
          }

          .admin-order-email-audit-filter-fields select:focus {
            border-color: #df6550;
            box-shadow:
              0 0 0 3px
              rgba(223, 101, 80, 0.1);
          }

          .admin-order-email-audit-filter-fields button {
            min-height: 40px;
            padding: 0 14px;
            border: 1px solid #d3a693;
            border-radius: 10px;
            color: #754c3e;
            background: #ffffff;
            font: inherit;
            font-size: 9.6px;
            font-weight: 900;
            white-space: nowrap;
            cursor: pointer;
          }

          .admin-order-email-audit-filter-fields button:hover:not(:disabled) {
            border-color: #df6550;
            color: #ffffff;
            background: #df6550;
          }

          .admin-order-email-audit-filter-fields button:disabled {
            cursor: default;
            opacity: 0.45;
          }

          .admin-order-email-audit-filter-result {
            margin-top: 11px;
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 5px 9px;
            color: #927a70;
            font-size: 9.6px;
          }

          .admin-order-email-audit-filter-result strong {
            color: #5e4338;
          }

          .admin-order-email-audit-filter-empty {
            margin: 11px 0 0;
            padding: 11px;
            border: 1px solid #ead9b4;
            border-radius: 10px;
            color: #806329;
            background: #fff8e6;
            font-size: 9.6px;
            line-height: 1.6;
            text-align: center;
          }

          .admin-order-email-audit-load-more {
            width: 100%;
            min-height: 42px;
            margin-top: 12px;
            border: 1px solid #d3a693;
            border-radius: 11px;
            color: #754c3e;
            background: #ffffff;
            font: inherit;
            font-size: 9.6px;
            font-weight: 900;
            cursor: pointer;
          }

          .admin-order-email-audit-load-more:hover {
            border-color: #df6550;
            color: #ffffff;
            background: #df6550;
          }

          .admin-order-email-audit-load-complete {
            margin: 12px 0 0;
            color: #927a70;
            font-size: 8.4px;
            line-height: 1.6;
            text-align: center;
          }

          @media (max-width: 720px) {
            .admin-order-email-audit-filter-fields {
              grid-template-columns: 1fr;
            }

            .admin-order-email-audit-filter-fields button {
              width: 100%;
            }

            .admin-order-email-audit-filter-result {
              align-items: flex-start;
              flex-direction: column;
              gap: 3px;
            }
          }
        `}
      </style>
    </div>
  );
}