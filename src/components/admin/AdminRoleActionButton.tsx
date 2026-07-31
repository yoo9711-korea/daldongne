"use client";

import { useFormStatus } from "react-dom";

type Props = {
  label: string;
  currentRole: string;
  disabled: boolean;
  disabledReason?: string;
  confirmMessage: string;
};

export default function AdminRoleActionButton({
  label,
  currentRole,
  disabled,
  disabledReason = "",
  confirmMessage,
}: Props) {
  const { pending } = useFormStatus();

  const isDisabled =
    disabled || pending;

  const handleClick = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (isDisabled) {
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
        disabled={isDisabled}
        title={
          disabled
            ? disabledReason
            : label
        }
        className="admin-role-control-button"
        data-current-role={
          currentRole
        }
        data-locked={
          disabled
            ? "true"
            : "false"
        }
        aria-busy={pending}
      >
        <span
          className="admin-role-control-icon"
          aria-hidden="true"
        >
          {pending ? (
            <span className="admin-role-control-spinner" />
          ) : disabled ? (
            <LockIcon />
          ) : currentRole ===
            "ADMIN" ? (
            <RemoveAdminIcon />
          ) : (
            <AddAdminIcon />
          )}
        </span>

        <span>
          {pending
            ? "권한 변경 중..."
            : label}
        </span>
      </button>

      <style>
        {roleActionButtonStyles}
      </style>
    </>
  );
}

function AddAdminIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="10"
        cy="8"
        r="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M4 20c.7-4 2.7-6 6-6 2.1 0 3.7.8 4.7 2.5M18 10v6M15 13h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RemoveAdminIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="10"
        cy="8"
        r="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M4 20c.7-4 2.7-6 6-6 2.1 0 3.7.8 4.7 2.5M15 13h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
    >
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M8 10V7a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

const roleActionButtonStyles = `
  .admin-role-control-button,
  .admin-role-control-button * {
    box-sizing: border-box;
  }

  .admin-role-control-button {
    min-height: 36px;
    padding: 0 11px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border: 1px solid #9f8bc2;
    border-radius: 10px;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #8065ae,
        #684c96
      );
    font: inherit;
    font-size: 9.6px;
    font-weight: 900;
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
    box-shadow:
      0 7px 15px
      rgba(92, 65, 135, 0.13);
    transition:
      transform 150ms ease,
      box-shadow 150ms ease,
      opacity 150ms ease;
  }

  .admin-role-control-button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow:
      0 10px 19px
      rgba(92, 65, 135, 0.2);
  }

  .admin-role-control-button:focus-visible {
    outline:
      4px solid
      rgba(132, 99, 184, 0.2);
    outline-offset: 2px;
  }

  .admin-role-control-button[data-current-role="ADMIN"] {
    border-color: #d7a29b;
    color: #93473f;
    background: #fff0ee;
    box-shadow: none;
  }

  .admin-role-control-button[data-locked="true"] {
    border-color:
      rgba(126, 91, 74, 0.14);
    color: #9c8a82;
    background: #f2eeeb;
    box-shadow: none;
    cursor: not-allowed;
  }

  .admin-role-control-button:disabled {
    opacity: 0.65;
  }

  .admin-role-control-button[aria-busy="true"] {
    cursor: wait;
  }

  .admin-role-control-icon {
    width: 14px;
    height: 14px;
    display: inline-grid;
    place-items: center;
    flex: 0 0 auto;
  }

  .admin-role-control-icon svg {
    width: 100%;
    height: 100%;
  }

  .admin-role-control-spinner {
    width: 12px;
    height: 12px;
    border:
      2px solid
      rgba(255, 255, 255, 0.35);
    border-top-color: currentColor;
    border-radius: 50%;
    animation:
      admin-role-control-spin
      700ms linear infinite;
  }

  .admin-role-control-button[data-current-role="ADMIN"]
  .admin-role-control-spinner {
    border-color:
      rgba(147, 71, 63, 0.25);
    border-top-color: #93473f;
  }

  @keyframes admin-role-control-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 620px) {
    .admin-role-control-button {
      width: 100%;
      min-height: 41px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .admin-role-control-button {
      transition: none;
    }

    .admin-role-control-spinner {
      animation: none;
    }
  }
`;
