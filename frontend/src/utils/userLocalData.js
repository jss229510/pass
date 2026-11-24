import { MOVE_CONDITIONS_EVENT, STORAGE_KEYS } from "./conditionsStore";
import { RECENT_REGIONS_EVENT } from "./recentRegionsStore";

// 사용자별 데이터의 브라우저 캐시. 서버(local-state.json)가 원본이고, 여기 값은 로그인할 때 다시 받아온다.
// 로그인 세션(housingServerSession)과 화면 위치, 발표 예시 데이터는 지우지 않는다.
const LOCAL_KEYS = [
  ...Object.values(STORAGE_KEYS),
  "housingMarketRegions",
  "housingMarketRegionPrefs",
  "housingMoveChecklist",
  "housingSavedPolicies",
  "housingRecentRegions",
  "housingFavoriteRegions",
  "housingRegionCompareHistory",
  "passMovingJourney",
];

const SESSION_KEYS = ["housingUserProfile", "housingRecommendationDraft", "housingDocumentChecklist"];

/** 이전 사용자의 이사 조건·관심 지역·체크리스트 등이 다음 사용자에게 보이지 않도록 지운다. */
export function clearUserLocalData() {
  for (const [storage, keys] of [[window.localStorage, LOCAL_KEYS], [window.sessionStorage, SESSION_KEYS]]) {
    try {
      keys.forEach((key) => storage.removeItem(key));
    } catch {
      // 저장소 접근이 막힌 환경에서는 지울 것도 없다.
    }
  }
  window.dispatchEvent(new Event(MOVE_CONDITIONS_EVENT));
  window.dispatchEvent(new Event(RECENT_REGIONS_EVENT));
}
