"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type AdminAIProductionAutoRefreshProps = {
  enabled: boolean;
  intervalMs?: number;
};

export default function AdminAIProductionAutoRefresh({
  enabled,
  intervalMs = 5000,
}: AdminAIProductionAutoRefreshProps) {
  const router =
    useRouter();

  const [
    lastRefreshedAt,
    setLastRefreshedAt,
  ] = useState<Date | null>(
    null,
  );

  const safeIntervalMs =
    useMemo(
      () =>
        Math.max(
          3000,
          intervalMs,
        ),
      [intervalMs],
    );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const refresh = () => {
      if (
        document.visibilityState !==
        "visible"
      ) {
        return;
      }

      router.refresh();
      setLastRefreshedAt(
        new Date(),
      );
    };

    const timerId =
      window.setInterval(
        refresh,
        safeIntervalMs,
      );

    return () => {
      window.clearInterval(
        timerId,
      );
    };
  }, [
    enabled,
    router,
    safeIntervalMs,
  ]);

  if (!enabled) {
    return null;
  }

  return (
    <div
      className="admin-ai-production-auto-refresh"
      role="status"
    >
      <strong>
        AI 제작 상태 자동 갱신 중
      </strong>

      <span>
        5초마다 현재 단계와 PDF 생성 상태를
        다시 확인합니다.
        {lastRefreshedAt
          ? ` 마지막 확인: ${lastRefreshedAt.toLocaleTimeString(
              "ko-KR",
              {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              },
            )}`
          : ""}
      </span>

      <style jsx>{`
        .admin-ai-production-auto-refresh {
          margin-top: 14px;
          padding: 11px 13px;
          display: grid;
          gap: 4px;
          border: 1px solid #d7e0ff;
          border-radius: 12px;
          background: #f3f6ff;
        }

        strong {
          color: #41588f;
          font-size: 12px;
          font-weight: 900;
        }

        span {
          color: #65739a;
          font-size: 10.8px;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}