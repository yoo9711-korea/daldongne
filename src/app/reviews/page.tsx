'use client';

import Link from 'next/link';
import {
  FormEvent,
  useState,
} from 'react';

type SubmitState = {
  type: 'idle' | 'success' | 'error';
  message: string;
};

type ReviewApiResponse = {
  ok?: boolean;
  message?: string;
};

const INITIAL_SUBMIT_STATE: SubmitState = {
  type: 'idle',
  message: '',
};

export default function CustomerReviewPage() {
  const [displayName, setDisplayName] =
    useState('');
  const [email, setEmail] = useState('');
  const [
    orderReference,
    setOrderReference,
  ] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] =
    useState('');
  const [rating, setRating] = useState(5);
  const [
    privacyAgreed,
    setPrivacyAgreed,
  ] = useState(false);
  const [website, setWebsite] =
    useState('');
  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [submitState, setSubmitState] =
    useState<SubmitState>(
      INITIAL_SUBMIT_STATE,
    );

  const contentLength = content.length;

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setSubmitState(INITIAL_SUBMIT_STATE);
    setIsSubmitting(true);

    try {
      const response = await fetch(
        '/api/customer-reviews',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            displayName,
            email,
            orderReference,
            title,
            content,
            rating,
            privacyAgreed,
            website,
          }),
        },
      );

      const result =
        (await response.json()) as
          ReviewApiResponse;

      if (!response.ok || !result.ok) {
        throw new Error(
          result.message ||
            '후기를 등록하지 못했습니다.',
        );
      }

      setSubmitState({
        type: 'success',
        message:
          result.message ||
          '후기가 정상적으로 접수되었습니다.',
      });

      setDisplayName('');
      setEmail('');
      setOrderReference('');
      setTitle('');
      setContent('');
      setRating(5);
      setPrivacyAgreed(false);
      setWebsite('');
    } catch (error) {
      setSubmitState({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : '후기를 등록하지 못했습니다.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="review-page">
      <section className="review-hero">
        <p className="review-eyebrow">
          달동네 스토리북 고객 후기
        </p>

        <h1>
          당신의 따뜻한 이야기를
          <br />
          들려주세요 ♡
        </h1>

        <p className="review-description">
          달동네 스토리북을 이용하며
          느낀 점을 남겨주세요.
          <br />
          소중한 후기는 관리자 확인 후
          홈페이지에 공개됩니다.
        </p>
      </section>

      <section className="review-content">
        <div className="review-guide">
          <div className="review-guide-card">
            <strong>후기 공개 안내</strong>
            <p>
              제출한 후기는 바로 공개되지
              않으며, 관리자가 확인한 후
              홈페이지에 표시됩니다.
            </p>
          </div>

          <div className="review-guide-card">
            <strong>개인정보 보호</strong>
            <p>
              이메일과 주문번호는 고객 확인
              용도로만 사용되며 홈페이지에는
              공개되지 않습니다.
            </p>
          </div>

          <div className="review-guide-card">
            <strong>이름 표시 방식</strong>
            <p>
              홈페이지에는 이름 전체가 아닌
              김○○, 박○○ 형태로 표시됩니다.
            </p>
          </div>

          <Link
            href="/"
            className="review-home-link"
          >
            달동네 홈페이지로 돌아가기
          </Link>
        </div>

        <form
          className="review-form"
          onSubmit={handleSubmit}
        >
          <div className="review-form-heading">
            <span>고객 후기 작성</span>
            <p>
              별표가 표시된 항목은 반드시
              입력해 주세요.
            </p>
          </div>

          <div className="review-field-grid">
            <div className="review-field">
              <label htmlFor="displayName">
                이름 또는 닉네임
                <em>*</em>
              </label>

              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(event) =>
                  setDisplayName(
                    event.target.value,
                  )
                }
                minLength={2}
                maxLength={30}
                placeholder="예: 김달동"
                autoComplete="name"
                required
              />
            </div>

            <div className="review-field">
              <label htmlFor="email">
                이메일
                <em>*</em>
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value,
                  )
                }
                maxLength={254}
                placeholder="예: example@email.com"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="review-field">
            <label htmlFor="orderReference">
              주문번호 또는 상담번호
              <span>선택</span>
            </label>

            <input
              id="orderReference"
              type="text"
              value={orderReference}
              onChange={(event) =>
                setOrderReference(
                  event.target.value,
                )
              }
              maxLength={80}
              placeholder="주문번호가 있다면 입력해 주세요."
            />

            <small>
              실제 이용 고객 확인이 필요한
              경우에만 사용됩니다.
            </small>
          </div>

          <fieldset className="review-rating">
            <legend>
              만족도
              <em>*</em>
            </legend>

            <div
              className="review-stars"
              aria-label={`별점 ${rating}점`}
            >
              {[1, 2, 3, 4, 5].map(
                (score) => (
                  <button
                    key={score}
                    type="button"
                    className={
                      score <= rating
                        ? 'is-active'
                        : ''
                    }
                    onClick={() =>
                      setRating(score)
                    }
                    aria-label={`${score}점 선택`}
                    aria-pressed={
                      score === rating
                    }
                  >
                    ★
                  </button>
                ),
              )}
            </div>

            <strong>{rating}점</strong>
          </fieldset>

          <div className="review-field">
            <label htmlFor="title">
              후기 제목
              <span>선택</span>
            </label>

            <input
              id="title"
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value,
                )
              }
              maxLength={80}
              placeholder="후기를 한 문장으로 표현해 주세요."
            />
          </div>

          <div className="review-field">
            <div className="review-label-row">
              <label htmlFor="content">
                후기 내용
                <em>*</em>
              </label>

              <span
                className={
                  contentLength > 1000
                    ? 'is-over'
                    : ''
                }
              >
                {contentLength} / 1,000
              </span>
            </div>

            <textarea
              id="content"
              value={content}
              onChange={(event) =>
                setContent(
                  event.target.value,
                )
              }
              minLength={20}
              maxLength={1000}
              rows={8}
              placeholder="스토리북을 만들며 좋았던 점, 기억에 남은 점, 가족의 반응 등을 20자 이상 작성해 주세요."
              required
            />
          </div>

          <div
            className="review-honeypot"
            aria-hidden="true"
          >
            <label htmlFor="website">
              홈페이지
            </label>

            <input
              id="website"
              type="text"
              value={website}
              onChange={(event) =>
                setWebsite(
                  event.target.value,
                )
              }
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <label className="review-consent">
            <input
              type="checkbox"
              checked={privacyAgreed}
              onChange={(event) =>
                setPrivacyAgreed(
                  event.target.checked,
                )
              }
              required
            />

            <span>
              후기 등록을 위한 이름, 이메일,
              주문번호 수집과 후기 내용의
              홈페이지 공개에 동의합니다.
              <em>*</em>
            </span>
          </label>

          {submitState.type !== 'idle' ? (
            <div
              className={[
                'review-message',
                submitState.type,
              ].join(' ')}
              role="status"
              aria-live="polite"
            >
              {submitState.message}
            </div>
          ) : null}

          <button
            type="submit"
            className="review-submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? '후기를 접수하고 있습니다...'
              : '고객 후기 등록하기'}
          </button>

          <p className="review-submit-note">
            등록된 후기는 관리자 검토 후
            홈페이지에 공개됩니다.
          </p>
        </form>
      </section>

      <style jsx>{`
        .review-page {
          min-height: 100vh;
          padding: 72px 24px 100px;
          color: #50362c;
          background:
            radial-gradient(
              circle at 8% 8%,
              rgba(
                255,
                218,
                206,
                0.48
              ),
              transparent 24rem
            ),
            radial-gradient(
              circle at 94% 18%,
              rgba(
                223,
                239,
                228,
                0.6
              ),
              transparent 25rem
            ),
            #fffaf5;
        }

        .review-hero {
          max-width: 760px;
          margin: 0 auto 46px;
          text-align: center;
        }

        .review-eyebrow {
          margin: 0 0 14px;
          color: #e57763;
          font-size: 16px;
          font-weight: 800;
          letter-spacing: 0.08em;
        }

        .review-hero h1 {
          margin: 0;
          font-family:
            'MapoFlowerIsland',
            'Noto Serif KR',
            serif;
          font-size:
            clamp(38px, 5vw, 56px);
          font-weight: 400;
          line-height: 1.34;
          letter-spacing: -0.035em;
          word-break: keep-all;
        }

        .review-description {
          margin: 22px 0 0;
          color: #786258;
          font-size: 18px;
          line-height: 1.8;
          word-break: keep-all;
        }

        .review-content {
          display: grid;
          grid-template-columns:
            minmax(240px, 320px)
            minmax(0, 720px);
          gap: 30px;
          max-width: 1070px;
          margin: 0 auto;
          align-items: start;
        }

        .review-guide {
          position: sticky;
          top: 105px;
          display: grid;
          gap: 14px;
        }

        .review-guide-card {
          padding: 22px;
          border:
            1px solid
            rgba(224, 167, 149, 0.28);
          border-radius: 22px;
          background:
            rgba(
              255,
              255,
              255,
              0.82
            );
          box-shadow:
            0 12px 30px
            rgba(126, 86, 70, 0.07);
        }

        .review-guide-card strong {
          display: block;
          color: #5b3c31;
          font-size: 17px;
        }

        .review-guide-card p {
          margin: 9px 0 0;
          color: #806a61;
          font-size: 14px;
          line-height: 1.75;
          word-break: keep-all;
        }

        .review-home-link {
          display: flex;
          min-height: 48px;
          align-items: center;
          justify-content: center;
          padding: 0 18px;
          border:
            1px solid #efb6a6;
          border-radius: 999px;
          color: #c96351;
          background: #fffdfb;
          font-size: 14px;
          font-weight: 800;
          text-decoration: none;
        }

        .review-form {
          padding: 38px;
          border:
            1px solid
            rgba(224, 167, 149, 0.32);
          border-radius: 30px;
          background:
            rgba(
              255,
              255,
              255,
              0.92
            );
          box-shadow:
            0 20px 55px
            rgba(126, 86, 70, 0.11);
        }

        .review-form-heading {
          margin-bottom: 30px;
          padding-bottom: 23px;
          border-bottom:
            1px solid #f0ded7;
        }

        .review-form-heading span {
          display: block;
          font-size: 27px;
          font-weight: 900;
        }

        .review-form-heading p {
          margin: 8px 0 0;
          color: #957e74;
          font-size: 14px;
        }

        .review-field-grid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .review-field {
          margin-bottom: 22px;
        }

        .review-field label,
        .review-rating legend {
          display: block;
          margin-bottom: 9px;
          color: #584036;
          font-size: 15px;
          font-weight: 800;
        }

        .review-field label em,
        .review-rating legend em,
        .review-consent em {
          margin-left: 4px;
          color: #eb755e;
          font-style: normal;
        }

        .review-field label span {
          margin-left: 7px;
          color: #ab9389;
          font-size: 12px;
          font-weight: 600;
        }

        .review-field input,
        .review-field textarea {
          width: 100%;
          border:
            1px solid #ead7cf;
          border-radius: 15px;
          outline: none;
          color: #50362c;
          background: #fffdfb;
          font: inherit;
          transition:
            border-color 150ms ease,
            box-shadow 150ms ease,
            background 150ms ease;
        }

        .review-field input {
          min-height: 52px;
          padding: 0 16px;
        }

        .review-field textarea {
          min-height: 190px;
          padding: 15px 16px;
          line-height: 1.7;
          resize: vertical;
        }

        .review-field input:focus,
        .review-field textarea:focus {
          border-color: #ef927c;
          background: #ffffff;
          box-shadow:
            0 0 0 4px
            rgba(239, 146, 124, 0.14);
        }

        .review-field small {
          display: block;
          margin-top: 7px;
          color: #a18b82;
          font-size: 12px;
          line-height: 1.5;
        }

        .review-rating {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 0 0 22px;
          padding: 0;
          border: 0;
        }

        .review-rating legend {
          width: 100%;
          margin: 0 0 9px;
        }

        .review-stars {
          display: flex;
          gap: 5px;
        }

        .review-stars button {
          padding: 0;
          border: 0;
          color: #e4d7d1;
          background: transparent;
          font-size: 31px;
          line-height: 1;
          cursor: pointer;
          transition:
            color 140ms ease,
            transform 140ms ease;
        }

        .review-stars button:hover {
          transform:
            translateY(-2px)
            scale(1.06);
        }

        .review-stars button.is-active {
          color: #f19a69;
        }

        .review-rating > strong {
          color: #d86f58;
          font-size: 15px;
        }

        .review-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .review-label-row > span {
          color: #a48d83;
          font-size: 12px;
        }

        .review-label-row > span.is-over {
          color: #d34040;
        }

        .review-consent {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          margin-top: 3px;
          padding: 17px;
          border-radius: 16px;
          color: #725b51;
          background: #fff6f1;
          font-size: 13px;
          line-height: 1.65;
          cursor: pointer;
        }

        .review-consent input {
          width: 18px;
          height: 18px;
          margin: 2px 0 0;
          accent-color: #ed826b;
          flex: 0 0 auto;
        }

        .review-message {
          margin-top: 20px;
          padding: 15px 17px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          line-height: 1.6;
        }

        .review-message.success {
          border:
            1px solid #b8dcc9;
          color: #356650;
          background: #effaf4;
        }

        .review-message.error {
          border:
            1px solid #f0b4aa;
          color: #a04335;
          background: #fff1ee;
        }

        .review-submit {
          width: 100%;
          min-height: 57px;
          margin-top: 22px;
          border:
            1px solid #eb8068;
          border-radius: 999px;
          color: #ffffff;
          background:
            linear-gradient(
              135deg,
              #f09b7d,
              #ea765f
            );
          box-shadow:
            0 13px 28px
            rgba(227, 107, 82, 0.24);
          font-size: 16px;
          font-weight: 900;
          cursor: pointer;
        }

        .review-submit:disabled {
          cursor: wait;
          opacity: 0.65;
        }

        .review-submit-note {
          margin: 12px 0 0;
          color: #a18b82;
          font-size: 12px;
          text-align: center;
        }

        .review-honeypot {
          position: absolute;
          left: -10000px;
          width: 1px;
          height: 1px;
          overflow: hidden;
        }

        @media (max-width: 860px) {
          .review-page {
            padding:
              48px 16px 80px;
          }

          .review-content {
            grid-template-columns: 1fr;
          }

          .review-guide {
            position: static;
            grid-template-columns:
              repeat(
                3,
                minmax(0, 1fr)
              );
          }

          .review-home-link {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 640px) {
          .review-hero h1 {
            font-size: 36px;
          }

          .review-description {
            font-size: 16px;
          }

          .review-guide {
            grid-template-columns: 1fr;
          }

          .review-home-link {
            grid-column: auto;
          }

          .review-form {
            padding: 25px 18px;
            border-radius: 23px;
          }

          .review-field-grid {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .review-rating {
            align-items: flex-start;
            flex-wrap: wrap;
          }

          .review-stars button {
            font-size: 29px;
          }
        }
      `}</style>
    </main>
  );
}