'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadForm() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage('');

    try {
      const formData = new FormData(form);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('업로드 실패');

      setMessage('✓ 업로드 완료!');
      form.reset();
      router.refresh();
    } catch (err) {
      setMessage('업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="dash-card" style={{ marginBottom: 16 }}>
      <p className="dash-card__label">새 기록 추가</p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input
          type="file"
          name="file"
          ref={fileRef}
          accept="image/*,video/*,audio/*"
          required
          style={{
            border: '1px solid rgba(34,28,22,.18)',
            borderRadius: 2,
            padding: '8px 12px',
            background: 'var(--paper)',
            fontSize: 14,
          }}
        />
        <input
          type="text"
          name="title"
          placeholder="제목 (선택)"
          style={{
            height: 40,
            border: '1px solid rgba(34,28,22,.18)',
            borderRadius: 2,
            padding: '0 12px',
            background: 'var(--paper)',
            fontSize: 14,
          }}
        />
        <input
          type="date"
          name="occurredAt"
          style={{
            height: 40,
            border: '1px solid rgba(34,28,22,.18)',
            borderRadius: 2,
            padding: '0 12px',
            background: 'var(--paper)',
            fontSize: 14,
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="submit"
            className="btn btn--gold btn--sm"
            disabled={uploading}
          >
            {uploading ? '업로드 중...' : '기록 저장하기'}
          </button>
          {message && (
            <span style={{ fontSize: 13, color: 'var(--wine)' }}>{message}</span>
          )}
        </div>
      </form>
    </div>
  );
}
