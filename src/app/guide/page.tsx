import { auth } from '@/auth';
import StorybookPublicHeader from '@/components/storybook/StorybookPublicHeader';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

const FAQ_ITEMS = [
  {
    question: '제작 기간은 얼마나 걸리나요?',
    answer:
      '자료가 모두 접수된 뒤 평균 16~26일 정도 소요됩니다. 사진 수, 원고 분량, 수정 범위와 인쇄 일정에 따라 기간이 달라질 수 있으며 상세 일정은 상담 후 안내드립니다.',
  },
  {
    question: '어떤 자료를 준비해야 하나요?',
    answer:
      '책에 담고 싶은 사진과 사진 속 기억, 함께한 사람, 당시의 감정처럼 떠오르는 이야기를 준비해 주세요. 처음에는 사진 몇 장과 짧은 문장만 있어도 시작할 수 있습니다.',
  },
  {
    question: '사진이 많지 않아도 만들 수 있나요?',
    answer:
      '가능합니다. 사진이 적다면 인터뷰와 이야기 중심으로 구성하고, 사진이 많다면 시간의 흐름에 맞춰 선별해 책의 완성도를 높입니다.',
  },
  {
    question: '수정은 몇 번까지 가능한가요?',
    answer:
      '원고와 디자인 시안을 확인한 뒤 수정 범위를 안내드립니다. 기본 수정 외에 페이지 추가, 대규모 구성 변경, 추가 인쇄 등은 별도 견적이 발생할 수 있습니다.',
  },
  {
    question: '배송은 어떻게 되나요?',
    answer:
      '제작이 끝난 책은 검수 후 안전하게 포장하여 택배로 보내드립니다. 발송이 완료되면 배송 조회가 가능하도록 안내드립니다.',
  },
] as const;

const INQUIRY_TYPE_LABELS: Record<string, string> = {
  product: '상품 및 가격 문의',
  production: '제작 과정 문의',
  material: '사진·자료 준비 문의',
  revision: '수정·인쇄 문의',
  other: '기타 문의',
};

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function normalizeText(
  value: FormDataEntryValue | null,
) {
  return typeof value === 'string'
    ? value.trim()
    : '';
}

function maskCustomerName(name: string) {
  const characters = Array.from(name.trim());

  if (characters.length === 0) {
    return '고객님';
  }

  return `${characters[0]}○○ 고객님`;
}

async function getApprovedReviews() {
  try {
    return await prisma.customerReview.findMany({
      where: {
        status: 'APPROVED',
        isVisible: true,
      },
      orderBy: [
        {
          isFeatured: 'desc',
        },
        {
          approvedAt: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
      take: 4,
      select: {
        id: true,
        displayName: true,
        title: true,
        content: true,
        rating: true,
      },
    });
  } catch (error) {
    console.error(
      '가이드 페이지 고객 후기 조회 오류',
      error,
    );

    return [];
  }
}

async function submitContactInquiry(
  formData: FormData,
) {
  'use server';

  const name = normalizeText(
    formData.get('name'),
  );
  const email = normalizeText(
    formData.get('email'),
  ).toLowerCase();
  const inquiryType = normalizeText(
    formData.get('inquiryType'),
  );
  const message = normalizeText(
    formData.get('message'),
  );
  const website = normalizeText(
    formData.get('website'),
  );

  if (website) {
    redirect('/guide?contact=sent#contact');
  }

  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const inquiryLabel =
    INQUIRY_TYPE_LABELS[inquiryType];

  if (
    name.length < 2 ||
    name.length > 30 ||
    !emailPattern.test(email) ||
    !inquiryLabel ||
    message.length < 10 ||
    message.length > 1500
  ) {
    redirect('/guide?contact=invalid#contact');
  }

  const resendApiKey =
    process.env.RESEND_API_KEY;

  const adminEmail =
    process.env.ADMIN_EMAIL?.trim();

  if (!resendApiKey || !adminEmail) {
    console.error(
      '[PUBLIC_CONTACT_CONFIG_ERROR]',
      {
        hasResendApiKey:
          Boolean(resendApiKey),
        hasAdminEmail:
          Boolean(adminEmail),
      },
    );

    redirect('/guide?contact=config#contact');
  }

  const from =
    process.env.EMAIL_FROM ||
    '달동네 출판사 <onboarding@resend.dev>';

  const resend =
    new Resend(resendApiKey);

  let sendFailed = false;

  try {
    const result =
      await resend.emails.send({
        from,
        to: adminEmail,
        subject:
          `[달동네 문의] ${inquiryLabel} - ${name}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.75; color: #2f211a;">
            <h2 style="margin: 0 0 18px;">
              달동네 홈페이지 문의가 접수되었습니다.
            </h2>

            <table style="width: 100%; border-collapse: collapse; margin: 0 0 22px;">
              <tbody>
                <tr>
                  <td style="width: 130px; padding: 10px; border: 1px solid #ead7c8; font-weight: bold;">
                    이름
                  </td>
                  <td style="padding: 10px; border: 1px solid #ead7c8;">
                    ${escapeHtml(name)}
                  </td>
                </tr>

                <tr>
                  <td style="padding: 10px; border: 1px solid #ead7c8; font-weight: bold;">
                    이메일
                  </td>
                  <td style="padding: 10px; border: 1px solid #ead7c8;">
                    ${escapeHtml(email)}
                  </td>
                </tr>

                <tr>
                  <td style="padding: 10px; border: 1px solid #ead7c8; font-weight: bold;">
                    문의 유형
                  </td>
                  <td style="padding: 10px; border: 1px solid #ead7c8;">
                    ${escapeHtml(inquiryLabel)}
                  </td>
                </tr>
              </tbody>
            </table>

            <h3 style="margin: 0 0 10px;">
              문의 내용
            </h3>

            <div style="padding: 16px; border-radius: 12px; background: #fff7ef; white-space: pre-wrap;">
              ${escapeHtml(message)}
            </div>
          </div>
        `,
      });

    if (result.error) {
      sendFailed = true;

      console.error(
        '[PUBLIC_CONTACT_EMAIL_ERROR]',
        result.error,
      );
    }
  } catch (error) {
    sendFailed = true;

    console.error(
      '[PUBLIC_CONTACT_EMAIL_EXCEPTION]',
      error,
    );
  }

  redirect(
    sendFailed
      ? '/guide?contact=error#contact'
      : '/guide?contact=sent#contact',
  );
}

type GuidePageProps = {
  searchParams: Promise<{
    contact?: string;
  }>;
};

const styles = `
  .guide-storybook-page,
  .guide-storybook-page * {
    box-sizing: border-box;
  }

  .guide-storybook-page {
    --guide-ink: #4a3024;
    --guide-soft: #725e52;
    --guide-coral: #e97861;
    --guide-coral-dark: #d9624c;
    --guide-line: rgba(126, 87, 64, 0.14);
    width: 100%;
    min-height: 100vh;
    overflow-x: clip;
    color: var(--guide-ink);
    background: #fffdf9;
    font-family: 'Noto Sans KR', sans-serif;
  }

  .guide-storybook-page a {
    color: inherit;
  }

  .guide-hand-title,
  .guide-section-title,
  .guide-cta-title {
    font-family:
      'Gamja Flower',
      'MapoFlowerIsland',
      cursive;
    font-weight: 400;
    letter-spacing: 0.015em;
  }

  .guide-heart {
    margin-left: 7px;
    color: #ef806b;
    font-family: Arial, sans-serif;
    font-size: 0.82em;
  }

  .guide-hero {
    position: relative;
    min-height: 350px;
    overflow: hidden;
    background:
      linear-gradient(
        90deg,
        rgba(255, 253, 249, 0.99) 0%,
        rgba(255, 253, 249, 0.96) 39%,
        rgba(255, 253, 249, 0.38) 59%,
        rgba(255, 253, 249, 0) 78%
      ),
      #f7efe4;
  }

  .guide-hero-decoration {
    position: absolute;
    inset: 0 auto 0 0;
    width: 185px;
    opacity: 0.92;
  }

  .guide-hero-decoration img {
    object-fit: cover;
    object-position: left center;
  }

  .guide-hero-image {
    position: absolute;
    inset: 0 0 0 50%;
  }

  .guide-hero-image img {
    object-fit: cover;
    object-position: center 58%;
  }

  .guide-hero-inner {
    position: relative;
    z-index: 2;
    width: min(1480px, 100%);
    min-height: 350px;
    margin: 0 auto;
    padding:
      43px
      clamp(24px, 4vw, 62px)
      38px
      clamp(195px, 15vw, 225px);
    display: flex;
    align-items: center;
  }

  .guide-hero-copy {
    width: min(470px, 38vw);
  }

  .guide-hand-title {
    margin: 0;
    font-size: clamp(48px, 3.97vw, 60px);
    line-height: 1.16;
    letter-spacing: -0.005em;
    word-break: keep-all;
  }

  .guide-hero-description {
    margin: 18px 0 0;
    color: #57453b;
    font-size: 18px;
    line-height: 1.78;
    word-break: keep-all;
  }

  .guide-hero-benefits {
    display: flex;
    align-items: flex-start;
    gap: 30px;
    margin-top: 23px;
  }

  .guide-hero-benefit {
    display: grid;
    justify-items: center;
    gap: 7px;
    min-width: 70px;
    text-align: center;
  }

  .guide-benefit-image {
    position: relative;
    width: 54px;
    height: 54px;
  }

  .guide-benefit-image img {
    object-fit: contain;
  }

  .guide-hero-benefit span {
    color: #5e493e;
    font-size: 14px;
    font-weight: 800;
    line-height: 1.45;
    word-break: keep-all;
  }

  .guide-reviews {
    padding: 22px 24px 27px;
    border-bottom: 1px solid rgba(126, 87, 64, 0.08);
    background:
      linear-gradient(
        180deg,
        #fffdf9,
        #fff9f2
      );
  }

  .guide-reviews-inner {
    width: min(1400px, 100%);
    margin: 0 auto;
    display: grid;
    grid-template-columns:
      minmax(190px, 0.48fr)
      minmax(0, 2.52fr);
    align-items: center;
    gap: 25px;
  }

  .guide-review-heading {
    min-height: 150px;
    padding: 8px 14px;
    display: grid;
    align-content: center;
    border-right: 1px solid var(--guide-line);
  }

  .guide-section-title {
    margin: 0;
    font-size: 34px;
    line-height: 1.3;
  }

  .guide-review-house {
    position: relative;
    width: 180px;
    height: 108px;
    margin-top: 14px;
    overflow: visible;
  }

  .guide-review-house img {
    object-fit: contain;
    object-position: center center;
  }

  .guide-review-grid {
    display: grid;
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    gap: 14px;
  }

  .guide-review-card {
    position: relative;
    min-width: 0;
    min-height: 168px;
    padding: 30px 17px 16px;
    border: 1px solid rgba(131, 89, 65, 0.1);
    border-radius: 14px;
    background: #ffffff;
    box-shadow:
      0 8px 22px
      rgba(87, 57, 40, 0.05);
  }

  .guide-review-card::before {
    position: absolute;
    top: 7px;
    left: 15px;
    content: '“';
    color: #f1a48f;
    font-size: 40px;
    font-weight: 900;
    line-height: 1;
  }

  .guide-review-card h3 {
    margin: 0 0 7px;
    color: #4c382e;
    font-size: 15px;
    line-height: 1.45;
  }

  .guide-review-card p {
    margin: 0;
    color: #5e4c42;
    font-size: 15px;
    line-height: 1.75;
    word-break: keep-all;
  }

  .guide-review-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 9px;
    margin-top: 12px;
  }

  .guide-review-name {
    color: #806d62;
    font-size: 12px;
  }

  .guide-review-stars {
    display: flex;
    gap: 1px;
    color: #e6ddd8;
    font-size: 10px;
  }

  .guide-review-stars .is-active {
    color: #ef9569;
  }

  .guide-review-empty {
    grid-column: 1 / -1;
    min-height: 120px;
    display: grid;
    place-items: center;
    border: 1px dashed rgba(130, 89, 65, 0.2);
    border-radius: 14px;
    color: #7e6a5f;
    background: #fffaf6;
    font-size: 14px;
    line-height: 1.7;
    text-align: center;
  }

  .guide-support {
    padding: 22px 24px 28px;
    background: #fffdf9;
  }

  .guide-support-inner {
    width: min(1400px, 100%);
    margin: 0 auto;
    display: grid;
    grid-template-columns:
      minmax(0, 1.02fr)
      minmax(0, 0.98fr);
    gap: 35px;
  }

  .guide-faq-panel {
    min-width: 0;
    padding-right: 30px;
    border-right: 1px solid var(--guide-line);
  }

  .guide-faq-list {
    margin-top: 15px;
    display: grid;
    gap: 8px;
  }

  .guide-faq-item {
    overflow: hidden;
    border: 1px solid rgba(137, 95, 69, 0.15);
    border-radius: 11px;
    background: #ffffff;
  }

  .guide-faq-item summary {
    position: relative;
    min-height: 48px;
    padding: 11px 42px 11px 16px;
    display: flex;
    align-items: center;
    color: #4f3b31;
    cursor: pointer;
    font-size: 15px;
    font-weight: 800;
    line-height: 1.45;
    list-style: none;
  }

  .guide-faq-item summary::-webkit-details-marker {
    display: none;
  }

  .guide-faq-item summary::after {
    position: absolute;
    top: 50%;
    right: 16px;
    content: '⌄';
    color: #8d776b;
    font-size: 18px;
    transform: translateY(-55%);
  }

  .guide-faq-item[open] summary {
    color: #d96751;
  }

  .guide-faq-item[open] summary::after {
    content: '⌃';
  }

  .guide-faq-question {
    margin-right: 6px;
    color: #e77760;
    font-weight: 900;
  }

  .guide-faq-answer {
    margin: 0;
    padding: 0 16px 15px;
    color: #756157;
    font-size: 14px;
    line-height: 1.75;
    word-break: keep-all;
  }

  .guide-contact-panel {
    min-width: 0;
  }

  .guide-contact-layout {
    margin-top: 14px;
    display: grid;
    grid-template-columns:
      minmax(180px, 0.68fr)
      minmax(0, 1.32fr);
    gap: 18px;
  }

  .guide-contact-info {
    display: grid;
    align-content: start;
    gap: 13px;
  }

  .guide-contact-item {
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr);
    gap: 9px;
    align-items: center;
  }

  .guide-contact-icon {
    display: flex;
    width: 42px;
    height: 42px;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    color: #b46f48;
    background:
      linear-gradient(
        145deg,
        #ffe9d8,
        #fff8ef
      );
    overflow: hidden;
    font-family: Arial, sans-serif;
    font-size: 20px;
    line-height: 1;
  }

  .guide-contact-item strong {
    display: block;
    color: #4d382f;
    font-size: 14px;
  }

  .guide-contact-item a,
  .guide-contact-item span {
    display: block;
    margin-top: 3px;
    color: #78655a !important;
    font-size: 13px;
    line-height: 1.55;
    text-decoration: none;
    word-break: break-all;
  }

  .guide-contact-form {
    padding: 15px;
    display: grid;
    gap: 10px;
    border: 1px solid rgba(137, 95, 69, 0.15);
    border-radius: 12px;
    background: #ffffff;
    box-shadow:
      0 8px 22px
      rgba(87, 57, 40, 0.045);
  }

  .guide-form-row {
    display: grid;
    grid-template-columns: 70px minmax(0, 1fr);
    align-items: center;
    gap: 9px;
  }

  .guide-form-row.is-message {
    align-items: start;
  }

  .guide-form-row label {
    color: #58443a;
    font-size: 15px;
    font-weight: 900;
  }

  .guide-form-row input,
  .guide-form-row select,
  .guide-form-row textarea {
    width: 100%;
    border: 1px solid #eadfd7;
    border-radius: 7px;
    color: #4d3a31;
    background: #fffdfb;
    font: inherit;
    font-size: 14px;
    outline: none;
    transition:
      border-color 150ms ease,
      box-shadow 150ms ease;
  }

  .guide-form-row input,
  .guide-form-row select {
    min-height: 36px;
    padding: 0 11px;
  }

  .guide-form-row textarea {
    min-height: 94px;
    padding: 10px 11px;
    resize: vertical;
  }

  .guide-form-row input:focus,
  .guide-form-row select:focus,
  .guide-form-row textarea:focus {
    border-color: #e99b83;
    box-shadow:
      0 0 0 3px
      rgba(233, 123, 96, 0.1);
  }

  .guide-form-honeypot {
    position: absolute !important;
    left: -10000px !important;
    width: 1px !important;
    height: 1px !important;
    overflow: hidden !important;
  }

  .guide-submit-button {
    min-height: 44px;
    border: 0;
    border-radius: 7px;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ed896e,
        #df654f
      );
    box-shadow:
      0 8px 18px
      rgba(211, 101, 76, 0.17);
    cursor: pointer;
    font: inherit;
    font-size: 13px;
    font-weight: 900;
  }

  .guide-form-message {
    margin: 0;
    padding: 10px 12px;
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.6;
  }

  .guide-form-message.is-success {
    color: #46644b;
    background: #edf7ee;
  }

  .guide-form-message.is-error {
    color: #9e4e3f;
    background: #fff0ec;
  }

  .guide-contact-note {
    margin: 10px 0 0;
    padding: 8px 11px;
    border: 1px solid #ead7c9;
    border-radius: 999px;
    color: #9d775f;
    background: #fff9f3;
    font-size: 13px;
    line-height: 1.5;
    text-align: center;
  }

  .guide-cta {
    padding: 0 24px 40px;
    background: #fffdf9;
  }

  .guide-cta-inner {
    width: min(1320px, 100%);
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

  .guide-cta-image {
    position: relative;
    width: 315px;
    height: 105px;
  }

  .guide-cta-image img {
    border-radius: 12px;
    object-fit: cover;
    object-position: center 62%;
  }

  .guide-cta-title {
    margin: 0;
    font-size: 37px;
    line-height: 1.25;
  }

  .guide-cta-copy p {
    margin: 7px 0 0;
    color: #79645a;
    font-size: 15px;
  }

  .guide-primary-button {
    display: inline-flex;
    min-height: 52px;
    align-items: center;
    justify-content: center;
    padding: 0 25px;
    border: 1px solid #e4745d;
    border-radius: 999px;
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
    font-size: 15px;
    font-weight: 900;
    text-decoration: none;
    transition:
      transform 160ms ease,
      box-shadow 160ms ease;
  }

  .guide-primary-button:hover {
    transform: translateY(-2px);
  }

  /* 공통 헤더 글씨도 현재 가이드 페이지에서 15% 확대 */
  .guide-storybook-page
    .storybook-public-brand-name {
    font-size: 36px;
  }

  .guide-storybook-page
    .storybook-public-brand-heart {
    font-size: 31px;
  }

  .guide-storybook-page
    .storybook-public-nav-link {
    font-size: 16px;
  }

  .guide-storybook-page
    .storybook-public-cta {
    font-size: 16px;
  }

  @media (max-width: 930px) {
    .guide-storybook-page
      .storybook-public-brand-name {
      font-size: 31px;
    }

    .guide-storybook-page
      .storybook-public-brand-heart {
      font-size: 26px;
    }

    .guide-storybook-page
      .storybook-public-mobile-nav
      .storybook-public-nav-link {
      font-size: 15px;
    }

    .guide-storybook-page
      .storybook-public-cta {
      font-size: 15px;
    }
  }

  @media (max-width: 480px) {
    .guide-storybook-page
      .storybook-public-brand-name {
      font-size: 26px;
    }

    .guide-storybook-page
      .storybook-public-brand-heart {
      font-size: 23px;
    }

    .guide-storybook-page
      .storybook-public-cta {
      font-size: 14px;
    }
  }

  @media (max-width: 1120px) {
    .guide-review-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .guide-contact-layout {
      grid-template-columns: 1fr;
    }

    .guide-contact-info {
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
    }

    .guide-contact-item {
      grid-template-columns: 35px minmax(0, 1fr);
    }

    .guide-contact-icon {
      width: 35px;
      height: 35px;
    }

    .guide-cta-inner {
      grid-template-columns:
        230px minmax(0, 1fr) 220px;
    }

    .guide-cta-image {
      width: 230px;
    }
  }

  @media (max-width: 900px) {
    .guide-hero-inner {
      padding-left: 170px;
    }

    .guide-hero-decoration {
      width: 150px;
    }

    .guide-reviews-inner {
      grid-template-columns: 1fr;
    }

    .guide-review-heading {
      min-height: auto;
      padding: 0 0 14px;
      border-right: 0;
      border-bottom: 1px solid var(--guide-line);
      text-align: center;
    }

    .guide-review-house {
      margin-right: auto;
      margin-left: auto;
    }

    .guide-support-inner {
      grid-template-columns: 1fr;
    }

    .guide-faq-panel {
      padding-right: 0;
      padding-bottom: 25px;
      border-right: 0;
      border-bottom: 1px solid var(--guide-line);
    }

    .guide-cta-inner {
      grid-template-columns:
        170px minmax(0, 1fr);
    }

    .guide-cta-image {
      width: 170px;
      height: 95px;
    }

    .guide-cta .guide-primary-button {
      grid-column: 1 / -1;
      width: min(320px, 100%);
      justify-self: center;
    }
  }

  @media (max-width: 860px) {
    .guide-hero {
      display: grid;
      min-height: auto;
      background: #fff8f0;
    }

    .guide-hero-decoration {
      display: none;
    }

    .guide-hero-image {
      position: relative;
      inset: auto;
      order: 2;
      aspect-ratio: 1.5 / 1;
    }

    .guide-hero-inner {
      min-height: auto;
      padding: 44px 22px 38px;
      order: 1;
    }

    .guide-hero-copy {
      width: min(650px, 100%);
      margin: 0 auto;
      text-align: center;
    }

    .guide-hand-title {
      font-size: clamp(48px, 11.50vw, 63px);
    }

    .guide-hero-benefits {
      justify-content: center;
    }
  }

  @media (max-width: 560px) {
    .guide-reviews,
    .guide-support,
    .guide-cta {
      padding-right: 16px;
      padding-left: 16px;
    }

    .guide-hero-inner {
      padding: 37px 17px 32px;
    }

    .guide-hand-title {
      font-size: 47px;
    }

    .guide-hero-benefits {
      display: grid;
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
      gap: 14px;
    }

    .guide-review-grid {
      grid-template-columns: 1fr;
    }

    .guide-section-title {
      font-size: 29px;
      text-align: center;
    }

    .guide-contact-info {
      grid-template-columns: 1fr;
    }

    .guide-form-row {
      grid-template-columns: 1fr;
      gap: 5px;
    }

    .guide-cta-inner {
      padding: 24px 18px 27px;
      grid-template-columns: 1fr;
      text-align: center;
    }

    .guide-cta-image {
      width: 220px;
      height: 104px;
      justify-self: center;
    }

    .guide-cta-title {
      font-size: 33px;
    }
  }
`;

export default async function GuidePage({
  searchParams,
}: GuidePageProps) {
  const [session, params, reviews] =
    await Promise.all([
      auth(),
      searchParams,
      getApprovedReviews(),
    ]);

  const startHref = session?.user
    ? '/dashboard'
    : '/login?callbackUrl=/dashboard';

  const contactEmail =
    process.env.ADMIN_EMAIL?.trim() ||
    '이메일 설정 확인 중';

  const contactPhone =
    process.env
      .NEXT_PUBLIC_CONTACT_PHONE?.trim() ||
    '02-2060-7492';

  const contactStatus =
    params.contact;

  return (
    <div className="storybook-public-page guide-storybook-page">
      <StorybookPublicHeader
        activeKey="guide"
        ctaHref={startHref}
      />

      <main>
        <section className="guide-hero">
          <div
            className="guide-hero-decoration"
            aria-hidden="true"
          >
            <Image
              src="/home/storybook/hero-left.webp"
              alt=""
              fill
              priority
              sizes="185px"
            />
          </div>

          <div className="guide-hero-image">
            <Image
              src="/home/storybook/detail-hero-bright-v2.webp"
              alt="가족사진을 담은 밝은 아이보리 스토리북"
              fill
              priority
              sizes="(max-width: 860px) 100vw, 60vw"
            />
          </div>

          <div className="guide-hero-inner">
            <div className="guide-hero-copy">
              <h1 className="guide-hand-title">
                당신의 이야기를 들려주셔서
                <br />
                진심으로 감사합니다
                <span className="guide-heart">
                  ♡
                </span>
              </h1>

              <p className="guide-hero-description">
                달동네 스토리북은 고객님의
                소중한 순간을 담아,
                <br />
                세상에 하나뿐인 책으로 만들어
                드립니다.
              </p>

              <div className="guide-hero-benefits">
                {[
                  {
                    image:
                      '/home/storybook/recommend-1.webp',
                    text: '소중한 후기\n감동을 나눠요',
                  },
                  {
                    image:
                      '/home/storybook/process-3.webp',
                    text: '자주 묻는 질문\n빠르게 확인해요',
                  },
                  {
                    image:
                      '/home/storybook/process-2.webp',
                    text: '문의 및 상담\n친절히 도와드려요',
                  },
                ].map((item) => (
                  <div
                    key={item.text}
                    className="guide-hero-benefit"
                  >
                    <div className="guide-benefit-image">
                      <Image
                        src={item.image}
                        alt=""
                        fill
                        sizes="47px"
                      />
                    </div>

                    <span>
                      {item.text
                        .split('\n')
                        .map((line) => (
                          <span key={line}>
                            {line}
                            <br />
                          </span>
                        ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="guide-reviews">
          <div className="guide-reviews-inner">
            <div className="guide-review-heading">
              <h2 className="guide-section-title">
                고객님들의
                <br />
                따뜻한 이야기
                <span className="guide-heart">
                  ♡
                </span>
              </h2>

              <div
                className="guide-review-house"
                aria-hidden="true"
              >
                <Image
                  src="/home/storybook/house-clean.webp"
                  alt=""
                  fill
                  sizes="180px"
                />
              </div>
            </div>

            <div className="guide-review-grid">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <article
                    key={review.id}
                    className="guide-review-card"
                  >
                    {review.title ? (
                      <h3>{review.title}</h3>
                    ) : null}

                    <p>{review.content}</p>

                    <div className="guide-review-meta">
                      <span className="guide-review-name">
                        {maskCustomerName(
                          review.displayName,
                        )}
                      </span>

                      <span
                        className="guide-review-stars"
                        aria-label={`별점 ${review.rating}점`}
                      >
                        {[1, 2, 3, 4, 5].map(
                          (score) => (
                            <span
                              key={score}
                              className={
                                score <= review.rating
                                  ? 'is-active'
                                  : ''
                              }
                              aria-hidden="true"
                            >
                              ★
                            </span>
                          ),
                        )}
                      </span>
                    </div>
                  </article>
                ))
              ) : (
                <div className="guide-review-empty">
                  아직 공개된 고객 후기가
                  없습니다.
                  <br />
                  승인된 후기가 등록되면 이곳에
                  표시됩니다.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="guide-support">
          <div className="guide-support-inner">
            <section
              id="faq"
              className="guide-faq-panel"
            >
              <h2 className="guide-section-title">
                자주 묻는 질문 FAQ
                <span className="guide-heart">
                  ♡
                </span>
              </h2>

              <div className="guide-faq-list">
                {FAQ_ITEMS.map(
                  (item, index) => (
                    <details
                      key={item.question}
                      className="guide-faq-item"
                      open={index === 0}
                    >
                      <summary>
                        <span className="guide-faq-question">
                          Q.
                        </span>
                        {item.question}
                      </summary>

                      <p className="guide-faq-answer">
                        {item.answer}
                      </p>
                    </details>
                  ),
                )}
              </div>
            </section>

            <section
              id="contact"
              className="guide-contact-panel"
            >
              <h2 className="guide-section-title">
                문의하기
                <span className="guide-heart">
                  ♡
                </span>
              </h2>

              <div className="guide-contact-layout">
                <div className="guide-contact-info">
                  <div className="guide-contact-item">
                    <span
                      className="guide-contact-icon"
                      aria-hidden="true"
                    >
                      ☎
                    </span>

                    <div>
                      <strong>전화 상담</strong>
                      <a
                        href={`tel:${contactPhone.replaceAll(
                          '-',
                          '',
                        )}`}
                      >
                        {contactPhone}
                      </a>
                    </div>
                  </div>

                  <div className="guide-contact-item">
                    <span
                      className="guide-contact-icon"
                      aria-hidden="true"
                    >
                      ✉
                    </span>

                    <div>
                      <strong>이메일 문의</strong>
                      {contactEmail.includes('@') ? (
                        <a
                          href={`mailto:${contactEmail}`}
                        >
                          {contactEmail}
                        </a>
                      ) : (
                        <span>{contactEmail}</span>
                      )}
                    </div>
                  </div>

                  <div className="guide-contact-item">
                    <span
                      className="guide-contact-icon"
                      aria-hidden="true"
                    >
                      ♡
                    </span>

                    <div>
                      <strong>온라인 문의</strong>
                      <span>
                        아래 양식으로 남겨주시면
                        확인 후 답변드립니다.
                      </span>
                    </div>
                  </div>
                </div>

                <form
                  action={submitContactInquiry}
                  className="guide-contact-form"
                >
                  <div className="guide-form-honeypot">
                    <label htmlFor="website">
                      웹사이트
                    </label>
                    <input
                      id="website"
                      name="website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

                  <div className="guide-form-row">
                    <label htmlFor="contact-name">
                      이름
                    </label>
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      minLength={2}
                      maxLength={30}
                      placeholder="이름을 입력해주세요"
                      required
                    />
                  </div>

                  <div className="guide-form-row">
                    <label htmlFor="contact-email">
                      이메일
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      maxLength={120}
                      placeholder="이메일을 입력해주세요"
                      required
                    />
                  </div>

                  <div className="guide-form-row">
                    <label htmlFor="contact-type">
                      문의 유형
                    </label>
                    <select
                      id="contact-type"
                      name="inquiryType"
                      defaultValue=""
                      required
                    >
                      <option value="" disabled>
                        선택해주세요
                      </option>
                      <option value="product">
                        상품 및 가격 문의
                      </option>
                      <option value="production">
                        제작 과정 문의
                      </option>
                      <option value="material">
                        사진·자료 준비 문의
                      </option>
                      <option value="revision">
                        수정·인쇄 문의
                      </option>
                      <option value="other">
                        기타 문의
                      </option>
                    </select>
                  </div>

                  <div className="guide-form-row is-message">
                    <label htmlFor="contact-message">
                      문의 내용
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      minLength={10}
                      maxLength={1500}
                      placeholder="문의 내용을 입력해주세요"
                      required
                    />
                  </div>

                  {contactStatus === 'sent' ? (
                    <p className="guide-form-message is-success">
                      문의가 정상적으로
                      접수되었습니다. 확인 후
                      답변드리겠습니다.
                    </p>
                  ) : null}

                  {contactStatus === 'invalid' ? (
                    <p className="guide-form-message is-error">
                      입력 내용을 다시 확인해
                      주세요. 문의 내용은 10자
                      이상 작성해야 합니다.
                    </p>
                  ) : null}

                  {contactStatus === 'error' ||
                  contactStatus === 'config' ? (
                    <p className="guide-form-message is-error">
                      문의 발송 중 문제가
                      발생했습니다. 전화 또는
                      이메일로 문의해 주세요.
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    className="guide-submit-button"
                  >
                    문의하기
                  </button>
                </form>
              </div>

              <p className="guide-contact-note">
                빠른 답변을 위해 문의 유형을
                선택해 주시면 더 정확한 안내가
                가능합니다.
              </p>
            </section>
          </div>
        </section>

        <section className="guide-cta">
          <div className="guide-cta-inner">
            <div className="guide-cta-image">
              <Image
                src="/home/storybook/detail-hero-bright-v2.webp"
                alt="꽃과 추억 사진이 놓인 따뜻한 책상"
                fill
                sizes="315px"
              />
            </div>

            <div className="guide-cta-copy">
              <h2 className="guide-cta-title">
                지금, 당신의 이야기를 책으로
                남겨보세요.
                <span className="guide-heart">
                  ♡
                </span>
              </h2>

              <p>
                우리 가족의 특별한 순간을
                세상에 하나뿐인 책으로 만들어
                드립니다.
              </p>
            </div>

            <Link
              href={startHref}
              className="guide-primary-button"
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
