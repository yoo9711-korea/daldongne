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

  recipientEmail?:
    string | null;

  defaultRecipientEmail?:
    string | null;
};

export default function AdminOrderEmailRetryButton({
  orderRecordId,
  notificationType,
  recipientEmail = null,
  defaultRecipientEmail = null,
}: AdminOrderEmailRetryButtonProps) {
  const router =
    useRouter();

  const normalizedDefaultRecipientEmail =
    (
      defaultRecipientEmail ||
      recipientEmail ||
      ""
    )
      .trim()
      .toLowerCase();

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    emailInput,
    setEmailInput,
  ] = useState(
    recipientEmail?.trim() ||
      defaultRecipientEmail?.trim() ||
      "",
  );

  const [
    recipientOverrideReason,
    setRecipientOverrideReason,
  ] = useState("");

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

  const cleanEmailInput =
    emailInput
      .trim()
      .toLowerCase();

  const emailOverridden =
    Boolean(cleanEmailInput) &&
    cleanEmailInput !==
      normalizedDefaultRecipientEmail;

  const handleRetry =
    async () => {
      if (isSubmitting) {
        return;
      }

      const cleanRecipientEmail =
        emailInput
          .trim()
          .toLowerCase();

      const cleanOverrideReason =
        recipientOverrideReason
          .trim()
          .slice(
            0,
            300,
          );

      if (!cleanRecipientEmail) {
        setTone("error");

        setMessage(
          "재발송할 고객 이메일 주소를 입력해 주세요.",
        );

        return;
      }

      if (
        !isValidEmail(
          cleanRecipientEmail,
        )
      ) {
        setTone("error");

        setMessage(
          "올바른 고객 이메일 주소를 입력해 주세요.",
        );

        return;
      }

      const isEmailOverridden =
        cleanRecipientEmail !==
        normalizedDefaultRecipientEmail;

      if (
        isEmailOverridden &&
        !cleanOverrideReason
      ) {
        setTone("error");

        setMessage(
          "기본 이메일과 다른 주소로 발송하는 사유를 입력해 주세요.",
        );

        return;
      }

      const reasonText =
        isEmailOverridden
          ? `\n변경 사유: ${cleanOverrideReason}`
          : "";

      const confirmed =
        window.confirm(
          `${notificationLabel} 이메일을 ${cleanRecipientEmail} 주소로 다시 보내시겠습니까?${reasonText}`,
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

                  recipientEmail:
                    cleanRecipientEmail,

                  recipientOverrideReason:
                    isEmailOverridden
                      ? cleanOverrideReason
                      : null,
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
          result?.status ===
          "SENT";

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
      <label>
        <span>
          재발송 이메일
        </span>

        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={emailInput}
          onChange={(event) => {
            setEmailInput(
              event.target.value,
            );

            setMessage(null);
            setTone(null);
          }}
          placeholder="customer@example.com"
          disabled={isSubmitting}
          maxLength={320}
        />
      </label>

      <div className="admin-email-retry-default">
        <span>
          기본 이메일
        </span>

        <strong>
          {normalizedDefaultRecipientEmail ||
            "기본 이메일 미등록"}
        </strong>
      </div>

      {emailOverridden ? (
        <div className="admin-email-retry-override">
          <p>
            기본 이메일과 다른 주소로
            재발송합니다.
          </p>

          <label>
            <span>
              이메일 변경 사유
            </span>

            <textarea
              value={
                recipientOverrideReason
              }
              onChange={(event) => {
                setRecipientOverrideReason(
                  event.target.value,
                );

                setMessage(null);
                setTone(null);
              }}
              placeholder="예: 고객 요청으로 새 이메일 주소에 재발송"
              disabled={isSubmitting}
              maxLength={300}
              rows={3}
            />
          </label>

          <small>
            {
              recipientOverrideReason
                .length
            }
            /300자
          </small>
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleRetry}
        disabled={isSubmitting}
      >
        {isSubmitting
          ? "다시 보내는 중..."
          : "이 이메일로 다시 보내기"}
      </button>

      <small className="admin-email-retry-guide">
        회원 계정 이메일과 제작 신청
        이메일은 변경되지 않습니다.
        입력한 주소는 이번 재발송에만
        사용됩니다.
      </small>

      {message ? (
        <p
          className="admin-email-retry-message"
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
            padding: 12px;
            border: 1px solid #eaded8;
            border-radius: 12px;
            background: #fffaf7;
          }

          .admin-email-retry label {
            display: block;
          }

          .admin-email-retry label > span {
            display: block;
            margin-bottom: 6px;
            color: #765449;
            font-size: 9.6px;
            font-weight: 900;
          }

          .admin-email-retry input,
          .admin-email-retry textarea {
            width: 100%;
            padding: 0 11px;
            border: 1px solid #ddc6bc;
            border-radius: 9px;
            color: #4c382f;
            background: #ffffff;
            font: inherit;
            font-size: 10.8px;
            outline: none;
          }

          .admin-email-retry input {
            min-height: 39px;
          }

          .admin-email-retry textarea {
            min-height: 76px;
            padding-top: 10px;
            padding-bottom: 10px;
            resize: vertical;
            line-height: 1.6;
          }

          .admin-email-retry input:focus,
          .admin-email-retry textarea:focus {
            border-color: #df6550;
            box-shadow:
              0 0 0 3px
              rgba(223, 101, 80, 0.1);
          }

          .admin-email-retry input:disabled,
          .admin-email-retry textarea:disabled {
            cursor: wait;
            opacity: 0.65;
          }

          .admin-email-retry-default {
            margin-top: 8px;
            padding: 9px 10px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            border-radius: 9px;
            background: #f5ece7;
          }

          .admin-email-retry-default span,
          .admin-email-retry-default strong {
            overflow-wrap: anywhere;
            font-size: 8.4px;
          }

          .admin-email-retry-default span {
            color: #927a70;
            font-weight: 900;
          }

          .admin-email-retry-default strong {
            color: #553f36;
          }

          .admin-email-retry-override {
            margin-top: 9px;
            padding: 11px;
            border: 1px solid #e2c78e;
            border-radius: 10px;
            background: #fff8e5;
          }

          .admin-email-retry-override > p {
            margin: 0 0 9px;
            color: #805c19;
            font-size: 9.6px;
            font-weight: 900;
          }

          .admin-email-retry-override > small {
            display: block;
            margin-top: 5px;
            color: #94743a;
            font-size: 8.4px;
            text-align: right;
          }

          .admin-email-retry button {
            min-height: 36px;
            margin-top: 9px;
            padding: 0 13px;
            border: 1px solid #d3a693;
            border-radius: 10px;
            color: #754c3e;
            background: #ffffff;
            font: inherit;
            font-size: 9.6px;
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

          .admin-email-retry-guide {
            display: block;
            margin-top: 8px;
            color: #927a70;
            font-size: 8.4px;
            line-height: 1.6;
          }

          .admin-email-retry-message {
            margin: 8px 0 0;
            padding: 9px 10px;
            border-radius: 9px;
            font-size: 9.6px;
            line-height: 1.6;
          }

          .admin-email-retry-message[data-tone="success"] {
            color: #316b43;
            border: 1px solid #b7d9c1;
            background: #edf8ef;
          }

          .admin-email-retry-message[data-tone="error"] {
            color: #984b42;
            border: 1px solid #efc1bb;
            background: #fff0ed;
          }
        `}
      </style>
    </div>
  );
}

function isValidEmail(
  value: string,
) {
  if (
    value.length > 320
  ) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value,
  );
}