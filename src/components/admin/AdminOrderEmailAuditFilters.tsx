"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

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
    visibleCount,
    setVisibleCount,
  ] = useState(loadedCount);

  const hasActiveFilter =
    typeFilter !== "ALL" ||
    statusFilter !== "ALL";

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

      const isVisible =
        matchesType &&
        matchesStatus;

      item.hidden = !isVisible;

      if (isVisible) {
        nextVisibleCount += 1;
      }
    });

    setVisibleCount(
      nextVisibleCount,
    );
  }, [
    loadedCount,
    statusFilter,
    typeFilter,
  ]);

  const resetFilters = () => {
    setTypeFilter("ALL");
    setStatusFilter("ALL");
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

      <div className="admin-order-email-audit-filter-result">
        <strong>
          현재 {visibleCount.toLocaleString()}건
        </strong>

        <span>
          최근 불러온 기록{" "}
          {loadedCount.toLocaleString()}건 중
        </span>
      </div>

      {visibleCount === 0 ? (
        <p
          className="admin-order-email-audit-filter-empty"
          role="status"
        >
          선택한 조건에 맞는 이메일
          발송 기록이 없습니다.
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
            font-size: 8px;
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
            font-size: 9px;
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
            font-size: 8px;
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
            gap: 7px;
            color: #927a70;
            font-size: 8px;
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
            font-size: 8px;
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