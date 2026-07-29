"use client";

import AdminOrderEmailRetryButton from "@/components/admin/AdminOrderEmailRetryButton";
import {
  useCallback,
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

type DatePreset =
  | "TODAY"
  | "LAST_7_DAYS"
  | "LAST_30_DAYS"
  | "THIS_MONTH";

export type AdminOrderEmailAuditLogItem = {
  id: string;
  action: string;
  summary: string;
  afterData: unknown;
  createdAt: string;
};

type AdminOrderEmailAuditClientProps = {
  orderRecordId: string;

  initialLogs:
    AdminOrderEmailAuditLogItem[];

  initialTotalCount: number;
  initialHasMore: boolean;

  initialNextCursor:
    string | null;
};

type EmailAuditApiResponse = {
  ok?: boolean;

  logs?:
    AdminOrderEmailAuditLogItem[];

  totalCount?: number;
  loadedCount?: number;
  hasMore?: boolean;

  nextCursor?:
    string | null;

  error?: string;
};

export default function AdminOrderEmailAuditClient({
  orderRecordId,
  initialLogs,
  initialTotalCount,
  initialHasMore,
  initialNextCursor,
}: AdminOrderEmailAuditClientProps) {
  const isFirstFilterRun =
    useRef(true);

  const isLoadingRef =
    useRef(false);

  const [
    logs,
    setLogs,
  ] = useState(
    initialLogs,
  );

  const [
    totalCount,
    setTotalCount,
  ] = useState(
    initialTotalCount,
  );

  const [
    hasMore,
    setHasMore,
  ] = useState(
    initialHasMore,
  );

  const [
    nextCursor,
    setNextCursor,
  ] = useState<
    string | null
  >(
    initialNextCursor,
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
    dateFrom,
    setDateFrom,
  ] = useState("");

  const [
    dateTo,
    setDateTo,
  ] = useState("");

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<
    string | null
  >(null);

  const hasInvalidDateRange =
    Boolean(
      dateFrom &&
      dateTo &&
      dateFrom > dateTo,
    );

  const fetchAuditLogs =
    useCallback(
      async ({
        cursor,
        append,
      }: {
        cursor:
          string | null;

        append:
          boolean;
      }) => {
        if (
          isLoadingRef.current
        ) {
          return;
        }

        if (
          hasInvalidDateRange
        ) {
          setErrorMessage(
            "조회 시작일은 종료일보다 늦을 수 없습니다.",
          );

          return;
        }

        isLoadingRef.current =
          true;

        setIsLoading(true);
        setErrorMessage(null);

        if (!append) {
          setLogs([]);
          setTotalCount(0);
          setHasMore(false);
          setNextCursor(null);
        }

        try {
          const searchParams =
            new URLSearchParams({
              type:
                typeFilter,

              status:
                statusFilter,

              limit:
                String(
                  PAGE_SIZE,
                ),
            });

          if (dateFrom) {
            searchParams.set(
              "dateFrom",
              dateFrom,
            );
          }

          if (dateTo) {
            searchParams.set(
              "dateTo",
              dateTo,
            );
          }

          if (cursor) {
            searchParams.set(
              "cursor",
              cursor,
            );
          }

          const response =
            await fetch(
              `/api/admin/orders/${encodeURIComponent(
                orderRecordId,
              )}/email-audit?${searchParams.toString()}`,
              {
                method: "GET",
                cache: "no-store",
              },
            );

          const result =
            (await response
              .json()
              .catch(
                () => null,
              )) as
              | EmailAuditApiResponse
              | null;

          if (!response.ok) {
            throw new Error(
              result?.error ||
                "이메일 발송 기록을 불러오지 못했습니다.",
            );
          }

          const receivedLogs =
            Array.isArray(
              result?.logs,
            )
              ? result.logs
              : [];

          setLogs(
            (currentLogs) => {
              if (!append) {
                return receivedLogs;
              }

              const existingIds =
                new Set(
                  currentLogs.map(
                    (log) =>
                      log.id,
                  ),
                );

              const newLogs =
                receivedLogs.filter(
                  (log) =>
                    !existingIds.has(
                      log.id,
                    ),
                );

              return [
                ...currentLogs,
                ...newLogs,
              ];
            },
          );

          setTotalCount(
            typeof result
              ?.totalCount ===
              "number"
              ? result.totalCount
              : receivedLogs.length,
          );

          setHasMore(
            result?.hasMore ===
              true,
          );

          setNextCursor(
            typeof result
              ?.nextCursor ===
              "string"
              ? result.nextCursor
              : null,
          );
        } catch (error) {
          setErrorMessage(
            error instanceof
              Error
              ? error.message
              : "이메일 발송 기록을 불러오는 중 오류가 발생했습니다.",
          );
        } finally {
          isLoadingRef.current =
            false;

          setIsLoading(false);
        }
      },
      [
        dateFrom,
        dateTo,
        hasInvalidDateRange,
        orderRecordId,
        statusFilter,
        typeFilter,
      ],
    );

  useEffect(() => {
    if (
      isFirstFilterRun.current
    ) {
      isFirstFilterRun.current =
        false;

      return;
    }

    void fetchAuditLogs({
      cursor: null,
      append: false,
    });
  }, [
    fetchAuditLogs,
  ]);

  const resetFilters =
    () => {
      setTypeFilter("ALL");
      setStatusFilter("ALL");
      setDateFrom("");
      setDateTo("");
      setErrorMessage(null);
    };

  const applyDatePreset =
    (
      preset:
        DatePreset,
    ) => {
      const today =
        getSeoulDateString();

      if (
        preset === "TODAY"
      ) {
        setDateFrom(today);
        setDateTo(today);
      }

      if (
        preset ===
        "LAST_7_DAYS"
      ) {
        setDateFrom(
          shiftSeoulDate(
            today,
            -6,
          ),
        );

        setDateTo(today);
      }

      if (
        preset ===
        "LAST_30_DAYS"
      ) {
        setDateFrom(
          shiftSeoulDate(
            today,
            -29,
          ),
        );

        setDateTo(today);
      }

      if (
        preset ===
        "THIS_MONTH"
      ) {
        setDateFrom(
          `${today.slice(
            0,
            7,
          )}-01`,
        );

        setDateTo(today);
      }

      setErrorMessage(null);
    };

  const loadMore =
    () => {
      if (
        !nextCursor ||
        !hasMore ||
        isLoading
      ) {
        return;
      }

      void fetchAuditLogs({
        cursor:
          nextCursor,

        append:
          true,
      });
    };

  const hasActiveFilter =
    typeFilter !== "ALL" ||
    statusFilter !== "ALL" ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  const csvDownloadParams =
    new URLSearchParams({
      type:
        typeFilter,

      status:
        statusFilter,

      format:
        "csv",
    });

  if (dateFrom) {
    csvDownloadParams.set(
      "dateFrom",
      dateFrom,
    );
  }

  if (dateTo) {
    csvDownloadParams.set(
      "dateTo",
      dateTo,
    );
  }

  const csvDownloadUrl =
    `/api/admin/orders/${encodeURIComponent(
      orderRecordId,
    )}/email-audit?${csvDownloadParams.toString()}`;

  const csvDownloadDisabled =
    isLoading ||
    hasInvalidDateRange;

  const activeDatePreset =
    getActiveDatePreset(
      dateFrom,
      dateTo,
    );

  return (
    <div className="admin-order-email-audit-client">
      <div className="admin-order-email-audit-filters">
        <div className="admin-order-email-audit-quick">
          <span>
            빠른 기간
          </span>

          <div>
            <button
              type="button"
              data-active={
                activeDatePreset ===
                "TODAY"
              }
              disabled={
                isLoading
              }
              onClick={() => {
                applyDatePreset(
                  "TODAY",
                );
              }}
            >
              오늘
            </button>

            <button
              type="button"
              data-active={
                activeDatePreset ===
                "LAST_7_DAYS"
              }
              disabled={
                isLoading
              }
              onClick={() => {
                applyDatePreset(
                  "LAST_7_DAYS",
                );
              }}
            >
              최근 7일
            </button>

            <button
              type="button"
              data-active={
                activeDatePreset ===
                "LAST_30_DAYS"
              }
              disabled={
                isLoading
              }
              onClick={() => {
                applyDatePreset(
                  "LAST_30_DAYS",
                );
              }}
            >
              최근 30일
            </button>

            <button
              type="button"
              data-active={
                activeDatePreset ===
                "THIS_MONTH"
              }
              disabled={
                isLoading
              }
              onClick={() => {
                applyDatePreset(
                  "THIS_MONTH",
                );
              }}
            >
              이번 달
            </button>
          </div>
        </div>

        <div className="admin-order-email-audit-filter-fields">
          <label>
            <span>
              알림 종류
            </span>

            <select
              value={
                typeFilter
              }
              disabled={
                isLoading
              }
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
              value={
                statusFilter
              }
              disabled={
                isLoading
              }
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

          <label>
            <span>
              조회 시작일
            </span>

            <input
              type="date"
              value={
                dateFrom
              }
              max={
                dateTo ||
                undefined
              }
              disabled={
                isLoading
              }
              onChange={(event) => {
                setDateFrom(
                  event.target.value,
                );

                setErrorMessage(null);
              }}
            />
          </label>

          <label>
            <span>
              조회 종료일
            </span>

            <input
              type="date"
              value={
                dateTo
              }
              min={
                dateFrom ||
                undefined
              }
              disabled={
                isLoading
              }
              onChange={(event) => {
                setDateTo(
                  event.target.value,
                );

                setErrorMessage(null);
              }}
            />
          </label>

          <button
            type="button"
            onClick={
              resetFilters
            }
            disabled={
              !hasActiveFilter ||
              isLoading
            }
          >
            필터 초기화
          </button>

          <a
            href={
              csvDownloadUrl
            }
            download
            aria-disabled={
              csvDownloadDisabled
            }
            onClick={(event) => {
              if (
                csvDownloadDisabled
              ) {
                event.preventDefault();
              }
            }}
          >
            CSV 내려받기
          </a>
        </div>

        <div
          className="admin-order-email-audit-filter-result"
          aria-live="polite"
        >
          <strong>
            현재{" "}
            {logs.length.toLocaleString()}
            건 표시
          </strong>

          <span>
            조건 일치{" "}
            {totalCount.toLocaleString()}
            건
          </span>

          {dateFrom ||
          dateTo ? (
            <span>
              조회 기간:{" "}
              {dateFrom ||
                "처음"}
              {" ~ "}
              {dateTo ||
                "현재"}
            </span>
          ) : null}
        </div>
      </div>

      {errorMessage ? (
        <div
          className="admin-order-email-audit-error"
          role="alert"
        >
          <p>
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={() => {
              void fetchAuditLogs({
                cursor: null,
                append: false,
              });
            }}
            disabled={
              isLoading ||
              hasInvalidDateRange
            }
          >
            다시 불러오기
          </button>
        </div>
      ) : null}

      {logs.length > 0 ? (
        <div className="admin-order-email-audit-list">
          {logs.map(
            (log) => {
              const status =
                getEmailStatus(
                  log.action,
                );

              const recipientEmail =
                readAuditString(
                  log.afterData,
                  "recipientEmail",
                );

              const reason =
                readAuditString(
                  log.afterData,
                  "reason",
                );

              const providerMessageId =
                readAuditString(
                  log.afterData,
                  "providerMessageId",
                );

              const defaultRecipientEmail =
                readAuditString(
                  log.afterData,
                  "defaultRecipientEmail",
                );

              const requestedRecipientEmail =
                readAuditString(
                  log.afterData,
                  "requestedRecipientEmail",
                );

              const emailOverridden =
                readAuditBoolean(
                  log.afterData,
                  "emailOverridden",
                );

              const recipientOverrideReason =
                readAuditString(
                  log.afterData,
                  "recipientOverrideReason",
                );

              return (
                <article
                  key={
                    log.id
                  }
                  data-status={
                    status
                  }
                >
                  <div className="admin-order-email-audit-top">
                    <div>
                      <span className="admin-order-email-audit-type">
                        {getEmailTypeLabel(
                          log.action,
                        )}
                      </span>

                      <span
                        className="admin-order-email-audit-status"
                        data-status={
                          status
                        }
                      >
                        {getEmailStatusLabel(
                          status,
                        )}
                      </span>

                      {emailOverridden ? (
                        <span className="admin-order-email-audit-override">
                          기본 이메일과
                          다른 주소
                        </span>
                      ) : null}
                    </div>

                    <time>
                      {formatDateTime(
                        log.createdAt,
                      )}
                    </time>
                  </div>

                  <h3>
                    {log.summary}
                  </h3>

                  <dl>
                    <div>
                      <dt>
                        수신 이메일
                      </dt>

                      <dd>
                        {recipientEmail ||
                          "수신 이메일 없음"}
                      </dd>
                    </div>

                    {reason ? (
                      <div>
                        <dt>
                          처리 사유
                        </dt>

                        <dd>
                          {getReasonLabel(
                            reason,
                          )}
                        </dd>
                      </div>
                    ) : null}

                    {providerMessageId ? (
                      <div>
                        <dt>
                          발송 메시지 ID
                        </dt>

                        <dd>
                          {providerMessageId}
                        </dd>
                      </div>
                    ) : null}

                    {emailOverridden ? (
                      <>
                        <div>
                          <dt>
                            기본 이메일
                          </dt>

                          <dd>
                            {defaultRecipientEmail ||
                              "기본 이메일 없음"}
                          </dd>
                        </div>

                        <div>
                          <dt>
                            변경 발송 이메일
                          </dt>

                          <dd>
                            {requestedRecipientEmail ||
                              recipientEmail ||
                              "발송 이메일 확인 필요"}
                          </dd>
                        </div>

                        <div>
                          <dt>
                            이메일 변경 사유
                          </dt>

                          <dd className="admin-order-email-audit-reason">
                            {recipientOverrideReason ||
                              "변경 사유 기록 없음"}
                          </dd>
                        </div>
                      </>
                    ) : null}
                  </dl>

                  {status !==
                  "SENT" ? (
                    <AdminOrderEmailRetryButton
                      orderRecordId={
                        orderRecordId
                      }
                      recipientEmail={
                        recipientEmail
                      }
                      defaultRecipientEmail={
                        defaultRecipientEmail
                      }
                      notificationType={
                        log.action.includes(
                          "SHIPPING",
                        )
                          ? "SHIPPING"
                          : "COMPLETION"
                      }
                    />
                  ) : null}
                </article>
              );
            },
          )}
        </div>
      ) : !isLoading ? (
        <div className="admin-order-email-audit-empty">
          선택한 조건에 맞는 고객
          알림 발송 기록이 없습니다.
        </div>
      ) : null}

      {isLoading ? (
        <div
          className="admin-order-email-audit-loading"
          role="status"
        >
          이메일 발송 기록을 불러오는
          중입니다.
        </div>
      ) : null}

      {!isLoading &&
      logs.length > 0 &&
      hasMore ? (
        <button
          className="admin-order-email-audit-load-more"
          type="button"
          onClick={
            loadMore
          }
        >
          이전 기록 10건 더 보기
        </button>
      ) : null}

      {!isLoading &&
      logs.length > 0 &&
      !hasMore ? (
        <p className="admin-order-email-audit-load-complete">
          조건에 맞는 발송 기록을 모두
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

          .admin-order-email-audit-quick {
            margin-bottom: 13px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }

          .admin-order-email-audit-quick > span {
            color: #765449;
            font-size: 8px;
            font-weight: 900;
            white-space: nowrap;
          }

          .admin-order-email-audit-quick > div {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            flex-wrap: wrap;
            gap: 6px;
          }

          .admin-order-email-audit-quick button {
            min-height: 34px;
            padding: 0 12px;
            border: 1px solid #ddc6bc;
            border-radius: 999px;
            color: #765449;
            background: #ffffff;
            font: inherit;
            font-size: 8px;
            font-weight: 900;
            cursor: pointer;
          }

          .admin-order-email-audit-quick button:hover:not(:disabled),
          .admin-order-email-audit-quick button[data-active="true"] {
            border-color: #df6550;
            color: #ffffff;
            background: #df6550;
          }

          .admin-order-email-audit-quick button:disabled {
            cursor: wait;
            opacity: 0.5;
          }
          .admin-order-email-audit-filter-fields {
            display: grid;
            grid-template-columns:
              minmax(145px, 1fr)
              minmax(145px, 1fr)
              minmax(140px, 0.9fr)
              minmax(140px, 0.9fr)
              auto
              auto;
            gap: 10px;
            align-items: end;
          }

          .admin-order-email-audit-filter-fields label span {
            display: block;
            margin-bottom: 6px;
            color: #765449;
            font-size: 8px;
            font-weight: 900;
          }

          .admin-order-email-audit-filter-fields select,
          .admin-order-email-audit-filter-fields input {
            width: 100%;
            min-height: 40px;
            padding: 0 11px;
            border: 1px solid #ddc6bc;
            border-radius: 10px;
            color: #4c382f;
            background: #ffffff;
            font: inherit;
            font-size: 9px;
            outline: none;
          }

          .admin-order-email-audit-filter-fields select {
            padding-right: 34px;
            cursor: pointer;
          }

          .admin-order-email-audit-filter-fields button,
          .admin-order-email-audit-filter-fields a {
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

          .admin-order-email-audit-filter-fields a {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
          }

          .admin-order-email-audit-filter-fields button:hover:not(:disabled),
          .admin-order-email-audit-filter-fields a:hover:not([aria-disabled="true"]) {
            border-color: #df6550;
            color: #ffffff;
            background: #df6550;
          }

          .admin-order-email-audit-filter-fields select:disabled,
          .admin-order-email-audit-filter-fields input:disabled,
          .admin-order-email-audit-filter-fields button:disabled {
            cursor: wait;
            opacity: 0.5;
          }

          .admin-order-email-audit-filter-fields a[aria-disabled="true"] {
            pointer-events: none;
            cursor: wait;
            opacity: 0.5;
          }

          .admin-order-email-audit-filter-result {
            margin-top: 11px;
            display: flex;
            gap: 9px;
            flex-wrap: wrap;
            color: #927a70;
            font-size: 8px;
          }

          .admin-order-email-audit-filter-result strong {
            color: #5e4338;
          }

          .admin-order-email-audit-list {
            display: grid;
            gap: 12px;
          }

          .admin-order-email-audit-list article {
            padding: 15px;
            border: 1px solid #eaded8;
            border-radius: 14px;
            background: #ffffff;
          }

          .admin-order-email-audit-top {
            display: flex;
            justify-content: space-between;
            gap: 12px;
          }

          .admin-order-email-audit-top > div {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
          }

          .admin-order-email-audit-type,
          .admin-order-email-audit-status,
          .admin-order-email-audit-override {
            min-height: 25px;
            padding: 0 9px;
            display: inline-flex;
            align-items: center;
            border-radius: 999px;
            font-size: 7px;
            font-weight: 900;
          }

          .admin-order-email-audit-type {
            color: #725349;
            background: #f5ece7;
          }

          .admin-order-email-audit-status[data-status="SENT"] {
            color: #316b43;
            background: #e7f5ea;
          }

          .admin-order-email-audit-status[data-status="SKIPPED"] {
            color: #806329;
            background: #fff3cf;
          }

          .admin-order-email-audit-status[data-status="FAILED"] {
            color: #984b42;
            background: #ffe8e4;
          }

          .admin-order-email-audit-override {
            color: #76551d;
            border: 1px solid #d8b77a;
            background: #fff7df;
          }

          .admin-order-email-audit-top time {
            color: #9c8780;
            font-size: 7px;
            white-space: nowrap;
          }

          .admin-order-email-audit-list h3 {
            margin: 12px 0;
            color: #4c382f;
            font-size: 10px;
            line-height: 1.6;
          }

          .admin-order-email-audit-list dl {
            margin: 0;
            display: grid;
            gap: 7px;
          }

          .admin-order-email-audit-list dl > div {
            display: grid;
            grid-template-columns: 105px 1fr;
            gap: 10px;
          }

          .admin-order-email-audit-list dt,
          .admin-order-email-audit-list dd {
            margin: 0;
            font-size: 8px;
            line-height: 1.6;
          }

          .admin-order-email-audit-list dt {
            color: #927a70;
            font-weight: 900;
          }

          .admin-order-email-audit-list dd {
            color: #5e4338;
            overflow-wrap: anywhere;
          }

          .admin-order-email-audit-reason {
            white-space: pre-wrap;
            overflow-wrap: anywhere;
          }

          .admin-order-email-audit-error,
          .admin-order-email-audit-empty,
          .admin-order-email-audit-loading {
            margin: 12px 0;
            padding: 14px;
            border-radius: 12px;
            font-size: 8px;
            line-height: 1.7;
            text-align: center;
          }

          .admin-order-email-audit-error {
            color: #984b42;
            border: 1px solid #efc1bb;
            background: #fff0ed;
          }

          .admin-order-email-audit-error p {
            margin: 0 0 9px;
          }

          .admin-order-email-audit-error button {
            min-height: 34px;
            padding: 0 12px;
            border: 1px solid #d89c94;
            border-radius: 9px;
            color: #87473f;
            background: #ffffff;
            font: inherit;
            font-weight: 900;
            cursor: pointer;
          }

          .admin-order-email-audit-empty,
          .admin-order-email-audit-loading {
            color: #806329;
            border: 1px solid #ead9b4;
            background: #fff8e6;
          }

          .admin-order-email-audit-load-more {
            width: 100%;
            min-height: 44px;
            margin-top: 14px;
            border: 1px solid #d3a693;
            border-radius: 11px;
            color: #754c3e;
            background: #ffffff;
            font: inherit;
            font-size: 8px;
            font-weight: 900;
            cursor: pointer;
          }

          .admin-order-email-audit-load-more:hover {
            border-color: #df6550;
            color: #ffffff;
            background: #df6550;
          }

          .admin-order-email-audit-load-complete {
            margin: 13px 0 0;
            color: #927a70;
            font-size: 7px;
            text-align: center;
          }

          @media (max-width: 1100px) {
            .admin-order-email-audit-filter-fields {
              grid-template-columns:
                repeat(
                  2,
                  minmax(0, 1fr)
                );
            }
          }

          @media (max-width: 720px) {
            .admin-order-email-audit-quick {
              align-items: flex-start;
              flex-direction: column;
            }

            .admin-order-email-audit-quick > div {
              width: 100%;
              justify-content: flex-start;
            }

            .admin-order-email-audit-quick button {
              flex:
                1 1
                calc(
                  50% - 6px
                );
            }

            .admin-order-email-audit-filter-fields {
              grid-template-columns: 1fr;
            }

            .admin-order-email-audit-filter-fields button,
            .admin-order-email-audit-filter-fields a {
              width: 100%;
            }

            .admin-order-email-audit-top {
              flex-direction: column;
            }

            .admin-order-email-audit-list dl > div {
              grid-template-columns: 1fr;
              gap: 2px;
            }
          }
        `}
      </style>
    </div>
  );
}

function getActiveDatePreset(
  dateFrom: string,
  dateTo: string,
): DatePreset | null {
  const today =
    getSeoulDateString();

  if (
    dateFrom === today &&
    dateTo === today
  ) {
    return "TODAY";
  }

  if (
    dateFrom ===
      shiftSeoulDate(
        today,
        -6,
      ) &&
    dateTo === today
  ) {
    return "LAST_7_DAYS";
  }

  if (
    dateFrom ===
      shiftSeoulDate(
        today,
        -29,
      ) &&
    dateTo === today
  ) {
    return "LAST_30_DAYS";
  }

  if (
    dateFrom ===
      `${today.slice(
        0,
        7,
      )}-01` &&
    dateTo === today
  ) {
    return "THIS_MONTH";
  }

  return null;
}

function getSeoulDateString(
  value:
    Date = new Date(),
) {
  const parts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          "Asia/Seoul",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      },
    ).formatToParts(value);

  const year =
    parts.find(
      (part) =>
        part.type ===
        "year",
    )?.value || "";

  const month =
    parts.find(
      (part) =>
        part.type ===
        "month",
    )?.value || "";

  const day =
    parts.find(
      (part) =>
        part.type ===
        "day",
    )?.value || "";

  return `${year}-${month}-${day}`;
}

function shiftSeoulDate(
  value: string,
  days: number,
) {
  const date =
    new Date(
      `${value}T12:00:00+09:00`,
    );

  date.setUTCDate(
    date.getUTCDate() +
      days,
  );

  return getSeoulDateString(
    date,
  );
}

function getEmailTypeLabel(
  action: string,
) {
  return action.includes(
    "SHIPPING",
  )
    ? "배송 시작 안내"
    : "제작 완료 안내";
}

function getEmailStatus(
  action: string,
): EmailStatusFilter {
  if (
    action.endsWith(
      "_SENT",
    )
  ) {
    return "SENT";
  }

  if (
    action.endsWith(
      "_SKIPPED",
    )
  ) {
    return "SKIPPED";
  }

  return "FAILED";
}

function getEmailStatusLabel(
  status:
    EmailStatusFilter,
) {
  const labels:
    Record<string, string> = {
      SENT: "발송 성공",

      SKIPPED:
        "발송 건너뜀",

      FAILED:
        "발송 실패",
    };

  return (
    labels[status] ||
    "결과 확인 필요"
  );
}

function getReasonLabel(
  reason: string,
) {
  const labels:
    Record<string, string> = {
      CUSTOMER_EMAIL_MISSING:
        "고객 이메일이 등록되지 않았습니다.",

      RESEND_API_KEY_MISSING:
        "이메일 발송 환경변수가 없습니다.",

      STAGE_EMAIL_TEMPLATE_MISSING:
        "해당 단계의 이메일 양식이 없습니다.",

      RESEND_SEND_ERROR:
        "이메일 서비스가 발송 오류를 반환했습니다.",

      UNKNOWN_EMAIL_SEND_ERROR:
        "이메일 발송 중 알 수 없는 오류가 발생했습니다.",

      UNKNOWN_EMAIL_PROCESSING_ERROR:
        "이메일 처리 중 알 수 없는 오류가 발생했습니다.",
    };

  return (
    labels[reason] ||
    reason
  );
}

function readAuditString(
  value: unknown,
  key: string,
) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  const result =
    (value as Record<
      string,
      unknown
    >)[key];

  return typeof result ===
    "string"
    ? result
    : null;
}

function readAuditBoolean(
  value: unknown,
  key: string,
) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  return (
    (value as Record<
      string,
      unknown
    >)[key] === true
  );
}

function formatDateTime(
  value: string,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "ko-KR",
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",

      timeZone:
        "Asia/Seoul",
    },
  ).format(date);
}