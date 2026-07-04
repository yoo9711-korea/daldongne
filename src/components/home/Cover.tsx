import Link from "next/link";

export default function Cover() {
  return (
    <section className="cover" data-folio="표지">
      <div className="cover__inner">
        <p className="cover__eyebrow">
          DAL-DONG-NE PUBLISHING
        </p>

        <h1 className="cover__title">
          <span className="l1">사진은 추억을 남긴다.</span>
          <span className="l2">
            가장 높은 곳에서, 당신의 기억을
            <br />
            따뜻하게 맞아 줍니다.
          </span>
        </h1>

        <p className="cover__subtitle">
          AI가 묻고, 당신이 답하면,
          <br />
          한 사람의 삶이 한 권의 책이 됩니다.
        </p>

        <div className="cover__actions">
          <Link href="/trial" className="btn btn--gold">
            무료로 체험하기
          </Link>

          <Link href="/products" className="btn btn--ghost-dark">
            작품 살펴보기
          </Link>
        </div>

        <div className="ticker" aria-hidden="true">
          <div className="ticker__track">
            <span>Life Book</span>
            <span>Family Book</span>
            <span>Couple Book</span>
            <span>Baby Book</span>
            <span>Travel Book</span>
            <span>Club Book</span>
            <span>Heritage Edition</span>
            <span>달동네 인생영화</span>

            <span>Life Book</span>
            <span>Family Book</span>
            <span>Couple Book</span>
            <span>Baby Book</span>
            <span>Travel Book</span>
            <span>Club Book</span>
            <span>Heritage Edition</span>
            <span>달동네 인생영화</span>
          </div>
        </div>
      </div>

      <div className="deckle deckle--paper" aria-hidden="true">
        <svg viewBox="0 0 1200 24" preserveAspectRatio="none">
          <path d="M0,24 L0,8 L50,14 L100,4 L150,16 L200,8 L250,18 L300,5 L350,15 L400,9 L450,17 L500,4 L550,13 L600,8 L650,18 L700,6 L750,14 L800,3 L850,16 L900,9 L950,18 L1000,5 L1050,14 L1100,8 L1150,16 L1200,8 L1200,24 Z" />
        </svg>
      </div>
    </section>
  );
}