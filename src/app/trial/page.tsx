import { auth } from '@/auth';
import StorybookPublicHeader from '@/components/storybook/StorybookPublicHeader';
import Image from 'next/image';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const CATEGORY_ITEMS = [
  {
    key: 'all',
    label: '전체',
  },
  {
    key: 'parent',
    label: '부모님의 인생',
  },
  {
    key: 'family',
    label: '가족 이야기',
  },
  {
    key: 'child',
    label: '아이 성장',
  },
  {
    key: 'travel',
    label: '여행 추억',
  },
  {
    key: 'couple',
    label: '부부·연인 이야기',
  },
] as const;

type CategoryKey =
  (typeof CATEGORY_ITEMS)[number]['key'];

type Artwork = {
  id: string;
  title: string;
  subtitle: string;
  category: CategoryKey;
  categoryLabel: string;
  image: string;
  order: number;
};

const ARTWORKS: readonly Artwork[] = [
  {
    id: 'father-time',
    title: '아버지의 시간들',
    subtitle: '평범했던 삶이 특별한 이야기가 되다',
    category: 'parent',
    categoryLabel: '부모님의 인생',
    image: '/home/storybook/example-1.webp',
    order: 6,
  },
  {
    id: 'family-days',
    title: '우리 가족의 모든 날들',
    subtitle: '함께한 시간들이 모여 우리의 이야기',
    category: 'family',
    categoryLabel: '가족 이야기',
    image: '/home/storybook/example-2.webp',
    order: 5,
  },
  {
    id: 'child-growth',
    title: '너의 성장을 응원해',
    subtitle: '처음부터 지금까지, 너의 소중한 기록',
    category: 'child',
    categoryLabel: '아이 성장',
    image: '/home/storybook/example-3.webp',
    order: 4,
  },
  {
    id: 'travel-note',
    title: '우리의 여행 노트',
    subtitle: '떠났던 순간, 함께한 기억들',
    category: 'travel',
    categoryLabel: '여행 추억',
    image: '/home/storybook/example-4.webp',
    order: 3,
  },
  {
    id: 'first-day',
    title: '우리, 처음 그날부터',
    subtitle: '서로를 만나, 함께 걸어온 시간',
    category: 'couple',
    categoryLabel: '부부·연인 이야기',
    image: '/home/storybook/detail-hero.webp',
    order: 2,
  },
  {
    id: 'grandmother-wisdom',
    title: '할머니의 이야기 보따리',
    subtitle: '손주에게 전하는 삶의 지혜',
    category: 'parent',
    categoryLabel: '부모님의 인생',
    image: '/home/storybook/hero-book.webp',
    order: 1,
  },
];

const CONTENT_FEATURES = [
  {
    image: '/home/storybook/process-1.webp',
    title: '소중한 사진',
    description:
      '추억을 담은 사진을 선별하고 보정하여 가장 아름답게 담아드립니다.',
  },
  {
    image: '/home/storybook/process-2.webp',
    title: '진심 어린 이야기',
    description:
      '인터뷰 템플릿으로 마음을 담아 진짜 나만의 이야기를 엮어드립니다.',
  },
  {
    image: '/home/storybook/process-3.webp',
    title: '감성적인 편집 디자인',
    description:
      '스토리에 어울리는 따뜻한 디자인으로 몰입감 있게 완성됩니다.',
  },
  {
    image: '/home/storybook/process-4.webp',
    title: '고급 인쇄 & 제본',
    description:
      '오래 간직할 수 있도록 고급 용지와 튼튼한 제본으로 정성껏 제작합니다.',
  },
  {
    image: '/home/storybook/recommend-5.webp',
    title: '기억을 선물로',
    description:
      '세상에 하나뿐인 책으로 사랑하는 사람에게 특별한 선물이 됩니다.',
  },
] as const;

type TrialPageProps = {
  searchParams: Promise<{
    category?: string;
    sort?: string;
  }>;
};

function isCategoryKey(
  value: string | undefined,
): value is CategoryKey {
  return CATEGORY_ITEMS.some(
    (item) => item.key === value,
  );
}

function createFilterHref(
  category: CategoryKey,
  sort: string,
) {
  const params = new URLSearchParams();

  if (category !== 'all') {
    params.set('category', category);
  }

  if (sort !== 'latest') {
    params.set('sort', sort);
  }

  const query = params.toString();

  return query ? `/trial?${query}` : '/trial';
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Gamja+Flower&display=swap');

  .trial-storybook-page,
  .trial-storybook-page * {
    box-sizing: border-box;
  }

  .trial-storybook-page {
    --trial-ink: #4a3024;
    --trial-soft: #725e52;
    --trial-coral: #e97861;
    --trial-line: rgba(126, 87, 64, 0.14);
    width: 100%;
    min-height: 100vh;
    overflow-x: clip;
    color: var(--trial-ink);
    background: #fffdf9;
    font-family: 'Noto Sans KR', sans-serif;
  }

  .trial-storybook-page a {
    color: inherit;
  }

  .trial-hand-title,
  .trial-section-title,
  .trial-strip-title,
  .trial-cta-title {
    font-family:
      'Gamja Flower',
      'MapoFlowerIsland',
      cursive;
    font-weight: 400;
    letter-spacing: 0.015em;
  }

  .trial-heart {
    margin-left: 7px;
    color: #ef806b;
    font-family: Arial, sans-serif;
    font-size: 0.82em;
  }

  .trial-hero {
    position: relative;
    min-height: 365px;
    overflow: hidden;
    background:
      linear-gradient(
        90deg,
        rgba(255, 253, 249, 0.99) 0%,
        rgba(255, 253, 249, 0.96) 38%,
        rgba(255, 253, 249, 0.38) 57%,
        rgba(255, 253, 249, 0) 76%
      ),
      #f7efe4;
  }

  .trial-hero-decoration {
    position: absolute;
    inset: 0 auto 0 0;
    width: 195px;
    opacity: 0.95;
  }

  .trial-hero-decoration img {
    object-fit: cover;
    object-position: left center;
  }

  .trial-hero-image {
    position: absolute;
    inset: 0 0 0 43%;
  }

  .trial-hero-image img {
    object-fit: cover;
    object-position: center center;
  }

  .trial-hero-inner {
    position: relative;
    z-index: 2;
    width: min(1480px, 100%);
    min-height: 365px;
    margin: 0 auto;
    padding:
      46px
      clamp(24px, 4vw, 62px)
      40px
      clamp(200px, 15vw, 235px);
    display: flex;
    align-items: center;
  }

  .trial-hero-copy {
    width: min(510px, 41vw);
  }

  .trial-hand-title {
    margin: 0;
    font-size: clamp(47px, 4.1vw, 61px);
    line-height: 1.18;
    word-break: keep-all;
  }

  .trial-hero-description {
    margin: 18px 0 0;
    color: #57453b;
    font-size: 15px;
    line-height: 1.75;
    word-break: keep-all;
  }

  .trial-primary-button,
  .trial-outline-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    font-weight: 900;
    text-decoration: none;
    transition:
      transform 160ms ease,
      box-shadow 160ms ease;
  }

  .trial-primary-button {
    min-height: 46px;
    margin-top: 18px;
    padding: 0 26px;
    border: 1px solid #e4745d;
    color: #ffffff !important;
    background:
      linear-gradient(
        135deg,
        #ee8b70,
        #e56d55
      );
    box-shadow:
      0 11px 25px
      rgba(210, 97, 73, 0.2);
    font-size: 13px;
  }

  .trial-primary-button:hover,
  .trial-outline-button:hover {
    transform: translateY(-2px);
  }

  .trial-hero-benefits {
    display: flex;
    align-items: center;
    gap: 25px;
    margin-top: 22px;
  }

  .trial-hero-benefit {
    display: grid;
    grid-template-columns: 44px auto;
    align-items: center;
    gap: 8px;
  }

  .trial-benefit-image {
    position: relative;
    width: 44px;
    height: 44px;
    border: 1px solid rgba(139, 96, 69, 0.17);
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.7);
  }

  .trial-benefit-image img {
    object-fit: contain;
    padding: 5px;
  }

  .trial-hero-benefit span {
    color: #5d493e;
    font-size: 10px;
    font-weight: 800;
    white-space: nowrap;
  }

  .trial-gallery {
    padding: 20px 24px 30px;
  }

  .trial-gallery-inner {
    width: min(1400px, 100%);
    margin: 0 auto;
  }

  .trial-filter-bar {
    display: grid;
    grid-template-columns:
      minmax(0, 1fr)
      118px;
    align-items: center;
    gap: 22px;
  }

  .trial-categories {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 11px;
    flex-wrap: wrap;
  }

  .trial-category-link {
    display: inline-flex;
    min-width: 120px;
    min-height: 35px;
    align-items: center;
    justify-content: center;
    padding: 0 17px;
    border: 1px solid #e2d1c5;
    border-radius: 999px;
    color: #725e52 !important;
    background: #fffdf9;
    font-size: 10px;
    font-weight: 800;
    text-decoration: none;
    transition:
      color 160ms ease,
      background 160ms ease,
      border-color 160ms ease;
  }

  .trial-category-link.is-active {
    border-color: #e6765f;
    color: #ffffff !important;
    background:
      linear-gradient(
        135deg,
        #ed8a70,
        #e46c54
      );
  }

  .trial-sort-form {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 6px;
  }

  .trial-sort-select {
    min-height: 35px;
    padding: 0 12px;
    border: 1px solid #dfcec1;
    border-radius: 999px;
    color: #69564c;
    background: #fffdf9;
    font: inherit;
    font-size: 10px;
    font-weight: 800;
  }

  .trial-sort-button {
    width: 35px;
    height: 35px;
    border: 1px solid #dfcec1;
    border-radius: 50%;
    color: #9b684e;
    background: #fffaf6;
    font-size: 12px;
    font-weight: 900;
    cursor: pointer;
  }

  .trial-artwork-grid {
    margin-top: 18px;
    display: grid;
    grid-template-columns:
      repeat(6, minmax(0, 1fr));
    gap: 14px;
  }

  .trial-artwork-card {
  min-width: 0;
  min-height: 150px;
  overflow: hidden;
  border: 1px solid rgba(137, 95, 69, 0.15);
  border-radius: 13px;
  background:
    linear-gradient(
      145deg,
      #ffffff,
      #fff9f3
    );
  box-shadow:
    0 8px 22px
    rgba(88, 58, 40, 0.055);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease;
}

.trial-artwork-card:hover {
  transform: translateY(-3px);
  box-shadow:
    0 13px 28px
    rgba(88, 58, 40, 0.09);
}

   .trial-artwork-copy {
  min-height: 150px;
  padding: 24px 18px 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

  .trial-artwork-copy h2 {
    margin: 0;
    color: #4b392f;
    font-size: 16px;
    line-height: 1.45;
  }

  .trial-artwork-copy p {
    margin: 8px 0 0;
    color: #7c695e;
    font-size: 9px;
    line-height: 1.65;
    word-break: keep-all;
  }

  .trial-artwork-tag {
  display: inline-flex;
  width: max-content;
  min-height: 25px;
  margin-top: 14px;
  align-items: center;
  padding: 0 10px;
  border: 1px solid #ead8cb;
  border-radius: 999px;
  color: #9c745d;
  background: #fffaf6;
  font-size: 10px;
  font-weight: 800;
}

  .trial-empty {
    grid-column: 1 / -1;
    min-height: 180px;
    display: grid;
    place-items: center;
    border: 1px dashed rgba(137, 95, 69, 0.22);
    border-radius: 14px;
    color: #7d695e;
    background: #fffaf6;
    font-size: 13px;
    text-align: center;
  }

  .trial-gallery-action {
    display: flex;
    justify-content: center;
    margin-top: 17px;
  }

  .trial-outline-button {
    min-height: 38px;
    padding: 0 21px;
    border: 1px solid #dfb89f;
    color: #b9654f !important;
    background: #fffdf9;
    font-size: 11px;
  }

  .trial-content-strip {
    margin-top: 18px;
    padding: 15px 18px;
    display: grid;
    grid-template-columns:
      minmax(220px, 0.62fr)
      minmax(0, 2.38fr);
    align-items: center;
    gap: 17px;
    border: 1px solid rgba(137, 95, 69, 0.13);
    border-radius: 15px;
    background:
      linear-gradient(
        135deg,
        #fff8ef,
        #fffdf9
      );
  }

  .trial-strip-title {
    margin: 0;
    padding: 7px 20px;
    border-right: 1px solid var(--trial-line);
    font-size: 26px;
    line-height: 1.3;
  }

  .trial-feature-grid {
    display: grid;
    grid-template-columns:
      repeat(5, minmax(0, 1fr));
  }

  .trial-feature-item {
    min-width: 0;
    padding: 5px 14px;
    display: grid;
    grid-template-columns: 52px minmax(0, 1fr);
    align-items: center;
    gap: 8px;
  }

  .trial-feature-item
    + .trial-feature-item {
    border-left: 1px solid var(--trial-line);
  }

  .trial-feature-image {
    position: relative;
    width: 52px;
    height: 52px;
  }

  .trial-feature-image img {
    object-fit: contain;
  }

  .trial-feature-item h3 {
    margin: 0;
    color: #4d392f;
    font-size: 10px;
    line-height: 1.45;
  }

  .trial-feature-item p {
    margin: 4px 0 0;
    color: #7b675c;
    font-size: 8px;
    line-height: 1.55;
    word-break: keep-all;
  }

  .trial-cta {
    padding: 0 24px 40px;
  }

  .trial-cta-inner {
    width: min(1400px, 100%);
    min-height: 126px;
    margin: 0 auto;
    padding: 18px 34px;
    display: grid;
    grid-template-columns:
      minmax(310px, 0.8fr)
      minmax(0, 1.2fr)
      minmax(230px, 0.5fr);
    align-items: center;
    gap: 28px;
    overflow: hidden;
    border: 1px solid rgba(171, 119, 83, 0.2);
    border-radius: 17px;
    background:
      radial-gradient(
        circle at 18% 30%,
        rgba(255, 255, 255, 0.87),
        transparent 18rem
      ),
      linear-gradient(
        135deg,
        #fff4e8,
        #f8ead8
      );
  }

  .trial-cta-image {
    position: relative;
    width: 315px;
    height: 105px;
  }

  .trial-cta-image img {
    object-fit: contain;
  }

  .trial-cta-title {
    margin: 0;
    font-size: 30px;
    line-height: 1.25;
  }

  .trial-cta-copy p {
    margin: 7px 0 0;
    color: #79645a;
    font-size: 12px;
  }

  .trial-cta .trial-primary-button {
    width: 100%;
    margin-top: 0;
  }

  @media (max-width: 1220px) {
    .trial-artwork-grid {
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
    }

    .trial-content-strip {
      grid-template-columns: 1fr;
    }

    .trial-strip-title {
      border-right: 0;
      border-bottom: 1px solid var(--trial-line);
      text-align: center;
    }

    .trial-cta-inner {
      grid-template-columns:
        230px minmax(0, 1fr) 220px;
    }

    .trial-cta-image {
      width: 230px;
    }
  }

  @media (max-width: 980px) {
    .trial-hero-inner {
      padding-left: 175px;
    }

    .trial-hero-decoration {
      width: 155px;
    }

    .trial-feature-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
      gap: 12px 0;
    }

    .trial-feature-item
      + .trial-feature-item {
      border-left: 0;
    }

    .trial-feature-item:nth-child(even) {
      border-left: 1px solid var(--trial-line);
    }

    .trial-feature-item:last-child {
      grid-column: 1 / -1;
      width: 50%;
      justify-self: center;
    }
  }

  @media (max-width: 860px) {
    .trial-hero {
      display: grid;
      min-height: auto;
      background: #fff8f0;
    }

    .trial-hero-decoration {
      display: none;
    }

    .trial-hero-image {
      position: relative;
      inset: auto;
      order: 2;
      aspect-ratio: 1.45 / 1;
    }

    .trial-hero-inner {
      min-height: auto;
      padding: 44px 22px 38px;
      order: 1;
    }

    .trial-hero-copy {
      width: min(650px, 100%);
      margin: 0 auto;
      text-align: center;
    }

    .trial-hand-title {
      font-size: clamp(42px, 10vw, 55px);
    }

    .trial-hero-benefits {
      justify-content: center;
      flex-wrap: wrap;
    }

    .trial-filter-bar {
      grid-template-columns: 1fr;
    }

    .trial-sort-form {
      width: 190px;
      justify-self: end;
    }

    .trial-sort-select {
      width: 150px;
    }

    .trial-cta-inner {
      grid-template-columns:
        170px minmax(0, 1fr);
    }

    .trial-cta-image {
      width: 170px;
      height: 95px;
    }

    .trial-cta .trial-primary-button {
      grid-column: 1 / -1;
      width: min(320px, 100%);
      justify-self: center;
    }
  }

  @media (max-width: 560px) {
    .trial-gallery,
    .trial-cta {
      padding-right: 16px;
      padding-left: 16px;
    }

    .trial-hero-inner {
      padding: 37px 17px 32px;
    }

    .trial-hand-title {
      font-size: 41px;
    }

    .trial-hero-benefits {
      display: grid;
      grid-template-columns: 1fr;
      width: max-content;
      margin-right: auto;
      margin-left: auto;
    }

    .trial-categories {
      display: grid;
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .trial-category-link {
      min-width: 0;
      width: 100%;
    }

    .trial-artwork-grid {
      grid-template-columns: 1fr;
    }

    .trial-section-title,
    .trial-strip-title {
      font-size: 25px;
    }

    .trial-feature-grid {
      grid-template-columns: 1fr;
    }

    .trial-feature-item,
    .trial-feature-item:nth-child(even) {
      border-left: 0;
    }

    .trial-feature-item
      + .trial-feature-item {
      border-top: 1px solid var(--trial-line);
    }

    .trial-feature-item:last-child {
      grid-column: auto;
      width: 100%;
    }

    .trial-cta-inner {
      padding: 24px 18px 27px;
      grid-template-columns: 1fr;
      text-align: center;
    }

    .trial-cta-image {
      width: 220px;
      height: 104px;
      justify-self: center;
    }

    .trial-cta-title {
      font-size: 29px;
    }
  }
`;

export default async function TrialPage({
  searchParams,
}: TrialPageProps) {
  const [session, params] = await Promise.all([
    auth(),
    searchParams,
  ]);

  const category = isCategoryKey(
    params.category,
  )
    ? params.category
    : 'all';

  const sort =
    params.sort === 'title'
      ? 'title'
      : 'latest';

  const filteredArtworks = ARTWORKS.filter(
    (artwork) =>
      category === 'all' ||
      artwork.category === category,
  ).sort((a, b) =>
    sort === 'title'
      ? a.title.localeCompare(b.title, 'ko')
      : b.order - a.order,
  );

  const bookHref = session?.user
    ? '/dashboard/book'
    : '/login?callbackUrl=/dashboard/book';

  return (
    <div className="storybook-public-page trial-storybook-page">
      <StorybookPublicHeader
        activeKey="trial"
        ctaHref={bookHref}
      />

      <main>
        <section className="trial-hero">
          <div
            className="trial-hero-decoration"
            aria-hidden="true"
          >
            <Image
              src="/home/storybook/hero-left.webp"
              alt=""
              fill
              priority
              sizes="195px"
            />
          </div>

          <div className="trial-hero-image">
            <Image
              src="/home/storybook/hero-book.webp"
              alt="가족의 기억을 담은 달동네 스토리북"
              fill
              priority
              sizes="(max-width: 860px) 100vw, 60vw"
            />
          </div>

          <div className="trial-hero-inner">
            <div className="trial-hero-copy">
              <h1 className="trial-hand-title">
                이야기가 담긴 책,
                <br />
                이렇게 완성됩니다
                <span className="trial-heart">
                  ♡
                </span>
              </h1>

              <p className="trial-hero-description">
                소중한 순간들을 모아 한 권의
                책으로.
                <br />
                세상에 하나뿐인 당신만의
                스토리북을 만나보세요.
              </p>

              <Link
                href={bookHref}
                className="trial-primary-button"
              >
                나만의 스토리북 만들기&nbsp; →
              </Link>

              <div className="trial-hero-benefits">
                {[
                  {
                    image:
                      '/home/storybook/process-1.webp',
                    text: '사진과 기억을 담아',
                  },
                  {
                    image:
                      '/home/storybook/process-3.webp',
                    text: '스토리로 엮어',
                  },
                  {
                    image:
                      '/home/storybook/process-4.webp',
                    text: '세상에 하나뿐인 책 완성',
                  },
                ].map((item) => (
                  <div
                    key={item.text}
                    className="trial-hero-benefit"
                  >
                    <div className="trial-benefit-image">
                      <Image
                        src={item.image}
                        alt=""
                        fill
                        sizes="44px"
                      />
                    </div>

                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="trial-gallery">
          <div className="trial-gallery-inner">
            <div className="trial-filter-bar">
              <nav
                className="trial-categories"
                aria-label="작품 유형 필터"
              >
                {CATEGORY_ITEMS.map((item) => (
                  <Link
                    key={item.key}
                    href={createFilterHref(
                      item.key,
                      sort,
                    )}
                    className={[
                      'trial-category-link',
                      item.key === category
                        ? 'is-active'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    aria-current={
                      item.key === category
                        ? 'page'
                        : undefined
                    }
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <form
                action="/trial"
                method="get"
                className="trial-sort-form"
              >
                {category !== 'all' ? (
                  <input
                    type="hidden"
                    name="category"
                    value={category}
                  />
                ) : null}

                <select
                  name="sort"
                  defaultValue={sort}
                  className="trial-sort-select"
                  aria-label="작품 정렬"
                >
                  <option value="latest">
                    최신순
                  </option>
                  <option value="title">
                    이름순
                  </option>
                </select>

                <button
                  type="submit"
                  className="trial-sort-button"
                  aria-label="정렬 적용"
                >
                  ↻
                </button>
              </form>
            </div>

            <div className="trial-artwork-grid">
              {filteredArtworks.length > 0 ? (
                filteredArtworks.map((artwork) => (
                  <article
                    key={artwork.id}
                    className="trial-artwork-card"
                  >
                      <div className="trial-artwork-copy">
                      <h2>{artwork.title}</h2>
                      <p>{artwork.subtitle}</p>
                      <span className="trial-artwork-tag">
                        {artwork.categoryLabel}
                      </span>
                    </div>
                  </article>
                ))
              ) : (
                <div className="trial-empty">
                  선택한 분류의 작품이 아직
                  준비되지 않았습니다.
                </div>
              )}
            </div>

            <div className="trial-gallery-action">
              <Link
                href={bookHref}
                className="trial-outline-button"
              >
                내 이야기로 시작하기&nbsp; →
              </Link>
            </div>

            <section className="trial-content-strip">
              <h2 className="trial-strip-title">
                각 작품에는
                <br />
                무엇이 담길까요?
                <span className="trial-heart">
                  ♡
                </span>
              </h2>

              <div className="trial-feature-grid">
                {CONTENT_FEATURES.map((item) => (
                  <article
                    key={item.title}
                    className="trial-feature-item"
                  >
                    <div className="trial-feature-image">
                      <Image
                        src={item.image}
                        alt=""
                        fill
                        sizes="52px"
                      />
                    </div>

                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </section>

        <section className="trial-cta">
          <div className="trial-cta-inner">
            <div className="trial-cta-image">
              <Image
                src="/home/storybook/hero-left.webp"
                alt="꽃과 추억 사진이 놓인 책상"
                fill
                sizes="315px"
              />
            </div>

            <div className="trial-cta-copy">
              <h2 className="trial-cta-title">
                당신의 이야기도 누군가에게는
                소중한 선물이 됩니다.
                <span className="trial-heart">
                  ♡
                </span>
              </h2>

              <p>
                지금, 한 권의 책으로 당신의
                삶을 기록해보세요.
              </p>
            </div>

            <Link
              href={bookHref}
              className="trial-primary-button"
            >
              스토리북 만들기&nbsp; →
            </Link>
          </div>
        </section>
      </main>

      <style
        dangerouslySetInnerHTML={{
          __html: styles,
        }}
      />
    </div>
  );
}
