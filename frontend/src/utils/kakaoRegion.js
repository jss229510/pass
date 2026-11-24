// 좌표 → "대전 유성구 온천1동" 같은 짧은 행정동 이름

// "서울특별시" → "서울", "충청남도" → "충남", "강원특별자치도" → "강원"
function shortSido(name) {
  const split = name.match(/^(충청|경상|전라)(남|북)도$/);
  if (split) return `${split[1][0]}${split[2]}`;
  return name.slice(0, 2);
}

/** 카카오 지도 SDK(services 포함)가 로드된 뒤에 호출합니다. 지역을 못 찾으면 null */
export function findRegionLabel(kakao, lat, lng) {
  return new Promise((resolve) => {
    new kakao.maps.services.Geocoder().coord2RegionCode(lng, lat, (results, status) => {
      const region = status === kakao.maps.services.Status.OK ? (results.find((item) => item.region_type === "H") ?? results[0]) : null;
      resolve(region ? [shortSido(region.region_1depth_name), region.region_2depth_name, region.region_3depth_name].filter(Boolean).join(" ") : null);
    });
  });
}
