'use client';

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 42,
        padding: '0 18px',
        borderRadius: 999,
        border: '1px solid #24170f',
        background: '#24170f',
        color: '#fffaf0',
        fontSize: 14,
        fontWeight: 900,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      인쇄하기
    </button>
  );
}