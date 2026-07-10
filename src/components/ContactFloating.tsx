// src/components/ContactFloating.tsx

const PHONE_DISPLAY = '02-2060-7492';
const PHONE_LINK = 'tel:0220607492';

// 카카오 채널 주소를 만들면 아래 주소만 바꾸면 됩니다.
const KAKAO_TALK_URL = 'https://pf.kakao.com/_YOUR_CHANNEL';

export default function ContactFloating() {
  return (
    <div
      className="contact-floating"
      aria-label="상담 문의"
      style={{
        position: 'fixed',
        right: 22,
        bottom: 22,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <a
        href={PHONE_LINK}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          minWidth: 174,
          padding: '13px 18px',
          borderRadius: 999,
          background: '#33271d',
          color: '#fff8ec',
          fontWeight: 900,
          fontSize: 16,
          textDecoration: 'none',
          boxShadow: '0 14px 34px rgba(51, 39, 29, 0.24)',
          border: '1px solid rgba(255, 248, 236, 0.18)',
        }}
      >
        <span aria-hidden="true">☎</span>
        상담전화 {PHONE_DISPLAY}
      </a>

      <a
        href={KAKAO_TALK_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          minWidth: 174,
          padding: '13px 18px',
          borderRadius: 999,
          background: '#fee500',
          color: '#2b2118',
          fontWeight: 900,
          fontSize: 16,
          textDecoration: 'none',
          boxShadow: '0 14px 34px rgba(51, 39, 29, 0.18)',
          border: '1px solid rgba(51, 39, 29, 0.08)',
        }}
      >
        <span aria-hidden="true">💬</span>
        카카오 상담톡
      </a>
    </div>
  );
}