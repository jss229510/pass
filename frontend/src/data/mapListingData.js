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

const roomTemplates = [
  { roomType: "원룸", deposit: [300, 1000], rent: [33, 48], maintenance: [5, 9], area: [17, 25] },
  { roomType: "원룸", deposit: [500, 1000], rent: [35, 50], maintenance: [5, 9], area: [19, 26] },
  { roomType: "1.5룸", deposit: [1000, 2000], rent: [45, 60], maintenance: [6, 10], area: [26, 33] },
  { roomType: "투룸", deposit: [1500, 3000], rent: [55, 75], maintenance: [7, 12], area: [33, 46] },
  { roomType: "오피스텔", deposit: [1000, 2000], rent: [50, 70], maintenance: [10, 16], area: [22, 31] },
];

const sidoPriceScale = { 서울: 1.55, 경기: 1.2, 인천: 1.1, 부산: 1.05 };
const adjectives = ["햇살 좋은", "조용한", "풀옵션", "역세권", "가성비", "깔끔한", "넓은", "채광 좋은"];
const optionPool = ["풀옵션", "주차 가능", "엘리베이터", "역세권", "반려동물 가능", "남향", "보안 우수", "베란다"];

function hashText(text) {
  let hash = 0;
  for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash;
}

function createRandom(seed) {
  let state = seed || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

const between = (random, [min, max]) => min + random() * (max - min);

function distanceMeters(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

// "대전 유성구 궁동 123-4" → ["대전", "유성구", "궁동"]
function getAreaTokens(address, query) {
  const tokens = (address || query).split(" ").filter((token) => token && !/\d/.test(token));
  return tokens.length ? tokens.slice(0, 3) : [query];
}

export function generateListings(location, count = 8) {
  const { lat, lng, address, query } = location;
  const seed = hashText(`${query}|${lat.toFixed(4)}|${lng.toFixed(4)}`);
  const random = createRandom(seed);
  const areaTokens = getAreaTokens(address, query);
  const areaLabel = areaTokens.join(" ");
  const dongName = areaTokens[areaTokens.length - 1];
  const scale = sidoPriceScale[areaTokens[0]] ?? 1;

  return Array.from({ length: count }, (_, index) => {
    const template = roomTemplates[Math.floor(random() * roomTemplates.length)];
    const radius = 120 + random() * 780;
    const angle = random() * Math.PI * 2;
    const position = {
      lat: lat + (radius * Math.cos(angle)) / 111000,
      lng: lng + (radius * Math.sin(angle)) / (111000 * Math.cos((lat * Math.PI) / 180)),
    };
    const builtYear = Math.round(between(random, [2006, 2025]));
    const area = Math.round(between(random, template.area));
    const deposit = Math.max(100, Math.round((between(random, template.deposit) * scale) / 100) * 100);
    const rent = Math.round(between(random, template.rent) * scale);
    const maintenance = Math.round(between(random, template.maintenance));
    const walkMinutes = Math.max(1, Math.ceil(distanceMeters({ lat, lng }, position) / 67));
    const shuffled = [...optionPool];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const options = shuffled.slice(0, 2 + Math.floor(random() * 2));
    if (builtYear >= 2022) options.unshift("신축");
    const score = Math.max(68, Math.min(97, Math.round(72 + (builtYear - 2006) * 0.6 + (area / (rent + maintenance)) * 18 - walkMinutes * 0.4 + random() * 6)));

    return {
      id: `listing-${seed.toString(36)}-${index}`,
      title: `${dongName} ${adjectives[Math.floor(random() * adjectives.length)]} ${template.roomType}`,
      location: areaLabel,
      searchedFrom: location.placeName || query,
      roomType: template.roomType,
      deposit,
      rent,
      maintenance,
      area,
      floor: 1 + Math.floor(random() * 9),
      builtYear,
      walkMinutes,
      score,
      options,
      ...position,
    };
  });
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
