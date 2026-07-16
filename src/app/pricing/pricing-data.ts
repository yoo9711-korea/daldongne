import type {
  ProductPlanCode,
} from '@/lib/products/catalog';

export type PricingBookType = {
  title: string;
  text: string;
};

export type PricingServiceStep = {
  number: string;
  title: string;
  text: string;
};

export type SubscriptionComparisonItem = {
  code: ProductPlanCode;
  postcard: string;
  review: string;
  recommendation: string;
};

export const bookTypes = [
  {
    title: '인생 기록책',
    text:
      '한 사람의 성장 과정과 중요한 삶의 순간을 한 권에 기록합니다.',
  },
  {
    title: '가족 이야기책',
    text:
      '가족이 함께 보낸 시간과 서로의 이야기를 한 권에 담습니다.',
  },
  {
    title: '부부 이야기책',
    text:
      '만남부터 현재까지 부부가 함께 걸어온 시간을 기록합니다.',
  },
  {
    title: '성장 기록책',
    text:
      '아이의 출생과 성장 과정, 가족의 기억을 정리합니다.',
  },
  {
    title: '여행 기록책',
    text:
      '여행 사진과 그날의 경험을 한 권의 기록으로 남깁니다.',
  },
] as const satisfies readonly PricingBookType[];

export const serviceSteps = [
  {
    number: '01',
    title: '사진과 이야기 기록',
    text:
      '사진을 모으고 그 사진에 얽힌 이야기를 차근차근 남깁니다.',
  },
  {
    number: '02',
    title: 'AI 기록 정리',
    text:
      'AI가 사진과 글을 분석하고 문장을 다듬어 기록을 정리합니다.',
  },
  {
    number: '03',
    title: '목차와 원고 제작',
    text:
      '기록을 시간과 주제에 따라 묶어 한 권의 책 원고로 만듭니다.',
  },
  {
    number: '04',
    title: '사양과 금액 확정',
    text:
      '페이지, 제본, 수량과 선택 옵션을 확인해 최종 견적을 안내합니다.',
  },
  {
    number: '05',
    title: '인쇄와 배송',
    text:
      '결제 후 최종 확인을 거쳐 책을 제작하고 안전하게 배송합니다.',
  },
] as const satisfies readonly PricingServiceStep[];

export const subscriptionComparison = [
  {
    code: 'MONTHLY_RECORD_BASIC',
    postcard: '없음',
    review: 'AI 정리',
    recommendation:
      '기록부터 시작하고 싶은 분',
  },
  {
    code:
      'MONTHLY_RECORD_QUARTERLY_POSTCARD',
    postcard: '분기별 1회',
    review: 'AI 정리',
    recommendation:
      '가끔 실물 기록을 받고 싶은 분',
  },
  {
    code:
      'MONTHLY_RECORD_MONTHLY_POSTCARD',
    postcard: '매월 1회',
    review: 'AI 정리',
    recommendation:
      '매달 추억을 받아보고 싶은 분',
  },
  {
    code: 'MONTHLY_RECORD_PREMIUM',
    postcard: '매월 1회',
    review: '사람 검수 포함',
    recommendation:
      '완성도를 중요하게 생각하는 분',
  },
] as const satisfies readonly SubscriptionComparisonItem[];