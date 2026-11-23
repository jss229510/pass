import React, { useEffect, useMemo, useRef, useState } from "react";
import maruImage from "../assets/maru-guide-v2.png";
import {
  addAnswer, agencies, answerLabel, areaText, cities, envNames, getQuestion,
  getRecommendations, isSkipped, marketSample, money, names,
  noPreference, priceText, pyeong, step, totalSteps,
} from "../data/maruRecommendation";
import "./AiRecommendationPage.css";

const leafletUrl = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet";
let leafletPromise;

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;

  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = leafletUrl + ".css";
  css.crossOrigin = "anonymous";
  css.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
  const script = document.createElement("script");
  script.src = leafletUrl + ".js";
  script.crossOrigin = "anonymous";
  script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";

  leafletPromise = new Promise((resolve, reject) => {
    script.onload = () => resolve(window.L);
    script.onerror = () => {
      script.remove();
      css.remove();
      leafletPromise = undefined;
      reject(new Error("지도 모듈을 불러올 수 없어요."));
    };
    document.head.append(css, script);
  });
  return leafletPromise;
}

function mapLabel(text, className) {
  const label = document.createElement("span");
  label.textContent = text;
  label.className = className;
  return label;
}

function positionPriceCards(map, markers) {
  const size = map.getSize();
  const placed = [];
  for (const marker of markers) {
    const card = marker.getElement()?.querySelector(".maru-pin");
    if (!card) continue;
    const { x, y } = map.latLngToContainerPoint(marker.getLatLng());
    if (x < 0 || x > size.x || y < 0 || y > size.y) {
      card.style.translate = "";
      continue;
    }
    const width = card.offsetWidth;
    const height = card.offsetHeight;
    const left = x - width / 2;
    const top = y - height;
    const limitX = value => Math.max(4, Math.min(value, size.x - width - 4));
    const limitY = value => Math.max(52, Math.min(value, size.y - height - 22));
    const xs = [left, ...placed.flatMap(box => [box.x - width - 6, box.right + 6])];
    const ys = [top, ...placed.flatMap(box => [box.y - height - 6, box.bottom + 6])];
    const positions = xs.flatMap(px => ys.map(py => ({ x: limitX(px), y: limitY(py) })));
    const position = positions
      .filter(p => placed.every(box => p.x + width + 3 <= box.x || p.x >= box.right + 3
        || p.y + height + 3 <= box.y || p.y >= box.bottom + 3))
      .sort((a, b) => Math.hypot(a.x - left, a.y - top) - Math.hypot(b.x - left, b.y - top))[0]
      ?? positions[0];
    placed.push({ ...position, right: position.x + width, bottom: position.y + height });
    card.style.translate = (position.x - left) + "px " + (position.y - top) + "px";
  }
}

function MaruMap({ answers, rows, selected, focusNeighborhood, onSelect, onAnswer, showConditions }) {
  const mapElement = useRef(null);
  const resources = useRef(null);
  const actions = useRef({ onSelect, onAnswer });
  const previousView = useRef(null);
  const refit = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [city, range, mode, , type, building] = answers;
  const done = answers.length === totalSteps;

  useEffect(() => {
    actions.current = { onSelect, onAnswer };
  }, [onSelect, onAnswer]);

  useEffect(() => {
    let active = true;
    let resizeObserver;
    let frame;
    loadLeaflet().then(L => {
      if (!active) return;
      const map = L.map(mapElement.current, { zoomControl: false, minZoom: 4, maxZoom: 19, zoomSnap: 0.1 });
      map.setView([36.4, 127.8], 6);
      L.control.zoom({ position: "topright" }).addTo(map);
      const layers = L.layerGroup().addTo(map);
      const current = { L, map, layers, markers: [] };
      resources.current = current;
      previousView.current = null;
      map.on("moveend", () => positionPriceCards(map, current.markers));
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).on("tileerror", () => setError("일부 지도 타일을 불러오지 못했어요."))
        .on("tileload", () => setError("")).addTo(map);

      resizeObserver = new ResizeObserver(() => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          map.invalidateSize({ pan: false });
          refit.current?.(false);
        });
      });
      resizeObserver.observe(mapElement.current);
      setReady(true);
    }).catch(() => {
      if (active) setError("지도를 불러오지 못했어요. 아래 후보 목록에서 결과를 확인할 수 있어요.");
    });

    return () => {
      active = false;
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      resources.current?.map.remove();
      resources.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ready || !resources.current) return;
    const { L, map, layers } = resources.current;
    const animate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const addPin = (at, content, title, click, active = false) => {
      const icon = L.divIcon({ html: content, className: "maru-map-anchor", iconSize: [1, 1], iconAnchor: [0, 0] });
      const marker = L.marker(at, { icon, title, keyboard: Boolean(click), interactive: Boolean(click), zIndexOffset: active ? 500 : 0 }).addTo(layers);
      if (click) marker.on("click", click);
      return marker;
    };
    layers.clearLayers();
    const markers = [];
    resources.current.markers = markers;
    let circle;
    if (!city) {
      for (const option of cities) {
        addPin(option.work, mapLabel(option.name, "maru-marker"), option.name, () => actions.current.onAnswer(option.name));
      }
    } else {
      addPin(city.work, mapLabel("예시 근무지", "maru-marker work"), "예시 근무지");
      if (range?.unit === "km") {
        circle = L.circle(city.work, {
          radius: range.value * 1000, color: "#216949", fillOpacity: done ? 0.025 : 0.14,
          weight: done ? 1 : 2, dashArray: "6 5", interactive: false,
        }).addTo(layers);
      }
      for (const row of range ? rows : []) {
        if (!mode) {
          addPin(row.at, mapLabel(row.name, "maru-marker"), row.name);
          continue;
        }
        const active = row.name === selected;
        const failed = row.failures.length > 0;
        const pin = document.createElement("div");
        pin.className = "maru-pin" + (active ? " chosen" : "") + (failed ? " excluded" : "");
        const metrics = document.createElement("div");
        metrics.className = "maru-map-metrics";
        if (type) metrics.append(mapLabel(pyeong(row.area), "maru-pin-size"));
        metrics.append(mapLabel(type ? priceText(type, row.price) : "편도 " + row.commute + "분", "maru-pin-price"));
        const status = failed ? "조건 미충족" : row.rank ? row.rank + "위" : "통근 " + row.commuteRank + "위";
        pin.append(mapLabel(row.name, "maru-pin-name"), metrics, mapLabel(type ? status + " · " + row.building : status, "maru-pin-status"));
        markers.push(addPin(row.at, pin, row.name, done ? () => actions.current.onSelect(row.name) : null, active));
      }
    }

    const fitView = animated => {
      map.stop();
      if (!city) {
        map.fitBounds([[33.08, 125.94], [38.62, 131.95]], { padding: [12, 20], animate: false });
        return;
      }
      if (!range) {
        map.setView(city.work, 11.5, { animate: animated });
        return;
      }
      const focused = focusNeighborhood && rows.find(row => row.name === selected);
      if (focused) {
        map.setView(focused.at, 16, { animate: animated });
        return;
      }
      const finalView = done && rows.length > 0;
      const bounds = L.latLngBounds([city.work, ...rows.map(row => row.at)]);
      if (circle && !finalView) bounds.extend(circle.getBounds());
      const size = map.getSize();
      const side = finalView ? Math.min(72, Math.round(size.x * 0.12)) : 15;
      const top = finalView ? Math.min(86, Math.round(size.y * 0.24)) : 45;
      const viewBounds = bounds.pad(finalView ? 0.035 : 0.16);
      const maxZoom = finalView
        ? Math.max(map.getMinZoom(), Math.min(16, map.getBoundsZoom(viewBounds, false, [side * 2, top + 25])) - map.options.zoomDelta)
        : 13.5;
      map.flyToBounds(viewBounds, { maxZoom, paddingTopLeft: [side, top], paddingBottomRight: [side, 25], animate: animated, duration: 0.65 });
    };
    refit.current = fitView;
    const viewKey = JSON.stringify([city?.name, range, mode, done, Boolean(selected), focusNeighborhood ? selected : null, showConditions]);
    if (previousView.current !== viewKey) {
      previousView.current = viewKey;
      map.invalidateSize({ pan: false });
      fitView(animate);
    }
    const frame = requestAnimationFrame(() => positionPriceCards(map, markers));
    return () => cancelAnimationFrame(frame);
  }, [answers, city, done, focusNeighborhood, mode, range, ready, rows, selected, showConditions, type]);

  const filters = [city?.name ?? "대한민국", range && answerLabel(step.range, range), mode, type,
    building !== noPreference && building,
    range && "후보 " + rows.length + "곳"].filter(Boolean);

  return <div className="maru-map-wrap">
    <div ref={mapElement} className="maru-map" aria-label="동네 탐색 지도" />
    <div className="maru-map-filters">{filters.map((filter, index) => <span key={index}>{filter}</span>)}</div>
    {error && <p className="maru-map-error" role="status">{error}</p>}
  </div>;
}

function CandidateList({ rows, mode, type, done, selected, onSelect, onEditRange, inConversation = false }) {
  const matched = rows.filter(row => row.failures.length === 0);
  const excluded = rows.filter(row => row.failures.length > 0);
  const list = (items, ineligible = false) => <ul className="maru-candidates" style={inConversation ? { gridTemplateColumns: "minmax(0, 1fr)" } : undefined}>
    {items.map(row => {
      const fields = <>
        <strong>{row.rank ? row.rank + "위 " : ""}{row.name}</strong>
        <span>편도 {row.commute}분 · 통근 {row.commuteRank}위</span>
        {type && <span>{row.building} · {pyeong(row.area)} · {priceText(type, row.price)}</span>}
        {ineligible && <span className="maru-reason">{row.failures.join(" · ")}</span>}
        {done && <span style={{
          justifySelf: "start", marginTop: 4, padding: "4px 7px",
          borderRadius: 5, background: "var(--maru-green)", color: "#fff", fontWeight: 700,
        }}>상세 보기 <span aria-hidden="true" style={{ color: "inherit" }}>→</span></span>}
      </>;
      return <li key={row.name}>
        {done
          ? <button type="button" className={ineligible ? "excluded" : ""} aria-pressed={selected === row.name} onClick={() => onSelect(row.name)}>{fields}</button>
          : <div className={ineligible ? "excluded" : ""}>{fields}</div>}
      </li>;
    })}
  </ul>;

  return <section className="maru-results" aria-label="동네 후보 목록"
    style={inConversation ? { maxHeight: "none", overflow: "visible", padding: "10px 0 0" } : undefined}>
    <h2>{done ? "최종 동네 순위" : type ? "주거 조건 비교" : "통근 후보"}</h2>
    {done && rows.length > 0 && <p style={{
      margin: "7px 0", padding: "9px 10px", borderRadius: 8,
      border: "1px solid #a7c5b1", background: "var(--maru-soft)", color: "var(--maru-ink)",
    }}>
      <strong style={{ display: "block", color: "var(--maru-green)" }}>동네 상세 보기</strong>
      동네 버튼을 누르면 시세와 통근, 주변 부동산을 자세히 볼 수 있어요.
    </p>}
    {!rows.length ? <><p>통근 조건에 맞는 시연 후보가 없어요.</p><button type="button" onClick={onEditRange}>통근 범위 수정</button></> : <>
      <p>{done || excluded.length
        ? "통근 후보 " + rows.length + "곳 중 " + matched.length + "곳 충족"
        : mode + " · 편도 시간순 · " + rows.length + "곳"} · 시연 데이터</p>
      {matched.length > 0 && list(matched)}
      {excluded.length > 0 && <><h3>조건 미충족 {excluded.length}곳</h3>{list(excluded, true)}</>}
    </>}
  </section>;
}

const searchMap = query => "https://map.kakao.com/link/search/" + encodeURIComponent(query);

function Agencies({ city, name }) {
  const offices = agencies[city]?.[name] ?? [];
  return <>
    <h3>{name} 주변 공인중개사</h3>
    <ul className="maru-offices">{offices.map(([office, address, phone, page]) => <li key={office}>
      <strong>{office}</strong><p>{address}</p>
      <div className="maru-actions">
        <a className="cta-button" href={"tel:" + phone}>{phone}</a>
        <a href={searchMap(address.split(",")[0])} target="_blank" rel="noreferrer">위치 보기 ↗</a>
        <a href={"https://irts.molit.go.kr/usr/cmn/main/home/RtecsLreaSearch.do?pageIndex=" + page} target="_blank" rel="noreferrer">등록 출처 ↗</a>
      </div>
    </li>)}</ul>
    <p>{offices.length ? "국토교통부 전자계약시스템 등록 정보입니다. 방문 전 영업 여부를 확인하세요." : "이 동네는 화면에 등록된 연락처가 없어요."}</p>
    <a href={searchMap(city + " " + name + " 공인중개사")} target="_blank" rel="noreferrer">카카오맵에서 주변 공인중개사 검색 ↗</a>
  </>;
}

function Facts({ items }) {
  return <dl className="maru-facts">{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}

function Market({ row, answers }) {
  const [area, setArea] = useState(row.area);
  const type = answers[step.lease];
  const sample = marketSample(row, area, type);
  const variation = row.name.codePointAt(0) % 3;
  const prices = [0.89 + variation * 0.015, 0.95, 0.93 + variation * 0.015, 1.01, 0.97, 1]
    .map(factor => Math.round(sample.price * factor));
  const max = Math.max(...prices);
  const facts = [["내 " + type + " 예산", money(answers[step.budget])],
    ["예산 비교", sample.price > answers[step.budget] ? "한도 초과" : "한도 이내"]];
  if (type === "월세") facts.push(["보증금 예시", money(row.rentDeposit)], ["내 보증금 한도", money(answers[step.deposit])]);
  facts.push(["선호 방 구조", answers[step.room]], ["관리비·입주 가능일", "매물에서 확인"]);

  return <>
    <div className="maru-market">
      <small>시연 데이터 · {areaText(area)}</small>
      <h3>{priceText(type, sample.price)}</h3>
      <p>시연 6개월 가격 추이</p>
      <div className="maru-chart" role="img" aria-label={prices.map((price, index) => (index === 5 ? "기준" : (5 - index) + "개월 전") + " " + money(price)).join(", ")}>
        {prices.map((price, index) => <div key={index} title={money(price)}>
          <div><span style={{ height: price / max * 100 + "%" }} /></div><small>{index === 5 ? "기준" : "-" + (5 - index) + "개월"}</small>
        </div>)}
      </div>
    </div>
    <h3>전용면적별 가격 예시</h3>
    <div className="maru-sizes">{row.areas.map(size => <button key={size} type="button" aria-pressed={area === size} onClick={() => setArea(size)}>
      <span>{areaText(size)}</span><strong>{priceText(type, marketSample(row, size, type).price)}</strong>
    </button>)}</div>
    <Facts items={facts} />
  </>;
}

function Detail({ row, rows, answers, onSelect, focus, onZoom }) {
  const [tab, setTab] = useState("시세·면적");
  const facts = [["종합 점수", row.score + "점"], [answers[step.mode] + " 편도 예시", row.commute + "분 · 직선 " + row.km.toFixed(1) + "km"],
    ["환경 선호 반영", Math.round(row.environmentScore) + "점"]];

  return <section className="maru-detail" aria-label="동네 상세">
    <div className="maru-detail-head"><div><h2>{row.name}</h2><p>{answers[step.city].name} · {row.building} · {answers[step.lease]}</p></div>
      <div className="maru-actions"><button type="button" onClick={onZoom}>{focus ? "후보 전체 보기" : "이 동네 확대"}</button><button type="button" onClick={() => onSelect(null)}>닫기</button></div>
    </div>
    <div className="maru-actions maru-detail-ranks">{rows.map(candidate => <button type="button" key={candidate.name} aria-pressed={candidate === row}
      onClick={() => onSelect(candidate.name)}>{candidate.rank ? candidate.rank + "위 " : ""}{candidate.name}</button>)}</div>
    <nav className="maru-tabs" aria-label="동네 상세 메뉴">{["시세·면적", "통근·생활", "주변 부동산"].map(name => <button type="button" key={name}
      aria-pressed={tab === name} onClick={() => setTab(name)}>{name}</button>)}</nav>
    {row.failures.length > 0 && <p className="maru-reason">{row.failures.join(" · ")}</p>}
    {tab === "시세·면적" && <Market row={row} answers={answers} />}
    {tab === "통근·생활" && <>
      <Facts items={facts} />
      <div className="maru-meters">{row.environment.map((value, index) => <label key={envNames[index]}>{envNames[index]}<meter min={0} max={100} value={value} /><span>{value}</span></label>)}</div>
      <p>환경 60% · 통근 25% · 예산 15% · 시연 데이터</p>
      <a href="https://apply.lh.or.kr/" target="_blank" rel="noreferrer">LH청약플러스에서 공고 보기 ↗</a>
    </>}
    {tab === "주변 부동산" ? <Agencies city={answers[step.city].name} name={row.name} />
      : <button type="button" className="maru-primary maru-agency-action cta-button" onClick={() => setTab("주변 부동산")}>주변 부동산 찾기 →</button>}
  </section>;
}

function RecommendationReason({ winner, runnerUp, answers, demo }) {
  if (!winner) {
    return <div className="maru-question" aria-live="polite">
      <small>마루의 분석</small>
      <h2>조건을 조금 바꿔볼까요?</h2>
      <p>모든 조건을 충족한 동네가 없어요. 후보 목록에서 조건을 확인해 주세요.</p>
    </div>;
  }

  const type = answers[step.lease];
  const remainingBudget = answers[step.budget] - winner.price;
  const environment = answerLabel(step.environment, answers[step.environment]);
  const result = demo
    ? "입력한 통근·예산·생활환경 조건으로 계산했을 때 이 동네가 1위예요. 이곳으로 이사하는 사례를 이어서 볼게요."
    : !runnerUp
      ? "통근과 예산 조건을 충족한 후보가 이곳 한 곳이에요."
    : winner.score === runnerUp.score
      ? runnerUp.name + "과 종합 점수가 같아 기존 통근 순위에서 앞선 이곳을 1위로 골랐어요."
      : runnerUp.name + "보다 종합 점수가 " + (winner.score - runnerUp.score) + "점 높아요.";
  const commute = "편도 " + winner.commute + "분" + (answers[step.range].unit === "km" ? " · 직선 " + winner.km.toFixed(1) + "km" : "");
  const budget = priceText(type, winner.price) + (remainingBudget > 0 ? " · 한도보다 " + money(remainingBudget) + " 낮음" : " · 한도 이내");

  return <div className="maru-question" aria-live="polite">
    <small>마루의 분석 · 종합 {winner.score}점</small>
    <h2>{winner.name}이 1위인 이유</h2>
    <p>{result}</p>
    <Facts items={[
      ["통근", commute],
      ["시연 가격", budget],
      ["환경 선호 · " + environment, Math.round(winner.environmentScore) + "점"],
    ]} />
  </div>;
}

const emptyAnswers = [];

export default function AiRecommendationPage({ flow, onFlowChange, onBack, onSaveNeighborhood, startInConversation = false, demoScenario }) {
  const {
    started = startInConversation, savedAnswers = emptyAnswers, reviewIndex = null,
    selected = null, showConditions = false, focus = false,
  } = flow ?? {};
  const conversationRef = useRef(null);
  const answers = useMemo(() => reviewIndex === null ? savedAnswers : savedAnswers.slice(0, reviewIndex), [reviewIndex, savedAnswers]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const question = getQuestion(answers);
  const rows = useMemo(() => getRecommendations(answers), [answers]);
  const guidedChoice = demoScenario?.answers[answers.length];
  const [city, , mode, , type] = answers;
  const done = answers.length === totalSteps;
  const selectedRow = rows.find(row => row.name === selected);
  const winner = rows.find(row => row.rank === 1);
  const runnerUp = rows.find(row => row.rank === 2);
  const canSave = selectedRow && (!demoScenario || selectedRow.name === demoScenario.neighborhood);
  const previousIndex = answers.findLastIndex(answer => answer !== null);
  useEffect(() => {
    if (conversationRef.current) conversationRef.current.scrollTop = 0;
    setInput("");
    setError("");
  }, [savedAnswers, reviewIndex, started]);

  function submit(value) {
    const next = addAnswer(answers, value);
    if (!next) {
      setError("지금 질문에 맞게 예시처럼 한 번 더 알려주세요.");
      return;
    }
    // Retain the answer slot expected by the shared recommendation module.
    if (guidedChoice) {
      const index = answers.length;
      const expected = addAnswer(answers, guidedChoice);
      if (!expected || answerLabel(index, next[index]) !== answerLabel(index, expected[index])) {
        setError(`이 발표 예시는 ‘${guidedChoice}’로 이어져요. 해당 답을 선택하거나 입력해 주세요.`);
        return;
      }
    }
    if (next.length === step.arrival) next.push(null);
    onFlowChange({ savedAnswers: next, reviewIndex: null, selected: null, focus: false });
  }

  function edit(index) {
    onFlowChange({ reviewIndex: index, selected: null, showConditions: false, focus: false });
  }

  function nextReviewedStep() {
    const nextIndex = savedAnswers.findIndex((answer, index) => index > reviewIndex && answer !== null);
    onFlowChange({ reviewIndex: nextIndex === -1 ? null : nextIndex });
  }

  function restart() {
    onFlowChange({ started: Boolean(demoScenario), savedAnswers: [], reviewIndex: null, selected: null, showConditions: false, focus: false });
  }

  function select(name) {
    if (name === selected && Boolean(name) === focus) return;
    onFlowChange({ selected: name, focus: Boolean(name) }, !done || name === selected);
  }

  return <section className="maru-flow" aria-label="맞춤 분석">
    <div className="maru-toolbar"><strong>{demoScenario ? "발표 예시 · 마루 맞춤 분석" : "맞춤 분석"}</strong><div className="maru-actions">
      {done && <button type="button" aria-expanded={showConditions} onClick={() => onFlowChange({ showConditions: !showConditions }, true)}>{showConditions ? "조건 접기" : "조건 보기"}</button>}
      {started && previousIndex >= 0 && <button type="button" onClick={() => edit(previousIndex)}>← 이전 단계</button>}
      {started && <button type="button" onClick={restart}>다시 시작</button>}
      <button type="button" onClick={onBack}>{onSaveNeighborhood ? "이사 여정으로 돌아가기" : "매물 추천"}</button>
    </div></div>
    {!started ? <div className="maru-welcome">
      <img src={maruImage} alt="지도를 들고 인사하는 마루" />
      <div><small>마루</small><h1>안녕하세요, 마루예요!</h1>
        <p>새 직장 근처에서 살 만한 동네를 함께 찾아봐요.</p>
        <p>출근 조건과 집 예산을 알려주면 통근 시간, 월세·전세 시세, 생활환경을 지도에서 비교할 수 있어요.</p>
        <button type="button" className="maru-primary cta-button" onClick={() => onFlowChange({ started: true })}>자, 그럼 시작해볼까요? →</button>
      </div>
    </div> : <div className="maru-layout">
      <aside ref={conversationRef} className="maru-conversation" aria-label="마루와 대화">
        <div className="maru-profile"><img src={maruImage} alt="마루" /><div><strong>마루</strong><p>이사할 동네를 같이 찾아요</p></div></div>
        {demoScenario && <div className="maru-lh"><strong>서울에서 부산으로 이사하는 발표 예시</strong></div>}
        {city && !done && <div className="maru-lh"><strong>{city.name} LH 공공임대</strong><p>접수 상태 미확인</p><a href="https://apply.lh.or.kr/" target="_blank" rel="noreferrer">공고 확인 ↗</a></div>}
        {(!done || showConditions) && <>
          <nav className="maru-steps" aria-label="추천 조건">{names.map((name, index) => index === step.arrival || isSkipped(index, answers) ? null : <button type="button" key={name}
            aria-current={index === answers.length ? "step" : undefined} disabled={index >= answers.length} onClick={() => edit(index)}>{name}</button>)}</nav>
          <div className="maru-history">{answers.map((answer, index) => answer === null ? null : <span key={index}>{names[index]} · {answerLabel(index, answer)}</span>)}</div>
        </>}
        {done ? <>
          <RecommendationReason winner={winner} runnerUp={runnerUp} answers={answers} demo={Boolean(demoScenario)} />
          <CandidateList rows={rows} mode={mode} type={type} done selected={selected} onSelect={select} onEditRange={() => edit(step.range)} inConversation />
          {onSaveNeighborhood && canSave && (
            <button type="button" className="maru-primary" onClick={() => onSaveNeighborhood({
              city: city.name,
              name: selectedRow.name,
              conditions: [answerLabel(step.range, answers[step.range]), mode, type].join(" · "),
            })}>
              {selectedRow.name}을 이사계획에 저장
            </button>
          )}
          {demoScenario && selectedRow && !canSave && <p className="maru-reason">이 동네의 상세 정보도 볼 수 있어요. 집 비교와 계약서 시연은 우동에서 이어져요.</p>}
        </> : question && <>
          <div className="maru-question" key={answers.length} aria-live="polite">
            <small>마루</small><h2>{question.title}</h2><p>{question.description}</p>
            {reviewIndex !== null && <p><strong>이전에 입력한 답변</strong> · {answerLabel(reviewIndex, savedAnswers[reviewIndex])}</p>}
          </div>
          <div className="maru-actions maru-choices">
            {question.choices.map(choice => (
              <button type="button" key={choice} onClick={() => submit(choice)}>{choice}</button>
            ))}
          </div>
          <form className="maru-input" onSubmit={event => { event.preventDefault(); submit(input); }}>
            <input value={input} onChange={event => setInput(event.target.value)} placeholder={question.placeholder} aria-label="마루에게 답하기" maxLength={140} />
            <button className="maru-primary cta-button" type="submit">{reviewIndex === null ? "답하기" : "답변 수정"}</button>
          </form>
          {reviewIndex !== null && <div className="maru-actions maru-choices"><button type="button" onClick={nextReviewedStep}>기존 답변으로 다음 →</button></div>}
          {error && <p className="maru-reason" role="status">{error}</p>}
        </>}
      </aside>
      <div className="maru-stage">
        <MaruMap answers={answers} rows={rows} selected={selected} focusNeighborhood={focus} onAnswer={submit} onSelect={select} showConditions={showConditions} />
        {done && selectedRow ? <Detail key={selectedRow.name} row={selectedRow} rows={rows} answers={answers} onSelect={select} focus={focus} onZoom={() => onFlowChange({ focus: !focus }, true)} />
          : !done && mode && <CandidateList rows={rows} mode={mode} type={type} done={false} selected={selected} onSelect={select} onEditRange={() => edit(step.range)} />}
      </div>
    </div>}
  </section>;
}

