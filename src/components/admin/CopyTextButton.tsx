"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

type Props = {
  value: string | null;
  label?: string;
};

export default function CopyTextButton({
  value,
  label = "복사",
}: Props) {
  const [copied, setCopied] =
    useState(false);

  const resetTimerRef =
    useRef<number | null>(null);

  const disabled =
    !value || value === "-";

  useEffect(() => {
    return () => {
      if (
        resetTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          resetTimerRef.current,
        );
      }
    };
  }, []);

  const handleCopy = async () => {
    if (disabled) {
      window.alert(
        "복사할 정보가 없습니다.",
      );
      return;
    }

    try {
      await copyText(value);

      setCopied(true);

      if (
        resetTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          resetTimerRef.current,
        );
      }

      resetTimerRef.current =
        window.setTimeout(() => {
          setCopied(false);
          resetTimerRef.current =
            null;
        }, 1500);
    } catch {
      window.alert(
        "복사하지 못했습니다. 직접 선택해서 복사해 주세요.",
      );
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() =>
          void handleCopy()
        }
        disabled={disabled}
        className="admin-copy-button"
        data-copied={
          copied
            ? "true"
            : "false"
        }
        aria-label={
          copied
            ? `${label} 완료`
            : label
        }
        title={
          disabled
            ? "복사할 정보가 없습니다."
            : copied
              ? "클립보드에 복사되었습니다."
              : label
        }
      >
        <span
          className="admin-copy-button-icon"
          aria-hidden="true"
        >
          {copied ? (
            <CheckIcon />
          ) : (
            <CopyIcon />
          )}
        </span>

        <span>
          {copied
            ? "복사됨"
            : label}
        </span>
      </button>

      <style>
        {copyButtonStyles}
      </style>
    </>
  );
}

async function copyText(
  value: string,
) {
  if (
    navigator.clipboard &&
    window.isSecureContext
  ) {
    await navigator.clipboard.writeText(
      value,
    );
    return;
  }

  const textarea =
    document.createElement(
      "textarea",
    );

  textarea.value = value;
  textarea.setAttribute(
    "readonly",
    "",
  );

  textarea.style.position =
    "fixed";
  textarea.style.top = "-9999px";
  textarea.style.left =
    "-9999px";

  document.body.appendChild(
    textarea,
  );

  textarea.select();

  const copied =
    document.execCommand("copy");

  textarea.remove();

  if (!copied) {
    throw new Error(
      "COPY_COMMAND_FAILED",
    );
  }
}

function CopyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
    >
      <rect
        x="8"
        y="8"
        width="11"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.9"
      />

      <path
        d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="m8 12.2 2.6 2.6L16.5 9"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const copyButtonStyles = `
  .admin-copy-button {
    min-height: 31px;
    padding: 0 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    flex: 0 0 auto;
    border: 1px solid #d7b4a3;
    border-radius: 9px;
    color: #755247;
    background: #ffffff;
    font: inherit;
    font-size: 8px;
    font-weight: 900;
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
    box-shadow:
      0 4px 10px
      rgba(91, 59, 44, 0.035);
    transition:
      transform 150ms ease,
      border-color 150ms ease,
      box-shadow 150ms ease,
      color 150ms ease,
      background-color 150ms ease;
  }

  .admin-copy-button:hover:not(:disabled) {
    border-color: #cf8f7a;
    box-shadow:
      0 7px 15px
      rgba(91, 59, 44, 0.08);
    transform: translateY(-1px);
  }

  .admin-copy-button:focus-visible {
    outline:
      4px solid
      rgba(239, 105, 83, 0.2);
    outline-offset: 2px;
  }

  .admin-copy-button[data-copied="true"] {
    border-color: #8fbea0;
    color: #2f6b45;
    background: #eaf6ed;
  }

  .admin-copy-button:disabled {
    border-color:
      rgba(136, 94, 74, 0.1);
    color: #9d8c84;
    background: #f1edeb;
    box-shadow: none;
    cursor: not-allowed;
    opacity: 0.68;
  }

  .admin-copy-button-icon {
    width: 13px;
    height: 13px;
    display: inline-grid;
    place-items: center;
    flex: 0 0 auto;
  }

  .admin-copy-button-icon svg {
    width: 100%;
    height: 100%;
  }

  @media (prefers-reduced-motion: reduce) {
    .admin-copy-button {
      transition: none;
    }
  }
`;
