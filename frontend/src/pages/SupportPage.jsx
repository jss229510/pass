import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiSearch, FiBookOpen, FiMapPin, FiFileText, FiExternalLink, FiBookmark, FiX, FiRefreshCw, FiSliders, FiChevronLeft, FiChevronRight, FiInfo, FiHome, FiTruck, FiCreditCard, FiGrid, FiCheck } from "react-icons/fi";
import { policyExamples, policyPortals, policyRegions } from "../data/policyLibrary";
import { filterPolicies, safeExternalUrl } from "../data/policyLibraryUtils";
import "./SupportPage.css";

const categories = ["전체", "월세·주거비", "전세·금융", "공공임대", "이사·중개비", "기타 주거지원"];
const categoryIcons = [FiGrid, FiHome, FiCreditCard, FiHome, FiTruck, FiFileText];
const pageSize = 8;
const emptyFilters = { keyword: "", region: "전체 지역", source: "전체 기관", status: "전체 상태" };

function readSaved() {
  try {
    const value = JSON.parse(localStorage.getItem("housingSavedPolicies") || "[]");
    return Array.isArray(value) ? value.filter((id) => typeof id === "string") : [];
  } catch { return []; }
}

function PolicyDetail({ policy, saved, onSave, onClose }) {
  const dialogRef = useRef(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    const previous = document.activeElement;
    dialog.showModal();
    return () => { dialog.close(); previous?.focus(); };
  }, []);
  const sections = [
    ["정책 소개", policy.description], ["지원 내용", policy.benefit],
    ["지원 대상", policy.eligibility], ["신청 기간", policy.period],
    ["신청 방법", policy.applicationMethod], ["제출 서류", policy.documents],
  ];
  const url = safeExternalUrl(policy.originalUrl);
  return <dialog ref={dialogRef} className="pl-detail" aria-labelledby="policy-detail-title" onCancel={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="pl-detail-head"><span><FiBookOpen /> 정책 상세 자료</span><button type="button" className="pl-icon-button" aria-label="정책 상세 닫기" onClick={onClose}><FiX /></button></div>
    <div className="pl-detail-body">
      {policy.example && <p className="pl-example-note">화면 구성을 위한 예시입니다. 실제 모집 중인 공고가 아닙니다.</p>}
      <div className="pl-tags"><span>{policy.category}</span><span className="pl-region-tag"><FiMapPin />{policy.region}</span></div>
      <h2 id="policy-detail-title">{policy.title}</h2><p className="pl-detail-org">{policy.organization} · {policy.source === "youth" ? "온통청년" : "LH청약플러스"}</p>
      <dl className="pl-detail-sections">{sections.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "세부 내용은 공식 공고 원문에서 확인해 주세요."}</dd></div>)}</dl>
      <p className="pl-detail-notice"><FiInfo /> 신청 자격과 일정은 해당 기관의 최신 공고를 확인해 주세요.</p>
    </div>
    <div className="pl-detail-actions"><button type="button" onClick={() => onSave(policy.id)}><FiBookmark fill={saved ? "currentColor" : "none"} />{saved ? "저장됨" : "자료 저장"}</button>{url && <a className="pl-primary" href={url} target="_blank" rel="noopener noreferrer">{policy.example ? "공식 기관 방문" : "공고 원문 보기"}<FiExternalLink /></a>}</div>
  </dialog>;
}

export default function SupportPage() {
  const [library, setLibrary] = useState({ items: [], sources: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [preview, setPreview] = useState(false);
  const [draft, setDraft] = useState(emptyFilters);
  const [filters, setFilters] = useState(emptyFilters);
  const [category, setCategory] = useState("전체");
  const [sort, setSort] = useState("updated");
  const [savedOnly, setSavedOnly] = useState(false);
  const [saved, setSaved] = useState(readSaved);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [storageMessage, setStorageMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 100000);
    let active = true;
    setLoading(true);
    setError("");
    fetch("/api/housing-policies/library", { signal: controller.signal, headers: { Accept: "application/json" } })
      .then(async (response) => {
        if (!response.ok) throw new Error("server");
        const data = await response.json();
        if (!Array.isArray(data.items) || !Array.isArray(data.sources)) throw new Error("format");
        if (active) setLibrary(data);
      })
      .catch(() => { if (active) setError("정책 자료를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."); })
      .finally(() => { window.clearTimeout(timeout); if (active) setLoading(false); });
    return () => { active = false; window.clearTimeout(timeout); controller.abort(); };
  }, [reload]);

  const items = preview ? policyExamples : library.items;
  const results = useMemo(() => filterPolicies(items, { ...filters, category, sort, savedOnly, saved }), [items, filters, category, sort, savedOnly, saved]);
  const pages = Math.max(1, Math.ceil(results.length / pageSize));
  const currentPage = Math.min(page, pages);
  const visible = results.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const connected = library.sources.filter((source) => source.status === "CONNECTED" || source.status === "PARTIAL");
  const latestFetch = connected.map((source) => source.fetchedAt).filter(Boolean).sort().at(-1);
  const activeFilter = category !== "전체" || savedOnly || Object.keys(filters).some((key) => filters[key] !== emptyFilters[key]);

  function toggleSave(id) {
    const next = saved.includes(id) ? saved.filter((value) => value !== id) : [...saved, id];
    setSaved(next);
    try { localStorage.setItem("housingSavedPolicies", JSON.stringify(next)); setStorageMessage(""); }
    catch { setStorageMessage("이 브라우저에서는 자료 저장이 현재 화면에서만 유지됩니다."); }
  }
  function reset() { setDraft(emptyFilters); setFilters(emptyFilters); setCategory("전체"); setSavedOnly(false); setPage(1); }
  function changeCategory(value) { setCategory(value); setPage(1); }
  function changePreview() { setPreview((value) => !value); reset(); }

  return <section className="policy-library" aria-labelledby="policy-library-title">
    <div className="pl-breadcrumb">주거지원 정책 <span>/</span> <b>정책 자료실</b></div>
    <header className="pl-hero">
      <div><p className="pl-eyebrow"><span /> HOUSING POLICY LIBRARY</p><h1 id="policy-library-title">새로운 시작에 필요한<br /><em>주거지원 정책, 한곳에서.</em></h1><p className="pl-intro">이사할 지역의 월세 지원부터 공공임대, 이사비까지.<br />공식 기관의 정책 자료를 찾아보고 차근차근 준비하세요.</p><div className="pl-hero-sources"><span><FiCheck /> 공식 기관 자료</span><span><FiMapPin /> 지역별 정책 탐색</span><span><FiBookmark /> 관심 자료 저장</span></div></div>
      <div className="pl-hero-art" aria-hidden="true"><div className="pl-art-orbit" /><div className="pl-art-paper back" /><div className="pl-art-paper front"><div className="pl-art-mark"><FiHome /></div><i /><i /><i /><div className="pl-art-check"><FiCheck /></div></div><span className="pl-art-label"><FiBookOpen /> 나의 주거지원 자료실</span></div>
    </header>

    <form className="pl-search-panel" onSubmit={(event) => { event.preventDefault(); setFilters({ ...draft, keyword: draft.keyword.trim() }); setPage(1); }}>
      <div className="pl-search-top"><label className="pl-search-input"><FiSearch /><span className="pl-sr-only">정책명 또는 키워드</span><input value={draft.keyword} onChange={(event) => setDraft({ ...draft, keyword: event.target.value })} placeholder="어떤 지원이 필요하세요? 정책명이나 키워드를 검색해 보세요" /></label><button className="pl-primary" type="submit"><FiSearch /> 정책 검색</button></div>
      <div className="pl-search-filters"><span className="pl-filter-label"><FiSliders /> 상세 조건</span>
        <label><span>이사할 지역</span><select value={draft.region} onChange={(event) => setDraft({ ...draft, region: event.target.value })}>{["전체 지역", ...policyRegions].map((region) => <option key={region}>{region}</option>)}</select></label>
        <label><span>자료 제공기관</span><select value={draft.source} onChange={(event) => setDraft({ ...draft, source: event.target.value })}><option>전체 기관</option><option value="youth">온통청년</option><option value="lh">LH청약플러스</option></select></label>
        <label><span>신청 상태</span><select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>{["전체 상태", "접수중", "상시", "접수예정", "마감", "공고 확인"].map((status) => <option key={status}>{status}</option>)}</select></label>
        <button className="pl-reset" type="button" onClick={reset}><FiRefreshCw /> 초기화</button>
      </div>
    </form>

    <div className="pl-workspace">
      <aside className="pl-sidebar"><h2>지원 유형</h2><nav aria-label="지원 유형">{categories.map((value, index) => { const Icon = categoryIcons[index]; return <button key={value} className={category === value ? "is-active" : ""} type="button" aria-pressed={category === value} onClick={() => changeCategory(value)}><Icon /><span>{value === "전체" ? "전체 자료" : value}</span><small>{value === "전체" ? items.length : items.filter((item) => item.category === value).length}</small></button>; })}</nav>
        <div className="pl-data-sources"><h3>자료 제공처</h3>{["youth", "lh"].map((id) => { const source = library.sources.find((item) => item.id === id); const ready = ["CONNECTED", "PARTIAL"].includes(source?.status); return <div key={id}><span>{id === "youth" ? "온통청년" : "LH청약플러스"}</span><small className={ready ? "is-connected" : ""}>{loading ? "확인 중" : ready ? source.status === "PARTIAL" ? "일부 수신" : "연결됨" : source?.status === "ERROR" ? "연결 오류" : "연결 준비"}</small></div>; })}<p>{latestFetch ? `${new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(latestFetch))} 수신` : "공식 API 자료를 모아 제공합니다."}</p></div>
      </aside>

      <div className="pl-results">
        <div className="pl-results-heading"><div><h2>주거지원 정책 자료</h2><p>{preview ? "화면 예시" : "불러온 자료"} <b>{results.length}</b>건{activeFilter && " · 선택한 조건 기준"}</p></div><button type="button" className={`pl-save-filter ${savedOnly ? "is-active" : ""}`} aria-pressed={savedOnly} onClick={() => { setSavedOnly((value) => !value); setPage(1); }}><FiBookmark /> 저장한 자료</button></div>
        {preview && <div className="pl-example-note"><FiInfo /><span><b>화면 미리보기</b> · 아래는 자료실 구성을 보여주는 예시입니다. 실제 신청 가능한 공고가 아닙니다.</span><button type="button" onClick={changePreview}>예시 닫기</button></div>}
        {!preview && !loading && (error || connected.length < 2 || library.sources.some((source) => source.truncated)) && <div className="pl-connection-note"><FiInfo /><div><b>{error ? "자료 연결을 확인해 주세요" : connected.length === 0 ? "공식 정책 자료를 연결할 준비를 하고 있어요" : "일부 기관의 자료를 표시하고 있어요"}</b><p>{error || (connected.length === 0 ? "연결이 완료되면 이곳에서 지역별 정책과 모집공고를 확인할 수 있어요." : "기관별 연결 상태와 수집 범위에 따라 자료가 일부만 표시될 수 있어요.")}</p></div><button type="button" onClick={() => setReload((value) => value + 1)} aria-label="정책 자료 다시 불러오기"><FiRefreshCw /> 다시 확인</button></div>}
        <div className="pl-results-toolbar"><span>{filters.keyword ? <>검색어 <b>“{filters.keyword}”</b></> : "나에게 필요한 지원을 찾아보세요"}</span><label><span className="pl-sr-only">자료 정렬</span><select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}><option value="updated">최근 수정순</option><option value="title">가나다순</option></select></label></div>
        <div className="pl-table" aria-busy={loading && !preview}>
          <div className="pl-table-head"><span>정책명 / 지원 내용</span><span>대상 지역</span><span>신청 상태</span><span>저장</span></div>
          {loading && !preview ? <div className="pl-empty" role="status"><FiRefreshCw className="pl-spinning" /><h3>공식 정책 자료를 불러오고 있어요</h3><p>기관의 응답에 따라 잠시 시간이 걸릴 수 있어요.</p></div> : visible.length === 0 ? <div className="pl-empty"><FiBookOpen /><h3>{items.length === 0 && !activeFilter ? "주거지원 정보를 담을 자료실입니다" : savedOnly ? "저장한 자료가 없어요" : "조건에 맞는 자료가 없어요"}</h3><p>{items.length === 0 && !activeFilter ? "아래 공식 자료실을 이용하거나, 화면 예시를 먼저 둘러보세요." : savedOnly ? "정책 옆의 책갈피를 눌러 관심 자료를 모아보세요." : "검색어를 바꾸거나 지역·지원 유형을 넓혀 보세요."}</p><button type="button" onClick={items.length === 0 && !activeFilter ? changePreview : reset}>{items.length === 0 && !activeFilter ? "자료실 화면 예시 보기" : "전체 자료 보기"}</button></div> : visible.map((policy) => <article className="pl-row" key={policy.id}>
            <div className="pl-row-main"><div className="pl-row-meta"><span className="pl-type-tag">{policy.category}</span><span>{policy.organization || (policy.source === "youth" ? "온통청년" : "LH청약플러스")}</span>{policy.example && <span className="pl-example-tag">예시</span>}</div><button className="pl-title-button" type="button" onClick={() => setSelected(policy)}>{policy.title}</button><p>{policy.benefit || policy.description || "지원 내용은 공고 원문에서 확인해 주세요."}</p><span className="pl-row-date"><FiFileText /> {policy.period || "신청 기간은 원문 확인"}</span></div>
            <div className="pl-row-region"><FiMapPin /><span>{policy.region || "지역 확인"}</span></div><div className="pl-row-status"><span className={`pl-status ${["접수중", "상시"].includes(policy.status) ? "open" : policy.status === "마감" ? "closed" : ""}`}>{policy.status || "공고 확인"}</span><button type="button" onClick={() => setSelected(policy)}>상세 보기</button></div><button type="button" className={`pl-bookmark ${saved.includes(policy.id) ? "is-saved" : ""}`} aria-label={`${policy.title} ${saved.includes(policy.id) ? "저장 해제" : "저장"}`} aria-pressed={saved.includes(policy.id)} onClick={() => toggleSave(policy.id)}><FiBookmark fill={saved.includes(policy.id) ? "currentColor" : "none"} /></button>
          </article>)}
        </div>
        {results.length > pageSize && <nav className="pl-pagination" aria-label="자료 목록 페이지"><button type="button" aria-label="이전 페이지" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><FiChevronLeft /></button>{Array.from({ length: pages }, (_, index) => index + 1).filter((value) => value === 1 || value === pages || Math.abs(value - currentPage) <= 1).map((value, index, values) => <React.Fragment key={value}>{index > 0 && value - values[index - 1] > 1 && <span>…</span>}<button type="button" className={value === currentPage ? "is-active" : ""} aria-current={value === currentPage ? "page" : undefined} onClick={() => setPage(value)}>{value}</button></React.Fragment>)}<button type="button" aria-label="다음 페이지" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}><FiChevronRight /></button></nav>}
        {storageMessage && <p className="pl-storage-message" role="status">{storageMessage}</p>}
        <p className="pl-result-footnote"><FiInfo /> 지역 필터에는 전국 공통 정책이 함께 표시됩니다. 신청 기간이 확인된 자료에만 접수 상태를 표시해요.</p>
      </div>
    </div>

    <section className="pl-portals" aria-labelledby="pl-portals-title"><div className="pl-portals-heading"><div><p className="pl-eyebrow">OFFICIAL RESOURCES</p><h2 id="pl-portals-title">공식 자료실 바로가기</h2></div><p>더 자세한 정보는 정책을 운영하는 기관에서 확인하세요.</p></div><div className="pl-portal-grid">{policyPortals.map((portal) => <a href={portal.url} key={portal.name} target="_blank" rel="noopener noreferrer"><span className={`pl-portal-mark ${portal.id}`}>{portal.mark}</span><div><h3>{portal.name}</h3><p>{portal.description}</p></div><FiExternalLink /></a>)}</div></section>
    <footer className="pl-footer"><FiInfo /><p>이 자료실은 정책 탐색을 돕기 위한 정보입니다. 실제 지원 대상·금액·접수 일정은 공식 기관의 최신 공고문을 기준으로 확인해 주세요.</p></footer>
    {selected && <PolicyDetail policy={selected} saved={saved.includes(selected.id)} onSave={toggleSave} onClose={() => setSelected(null)} />}
  </section>;
}
