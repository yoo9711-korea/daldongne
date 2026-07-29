"use client";

import {
  useRouter,
} from "next/navigation";
import {
  useState,
} from "react";

type NotificationType =
  | "SHIPPING"
  | "COMPLETION";

type AdminOrderEmailRetryButtonProps = {
  orderRecordId: string;
  notificationType:
    NotificationType;
};

export default function AdminOrderEmailRetryButton({
  orderRecordId,
  notificationType,
}: AdminOrderEmailRetryButtonProps) {
  const router =
    useRouter();

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState<string | null>(
    null,
  );

  const [
    tone,
    setTone,
  ] = useState<
    "success" | "error" | null
  >(null);

  const notificationLabel =
    notificationType ===
    "SHIPPING"
      ? "배송 시작 안내"
      : "제작 완료 안내";

  const handleRetry =
    async () => {
      if (isSubmitting) {
        return;
      }

      const confirmed =
        window.confirm(
          `${notificationLabel} 이메일을 고객에게 다시 보내시겠습니까?`,
        );

      if (!confirmed) {
        return;
      }

      setIsSubmitting(true);
      setMessage(null);
      setTone(null);

      try {
        const response =
          await fetch(
            `/api/admin/orders/${encodeURIComponent(
              orderRecordId,
            )}/email-notification/retry`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  notificationType,
                }),
            },
          );

        const result =
          (await response
            .json()
            .catch(() => null)) as
            | {
                ok?: boolean;
                status?: string;
                message?: string;
                error?: string;
              }
            | null;

        if (!response.ok) {
          throw new Error(
            result?.error ||
              "이메일 재발송에 실패했습니다.",
          );
        }

        const succeeded =
          result?.status === "SENT";

        setTone(
          succeeded
            ? "success"
            : "error",
        );

        setMessage(
          result?.message ||
            (succeeded
              ? `${notificationLabel} 이메일을 다시 발송했습니다.`
              : `${notificationLabel} 이메일을 보내지 못했습니다.`),
        );

        router.refresh();
      } catch (error) {
        setTone("error");

        setMessage(
          error instanceof Error
            ? error.message
            : "이메일 재발송 중 오류가 발생했습니다.",
        );
      } finally {
        setIsSubmitting(false);
      }
    };

  return (
    <div className="admin-email-retry">
      <button
        type="button"
        onClick={handleRetry}
        disabled={isSubmitting}
      >
        {isSubmitting
          ? "다시 보내는 중..."
          : "이메일 다시 보내기"}
      </button>

      {message ? (
        <p
          role="status"
          data-tone={tone}
        >
          {message}
        </p>
      ) : null}

      <style jsx>
        {`
          .admin-email-retry {
            margin-top: 12px;
          }

          .admin-email-retry button {
            min-height: 36px;
            padding: 0 13px;
            border: 1px solid #d3a693;
            border-radius: 10px;
            color: #754c3e;
            background: #ffffff;
            font: inherit;
            font-size: 8px;
            font-weight: 900;
            cursor: pointer;
          }

          .admin-email-retry button:hover:not(:disabled) {
            border-color: #df6550;
            color: #ffffff;
            background: #df6550;
          }

          .admin-email-retry button:disabled {
            cursor: wait;
            opacity: 0.58;
          }

          .admin-email-retry p {
            margin: 8px 0 0;
            padding: 9px 10px;
            border-radius: 9px;
            font-size: 8px;
            line-height: 1.6;
          }

          .admin-email-retry p[data-tone="success"] {
            color: #316b43;
            border: 1px solid #b7d9c1;
            background: #edf8ef;
          }

          .admin-email-retry p[data-tone="error"] {
            color: #984b42;
            border: 1px solid #efc1bb;
            background: #fff0ed;
          }
        `}
      </style>
    </div>
  );
}