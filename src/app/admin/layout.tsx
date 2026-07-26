import { auth } from "@/auth";
import AdminNavigation from "@/components/admin/AdminNavigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user =
    await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        role: true,
        name: true,
        email: true,
        image: true,
      },
    });

  if (user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const displayName =
    user.name ||
    user.email ||
    "관리자";

  const avatarText =
    displayName
      .trim()
      .charAt(0)
      .toUpperCase() ||
    "A";

  return (
    <div className="admin-common-frame">
      <style>
        {adminLayoutStyles}
      </style>

      <aside className="admin-common-sidebar">
        <div className="admin-common-sidebar-top">
          <Link
            href="/admin"
            className="admin-common-brand"
            aria-label="달동네 관리자 홈"
          >
            <span className="admin-common-brand-mark">
              달
            </span>

            <span>
              <strong>
                달동네 스토리
              </strong>

              <small>
                ADMIN CENTER
              </small>
            </span>
          </Link>

          <div className="admin-common-sidebar-heading">
            <p>운영 관리</p>

            <span>
              서비스 현황과 고객 요청을
              관리합니다.
            </span>
          </div>
        </div>

        <AdminNavigation />

        <div className="admin-common-sidebar-footer">
          <div className="admin-common-admin-card">
            {user.image ? (
              <img
                src={user.image}
                alt={`${displayName} 프로필`}
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="admin-common-admin-avatar">
                {avatarText}
              </span>
            )}

            <div>
              <strong>
                {displayName}
              </strong>

              <span>
                {user.email ||
                  "관리자 계정"}
              </span>
            </div>
          </div>

          <div className="admin-common-sidebar-links">
            <Link href="/dashboard">
              사용자 화면
            </Link>

            <Link href="/">
              홈페이지
            </Link>
          </div>
        </div>
      </aside>

      <section className="admin-common-workspace">
        <header className="admin-common-topbar">
          <div>
            <p>
              달동네 운영센터
            </p>

            <span>
              관리자 전용 화면
            </span>
          </div>

          <nav
            aria-label="관리자 보조 메뉴"
            className="admin-common-topbar-links"
          >
            <Link href="/admin/inquiries">
              통합 문의
            </Link>

            <Link href="/admin/production-requests">
              제작 상담
            </Link>

            <Link href="/admin/orders">

              주문·결제

            </Link>

            <Link href="/admin/product-applications">
              상품 신청
            </Link>
          </nav>
        </header>

        <div className="admin-common-content">
          {children}
        </div>
      </section>
    </div>
  );
}

const adminLayoutStyles = `
  .admin-common-frame,
  .admin-common-frame * {
    box-sizing: border-box;
  }

  .admin-common-frame {
    min-height: 100vh;
    display: grid;
    grid-template-columns:
      246px minmax(0, 1fr);
    color: #432f26;
    background:
      linear-gradient(
        180deg,
        #f7f0ea 0,
        #fbf8f5 240px,
        #fbf8f5 100%
      );
    font-family:
      var(--font-daldongne-sans),
      "Noto Sans KR",
      sans-serif;
  }

  .admin-common-frame a {
    color: inherit;
    text-decoration: none;
  }

  .admin-common-frame a,
  .admin-common-frame button {
    transition:
      transform 160ms ease,
      box-shadow 160ms ease,
      border-color 160ms ease,
      background-color 160ms ease;
  }

  .admin-common-frame a:focus-visible,
  .admin-common-frame button:focus-visible {
    outline:
      4px solid
      rgba(239, 105, 83, 0.22);
    outline-offset: 3px;
  }

  .admin-common-sidebar {
    position: sticky;
    top: 0;
    height: 100vh;
    min-height: 720px;
    padding: 21px 15px 17px;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    border-right:
      1px solid
      rgba(112, 75, 58, 0.12);
    background:
      radial-gradient(
        circle at 15% 8%,
        rgba(255, 226, 198, 0.62),
        transparent 16rem
      ),
      linear-gradient(
        180deg,
        #fffaf5,
        #f8eee7
      );
    box-shadow:
      12px 0 34px
      rgba(83, 54, 39, 0.035);
  }

  .admin-common-sidebar-top {
    flex: 0 0 auto;
  }

  .admin-common-brand {
    min-width: 0;
    padding: 7px;
    display: flex;
    align-items: center;
    gap: 10px;
    border-radius: 13px;
  }

  .admin-common-brand:hover {
    background:
      rgba(255, 255, 255, 0.72);
  }

  .admin-common-brand-mark {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border-radius: 13px;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff806d,
        #e85e4d
      );
    box-shadow:
      0 9px 20px
      rgba(224, 91, 72, 0.22);
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 18px;
    font-weight: 900;
  }

  .admin-common-brand > span:last-child {
    min-width: 0;
  }

  .admin-common-brand strong,
  .admin-common-brand small {
    display: block;
  }

  .admin-common-brand strong {
    overflow: hidden;
    color: #4b342b;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 16px;
    letter-spacing: -0.035em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .admin-common-brand small {
    margin-top: 2px;
    color: #d35f4b;
    font-size: 7px;
    font-weight: 900;
    letter-spacing: 0.12em;
  }

  .admin-common-sidebar-heading {
    margin: 16px 7px 12px;
    padding: 14px 11px;
    border:
      1px solid
      rgba(127, 84, 63, 0.1);
    border-radius: 14px;
    background:
      rgba(255, 255, 255, 0.62);
  }

  .admin-common-sidebar-heading p {
    margin: 0;
    color: #d65f4a;
    font-size: 8px;
    font-weight: 900;
    letter-spacing: 0.08em;
  }

  .admin-common-sidebar-heading span {
    display: block;
    margin-top: 5px;
    color: #7c675d;
    font-size: 8px;
    line-height: 1.55;
  }

  .admin-common-navigation {
    min-width: 0;
    flex: 1 1 auto;
    display: grid;
    align-content: start;
    gap: 14px;
  }

  .admin-common-navigation-group {
    min-width: 0;
  }

  .admin-common-navigation-title {
    margin: 0 9px 6px;
    color: #a0877b;
    font-size: 7px;
    font-weight: 900;
    letter-spacing: 0.09em;
  }

  .admin-common-navigation-list {
    display: grid;
    gap: 4px;
  }

  .admin-common-navigation-link {
    min-width: 0;
    min-height: 47px;
    padding: 7px 9px;
    display: grid;
    grid-template-columns:
      31px minmax(0, 1fr)
      auto;
    align-items: center;
    gap: 8px;
    border:
      1px solid transparent;
    border-radius: 12px;
    color: #6f5b51;
    background: transparent;
  }

  .admin-common-navigation-link:hover {
    border-color:
      rgba(132, 88, 67, 0.11);
    background:
      rgba(255, 255, 255, 0.72);
    transform: translateX(2px);
  }

  .admin-common-navigation-link[data-active="true"] {
    border-color:
      rgba(116, 49, 42, 0.18);
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #82443a,
        #6e342d
      );
    box-shadow:
      0 10px 21px
      rgba(104, 51, 43, 0.18);
  }

  .admin-common-navigation-icon {
    width: 31px;
    height: 31px;
    padding: 7px;
    display: grid;
    place-items: center;
    border-radius: 9px;
    color: #bf6b58;
    background:
      rgba(255, 255, 255, 0.82);
  }

  .admin-common-navigation-link[data-active="true"]
  .admin-common-navigation-icon {
    color: #773d34;
    background: #fff7f1;
  }

  .admin-common-navigation-icon svg {
    width: 100%;
    height: 100%;
  }

  .admin-common-navigation-text {
    min-width: 0;
  }

  .admin-common-navigation-text strong,
  .admin-common-navigation-text span {
    display: block;
  }

  .admin-common-navigation-text strong {
    overflow: hidden;
    font-size: 9px;
    line-height: 1.4;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .admin-common-navigation-text span {
    margin-top: 2px;
    overflow: hidden;
    color: #9a8175;
    font-size: 6px;
    line-height: 1.4;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .admin-common-navigation-link[data-active="true"]
  .admin-common-navigation-text span {
    color:
      rgba(255, 255, 255, 0.72);
  }

  .admin-common-navigation-arrow {
    color: #be8273;
    font-size: 10px;
    font-weight: 900;
  }

  .admin-common-navigation-link[data-active="true"]
  .admin-common-navigation-arrow {
    color: #ffffff;
  }

  .admin-common-sidebar-footer {
    margin-top: 16px;
    padding-top: 14px;
    flex: 0 0 auto;
    border-top:
      1px solid
      rgba(112, 75, 58, 0.12);
  }

  .admin-common-admin-card {
    min-width: 0;
    padding: 9px;
    display: flex;
    align-items: center;
    gap: 9px;
    border:
      1px solid
      rgba(127, 84, 63, 0.1);
    border-radius: 13px;
    background:
      rgba(255, 255, 255, 0.64);
  }

  .admin-common-admin-card > img,
  .admin-common-admin-avatar {
    width: 35px;
    height: 35px;
    flex: 0 0 auto;
    border-radius: 50%;
    object-fit: cover;
    background: #efe3db;
  }

  .admin-common-admin-avatar {
    display: grid;
    place-items: center;
    color: #8d5e50;
    font-size: 12px;
    font-weight: 900;
  }

  .admin-common-admin-card > div {
    min-width: 0;
  }

  .admin-common-admin-card strong,
  .admin-common-admin-card span {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .admin-common-admin-card strong {
    font-size: 9px;
  }

  .admin-common-admin-card span {
    margin-top: 3px;
    color: #917a6f;
    font-size: 6px;
  }

  .admin-common-sidebar-links {
    margin-top: 8px;
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 6px;
  }

  .admin-common-sidebar-links a {
    min-height: 34px;
    display: grid;
    place-items: center;
    border:
      1px solid
      rgba(125, 82, 62, 0.14);
    border-radius: 9px;
    color: #775b50;
    background:
      rgba(255, 255, 255, 0.68);
    font-size: 7px;
    font-weight: 900;
  }

  .admin-common-sidebar-links a:hover {
    background: #ffffff;
    transform: translateY(-1px);
  }

  .admin-common-workspace {
    min-width: 0;
  }

  .admin-common-topbar {
    min-height: 64px;
    padding:
      10px clamp(20px, 3vw, 42px);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    border-bottom:
      1px solid
      rgba(112, 75, 58, 0.1);
    background:
      rgba(255, 252, 249, 0.86);
    backdrop-filter:
      blur(12px);
  }

  .admin-common-topbar > div:first-child {
    min-width: 0;
  }

  .admin-common-topbar p,
  .admin-common-topbar span {
    display: block;
  }

  .admin-common-topbar p {
    margin: 0;
    color: #553d33;
    font-size: 10px;
    font-weight: 900;
  }

  .admin-common-topbar > div:first-child > span {
    margin-top: 2px;
    color: #9a8175;
    font-size: 7px;
  }

  .admin-common-topbar-links {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 6px;
  }

  .admin-common-topbar-links a {
    min-height: 34px;
    padding: 0 10px;
    display: inline-flex;
    align-items: center;
    border:
      1px solid
      rgba(126, 83, 63, 0.14);
    border-radius: 9px;
    color: #765a4e;
    background: #ffffff;
    font-size: 7px;
    font-weight: 900;
  }

  .admin-common-topbar-links a:hover {
    border-color: #d9a391;
    box-shadow:
      0 7px 16px
      rgba(89, 56, 42, 0.06);
  }

  .admin-common-content {
    min-width: 0;
    padding:
      clamp(22px, 3.2vw, 46px);
  }

  @media (max-width: 1080px) {
    .admin-common-frame {
      grid-template-columns:
        220px minmax(0, 1fr);
    }

    .admin-common-sidebar {
      padding-left: 11px;
      padding-right: 11px;
    }

    .admin-common-navigation-text span {
      display: none;
    }
  }

  @media (max-width: 880px) {
    .admin-common-frame {
      display: block;
    }

    .admin-common-sidebar {
      position: relative;
      height: auto;
      min-height: 0;
      padding: 12px 14px;
      overflow: visible;
      border-right: 0;
      border-bottom:
        1px solid
        rgba(112, 75, 58, 0.12);
    }

    .admin-common-sidebar-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .admin-common-brand {
      flex: 0 1 auto;
    }

    .admin-common-brand-mark {
      width: 37px;
      height: 37px;
      border-radius: 11px;
      font-size: 16px;
    }

    .admin-common-brand strong {
      font-size: 14px;
    }

    .admin-common-sidebar-heading {
      margin: 0;
      padding: 8px 10px;
      flex: 0 0 auto;
    }

    .admin-common-sidebar-heading span {
      display: none;
    }

    .admin-common-navigation {
      margin-top: 10px;
      display: flex;
      gap: 10px;
      overflow-x: auto;
      padding-bottom: 3px;
      scrollbar-width: thin;
    }

    .admin-common-navigation-group {
      display: contents;
    }

    .admin-common-navigation-title {
      display: none;
    }

    .admin-common-navigation-list {
      display: flex;
      gap: 6px;
    }

    .admin-common-navigation-link {
      min-width: max-content;
      min-height: 40px;
      padding: 5px 9px;
      grid-template-columns:
        27px auto;
      gap: 6px;
      border-color:
        rgba(125, 82, 62, 0.12);
      background:
        rgba(255, 255, 255, 0.66);
    }

    .admin-common-navigation-link:hover {
      transform: translateY(-1px);
    }

    .admin-common-navigation-icon {
      width: 27px;
      height: 27px;
      padding: 6px;
    }

    .admin-common-navigation-text strong {
      font-size: 8px;
    }

    .admin-common-navigation-text span,
    .admin-common-navigation-arrow {
      display: none;
    }

    .admin-common-sidebar-footer {
      display: none;
    }

    .admin-common-topbar {
      min-height: 52px;
      padding: 8px 14px;
    }

    .admin-common-topbar-links {
      flex-wrap: nowrap;
      overflow-x: auto;
      justify-content: flex-start;
    }

    .admin-common-topbar-links a {
      flex: 0 0 auto;
    }

    .admin-common-content {
      padding:
        clamp(16px, 3vw, 28px);
    }
  }

  @media (max-width: 560px) {
    .admin-common-sidebar-top {
      align-items: stretch;
      flex-direction: column;
    }

    .admin-common-sidebar-heading {
      display: none;
    }

    .admin-common-topbar {
      align-items: stretch;
      flex-direction: column;
      gap: 7px;
    }

    .admin-common-topbar-links {
      width: 100%;
    }

    .admin-common-topbar-links a {
      flex: 1 1 auto;
      justify-content: center;
    }

    .admin-common-content {
      padding: 14px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .admin-common-frame a,
    .admin-common-frame button {
      transition: none;
    }
  }
`;
