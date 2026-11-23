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

const escapeHtml = (text = "") => String(text).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

function createInfoContent(place) {
  return `<div style="padding:9px 11px;min-width:150px;font-size:12px;line-height:1.5"><strong>${escapeHtml(place.name)}</strong>${place.address ? `<br /><span style="color:#64748b">${escapeHtml(place.address)}</span>` : ""}</div>`;
}

function KakaoMap({ regionName, categoryId, searchQuery, onPlacesChange, roadviewRequest = 0, routeTarget = null, }) {
  const mapElementRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const routeLineRef = useRef(null);
  const routeMarkerRef = useRef(null);
  const [error, setError] = useState("");
  const roadviewElementRef = useRef(null);
  const roadviewRef = useRef(null);
  const roadviewClientRef = useRef(null);
  const lastRoadviewRequestRef = useRef(roadviewRequest);
  const [isRoadviewOpen, setIsRoadviewOpen] = useState(false);
  const [roadviewError, setRoadviewError] = useState("");
  const [roadviewTarget, setRoadviewTarget] = useState(null);

  useEffect(() => {
    if (!isRoadviewOpen || !roadviewTarget || !roadviewRef.current) return undefined;

    const frameId = window.requestAnimationFrame(() => {
      roadviewRef.current.relayout();
      roadviewRef.current.setPanoId(roadviewTarget.panoId, roadviewTarget.position);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [isRoadviewOpen, roadviewTarget]);

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

        if (!roadviewRef.current && roadviewElementRef.current) {
          roadviewRef.current = new window.kakao.maps.Roadview(roadviewElementRef.current);
          roadviewClientRef.current = new window.kakao.maps.RoadviewClient();
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
              infoWindow.setContent(createInfoContent(place));
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

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.kakao?.maps) return undefined;

    if (routeLineRef.current) routeLineRef.current.setMap(null);
    if (routeMarkerRef.current) routeMarkerRef.current.setMap(null);
    routeLineRef.current = null;
    routeMarkerRef.current = null;
    if (!routeTarget) return undefined;

    const start = map.getCenter();
    const meters = Number.parseInt(routeTarget.distance, 10) || 300;
    const latitudeOffset = (meters / 111000) * (routeTarget.rank % 2 === 0 ? -0.72 : 0.72);
    const longitudeOffset = (meters / (111000 * Math.cos(start.getLat() * Math.PI / 180))) * (routeTarget.rank % 3 === 0 ? -0.72 : 0.72);
    const destination = new window.kakao.maps.LatLng(start.getLat() + latitudeOffset, start.getLng() + longitudeOffset);
    const routeColors = { "도보": "#2563eb", "대중교통": "#2563eb", "자동차": "#f97316" };

    const routeLine = new window.kakao.maps.Polyline({
      path: [start, destination],
      strokeWeight: 6,
      strokeColor: routeColors[routeTarget.mode] ?? "#1d4ed8",
      strokeOpacity: 0.88,
      strokeStyle: "solid",
    });
    routeLine.setMap(map);

    const routeMarker = new window.kakao.maps.Marker({
      map,
      position: destination,
      title: `${routeTarget.mode} ${routeTarget.distance} · ${routeTarget.criterion}`,
    });
    const bounds = new window.kakao.maps.LatLngBounds();
    bounds.extend(start);
    bounds.extend(destination);
    map.setBounds(bounds, 70, 70, 70, 70);

    routeLineRef.current = routeLine;
    routeMarkerRef.current = routeMarker;
    return () => {
      routeLine.setMap(null);
      routeMarker.setMap(null);
    };
  }, [routeTarget]);

  const openRoadview = () => {
    const map = mapRef.current;
    const roadview = roadviewRef.current;
    const roadviewClient = roadviewClientRef.current;
    if (!map || !roadview || !roadviewClient) return;

    const position = map.getCenter();
    setRoadviewError("");
    roadviewClient.getNearestPanoId(position, 100, (panoId) => {
      if (!panoId) {
        setRoadviewError("현재 지도 중심 근처에는 로드뷰가 없습니다. 지도를 조금 이동한 뒤 다시 시도해 주세요.");
        return;
      }
      setRoadviewTarget({ panoId, position });
      setIsRoadviewOpen(true);
    });
  };

  useEffect(() => {
    if (roadviewRequest > lastRoadviewRequestRef.current) {
      if (isRoadviewOpen) {
        setIsRoadviewOpen(false);
        setRoadviewTarget(null);
        setRoadviewError("");
      } else {
        openRoadview();
      }
    }
    lastRoadviewRequestRef.current = roadviewRequest;
  }, [roadviewRequest, isRoadviewOpen]);

  if (error) return <div className="kakao-map-error">{error}</div>;
  return (
    <div className="kakao-map-canvas" aria-label={`${regionName} 지도`} style={{ position: "relative", overflow: "hidden" }}>
      <div ref={mapElementRef} style={{ position: "absolute", inset: 0 }} />
      {roadviewError && <p style={{ position: "absolute", zIndex: 2, top: 56, left: "50%", maxWidth: 300, margin: 0, padding: "8px 10px", borderRadius: 8, background: "#fff", color: "#8a4b25", fontSize: 11, lineHeight: 1.45, boxShadow: "0 4px 10px #172b4d26", transform: "translateX(-50%)" }}>{roadviewError}</p>}
      <div ref={roadviewElementRef} style={{ position: "absolute", zIndex: 3, inset: 0, visibility: isRoadviewOpen ? "visible" : "hidden", pointerEvents: isRoadviewOpen ? "auto" : "none" }}>
        <button
          type="button"
          onClick={() => { setIsRoadviewOpen(false); setRoadviewTarget(null); }}
          style={{ position: "absolute", zIndex: 4, top: 12, right: 12, border: 0, borderRadius: 8, padding: "8px 10px", background: "#fff", color: "#425877", fontSize: 12, fontWeight: 800, boxShadow: "0 4px 10px #0004" }}
        >
          지도 보기
        </button>
      </div>
    </div>
  );
}

export default KakaoMap;
