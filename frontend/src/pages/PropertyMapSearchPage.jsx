import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiCrosshair, FiMapPin, FiSearch, FiX } from "react-icons/fi";
import { MdAccountBalance, MdDirectionsCar, MdDirectionsWalk, MdExpandMore, MdLocalGroceryStore, MdLocalHospital, MdPark, MdSchool, MdSubway } from "react-icons/md";
import PropertyPinMap from "../components/PropertyPinMap";
import { MAX_COMPARE, formatManwon, generateListings, getFallbackLocation } from "../data/mapListingData";
import { FACILITY_TYPES, SEARCH_RADIUS, fetchNearbyFacilities, formatDistance } from "../utils/nearbyFacilities";
import { recordRecentRegion, recordRegionComparison } from "../utils/recentRegionsStore";
import "./PropertyMapSearchPage.css";

const facilityIcons = {
  subway: MdSubway,
  mart: MdLocalGroceryStore,
  hospital: MdLocalHospital,
  public: MdAccountBalance,
  university: MdSchool,
  park: MdPark,
};

const noPlaceText = `${SEARCH_RADIUS / 1000}km 안에 없음`;

function FacilityList({ state, onRetry }) {
  if (!state || state.status === "loading") {
    return <ul className="facility-list">{FACILITY_TYPES.map((type) => <li className="facility-skeleton" key={type.key} aria-hidden="true"><i /><span /></li>)}</ul>;
  }
  if (state.status === "error") {
    return (
      <div className="facility-error">
        <p>{state.message}</p>
        {onRetry && <button type="button" onClick={onRetry}>다시 시도</button>}
      </div>
    );
  }
  return (
    <ul className="facility-list">
      {state.items.map((item) => {
        const Icon = facilityIcons[item.key];
        return (
          <li key={item.key} className={item.place ? "" : "empty"}>
            <span className={`facility-icon ${item.key}`}><Icon aria-hidden="true" /></span>
            <span className="facility-main">
              <small>{item.label}</small>
              {item.place
                ? <a href={item.place.url} target="_blank" rel="noreferrer">{item.place.name}</a>
                : <b>{noPlaceText}</b>}
            </span>
            {item.place && (
              <span className="facility-travel">
                <strong>{formatDistance(item.place.distance)}</strong>
                <span><MdDirectionsWalk aria-label="도보" />{item.place.walk}분<MdDirectionsCar aria-label="차량" />{item.place.drive}분</span>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

const DEFAULT_QUERY = "대전 유성구";
const quickRegions = ["대전 유성구", "충남 아산시", "광주 북구", "서울 마포구", "판교역", "카이스트"];

const compareRows = [
  { label: "보증금", value: (item) => item.deposit, format: formatManwon, better: "low", bestLabel: "최저" },
  { label: "월세", value: (item) => item.rent, format: (value) => `${value}만`, better: "low", bestLabel: "최저" },
  { label: "관리비", value: (item) => item.maintenance, format: (value) => `${value}만`, better: "low", bestLabel: "최저" },
  { label: "월 고정비", hint: "월세 + 관리비", value: (item) => item.rent + item.maintenance, format: (value) => `${value}만`, better: "low", bestLabel: "최저", emphasis: true },
  { label: "전용면적", value: (item) => item.area, format: (value) => `${value}㎡`, better: "high", bestLabel: "최대" },
  { label: "방 구조", value: (item) => item.roomType },
  { label: "층수", value: (item) => item.floor, format: (value) => `${value}층` },
  { label: "준공", value: (item) => item.builtYear, format: (value) => `${value}년`, better: "high", bestLabel: "최신" },
  { label: "검색 위치까지", value: (item) => item.walkMinutes, format: (value) => `도보 ${value}분`, better: "low", bestLabel: "최단" },
  { label: "AI 추천 점수", value: (item) => item.score, format: (value) => `${value}점`, better: "high", bestLabel: "최고" },
  { label: "옵션", value: (item) => item.options.join(" · ") },
];

function getBestValue(row, items) {
  if (!row.better || items.length < 2) return null;
  const values = items.map(row.value);
  if (new Set(values).size < 2) return null;
  return row.better === "low" ? Math.min(...values) : Math.max(...values);
}

function PropertyMapSearchPage({ initialSearchRegion = "", initialCompareRegions = [] }) {
  const [searchText, setSearchText] = useState(DEFAULT_QUERY);
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState("loading");
  const [mapError, setMapError] = useState("");
  const [selected, setSelected] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [focusRequest, setFocusRequest] = useState(null);
  const [notice, setNotice] = useState("");
  const [facilitiesById, setFacilitiesById] = useState({});
  const requestedFacilitiesRef = useRef(new Set());
  const noticeTimerRef = useRef(null);
  const compareRef = useRef(null);
  const handledCompareRegionsRef = useRef("");
  const handledSearchRegionRef = useRef("");
  const [autoComparePending, setAutoComparePending] = useState(false);

  useEffect(() => () => window.clearTimeout(noticeTimerRef.current), []);

  useEffect(() => {
    const regions = [...new Set(initialCompareRegions.map((region) => region.trim()).filter(Boolean))].slice(0, MAX_COMPARE);
    const requestKey = regions.join("|");
    if (regions.length < 2 || handledCompareRegionsRef.current === requestKey) return;

    handledCompareRegionsRef.current = requestKey;
    const listingsToCompare = regions.map((region) => {
      const location = { ...getFallbackLocation(region), address: region, placeName: region, query: region };
      return generateListings(location)[0];
    });
    setSearchText(regions[0]);
    setQuery(regions[0]);
    setLocation({ ...getFallbackLocation(regions[0]), address: regions[0], placeName: regions[0], query: regions[0] });
    setSelected(listingsToCompare);
    setActiveId(listingsToCompare[0]?.id ?? null);
    setAutoComparePending(true);
    setStatus("done");
  }, [initialCompareRegions]);

  useEffect(() => {
    const region = initialSearchRegion.trim();
    if (!region || handledSearchRegionRef.current === region) return;

    handledSearchRegionRef.current = region;
    setSearchText(region);
    setQuery(region);
    setLocation({ ...getFallbackLocation(region), address: region, placeName: region, query: region });
    setSelected([]);
    setActiveId(null);
    setStatus("done");
  }, [initialSearchRegion]);

  useEffect(() => {
    if (!autoComparePending || selected.length < 2) return;
    const timer = window.setTimeout(() => {
      compareRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setAutoComparePending(false);
    }, 150);
    return () => window.clearTimeout(timer);
  }, [autoComparePending, selected]);

  // 선택한 매물마다 주변 주요시설을 한 번만 검색해서 저장해 둡니다.
  const loadFacilities = useCallback((listing) => {
    requestedFacilitiesRef.current.add(listing.id);
    setFacilitiesById((current) => ({ ...current, [listing.id]: { status: "loading" } }));
    fetchNearbyFacilities(listing)
      .then((items) => setFacilitiesById((current) => ({ ...current, [listing.id]: { status: "done", items } })))
      .catch((error) => {
        requestedFacilitiesRef.current.delete(listing.id);
        setFacilitiesById((current) => ({ ...current, [listing.id]: { status: "error", message: error.message || "주변 시설을 불러오지 못했어요." } }));
      });
  }, []);

  useEffect(() => {
    selected.forEach((listing) => {
      if (!requestedFacilitiesRef.current.has(listing.id) && facilitiesById[listing.id]?.status !== "error") loadFacilities(listing);
    });
  }, [selected, facilitiesById, loadFacilities]);

  const listings = useMemo(() => (location ? generateListings(location) : []), [location]);
  const selectedIds = useMemo(() => selected.map((item) => item.id), [selected]);
  const pins = useMemo(() => [...listings, ...selected.filter((item) => !listings.some((listing) => listing.id === item.id))], [listings, selected]);
  const activeListing = selected.find((item) => item.id === activeId) ?? null;
  const cheapest = selected.length >= 2 ? selected.reduce((best, item) => (item.rent + item.maintenance < best.rent + best.maintenance ? item : best)) : null;

  const showNotice = (message) => {
    setNotice(message);
    window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => setNotice(""), 2600);
  };

  const runSearch = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    recordRecentRegion(trimmed, "search");
    setSearchText(trimmed);
    if (mapError) {
      setQuery(trimmed);
      setLocation({ ...getFallbackLocation(trimmed), query: trimmed });
      setStatus("done");
      return;
    }
    if (trimmed === query && status !== "failed") return;
    setQuery(trimmed);
    setStatus("loading");
  };

  const handleLocate = (result) => {
    if (!result) {
      setStatus("failed");
      return;
    }
    setLocation({ ...result, query });
    setStatus("done");
  };

  const handleMapError = (message) => {
    setMapError(message);
    setLocation({ ...getFallbackLocation(query), query });
    setStatus("done");
  };

  const toggleListing = (listing, { focus = false } = {}) => {
    if (selectedIds.includes(listing.id)) {
      const rest = selected.filter((item) => item.id !== listing.id);
      setSelected(rest);
      if (activeId === listing.id) setActiveId(rest.length ? rest[rest.length - 1].id : null);
      return;
    }
    if (selected.length >= MAX_COMPARE) {
      showNotice(`최대 ${MAX_COMPARE}개까지 비교할 수 있어요. 선택한 매물을 먼저 해제해 주세요.`);
      return;
    }
    setSelected([...selected, listing]);
    setActiveId(listing.id);
    if (focus) setFocusRequest({ listing, requestedAt: Date.now() });
  };

  const showListing = (listing) => {
    setActiveId(listing.id);
    setFocusRequest({ listing, requestedAt: Date.now() });
  };

  const clearSelection = () => {
    setSelected([]);
    setActiveId(null);
  };

  const scrollToCompare = () => {
    if (selected.length >= 2) {
      recordRegionComparison(selected.map(({ title, location, rent, maintenance, area, score }) => ({ title, location, rent, maintenance, area, score })));
    }
    compareRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const orderOf = (id) => selectedIds.indexOf(id) + 1;
  const areaLabel = listings[0]?.location ?? query;

  return (
    <section className="map-search-page">
      <header className="map-search-hero">
        <div>
          <p className="map-search-eyebrow">매물 검색</p>
          <h1>지도에서 매물을 고르고<br />바로 비교해 보세요.</h1>
          <p className="map-search-desc">지역명, 역, 회사·학교 위치로 검색한 뒤 지도의 매물 핀을 눌러 보세요. 주변 주요시설까지의 거리와 이동 시간을 확인하고, 여러 지역에서 고른 매물도 최대 {MAX_COMPARE}개까지 한 번에 비교할 수 있어요.</p>
        </div>
        <form className="map-search-form" onSubmit={(event) => { event.preventDefault(); runSearch(searchText); }}>
          <FiSearch aria-hidden="true" />
          <input value={searchText} onChange={(event) => setSearchText(event.target.value)} aria-label="지역 검색" placeholder="지역명, 역, 회사·학교 위치 검색" />
          <button type="submit">검색</button>
        </form>
      </header>

      <div className="map-search-chips" aria-label="빠른 지역 선택">
        {quickRegions.map((region) => (
          <button type="button" key={region} className={region === query ? "active" : ""} onClick={() => runSearch(region)}>
            <FiMapPin aria-hidden="true" />{region}
          </button>
        ))}
      </div>

      <div className="map-search-layout">
        <aside className="map-search-panel">
          <p className={`map-search-status ${status}`}>
            {status === "loading" && <>'{query}' 위치를 찾는 중이에요…</>}
            {status === "failed" && <>'{query}' 위치를 찾지 못했어요. 지역명이나 역 이름으로 다시 검색해 보세요.</>}
            {status === "done" && <><b>{areaLabel}</b> 주변 매물 {listings.length}건을 지도에 표시했어요. <em>샘플</em></>}
          </p>
          {mapError && <p className="map-search-warning">{mapError} 대략적인 위치에 샘플 매물을 보여드려요.</p>}

          <div className="map-search-panel-head">
            <b>선택한 매물 주변 주요시설</b>
            <span>{selected.length}/{MAX_COMPARE}</span>
          </div>

          {selected.length === 0 ? (
            <div className="map-search-guide">
              <FiMapPin aria-hidden="true" />
              <p>지도에서 가격이 적힌 핀을 눌러 매물을 선택하면<br />지하철역·대형마트·병원 같은 주요시설까지의<br />거리와 도보·차량 이동 시간을 보여드려요.</p>
            </div>
          ) : (
            <ul className="selected-facility-cards">
              {selected.map((item, index) => {
                const isOpen = item.id === activeId;
                const state = facilitiesById[item.id];
                const subway = state?.status === "done" ? state.items.find((facility) => facility.key === "subway") : null;
                return (
                  <li key={item.id} className={isOpen ? "open" : ""}>
                    <div className="selected-facility-head">
                      <button type="button" className="selected-facility-toggle" aria-expanded={isOpen} onClick={() => (isOpen ? setActiveId(null) : showListing(item))}>
                        <i>{index + 1}</i>
                        <span>
                          <b>{item.title}</b>
                          <small>{formatManwon(item.deposit)} / {item.rent}만 · {item.roomType}</small>
                          {!isOpen && (
                            <em>
                              {!state || state.status === "loading" ? "주변 시설 불러오는 중…" : state.status === "error" ? "주변 시설을 불러오지 못했어요" : subway?.place ? `${subway.place.name} ${formatDistance(subway.place.distance)} · 도보 ${subway.place.walk}분` : `지하철역 ${noPlaceText}`}
                            </em>
                          )}
                        </span>
                        <MdExpandMore className="selected-facility-chevron" aria-hidden="true" />
                      </button>
                      <button type="button" className="map-search-selected-remove" aria-label={`${item.title} 선택 해제`} onClick={() => toggleListing(item)}><FiX aria-hidden="true" /></button>
                    </div>
                    {isOpen && <FacilityList state={state} onRetry={mapError ? null : () => loadFacilities(item)} />}
                  </li>
                );
              })}
            </ul>
          )}

          {selected.length > 0 && <p className="facility-note">거리는 매물에서 시설까지의 직선거리이고, 도보·차량 시간은 이를 바탕으로 한 추정치예요.</p>}
          {selected.length >= 2 && <button type="button" className="map-search-compare-link" onClick={scrollToCompare}>{selected.length}개 매물 비교표 보기 ↓</button>}
        </aside>

        <div className="map-search-map">
          <PropertyPinMap
            facilities={activeListing && facilitiesById[activeListing.id]?.status === "done" ? facilitiesById[activeListing.id].items : null}
            facilityOrigin={activeListing}
            searchQuery={mapError ? "" : query}
            pins={pins}
            boundsListings={listings}
            selectedIds={selectedIds}
            activeId={activeId}
            focusRequest={focusRequest}
            onLocate={handleLocate}
            onError={handleMapError}
            onPinClick={(listing) => toggleListing(listing)}
          />
          <div className="map-search-map-badge"><FiCrosshair aria-hidden="true" />{location?.placeName ?? query}</div>
          <div className="map-search-map-actions">
            <span>선택 {selected.length}/{MAX_COMPARE}</span>
            <button type="button" onClick={clearSelection} disabled={!selected.length}>모두 선택 해제</button>
          </div>
          {notice && <p className="map-search-notice" role="status">{notice}</p>}

          {activeListing && (
            <article className="map-search-info" aria-label={`${activeListing.title} 정보`}>
              <header>
                <i>{orderOf(activeListing.id)}</i>
                <div>
                  <b>{activeListing.title}</b>
                  <small>{activeListing.location}</small>
                </div>
                <button type="button" className="map-search-info-close" aria-label="정보 닫기" onClick={() => setActiveId(null)}><FiX aria-hidden="true" /></button>
              </header>
              <p className="map-search-info-price">보증금 {formatManwon(activeListing.deposit)} <span>/</span> 월세 {activeListing.rent}만</p>
              <dl>
                <div><dt>관리비</dt><dd>{activeListing.maintenance}만</dd></div>
                <div><dt>면적</dt><dd>{activeListing.area}㎡</dd></div>
                <div><dt>구조</dt><dd>{activeListing.roomType}</dd></div>
                <div><dt>층수</dt><dd>{activeListing.floor}층</dd></div>
                <div><dt>준공</dt><dd>{activeListing.builtYear}년</dd></div>
                <div><dt>AI 점수</dt><dd>{activeListing.score}점</dd></div>
              </dl>
              <div className="map-search-info-tags">{activeListing.options.map((option) => <span key={option}>{option}</span>)}</div>
              <footer>
                <button type="button" className="ghost" onClick={() => toggleListing(activeListing)}>선택 해제</button>
                {selected.length >= 2
                  ? <button type="button" className="primary" onClick={scrollToCompare}>{selected.length}개 비교하기 ↓</button>
                  : <span>다른 핀을 선택하면 비교할 수 있어요.</span>}
              </footer>
            </article>
          )}
        </div>
      </div>

      <section className="map-compare" ref={compareRef} aria-labelledby="map-compare-title">
        <div className="map-compare-head">
          <div>
            <h2 id="map-compare-title">선택한 매물 비교</h2>
            <p>{selected.length >= 2 ? <>월 고정비가 가장 낮은 매물은 <b>{cheapest.title}</b>이에요.</> : "지도에서 매물 핀을 2개 이상 선택하면 항목별로 비교해 드려요."}</p>
          </div>
          {selected.length > 0 && <button type="button" onClick={clearSelection}>모두 선택 해제</button>}
        </div>

        {selected.length === 0 ? (
          <div className="map-compare-empty">
            <FiMapPin aria-hidden="true" />
            <p>아직 선택한 매물이 없어요.<br />지도에서 가격이 적힌 핀을 눌러 매물을 선택해 보세요.</p>
          </div>
        ) : (
          <div className="map-compare-scroll">
            <table className="map-compare-table">
              <thead>
                <tr>
                  <th scope="col">항목</th>
                  {selected.map((item, index) => (
                    <th scope="col" key={item.id}>
                      <div className="map-compare-title">
                        <i>{index + 1}</i>
                        <div>
                          <button type="button" className="map-compare-name" onClick={() => showListing(item)}>{item.title}</button>
                          <small>{item.location}</small>
                        </div>
                        <button type="button" className="map-compare-remove" aria-label={`${item.title} 선택 해제`} onClick={() => toggleListing(item)}><FiX aria-hidden="true" /></button>
                      </div>
                    </th>
                  ))}
                  {selected.length < MAX_COMPARE && <th scope="col" className="map-compare-slot"><span>+ 지도에서 핀을 더 선택해 보세요</span></th>}
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row) => {
                  const best = getBestValue(row, selected);
                  return (
                    <tr key={row.label} className={row.emphasis ? "emphasis" : ""}>
                      <th scope="row">{row.label}{row.hint && <small>{row.hint}</small>}</th>
                      {selected.map((item) => {
                        const value = row.value(item);
                        const isBest = best !== null && value === best;
                        return (
                          <td key={item.id} className={isBest ? "best" : ""}>
                            {row.format ? row.format(value) : value}
                            {isBest && <em>{row.bestLabel}</em>}
                          </td>
                        );
                      })}
                      {selected.length < MAX_COMPARE && <td className="map-compare-slot" />}
                    </tr>
                  );
                })}
                <tr className="map-compare-group">
                  <th scope="rowgroup" colSpan={1 + selected.length + (selected.length < MAX_COMPARE ? 1 : 0)}>
                    주요시설까지 거리 <small>직선거리 기준 · 도보/차량 시간은 추정치</small>
                  </th>
                </tr>
                {FACILITY_TYPES.map((type) => {
                  const cells = selected.map((item) => {
                    const state = facilitiesById[item.id];
                    return { item, state, place: state?.status === "done" ? state.items.find((facility) => facility.key === type.key)?.place : null };
                  });
                  const distances = cells.map((cell) => cell.place?.distance).filter((distance) => typeof distance === "number");
                  const best = cells.length >= 2 && distances.length >= 2 && new Set(distances).size > 1 ? Math.min(...distances) : null;
                  return (
                    <tr key={type.key}>
                      <th scope="row">{type.label}</th>
                      {cells.map(({ item, state, place }) => {
                        const isBest = best !== null && place?.distance === best;
                        return (
                          <td key={item.id} className={`map-compare-facility${isBest ? " best" : ""}`}>
                            {!state || state.status === "loading" ? <span className="muted">불러오는 중…</span>
                              : state.status === "error" ? <span className="muted">-</span>
                              : !place ? <span className="muted">{noPlaceText}</span>
                              : (
                                <>
                                  <small>{place.name}</small>
                                  <span>{formatDistance(place.distance)}{isBest && <em>최단</em>}</span>
                                  <span className="map-compare-travel"><MdDirectionsWalk aria-label="도보" />{place.walk}분 <MdDirectionsCar aria-label="차량" />{place.drive}분</span>
                                </>
                              )}
                          </td>
                        );
                      })}
                      {selected.length < MAX_COMPARE && <td className="map-compare-slot" />}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}

export default PropertyMapSearchPage;
