// 매물 검색 지도용 샘플 매물 생성기
// 실제 매물 API를 연동하기 전까지, 검색한 위치 주변에 같은 검색어면 항상 같은 샘플 매물을 만들어 줍니다.

export const MAX_COMPARE = 3;

// 지도를 불러오지 못했을 때 쓰는 대략적인 지역 중심 좌표
const fallbackCenters = {
  "대전 유성구": { lat: 36.3622, lng: 127.3562 },
  "대전 서구": { lat: 36.3553, lng: 127.3838 },
  "충남 아산시": { lat: 36.7898, lng: 127.0018 },
  "광주 북구": { lat: 35.1747, lng: 126.9121 },
  "서울 마포구": { lat: 37.5663, lng: 126.9019 },
  "서울 관악구": { lat: 37.4784, lng: 126.9516 },
  "서울 강남구": { lat: 37.5172, lng: 127.0473 },
  "경기 수원시": { lat: 37.2636, lng: 127.0286 },
};

export function getFallbackLocation(query) {
  const key = Object.keys(fallbackCenters).find((region) => query.includes(region) || region.includes(query)) ?? "대전 유성구";
  return { ...fallbackCenters[key], address: key, placeName: key };
}

export function formatManwon(value) {
  if (value < 10000) return `${value.toLocaleString("ko-KR")}만`;
  const eok = Math.floor(value / 10000);
  const rest = value % 10000;
  return rest ? `${eok}억 ${rest.toLocaleString("ko-KR")}만` : `${eok}억`;
}

// 지도 핀에 들어가는 짧은 가격 표기: "1,000/45", "1.2억/80"
export function formatPriceLabel(listing) {
  const deposit = listing.deposit < 10000 ? listing.deposit.toLocaleString("ko-KR") : `${(listing.deposit / 10000).toFixed(1).replace(/\.0$/, "")}억`;
  return `${deposit}/${listing.rent}`;
}
