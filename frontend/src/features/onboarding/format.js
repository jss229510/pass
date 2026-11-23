// 온보딩 화면 표시용 문자열 변환

const numberFormat = new Intl.NumberFormat("ko-KR");

export const formatNumber = (value) => (value === null || value === undefined || value === "" ? "" : numberFormat.format(value));

/** 만원 단위 금액 → "1,000만 원", "1억 2,000만 원" */
export const formatManwon = (value) => {
  if (value === null || value === undefined) return "";
  if (value === 0) return "0원";
  const eok = Math.floor(value / 10000);
  const man = value % 10000;
  const parts = [];
  if (eok) parts.push(`${numberFormat.format(eok)}억`);
  if (man) parts.push(`${numberFormat.format(man)}만`);
  return `${parts.join(" ")} 원`;
};

/** 입력칸 숫자 문자열 → 0 이상 정수 또는 null */
export const parseAmount = (text, max = 1_000_000) => {
  const digits = String(text ?? "").replace(/\D/g, "");
  if (!digits) return null;
  return Math.min(Number.parseInt(digits, 10), max);
};

export const formatRegionName = (region) => [region?.sido, region?.sigungu].filter(Boolean).join(" ");

const dateTimeFormat = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
});

export const formatDateTime = (iso) => {
  const date = iso ? new Date(iso) : null;
  return date && !Number.isNaN(date.getTime()) ? dateTimeFormat.format(date) : "";
};
