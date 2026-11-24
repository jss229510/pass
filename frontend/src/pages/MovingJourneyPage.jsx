import React, { useEffect, useState } from "react";
import { FaCheckCircle, FaClipboardCheck, FaFileAlt, FaHome, FaIdCard, FaMoneyCheck, FaRegAddressCard } from "react-icons/fa";
import maruImage from "../assets/maru-guide-v2.png";
import { DemoCompare, DemoContract, DemoMoving, DemoMoveIn, demoScenario, demoStageTasks } from "./MovingJourneyDemo";
import "./MovingJourneyPage.css";

const stageNames = ["대시보드", "동네 찾기", "집 비교하기", "계약·보증 확인", "이사 준비하기", "입주 후 마무리"];
const tasks = {
  3: ["계약서·등기사항에서 주소와 임대인 확인", "관리비 항목과 입주일 확인", "보증금 반환보증 문의", "중개사에게 확인할 질문 정리"],
  4: ["이사업체 예약 및 배상 범위 확인", "관리실과 공과금 이전 일정 확인", "잔금과 열쇠 인수 시간 확정"],
  5: ["입주 상태와 계량기 기록", "전입신고와 확정일자 확인", "보증 신청과 발급 상태 확인"],
};
const contractDocuments = [
  ["신분 확인 서류", "신분증 등 본인 확인 자료", FaIdCard],
  ["주민등록등본", "주소와 세대원 확인 자료", FaRegAddressCard],
  ["임대차계약서", "주소·보증금·월세·계약기간 확인", FaFileAlt],
  ["소득 증빙 서류", "소득금액증명이나 원천징수영수증", FaClipboardCheck],
  ["통장 사본", "지원금 수령 계좌 확인용", FaMoneyCheck],
];
const dateFields = [["contract", "계약 예정일"], ["balance", "잔금 예정일"], ["move", "입주 예정일"]];
const policies = {
  lh: {
    title: "LH 공공임대",
    detail: "후보 지역의 공고에서 접수 기간과 입주 예정 시기를 확인하고 민간 임대와 함께 비교하세요.",
    label: "LH청약플러스 공고",
    url: "https://apply.lh.or.kr/lhapply/apply/wt/wrtanc/selectWrtancList.do?mi=1026",
  },
  rent: {
    title: "청년 월세 지원",
    detail: "관할 시·군·구 공고에서 신청 기간과 거주·계약 요건을 확인하세요. 지원금 확정 전에는 비교 비용에 반영하지 않아요.",
    label: "온통청년 정책 찾기",
    url: "https://www.youthcenter.go.kr/",
  },
  moving: {
    title: "청년 이사비 지원",
    detail: "해당 지자체의 공고를 확인하고, 업체 예약 전에 견적서와 영수증을 받을 수 있는지 확인하세요.",
    label: "온통청년 정책 찾기",
    url: "https://www.youthcenter.go.kr/",
  },
};
const returnGuaranteeUrl = "https://www.khug.or.kr/hug/web/ig/dr/igdr000001.jsp";
const movingQuoteUrl = "https://www.miso.kr/moving";
const protectionByStage = {
  3: {
    title: "보증금 반환보증 · 계약 전 확인",
    detail: "보증금이 있는 월세도 주택과 계약 조건에 따라 신청할 수 있어요. 계약 전에 등기사항의 권리관계와 보증 대상 여부를 확인하고, 필요한 서류를 중개사와 보증기관에 물어보세요.",
    label: "HUG 반환보증 조건 확인",
    url: returnGuaranteeUrl,
  },
  4: {
    title: "이사 중 파손·분실에 대비하기",
    detail: "업체에 적재물배상책임보험과 이사화물배상책임보험의 가입 증빙을 요청하세요. 운송과 포장·운반 중 파손이 어디까지 보상되는지, 보상 한도와 제외 품목, 사고 접수 절차도 확인해요.",
    label: "한국소비자원 이사 피해 예방 안내",
    url: "https://www.kca.go.kr/home/sub.do?cate=00000051&menukey=4004&mode=view&no=1004455170",
  },
  5: {
    title: "보증금 반환보증 · 신청·발급 확인",
    detail: "신청 기한과 서류를 확인하고 접수 상태를 기록하세요. 보증서가 발급되면 주소·보증금·보증 기간을 계약서와 대조해요.",
    label: "HUG 신청 절차와 제출서류",
    url: "https://www.khug.or.kr/hug/web/ig/dr/igdr000002.jsp",
  },
};
const listingFields = [
  ["deposit", "보증금 (만원)", true], ["rent", "월세 (만원)", true],
  ["maintenance", "관리비 (만원)"], ["transport", "교통비 (만원)"],
  ["oneTime", "중개·이사비 등 (만원)"], ["area", "전용면적 (㎡)"], ["commute", "편도 통근 (분)"],
];
const dateFormatter = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", timeZone: "UTC" });
const numberFormatter = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 });

function formatCost(value) {
  return value == null ? "미확인" : numberFormatter.format(value) + "만 원";
}

function formatDate(date) {
  return date ? dateFormatter.format(new Date(date)) : "미정";
}

function daysUntil(date) {
  const today = new Date();
  const day = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return (Date.parse(date) - day) / 86400000;
}

function PolicyCard({ kind, region, policy = policies[kind] }) {
  return (
    <article className="journey-policy">
      <h3>{policy.title}</h3>
      <p>{region ? region + " 기준으로 확인해보세요. " : ""}{policy.detail}</p>
      <a href={policy.url} target="_blank" rel="noreferrer">{policy.label}</a>
    </article>
  );
}

function ContractHeading({ home }) {
  return <header className="journey-contract-hero">
    <div>
      <p className="journey-kicker">계약·보증 확인</p>
      <h1>계약서와 신청 서류를<br />계약 전에 <em>점검하세요.</em></h1>
      <p>{home ? "검토할 집 · " + home.title : "매물을 선택하면 해당 계약서와 준비 서류를 확인할 수 있어요."}</p>
    </div>
    <div className="journey-contract-art" aria-hidden="true"><FaHome /><FaClipboardCheck /><FaCheckCircle /></div>
  </header>;
}

function ContractChecklist({ selected, checked, onToggle }) {
  const count = contractDocuments.filter(([name]) => checked.includes(name)).length;
  return <section className="journey-documents">
    <header><h2>계약·청년지원 준비 서류</h2><span className="journey-tag">{count}/{contractDocuments.length}</span></header>
    <p>공고와 계약 조건에 따라 필요한 서류가 달라요.</p>
    {contractDocuments.map(([name, description, Icon]) => (
      <label key={name}>
        <input type="checkbox" checked={checked.includes(name)} disabled={!selected} onChange={() => onToggle(name)} />
        <Icon aria-hidden="true" />
        <span><strong>{name}</strong><small>{description}</small></span>
      </label>
    ))}
    <p className="journey-meta">{selected ? "체크한 항목은 이 집의 이사계획에 반영돼요." : "집을 선택하면 준비 상태를 체크할 수 있어요."}</p>
  </section>;
}

function HomeForm({ onSave, onCancel, homes }) {
  const [error, setError] = useState("");
  function submit(event) {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    const title = fields.title.trim();
    const url = fields.url.trim();
    if (!title || (url && !/^https?:\/\//i.test(url))) {
      setError("매물 이름을 입력하고, 링크는 http 또는 https 주소로 넣어주세요.");
      return;
    }
    if (homes.some(home => url ? home.url === url : !home.url && home.title === title)) {
      setError("이미 비교에 추가한 매물이에요.");
      return;
    }
    const amounts = Object.fromEntries(listingFields.map(([key]) => [
      key, fields[key] === "" ? null : Number(fields[key]),
    ]));
    onSave({
      ...amounts, id: crypto.randomUUID?.() ?? String(Date.now()),
      title, url, available: fields.available, question: fields.question.trim(),
    });
  }
  return (
    <form className="journey-form" onSubmit={submit}>
      <h3>관심 매물 추가</h3>
      <div className="journey-fields">
        <label>매물 이름<input name="title" required maxLength={60} /></label>
        <label>매물 링크<input name="url" type="url" placeholder="https://" maxLength={1000} /></label>
        {listingFields.map(([key, label, required]) => (
          <label key={key}>{label}
            <input name={key} type="number" min="0" max="100000" step={key === "commute" ? "1" : "0.1"} required={required} placeholder={required ? undefined : "미확인"} />
          </label>
        ))}
        <label>입주 가능일<input name="available" type="date" /></label>
        <label>중개사에게 물어볼 질문<input name="question" maxLength={140} /></label>
      </div>
      {error && <p role="alert">{error}</p>}
      <div className="journey-actions">
        <button className="journey-primary" type="submit">매물 저장</button>
        <button type="button" onClick={onCancel}>취소</button>
      </div>
    </form>
  );
}

function HomeCard({ home, selected, onSelect, onRemove }) {
  const monthlyParts = [home.rent, home.maintenance, home.transport];
  const monthlyTotal = monthlyParts.reduce((sum, part) => sum + (part ?? 0), 0);
  const incomplete = monthlyParts.some(part => part == null);
  return (
    <article className="journey-home" data-selected={selected}>
      <h3>{home.title}</h3>
      <p><strong>월 지출 {formatCost(monthlyTotal)}{incomplete && " 이상 · 일부 미확인"}</strong></p>
      <dl>
        <div><dt>보증금</dt><dd>{formatCost(home.deposit)}</dd></div>
        <div><dt>중개·이사비 등</dt><dd>{formatCost(home.oneTime)}</dd></div>
        <div><dt>월세</dt><dd>{formatCost(home.rent)}</dd></div>
        <div><dt>관리비</dt><dd>{formatCost(home.maintenance)}</dd></div>
        <div><dt>교통비</dt><dd>{formatCost(home.transport)}</dd></div>
        <div><dt>편도 통근</dt><dd>{home.commute == null ? "미확인" : home.commute + "분"}</dd></div>
        <div><dt>전용면적</dt><dd>{home.area == null ? "미확인" : home.area + "㎡"}</dd></div>
        <div><dt>입주 가능일</dt><dd>{formatDate(home.available)}</dd></div>
      </dl>
      {home.question && <p>확인 질문 · {home.question}</p>}
      <div className="journey-actions">
        {home.url && <a href={home.url} target="_blank" rel="noreferrer">매물 원문</a>}
        <button className="journey-primary" type="button" onClick={onSelect}>{selected ? "계약 검토 이어가기" : "이 집으로 계약 검토"}</button>
        <button type="button" onClick={onRemove} aria-label={home.title + " 비교에서 빼기"}>비교에서 빼기</button>
      </div>
    </article>
  );
}

export default function MovingJourneyPage({
  view, onViewChange, onBack, plan, onUpdate, onMaru, onSupport, onDocuments,
  demo, onOpenDemo, onExitDemo,
}) {
  const stageTasks = demo ? demoStageTasks : tasks;
  const [adding, setAdding] = useState(false);
  const area = plan.area;
  const region = area ? area.city + " " + area.name : "";
  const group = area ? plan.regions[region] : null;
  const homes = group?.homes ?? [];
  const selected = homes.find(home => home.id === group?.selectedId);
  const checked = (selected && group?.progress?.[selected.id]) || [];
  const dates = plan.dates;
  const complete = [Boolean(area), Boolean(selected), ...[3, 4, 5].map(stage => (
    Boolean(selected) && stageTasks[stage].every(task => checked.includes(task))
  ))];
  const firstOpen = complete.indexOf(false) + 1;
  const nextTask = firstOpen < 3 ? ["이사 준비 완료", "마루의 맞춤 추천 받기", "계약을 검토할 집 고르기"][firstOpen]
    : stageTasks[firstOpen].find(task => !checked.includes(task));
  const movingQuoteLink = view === 4 && (
    <div className="journey-actions">
      <a href={movingQuoteUrl} target="_blank" rel="noopener noreferrer">미소에서 이사 견적 비교하기 ↗</a>
    </div>
  );
  const openItems = [
    selected?.question && !checked.includes(demo ? demoStageTasks[3][1] : tasks[3][3]) ? [selected.question, 3] : null,
    homes.some(home => home.maintenance == null) ? ["관심 매물 관리비 미확인", 2] : null,
    selected && !checked.includes(demo ? demoStageTasks[4][3] : tasks[4][2]) ? ["잔금·열쇠 인수 시간 미확정", 4] : null,
  ].filter(Boolean).slice(0, 2);

  useEffect(() => {
    setAdding(false);
  }, [view]);

  function goTo(next) {
    onViewChange(next);
  }
  function updateGroup(change) {
    onUpdate(current => {
      const existing = current.regions[region] ?? { homes: [], progress: {} };
      return { ...current, regions: { ...current.regions, [region]: change(existing) } };
    });
  }
  function selectHome(home) {
    updateGroup(current => ({ ...current, selectedId: home.id }));
    goTo(3);
  }
  function removeHome(home) {
    updateGroup(current => {
      const { [home.id]: removed, ...progress } = current.progress;
      return {
        ...current, progress, homes: current.homes.filter(item => item.id !== home.id),
        selectedId: current.selectedId === home.id ? null : current.selectedId,
      };
    });
  }
  function toggleTask(task) {
    updateGroup(current => {
      const saved = current.progress[selected.id] ?? [];
      const next = saved.includes(task) ? saved.filter(item => item !== task) : [...saved, task];
      return { ...current, progress: { ...current.progress, [selected.id]: next } };
    });
  }

  if (view === -1) {
    return (
      <section className="journey journey-intro" aria-labelledby="journey-welcome">
        <img src={maruImage} alt="지도를 들고 인사하는 마루" />
        <div className="journey-welcome-card">
          <strong>마루</strong>
          <h1 id="journey-welcome">안녕하세요, 마루예요!</h1>
          <p>새 직장 근처에서 살 동네를 찾고 계신가요? 이음에서 마루와 함께 통근과 예산에 맞는 동네를 찾아봐요.</p>
          <p>관심 있는 집을 비교하고, 계약과 보증 확인부터 이사 예약과 입주 후 할 일까지 한 곳에서 챙길 수 있어요. 지역의 청년 월세·이사비 지원과 LH 공공임대 공고도 필요한 때에 살펴봐요.</p>
          <div className="journey-actions">
            <button className="journey-primary" type="button" onClick={() => goTo(0)}>자, 그럼 시작해볼까요?</button>
            <button type="button" onClick={onOpenDemo}>발표 예시 열기</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="journey journey-shell" aria-label="이사 여정">
      <nav className="journey-sidebar" aria-label="이사 단계">
        <h2>이사 여정</h2>
        <p>{complete.filter(Boolean).length} / 5단계 완료</p>
        {stageNames.map((name, index) => (
          <button key={name} type="button" aria-current={view === index ? "page" : undefined} onClick={() => goTo(index)}>
            <span>{index === 0 ? "⌂" : complete[index - 1] ? "✓" : index}</span>
            {name}
            {index > 0 && <small>{complete[index - 1] ? "완료" : index === firstOpen ? "진행 중" : "예정"}</small>}
          </button>
        ))}
      </nav>
      <div className="journey-main">
        {demo && <aside className="journey-demo-banner">
          <div><strong>발표 예시 · 서울에서 {demoScenario.destination}으로</strong><p>가상 1인 가구의 매물·계약·이사 과정을 체험해요. 실제 정책은 공식 공고를 참고했어요.</p></div>
          <button type="button" onClick={onExitDemo}>예시 나가기</button>
        </aside>}
        {view === 0 ? <>
          <header className="journey-hero">
            <div>
              <strong>{firstOpen ? "현재 단계 · " + stageNames[firstOpen] : "이사 준비 완료"}</strong>
              <h1>{region ? (demo ? demoScenario.destination : region) + " 이사계획" : "나의 이사계획"}</h1>
              {firstOpen > 0 && <><p>다음 할 일 · {nextTask}</p><button className="journey-primary" type="button" onClick={() => goTo(firstOpen)}>다음 할 일 보기</button></>}
            </div>
            <img src={maruImage} alt="" />
          </header>
          {!demo && <div className="journey-actions"><button type="button" onClick={onOpenDemo}>발표 예시 열기</button></div>}
          <div className="journey-cards">
            <section className="journey-card">
              <h2>내가 고른 동네·집</h2>
              <p>{region || "아직 선택한 동네가 없어요."}</p>
              {area?.conditions && <p>{area.conditions}</p>}
              {area && <p>{selected?.title ?? "비교 중인 집 " + homes.length + "곳"}</p>}
              <button type="button" onClick={() => goTo(area ? 2 : 1)}>{area ? "관심 매물 보기" : "동네 찾기"}</button>
            </section>
            <section className="journey-card">
              <h2>주요 일정</h2>
              <div className="journey-fields">
                {dateFields.map(([key, label]) => {
                  const remainingDays = dates[key] ? daysUntil(dates[key]) : null;
                  return (
                    <label key={key}>
                      <span className="journey-date-heading">
                        <span>{label}</span>
                        {remainingDays !== null && remainingDays >= 0 && (
                          <strong className="journey-deadline">{remainingDays === 0 ? "D-day" : "D-" + remainingDays}</strong>
                        )}
                      </span>
                      <input type="date" value={dates[key] ?? ""} onChange={event => {
                        const value = event.target.value;
                        onUpdate(current => ({ ...current, dates: { ...current.dates, [key]: value } }));
                      }} />
                    </label>
                  );
                })}
              </div>
            </section>
            <section className="journey-card">
              <h2>아직 확인할 것</h2>
              {openItems.length ? openItems.map(([name, index]) => (
                <button className="journey-open-item" key={name} type="button" onClick={() => goTo(index)}>{name}</button>
              )) : <p>확인이 필요한 항목이 생기면 여기서 확인할 수 있어요.</p>}
            </section>
            <section className="journey-card">
              <h2>지역 주거지원</h2>
              <p>청년 월세·이사비 지원과 공공임대 공고를 살펴보세요.</p>
              <button type="button" onClick={onSupport}>주거지원 정책 모아 보기</button>
            </section>
          </div>
        </> : <section className="journey-card journey-stage" data-stage={view}>
          {view === 3 ? <ContractHeading home={selected} /> : <h1>{stageNames[view]}</h1>}
          {view === 1 && <>
            <h2>마루의 맞춤 추천</h2>
            <p>근무지와 통근 조건, 예산을 알려주면 살펴볼 동네를 추천해요. 최종 순위에서 동네를 고르고 저장해보세요.</p>
            {region && <p>저장한 동네 · {region}</p>}
            <button className="journey-primary" type="button" onClick={onMaru}>마루와 동네 찾기</button>
            <PolicyCard kind="lh" region={area?.city} />
          </>}
          {view === 2 && <>
            {area ? <>
              <p>{demo ? demoScenario.destination : region} · 월세와 관리비, 교통비를 비교해요.</p>
              {!homes.length && <p>부동산 앱이나 직접 방문해서 찾은 집을 추가해보세요.</p>}
              {demo ? <DemoCompare homes={homes} selected={selected} onSelect={selectHome} /> :
                <div className="journey-homes">
                  {homes.map(home => <HomeCard key={home.id} home={home} selected={selected?.id === home.id} onSelect={() => selectHome(home)} onRemove={() => removeHome(home)} />)}
                </div>}
              {adding ? <HomeForm homes={homes} onCancel={() => setAdding(false)} onSave={home => {
                updateGroup(current => current.homes.length < 3 ? { ...current, homes: [...current.homes, home] } : current);
                setAdding(false);
              }} /> : homes.length < 3 && <button className="journey-primary" type="button" onClick={() => setAdding(true)}>관심 매물 추가</button>}
            </> : <><p>동네를 먼저 고르면 그 지역의 관심 매물을 모아 비교할 수 있어요.</p><button type="button" onClick={() => goTo(1)}>동네 찾기로 이동</button></>}
            {!demo && <PolicyCard kind="rent" region={area?.city} />}
          </>}
          {view >= 3 && <>
            {view === 3 && <div className="journey-contract-grid">
              {demo ? <DemoContract key={selected?.id ?? "empty"} home={selected} /> :
                <section className="journey-contract-upload">
                  <span className="journey-upload-icon" aria-hidden="true">↑</span>
                  <h2>계약서와 서류 검토</h2>
                  <button className="journey-primary" type="button" onClick={onDocuments}>서류 검토 열기</button>
                </section>}
              <ContractChecklist selected={selected} checked={checked} onToggle={toggleTask} />
            </div>}
            {selected ? <>
              {view !== 3 && <p className="journey-meta">선택한 집 · {selected.title}</p>}
              {view === 3 && selected.question && <details className="journey-compact"><summary>집 비교에서 적은 질문</summary><p>{selected.question}</p></details>}
              {demo && view === 4 && <DemoMoving moving={plan.moving} quoteLink={movingQuoteLink} onChange={changes =>
                onUpdate(current => ({ ...current, moving: { ...current.moving, ...changes } }))
              } />}
              {demo && view === 5 && <DemoMoveIn moveDate={dates.move} />}
              <section className="journey-tasks">
                <header><h2>{view === 3 ? "계약 전 확인할 일" : view === 4 ? "이사 준비 체크리스트" : "입주 후 체크리스트"}</h2>
                  <span className="journey-tag">{stageTasks[view].filter(task => checked.includes(task)).length}/{stageTasks[view].length}</span>
                </header>
                <div className="journey-checklist">
                  {stageTasks[view].map(task => <label key={task}><input type="checkbox" checked={checked.includes(task)} onChange={() => toggleTask(task)} />{task}</label>)}
                </div>
              </section>
            </> : <><p>집을 선택하면 해당 집의 할 일과 확인 상태를 기록할 수 있어요.</p><button type="button" onClick={() => goTo(area ? 2 : 1)}>{area ? "집 비교로 이동" : "동네 찾기로 이동"}</button></>}
            {(!demo || !selected) && movingQuoteLink}
            <PolicyCard policy={protectionByStage[view]} />
            {!demo && view >= 4 && <PolicyCard kind="moving" region={area?.city} />}
            {!demo && view === 5 && <PolicyCard kind="rent" region={area?.city} />}
          </>}
          <footer className="journey-actions">
            <button type="button" onClick={onBack}>이전 화면</button>
            {view < 5 && <button type="button" onClick={() => goTo(view + 1)}>다음 단계 보기</button>}
          </footer>
        </section>}
      </div>
    </section>
  );
}
