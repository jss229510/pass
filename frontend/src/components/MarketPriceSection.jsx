import React, { useEffect, useMemo, useRef, useState } from "react";
import { buildMarketPrices } from "../data/marketPriceData";
import { apiRequest } from "../utils/apiClient";
import { loadUserState, saveUserState } from "../utils/userStateSync";
import "./MarketPriceSection.css";

const STORAGE_KEY = "housingMarketRegions";
const MAX_REGIONS = 8;
const ROOM_TYPES = ["원룸", "1.5룸", "투룸"];
const DEAL_TYPES = ["월세", "전세"];

const toRegionIds = (value) => (Array.isArray(value) ? value.filter((id) => typeof id === "string") : []);

// 저장된 지역이 없으면 null을 돌려주고, 시세 API 응답의 기본 지역으로 채웁니다.
function loadRegionIds() {
  try {
    const saved = toRegionIds(JSON.parse(window.localStorage.getItem(STORAGE_KEY)));
    return saved.length ? saved : null;
  } catch {
    return null;
  }
}

const formatNumber = (value) => value.toLocaleString("ko-KR");

function formatDeposit(value) {
  if (value < 10000) return `${formatNumber(value)}만`;
  const eok = Math.floor(value / 10000);
  const rest = value % 10000;
  return rest ? `${eok}억 ${formatNumber(rest)}만` : `${eok}억`;
}

function formatPrice(snapshot) {
  if (snapshot.rent === null) return formatDeposit(snapshot.deposit);
  return `${formatNumber(snapshot.deposit)} / ${snapshot.rent}만`;
}

function Sparkline({ values, direction }) {
  const width = 96;
  const height = 34;
  const padding = 3;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = padding + (index * (width - padding * 2)) / (values.length - 1);
      const y = padding + (1 - (value - min) / range) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg className={`market-sparkline ${direction}`} viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label="최근 1년 시세 추이">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChangeBadge({ change }) {
  const direction = change > 0 ? "up" : change < 0 ? "down" : "flat";
  const mark = direction === "up" ? "▲" : direction === "down" ? "▼" : "–";
  return <span className={`market-change ${direction}`}>{mark} {Math.abs(change).toFixed(1)}%</span>;
}

function MarketPriceSection({ onNavigate }) {
  const [roomType, setRoomType] = useState("원룸");
  const [dealType, setDealType] = useState("월세");
  const [regionIds, setRegionIds] = useState(loadRegionIds);
  const [isStateHydrated, setIsStateHydrated] = useState(false);
  const [market, setMarket] = useState(null);
  const [query, setQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);
  const marketRegions = useMemo(() => market?.regions ?? [], [market]);

  useEffect(() => {
    let cancelled = false;
    const parameters = new URLSearchParams({ roomType, dealType });
    apiRequest(`/api/market-prices?${parameters}`)
      .then((value) => {
        if (!cancelled) setMarket(value);
      })
      .catch(() => {
        // 백엔드에 연결할 수 없으면 기존 목업 시세를 그대로 보여 줍니다.
        if (!cancelled) setMarket(buildMarketPrices(roomType, dealType));
      });
    return () => { cancelled = true; };
  }, [roomType, dealType]);

  useEffect(() => {
    if (market && regionIds === null) setRegionIds(market.defaultRegionIds);
  }, [market, regionIds]);

  useEffect(() => {
    loadUserState("marketRegions")
      .then((value) => {
        const savedIds = toRegionIds(value);
        if (savedIds.length) setRegionIds(savedIds);
      })
      .catch(() => undefined)
      .finally(() => setIsStateHydrated(true));
  }, []);

  useEffect(() => {
    if (regionIds === null) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(regionIds));
      if (isStateHydrated) saveUserState("marketRegions", regionIds).catch(() => undefined);
    } catch {
      // 저장소를 쓸 수 없는 환경에서도 화면은 그대로 동작합니다.
    }
  }, [isStateHydrated, regionIds]);

  useEffect(() => {
    if (!isSearchOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!searchRef.current?.contains(event.target)) setIsSearchOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [isSearchOpen]);

  const cards = useMemo(
    () =>
      (regionIds ?? [])
        .map((id) => marketRegions.find((region) => region.id === id))
        .filter(Boolean)
        .map((region) => ({ region, snapshot: region.snapshot })),
    [regionIds, marketRegions],
  );

  const searchResults = useMemo(() => {
    const keyword = query.replace(/\s|>/g, "");
    return marketRegions.filter((region) => !(regionIds ?? []).includes(region.id) && region.path.replace(/\s|>/g, "").includes(keyword));
  }, [query, regionIds, marketRegions]);

  const insight = useMemo(() => {
    if (!cards.length) return null;
    const top = cards.reduce((best, card) => (card.snapshot.change > best.snapshot.change ? card : best));
    return { label: top.region.label, change: top.snapshot.change };
  }, [cards]);

  const addRegion = (region) => {
    setRegionIds((ids) => [region.id, ...(ids ?? []).filter((id) => id !== region.id)].slice(0, MAX_REGIONS));
    setQuery("");
    setIsSearchOpen(false);
  };

  const removeRegion = (regionId) => setRegionIds((ids) => (ids ?? []).filter((id) => id !== regionId));

  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter" && searchResults[0]) {
      event.preventDefault();
      addRegion(searchResults[0]);
    }
    if (event.key === "Escape") setIsSearchOpen(false);
  };

  return (
    <section className="market-section" aria-labelledby="market-section-title">
      <h2 id="market-section-title">지역별 시세</h2>

      {insight && (
        <div className="market-insight">
          <span className="market-insight-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 4v16h16" /><path d="M8 16v-4M12 16V8M16 16v-6" /></svg>
          </span>
          <p>
            최근 본 {cards.length}개 지역 중 1년간 {roomType} {dealType} 중위값이 {insight.change > 0 ? "가장 많이 오른" : "가장 적게 내린"} 곳은{" "}
            <b>{insight.label}</b>(<em className={insight.change > 0 ? "up" : "down"}>{insight.change > 0 ? "▲" : "▼"} {Math.abs(insight.change).toFixed(1)}%</em>)예요.
          </p>
          <button type="button" className="market-insight-link" onClick={() => onNavigate("custom-analysis")}>자세히 보기 →</button>
        </div>
      )}

      <div className="market-toolbar">
        <div className="market-filters">
          <div className="market-segment" role="group" aria-label="방 구조">
            {ROOM_TYPES.map((type) => <button type="button" key={type} className={type === roomType ? "active" : ""} aria-pressed={type === roomType} onClick={() => setRoomType(type)}>{type}</button>)}
          </div>
          <div className="market-segment" role="group" aria-label="거래 유형">
            {DEAL_TYPES.map((type) => <button type="button" key={type} className={type === dealType ? "active" : ""} aria-pressed={type === dealType} onClick={() => setDealType(type)}>{type}</button>)}
          </div>
        </div>

        <div className="market-search" ref={searchRef}>
          <svg className="market-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
          <input
            type="text"
            value={query}
            placeholder="지역 추가 · 시도 > 시군구"
            aria-label="시세를 볼 지역 추가"
            aria-expanded={isSearchOpen}
            aria-controls="market-search-list"
            role="combobox"
            onChange={(event) => { setQuery(event.target.value); setIsSearchOpen(true); }}
            onFocus={() => setIsSearchOpen(true)}
            onKeyDown={handleSearchKeyDown}
          />
          <button type="button" className="market-search-toggle" aria-label="지역 목록 열기" onClick={() => setIsSearchOpen((isOpen) => !isOpen)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
          </button>
          {isSearchOpen && (
            <ul className="market-search-list" id="market-search-list" role="listbox">
              {searchResults.length ? (
                searchResults.map((region) => (
                  <li key={region.id} role="option" aria-selected="false">
                    <button type="button" onClick={() => addRegion(region)}>{region.path}</button>
                  </li>
                ))
              ) : (
                <li className="market-search-empty">{query ? "검색 결과가 없어요." : "추가할 수 있는 지역을 모두 담았어요."}</li>
              )}
            </ul>
          )}
        </div>
      </div>

      {cards.length ? (
        <div className="market-card-list">
          {cards.map(({ region, snapshot }) => {
            const direction = snapshot.change > 0 ? "up" : snapshot.change < 0 ? "down" : "flat";
            return (
              <article className="market-card" key={region.id}>
                <div className="market-card-head">
                  <b>{region.label}</b>
                  <span className="market-deal-badge">{dealType}</span>
                  <button type="button" className="market-card-remove" aria-label={`${region.label} 삭제`} onClick={() => removeRegion(region.id)}>×</button>
                </div>
                <p className="market-card-meta">{roomType} · {market.baseMonth} 중위값</p>
                <strong className="market-card-price">{formatPrice(snapshot)}</strong>
                <div className="market-card-trend">
                  <div>
                    <ChangeBadge change={snapshot.change} />
                    <span className="market-card-period">최근 1년</span>
                  </div>
                  <Sparkline values={snapshot.series} direction={direction} />
                </div>
                <p className="market-card-sample">표본 {snapshot.samples}건</p>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="market-empty">위 검색창에서 시세를 보고 싶은 지역을 추가해 보세요.</p>
      )}
    </section>
  );
}

export default MarketPriceSection;
