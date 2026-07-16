import {
  PRODUCT_BILLING_LABELS,
  PRODUCT_CATEGORY_LABELS,
  formatProductPrice,
  type ProductPlan,
} from '@/lib/products/catalog';
import Link from 'next/link';
import styles from '../pricing.module.css';

type ProductCardProps = {
  product: ProductPlan;
  href: string;
  compact?: boolean;
};

export default function ProductCard({
  product,
  href,
  compact = false,
}: ProductCardProps) {
  const includedFeatures = compact
    ? product.included.slice(0, 6)
    : product.included;

  return (
    <article
      className={[
        styles.productCard,
        product.recommended
          ? styles.recommended
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {product.badge ? (
        <span className={styles.productBadge}>
          {product.badge}
        </span>
      ) : null}

      <p className={styles.productCategory}>
        {PRODUCT_CATEGORY_LABELS[
          product.category
        ]}
      </p>

      <h3 className={styles.productTitle}>
        {product.name}
      </h3>

      <strong className={styles.productPrice}>
        {formatProductPrice(
          product.price,
          product.priceSuffix,
        )}
      </strong>

      <span className={styles.productBilling}>
        {
          PRODUCT_BILLING_LABELS[
            product.billingType
          ]
        }
      </span>

      <p className={styles.productDescription}>
        {product.description}
      </p>

      <p className={styles.featureTitle}>
        기본 포함 항목
      </p>

      <ul className={styles.featureList}>
        {includedFeatures.map((feature) => (
          <li key={feature}>
            ✓ {feature}
          </li>
        ))}
      </ul>

      {!compact &&
      product.excluded.length > 0 ? (
        <>
          <p className={styles.featureTitle}>
            기본 상품에 포함되지 않음
          </p>

          <ul
            className={[
              styles.featureList,
              styles.excludedList,
            ].join(' ')}
          >
            {product.excluded.map(
              (feature) => (
                <li key={feature}>
                  · {feature}
                </li>
              ),
            )}
          </ul>
        </>
      ) : null}

      <div className={styles.conditionBox}>
        {product.conditions.map(
          (condition) => (
            <p key={condition}>
              ※ {condition}
            </p>
          ),
        )}
      </div>

      <Link
        href={href}
        className={styles.productButton}
      >
        <span>
          {product.ctaLabel}
        </span>
      </Link>
    </article>
  );
}