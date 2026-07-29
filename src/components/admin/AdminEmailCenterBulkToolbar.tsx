"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type NotificationType = "SHIPPING" | "COMPLETION";
type RetryResult = {
  ok?: boolean;
  status?: string;
  message?: string;
  error?: string;
};
type BulkItem = {
  orderRecordId: string;
  notificationType: NotificationType;
};

const BULK_SELECTOR =
  'input[data-email-bulk-item="true"]:not(:disabled)';

export default function AdminEmailCenterBulkToolbar() {
  const router = useRouter();
  const [selectedCount, setSelectedCount] = useState(0);
  const [eligibleCount, setEligibleCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"success" | "error" | "info">("info");

  const updateCounts = useCallback(() => {
    const inputs = getBulkInputs();
    setEligibleCount(inputs.length);
    setSelectedCount(inputs.filter((input) => input.checked).length);
  }, []);

  useEffect(() => {
    updateCounts();

    const handleChange = (event: Event) => {
      const target = event.target;

      if (
        target instanceof HTMLInputElement &&
        target.matches(BULK_SELECTOR)
      ) {
        updateCounts();
      }
    };

    document.addEventListener("change", handleChange);

    return () => {
      document.removeEventListener("change", handleChange);
    };
  }, [updateCounts]);

  const setAllChecked = (checked: boolean) => {
    for (const input of getBulkInputs()) {
      input.checked = checked;
    }

    updateCounts();
    setMessage(null);
  };

  const retryItems = async (items: BulkItem[]) => {
    if (isProcessing) return;

    if (items.length === 0) {
      setTone("error");
      setMessage("재발송할 이메일을 선택해 주세요.");
      return;
    }

    const confirmed = window.confirm(
      `${items.length.toLocaleString()}건의 고객 이메일을 순서대로 다시 보내시겠습니까?`,
    );

    if (!confirmed) return;

    setIsProcessing(true);
    setTone("info");
    setMessage("선택한 이메일을 재발송하고 있습니다.");
    setProgress({ completed: 0, total: items.length });

    let sentCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    try {
      const batchSize = 3;

      for (let start = 0; start < items.length; start += batchSize) {
        const batch = items.slice(start, start + batchSize);
        const results = await Promise.all(batch.map(retryOne));

        for (const result of results) {
          if (result.status === "SENT") {
            sentCount += 1;
          } else if (result.status === "SKIPPED") {
            skippedCount += 1;
          } else {
            failedCount += 1;
          }
        }

        setProgress({
          completed: Math.min(start + batch.length, items.length),
          total: items.length,
        });
      }

      setTone(failedCount > 0 ? "error" : "success");
      setMessage(
        `일괄 재발송 완료 · 성공 ${sentCount.toLocaleString()}건 · 건너뜀 ${skippedCount.toLocaleString()}건 · 실패 ${failedCount.toLocaleString()}건`,
      );

      setAllChecked(false);
      router.refresh();
    } catch (error) {
      console.error("[ADMIN_EMAIL_BULK_RETRY_ERROR]", error);
      setTone("error");
      setMessage(
        "일괄 재발송 처리 중 오류가 발생했습니다. 화면을 새로고침한 뒤 다시 시도해 주세요.",
      );
    } finally {
      setIsProcessing(false);
      updateCounts();
    }
  };

  const retrySelected = async () => {
    const items = getUniqueItems(
      getBulkInputs().filter((input) => input.checked),
    );

    await retryItems(items);
  };

  const retryAllVisible = async () => {
    const inputs = getBulkInputs();

    for (const input of inputs) {
      input.checked = true;
    }

    updateCounts();
    await retryItems(getUniqueItems(inputs));
  };

  return (
    <section className="admin-email-center-bulk-toolbar">
      <div>
        <p>일괄 이메일 처리</p>

        <strong>
          선택 {selectedCount.toLocaleString()}건
          {" / "}
          처리 가능 {eligibleCount.toLocaleString()}건
        </strong>

        <span>
          같은 주문의 같은 알림은 한 번만 재발송합니다.
        </span>
      </div>

      <div className="admin-email-center-bulk-actions">
        <button
          type="button"
          onClick={() => setAllChecked(true)}
          disabled={isProcessing || eligibleCount === 0}
        >
          전체 선택
        </button>

        <button
          type="button"
          onClick={() => setAllChecked(false)}
          disabled={isProcessing || selectedCount === 0}
        >
          선택 해제
        </button>

        <button
          type="button"
          data-primary="true"
          onClick={retrySelected}
          disabled={isProcessing || selectedCount === 0}
        >
          {isProcessing ? "재발송 중..." : "선택 이메일 재발송"}
        </button>

        <button
          type="button"
          data-danger="true"
          onClick={retryAllVisible}
          disabled={isProcessing || eligibleCount === 0}
        >
          현재 화면 문제 이메일 모두 재발송
        </button>
      </div>

      {isProcessing ? (
        <div
          className="admin-email-center-bulk-progress"
          role="status"
        >
          <div>
            <span>처리 진행</span>

            <strong>
              {progress.completed.toLocaleString()}
              {" / "}
              {progress.total.toLocaleString()}
            </strong>
          </div>

          <progress
            max={progress.total || 1}
            value={progress.completed}
          />
        </div>
      ) : null}

      {message ? (
        <p
          className="admin-email-center-bulk-message"
          data-tone={tone}
          role="status"
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}

function getBulkInputs() {
  return Array.from(
    document.querySelectorAll<HTMLInputElement>(BULK_SELECTOR),
  );
}

function getUniqueItems(inputs: HTMLInputElement[]) {
  const map = new Map<string, BulkItem>();

  for (const input of inputs) {
    const orderRecordId =
      input.dataset.orderRecordId?.trim() || "";
    const rawType = input.dataset.notificationType;

    const notificationType: NotificationType | null =
      rawType === "SHIPPING" || rawType === "COMPLETION"
        ? rawType
        : null;

    if (!orderRecordId || !notificationType) continue;

    const key = `${orderRecordId}:${notificationType}`;

    if (!map.has(key)) {
      map.set(key, {
        orderRecordId,
        notificationType,
      });
    }
  }

  return Array.from(map.values());
}

async function retryOne(
  item: BulkItem,
): Promise<RetryResult> {
  try {
    const response = await fetch(
      `/api/admin/orders/${encodeURIComponent(
        item.orderRecordId,
      )}/email-notification/retry`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationType: item.notificationType,
        }),
      },
    );

    const result = (await response
      .json()
      .catch(() => ({}))) as RetryResult;

    if (!response.ok) {
      return {
        status: "FAILED",
        error:
          result.error ||
          result.message ||
          "재발송 요청 실패",
      };
    }

    return {
      ...result,
      status:
        result.status ||
        (result.ok ? "SENT" : "FAILED"),
    };
  } catch (error) {
    console.error("[ADMIN_EMAIL_BULK_RETRY_ITEM_ERROR]", {
      item,
      error,
    });

    return {
      status: "FAILED",
      error: "네트워크 오류",
    };
  }
}
