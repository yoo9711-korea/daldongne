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
              (code) => code !== addonCode,
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
      <section className="application-complete">
        <style>{`
          .application-complete {
            padding: 40px 32px;
            border-radius: 30px;
            border: 1px solid #d9c19a;
            background: #fffdf7;
            box-shadow: 0 20px 55px rgba(75, 48, 27, 0.12);
            text-align: center;
          }

          .application-complete-mark {
            width: 72px;
            height: 72px;
            margin: 0 auto;
            border-radius: 50%;
            background: #e5f5e8;
            color: #2f6b38;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 34px;
            font-weight: 900;
          }

          .application-complete h2 {
            margin: 20px 0 0;
            color: #2d1c12;
            font-family: Noto Serif KR, serif;
            font-size: 32px;
            line-height: 1.4;
          }

          .application-complete p {
            margin: 12px auto 0;
            max-width: 600px;
            color: #6d5947;
            font-size: 15px;
            line-height: 1.8;
          }

          .application-complete-info {
            margin-top: 24px;
            padding: 18px;
            border-radius: 18px;
            background: #f7eddc;
            color: #4f3927;
          }

          .application-complete-actions {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            margin-top: 24px;
          }

          .application-complete-actions a {
            min-height: 50px;
            padding: 0 18px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            font-size: 14px;
            font-weight: 900;
          }

          .application-complete-primary {
            background: #6e421d;
            color: #fffaf0;
          }

          .application-complete-secondary {
            border: 1px solid #d5bd93;
            background: #fffdf7;
            color: #5f452e;
          }

          @media (max-width: 620px) {
            .application-complete {
              padding: 32px 20px;
            }

            .application-complete-actions {
              grid-template-columns: 1fr;
            }
          }
        `}</style>

        <div className="application-complete-mark">
          ✓
        </div>

        <h2>
          신청이 접수되었습니다
        </h2>

        <p>
          {resultMessage}
          <br />
          신청 내용을 확인한 뒤 연락드리겠습니다.
        </p>

        <div className="application-complete-info">
          <strong>
            {product.name}
          </strong>

          <p>
            {formatProductPrice(
              product.price,
              product.priceSuffix,
            )}
          </p>

          {applicationId ? (
            <p>
              접수번호 {applicationId}
            </p>
          ) : null}
        </div>

        <div className="application-complete-actions">
          <Link
            href="/pricing"
            className="application-complete-primary"
          >
            다른 상품 보기
          </Link>

          <Link
            href="/dashboard"
            className="application-complete-secondary"
          >
            대시보드로 이동
          </Link>
        </div>
      </section>
    );
  }

  return (
    <form
      className="product-application-form"
      onSubmit={handleSubmit}
    >
      <style>{`
        .product-application-form {
          display: grid;
          grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
          gap: 22px;
          align-items: start;
        }

        .application-panel {
          padding: 28px;
          border-radius: 28px;
          border: 1px solid #dfc9a4;
          background: #fffdf7;
          box-shadow: 0 14px 36px rgba(75, 48, 27, 0.08);
        }

        .application-label {
          margin: 0;
          color: #8a5a2c;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .application-product-name {
          margin: 9px 0 0;
          color: #2d1c12;
          font-family: Noto Serif KR, serif;
          font-size: 30px;
          line-height: 1.35;
          letter-spacing: -0.04em;
        }

        .application-price {
          display: block;
          margin-top: 12px;
          color: #6f421b;
          font-size: 25px;
        }

        .application-description {
          margin: 14px 0 0;
          color: #675445;
          font-size: 14px;
          line-height: 1.75;
        }

        .application-feature-list {
          margin: 22px 0 0;
          padding: 0;
          list-style: none;
          display: grid;
          gap: 9px;
        }

        .application-feature-list li {
          padding-bottom: 9px;
          border-bottom: 1px solid #eadcc6;
          color: #44362b;
          font-size: 13px;
          line-height: 1.6;
        }

        .application-condition {
          margin-top: 18px;
          padding: 14px;
          border-radius: 15px;
          background: #f6ead6;
          color: #76583d;
          font-size: 12px;
          line-height: 1.7;
        }

        .application-condition p {
          margin: 0;
        }

        .application-condition p + p {
          margin-top: 5px;
        }

        .application-section-title {
          margin: 0;
          color: #2d1c12;
          font-family: Noto Serif KR, serif;
          font-size: 24px;
          line-height: 1.4;
        }

        .application-section-description {
          margin: 10px 0 0;
          color: #6d5947;
          font-size: 13px;
          line-height: 1.7;
        }

        .application-fields {
          display: grid;
          gap: 17px;
          margin-top: 22px;
        }

        .application-field {
          display: grid;
          gap: 8px;
        }

        .application-field label {
          color: #4f3927;
          font-size: 13px;
          font-weight: 900;
        }

        .application-field input,
        .application-field textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #d8c3a1;
          border-radius: 14px;
          background: #fffefb;
          color: #2d2119;
          font: inherit;
          outline: none;
        }

        .application-field input {
          min-height: 48px;
          padding: 0 14px;
        }

        .application-field textarea {
          min-height: 145px;
          padding: 14px;
          resize: vertical;
          line-height: 1.7;
        }

        .application-field input:focus,
        .application-field textarea:focus {
          border-color: #a86c2d;
          box-shadow: 0 0 0 3px rgba(168, 108, 45, 0.12);
        }

        .application-addon-section {
  position: relative;
  margin-top: 28px;
}

.application-addon-section
  .application-section-title {
  margin-top: 0;
  font-size: 20px;
}

.addon-dropdown {
  position: relative;
  margin-top: 16px;
}

.addon-dropdown summary {
  width: 100%;
  min-height: 52px;
  padding: 0 17px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  list-style: none;
  border: 1px solid #dfc9a4;
  border-radius: 15px;
  color: #3f2c1e;
  background: #fffdf9;
  box-shadow:
    0 7px 20px
    rgba(79, 50, 27, 0.05);
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
}

.addon-dropdown summary::-webkit-details-marker {
  display: none;
}

.addon-dropdown[open] summary {
  border-color: #e88773;
  box-shadow:
    0 0 0 3px
    rgba(232, 135, 115, 0.13);
}

.addon-dropdown-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}

.addon-dropdown-arrow {
  flex: 0 0 auto;
  color: #76523a;
  font-size: 20px;
  line-height: 1;
  transition: transform 160ms ease;
}

.addon-dropdown[open]
  .addon-dropdown-arrow {
  transform: rotate(180deg);
}

.addon-dropdown-menu {
  position: absolute;
  z-index: 30;
  top: calc(100% + 8px);
  right: 0;
  left: 0;
  max-height: 370px;
  padding: 8px;
  overflow-y: auto;
  border: 1px solid #dfc9a4;
  border-radius: 15px;
  background: #fffdf9;
  box-shadow:
    0 18px 42px
    rgba(67, 42, 23, 0.17);
}

.addon-dropdown-option {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 11px;
  padding: 13px 12px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: transparent;
  cursor: pointer;
  transition:
    border-color 150ms ease,
    background 150ms ease;
}

.addon-dropdown-option:hover {
  background: #fff5e7;
}

.addon-dropdown-option.is-selected {
  border-color: #e4b477;
  background: #fff1d8;
}

.addon-dropdown-option input {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  accent-color: #6e421d;
}

.addon-dropdown-copy {
  min-width: 0;
}

.addon-dropdown-copy strong {
  display: block;
  color: #3f2c1e;
  font-size: 14px;
}

.addon-dropdown-copy > span {
  display: block;
  margin-top: 4px;
  color: #75604d;
  font-size: 12px;
  line-height: 1.55;
}

.addon-dropdown-copy small {
  display: block;
  margin-top: 5px;
  color: #9a5e27;
  font-size: 11px;
  font-weight: 900;
}

.addon-selected-guide {
  margin: 9px 2px 0;
  color: #816d5c;
  font-size: 11px;
  line-height: 1.6;
}

        .application-message {
          margin: 18px 0 0;
          padding: 13px 14px;
          border-radius: 14px;
          background: #fff0ed;
          color: #993b34;
          font-size: 13px;
          font-weight: 800;
          line-height: 1.65;
        }

        .application-submit {
          width: 100%;
          min-height: 52px;
          margin-top: 20px;
          border: 0;
          border-radius: 15px;
          background: #6e421d;
          color: #fffaf0;
          font-size: 15px;
          font-weight: 900;
          cursor: pointer;
        }

        .application-submit:disabled {
          background: #b7a999;
          cursor: not-allowed;
        }

        .application-policy {
          margin: 12px 0 0;
          color: #867462;
          font-size: 11px;
          line-height: 1.65;
          text-align: center;
        }

        @media (max-width: 820px) {
          .product-application-form {
            grid-template-columns: 1fr;
          }

          .application-panel {
            padding: 23px 19px;
          }
        }
      `}</style>

      <section className="application-panel">
        <p className="application-label">
          선택한 상품
        </p>

        <h2 className="application-product-name">
          {product.name}
        </h2>

        <strong className="application-price">
          {formatProductPrice(
            product.price,
            product.priceSuffix,
          )}
        </strong>

        <p className="application-description">
          {product.description}
        </p>

        <ul className="application-feature-list">
          {product.included.map(
            (feature) => (
              <li key={feature}>
                ✓ {feature}
              </li>
            ),
          )}
        </ul>

        <div className="application-condition">
          {product.conditions.map(
            (condition) => (
              <p key={condition}>
                ※ {condition}
              </p>
            ),
          )}
        </div>
      </section>

      <section className="application-panel">
        <h2 className="application-section-title">
          신청자 정보
        </h2>

        <p className="application-section-description">
          신청 내용을 확인한 뒤 전화 또는 이메일로
          이용 방법을 안내합니다.
        </p>

        <div className="application-fields">
          <div className="application-field">
            <label htmlFor="application-name">
              신청자 이름
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
              required
            />
          </div>

          <div className="application-field">
            <label htmlFor="application-phone">
              전화번호
            </label>

            <input
              id="application-phone"
              type="tel"
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value)
              }
              maxLength={30}
              autoComplete="tel"
              placeholder="010-0000-0000"
            />
          </div>

          <div className="application-field">
            <label htmlFor="application-email">
              이메일
            </label>

            <input
              id="application-email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              maxLength={200}
              autoComplete="email"
              placeholder="example@email.com"
            />
          </div>
        </div>

        {addons.length > 0 ? (
  <div className="application-addon-section">
    <h3 className="application-section-title">
      추가 옵션
    </h3>

    <p className="application-section-description">
      필요한 옵션을 선택하세요. 여러 옵션을 함께
      선택할 수 있습니다.
    </p>

    <details className="addon-dropdown">
      <summary>
        <span className="addon-dropdown-label">
          {selectedAddons.length > 0
            ? `선택 ${selectedAddons.length}개 · ${selectedAddons
                .map((addon) => addon.name)
                .join(', ')}`
            : '추가 옵션을 선택해 주세요'}
        </span>

        <span
          className="addon-dropdown-arrow"
          aria-hidden="true"
        >
         ⌄
        </span>
      </summary>

      <div className="addon-dropdown-menu">
        {addons.map((addon) => {
          const isSelected =
            selectedAddonCodes.includes(addon.code);

          return (
            <label
              key={addon.code}
              className={[
                'addon-dropdown-option',
                isSelected ? 'is-selected' : '',
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

              <span className="addon-dropdown-copy">
                <strong>{addon.name}</strong>

                <span>{addon.description}</span>

                <small>{addon.priceLabel}</small>
              </span>
            </label>
          );
        })}
      </div>
    </details>

    {selectedAddons.length > 0 ? (
      <p className="addon-selected-guide">
        선택한 옵션은 신청 내용에 함께
        저장됩니다.
      </p>
    ) : null}
  </div>
) : null}

        <div
          className="application-field"
          style={{
            marginTop: 24,
          }}
        >
          <label htmlFor="application-message">
            요청사항
          </label>

          <textarea
            id="application-message"
            value={message}
            onChange={(event) =>
              setMessage(event.target.value)
            }
            maxLength={2000}
            placeholder="남기고 싶은 기록, 원하는 책 제작 방식, 궁금한 내용을 적어 주세요."
          />
        </div>

        {resultMessage ? (
          <p
            className="application-message"
            aria-live="polite"
          >
            {resultMessage}
          </p>
        ) : null}

        <button
          type="submit"
          className="application-submit"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? '신청 접수 중...'
            : `${product.name} 신청하기`}
        </button>

        <p className="application-policy">
          신청 단계에서는 비용이 결제되지 않습니다.
          담당자가 신청 내용을 확인한 뒤 안내합니다.
        </p>
      </section>
    </form>
  );
}