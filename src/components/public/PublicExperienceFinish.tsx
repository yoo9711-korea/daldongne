"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

const PRIVATE_PREFIXES = [
  "/dashboard",
  "/admin",
  "/api",
  "/family",
  "/payment",
  "/payments",
  "/orders",
  "/order",
];

function isPublicPath(
  pathname: string,
) {
  return !PRIVATE_PREFIXES.some(
    (prefix) =>
      pathname === prefix ||
      pathname.startsWith(
        `${prefix}/`,
      ),
  );
}

export default function PublicExperienceFinish() {
  const pathname =
    usePathname();

  const publicPath =
    useMemo(
      () =>
        isPublicPath(
          pathname || "/",
        ),
      [pathname],
    );

  const [
    showTopButton,
    setShowTopButton,
  ] = useState(false);

  const [
    footerChecked,
    setFooterChecked,
  ] = useState(false);

  const [
    hasExistingFooter,
    setHasExistingFooter,
  ] = useState(false);

  useEffect(() => {
    if (!publicPath) {
      document.body.classList.remove(
        "public-experience-route",
      );

      return;
    }

    document.body.classList.add(
      "public-experience-route",
    );

    const main =
      document.querySelector(
        "main",
      );

    if (
      main &&
      !main.id
    ) {
      main.id =
        "main-content";
    }

    const existingFooter =
      document.querySelector(
        "footer, [role='contentinfo'], .storybook-footer, .public-footer",
      );

    setHasExistingFooter(
      Boolean(
        existingFooter,
      ),
    );

    setFooterChecked(true);

    const handleScroll = () => {
      setShowTopButton(
        window.scrollY > 560,
      );
    };

    handleScroll();

    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      },
    );

    return () => {
      document.body.classList.remove(
        "public-experience-route",
      );

      window.removeEventListener(
        "scroll",
        handleScroll,
      );
    };
  }, [
    pathname,
    publicPath,
  ]);

  if (!publicPath) {
    return null;
  }

  return (
    <>
      <a
        href="#main-content"
        className="public-skip-link"
      >
        본문 바로가기
      </a>

      {footerChecked &&
      !hasExistingFooter ? (
        <footer
          className="public-finish-footer"
          role="contentinfo"
        >
          <div className="public-finish-footer-inner">
            <div className="public-finish-footer-brand">
              <Link href="/">
                <strong>
                  달동네 스토리
                </strong>
              </Link>

              <p>
                사진과 이야기를 모아
                오래 간직할 수 있는
                한 권의 책으로 만듭니다.
              </p>
            </div>

            <nav
              className="public-finish-footer-links"
              aria-label="하단 안내 메뉴"
            >
              <Link href="/process">
                제작 과정
              </Link>

              <Link href="/pricing">
                상품·가격
              </Link>

              <Link href="/guide#contact">
                문의하기
              </Link>

              <Link href="/privacy">
                개인정보 처리방침
              </Link>

              <Link href="/terms">
                이용약관
              </Link>
            </nav>

            <div className="public-finish-footer-bottom">
              <span>
                © 2026 달동네 스토리
              </span>

              <span>
                DALDONGNE STORY
              </span>
            </div>
          </div>
        </footer>
      ) : null}

      <button
        type="button"
        className="public-back-to-top"
        data-visible={
          showTopButton
            ? "true"
            : "false"
        }
        aria-label="페이지 맨 위로 이동"
        onClick={() => {
          window.scrollTo({
            top: 0,
            behavior:
              "smooth",
          });
        }}
      >
        ↑
      </button>
    </>
  );
}
