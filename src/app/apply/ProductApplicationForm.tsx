'use client';

import {
  formatProductPrice,
  type ProductAddonCode,
  type ProductPlanCode,
} from '@/lib/products/catalog';
import Link from 'next/link';
import {
  type FormEvent,
  useMemo,
  useState,
} from 'react';

type ProductPlanView = {
  code: ProductPlanCode;
  name: string;
  description: string;
  price: number;
  priceSuffix: string;
  included: readonly string[];
  conditions: readonly string[];
};

type ProductAddonView = {
  code: ProductAddonCode;
  name: string;
  description: string;
  priceLabel: string;
};

type ProductApplicationFormProps = {
  product: ProductPlanView;
  addons: readonly ProductAddonView[];
  defaultName: string;
  defaultEmail: string;
};

type ProductApplicationResponse = {
  ok?: boolean;
  message?: string;
  duplicate?: boolean;
  application?: {
    id?: string;
    productName?: string;
    price?: number;
    status?: string;
  };
};

export default function ProductApplicationForm({
  product,
  addons,
  defaultName,
  defaultEmail,
}: ProductApplicationFormProps) {
  const [name, setName] =
    useState(defaultName);

  const [phone, setPhone] =
    useState('');

  const [email, setEmail] =
    useState(defaultEmail);

  const [message, setMessage] =
    useState('');

  const [
    selectedAddonCodes,
    setSelectedAddonCodes,
  ] = useState<ProductAddonCode[]>([]);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [isCompleted, setIsCompleted] =
    useState(false);

  const [resultMessage, setResultMessage] =
    useState('');

  const [applicationId, setApplicationId] =
    useState('');

  const selectedAddons = useMemo(
    () =>
      addons.filter((addon) =>
        selectedAddonCodes.includes(
          addon.code,
        ),
      ),
    [addons, selectedAddonCodes],
  );

  const toggleAddon = (
    addonCode: ProductAddonCode,
  ) => {
    setSelectedAddonCodes(
      (currentCodes) =>
        currentCodes.includes(addonCode)
          ? currentCodes.filter(
              (code) =>
                code !== addonCode,
            )
          : [
              ...currentCodes,
              addonCode,
            ],
    );
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!name.trim()) {
      setResultMessage(
        '신청자 이름을 입력해 주세요.',
      );
      return;
    }

    if (
      !phone.trim() &&
      !email.trim()
    ) {
      setResultMessage(
        '전화번호 또는 이메일 중 하나를 입력해 주세요.',
      );
      return;
    }

    setIsSubmitting(true);
    setResultMessage('');

    try {
      const response = await fetch(
        '/api/product-applications',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            productCode: product.code,
            addonCodes:
              selectedAddonCodes,
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
            message: message.trim(),
          }),
        },
      );

      const data =
        (await response
          .json()
          .catch(() => null)) as
          | ProductApplicationResponse
          | null;

      if (
        !response.ok ||
        !data?.ok
      ) {
        setResultMessage(
          data?.message ||
            '상품 신청을 접수하지 못했습니다.',
        );
        return;
      }

      setApplicationId(
        data.application?.id || '',
      );

      setResultMessage(
        data.message ||
          '상품 신청이 접수되었습니다.',
      );

      setIsCompleted(true);
    } catch (error) {
      console.error(
        '[PRODUCT_APPLICATION_FORM_ERROR]',
        error,
      );

      setResultMessage(
        '상품 신청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCompleted) {
    return (
      <section
        className="simple-application-complete"
        aria-labelledby="application-complete-title"
      >
        <div
          className="simple-application-complete-mark"
          aria-hidden="true"
        >
          ✓
        </div>

        <p className="simple-application-kicker">
          신청 접수 완료
        </p>

        <h2 id="application-complete-title">
          담당자가 확인한 뒤 연락드릴게요
        </h2>

        <p className="simple-application-complete-copy">
          {resultMessage}
          <br />
          아직 결제된 금액은 없습니다.
        </p>

        <div className="simple-application-complete-product">
          <span>신청 상품</span>
          <strong>{product.name}</strong>
          <b>
            {formatProductPrice(
              product.price,
              product.priceSuffix,
            )}
          </b>

          {applicationId ? (
            <small>
              접수번호 {applicationId}
            </small>
          ) : null}
        </div>

        <div className="simple-application-complete-actions">
          <Link
            href="/dashboard/applications"
            className="is-primary"
          >
            내 신청 내역 보기
          </Link>

          <Link
            href="/pricing"
            className="is-secondary"
          >
            상품안내로 돌아가기
          </Link>
        </div>

        <style
          dangerouslySetInnerHTML={{
            __html: styles,
          }}
        />
      </section>
    );
  }

  return (
    <form
      className="simple-application-form"
      onSubmit={handleSubmit}
      noValidate
    >
      <aside className="simple-application-summary">
        <p className="simple-application-kicker">
          선택한 상품
        </p>

        <h2>{product.name}</h2>

        <strong className="simple-application-price">
          {formatProductPrice(
            product.price,
            product.priceSuffix,
          )}
        </strong>

        <p className="simple-application-description">
          {product.description}
        </p>

        <div className="simple-application-summary-divider" />

        <h3>기본 포함 내용</h3>

        <ul className="simple-application-feature-list">
          {product.included
            .slice(0, 5)
            .map((feature) => (
              <li key={feature}>
                {feature}
              </li>
            ))}
        </ul>

        {product.included.length > 5 ? (
          <p className="simple-application-more">
            그 밖의 포함 내용은 상담할 때 함께
            안내드립니다.
          </p>
        ) : null}

        <div className="simple-application-payment-note">
          <strong>지금은 결제되지 않습니다.</strong>
          <span>
            관리자가 신청 내용을 먼저 확인하고
            연락드립니다.
          </span>
        </div>
      </aside>

      <section
        className="simple-application-fields-panel"
        aria-labelledby="application-form-title"
      >
        <div className="simple-application-heading">
          <div>
            <p className="simple-application-kicker">
              연락받을 정보
            </p>

            <h2 id="application-form-title">
              세 가지만 확인해 주세요
            </h2>
          </div>

          <span>
            전화번호 또는 이메일 중
            <br />
            하나만 입력해도 됩니다.
          </span>
        </div>

        <div className="simple-application-fields">
          <div className="simple-application-field is-full">
            <label htmlFor="application-name">
              신청자 이름
              <span aria-hidden="true">*</span>
            </label>

            <input
              id="application-name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              maxLength={80}
              autoComplete="name"
              placeholder="이름을 입력해 주세요"
              required
            />
          </div>

          <div className="simple-application-field">
            <label htmlFor="application-phone">
              전화번호
            </label>

            <input
              id="application-phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value)
              }
              maxLength={30}
              autoComplete="tel"
              placeholder="010-0000-0000"
            />
          </div>

          <div className="simple-application-field">
            <label htmlFor="application-email">
              이메일
            </label>

            <input
              id="application-email"
              type="email"
              inputMode="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              maxLength={200}
              autoComplete="email"
              placeholder="example@email.com"
            />
          </div>

          <div className="simple-application-field is-full">
            <label htmlFor="application-message">
              요청사항
              <small>선택 입력</small>
            </label>

            <textarea
              id="application-message"
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
              maxLength={2000}
              placeholder="남기고 싶은 기록이나 궁금한 내용을 편하게 적어 주세요."
            />

            <span className="simple-application-character-count">
              {message.length.toLocaleString(
                'ko-KR',
              )}
              /2,000자
            </span>
          </div>
        </div>

        {addons.length > 0 ? (
          <details className="simple-application-addons">
            <summary>
              <span>
                <strong>추가 옵션</strong>
                <small>
                  필요한 경우에만 선택하세요
                </small>
              </span>

              <b>
                {selectedAddons.length > 0
                  ? `${selectedAddons.length}개 선택`
                  : '선택 안 함'}
              </b>
            </summary>

            <div className="simple-application-addon-list">
              {addons.map((addon) => {
                const isSelected =
                  selectedAddonCodes.includes(
                    addon.code,
                  );

                return (
                  <label
                    key={addon.code}
                    className={[
                      'simple-application-addon',
                      isSelected
                        ? 'is-selected'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() =>
                        toggleAddon(addon.code)
                      }
                    />

                    <span>
                      <strong>{addon.name}</strong>
                      <small>
                        {addon.description}
                      </small>
                      <b>{addon.priceLabel}</b>
                    </span>
                  </label>
                );
              })}
            </div>
          </details>
        ) : null}

        {selectedAddons.length > 0 ? (
          <div className="simple-application-selected">
            <strong>선택 옵션</strong>
            <span>
              {selectedAddons
                .map((addon) => addon.name)
                .join(' · ')}
            </span>
          </div>
        ) : null}

        {product.conditions.length > 0 ? (
          <details className="simple-application-conditions">
            <summary>
              상품 이용 조건 확인
            </summary>

            <ul>
              {product.conditions.map(
                (condition) => (
                  <li key={condition}>
                    {condition}
                  </li>
                ),
              )}
            </ul>
          </details>
        ) : null}

        {resultMessage ? (
          <p
            className="simple-application-message"
            role="alert"
            aria-live="polite"
          >
            {resultMessage}
          </p>
        ) : null}

        <button
          type="submit"
          className="simple-application-submit"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? '신청 접수 중...'
            : '관리자 검토 요청하기'}
        </button>

        <p className="simple-application-policy">
          버튼을 눌러도 바로 결제되지 않습니다.
          담당자가 내용을 확인한 뒤 전화 또는
          이메일로 안내드립니다.
        </p>
      </section>

      <style
        dangerouslySetInnerHTML={{
          __html: styles,
        }}
      />
    </form>
  );
}

const styles = `
  .simple-application-form,
  .simple-application-form *,
  .simple-application-complete,
  .simple-application-complete * {
    box-sizing: border-box;
  }

  .simple-application-form {
    display: grid;
    grid-template-columns:
      minmax(300px, 0.74fr)
      minmax(440px, 1.26fr);
    align-items: start;
    gap: 20px;
    color: #35261f;
    font-family: var(--font-daldongne-sans), sans-serif;
    font-weight: 700;
  }

  .simple-application-summary,
  .simple-application-fields-panel {
    border: 1px solid rgba(111, 77, 59, 0.15);
    border-radius: 26px;
    background: rgba(255, 255, 255, 0.92);
    box-shadow: 0 15px 38px rgba(91, 57, 39, 0.065);
  }

  .simple-application-summary {
    position: sticky;
    top: 98px;
    padding: 30px;
    background:
      radial-gradient(
        circle at 88% 8%,
        rgba(255, 218, 197, 0.48),
        transparent 16rem
      ),
      rgba(255, 255, 255, 0.94);
  }

  .simple-application-fields-panel {
    padding: 32px;
  }

  .simple-application-kicker {
    margin: 0;
    color: #ca624e;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.08em;
  }

  .simple-application-summary h2,
  .simple-application-heading h2,
  .simple-application-complete h2 {
    color: #34251e;
    font-family: var(--font-daldongne-hand), cursive;
    font-weight: 700;
    letter-spacing: -0.025em;
    word-break: keep-all;
  }

  .simple-application-summary h2 {
    margin: 8px 0 0;
    font-size: 36px;
    line-height: 1.25;
  }

  .simple-application-price {
    display: block;
    margin-top: 14px;
    color: #b95542;
    font-size: 24px;
    font-weight: 800;
  }

  .simple-application-description {
    margin: 16px 0 0;
    color: #5d4b42;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.75;
    word-break: keep-all;
  }

  .simple-application-summary-divider {
    height: 1px;
    margin: 23px 0;
    background: rgba(111, 77, 59, 0.13);
  }

  .simple-application-summary h3 {
    margin: 0;
    color: #423129;
    font-size: 14px;
    font-weight: 800;
  }

  .simple-application-feature-list {
    margin: 15px 0 0;
    padding: 0;
    display: grid;
    gap: 9px;
    list-style: none;
  }

  .simple-application-feature-list li {
    position: relative;
    padding-left: 20px;
    color: #66534a;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.55;
  }

  .simple-application-feature-list li::before {
    position: absolute;
    top: 0;
    left: 0;
    content: '✓';
    color: #d3644f;
    font-weight: 800;
  }

  .simple-application-more {
    margin: 13px 0 0;
    color: #8a776c;
    font-size: 10px;
    font-weight: 700;
    line-height: 1.6;
  }

  .simple-application-payment-note {
    margin-top: 23px;
    padding: 16px;
    display: grid;
    gap: 5px;
    border: 1px solid rgba(210, 111, 87, 0.2);
    border-radius: 16px;
    background: #fff3ed;
  }

  .simple-application-payment-note strong {
    color: #a84b3b;
    font-size: 13px;
    font-weight: 800;
  }

  .simple-application-payment-note span {
    color: #6d584e;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.6;
  }

  .simple-application-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 22px;
  }

  .simple-application-heading h2 {
    margin: 7px 0 0;
    font-size: 34px;
    line-height: 1.25;
  }

  .simple-application-heading > span {
    flex: 0 0 auto;
    color: #7c6960;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.55;
    text-align: right;
  }

  .simple-application-fields {
    margin-top: 26px;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px 14px;
  }

  .simple-application-field {
    position: relative;
    min-width: 0;
    display: grid;
    gap: 8px;
  }

  .simple-application-field.is-full {
    grid-column: 1 / -1;
  }

  .simple-application-field label {
    display: flex;
    align-items: center;
    gap: 5px;
    color: #49372e;
    font-size: 13px;
    font-weight: 800;
  }

  .simple-application-field label > span {
    color: #d55f49;
  }

  .simple-application-field label > small {
    color: #8b786d;
    font-size: 10px;
    font-weight: 700;
  }

  .simple-application-field input,
  .simple-application-field textarea {
    width: 100%;
    border: 1px solid rgba(126, 87, 64, 0.25);
    border-radius: 14px;
    color: #35261f;
    background: #fffefb;
    font: inherit;
    font-size: 14px;
    font-weight: 700;
    outline: none;
    transition:
      border-color 150ms ease,
      box-shadow 150ms ease;
  }

  .simple-application-field input {
    min-height: 49px;
    padding: 0 14px;
  }

  .simple-application-field textarea {
    min-height: 124px;
    padding: 14px;
    resize: vertical;
    line-height: 1.7;
  }

  .simple-application-field input::placeholder,
  .simple-application-field textarea::placeholder {
    color: #a3948b;
    font-weight: 700;
  }

  .simple-application-field input:focus,
  .simple-application-field textarea:focus {
    border-color: #df765f;
    box-shadow: 0 0 0 3px rgba(223, 118, 95, 0.12);
  }

  .simple-application-character-count {
    position: absolute;
    right: 11px;
    bottom: 8px;
    color: #948279;
    background: rgba(255, 254, 251, 0.9);
    font-size: 9px;
    font-weight: 700;
  }

  .simple-application-addons,
  .simple-application-conditions {
    margin-top: 20px;
    border: 1px solid rgba(126, 87, 64, 0.16);
    border-radius: 16px;
    background: #fffaf5;
  }

  .simple-application-addons summary,
  .simple-application-conditions summary {
    min-height: 57px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    list-style: none;
    color: #49372e;
    cursor: pointer;
  }

  .simple-application-addons summary::-webkit-details-marker,
  .simple-application-conditions summary::-webkit-details-marker {
    display: none;
  }

  .simple-application-addons summary > span {
    display: grid;
    gap: 3px;
  }

  .simple-application-addons summary strong {
    font-size: 13px;
    font-weight: 800;
  }

  .simple-application-addons summary small {
    color: #7e6b61;
    font-size: 10px;
    font-weight: 700;
  }

  .simple-application-addons summary > b {
    flex: 0 0 auto;
    color: #ba5a45;
    font-size: 11px;
    font-weight: 800;
  }

  .simple-application-addon-list {
    padding: 0 10px 10px;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .simple-application-addon {
    min-width: 0;
    padding: 13px;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: flex-start;
    gap: 10px;
    border: 1px solid rgba(126, 87, 64, 0.13);
    border-radius: 13px;
    background: #ffffff;
    cursor: pointer;
  }

  .simple-application-addon.is-selected {
    border-color: rgba(220, 108, 82, 0.48);
    background: #fff1eb;
  }

  .simple-application-addon input {
    width: 17px;
    height: 17px;
    margin: 2px 0 0;
    accent-color: #db6c55;
  }

  .simple-application-addon > span {
    min-width: 0;
    display: grid;
    gap: 4px;
  }

  .simple-application-addon strong {
    color: #45332a;
    font-size: 12px;
    font-weight: 800;
  }

  .simple-application-addon small {
    color: #76635a;
    font-size: 10px;
    font-weight: 700;
    line-height: 1.55;
  }

  .simple-application-addon b {
    color: #b05541;
    font-size: 10px;
    font-weight: 800;
  }

  .simple-application-selected {
    margin-top: 10px;
    padding: 11px 13px;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    border-radius: 12px;
    color: #665149;
    background: #f6f5ee;
    font-size: 10px;
    font-weight: 700;
    line-height: 1.6;
  }

  .simple-application-selected strong {
    flex: 0 0 auto;
    color: #466452;
    font-weight: 800;
  }

  .simple-application-conditions {
    margin-top: 12px;
  }

  .simple-application-conditions summary {
    min-height: 44px;
    color: #75635a;
    font-size: 11px;
    font-weight: 800;
  }

  .simple-application-conditions ul {
    margin: 0;
    padding: 0 32px 15px;
    color: #77645b;
    font-size: 10px;
    font-weight: 700;
    line-height: 1.65;
  }

  .simple-application-message {
    margin: 16px 0 0;
    padding: 13px 15px;
    border: 1px solid rgba(190, 63, 50, 0.14);
    border-radius: 13px;
    color: #9a3e35;
    background: #fff0ed;
    font-size: 12px;
    font-weight: 800;
    line-height: 1.65;
  }

  .simple-application-submit {
    width: 100%;
    min-height: 54px;
    margin-top: 20px;
    border: 1px solid #d6604a;
    border-radius: 15px;
    color: #ffffff;
    background: linear-gradient(135deg, #ed856d, #db634d);
    box-shadow: 0 12px 25px rgba(199, 81, 60, 0.17);
    font-size: 15px;
    font-weight: 800;
    cursor: pointer;
  }

  .simple-application-submit:disabled {
    border-color: #b4a59d;
    background: #b4a59d;
    box-shadow: none;
    cursor: not-allowed;
  }

  .simple-application-policy {
    margin: 12px 0 0;
    color: #7d6a60;
    font-size: 10px;
    font-weight: 700;
    line-height: 1.65;
    text-align: center;
  }

  .simple-application-complete {
    max-width: 760px;
    margin: 0 auto;
    padding: 48px 36px;
    border: 1px solid rgba(111, 77, 59, 0.15);
    border-radius: 28px;
    color: #35261f;
    background:
      radial-gradient(
        circle at 88% 8%,
        rgba(221, 240, 225, 0.72),
        transparent 18rem
      ),
      #fffefd;
    box-shadow: 0 18px 48px rgba(91, 57, 39, 0.08);
    font-family: var(--font-daldongne-sans), sans-serif;
    font-weight: 700;
    text-align: center;
  }

  .simple-application-complete-mark {
    width: 64px;
    height: 64px;
    margin: 0 auto 18px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    color: #327047;
    background: #e5f5e9;
    font-size: 29px;
    font-weight: 800;
  }

  .simple-application-complete h2 {
    margin: 9px 0 0;
    font-size: 40px;
    line-height: 1.25;
  }

  .simple-application-complete-copy {
    margin: 16px auto 0;
    color: #625047;
    font-size: 14px;
    font-weight: 700;
    line-height: 1.8;
  }

  .simple-application-complete-product {
    max-width: 430px;
    margin: 24px auto 0;
    padding: 18px;
    display: grid;
    gap: 5px;
    border: 1px solid rgba(111, 77, 59, 0.13);
    border-radius: 17px;
    background: rgba(255, 255, 255, 0.78);
  }

  .simple-application-complete-product span,
  .simple-application-complete-product small {
    color: #806d63;
    font-size: 10px;
    font-weight: 700;
  }

  .simple-application-complete-product strong {
    color: #3f2e26;
    font-size: 17px;
    font-weight: 800;
  }

  .simple-application-complete-product b {
    color: #b95642;
    font-size: 16px;
    font-weight: 800;
  }

  .simple-application-complete-actions {
    max-width: 500px;
    margin: 24px auto 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .simple-application-complete-actions a {
    min-height: 48px;
    padding: 0 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 800;
    text-decoration: none;
  }

  .simple-application-complete-actions .is-primary {
    color: #ffffff;
    background: #df6a53;
  }

  .simple-application-complete-actions .is-secondary {
    border: 1px solid rgba(126, 87, 64, 0.22);
    color: #5d473c;
    background: #ffffff;
  }

  @media (max-width: 900px) {
    .simple-application-form {
      grid-template-columns: 1fr;
    }

    .simple-application-summary {
      position: static;
    }
  }

  @media (max-width: 620px) {
    .simple-application-summary,
    .simple-application-fields-panel {
      padding: 23px 18px;
      border-radius: 21px;
    }

    .simple-application-heading {
      align-items: flex-start;
      flex-direction: column;
      gap: 9px;
    }

    .simple-application-heading > span {
      text-align: left;
    }

    .simple-application-fields {
      grid-template-columns: 1fr;
    }

    .simple-application-field.is-full {
      grid-column: auto;
    }

    .simple-application-addon-list {
      grid-template-columns: 1fr;
    }

    .simple-application-complete {
      padding: 38px 20px;
      border-radius: 22px;
    }

    .simple-application-complete h2 {
      font-size: 34px;
    }

    .simple-application-complete-actions {
      grid-template-columns: 1fr;
    }
  }
`;
