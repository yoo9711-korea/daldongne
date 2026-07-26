"use client";

import { useState } from "react";

export default function OrderValueCopyButton({
  value,
  label = "복사",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] =
    useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        value,
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      window.prompt(
        "아래 내용을 복사해 주세요.",
        value,
      );
    }
  };

  return (
    <button
      type="button"
      className="user-order-copy-button"
      onClick={handleCopy}
      aria-label={label}
    >
      {copied ? "복사됨" : label}

      <style>{`
        .user-order-copy-button {
          min-height: 30px;
          padding: 0 10px;
          flex: 0 0 auto;
          border: 1px solid #dec3b7;
          border-radius: 9px;
          color: #76594e;
          background: #ffffff;
          font: inherit;
          font-size: 10px;
          font-weight: 900;
          cursor: pointer;
        }

        .user-order-copy-button:hover {
          border-color: #e7856e;
          color: #c45743;
          background: #fff6f1;
        }

        .user-order-copy-button:focus-visible {
          outline:
            4px solid
            rgba(239, 105, 83, 0.2);
          outline-offset: 2px;
        }
      `}</style>
    </button>
  );
}