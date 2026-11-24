import { buildMarketPrices } from "../data/marketPriceData";
import { apiRequest } from "./apiClient";

// 홈 시세 카드와 마이페이지가 같은 시세(/api/market-prices, 실패 시 같은 규칙의 목업)를 보도록 묶어 둡니다.
const cache = new Map();

export function fetchMarketPrices(roomType, dealType) {
  const key = `${roomType}|${dealType}`;
  if (!cache.has(key)) {
    const parameters = new URLSearchParams({ roomType, dealType });
    const request = apiRequest(`/api/market-prices?${parameters}`)
      .then((value) => ({ ...value, source: "server" }))
      .catch(() => {
        // 실패한 요청은 캐시하지 않아 다음 화면 진입 때 서버를 다시 시도합니다.
        cache.delete(key);
        return { ...buildMarketPrices(roomType, dealType), source: "fallback" };
      });
    cache.set(key, request);
  }
  return cache.get(key);
}

// 마루 추천은 동 이름으로 기록되므로 시세가 있는 시군구로 연결합니다.
const DONG_REGION_IDS = {
  둔산동: "daejeon-seo",
  월평동: "daejeon-seo",
  관저동: "daejeon-seo",
  노은동: "daejeon-yuseong",
  우동: "busan-haeundae",
  재송동: "busan-haeundae",
};

const compact = (value) => (typeof value === "string" ? value.replace(/[\s>]/g, "") : "");

export function findMarketRegion(regions, name) {
  const target = compact(name);
  if (!target || !Array.isArray(regions)) return null;

  const aliasId = DONG_REGION_IDS[target];
  if (aliasId) return regions.find((region) => region.id === aliasId) ?? null;

  const exact = regions.find((region) => compact(region.label) === target);
  if (exact) return exact;

  // "대전 유성구 봉명동"처럼 더 자세한 이름은 가장 구체적인 시세 지역으로 연결합니다.
  const containing = regions
    .filter((region) => target.includes(compact(region.label)))
    .sort((left, right) => compact(right.label).length - compact(left.label).length)[0];
  if (containing) return containing;

  // "유성구"처럼 짧은 이름은 한 지역만 가리킬 때만 연결합니다.
  const partial = regions.filter((region) => compact(region.label).includes(target));
  return partial.length === 1 ? partial[0] : null;
}

const formatNumber = (value) => value.toLocaleString("ko-KR");

export function formatDeposit(value) {
  if (value < 10000) return `${formatNumber(value)}만`;
  const eok = Math.floor(value / 10000);
  const rest = value % 10000;
  return rest ? `${eok}억 ${formatNumber(rest)}만` : `${eok}억`;
}

export function formatPrice(snapshot) {
  if (snapshot.rent === null) return formatDeposit(snapshot.deposit);
  return `${formatNumber(snapshot.deposit)} / ${snapshot.rent}만`;
}

export function sparklinePoints(values, width, height, padding = 2) {
  if (!Array.isArray(values) || values.length < 2) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values
    .map((value, index) => {
      const x = padding + (index * (width - padding * 2)) / (values.length - 1);
      const y = padding + (1 - (value - min) / range) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}
