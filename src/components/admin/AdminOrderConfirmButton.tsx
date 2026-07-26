"use client";

import { useFormStatus } from "react-dom";

type Props = {
  label: string;
  pendingLabel: string;
  confirmMessage: string;
  tone?: "primary" | "danger" | "neutral";
  disabled?: boolean;
};

export default function AdminOrderConfirmButton({
  label,
  pendingLabel,
  confirmMessage,
  tone = "primary",
  disabled = false,
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
        className="admin-order-confirm-button"
        data-tone={tone}
        disabled={isDisabled}
        aria-busy={pending}
        onClick={handleClick}
      >
        {pending
          ? pendingLabel
          : label}
      </button>

      <style>
        {`
          .admin-order-confirm-button {
            min-height: 42px;
            padding: 0 15px;
            border: 0;
            border-radius: 11px;
            color: #ffffff;
            background: linear-gradient(
              135deg,
              #8160aa,
              #68478e
            );
            font: inherit;
            font-size: 9px;
            font-weight: 900;
            cursor: pointer;
            box-shadow:
              0 9px 20px
              rgba(91, 63, 135, 0.16);
            transition:
              transform 150ms ease,
              box-shadow 150ms ease,
              opacity 150ms ease;
          }

          .admin-order-confirm-button:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow:
              0 12px 24px
              rgba(91, 63, 135, 0.22);
          }

          .admin-order-confirm-button[data-tone="danger"] {
            background: linear-gradient(
              135deg,
              #d85f53,
              #b9443b
            );
            box-shadow:
              0 9px 20px
              rgba(174, 58, 49, 0.16);
          }

          .admin-order-confirm-button[data-tone="neutral"] {
            color: #76594e;
            border: 1px solid #d5b5a8;
            background: #ffffff;
            box-shadow: none;
          }

          .admin-order-confirm-button:disabled {
            opacity: 0.55;
            cursor: not-allowed;
          }

          .admin-order-confirm-button:focus-visible {
            outline:
              4px solid
              rgba(239, 105, 83, 0.2);
            outline-offset: 2px;
          }

          @media (max-width: 620px) {
            .admin-order-confirm-button {
              width: 100%;
              min-height: 45px;
            }
          }
        `}
      </style>
    </>
  );
}