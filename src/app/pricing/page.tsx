import { auth } from '@/auth';
import {
  PRODUCT_PLANS,
  type ProductPlan,
} from '@/lib/products/catalog';
import PricingContent from './components/PricingContent';
import styles from './pricing.module.css';

export default async function PricingPage() {
  const session = await auth();

  const lifeBookPlans: readonly ProductPlan[] =
    PRODUCT_PLANS.filter(
      (product) =>
        product.category === 'LIFE_BOOK',
    );

  const monthlyPlans: readonly ProductPlan[] =
    PRODUCT_PLANS.filter(
      (product) =>
        product.category === 'MONTHLY_RECORD',
    );

  return (
    <main className={styles.pricingPage}>
      <PricingContent
        lifeBookPlans={lifeBookPlans}
        monthlyPlans={monthlyPlans}
        isLoggedIn={Boolean(session?.user)}
      />
    </main>
  );
}