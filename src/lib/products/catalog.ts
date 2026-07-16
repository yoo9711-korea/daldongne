export type ProductBillingType =
  | 'ONE_TIME'
  | 'MONTHLY';

export type ProductCategory =
  | 'LIFE_BOOK'
  | 'MONTHLY_RECORD';

export type ProductPlanCode =
  | 'LIFE_BOOK_BASIC'
  | 'MONTHLY_RECORD_BASIC'
  | 'MONTHLY_RECORD_QUARTERLY_POSTCARD'
  | 'MONTHLY_RECORD_MONTHLY_POSTCARD'
  | 'MONTHLY_RECORD_PREMIUM';

export type ProductAddonCode =
  | 'HARDCOVER'
  | 'HUMAN_REVIEW'
  | 'PRODUCTION_CONSULTING'
  | 'EXTRA_PHOTOS'
  | 'EXTRA_PAGES'
  | 'EXTRA_COPY';

export type ProductPlan = {
  code: ProductPlanCode;
  category: ProductCategory;
  billingType: ProductBillingType;
  name: string;
  shortName: string;
  description: string;
  price: number;
  priceSuffix: string;
  badge?: string;
  recommended?: boolean;
  included: readonly string[];
  excluded: readonly string[];
  conditions: readonly string[];
  ctaLabel: string;
  sortOrder: number;
};

export type ProductAddon = {
  code: ProductAddonCode;
  name: string;
  description: string;
  price: number | null;
  priceLabel: string;
  availableFor: readonly ProductCategory[];
  sortOrder: number;
};

export const PRODUCT_CATEGORY_LABELS: Record<
  ProductCategory,
  string
> = {
  LIFE_BOOK: '인생책 제작',
  MONTHLY_RECORD: '월간기록 구독',
};

export const PRODUCT_BILLING_LABELS: Record<
  ProductBillingType,
  string
> = {
  ONE_TIME: '한 번 결제',
  MONTHLY: '매월 결제',
};

export const PRODUCT_PLANS = [
  {
    code: 'LIFE_BOOK_BASIC',
    category: 'LIFE_BOOK',
    billingType: 'ONE_TIME',
    name: '인생책 제작',
    shortName: '인생책',
    description:
      '사진과 이야기를 AI가 정리하여 50~80페이지 분량의 한 권의 책으로 제작합니다.',
    price: 99000,
    priceSuffix: '원부터',
    badge: '대표 상품',
    recommended: true,
    included: [
      '사진 50장 이하',
      'AI 사진 분석',
      'AI 글 다듬기',
      'AI 목차 추천',
      'AI 원고 생성',
      '50~80페이지 기본 원고',
      '기본 인쇄·출판·택배비 포함',
      '기본 책 1권',
    ],
    excluded: [
      'AI 이미지 생성',
      'AI 영상 생성',
      '하드커버 제작',
      '사람 원고 검수',
    ],
    conditions: [
      '사진 50장 초과 시 추가 견적',
      '80페이지 초과 시 추가 견적',
      '하드커버와 추가 부수는 별도 옵션',
    ],
    ctaLabel: '인생책 제작 상담하기',
    sortOrder: 10,
  },
  {
    code: 'MONTHLY_RECORD_BASIC',
    category: 'MONTHLY_RECORD',
    billingType: 'MONTHLY',
    name: '월간기록 기본',
    shortName: '기본 구독',
    description:
      '매달 사진과 이야기를 기록하고 AI가 정리해 주는 기본 구독입니다.',
    price: 9900,
    priceSuffix: '원 / 월',
    badge: '부담 없이 시작',
    included: [
      '월별 사진·이야기 저장',
      'AI 글 다듬기',
      '월간 기록 정리',
      '연간 목차 추천',
      '12개월 후 기본 인생책 1권',
      '기본 인쇄·택배 포함',
    ],
    excluded: [
      '실물 엽서 발송',
      '사람 원고 검수',
      '하드커버 제작',
    ],
    conditions: [
      '연간 책 제작은 12개월 유지 고객 기준',
      '사진과 페이지 초과분은 추가 견적',
    ],
    ctaLabel: '월간기록 시작하기',
    sortOrder: 20,
  },
  {
    code:
      'MONTHLY_RECORD_QUARTERLY_POSTCARD',
    category: 'MONTHLY_RECORD',
    billingType: 'MONTHLY',
    name: '월간기록 + 분기 엽서',
    shortName: '분기 엽서',
    description:
      '월간기록 기본 서비스에 분기마다 실물 엽서를 받아보는 구독입니다.',
    price: 12900,
    priceSuffix: '원 / 월',
    included: [
      '월간기록 기본 서비스 전체',
      '분기별 실물 엽서 발송',
      '연간 최대 4회 엽서',
      '12개월 후 기본 인생책 1권',
    ],
    excluded: [
      '매달 엽서 발송',
      '사람 원고 검수',
      '하드커버 제작',
    ],
    conditions: [
      '연간 책 제작은 12개월 유지 고객 기준',
      '엽서 주소 변경 시 사전 수정 필요',
    ],
    ctaLabel: '분기 엽서 구독하기',
    sortOrder: 30,
  },
  {
    code:
      'MONTHLY_RECORD_MONTHLY_POSTCARD',
    category: 'MONTHLY_RECORD',
    billingType: 'MONTHLY',
    name: '월간기록 + 매달 엽서',
    shortName: '매달 엽서',
    description:
      '매달 남긴 기록 가운데 한 장면을 실물 엽서로 받아보는 구독입니다.',
    price: 14900,
    priceSuffix: '원 / 월',
    badge: '추천 구독',
    recommended: true,
    included: [
      '월간기록 기본 서비스 전체',
      '매월 실물 엽서 발송',
      '연간 최대 12회 엽서',
      '12개월 후 기본 인생책 1권',
    ],
    excluded: [
      '사람 원고 검수',
      '하드커버 제작',
    ],
    conditions: [
      '연간 책 제작은 12개월 유지 고객 기준',
      '월별 엽서 제작 일정에 따라 발송일 변동 가능',
    ],
    ctaLabel: '매달 엽서 구독하기',
    sortOrder: 40,
  },
  {
    code:
      'MONTHLY_RECORD_PREMIUM',
    category: 'MONTHLY_RECORD',
    billingType: 'MONTHLY',
    name: '월간기록 프리미엄',
    shortName: '프리미엄',
    description:
      '매달 엽서와 사람의 기록 검수를 함께 제공하는 프리미엄 구독입니다.',
    price: 19900,
    priceSuffix: '원 / 월',
    badge: '사람 검수 포함',
    included: [
      '월간기록 기본 서비스 전체',
      '매월 실물 엽서 발송',
      '월간 기록 사람 검수',
      '연간 원고 우선 검수',
      '12개월 후 기본 인생책 1권',
    ],
    excluded: [
      '하드커버 제작',
      '추가 인쇄 부수',
    ],
    conditions: [
      '연간 책 제작은 12개월 유지 고객 기준',
      '대량 수정과 전문 교정은 별도 상담',
    ],
    ctaLabel: '프리미엄 구독 상담하기',
    sortOrder: 50,
  },
] as const satisfies readonly ProductPlan[];

export const PRODUCT_ADDONS = [
  {
    code: 'HARDCOVER',
    name: '하드커버 제작',
    description:
      '기본 소프트커버를 보관성이 높은 하드커버로 변경합니다.',
    price: null,
    priceLabel: '제작 사양 확인 후 견적',
    availableFor: [
      'LIFE_BOOK',
      'MONTHLY_RECORD',
    ],
    sortOrder: 10,
  },
  {
    code: 'HUMAN_REVIEW',
    name: '사람 원고 검수',
    description:
      'AI가 정리한 원고를 사람이 읽고 표현과 흐름을 점검합니다.',
    price: null,
    priceLabel: '원고 분량 확인 후 견적',
    availableFor: [
      'LIFE_BOOK',
      'MONTHLY_RECORD',
    ],
    sortOrder: 20,
  },
  {
    code: 'PRODUCTION_CONSULTING',
    name: '맞춤 제작 상담',
    description:
      '책 구성, 사진 배치, 표지 방향과 제작 사양을 함께 상담합니다.',
    price: null,
    priceLabel: '상담 후 확정',
    availableFor: [
      'LIFE_BOOK',
      'MONTHLY_RECORD',
    ],
    sortOrder: 30,
  },
  {
    code: 'EXTRA_PHOTOS',
    name: '사진 추가',
    description:
      '기본 포함 수량인 사진 50장을 초과하는 경우 선택합니다.',
    price: null,
    priceLabel: '추가 사진 수량별 견적',
    availableFor: [
      'LIFE_BOOK',
      'MONTHLY_RECORD',
    ],
    sortOrder: 40,
  },
  {
    code: 'EXTRA_PAGES',
    name: '페이지 추가',
    description:
      '기본 최대 분량인 80페이지를 초과하는 경우 선택합니다.',
    price: null,
    priceLabel: '추가 페이지별 견적',
    availableFor: [
      'LIFE_BOOK',
      'MONTHLY_RECORD',
    ],
    sortOrder: 50,
  },
  {
    code: 'EXTRA_COPY',
    name: '책 추가 인쇄',
    description:
      '가족 선물이나 보관을 위해 동일한 책을 추가로 인쇄합니다.',
    price: null,
    priceLabel: '부수·사양별 견적',
    availableFor: [
      'LIFE_BOOK',
      'MONTHLY_RECORD',
    ],
    sortOrder: 60,
  },
] as const satisfies readonly ProductAddon[];

export const DEFAULT_PRODUCT_PLAN_CODE:
  ProductPlanCode = 'LIFE_BOOK_BASIC';

export function getProductPlan(
  code: ProductPlanCode,
) {
  return PRODUCT_PLANS.find(
    (product) => product.code === code,
  );
}

export function getProductAddon(
  code: ProductAddonCode,
) {
  return PRODUCT_ADDONS.find(
    (addon) => addon.code === code,
  );
}

export function getProductPlansByCategory(
  category: ProductCategory,
) {
  return PRODUCT_PLANS.filter(
    (product) =>
      product.category === category,
  ).sort(
    (first, second) =>
      first.sortOrder - second.sortOrder,
  );
}

export function getProductAddonsByCategory(
  category: ProductCategory,
) {
  return PRODUCT_ADDONS.filter(
    (addon) =>
      addon.availableFor.includes(
        category,
      ),
  ).sort(
    (first, second) =>
      first.sortOrder - second.sortOrder,
  );
}

export function formatProductPrice(
  price: number,
  priceSuffix: string,
) {
  return `${price.toLocaleString(
    'ko-KR',
  )}${priceSuffix}`;
}