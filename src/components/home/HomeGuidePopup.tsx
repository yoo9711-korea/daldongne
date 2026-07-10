'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'daldongne_home_guide_popup_closed';

export default function HomeGuidePopup() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const closed = window.localStorage.getItem(STORAGE_KEY);

    if (!closed) {
      const timer = window.setTimeout(() => {
        setIsVisible(true);
      }, 700);

      return () => window.clearTimeout(timer);
    }
  }, []);

  const closePopup = () => {
    setIsVisible(false);
  };

  const closeForToday = () => {
    window.localStorage.setItem(STORAGE_KEY, 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <>
      <style>{`
        @keyframes daldongneGuidePop {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 768px) {
          .home-guide-popup {
            left: 16px !important;
            right: 16px !important;
            bottom: 16px !important;
            width: auto !important;
          }
        }
      `}</style>

      <div
        className="home-guide-popup"
        style={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          zIndex: 9999,
          width: 360,
          padding: 20,
          borderRadius: 24,
          background: '#fffaf0',
          border: '1px solid #e4cda3',
          boxShadow: '0 22px 60px rgba(36, 23, 15, 0.22)',
          color: '#24170f',
          animation: 'daldongneGuidePop 0.35s ease-out both',
        }}
      >
        <button
          type="button"
          onClick={closePopup}
          aria-label="안내 팝업 닫기"
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            width: 30,
            height: 30,
            borderRadius: '50%',
            border: '1px solid #e1c99f',
            background: '#fffdf6',
            color: '#5a3a18',
            fontSize: 18,
            fontWeight: 900,
            cursor: 'pointer',
            lineHeight: 1,
          }}
        >
          ×
        </button>

        <p
          style={{
            margin: '0 0 8px',
            color: '#9a6a24',
            fontSize: 13,
            fontWeight: 900,
          }}
        >
          처음 오셨나요?
        </p>

        <h3
          style={{
            margin: '0 34px 10px 0',
            fontFamily: 'Noto Serif KR, serif',
            fontSize: 22,
            lineHeight: 1.35,
            letterSpacing: '-0.04em',
            color: '#24170f',
          }}
        >
          사진 몇 장으로
          <br />
          인생책을 시작할 수 있습니다.
        </h3>

        <ol
          style={{
            margin: '14px 0 0',
            paddingLeft: 20,
            color: '#5f4a35',
            fontSize: 14,
            lineHeight: 1.8,
            fontWeight: 700,
          }}
        >
          <li>사진을 올립니다.</li>
          <li>사진 속 이야기를 적습니다.</li>
          <li>AI가 글과 목차를 정리합니다.</li>
          <li>내 책장에서 원고를 확인합니다.</li>
          <li>마음에 들면 제작 상담을 신청합니다.</li>
        </ol>

        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            marginTop: 18,
          }}
        >
          <Link
            href="/guide"
            onClick={closePopup}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 40,
              padding: '0 15px',
              borderRadius: 999,
              background: '#24170f',
              color: '#fffaf0',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 900,
            }}
          >
            이용 순서 보기
          </Link>

          <Link
            href="/dashboard/book"
            onClick={closePopup}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 40,
              padding: '0 15px',
              borderRadius: 999,
              background: '#f3d28a',
              color: '#24170f',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 900,
              border: '1px solid #c18a23',
            }}
          >
            바로 시작하기
          </Link>
        </div>

        <button
          type="button"
          onClick={closeForToday}
          style={{
            marginTop: 14,
            padding: 0,
            border: 0,
            background: 'transparent',
            color: '#8a806f',
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          다시 보지 않기
        </button>
      </div>
    </>
  );
}