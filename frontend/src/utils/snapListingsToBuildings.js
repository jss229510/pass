import { distanceMeters } from "../data/mapListingData";
import { loadKakaoMaps } from "./loadKakaoMaps";

// 샘플 매물 좌표는 검색 위치 주변에 무작위로 흩어져 있어서 도로·하천·공원 위에 찍히기도 합니다.
// 카카오 장소 검색으로 주변의 실제 주거용 건물을 찾아 매물 핀을 그 건물 위치로 옮깁니다.

const BUILDING_KEYWORDS = ["오피스텔", "원룸", "빌라", "주택"];
// 가까운 곳에 건물이 부족하면 반경을 넓혀 한 번 더 찾습니다.
const SEARCH_RADII = [1000, 2000];
const PAGES = [1, 2];
const MIN_BUILDINGS = 8;
const NOT_RESIDENTIAL = /중개|분양|모델하우스|사무실|상가|빌딩|오피스(?!텔)/;

const buildingCache = new Map();

function hashText(text) {
  let hash = 0;
  for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash;
}

function isResidentialBuilding(result) {
  const category = result.category_name ?? "";
  return category.startsWith("부동산") && result.category_group_code !== "AG2" && !NOT_RESIDENTIAL.test(category);
}

function searchKeyword(kakao, keyword, center, radius, page) {
  const { Status } = kakao.maps.services;
  return new Promise((resolve) => {
    new kakao.maps.services.Places().keywordSearch(
      keyword,
      (results, status) => resolve(status === Status.OK ? results : []),
      { location: new kakao.maps.LatLng(center.lat, center.lng), radius, page, size: 15 },
    );
  });
}

async function findBuildings(kakao, center) {
  const key = `${center.lat.toFixed(4)},${center.lng.toFixed(4)}`;
  if (buildingCache.has(key)) return buildingCache.get(key);

  const request = (async () => {
    const byId = new Map();
    for (const radius of SEARCH_RADII) {
      const pages = await Promise.all(BUILDING_KEYWORDS.flatMap((keyword) => PAGES.map((page) => searchKeyword(kakao, keyword, center, radius, page))));
      pages.flat().filter(isResidentialBuilding).forEach((result) => {
        if (byId.has(result.id)) return;
        byId.set(result.id, {
          id: result.id,
          name: result.place_name,
          address: result.road_address_name || result.address_name,
          isOfficetel: result.category_name.includes("오피스텔") || result.place_name.includes("오피스텔"),
          lat: Number(result.y),
          lng: Number(result.x),
        });
      });
      if (byId.size >= MIN_BUILDINGS) break;
    }
    // 검색 결과 순서가 조금 달라져도 같은 매물이 같은 건물에 놓이도록 id 순으로 정렬합니다.
    return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
  })();

  buildingCache.set(key, request);
  request.catch(() => buildingCache.delete(key));
  return request;
}

// 매물 id로 건물을 고르되, 이미 쓴 건물은 건너뛰어 핀이 겹치지 않게 합니다.
function pickBuilding(candidates, used, listingId) {
  const available = candidates.filter((building) => !used.has(building.id));
  if (!available.length) return null;
  return available[hashText(listingId) % available.length];
}

/**
 * 매물 목록의 좌표를 검색 위치(center) 주변 실제 주거용 건물 좌표로 바꿉니다.
 * 오피스텔 매물은 오피스텔 건물을 우선 고르고, 건물을 찾지 못한 매물은 원래 좌표를 그대로 둡니다.
 */
export async function snapListingsToBuildings(listings, center) {
  if (!listings.length) return listings;
  const kakao = await loadKakaoMaps();
  const buildings = await findBuildings(kakao, center);
  if (!buildings.length) return listings;

  const officetels = buildings.filter((building) => building.isOfficetel);
  const houses = buildings.filter((building) => !building.isOfficetel);
  const used = new Set();

  return listings.map((listing) => {
    const preferred = listing.roomType === "오피스텔" ? officetels : houses;
    const building = pickBuilding(preferred, used, listing.id) ?? pickBuilding(buildings, used, listing.id);
    if (!building) return listing;
    used.add(building.id);
    const position = { lat: building.lat, lng: building.lng };
    return {
      ...listing,
      ...position,
      buildingName: building.name,
      buildingAddress: building.address,
      walkMinutes: Math.max(1, Math.ceil(distanceMeters(center, position) / 67)),
    };
  });
}
