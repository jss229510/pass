import { loadKakaoMaps } from "./loadKakaoMaps";

export const SEARCH_RADIUS = 5000;

// 카카오 장소 검색으로 찾는 주요시설 종류
export const FACILITY_TYPES = [
  { key: "subway", label: "지하철역", category: "SW8" },
  { key: "mart", label: "대형마트", category: "MT1" },
  { key: "hospital", label: "병원", category: "HP8" },
  { key: "public", label: "공공기관", category: "PO3" },
  { key: "university", label: "대학교", keyword: "대학교", category: "SC4" },
  { key: "park", label: "공원", keyword: "공원" },
];

export const LIFESTYLE_FACILITY_TYPES = [
  {
    key: "bungeoppang",
    label: "붕세권",
    keywords: ["붕어빵", "잉어빵"],
    nameKeywords: ["붕어빵", "잉어빵"],
    category: "FD6",
    radius: 1000,
  },
  { key: "walk", label: "산책세권", keywords: ["산책로", "공원"], radius: 3000 },
  { key: "fitness", label: "헬세권", keywords: ["헬스장", "피트니스", "체육관"], radius: 3000 },
  { key: "laundry", label: "빨세권", keywords: ["코인세탁소", "셀프빨래방"], radius: 3000 },
  { key: "daiso", label: "다세권", keyword: "다이소", radius: 3000 },
];

// 실제 경로가 아닌 직선거리 기반 추정치입니다.
// 도보: 우회 계수 1.3, 분당 75m(4.5km/h) / 차량: 우회 계수 1.4, 도심 평균 25km/h + 신호·주차 2분
export function estimateTravel(meters) {
  return {
    walk: Math.max(1, Math.round((meters * 1.3) / 75)),
    drive: Math.max(1, Math.round((meters * 1.4) / (25000 / 60) + 2)),
  };
}

export function formatDistance(meters) {
  return meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`;
}

function searchNearest(kakao, type, location) {
  const places = new kakao.maps.services.Places();
  const { Status, SortBy } = kakao.maps.services;
  const options = { location, radius: type.radius ?? SEARCH_RADIUS, sort: SortBy.DISTANCE };

  return new Promise((resolve, reject) => {
    const findNearestResult = (results) => results.find((result) =>
      !type.nameKeywords || type.nameKeywords.some((keyword) => result.place_name.includes(keyword)));

    const toPlace = (result) => {
      const distance = Number(result.distance);
      return {
        name: result.place_name,
        url: result.place_url,
        lat: Number(result.y),
        lng: Number(result.x),
        distance,
        ...estimateTravel(distance),
      };
    };
    const handleResult = (results, status) => {
      if (status === Status.ZERO_RESULT || (status === Status.OK && !results.length)) {
        resolve({ ...type, place: null });
        return;
      }
      if (status !== Status.OK) {
        reject(new Error(`${type.label} 검색에 실패했습니다.`));
        return;
      }
      const nearest = findNearestResult(results);
      resolve({ ...type, place: nearest ? toPlace(nearest) : null });
    };

    if (type.keywords) {
      Promise.all(type.keywords.map((keyword) => new Promise((resolveKeyword, rejectKeyword) => {
        places.keywordSearch(keyword, (results, status) => {
          if (status === Status.ZERO_RESULT || (status === Status.OK && !results.length)) {
            resolveKeyword(null);
            return;
          }
          if (status !== Status.OK) {
            rejectKeyword(new Error(`${type.label} 검색에 실패했습니다.`));
            return;
          }
          const nearest = findNearestResult(results);
          resolveKeyword(nearest ? toPlace(nearest) : null);
        }, type.category ? { ...options, category_group_code: type.category } : options);
      })))
        .then((results) => {
          const nearest = results.filter(Boolean).sort((a, b) => a.distance - b.distance)[0] ?? null;
          resolve({ ...type, place: nearest });
        })
        .catch(reject);
    }
    else if (type.keyword) places.keywordSearch(type.keyword, handleResult, type.category ? { ...options, category_group_code: type.category } : options);
    else places.categorySearch(type.category, handleResult, options);
  });
}

export async function fetchNearbyFacilities({ lat, lng }, facilityTypes = FACILITY_TYPES) {
  const kakao = await loadKakaoMaps();
  const location = new kakao.maps.LatLng(lat, lng);
  return Promise.all(facilityTypes.map((type) => searchNearest(kakao, type, location)));
}
