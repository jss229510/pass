import React, { useEffect, useRef, useState } from "react";

const categoryQueries = {
  overview: "주요 시설",
  housing: "부동산",
  transport: "지하철역",
  life: "마트 병원",
  safety: "경찰서 소방서",
  support: "행정복지센터 청년센터",
};

const regionCenters = {
  "대전 유성구": { lat: 36.3622, lng: 127.3562 },
  "충남 아산시": { lat: 36.7898, lng: 127.0018 },
  "광주 북구": { lat: 35.1747, lng: 126.9121 },
};

function KakaoMap({ regionName, categoryId, searchQuery, onPlacesChange }) {
  const mapElementRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const appKey = import.meta.env.VITE_KAKAO_MAP_KEY;
    if (!appKey) {
      setError("지도 키가 설정되지 않았습니다.");
      return undefined;
    }

    let cancelled = false;
    const renderMap = () => {
      if (cancelled || !window.kakao?.maps || !mapElementRef.current) return;
      window.kakao.maps.load(() => {
        if (cancelled || !mapElementRef.current) return;

        const center = regionCenters[regionName] ?? regionCenters["대전 유성구"];
        if (!mapRef.current) {
          mapRef.current = new window.kakao.maps.Map(mapElementRef.current, {
            center: new window.kakao.maps.LatLng(center.lat, center.lng),
            level: 6,
          });
        }

        const map = mapRef.current;
        map.setCenter(new window.kakao.maps.LatLng(center.lat, center.lng));
        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = [];

        const places = new window.kakao.maps.services.Places();
        const query = searchQuery?.trim() || `${regionName} ${categoryQueries[categoryId]}`;
        places.keywordSearch(query, (results, status) => {
          if (cancelled) return;
          const foundPlaces = status === window.kakao.maps.services.Status.OK ? results.slice(0, 5) : [];
          const points = foundPlaces.length > 0
            ? foundPlaces.map((place) => ({ name: place.place_name, address: place.road_address_name || place.address_name, lat: Number(place.y), lng: Number(place.x) }))
            : [{ name: regionName, lat: center.lat, lng: center.lng }];
          const bounds = new window.kakao.maps.LatLngBounds();

          const infoWindow = new window.kakao.maps.InfoWindow({ removable: true });
          markersRef.current = points.map((place) => {
            const position = new window.kakao.maps.LatLng(place.lat, place.lng);
            bounds.extend(position);
            const marker = new window.kakao.maps.Marker({ map, position, title: place.name });
            window.kakao.maps.event.addListener(marker, "click", () => {
              infoWindow.setContent(`<div style="padding:9px 11px;min-width:150px;font-size:12px;line-height:1.5"><strong>${place.name}</strong>${place.address ? `<br /><span style="color:#64748b">${place.address}</span>` : ""}</div>`);
              infoWindow.open(map, marker);
            });
            return marker;
          });

          if (points.length > 1) map.setBounds(bounds);
          onPlacesChange(points.map((place) => place.name));
        });
      });
    };

    const existingScript = document.querySelector("script[data-kakao-maps-sdk]");
    if (existingScript) {
      if (window.kakao?.maps) renderMap();
      else existingScript.addEventListener("load", renderMap, { once: true });
    } else {
      const script = document.createElement("script");
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
      script.async = true;
      script.dataset.kakaoMapsSdk = "true";
      script.addEventListener("load", renderMap, { once: true });
      script.addEventListener("error", () => setError("지도를 불러오지 못했습니다. 등록한 도메인과 지도 키를 확인해 주세요."), { once: true });
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
    };
  }, [categoryId, onPlacesChange, regionName, searchQuery]);

  if (error) return <div className="kakao-map-error">{error}</div>;
  return <div className="kakao-map-canvas" ref={mapElementRef} aria-label={`${regionName} 지도`} />;
}

export default KakaoMap;
