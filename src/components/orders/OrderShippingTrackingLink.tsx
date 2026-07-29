type OrderShippingTrackingLinkProps = {
  carrier: string | null;
  trackingNumber: string | null;
};

type OfficialTrackingLink = {
  url: string;
  trackingNumberIncluded: boolean;
};

export default function OrderShippingTrackingLink({
  carrier,
  trackingNumber,
}: OrderShippingTrackingLinkProps) {
  const trackingLink = getOfficialTrackingLink(
    carrier,
    trackingNumber,
  );

  if (!trackingLink) {
    return null;
  }

  const carrierName =
    carrier?.trim() || "택배사";

  return (
    <div
      style={{
        gridColumn: "1 / -1",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "10px",
        marginTop: "2px",
        padding: "14px",
        border: "1px solid #d9e6dc",
        borderRadius: "14px",
        background: "#f7fbf8",
      }}
    >
      <a
        href={trackingLink.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "42px",
          padding: "10px 16px",
          borderRadius: "999px",
          background: "#24583c",
          color: "#ffffff",
          fontSize: "14px",
          fontWeight: 800,
          lineHeight: 1.4,
          textDecoration: "none",
        }}
      >
        {carrierName} 공식 배송조회
      </a>

      <span
        style={{
          color: "#5d6d63",
          fontSize: "13px",
          lineHeight: 1.6,
        }}
      >
        {trackingLink.trackingNumberIncluded
          ? "송장번호가 적용된 공식 배송조회 화면이 새 창에서 열립니다."
          : "공식 조회 화면이 열리면 위 송장번호를 입력해 주세요."}
      </span>
    </div>
  );
}

function getOfficialTrackingLink(
  carrier: string | null,
  trackingNumber: string | null,
): OfficialTrackingLink | null {
  const normalizedCarrier =
    carrier
      ?.trim()
      .replace(/\s+/g, "")
      .toLowerCase() || "";

  const normalizedTrackingNumber =
    trackingNumber
      ?.trim()
      .replace(/[^0-9a-zA-Z]/g, "") || "";

  if (
    !normalizedCarrier ||
    !normalizedTrackingNumber
  ) {
    return null;
  }

  const encodedTrackingNumber =
    encodeURIComponent(normalizedTrackingNumber);

  if (
    normalizedCarrier.includes("cj") ||
    normalizedCarrier.includes("대한통운")
  ) {
    return {
      url:
        "https://www.cjlogistics.com/ko/tool/parcel/tracking" +
        `?gnbInvcNo=${encodedTrackingNumber}`,
      trackingNumberIncluded: true,
    };
  }

  if (normalizedCarrier.includes("한진")) {
    return {
      url:
        "https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do" +
        "?mCode=MN038&schLang=KR" +
        `&wblnum=${encodedTrackingNumber}`,
      trackingNumberIncluded: true,
    };
  }

  if (normalizedCarrier.includes("롯데")) {
    return {
      url:
        "https://www.lotteglogis.com/home/reservation/tracking/index",
      trackingNumberIncluded: false,
    };
  }

  if (
    normalizedCarrier.includes("우체국") ||
    normalizedCarrier.includes("우편")
  ) {
    return {
      url:
        "https://trace.epost.go.kr/xtts/servlet/kpl.tts.common.svl.SttSVL",
      trackingNumberIncluded: false,
    };
  }

  if (normalizedCarrier.includes("로젠")) {
    return {
      url: "https://www.ilogen.co.kr/",
      trackingNumberIncluded: false,
    };
  }

  return null;
}