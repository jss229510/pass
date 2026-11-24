import React, { useEffect, useState } from "react";
import {
  FaBell,
  FaCheckCircle,
  FaChartBar,
  FaFileAlt,
  FaHeart,
  FaHome,
  FaMapMarkerAlt,
  FaUserCircle,
} from "react-icons/fa";
import ContractsPage from "./ContractsPage";
import NotificationsPage from "./NotificationsPage";
import "../styles/my-condition-insights.css";
import FilterBar from "../features/mypage/FilterBar";
import { links } from "../links";
import {
  WEIGHT_LABELS,
  formatRegionShort,
  loadMoveConditions,
} from "../utils/conditionsStore";
import {
  loadFavoriteRegionNames,
  loadRecentRegions,
  loadRegionCompareHistory,
  removeRegionComparison,
  toggleFavoriteRegion,
} from "../utils/recentRegionsStore";
import {
  SKIPPED,
  buildConditionRows,
} from "../features/onboarding/conditionRows";
import { formatManwon } from "../features/onboarding/format";
import { loadUserState, saveUserState } from "../utils/userStateSync";
import { fetchMarketPrices, findMarketRegion, formatDeposit, formatPrice, sparklinePoints } from "../utils/marketPrices";
import { changePassword, clearMyData } from "../utils/authStore";
import { clearUserLocalData } from "../utils/userLocalData";
import "../styles/my-dashboard.css";
import "../styles/favorite-regions.css";
import "../styles/compare-history.css";
import "../styles/condition-cost-snapshot.css";
import "../styles/move-checklist.css";
import "../styles/account-settings.css";

const menus = [
  ["dashboard", "내 대시보드", FaHome],
  ["conditions", "내 이사 조건", FaMapMarkerAlt],
  ["favorites", "관심 목록", FaHeart],
  ["history", "비교 기록", FaChartBar],
  ["documents", "계약서 분석 내역", FaFileAlt],
  ["checklist", "이사 체크리스트", FaCheckCircle],
  ["alerts", "알림 설정", FaBell],
  ["account", "계정 정보", FaUserCircle],
];
const defaultUserProfile = {
  name: "김청년",
  email: "youth@example.com",
  income: "250",
};

function loadUserProfile() {
  try {
    return {
      ...defaultUserProfile,
      ...JSON.parse(window.sessionStorage.getItem("housingUserProfile")),
    };
  } catch {
    return defaultUserProfile;
  }
}

// 홈 시세 카드와 같은 /api/market-prices 응답(실패 시 같은 규칙의 목업)을 씁니다.
function useMarketPrices(roomType, dealType) {
  const [market, setMarket] = useState(null);
  useEffect(() => {
    let cancelled = false;
    fetchMarketPrices(roomType, dealType).then((value) => {
      if (!cancelled) setMarket(value);
    });
    return () => {
      cancelled = true;
    };
  }, [roomType, dealType]);
  return market;
}

const FAVORITE_ROOM_TYPES = ["원룸", "1.5룸", "투룸"];

function useMonthlyMarkets() {
  const [markets, setMarkets] = useState({});
  useEffect(() => {
    let cancelled = false;
    Promise.all(FAVORITE_ROOM_TYPES.map((roomType) => fetchMarketPrices(roomType, "월세"))).then((values) => {
      if (!cancelled) setMarkets(Object.fromEntries(FAVORITE_ROOM_TYPES.map((roomType, index) => [roomType, values[index]])));
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return markets;
}

function withFavoritePrices(region, markets) {
  const [studio, oneHalf, twoRoom] = FAVORITE_ROOM_TYPES.map((roomType) => findMarketRegion(markets[roomType]?.regions, region.name));
  return {
    ...region,
    marketId: studio?.id ?? null,
    marketLabel: studio?.label ?? null,
    studio: studio ? formatPrice(studio.snapshot) : "시세 없음",
    oneHalf: oneHalf ? formatPrice(oneHalf.snapshot) : "-",
    twoRoom: twoRoom ? formatPrice(twoRoom.snapshot) : "-",
    change: studio ? studio.snapshot.change : null,
    insufficient: !studio || studio.snapshot.samples < 10,
  };
}

function ChangeText({ change }) {
  if (change === null || change === undefined) return "-";
  if (change === 0) return "– 0%";
  return `${change > 0 ? "▲" : "▼"}${Math.abs(change)}%`;
}

const changeClass = (change, prefix) => (change > 0 ? `${prefix}-up` : change < 0 ? `${prefix}-down` : "");

function routeSummary(market, fromId, toId) {
  const from = market?.regions.find((region) => region.id === fromId);
  const to = market?.regions.find((region) => region.id === toId);
  if (!from || !to) return null;
  const signed = (value, format) => `${value > 0 ? "+" : value < 0 ? "-" : "±"}${format(Math.abs(value))}원`;
  return {
    label: `${from.label} → ${to.label}`,
    rent: from.snapshot.rent === null ? null : signed(to.snapshot.rent - from.snapshot.rent, (value) => `${value}만`),
    deposit: signed(to.snapshot.deposit - from.snapshot.deposit, formatDeposit),
  };
}

function formatViewedAt(viewedAt) {
  const minutes = Math.max(0, Math.floor((Date.now() - viewedAt) / 60000));
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

function Sparkline({ points }) {
  return (
    <svg
      className="dashboard-sparkline"
      viewBox="0 0 70 22"
      aria-label="1년 시세 추이"
    >
      <polyline
        points={points}
        fill="none"
        stroke="#1d4ed8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function loadFavoriteRegions() {
  const recentRegions = loadRecentRegions();
  return loadFavoriteRegionNames().flatMap((name) => {
    const recent = recentRegions.find((region) => region.name === name);
    if (!recent) return [];
    return [{
      id: `favorite-${name}`,
      name,
      type: recent.source === "maru" ? "마루 추천" : "지역 검색",
      memo: "최근 본 지역에서 관심 목록에 추가했어요.",
      addedAt: formatViewedAt(recent.viewedAt),
    }];
  });
}

function Dashboard({ onNavigate, onOpenTab, onCompareRegions, onOpenRegionSearch, userName }) {
  const [filters, setFilters] = useState({ room: "원룸", deal: "월세" });
  const [regionFilter, setRegionFilter] = useState("전체");
  const [selected, setSelected] = useState([]);
  const [favorites, setFavorites] = useState(loadFavoriteRegionNames);
  const [notice, setNotice] = useState("");
  const status = "ready";
  const market = useMarketPrices(filters.room, filters.deal);
  const routeMarket = useMarketPrices("원룸", filters.deal);
  const route = routeSummary(routeMarket, "daejeon-yuseong", "chungnam-asan");
  const recentRegions = loadRecentRegions().map((region) => {
    const matched = findMarketRegion(market?.regions, region.name);
    return {
      id: `${region.source}-${region.name}`,
      name: region.name,
      type: region.source === "maru" ? "마루 추천" : "지역 검색",
      viewed: formatViewedAt(region.viewedAt),
      marketId: matched?.id ?? null,
      marketLabel: matched?.label ?? null,
      snapshot: matched?.snapshot ?? null,
      change: matched ? matched.snapshot.change : null,
    };
  });
  const regions = recentRegions.filter(
    (region) => regionFilter === "전체" || region.type === regionFilter,
  );
  const largestChange = recentRegions
    .filter((region) => region.snapshot)
    .sort((left, right) => Math.abs(right.change) - Math.abs(left.change))[0];
  const toggleSelected = (id) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((item) => item !== id));
      return;
    }
    if (selected.length === 3) {
      setNotice("비교는 최대 3곳까지 선택할 수 있어요.");
      return;
    }
    setNotice("");
    setSelected([...selected, id]);
  };
  const toggleFavorite = (name) => setFavorites(toggleFavoriteRegion(name));
  if (status === "loading")
    return (
      <div className="dashboard-table-card">
        {[1, 2, 3].map((item) => (
          <div className="contracts-skeleton" key={item} />
        ))}
      </div>
    );
  if (status === "error")
    return (
      <div className="dashboard-table-card">
        지역 기록을 불러오지 못했어요.{" "}
        <button type="button" className="dashboard-action-button">
          다시 시도
        </button>
      </div>
    );
  if (!recentRegions.length)
    return (
      <div className="dashboard-table-card">
        아직 본 지역이 없어요 ·{" "}
        <button
          type="button"
          className="dashboard-action-button"
          onClick={() => onNavigate("property-map-search")}
        >
          지역 둘러보기
        </button>
      </div>
    );
  return (
    <section className="my-dashboard">
      <header className="dashboard-page-header">
        <div>
          <span>마이페이지</span>
          <h2>{userName || "회원"}님, 안녕하세요.</h2>
          <p>
            마루 추천과 지역 검색에서 최근 조회한 지역 {recentRegions.length}
            곳을 확인할 수 있어요.
          </p>
        </div>
        <button type="button" onClick={() => onOpenTab("conditions")}>
          내 조건 수정
        </button>
      </header>
      {largestChange && (
        <section className="dashboard-insight">
          <span>
            <b>{filters.room} {filters.deal}</b> 기준 최근 본 지역 중 1년 변동률이 가장 큰
            곳은 <b>{largestChange.name}</b>이에요. 지난 1년간{" "}
            <ChangeText change={largestChange.change} /> 변했어요.
          </span>
          <a
            href={links.region(largestChange.marketId)}
            target="_blank"
            rel="noreferrer"
          >
            자세히 보기 →
          </a>
        </section>
      )}
      <FilterBar value={filters} onChange={setFilters} />
      <section className="dashboard-kpis">
        {[
          ["이사 준비", "2 / 8 완료", "checklist"],
          ["관심 목록", `${favorites.length}곳`, "favorites"],
          ["계약서 분석", "완료 1 · 확인 필요 1", "documents"],
          ["비교 기록", "2건", "history"],
        ].map(([label, value, tab], index) => (
          <button
            className="dashboard-kpi"
            type="button"
            key={label}
            onClick={() => onOpenTab(tab)}
          >
            <span>
              {label}
              <b>{value}</b>
              {index === 0 && (
                <i className="dashboard-kpi-progress">
                  <em style={{ width: "25%" }} />
                </i>
              )}
            </span>
            <i>›</i>
          </button>
        ))}
      </section>
      <section className="dashboard-next">
        <div>
          <span>다음 단계 · 정책 확인</span>
          <h3>내 조건에 맞는 주거 지원 정책을 확인해 보세요.</h3>
          <p>
            희망 지역과 예산을 기준으로 신청 가능성을 먼저 살펴볼 수 있어요.
          </p>
        </div>
        <button type="button" onClick={() => onNavigate("support")}>
          정책 확인하기
        </button>
      </section>
      <section className="dashboard-table-card">
        <div className="dashboard-card-head">
          <h3>최근 본 지역</h3>
          <div className="dashboard-chip-list">
            {["전체", "마루 추천", "지역 검색"].map((item) => (
              <button
                type="button"
                className={regionFilter === item ? "active" : ""}
                key={item}
                onClick={() => setRegionFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>선택</th>
                <th>지역</th>
                <th>1년 추이</th>
                <th>최근 중위값</th>
                <th>1년 변동</th>
                <th>표본</th>
                <th>관심</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {regions.map((region) => (
                <tr
                  className="dashboard-selectable-row"
                  key={region.id}
                  onClick={(event) => {
                    if (event.target.closest("input, button, a")) return;
                    toggleSelected(region.id);
                  }}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(region.id)}
                      onChange={() => toggleSelected(region.id)}
                      aria-label={`${region.name} 비교 선택`}
                    />
                  </td>
                  <td className="dashboard-region-cell">
                    <b>
                      {region.name}
                      <span
                        className={`dashboard-badge ${region.type === "마루 추천" ? "candidate" : ""}`}
                      >
                        {region.type}
                      </span>
                    </b>
                    <small>
                      최근 조회 {region.viewed}
                      {region.marketLabel && region.marketLabel !== region.name && ` · ${region.marketLabel} 시세`}
                    </small>
                  </td>
                  <td>
                    {region.snapshot ? <Sparkline points={sparklinePoints(region.snapshot.series, 70, 22)} /> : "-"}
                  </td>
                  <td>
                    {!region.snapshot ? (
                      "시세 없음"
                    ) : region.snapshot.rent === null ? (
                      <>전세 {formatDeposit(region.snapshot.deposit)}원</>
                    ) : (
                      <>
                        보증금 {formatDeposit(region.snapshot.deposit)}원
                        <br />
                        월세 {region.snapshot.rent}만원
                      </>
                    )}
                  </td>
                  <td className={changeClass(region.change, "dashboard")}>
                    <ChangeText change={region.change} />
                  </td>
                  <td>{region.snapshot ? `${region.snapshot.samples}건` : "-"}</td>
                  <td>
                    <button
                      type="button"
                      className="dashboard-star"
                      onClick={() => toggleFavorite(region.name)}
                      aria-label={`${region.name} 관심 토글`}
                    >
                      {favorites.includes(region.name) ? "★" : "☆"}
                    </button>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="dashboard-detail"
                      onClick={() => onOpenRegionSearch(region.name)}
                    >
                      상세 →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="dashboard-compare-bar">
          <span>
            {notice ||
              (selected.length
                ? `${selected.length}곳 선택됨`
                : "지역을 2~3곳 선택해 비교하세요.")}
          </span>
          <button
            type="button"
            disabled={selected.length < 2}
            onClick={() => onCompareRegions(recentRegions.filter((region) => selected.includes(region.id)).map((region) => region.name))}
          >
            선택한 {selected.length}곳 비교 →
          </button>
        </div>
        <p className="dashboard-note">
          * 홈 시세 카드와 같은 {market?.baseMonth ?? ""} 기준 중위값·표본 수예요. 데모
          데이터이며, 실제 계약 전 최신 매물 정보를 확인해야 합니다.
        </p>
      </section>
      <section className="dashboard-bottom">
        <article className="dashboard-bottom-card">
          <h3>이사 경로 요약</h3>
          <div className="dashboard-route">
            <div>
              <span>{route?.label ?? "대전 유성구 → 충남 아산시"}</span>
              <b>{route ? (route.rent ? `월세 ${route.rent}` : "전세 기준") : "-"}</b>
            </div>
            <div>
              <span>{route?.rent ? "보증금 차이" : "전세금 차이"}</span>
              <b>{route?.deposit ?? "-"}</b>
            </div>
            <div>
              <span>관리비 / 교통비</span>
              <b>미입력</b>
            </div>
          </div>
          <a
            href={links.compare(["yuseong", "asan"])}
            target="_blank"
            rel="noreferrer"
          >
            매물 비교에서 자세히 보기 →
          </a>
        </article>
        <article className="dashboard-bottom-card">
          <h3>이번 주 할 일</h3>
          <ul className="dashboard-todo">
            <li>
              <span>후보 지역 생활권 확인</span>
              <b className="dashboard-deadline">D-2</b>
            </li>
            <li>
              <span>계약서 특약 확인</span>
              <b className="dashboard-deadline">D-3</b>
            </li>
            <li>
              <span>정책 신청 자격 확인</span>
            </li>
          </ul>
          <button type="button" onClick={() => onOpenTab("checklist")}>
            체크리스트 열기 →
          </button>
        </article>
        <article className="dashboard-bottom-card">
          <h3>최근 활동</h3>
          <ul className="dashboard-activity">
            <li>
              <span>대전 유성구를 조회했어요.</span>
              <small>2시간 전</small>
            </li>
            <li>
              <span>충남 아산시를 관심 지역에 추가했어요.</span>
              <small>어제</small>
            </li>
            <li>
              <span>계약서 분석이 완료됐어요.</span>
              <small>3일 전</small>
            </li>
          </ul>
          <button type="button" onClick={() => onOpenTab("history")}>
            모두 보기 →
          </button>
        </article>
      </section>
    </section>
  );
}

function FavoriteRegions({ onNavigate }) {
  const [regions, setRegions] = useState(loadFavoriteRegions);
  const markets = useMonthlyMarkets();
  const pricedRegions = regions.map((region) => withFavoritePrices(region, markets));
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const [view, setView] = useState("card");
  const [selected, setSelected] = useState([]);
  const [memoTarget, setMemoTarget] = useState(null);
  useEffect(() => {
    loadUserState("moveChecklist")
      .then((value) => {
        if (Array.isArray(value)) setItems(value);
      })
      .catch(() => undefined);
  }, []);
  const [toast, setToast] = useState(null);
  const [notice, setNotice] = useState("");
  const status = "ready";
  const hasOneHalf = pricedRegions.some((region) => region.oneHalf !== "-");
  const hasTwoRoom = pricedRegions.some((region) => region.twoRoom !== "-");
  const visible = [...pricedRegions]
    .filter((region) => region.name.includes(query.trim()))
    .sort((left, right) =>
      sort === "name"
        ? left.name.localeCompare(right.name, "ko")
        : sort === "change"
          ? Math.abs(right.change ?? 0) - Math.abs(left.change ?? 0)
          : 0,
    );
  const toggleSelect = (id) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((item) => item !== id));
      return;
    }
    if (selected.length === 3) {
      setNotice("비교는 최대 3곳까지 선택할 수 있어요.");
      return;
    }
    setNotice("");
    setSelected([...selected, id]);
  };
  const removeFavorite = (region) => {
    toggleFavoriteRegion(region.name);
    setRegions(regions.filter((item) => item.id !== region.id));
    setSelected(selected.filter((id) => id !== region.id));
    setToast({
      text: `${region.name}을 관심 목록에서 해제했어요.`,
      undo: () => {
        toggleFavoriteRegion(region.name);
        setRegions(loadFavoriteRegions());
      },
    });
    window.setTimeout(() => setToast(null), 4200);
  };
  const saveMemo = (memo) => {
    setRegions((items) =>
      items.map((item) =>
        item.id === memoTarget.id ? { ...item, memo } : item,
      ),
    );
    setMemoTarget(null);
  };
  if (status === "loading")
    return (
      <section className="favorite-page">
        <div className="favorite-skeleton" />
        <div className="favorite-skeleton" />
      </section>
    );
  if (status === "error")
    return (
      <section className="favorite-empty">
        관심 지역을 불러오지 못했어요. <button type="button">다시 시도</button>
      </section>
    );
  if (!regions.length)
    return (
      <section className="favorite-empty">
        관심 목록이 비어 있어요 ·{" "}
        <button type="button" onClick={() => onNavigate("property-map-search")}>
          지역 둘러보기
        </button>
      </section>
    );
  return (
    <section className="favorite-page">
      <header className="favorite-head">
        <div>
          <h2>
            관심 목록 <span>{regions.length}</span>
          </h2>
          <p>저장한 지역의 월세 시세(홈 시세 카드와 같은 기준)와 메모를 확인하세요.</p>
        </div>
        <a href="/regions" target="_blank" rel="noreferrer">
          지역 추가 →
        </a>
      </header>
      <div className="favorite-toolbar">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="지역 검색"
          aria-label="관심 지역 검색"
        />
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          aria-label="관심 지역 정렬"
        >
          <option value="recent">최근 추가순</option>
          <option value="name">이름순</option>
          <option value="change">1년 변동률순</option>
        </select>
        <div className="favorite-view-toggle">
          <button
            type="button"
            className={view === "card" ? "active" : ""}
            onClick={() => setView("card")}
          >
            카드
          </button>
          <button
            type="button"
            className={view === "list" ? "active" : ""}
            onClick={() => setView("list")}
          >
            목록
          </button>
        </div>
        <button
          type="button"
          className="favorite-compare"
          disabled={selected.length < 2}
          onClick={() =>
            window.open(
              links.compare(selected),
              "_blank",
              "noopener,noreferrer",
            )
          }
        >
          선택 지역 비교 →
        </button>
      </div>
      {notice && <p className="favorite-notice">{notice}</p>}
      {view === "card" ? (
        <div className="favorite-grid">
          {visible.map((region) => (
            <FavoriteRegionCard
              key={region.id}
              region={region}
              selected={selected.includes(region.id)}
              selectionFull={
                selected.length === 3 && !selected.includes(region.id)
              }
              onSelect={() => toggleSelect(region.id)}
              onRemove={() => removeFavorite(region)}
              onMemo={() => setMemoTarget(region)}
            />
          ))}
        </div>
      ) : (
        <div className="favorite-list-wrap">
          <table className="favorite-list">
            <thead>
              <tr>
                <th>선택</th>
                <th>지역</th>
                <th>원룸</th>
                {hasOneHalf && <th>1.5룸</th>}
                {hasTwoRoom && <th>투룸</th>}
                <th>1년 변동</th>
                <th>메모</th>
                <th>추가일</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visible.map((region) => (
                <tr key={region.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(region.id)}
                      disabled={
                        selected.length === 3 && !selected.includes(region.id)
                      }
                      title={
                        selected.length === 3 && !selected.includes(region.id)
                          ? "최대 3곳까지 선택할 수 있어요."
                          : ""
                      }
                      onChange={() => toggleSelect(region.id)}
                    />
                  </td>
                  <td>
                    <b>{region.name}</b>
                    <span
                      className={`favorite-badge ${region.type === "후보" ? "candidate" : ""}`}
                    >
                      {region.type}
                    </span>
                  </td>
                  <td>{region.studio}</td>
                  {hasOneHalf && <td>{region.oneHalf}</td>}
                  {hasTwoRoom && <td>{region.twoRoom}</td>}
                  <td className={changeClass(region.change, "favorite")}>
                    <ChangeText change={region.change} />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="favorite-memo-button"
                      onClick={() => setMemoTarget(region)}
                    >
                      {region.memo}
                    </button>
                  </td>
                  <td>{region.addedAt}</td>
                  <td>
                    <button
                      type="button"
                      className="favorite-star"
                      onClick={() => removeFavorite(region)}
                    >
                      ★
                    </button>{" "}
                    <a
                      href={links.region(region.marketId ?? region.id)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      상세 →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {memoTarget && (
        <div className="favorite-modal-backdrop">
          <form
            className="favorite-modal"
            onSubmit={(event) => {
              event.preventDefault();
              saveMemo(new FormData(event.currentTarget).get("memo"));
            }}
          >
            <h3>{memoTarget.name} 메모</h3>
            <textarea
              name="memo"
              defaultValue={memoTarget.memo}
              maxLength="80"
            />
            <div>
              <button type="button" onClick={() => setMemoTarget(null)}>
                취소
              </button>
              <button type="submit">저장</button>
            </div>
          </form>
        </div>
      )}
      {toast && (
        <div className="favorite-toast" role="status">
          {toast.text}
          <button
            type="button"
            onClick={() => {
              toast.undo();
              setToast(null);
            }}
          >
            실행 취소
          </button>
        </div>
      )}
    </section>
  );
}

function FavoriteRegionCard({
  region,
  selected,
  selectionFull,
  onSelect,
  onRemove,
  onMemo,
}) {
  return (
    <article className="favorite-region-card">
      <div className="favorite-card-top">
        <input
          type="checkbox"
          checked={selected}
          disabled={selectionFull}
          title={selectionFull ? "최대 3곳까지 선택할 수 있어요." : ""}
          onChange={onSelect}
          aria-label={`${region.name} 비교 선택`}
        />
        <button
          type="button"
          className="favorite-star"
          onClick={onRemove}
          aria-label={`${region.name} 관심 해제`}
        >
          ★
        </button>
      </div>
      <h3>
        {region.name}
        <span
          className={`favorite-badge ${region.type === "후보" ? "candidate" : ""}`}
        >
          {region.type}
        </span>
      </h3>
      <dl>
        <div>
          <dt>원룸</dt>
          <dd>{region.studio}</dd>
        </div>
        {region.oneHalf !== "-" && <div><dt>1.5룸</dt><dd>{region.oneHalf}</dd></div>}
        {region.twoRoom !== "-" && <div><dt>투룸</dt><dd>{region.twoRoom}</dd></div>}
      </dl>
      <div className="favorite-card-meta">
        <b className={changeClass(region.change, "favorite")}>
          1년 <ChangeText change={region.change} />
        </b>
        {region.insufficient && <span>{region.marketLabel ? "표본 부족" : "시세 미제공 지역"}</span>}
      </div>
      <button type="button" className="favorite-memo-button" onClick={onMemo}>
        {region.memo}
      </button>
      <footer>
        <small>추가일 {region.addedAt}</small>
        <a href={links.region(region.marketId ?? region.id)} target="_blank" rel="noreferrer">
          상세 →
        </a>
      </footer>
    </article>
  );
}

const compareHistorySeed = [
  {
    id: "compare-1",
    name: "대전 유성구 vs 충남 아산시",
    regions: [
      { name: "대전 유성구", type: "출발지" },
      { name: "충남 아산시", type: "후보" },
    ],
    ids: ["yuseong", "asan"],
    room: "원룸",
    deal: "월세",
    date: "2026.11.22 14:30",
    summary: "원룸 월세 중위값 차이 ▲7만, 당시 기준",
    label: "당시 기준 · 2026.11",
    values: [
      ["대전 유성구", "45만원", "58만원", "76만원"],
      ["충남 아산시", "38만원", "49만원", "65만원"],
    ],
  },
  {
    id: "compare-2",
    name: "대전 유성구 vs 광주 북구",
    regions: [
      { name: "대전 유성구", type: "출발지" },
      { name: "광주 북구", type: "후보" },
    ],
    ids: ["yuseong", "bukgu"],
    room: "1.5룸",
    deal: "월세",
    date: "2026.11.18 11:10",
    summary: "1.5룸 표본 부족 지역이 있어 확인 필요",
    label: "당시 기준 · 2026.11",
    values: [
      ["대전 유성구", "45만원", "58만원", "76만원"],
      ["광주 북구", "41만원", "-", "69만원"],
    ],
  },
  {
    id: "compare-3",
    name: "충남 아산시 vs 광주 북구",
    regions: [
      { name: "충남 아산시", type: "출발지" },
      { name: "광주 북구", type: "후보" },
    ],
    ids: ["asan", "bukgu"],
    room: "투룸",
    deal: "전세",
    date: "2026.10.31 09:40",
    summary: "투룸 보증금 중위값 차이 ▲1,200만",
    label: "당시 기준 · 2026.10",
    values: [
      ["충남 아산시", "38만원", "49만원", "65만원"],
      ["광주 북구", "41만원", "-", "69만원"],
    ],
  },
];

function LegacyCompareHistory({ onNavigate }) {
  const [items, setItems] = useState(compareHistorySeed);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const [room, setRoom] = useState("전체");
  const [expanded, setExpanded] = useState(null);
  const [renameTarget, setRenameTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const status = "ready";
  const visible = [...items]
    .filter(
      (item) =>
        item.name.includes(query.trim()) ||
        item.regions.some((region) => region.name.includes(query.trim())),
    )
    .filter((item) => room === "전체" || item.room === room)
    .sort((left, right) =>
      sort === "name"
        ? left.name.localeCompare(right.name, "ko")
        : compareHistorySeed.findIndex((item) => item.id === left.id) -
          compareHistorySeed.findIndex((item) => item.id === right.id),
    );
  const remove = () => {
    const removed = deleteTarget;
    setItems(items.filter((item) => item.id !== removed.id));
    setDeleteTarget(null);
    setToast({
      text: "비교 기록을 삭제했어요.",
      undo: () => setItems((current) => [removed, ...current]),
    });
    window.setTimeout(() => setToast(null), 4200);
  };
  if (status === "loading")
    return (
      <section className="compare-history">
        {[1, 2, 3].map((item) => (
          <div className="compare-skeleton" key={item} />
        ))}
      </section>
    );
  if (status === "error")
    return (
      <section className="compare-empty">
        비교 기록을 불러오지 못했어요. <button type="button">다시 시도</button>
      </section>
    );
  if (!items.length)
    return (
      <section className="compare-empty">
        저장한 비교가 없어요 ·{" "}
        <button
          type="button"
          onClick={() => onNavigate("property-recommendations")}
        >
          지역 비교하러 가기
        </button>
      </section>
    );
  return (
    <section className="compare-history">
      <header className="compare-history-head">
        <h2>비교 기록</h2>
        <p>저장한 지역 비교를 다시 열어볼 수 있어요.</p>
      </header>
      <div className="compare-history-toolbar">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="이름·지역 검색"
          aria-label="비교 기록 검색"
        />
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          aria-label="비교 기록 정렬"
        >
          <option value="recent">최근 비교순</option>
          <option value="name">이름순</option>
        </select>
        <div className="compare-room-filter">
          {["전체", "원룸", "1.5룸", "투룸"].map((item) => (
            <button
              type="button"
              className={room === item ? "active" : ""}
              key={item}
              onClick={() => setRoom(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="compare-history-list">
        {visible.map((item) => (
          <article className="compare-history-card" key={item.id}>
            <div className="compare-history-top">
              <div>
                <h3>{item.name}</h3>
                <div className="compare-region-chips">
                  {item.regions.map((region) => (
                    <span
                      className={region.type === "후보" ? "candidate" : ""}
                      key={region.name}
                    >
                      {region.name} · {region.type}
                    </span>
                  ))}
                </div>
              </div>
              <small className="compare-history-date">
                비교 일시 {item.date}
              </small>
            </div>
            <div className="compare-history-details">
              <p>
                <b>
                  {item.room} · {item.deal}
                </b>
                <br />
                {item.summary}
              </p>
              <span className="compare-history-badge">{item.label}</span>
              <a
                className="dashboard-detail"
                href={links.compare(item.ids, item.room, item.deal)}
                target="_blank"
                rel="noreferrer"
              >
                다시 보기 →
              </a>
            </div>
            <div className="compare-history-actions">
              <button type="button" onClick={() => setRenameTarget(item)}>
                이름 변경
              </button>
              <button type="button" onClick={() => setDeleteTarget(item)}>
                삭제
              </button>
            </div>
            <div className="compare-history-expand">
              <button
                type="button"
                onClick={() =>
                  setExpanded(expanded === item.id ? null : item.id)
                }
              >
                {expanded === item.id
                  ? "당시 중위값 접기 −"
                  : "당시 중위값 보기 +"}
              </button>
              {expanded === item.id && (
                <>
                  <table className="compare-mini-table">
                    <thead>
                      <tr>
                        <th>지역</th>
                        <th>원룸</th>
                        <th>1.5룸</th>
                        <th>투룸</th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.values.map((value) => (
                        <tr key={value[0]}>
                          {value.map((cell) => (
                            <td key={cell}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="compare-history-note">
                    * 당시 수집한 값이므로 현재 중위값과 다를 수 있어요.
                  </p>
                </>
              )}
            </div>
          </article>
        ))}
      </div>
      {renameTarget && (
        <div className="compare-modal-backdrop">
          <form
            className="compare-modal"
            onSubmit={(event) => {
              event.preventDefault();
              const name = new FormData(event.currentTarget)
                .get("name")
                ?.toString()
                .trim();
              if (name) {
                setItems(
                  items.map((item) =>
                    item.id === renameTarget.id ? { ...item, name } : item,
                  ),
                );
                setRenameTarget(null);
              }
            }}
          >
            <h3>비교 이름 변경</h3>
            <input name="name" defaultValue={renameTarget.name} />
            <div>
              <button type="button" onClick={() => setRenameTarget(null)}>
                취소
              </button>
              <button type="submit">저장</button>
            </div>
          </form>
        </div>
      )}
      {deleteTarget && (
        <div className="compare-modal-backdrop">
          <section className="compare-modal">
            <h3>비교 기록을 삭제할까요?</h3>
            <p>{deleteTarget.name} 기록만 삭제됩니다.</p>
            <div>
              <button type="button" onClick={() => setDeleteTarget(null)}>
                취소
              </button>
              <button type="button" className="danger" onClick={remove}>
                삭제
              </button>
            </div>
          </section>
        </div>
      )}
      {toast && (
        <div className="compare-toast" role="status">
          {toast.text}
          <button
            type="button"
            onClick={() => {
              toast.undo();
              setToast(null);
            }}
          >
            실행 취소
          </button>
        </div>
      )}
    </section>
  );
}

function getComparisonSummary(properties = []) {
  const costItems = properties.filter((property) => Number.isFinite(property.rent) && Number.isFinite(property.maintenance));
  const areaItems = properties.filter((property) => Number.isFinite(property.area));
  const scoreItems = properties.filter((property) => Number.isFinite(property.score));
  if (costItems.length < 2 && areaItems.length < 2 && scoreItems.length < 2) return null;

  const lowestCost = costItems.length >= 2 ? costItems.reduce((best, property) => property.rent + property.maintenance < best.rent + best.maintenance ? property : best) : null;
  const largestArea = areaItems.length >= 2 ? areaItems.reduce((best, property) => property.area > best.area ? property : best) : null;
  const bestScore = scoreItems.length >= 2 ? scoreItems.reduce((best, property) => property.score > best.score ? property : best) : null;

  if (bestScore) {
    const summary = [`${bestScore.title}은(는) AI 추천 점수 ${bestScore.score}점으로 현재 조건에서 가장 합리적인 선택이에요.`];
    if (lowestCost && lowestCost.title !== bestScore.title) summary.push(`월 고정비를 최소화하려면 ${lowestCost.title}을(를) 대안으로 볼 수 있어요.`);
    if (largestArea && largestArea.title !== bestScore.title) summary.push(`더 넓은 면적이 우선이면 ${largestArea.title}도 함께 확인하세요.`);
    return summary.join(" ");
  }

  if (lowestCost) return `월 고정비 기준으로는 ${lowestCost.title}이(가) 가장 합리적인 선택이에요.${largestArea && largestArea.title !== lowestCost.title ? ` 넓은 면적이 우선이면 ${largestArea.title}도 함께 확인하세요.` : ""}`;
  return `넓은 면적이 중요하면 ${largestArea.title}을(를) 먼저 확인하세요.`;
}

function CompareHistory({ onNavigate }) {
  const [items, setItems] = useState(loadRegionCompareHistory);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const remove = () => {
    setItems(removeRegionComparison(deleteTarget.id));
    setDeleteTarget(null);
  };

  if (!items.length) {
    return <section className="compare-empty">저장한 비교가 없어요 · <button type="button" onClick={() => onNavigate("property-map-search")}>지역 비교하러 가기</button></section>;
  }

  return <section className="compare-history">
    <header className="compare-history-head"><h2>비교 기록</h2><p>지도에서 직접 비교한 매물 기록이에요.</p></header>
    <div className="compare-history-list">
      {items.map((item) => <article className="compare-history-card" key={item.id}>
        <div className="compare-history-top"><div><h3>{item.regions.join(" vs ")}</h3><div className="compare-region-chips">{item.regions.map((region) => <span key={region}>{region}</span>)}</div></div><small className="compare-history-date">비교 시각 {formatViewedAt(item.comparedAt)}</small></div>
        <div className="compare-history-details"><p><b>AI 요약</b><br />{getComparisonSummary(item.properties) ?? "이전 비교 기록에는 요약에 필요한 수치가 없어요. 새로 비교하면 비용·면적·추천 점수 요약을 확인할 수 있어요."}</p></div>
        <div className="compare-history-actions"><button type="button" onClick={() => setDeleteTarget(item)}>삭제</button></div>
      </article>)}
    </div>
    {deleteTarget && <div className="compare-modal-backdrop"><section className="compare-modal"><h3>비교 기록을 삭제할까요?</h3><p>이 기록은 삭제 후 복구할 수 없어요.</p><div><button type="button" onClick={() => setDeleteTarget(null)}>취소</button><button type="button" className="danger" onClick={remove}>삭제</button></div></section></div>}
  </section>;
}

function ConditionCostSnapshot({ conditions, profile }) {
  const rent =
    conditions.dealType === "전세" ? 0 : (conditions.rentBudget ?? 0);
  const maintenance = 7;
  const commute = conditions.maxCommute;
  const transport =
    commute === null ? 8 : commute <= 30 ? 6 : commute <= 50 ? 8 : 11;
  // 월 평균 지출을 입력했으면(식비·교통비·통신비·구독 포함) 그 값을, 아니면 기본 추정치를 쓴다
  const livingInput = conditions.monthlyExpense?.total ?? null;
  const living = livingInput ?? 40 + transport + 26;
  const total = rent + maintenance + living;
  const income = conditions.income?.amount || Number(profile.income) || 250;
  const rate = Math.min(Math.round((total / income) * 100), 100);
  const basis = `${conditions.income ? "입력한 월 소득" : "계정 정보의 월 소득"}과 ${livingInput !== null ? "입력한 월 지출·월세" : "월세·통근 조건"}을 기준으로 계산했어요.`;
  return (
    <section className="condition-cost-snapshot">
      <div>
        <h3>내 조건 기반 간이 생활비</h3>
        <p>{basis}</p>
        <div className="condition-cost-breakdown">
          <span>
            주거비<b>{rent + maintenance}만원</b>
          </span>
          <span>
            {livingInput !== null ? "생활비" : "교통비"}
            <b>{livingInput !== null ? living : transport}만원</b>
          </span>
          <span>
            예상 총지출<b>{total}만원</b>
          </span>
        </div>
      </div>
      <div className="condition-cost-rate" style={{ "--rate": rate }}>
        <b>{rate}%</b>
        <small>지출 비율</small>
      </div>
    </section>
  );
}

function ConditionsDashboard({ conditions, userProfile, onEdit, onNavigate }) {
  if (!conditions) {
    return (
      <section className="my-panel my-conditions-panel">
        <div className="my-condition-head">
          <div>
            <h2>내 이사 조건</h2>
            <p>
              아직 입력한 이사 조건이 없어요. 기본 정보를 입력하면 여기에 보이고
              매물 추천에도 반영돼요.
            </p>
          </div>
          <button
            className="my-primary"
            type="button"
            onClick={() => onNavigate("onboarding")}
          >
            기본 정보 입력하기
          </button>
        </div>
      </section>
    );
  }
  const rows = buildConditionRows(conditions);
  const answered = rows.filter(
    (row) => row.value && row.value !== SKIPPED,
  ).length;
  const preferred = Object.entries(WEIGHT_LABELS)
    .map(([key, label]) => [label, conditions.weights[key]])
    .sort(([, left], [, right]) => right - left)
    .slice(0, 2)
    .map(([label, score]) => `${label} ${score}/5`)
    .join(" · ");
  const area = conditions.targetRegions.length
    ? conditions.targetRegions.map(formatRegionShort).join(", ")
    : formatRegionShort(conditions.region);
  const budget =
    conditions.dealType === "전세"
      ? `전세 보증금 ${formatManwon(conditions.depositBudget) || "-"} 이하`
      : `보증금 ${formatManwon(conditions.depositBudget) || "-"} · 월세 ${formatManwon(conditions.rentBudget) || "-"} 이하`;

  return (
    <section className="my-panel my-conditions-panel">
      <div className="my-condition-head">
        <div>
          <h2>내 이사 조건</h2>
          <p>
            로그인 후 입력한 기본 정보예요. [수정]으로 고치면 매물 추천에도 함께
            반영돼요.
          </p>
        </div>
      </div>
      <dl>
        {rows.map((row) => (
          <div key={row.stepId}>
            <dt className="shrink-0 basis-28 break-keep md:basis-auto">
              {row.label}
            </dt>
            <dd className="flex min-w-0 flex-wrap items-center justify-end gap-x-3 gap-y-1 text-right break-keep">
              <span
                className={
                  !row.value
                    ? "text-danger-600"
                    : row.value === SKIPPED
                      ? "font-medium text-ink-500"
                      : ""
                }
              >
                {row.value || "입력이 필요해요"}
              </span>
              <button
                type="button"
                aria-label={`${row.label} 수정`}
                onClick={() => onEdit(row.stepId)}
                className="cursor-pointer rounded border-0 bg-transparent px-1 py-0.5 text-xs font-bold text-brand-600 hover:underline focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-brand-600"
              >
                수정
              </button>
            </dd>
          </div>
        ))}
      </dl>
      <div className="my-condition-insights">
        <article>
          <span>조건 입력 완성도</span>
          <b>
            {answered} / {rows.length}
          </b>
          <i>
            <em style={{ width: `${(answered / rows.length) * 100}%` }} />
          </i>
          <small>
            {answered === rows.length
              ? "추천에 쓰는 조건을 모두 입력했어요."
              : "건너뛴 항목을 입력하면 추천 정확도가 높아져요."}
          </small>
        </article>
        <article>
          <span>가장 중요한 우선순위</span>
          <b>{preferred}</b>
          <small>매물 정렬 시 이 기준을 우선 반영해요.</small>
        </article>
      </div>
      <ConditionCostSnapshot conditions={conditions} profile={userProfile} />
      <article className="my-condition-recommend">
        <div>
          <span>현재 조건 기준 추천</span>
          <b>
            {area} {conditions.roomTypes.join("·")}
          </b>
          <small>
            {budget}
            {conditions.maxCommute !== null
              ? ` · 출퇴근 ${conditions.maxCommute}분 이내`
              : ""}
          </small>
        </div>
        <button
          type="button"
          onClick={() => onNavigate("property-recommendations")}
        >
          추천 매물 보기
        </button>
      </article>
      <button
        className="my-condition-link"
        type="button"
        onClick={() => onNavigate("property-map-search")}
      >
        상세 매물 조건에서 이어서 설정하기 →
      </button>
    </section>
  );
}

const checklistSeed = [
  {
    id: "registry",
    stage: "계약 전",
    title: "등기부등본 확인하기",
    description: "소유자, 근저당권, 선순위 권리를 확인해요.",
    due: 2,
    link: "계약서 분석 내역",
    region: false,
  },
  {
    id: "draft",
    stage: "계약 전",
    title: "계약서 초안 검토 요청하기",
    description: "특약과 보증금 반환 조건을 미리 점검해요.",
    due: 3,
    link: "계약서 분석 내역",
    region: false,
  },
  {
    id: "date",
    stage: "계약 시",
    title: "확정일자 받기",
    description: "계약 후 주민센터 또는 온라인에서 신청해요.",
    due: 5,
    link: "주거지원 정책",
    region: false,
  },
  {
    id: "movein",
    stage: "입주 전후",
    title: "전입신고",
    description: "새 주소지 관할 주민센터 또는 온라인으로 처리해요.",
    due: 1,
    link: "주거지원 정책",
    region: true,
  },
  {
    id: "support",
    stage: "입주 전후",
    title: "주거지원 신청 서류 준비",
    description: "지역별 공고와 필요 서류를 함께 확인해요.",
    due: 7,
    link: "주거지원 정책",
    region: true,
  },
];

function MoveChecklist({ conditionDraft, onOpenTab }) {
  const [stage, setStage] = useState("계약 전");
  const [items, setItems] = useState(() => {
    try {
      return (
        JSON.parse(window.localStorage.getItem("housingMoveChecklist")) ??
        checklistSeed
      );
    } catch {
      return checklistSeed;
    }
  });
  const [memoTarget, setMemoTarget] = useState(null);
  const visible = items.filter((item) => item.stage === stage);
  const completeCount = items.filter((item) => item.done).length;
  const toggle = (id) =>
    setItems((current) => {
      const next = current.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item,
      );
      window.localStorage.setItem("housingMoveChecklist", JSON.stringify(next));
      saveUserState("moveChecklist", next).catch(() => undefined);
      return next;
    });
  const saveMemo = (memo) => {
    const text = memo.trim();
    if (memoTarget.id === "add") {
      if (!text) return;
      setItems((current) => {
        const next = [
          ...current,
          {
            id: `custom-${Date.now()}`,
            stage,
            title: text,
            description: "직접 추가한 항목",
            due: null,
            link: null,
            region: false,
          },
        ];
        window.localStorage.setItem(
          "housingMoveChecklist",
          JSON.stringify(next),
        );
        saveUserState("moveChecklist", next).catch(() => undefined);
        return next;
      });
      return;
    }
    setItems((current) => {
      const next = current.map((item) =>
        item.id === memoTarget.id ? { ...item, memo: text } : item,
      );
      window.localStorage.setItem("housingMoveChecklist", JSON.stringify(next));
      saveUserState("moveChecklist", next).catch(() => undefined);
      return next;
    });
  };
  const addItem = () =>
    setMemoTarget({ id: "add", title: "새 체크리스트 항목", memo: "" });
  const removeCustomItem = (id) =>
    setItems((current) => {
      const next = current.filter((item) => item.id !== id);
      window.localStorage.setItem("housingMoveChecklist", JSON.stringify(next));
      saveUserState("moveChecklist", next).catch(() => undefined);
      return next;
    });
  return (
    <section className="move-checklist">
      <main className="move-checklist-main">
        <header className="checklist-head">
          <div>
            <h2>이사 체크리스트</h2>
            <p>계약과 입주 준비를 순서대로 확인하세요.</p>
          </div>
          <button type="button" className="checklist-add" onClick={addItem}>
            항목 추가
          </button>
        </header>
        <div className="checklist-progress">
          <div>
            <span>
              {completeCount} / {items.length} 완료
            </span>
            <span>{Math.round((completeCount / items.length) * 100)}%</span>
          </div>
          <i>
            <em style={{ width: `${(completeCount / items.length) * 100}%` }} />
          </i>
        </div>
        <div className="checklist-tabs">
          {["계약 전", "계약 시", "입주 전후"].map((item) => (
            <button
              type="button"
              key={item}
              className={stage === item ? "active" : ""}
              onClick={() => setStage(item)}
            >
              {item}
            </button>
          ))}
        </div>
        {completeCount === items.length ? (
          <div className="checklist-complete">모두 완료했어요</div>
        ) : visible.length ? (
          <div className="checklist-list">
            {visible.map((item) => (
              <article
                className={`checklist-item ${item.done ? "done" : ""}`}
                key={item.id}
              >
                <input
                  type="checkbox"
                  checked={Boolean(item.done)}
                  onChange={() => toggle(item.id)}
                  aria-label={`${item.title} 완료`}
                />
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <div className="checklist-meta">
                    {item.link === "계약서 분석 내역" && (
                      <button
                        type="button"
                        onClick={() => onOpenTab("documents")}
                      >
                        계약서 분석 내역
                      </button>
                    )}
                    {item.link === "주거지원 정책" && (
                      <a href={links.policy} target="_blank" rel="noreferrer">
                        주거지원 정책
                      </a>
                    )}
                    {item.region && (
                      <span className="checklist-region">
                        이사 지역에 따라 달라져요
                      </span>
                    )}
                    {item.memo && <span>{item.memo}</span>}
                  </div>
                </div>
                {item.due && (
                  <span
                    className={`checklist-due ${item.due <= 3 ? "warn" : ""}`}
                  >
                    D-{item.due}
                  </span>
                )}
                <button
                  type="button"
                  className={`checklist-memo ${item.id.startsWith("custom-") ? "delete" : ""}`}
                  onClick={() =>
                    item.id.startsWith("custom-")
                      ? removeCustomItem(item.id)
                      : setMemoTarget(item)
                  }
                  aria-label={
                    item.id.startsWith("custom-")
                      ? `${item.title} 삭제`
                      : `${item.title} 메모`
                  }
                >
                  {item.id.startsWith("custom-") ? "×" : "📝"}
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="checklist-empty">이 단계에 등록된 항목이 없어요.</div>
        )}
      </main>
      <aside className="checklist-aside">
        <section className="checklist-aside-card">
          <h3>지원 정책 신청 준비</h3>
          <ul className="checklist-policy-list">
            <li>
              <b>청년 월세 지원</b>
              <span>서류 확인 전</span>
            </li>
            <li>
              <b>LH·SH 청약</b>
              <span>공고 확인 필요</span>
            </li>
            <li>
              <b>지역 청년 이사 지원</b>
              <span>지역별 상이</span>
            </li>
          </ul>
          <a href={links.policy} target="_blank" rel="noreferrer">
            공식 신청 창구로 이동
          </a>
        </section>
        <section className="checklist-aside-card">
          <h3>지역 변경 안내</h3>
          <p>
            {conditionDraft.currentResidence}에서 {conditionDraft.desiredArea}로
            이사 준비 중이에요. 전입신고와 지역 정책 항목은 이사 지역에 따라
            자동으로 달라질 수 있어요.
          </p>
        </section>
      </aside>
      {memoTarget && (
        <div className="checklist-memo-modal">
          <form
            className="checklist-memo-form"
            onSubmit={(event) => {
              event.preventDefault();
              saveMemo(new FormData(event.currentTarget).get("memo"));
              setMemoTarget(null);
            }}
          >
            <h3>
              {memoTarget.id === "add"
                ? "새 체크리스트 항목"
                : `${memoTarget.title} 메모`}
            </h3>
            <textarea
              name="memo"
              defaultValue={memoTarget.memo ?? ""}
              placeholder={
                memoTarget.id === "add"
                  ? "추가할 할 일을 입력해 주세요."
                  : "메모를 입력해 주세요."
              }
              maxLength="80"
            />
            <div>
              <button type="button" onClick={() => setMemoTarget(null)}>
                취소
              </button>
              <button type="submit">저장</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

const accountGuides = {
  "/privacy": {
    title: "개인정보 처리방침",
    body: "닉네임, 이사 조건, 관심 지역처럼 서비스 제공에 필요한 정보만 목적에 맞게 사용합니다. 계정 정보 탭에서 저장한 정보는 언제든 수정할 수 있어요.",
  },
  "/ai-guide": {
    title: "AI 사용 안내",
    body: "추천과 안내는 입력한 조건 및 공개 데이터를 바탕으로 한 참고 정보입니다. 계약, 정책 신청, 법률 판단은 공인중개사·기관·전문가의 최종 확인이 필요합니다.",
  },
  "/data-sources": {
    title: "데이터 출처·공공누리 표기",
    body: "지역 시세와 정책 안내에는 공공데이터 및 서비스 내 데모 데이터를 함께 사용합니다. 실제 신청과 계약 전에는 각 기관의 최신 공고와 원본 정보를 확인해 주세요.",
  },
};

function AccountGuideModal() {
  const [guide, setGuide] = useState(null);

  useEffect(() => {
    const openGuide = (event) => {
      const link =
        event.target instanceof Element
          ? event.target.closest(".account-links a")
          : null;
      const nextGuide = link && accountGuides[link.getAttribute("href")];
      if (!nextGuide) return;
      event.preventDefault();
      setGuide(nextGuide);
    };
    document.addEventListener("click", openGuide);
    return () => document.removeEventListener("click", openGuide);
  }, []);

  if (!guide) return null;
  return (
    <div className="account-modal-backdrop" role="presentation">
      <section
        className="account-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-guide-title"
      >
        <h3 id="account-guide-title">{guide.title}</h3>
        <p>{guide.body}</p>
        <div className="account-modal-actions">
          <button type="button" onClick={() => setGuide(null)}>
            확인
          </button>
        </div>
      </section>
    </div>
  );
}

function AccountSettings({ profile, setProfile, onNotify }) {
  const [tab, setTab] = useState("basic");
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [deleteEmail, setDeleteEmail] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const passwordError =
    passwords.next && passwords.next !== passwords.confirm
      ? "새 비밀번호가 일치하지 않아요."
      : "";
  const saveProfile = () => {
    window.sessionStorage.setItem(
      "housingUserProfile",
      JSON.stringify(profile),
    );
    saveUserState("profile", profile).catch(() => undefined);
    onNotify("기본 정보를 저장했습니다.");
  };
  const savePassword = async () => {
    if (!passwords.current || passwords.next.length < 8 || passwordError)
      return;
    const result = await changePassword({ currentPassword: passwords.current, newPassword: passwords.next });
    if (!result.ok) {
      onNotify(result.message);
      return;
    }
    setPasswords({ current: "", next: "", confirm: "" });
    onNotify("비밀번호를 변경했습니다.");
  };
  const deleteMyData = async () => {
    const result = await clearMyData(deleteEmail);
    if (!result.ok) {
      onNotify(result.message);
      return;
    }
    setDeleteOpen(false);
    setDeleteEmail("");
    // 화면 곳곳의 캐시까지 비우고 서버의 빈 상태로 다시 불러옵니다.
    clearUserLocalData();
    window.sessionStorage.setItem("housingUserProfile", JSON.stringify({ ...profile }));
    window.location.reload();
  };
  return (
    <section className="account-settings">
      <nav className="account-tabs" aria-label="계정 정보 탭">
        {[
          ["basic", "기본 정보"],
          ["security", "보안"],
          ["privacy", "동의·개인정보"],
        ].map(([key, label]) => (
          <button
            type="button"
            className={tab === key ? "active" : ""}
            key={key}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>
      {tab === "basic" && (
        <section className="account-settings-card">
          <h2>기본 정보</h2>
          <p>서비스에서 사용할 기본 정보를 관리합니다.</p>
          <div className="account-form">
            <label className="account-field">
              닉네임
              <input
                value={profile.name}
                onChange={(event) =>
                  setProfile((value) => ({
                    ...value,
                    name: event.target.value,
                  }))
                }
              />
            </label>
            <label className="account-field">
              이메일 <small>로그인 계정은 변경할 수 없어요.</small>
              <input value={profile.email} readOnly />
            </label>
            <label className="account-field">
              월 소득 (만원)
              <input
                type="number"
                min="0"
                value={profile.income}
                onChange={(event) =>
                  setProfile((value) => ({
                    ...value,
                    income: event.target.value,
                  }))
                }
              />
            </label>
            <button
              className="account-save"
              type="button"
              onClick={saveProfile}
            >
              저장
            </button>
          </div>
        </section>
      )}
      {tab === "security" && (
        <section className="account-settings-card">
          <h2>보안</h2>
          <p>비밀번호는 8자 이상으로 입력해 주세요.</p>
          <div className="account-form">
            <label className="account-field">
              현재 비밀번호
              <input
                type="password"
                value={passwords.current}
                onChange={(event) =>
                  setPasswords((value) => ({
                    ...value,
                    current: event.target.value,
                  }))
                }
              />
            </label>
            <label className="account-field">
              새 비밀번호
              <input
                type="password"
                value={passwords.next}
                onChange={(event) =>
                  setPasswords((value) => ({
                    ...value,
                    next: event.target.value,
                  }))
                }
              />
            </label>
            <label className="account-field">
              새 비밀번호 확인
              <input
                type="password"
                value={passwords.confirm}
                onChange={(event) =>
                  setPasswords((value) => ({
                    ...value,
                    confirm: event.target.value,
                  }))
                }
              />
              {passwordError && (
                <span className="account-password-error">{passwordError}</span>
              )}
            </label>
            <button
              className="account-save"
              type="button"
              disabled={
                !passwords.current ||
                passwords.next.length < 8 ||
                Boolean(passwordError)
              }
              onClick={savePassword}
            >
              비밀번호 변경
            </button>
          </div>
          <h3 style={{ margin: "27px 0 12px", fontSize: 15 }}>
            최근 로그인 기록
          </h3>
          <div className="login-history">
            <div>
              <b>Chrome · Windows</b>
              <small>오늘 14:20 · 현재 세션</small>
            </div>
            <div>
              <b>Safari · iPhone</b>
              <small>어제 09:12</small>
            </div>
            <div>
              <b>Chrome · Windows</b>
              <small>2026.11.18 19:40</small>
            </div>
          </div>
        </section>
      )}
      {tab === "privacy" && (
        <>
          <section className="account-settings-card">
            <h2>동의·개인정보</h2>
            <p>선택 동의는 언제든 변경할 수 있습니다.</p>
            <div className="consent-list">
              <div className="consent-row">
                <div>
                  <b>서비스 이용 필수 동의</b>
                  <small>서비스 제공을 위해 필요한 동의</small>
                </div>
                <input
                  className="consent-switch"
                  type="checkbox"
                  checked
                  readOnly
                />
              </div>
              <div className="consent-row">
                <div>
                  <b>맞춤 정책·매물 알림</b>
                  <small>동의일시 2026.11.23 14:20</small>
                </div>
                <input
                  className="consent-switch"
                  type="checkbox"
                  defaultChecked
                />
              </div>
              <div className="consent-row">
                <div>
                  <b>서비스 개선을 위한 선택 동의</b>
                  <small>동의일시 미동의</small>
                </div>
                <input className="consent-switch" type="checkbox" />
              </div>
            </div>
            <h3 style={{ margin: "22px 0 10px", fontSize: 15 }}>
              데이터 보관 안내
            </h3>
            <table className="retention-table">
              <tbody>
                <tr>
                  <th>미사용 문서</th>
                  <td>업로드 후 90일</td>
                </tr>
                <tr>
                  <th>AI 설명 기록</th>
                  <td>생성 후 180일</td>
                </tr>
                <tr>
                  <th>탈퇴 계정 데이터</th>
                  <td>탈퇴 후 30일 내 완전 삭제</td>
                </tr>
              </tbody>
            </table>
            <div className="account-links">
              <a href="/privacy" target="_blank" rel="noreferrer">
                개인정보 처리방침
              </a>
              <a href="/ai-guide" target="_blank" rel="noreferrer">
                AI 사용 안내
              </a>
              <a href="/data-sources" target="_blank" rel="noreferrer">
                데이터 출처·공공누리 표기
              </a>
            </div>
          </section>
          <section className="account-settings-card account-danger">
            <h2>위험 영역</h2>
            <p>
              내 데이터 전체 삭제는 되돌릴 수 없어요. 계정은 남고 저장된
              데이터와 업로드한 계약서 파일이 삭제됩니다.
            </p>
            <button
              className="account-delete"
              type="button"
              onClick={() => setDeleteOpen(true)}
            >
              내 데이터 전체 삭제
            </button>
          </section>
        </>
      )}
      {deleteOpen && (
        <div className="account-modal-backdrop">
          <section className="account-modal" role="dialog" aria-modal="true">
            <h3>내 데이터를 삭제할까요?</h3>
            <p>
              저장된 조건, 관심 목록, 체크리스트, 비교 기록이 삭제됩니다. 되돌릴
              수 없어요.
            </p>
            <input
              value={deleteEmail}
              onChange={(event) => setDeleteEmail(event.target.value)}
              placeholder={profile.email}
              aria-label="이메일 확인"
            />
            <div className="account-modal-actions">
              <button
                type="button"
                onClick={() => {
                  setDeleteOpen(false);
                  setDeleteEmail("");
                }}
              >
                취소
              </button>
              <button
                className="danger"
                type="button"
                disabled={deleteEmail !== profile.email}
                onClick={deleteMyData}
              >
                삭제
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

function MyPage({
  active,
  onSectionChange,
  onNavigate,
  onCompareRegions,
  onOpenRegionSearch,
  onEditCondition,
  onNotify,
}) {
  const [checked, setChecked] = useState([true, true, false, false]);
  // 이사 조건은 온보딩과 같은 저장소(conditionsStore)를 쓴다. 수정 화면에서 돌아오면 다시 마운트되며 새로 읽는다.
  const [moveConditions] = useState(loadMoveConditions);
  const checklistPlaces = {
    currentResidence:
      formatRegionShort(moveConditions?.region) || "현재 거주지",
    desiredArea: moveConditions?.targetRegions.length
      ? moveConditions.targetRegions.map(formatRegionShort).join(", ")
      : "희망 지역",
  };
  const [userProfile, setUserProfile] = useState(loadUserProfile);
  useEffect(() => {
    loadUserState("profile")
      .then((value) => {
        if (value && typeof value === "object" && !Array.isArray(value)) {
          setUserProfile((current) => ({ ...current, ...value }));
        }
      })
      .catch(() => undefined);
  }, []);
  const current = menus.find(([id]) => id === active) ?? menus[0];
  const go = onSectionChange;
  const panel = () => {
    if (active === "dashboard")
      return (
        <Dashboard
          onNavigate={onNavigate}
          onOpenTab={go}
          onCompareRegions={onCompareRegions}
          onOpenRegionSearch={onOpenRegionSearch}
          userName={userProfile.name}
        />
      );
    if (active === "conditions")
      return (
        <ConditionsDashboard
          conditions={moveConditions}
          userProfile={userProfile}
          onEdit={onEditCondition}
          onNavigate={onNavigate}
        />
      );
    if (active === "favorites")
      return <FavoriteRegions onNavigate={onNavigate} />;
    if (active === "history") return <CompareHistory onNavigate={onNavigate} />;
    if (active === "documents")
      return <ContractsPage embedded onNavigate={onNavigate} />;
    if (active === "checklist")
      return <MoveChecklist conditionDraft={checklistPlaces} onOpenTab={go} />;
    if (active === "checklist")
      return (
        <section className="my-panel">
          <h2>이사 체크리스트</h2>
          <p>완료한 항목을 눌러 진행 상태를 관리하세요.</p>
          {[
            "추천 매물 비교",
            "계약 조건 확인",
            "이사 일정 예약",
            "전입신고 준비",
          ].map((label, index) => (
            <label className="my-check" key={label}>
              <input
                type="checkbox"
                checked={checked[index]}
                onChange={() =>
                  setChecked((items) =>
                    items.map((item, itemIndex) =>
                      itemIndex === index ? !item : item,
                    ),
                  )
                }
              />
              {label}
            </label>
          ))}
        </section>
      );
    if (active === "alerts") return <NotificationsPage embedded />;
    if (active === "account")
      return (
        <>
          <AccountSettings
            profile={userProfile}
            setProfile={setUserProfile}
            onNotify={onNotify}
          />
          <AccountGuideModal />
        </>
      );
    return (
      <>
        <section className="my-hero">
          <span>MY HOUSING DASHBOARD</span>
          <h2>
            나에게 맞는 <b>지금의 집</b>을<br />
            차분하게 준비하세요.
          </h2>
        </section>
        <section className="my-stats">
          {[
            ["♡", "관심 목록", "3곳", "favorites"],
            ["▤", "비교 기록", "2건", "history"],
            ["▧", "계약서 분석", "1건", "documents"],
            ["✓", "체크리스트", "2 / 4", "checklist"],
          ].map(([icon, label, value, id]) => (
            <button key={label} onClick={() => go(id)}>
              <i>{icon}</i>
              <span>{label}</span>
              <b>{value}</b>
            </button>
          ))}
        </section>
        <section className="my-panel">
          <h2>이사 준비 진행 현황</h2>
          <p>현재 준비 단계에 맞춰 다음 행동을 확인하세요.</p>
          <div className="my-progress">
            <span>매물 탐색</span>
            <span>조건 비교</span>
            <span className="active">계약 검토</span>
            <span>이사 준비</span>
          </div>
          <div className="my-next">
            <div>
              <b>다음 단계: 계약서 분석하기</b>
              <span>주요 조항과 확인 사항을 먼저 점검하세요.</span>
            </div>
            <button onClick={() => onNavigate("documents")}>
              계약서 분석하기
            </button>
          </div>
        </section>
      </>
    );
  };
  return (
    <section className="my-page">
      <style>{`.my-page{display:grid;grid-template-columns:220px 1fr;gap:26px;max-width:1540px;margin:-42px auto 0;color:#172b4d}.my-side{padding:28px 14px;border:1px solid #d9e5f8;border-radius:18px;background:#f5fcf9}.my-side h1{margin:0 12px 20px;font-size:22px;color:#1d4ed8}.my-side button{display:flex;gap:11px;align-items:center;width:100%;padding:12px;border:0;border-radius:9px;background:transparent;color:#425877;text-align:left;font-weight:800}.my-side button.active{background:#dbeafe;color:#1d4ed8}.my-side button svg{width:17px;color:#1d4ed8}.my-content h1{margin:0;font-size:32px}.my-content>p{margin:8px 0 22px;color:#596b85;font-size:14px}.my-hero{padding:31px 36px;border-radius:18px;background:linear-gradient(110deg,#eff6ff,#dbeafe)}.my-hero span{color:#1d4ed8;font-size:12px;font-weight:900}.my-hero h2{margin:10px 0 0;font-size:29px;letter-spacing:-.06em}.my-hero b{color:#1d4ed8}.my-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0}.my-stats button,.my-panel{border:1px solid #d9e5f8;border-radius:14px;background:#fff}.my-stats button{padding:16px;text-align:left}.my-stats i{color:#1d4ed8;font-style:normal}.my-stats span,.my-stats b{display:block;margin-top:6px}.my-stats span,.my-panel p{color:#596b85;font-size:12px}.my-stats b{font-size:19px}.my-panel{padding:25px}.my-panel h2{margin:0;font-size:21px}.my-panel p{margin:8px 0 18px}.my-panel dl{margin:0}.my-panel dl div,.my-list,.my-switch{display:flex;justify-content:space-between;gap:15px;align-items:center;padding:14px 0;border-top:1px solid #d9e5f8}.my-panel dl div:first-child,.my-list:first-of-type{border-top:0}.my-panel dt{color:#596b85;font-size:13px}.my-panel dd{margin:0;font-weight:800;font-size:13px}.my-primary,.my-list button,.my-next button{padding:11px 14px;border:0;border-radius:8px;background:#1d4ed8;color:#fff;font-weight:900}.my-list i{color:#1d4ed8;font-style:normal}.my-list div{flex:1}.my-list b,.my-list span,.my-next b,.my-next span{display:block}.my-list span,.my-next span{margin-top:4px;color:#73877f;font-size:12px}.my-check{display:block;padding:13px 0;border-top:1px solid #d9e5f8;font-size:14px;font-weight:800}.my-check input{margin-right:10px;accent-color:#1d4ed8}.my-switch input{accent-color:#1d4ed8}.my-field{display:grid;gap:7px;margin:13px 0;font-size:13px;font-weight:800}.my-field input{padding:11px;border:1px solid #d9e5f8;border-radius:8px}.my-progress{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:25px 0}.my-progress span{padding:10px;border-radius:8px;background:#f1f7f5;color:#6e857d;text-align:center;font-size:12px;font-weight:800}.my-progress .active{background:#dbeafe;color:#1d4ed8}.my-next{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:16px;border-radius:10px;background:#eff6ff}.my-condition-head{display:flex;justify-content:space-between;gap:14px;align-items:start}.my-condition-head .my-primary{flex:none}.my-condition-edit{display:grid;grid-template-columns:1fr 1fr;gap:13px;margin-top:18px}.my-condition-edit label{display:grid;gap:6px;color:#425877;font-size:12px;font-weight:800}.my-condition-edit input,.my-condition-edit select{box-sizing:border-box;width:100%;padding:10px;border:1px solid #d9e5f8;border-radius:8px;color:#172b4d}.my-condition-edit .my-primary{grid-column:1/-1;justify-self:end}.my-condition-link{margin-top:18px;border:0;background:transparent;color:#1d4ed8;font-size:12px;font-weight:900}@media(max-width:760px){.my-page{grid-template-columns:1fr;margin-top:-15px}.my-side{display:flex;overflow:auto;padding:10px}.my-side h1{display:none}.my-side button{min-width:max-content}.my-stats{grid-template-columns:1fr 1fr}.my-progress{grid-template-columns:1fr 1fr}.my-next{display:block}.my-next button{margin-top:14px;width:100%}.my-condition-edit{grid-template-columns:1fr}.my-condition-edit .my-primary{width:100%}}`}</style>
      <aside className="my-side">
        <h1>마이페이지</h1>
        {menus.map(([id, label, Icon]) => (
          <button
            className={active === id ? "active" : ""}
            key={id}
            onClick={() => go(id)}
          >
            <Icon aria-hidden="true" />
            {label}
          </button>
        ))}
      </aside>
      <main className="my-content">
        <h1>{current[1]}</h1>
        <p>내 주거 조건, 비교 기록, 계약 준비를 한곳에서 관리하세요.</p>
        {panel()}
      </main>
    </section>
  );
}

export default MyPage;
