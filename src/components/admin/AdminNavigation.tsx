"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavigationIcon =
  | "dashboard"
  | "inquiry"
  | "production"
  | "application"
  | "review"
  | "book"
  | "user"
  | "family";

type NavigationItem = {
  href: string;
  label: string;
  description: string;
  icon: NavigationIcon;
  exact?: boolean;
};

type NavigationGroup = {
  title: string;
  items: NavigationItem[];
};

const NAVIGATION_GROUPS: NavigationGroup[] =
  [
    {
      title: "OVERVIEW",
      items: [
        {
          href: "/admin",
          label: "대시보드",
          description:
            "운영 현황과 우선 업무",
          icon: "dashboard",
          exact: true,
        },
      ],
    },
    {
      title: "CUSTOMER OPERATIONS",
      items: [
        {
          href: "/admin/inquiries",
          label: "통합 문의",
          description:
            "제작 상담과 상품 신청",
          icon: "inquiry",
        },
        {
          href:
            "/admin/production-requests",
          label: "제작 상담",
          description:
            "책 제작 상담과 견적",
          icon: "production",
        },
        {
          href:
            "/admin/product-applications",
          label: "상품 신청",
          description:
            "인생책과 월간 기록 신청",
          icon: "application",
        },
        {
          href: "/admin/reviews",
          label: "고객 후기",
          description:
            "후기 승인과 홈페이지 노출",
          icon: "review",
        },
      ],
    },
    {
      title: "CONTENT & MEMBERS",
      items: [
        {
          href: "/admin/books",
          label: "책 관리",
          description:
            "원고와 제작 상태",
          icon: "book",
        },
        {
          href: "/admin/users",
          label: "회원 관리",
          description:
            "회원 활동과 관리자 권한",
          icon: "user",
        },
        {
          href: "/admin/families",
          label: "가족 공간",
          description:
            "구성원과 초대 상태",
          icon: "family",
        },
      ],
    },
  ];

export default function AdminNavigation() {
  const pathname =
    usePathname() || "";

  return (
    <nav
      aria-label="관리자 메뉴"
      className="admin-common-navigation"
    >
      {NAVIGATION_GROUPS.map(
        (group) => (
          <section
            key={group.title}
            className="admin-common-navigation-group"
          >
            <p className="admin-common-navigation-title">
              {group.title}
            </p>

            <div className="admin-common-navigation-list">
              {group.items.map(
                (item) => {
                  const active =
                    item.exact
                      ? pathname ===
                        item.href
                      : pathname ===
                          item.href ||
                        pathname.startsWith(
                          `${item.href}/`,
                        );

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={
                        active
                          ? "page"
                          : undefined
                      }
                      data-active={
                        active
                          ? "true"
                          : "false"
                      }
                      className="admin-common-navigation-link"
                    >
                      <span className="admin-common-navigation-icon">
                        <NavigationIcon
                          icon={
                            item.icon
                          }
                        />
                      </span>

                      <span className="admin-common-navigation-text">
                        <strong>
                          {item.label}
                        </strong>

                        <span>
                          {item.description}
                        </span>
                      </span>

                      <span
                        aria-hidden="true"
                        className="admin-common-navigation-arrow"
                      >
                        →
                      </span>
                    </Link>
                  );
                },
              )}
            </div>
          </section>
        ),
      )}
    </nav>
  );
}

function NavigationIcon({
  icon,
}: {
  icon: NavigationIcon;
}) {
  if (icon === "dashboard") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="3"
          y="3"
          width="7"
          height="7"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.8"
        />

        <rect
          x="14"
          y="3"
          width="7"
          height="4"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.8"
        />

        <rect
          x="14"
          y="11"
          width="7"
          height="10"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.8"
        />

        <rect
          x="3"
          y="14"
          width="7"
          height="7"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  if (icon === "inquiry") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M4 5h16v11H9l-4 3v-3H4V5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        <path
          d="M8 9h8M8 12h5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (icon === "production") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M5 3h11l3 3v15H5V3Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        <path
          d="M15 3v4h4M8 11h8M8 15h8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (icon === "application") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M6 4h12v16H6V4Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        <path
          d="M9 8h6M9 12h6M9 16h3"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (icon === "review") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="m12 3 2.6 5.3 5.9.9-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.9L12 3Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (icon === "book") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M4 5.5C6.7 4.5 9.3 5 12 7v13c-2.7-2-5.3-2.5-8-1.5v-13Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        <path
          d="M20 5.5C17.3 4.5 14.7 5 12 7v13c2.7-2 5.3-2.5 8-1.5v-13Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (icon === "user") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="8"
          r="3.5"
          stroke="currentColor"
          strokeWidth="1.8"
        />

        <path
          d="M5 21c1-4.3 3.3-6.5 7-6.5s6 2.2 7 6.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="8"
        cy="8"
        r="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <circle
        cx="17"
        cy="9"
        r="2.3"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M3 20c.8-3.8 2.5-5.7 5-5.7s4.2 1.9 5 5.7M13.5 20c.5-2.8 1.8-4.2 3.9-4.2 1.6 0 2.8 1 3.6 3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
