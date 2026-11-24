import { useEffect, useMemo, useState } from "react";
import { formatRegionShort, loadMoveConditions, subscribeMoveConditions } from "./conditionsStore";
import { fetchMarketPrices } from "./marketPrices";

// 기본 정보(이사 조건)로 시세 데이터가 있는 지역 중 살펴볼 곳을 고른다.
// 규칙 기반 점수라 같은 조건이면 항상 같은 결과가 나온다. 재난 노출 가중치는 아직 데이터가 없어 반영하지 않는다.

export const RECOMMENDATION_COUNT = 3;

// 같은 생활·통근권으로 보는 시도 묶음
const METRO_GROUPS = [["서울", "경기", "인천"], ["대전", "세종", "충남", "충북"], ["부산", "울산", "경남"], ["대구", "경북"], ["광주", "전남"]];

const splitShort = (region) => {
  const [sido = "", ...rest] = formatRegionShort(region).split(" ");
  return { sido, sigungu: rest.join(" ") };
};

const sameMetro = (left, right) => METRO_GROUPS.some((group) => group.includes(left) && group.includes(right));

/** 조건의 지역과 시세 지역이 얼마나 가까운지: 같은 시군구 → 같은 시도 → 같은 생활권 순. */
function proximity(region, marketRegion) {
  if (!region?.sido) return { level: "none", fit: 0 };
  const { sido, sigungu } = splitShort(region);
  if (sido !== marketRegion.sido) return sameMetro(sido, marketRegion.sido) ? { level: "metro", fit: 0.4 } : { level: "none", fit: 0 };
  // "수원시"는 "수원시 영통구"까지 같은 시군구로 본다.
  if (sigungu && marketRegion.sigungu.startsWith(sigungu)) return { level: "sigungu", fit: 1 };
  return { level: "sido", fit: 0.7 };
}

const ratioFit = (value, limit) => {
  if (limit === null || limit === undefined || limit <= 0) return null;
  const ratio = value / limit;
  return ratio <= 1 ? 1 : Math.max(0, 1 - (ratio - 1) * 2.5);
};

function budgetFit(conditions, snapshot) {
  if (snapshot.rent === null) {
    const deposit = ratioFit(snapshot.deposit, conditions.depositBudget);
    return { fit: deposit ?? 0.6, over: deposit !== null && deposit < 1 ? { label: "전세", amount: snapshot.deposit - conditions.depositBudget } : null, known: deposit !== null };
  }
  const rent = ratioFit(snapshot.rent, conditions.rentBudget);
  const deposit = ratioFit(snapshot.deposit, conditions.depositBudget);
  if (rent === null && deposit === null) return { fit: 0.6, over: null, known: false };
  const fit = rent === null ? deposit : deposit === null ? rent : rent * 0.7 + deposit * 0.3;
  const over = rent !== null && rent < 1
    ? { label: "월세", amount: snapshot.rent - conditions.rentBudget }
    : deposit !== null && deposit < 1 ? { label: "보증금", amount: snapshot.deposit - conditions.depositBudget } : null;
  return { fit, over, known: true };
}

const manwon = (value) => (value >= 10000 ? `${(value / 10000).toLocaleString("ko-KR")}억` : `${value.toLocaleString("ko-KR")}만`);

function locationReason(target, work, maxCommute, marketRegion) {
  if (target.level === "sigungu") return "희망 지역";
  if (work.level === "sigungu") return "근무지와 같은 시군구";
  if (work.level === "sido") return `근무지와 같은 ${marketRegion.sido}`;
  if (target.level === "sido") return `희망 지역과 같은 ${marketRegion.sido}`;
  if (work.level === "metro") return maxCommute !== null && maxCommute >= 60 ? "근무지 통근권" : "근무지 인근 생활권";
  if (target.level === "metro") return "희망 지역 인근 생활권";
  return null;
}

/**
 * @param conditions loadMoveConditions() 결과
 * @param market fetchMarketPrices() 결과(사용자의 방 구조·거래 유형 기준)
 */
export function scoreRegions(conditions, market) {
  const regions = market?.regions ?? [];
  const maxSamples = Math.max(1, ...regions.map((region) => region.snapshot.samples));
  const weights = conditions.weights;
  const locationWeight = 2 + weights.transport;
  const budgetWeight = weights.housingCost;
  const amenityWeight = weights.amenities;
  const workCommuteBonus = conditions.maxCommute !== null && conditions.maxCommute >= 60 ? 0.6 : 0.3;

  return regions
    .map((region) => {
      const { snapshot } = region;
      const target = conditions.targetRegions
        .map((item) => proximity(item, region))
        .reduce((best, item) => (item.fit > best.fit ? item : best), { level: "none", fit: 0 });
      const workRaw = proximity(conditions.workRegion, region);
      const work = workRaw.level === "metro" ? { ...workRaw, fit: workCommuteBonus } : workRaw.level === "sido" ? { ...workRaw, fit: 0.8 } : workRaw;
      const hasTarget = conditions.targetRegions.length > 0;
      const hasWork = Boolean(conditions.workRegion);
      const location = hasTarget && hasWork ? target.fit * 0.55 + work.fit * 0.45 : hasTarget ? target.fit : hasWork ? work.fit : 0.3;

      const budget = budgetFit(conditions, snapshot);
      const trend = snapshot.change <= 0 ? 1 : Math.max(0, 1 - snapshot.change / 8);
      const amenity = snapshot.samples / maxSamples;
      const total = locationWeight * location + budgetWeight * (budget.fit * 0.85 + trend * 0.15) + amenityWeight * amenity;
      const score = Math.round((total / (locationWeight + budgetWeight + amenityWeight)) * 100);

      const reasons = [
        locationReason(target, work, conditions.maxCommute, region),
        budget.known ? (budget.over ? `${budget.over.label} 예산보다 ${manwon(budget.over.amount)} 원 높음` : "예산 이내") : null,
        amenity >= 0.6 ? "매물 표본 많음" : snapshot.change < 0 ? `1년 시세 ▼${Math.abs(snapshot.change)}%` : null,
      ].filter(Boolean);
      return { region, snapshot, score, reasons };
    })
    .sort((left, right) => right.score - left.score || left.region.label.localeCompare(right.region.label, "ko"));
}

export function buildRegionRecommendations(conditions, market, count = RECOMMENDATION_COUNT) {
  if (!market) return null;
  const base = { baseMonth: market.baseMonth, roomType: market.roomType, dealType: market.dealType, source: market.source };
  if (!conditions) {
    // 기본 정보를 입력하기 전에는 서비스 기본 지역을 보여 준다.
    const items = market.defaultRegionIds
      .map((id) => market.regions.find((region) => region.id === id))
      .filter(Boolean)
      .slice(0, count)
      .map((region) => ({ region, snapshot: region.snapshot, score: null, reasons: ["많이 찾는 지역"] }));
    return { ...base, personalized: false, items };
  }
  return { ...base, personalized: true, items: scoreRegions(conditions, market).slice(0, count) };
}

/** 랜딩의 AI 추천 카드와 지역별 시세가 같은 추천 결과를 쓰도록 하는 훅. */
export function useRegionRecommendations(count = RECOMMENDATION_COUNT) {
  const [conditions, setConditions] = useState(loadMoveConditions);
  const [market, setMarket] = useState(null);
  const roomType = conditions?.roomTypes[0] ?? "원룸";
  const dealType = conditions?.dealType ?? "월세";

  useEffect(() => subscribeMoveConditions(() => setConditions(loadMoveConditions())), []);

  useEffect(() => {
    let cancelled = false;
    fetchMarketPrices(roomType, dealType).then((value) => {
      if (!cancelled) setMarket(value);
    });
    return () => {
      cancelled = true;
    };
  }, [roomType, dealType]);

  return useMemo(() => buildRegionRecommendations(conditions, market, count), [conditions, market, count]);
}
