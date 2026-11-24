import React, { useEffect, useMemo, useRef, useState } from "react";
import { fetchMarketPrices, findMarketRegion, formatPrice, sparklinePoints } from "../utils/marketPrices";
import { loadRecentRegions, subscribeRecentRegions } from "../utils/recentRegionsStore";
import { loadUserState, saveUserState } from "../utils/userStateSync";
import "./MarketPriceSection.css";

// 카드 구성: AI 추천 3곳 → 직접 추가한 지역 → 마루·지역 검색에서 최근 본 지역 순으로, 겹치지 않게 최대 7곳.
const PREFS_STORAGE_KEY = "housingMarketRegionPrefs";
const MAX_REGIONS = 7;
const MAX_HIDDEN = 30;
const ROOM_TYPES = ["원룸", "1.5룸", "투룸"];
const DEAL_TYPES = ["월세", "전세"];
const SLIDE_INTERVAL = 3500;
const SLIDE_DURATION = 700;

const SOURCE_LABELS = { ai: "AI 추천", added: "직접 추가", maru: "마루에서 봄", search: "지역 검색에서 봄" };

const toIds = (value) => (Array.isArray(value) ? [...new Set(value.filter((id) => typeof id === "string"))] : []);

// 예전에는 기본 지역 목록(배열)을 그대로 저장했으므로, 배열은 "직접 추가 없음"으로 본다.
const normalizePrefs = (value) =>
  value && typeof value === "object" && !Array.isArray(value)
    ? { added: toIds(value.added).slice(0, MAX_REGIONS), hidden: toIds(value.hidden).slice(0, MAX_HIDDEN) }
    : { added: [], hidden: [] };

function loadPrefs() {
  try {
    return normalizePrefs(JSON.parse(window.localStorage.getItem(PREFS_STORAGE_KEY)));
  } catch {
    return normalizePrefs(null);
  }
}

function persistPrefs(prefs) {
  try {
    window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // 저장소를 쓸 수 없는 환경에서도 화면은 그대로 동작합니다.
  }
  saveUserState("marketRegions", prefs).catch(() => undefined);
}

function composeEntries(aiIds, prefs, recent) {
  const entries = [];
  const seen = new Set();
  const candidates = [
    ...aiIds.map((id) => ({ id, source: "ai" })),
    ...prefs.added.map((id) => ({ id, source: "added" })),
    ...recent,
  ];
  for (const entry of candidates) {
    if (!entry.id || seen.has(entry.id) || prefs.hidden.includes(entry.id)) continue;
    seen.add(entry.id);
    entries.push(entry);
    if (entries.length === MAX_REGIONS) break;
  }
  return entries;
}

function usePrefersReducedMotion() {
  const query = "(prefers-reduced-motion: reduce)";
  const [reduced, setReduced] = useState(() => window.matchMedia?.(query).matches ?? false);
  useEffect(() => {
    const media = window.matchMedia?.(query);
    if (!media) return undefined;
    const update = () => setReduced(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return reduced;
}

/** 카드를 일정 간격으로 한 장씩 오른쪽에서 왼쪽으로 넘기고, 맨 앞 카드는 뒤로 보낸다. */
function AutoSlider({ items, getKey, renderItem, playing }) {
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const [start, setStart] = useState(0);
  const [shift, setShift] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const count = items.length;
  const isActive = playing && !isHovering && count > 1;
  const signature = items.map(getKey).join("|");
  const offset = count ? start % count : 0;
  const ordered = count ? [...items.slice(offset), ...items.slice(0, offset)] : [];

  useEffect(() => {
    setStart(0);
    setShift(0);
  }, [signature]);

  useEffect(() => {
    if (playing && viewportRef.current) viewportRef.current.scrollLeft = 0;
  }, [playing]);

  useEffect(() => {
    if (!isActive) return undefined;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      const track = trackRef.current;
      const first = track?.firstElementChild;
      if (!first) return;
      const gap = parseFloat(window.getComputedStyle(track).columnGap) || 0;
      setShift(first.getBoundingClientRect().width + gap);
    }, SLIDE_INTERVAL);
    return () => window.clearInterval(timer);
  }, [isActive]);

  useEffect(() => {
    if (!shift) return undefined;
    const timer = window.setTimeout(() => {
      setShift(0);
      setStart((value) => value + 1);
    }, SLIDE_DURATION);
    return () => window.clearTimeout(timer);
  }, [shift]);

  return (
    <div
      ref={viewportRef}
      className={`market-card-viewport${playing ? "" : " is-paused"}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onFocus={() => setIsHovering(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsHovering(false);
      }}
    >
      <div
        ref={trackRef}
        className="market-card-list"
        style={{
          transform: shift ? `translateX(-${shift}px)` : "translateX(0)",
          transition: shift ? `transform ${SLIDE_DURATION}ms ease-in-out` : "none",
        }}
      >
        {ordered.map((item) => <React.Fragment key={getKey(item)}>{renderItem(item)}</React.Fragment>)}
      </div>
    </div>
  );
}

function Sparkline({ values, direction }) {
  const width = 96;
  const height = 34;
  const points = sparklinePoints(values, width, height, 3);

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

function MarketPriceSection({ onNavigate, recommendations }) {
  const [roomType, setRoomType] = useState(recommendations?.roomType ?? "원룸");
  const [dealType, setDealType] = useState(recommendations?.dealType ?? "월세");
  const [prefs, setPrefs] = useState(loadPrefs);
  const [recentRegions, setRecentRegions] = useState(loadRecentRegions);
  const [market, setMarket] = useState(null);
  const [query, setQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const reducedMotion = usePrefersReducedMotion();
  const searchRef = useRef(null);
  const filterTouchedRef = useRef(false);
  const marketRegions = useMemo(() => market?.regions ?? [], [market]);

  // 처음에는 기본 정보의 방 구조·거래 유형으로 보여 주고, 사용자가 필터를 바꾸면 그대로 둡니다.
  useEffect(() => {
    if (!recommendations || filterTouchedRef.current) return;
    setRoomType(recommendations.roomType);
    setDealType(recommendations.dealType);
  }, [recommendations]);

  useEffect(() => {
    let cancelled = false;
    // 백엔드에 연결할 수 없으면 같은 규칙의 목업 시세로 채워집니다.
    fetchMarketPrices(roomType, dealType).then((value) => {
      if (!cancelled) setMarket(value);
    });
    return () => { cancelled = true; };
  }, [roomType, dealType]);

  useEffect(() => {
    loadUserState("marketRegions")
      .then((value) => {
        if (value && typeof value === "object" && !Array.isArray(value)) setPrefs(normalizePrefs(value));
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => subscribeRecentRegions(() => setRecentRegions(loadRecentRegions())), []);

  useEffect(() => {
    if (!isSearchOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!searchRef.current?.contains(event.target)) setIsSearchOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [isSearchOpen]);

  const aiIds = useMemo(() => recommendations?.items.map((item) => item.region.id) ?? [], [recommendations]);

  // 마루·지역 검색에서 본 지역 이름을 시세 지역으로 연결합니다(최근 본 순).
  const recentEntries = useMemo(
    () => recentRegions.flatMap((region) => {
      const matched = findMarketRegion(marketRegions, region.name);
      return matched ? [{ id: matched.id, source: region.source === "maru" ? "maru" : "search", viewedName: region.name }] : [];
    }),
    [recentRegions, marketRegions],
  );

  const cards = useMemo(
    () => composeEntries(aiIds, prefs, recentEntries).flatMap((entry) => {
      const region = marketRegions.find((item) => item.id === entry.id);
      return region ? [{ ...entry, region, snapshot: region.snapshot }] : [];
    }),
    [aiIds, prefs, recentEntries, marketRegions],
  );

  const shownIds = useMemo(() => new Set(cards.map((card) => card.id)), [cards]);

  const searchResults = useMemo(() => {
    const keyword = query.replace(/\s|>/g, "");
    return marketRegions.filter((region) => !shownIds.has(region.id) && region.path.replace(/\s|>/g, "").includes(keyword));
  }, [query, shownIds, marketRegions]);

  const insight = useMemo(() => {
    if (!cards.length) return null;
    const top = cards.reduce((best, card) => (card.snapshot.change > best.snapshot.change ? card : best));
    return { label: top.region.label, change: top.snapshot.change };
  }, [cards]);

  const updatePrefs = (update) => {
    setPrefs((current) => {
      const next = normalizePrefs(update(current));
      persistPrefs(next);
      return next;
    });
  };

  const addRegion = (region) => {
    updatePrefs((current) => ({
      added: [region.id, ...current.added.filter((id) => id !== region.id)],
      hidden: current.hidden.filter((id) => id !== region.id),
    }));
    setQuery("");
    setIsSearchOpen(false);
  };

  const removeRegion = (regionId) => {
    updatePrefs((current) => ({
      added: current.added.filter((id) => id !== regionId),
      hidden: [regionId, ...current.hidden.filter((id) => id !== regionId)],
    }));
  };

  const changeFilter = (setter, value) => {
    filterTouchedRef.current = true;
    setter(value);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter" && searchResults[0]) {
      event.preventDefault();
      addRegion(searchResults[0]);
    }
    if (event.key === "Escape") setIsSearchOpen(false);
  };

  const canSlide = cards.length > 1 && !reducedMotion;

  const renderCard = ({ id, source, viewedName, region, snapshot }) => {
    const direction = snapshot.change > 0 ? "up" : snapshot.change < 0 ? "down" : "flat";
    return (
      <article className="market-card" key={id}>
        <span className={`market-source-badge ${source}`} title={viewedName ? `${viewedName}을(를) 본 기록으로 추가됐어요.` : undefined}>
          {source === "ai" && !recommendations.personalized ? "추천 지역" : SOURCE_LABELS[source]}
        </span>
        <div className="market-card-head">
          <b>{region.label}</b>
          <span className="market-deal-badge">{dealType}</span>
          <button type="button" className="market-card-remove" aria-label={`${region.label} 시세 카드 숨기기`} onClick={() => removeRegion(id)}>×</button>
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
  };

  return (
    <section className="market-section" aria-labelledby="market-section-title">
      <div className="market-heading">
        <h2 id="market-section-title">지역별 시세</h2>
        <span className="market-heading-note">추천 지역에 마루·지역 검색에서 본 지역을 더해 최대 {MAX_REGIONS}곳까지 보여 줘요.</span>
        {canSlide && (
          <button type="button" className="market-slide-toggle" aria-pressed={!isPlaying} onClick={() => setIsPlaying((value) => !value)}>
            {isPlaying ? "자동 넘김 멈춤" : "자동 넘김 재생"}
          </button>
        )}
      </div>

      {insight && (
        <div className="market-insight">
          <span className="market-insight-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 4v16h16" /><path d="M8 16v-4M12 16V8M16 16v-6" /></svg>
          </span>
          <p>
            표시 중인 {cards.length}개 지역 중 1년간 {roomType} {dealType} 중위값이 {insight.change > 0 ? "가장 많이 오른" : "가장 적게 내린"} 곳은{" "}
            <b>{insight.label}</b>(<em className={insight.change > 0 ? "up" : "down"}>{insight.change > 0 ? "▲" : "▼"} {Math.abs(insight.change).toFixed(1)}%</em>)예요.
          </p>
          <button type="button" className="market-insight-link" onClick={() => onNavigate("custom-analysis")}>자세히 보기 →</button>
        </div>
      )}

      <div className="market-toolbar">
        <div className="market-filters">
          <div className="market-segment" role="group" aria-label="방 구조">
            {ROOM_TYPES.map((type) => <button type="button" key={type} className={type === roomType ? "active" : ""} aria-pressed={type === roomType} onClick={() => changeFilter(setRoomType, type)}>{type}</button>)}
          </div>
          <div className="market-segment" role="group" aria-label="거래 유형">
            {DEAL_TYPES.map((type) => <button type="button" key={type} className={type === dealType ? "active" : ""} aria-pressed={type === dealType} onClick={() => changeFilter(setDealType, type)}>{type}</button>)}
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

      {!market || !recommendations ? (
        <p className="market-empty">시세를 불러오고 있어요.</p>
      ) : cards.length ? (
        <AutoSlider items={cards} getKey={(card) => card.id} renderItem={renderCard} playing={canSlide && isPlaying} />
      ) : (
        <p className="market-empty">위 검색창에서 시세를 보고 싶은 지역을 추가해 보세요.</p>
      )}
    </section>
  );
}

export default MarketPriceSection;
