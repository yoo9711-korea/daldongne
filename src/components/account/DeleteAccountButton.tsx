'use client';

import { signOut } from 'next-auth/react';
import { useState } from 'react';

export default function DeleteAccountButton() {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (isDeleting) return;

    const firstConfirm = window.confirm(
      [
        '정말 회원 탈퇴를 진행할까요?',
        '',
        '계정을 삭제하면 사진, 이야기, 책 원고, 상담 신청 정보가 함께 삭제될 수 있습니다.',
        '삭제된 데이터는 복구하기 어렵습니다.',
      ].join('\n'),
    );

    if (!firstConfirm) return;

    const secondConfirm = window.confirm(
      [
        '마지막 확인입니다.',
        '',
        '회원 탈퇴 후에는 기존 작업실과 내 책장에 접근할 수 없습니다.',
        '정말 계정과 관련 데이터를 삭제할까요?',
      ].join('\n'),
    );

        if (!secondConfirm) return;

    const typedConfirm = window.prompt(
      [
        '계정 삭제를 계속하려면 아래 문구를 정확히 입력해 주세요.',
        '',
        '계정삭제',
        '',
        '입력하지 않거나 다르게 입력하면 삭제가 진행되지 않습니다.',
      ].join('\n'),
    );

    if (typedConfirm !== '계정삭제') {
      alert('확인 문구가 일치하지 않아 계정 삭제를 취소했습니다.');
      return;
    }

    setIsDeleting(true);

    setIsDeleting(true);

    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
      });

      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };

      if (!response.ok || !result.ok) {
        alert(result.message || '계정 삭제를 완료하지 못했습니다.');
        return;
      }

      alert(result.message || '계정과 관련 데이터가 삭제되었습니다.');

      await signOut({
        callbackUrl: '/',
        redirect: true,
      });
    } catch {
      alert('계정 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDeleteAccount}
      disabled={isDeleting}
      style={{
        minHeight: 46,
        padding: '0 22px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 999,
        border: '1px solid #b94727',
        background: isDeleting ? '#e9d6cf' : '#fff3ee',
        color: '#8d2c16',
        fontSize: 15,
        fontWeight: 900,
        cursor: isDeleting ? 'wait' : 'pointer',
      }}
    >
      {isDeleting ? '계정 삭제 중...' : '회원 탈퇴 / 계정 삭제'}
    </button>
  );
}