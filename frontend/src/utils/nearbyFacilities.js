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
  const options = { location, radius: SEARCH_RADIUS, sort: SortBy.DISTANCE };

  return new Promise((resolve, reject) => {
    const handleResult = (results, status) => {
      if (status === Status.ZERO_RESULT || (status === Status.OK && !results.length)) {
        resolve({ ...type, place: null });
        return;
      }
      if (status !== Status.OK) {
        reject(new Error(`${type.label} 검색에 실패했습니다.`));
        return;
      }
      const [nearest] = results;
      const distance = Number(nearest.distance);
      resolve({
        ...type,
        place: {
          name: nearest.place_name,
          url: nearest.place_url,
          lat: Number(nearest.y),
          lng: Number(nearest.x),
          distance,
          ...estimateTravel(distance),
        },
      });
    };

    if (type.keyword) places.keywordSearch(type.keyword, handleResult, type.category ? { ...options, category_group_code: type.category } : options);
    else places.categorySearch(type.category, handleResult, options);
  });
}

export async function fetchNearbyFacilities({ lat, lng }) {
  const kakao = await loadKakaoMaps();
  const location = new kakao.maps.LatLng(lat, lng);
  return Promise.all(FACILITY_TYPES.map((type) => searchNearest(kakao, type, location)));
}
