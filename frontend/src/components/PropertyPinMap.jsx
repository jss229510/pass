import React, { useEffect, useRef, useState } from "react";
import { formatPriceLabel } from "../data/mapListingData";
import { loadKakaoMaps } from "../utils/loadKakaoMaps";

const DEFAULT_CENTER = { lat: 36.3622, lng: 127.3562 };

function createPinElement(listing, order, isActive, onClick) {
  const pin = document.createElement("button");
  pin.type = "button";
  pin.className = `listing-pin${order ? " selected" : ""}${isActive ? " active" : ""}`;
  pin.setAttribute("aria-label", `${listing.title} ${order ? "선택 해제" : "선택"}`);
  pin.setAttribute("aria-pressed", order ? "true" : "false");

  if (order) {
    const badge = document.createElement("i");
    badge.textContent = String(order);
    pin.appendChild(badge);
  }
  const price = document.createElement("span");
  price.textContent = formatPriceLabel(listing);
  pin.appendChild(price);
  const type = document.createElement("small");
  type.textContent = listing.roomType;
  pin.appendChild(type);

  pin.addEventListener("click", (event) => {
    event.stopPropagation();
    onClick(listing);
  });
  return pin;
}

/**
 * 매물 검색 전용 지도.
 * - searchQuery가 바뀌면 카카오 장소 검색으로 위치를 찾아 onLocate로 알려 줍니다.
 * - pins: 지도에 그릴 매물, boundsListings: 화면에 맞춰 보여줄 매물(현재 검색 결과)
 */
function createFacilityElement(facility) {
  const label = document.createElement("a");
  label.className = `facility-pin ${facility.key}`;
  label.href = facility.place.url;
  label.target = "_blank";
  label.rel = "noreferrer";
  const type = document.createElement("i");
  type.textContent = facility.label;
  const name = document.createElement("span");
  name.textContent = facility.place.name;
  label.append(type, name);
  return label;
}

function PropertyPinMap({ searchQuery, pins, boundsListings, selectedIds, activeId, focusRequest, facilities = null, facilityOrigin = null, onLocate, onError, onPinClick }) {
  const mapElementRef = useRef(null);
  const mapRef = useRef(null);
  const overlaysRef = useRef([]);
  const facilityShapesRef = useRef([]);
  const callbacksRef = useRef({ onLocate, onError, onPinClick });
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState("");

  callbacksRef.current = { onLocate, onError, onPinClick };

  useEffect(() => {
    let cancelled = false;
    loadKakaoMaps()
      .then((kakao) => {
        if (cancelled || !mapElementRef.current) return;
        mapRef.current = new kakao.maps.Map(mapElementRef.current, {
          center: new kakao.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
          level: 5,
        });
        setIsReady(true);
      })
      .catch((loadError) => {
        if (cancelled) return;
        setError(loadError.message);
        callbacksRef.current.onError?.(loadError.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isReady || !searchQuery) return undefined;
    let cancelled = false;
    const { kakao } = window;
    new kakao.maps.services.Places().keywordSearch(searchQuery, (results, status) => {
      if (cancelled) return;
      if (status !== kakao.maps.services.Status.OK || !results.length) {
        callbacksRef.current.onLocate(null);
        return;
      }
      const [top] = results;
      callbacksRef.current.onLocate({ lat: Number(top.y), lng: Number(top.x), address: top.address_name || top.road_address_name, placeName: top.place_name });
    });
    return () => {
      cancelled = true;
    };
  }, [isReady, searchQuery]);

  useEffect(() => {
    if (!isReady) return;
    const { kakao } = window;
    const order = new Map(selectedIds.map((id, index) => [id, index + 1]));
    overlaysRef.current.forEach((overlay) => overlay.setMap(null));
    overlaysRef.current = pins.map((listing) => {
      const isSelected = order.has(listing.id);
      const overlay = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(listing.lat, listing.lng),
        content: createPinElement(listing, order.get(listing.id), listing.id === activeId, (item) => callbacksRef.current.onPinClick(item)),
        yAnchor: 1.25,
        zIndex: listing.id === activeId ? 4 : isSelected ? 3 : 1,
        clickable: true,
      });
      overlay.setMap(mapRef.current);
      return overlay;
    });
  }, [isReady, pins, selectedIds, activeId]);

  useEffect(() => {
    if (!isReady || !boundsListings.length) return;
    const { kakao } = window;
    const bounds = new kakao.maps.LatLngBounds();
    boundsListings.forEach((listing) => bounds.extend(new kakao.maps.LatLng(listing.lat, listing.lng)));
    mapRef.current.setBounds(bounds, 70, 70, 70, 70);
  }, [isReady, boundsListings]);

  // 활성 매물에서 주변 주요시설까지 점선과 시설 라벨을 그립니다.
  useEffect(() => {
    if (!isReady) return;
    const { kakao } = window;
    facilityShapesRef.current.forEach((shape) => shape.setMap(null));
    facilityShapesRef.current = [];
    if (!facilities || !facilityOrigin) return;

    const origin = new kakao.maps.LatLng(facilityOrigin.lat, facilityOrigin.lng);
    facilities.filter((facility) => facility.place).forEach((facility) => {
      const position = new kakao.maps.LatLng(facility.place.lat, facility.place.lng);
      const line = new kakao.maps.Polyline({ path: [origin, position], strokeWeight: 2, strokeColor: "#1d4ed8", strokeOpacity: 0.55, strokeStyle: "shortdash" });
      const label = new kakao.maps.CustomOverlay({ position, content: createFacilityElement(facility), yAnchor: 0.5, zIndex: 2, clickable: true });
      line.setMap(mapRef.current);
      label.setMap(mapRef.current);
      facilityShapesRef.current.push(line, label);
    });
  }, [isReady, facilities, facilityOrigin]);

  useEffect(() => {
    if (!isReady || !focusRequest) return;
    const { kakao } = window;
    mapRef.current.panTo(new kakao.maps.LatLng(focusRequest.listing.lat, focusRequest.listing.lng));
  }, [isReady, focusRequest]);

  if (error) return <div className="kakao-map-error">{error}</div>;
  return <div ref={mapElementRef} className="listing-pin-map" aria-label="매물 지도" />;
}

export default PropertyPinMap;
