"use client";

import { useFormStatus } from "react-dom";

type ReviewActionTone =
  | "APPROVE"
  | "PENDING"
  | "REJECT"
  | "FEATURE"
  | "VISIBILITY";

type Props = {
  label: string;
  tone: ReviewActionTone;
  confirmMessage: string;
  pendingLabel?: string;
};

export default function ReviewActionSubmitButton({
  label,
  tone,
  confirmMessage,
  pendingLabel = "처리 중...",
}: Props) {
  const { pending } = useFormStatus();

  const handleClick = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (pending) {
      event.preventDefault();
      return;
    }

    if (
      confirmMessage &&
      !window.confirm(confirmMessage)
    ) {
      event.preventDefault();
    }
  };

  return (
    <>
      <button
        type="submit"
        onClick={handleClick}
        disabled={pending}
        className="admin-review-control-button"
        data-tone={tone}
        aria-busy={pending}
      >
        <span
          className="admin-review-control-icon"
          aria-hidden="true"
        >
          {pending ? (
            <span className="admin-review-control-spinner" />
          ) : (
            <ActionIcon tone={tone} />
          )}
        </span>

        <span>
          {pending
            ? pendingLabel
            : label}
        </span>
      </button>

      <style>
        {reviewActionButtonStyles}
      </style>
    </>
  );
}

function ActionIcon({
  tone,
}: {
  tone: ReviewActionTone;
}) {
  if (tone === "APPROVE") {
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
          d="m8 12.3 2.5 2.5L16.5 9"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (tone === "REJECT") {
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
          d="m9 9 6 6M15 9l-6 6"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (tone === "FEATURE") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="m12 3 2.6 5.3 5.9.9-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.9L12 3Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (tone === "VISIBILITY") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M3 12s3.3-5 9-5 9 5 9 5-3.3 5-9 5-9-5-9-5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        <circle
          cx="12"
          cy="12"
          r="2.5"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M12 4v10M8.5 10.5 12 14l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M5 19h14"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

const reviewActionButtonStyles = `
  .admin-review-control-button,
  .admin-review-control-button * {
    box-sizing: border-box;
  }

  .admin-review-control-button {
    min-height: 38px;
    padding: 0 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    border: 1px solid #d9c5ba;
    border-radius: 10px;
    color: #664d42;
    background: #ffffff;
    font: inherit;
    font-size: 9.6px;
    font-weight: 900;
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
    box-shadow:
      0 6px 14px
      rgba(82, 51, 38, 0.05);
    transition:
      transform 150ms ease,
      border-color 150ms ease,
      box-shadow 150ms ease,
      opacity 150ms ease;
  }

  .admin-review-control-button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow:
      0 9px 18px
      rgba(82, 51, 38, 0.09);
  }

  .admin-review-control-button:focus-visible {
    outline:
      4px solid
      rgba(239, 105, 83, 0.2);
    outline-offset: 2px;
  }

  .admin-review-control-button:disabled {
    cursor: wait;
    opacity: 0.62;
  }

  .admin-review-control-button[data-tone="APPROVE"] {
    border-color: #79ad8b;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #5d9870,
        #447b57
      );
  }

  .admin-review-control-button[data-tone="PENDING"] {
    border-color: #d5b06e;
    color: #76521f;
    background: #fff5dc;
  }

  .admin-review-control-button[data-tone="REJECT"] {
    border-color: #d7a29b;
    color: #93473f;
    background: #fff0ee;
  }

  .admin-review-control-button[data-tone="FEATURE"] {
    border-color: #ad97ce;
    color: #674d8f;
    background: #f5f0fc;
  }

  .admin-review-control-button[data-tone="VISIBILITY"] {
    border-color: #91b7d2;
    color: #3d6f91;
    background: #edf7fd;
  }

  .admin-review-control-icon {
    width: 14px;
    height: 14px;
    display: inline-grid;
    place-items: center;
    flex: 0 0 auto;
  }

  .admin-review-control-icon svg {
    width: 100%;
    height: 100%;
  }

  .admin-review-control-spinner {
    width: 12px;
    height: 12px;
    border:
      2px solid
      rgba(101, 75, 62, 0.24);
    border-top-color: currentColor;
    border-radius: 50%;
    animation:
      admin-review-control-spin
      700ms linear infinite;
  }

  .admin-review-control-button[data-tone="APPROVE"]
  .admin-review-control-spinner {
    border-color:
      rgba(255, 255, 255, 0.35);
    border-top-color: #ffffff;
  }

  @keyframes admin-review-control-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 620px) {
    .admin-review-control-button {
      width: 100%;
      min-height: 41px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .admin-review-control-button {
      transition: none;
    }

    .admin-review-control-spinner {
      animation: none;
    }
  }
`;
