'use client';

import { useState } from 'react';

type Props = {
  value: string | null;
  label?: string;
};

export default function CopyTextButton({
  value,
  label = '복사',
}: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value || value === '-') {
      window.alert('복사할 정보가 없습니다.');
      return;
    }

    try {
      await navigator.clipboard.writeText(value);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      window.alert('복사하지 못했습니다. 직접 선택해서 복사해 주세요.');
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!value || value === '-'}
      style={{
        minHeight: 30,
        padding: '0 10px',
        borderRadius: 999,
        border: '1px solid #d6b778',
        background: copied ? '#24170f' : '#fffaf0',
        color: copied ? '#fffaf0' : '#6d4512',
        fontSize: 12,
        fontWeight: 900,
        cursor: !value || value === '-' ? 'not-allowed' : 'pointer',
        opacity: !value || value === '-' ? 0.5 : 1,
      }}
    >
      {copied ? '복사됨' : label}
    </button>
  );
}