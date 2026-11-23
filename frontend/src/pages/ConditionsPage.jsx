import React, { useEffect, useRef, useState } from "react";
import { properties } from "../data/housingData";

const preferenceItems = [
  ["교통", "대중교통·통근 편의", 3],
  ["안전", "치안·야간 귀가 환경", 2],
  ["생활편의", "마트·병원·문화시설", 3],
  ["주거비", "예산 안에서의 여유", 4],
];

const draftStorageKey = "housingRecommendationDraft";
const defaultPreferences = Object.fromEntries(preferenceItems.map(([name, , value]) => [name, value]));
const defaultDraft = { income: "250", deposit: "1000", roomType: "원룸", desiredArea: "대전 유성구", workLocation: "대전 유성구", commute: 45, selectedProperty: "yuseong-gungdong-studio", preferences: defaultPreferences };
const checklistItems = [["매물 정보", "주소·가격·관리비와 포함 옵션 확인"], ["권리관계", "등기부등본의 소유자·근저당·선순위 권리 확인"], ["계약 조건", "특약·보증금 반환 조건·입주일 확인"], ["실제 통근", "직장·학교까지 이동 경로와 시간 확인"]];

function buildDemoRecommendations(area, budget, deposit, roomType, preferences) {
  const location = area.trim();
  const rentLimit = Number(budget);
  const depositLimit = Number(deposit);
  if (!location || !Number.isFinite(rentLimit) || rentLimit <= 0 || !Number.isFinite(depositLimit) || depositLimit < 0) return [];
  const base = properties.find((property) => property.location.includes(location) && property.roomType === roomType && Number(property.rent.replace(/\D/g, "")) <= rentLimit && Number(property.deposit.replace(/\D/g, "")) <= depositLimit);
  const candidates = base ? [{ ...base, isWithinBudget: true }] : [];
  const roomAreas = { 원룸: [20, 23, 26], "1.5룸": [27, 30, 33], "2룸": [34, 38, 42] };
  const templates = [
    { title: "채광 좋은", tags: ["채광", "생활 편의"], strength: "생활편의", rent: 43, deposit: 500, maintenance: 6 },
    { title: "교통 편리한", tags: ["교통 편리", "수납 공간"], strength: "교통", rent: 52, deposit: 800, maintenance: 7 },
    { title: "조용한 주거지", tags: ["조용한 환경", "분리형 주방"], strength: "안전", rent: 39, deposit: 300, maintenance: 5 },
  ];
  for (const [index, template] of templates.entries()) {
    if (candidates.length >= 3) break;
    const isWithinBudget = template.rent <= rentLimit && template.deposit <= depositLimit;
    candidates.push({ id: `demo-${location}-${roomType}-${index}`, title: `${location.split(" ").at(-1)} ${template.title} ${roomType}`, location, rent: `월 ${template.rent}만원`, deposit: `${template.deposit.toLocaleString()}만원`, maintenance: `월 ${template.maintenance}만원`, area: `${roomAreas[roomType]?.[index] ?? roomAreas.원룸[index]}㎡`, roomType, tags: template.tags, score: 75 + preferences[template.strength] * 4 - index, commute: "경로 확인 필요", isGeneratedDemo: true, isWithinBudget });
  }
  return candidates.sort((a, b) => Number(b.isWithinBudget) - Number(a.isWithinBudget) || b.score - a.score).slice(0, 3);
}

export function loadDraft() {
  try {
    const savedDraft = window.sessionStorage.getItem(draftStorageKey);
    if (!savedDraft) return defaultDraft;
    const saved = JSON.parse(savedDraft);
    const preferences = { ...defaultPreferences, ...saved.preferences };
    let total = Object.values(preferences).reduce((sum, value) => sum + value, 0);
    for (const name of Object.keys(preferences)) {
      while (total > 12 && preferences[name] > 1) {
        preferences[name] -= 1;
        total -= 1;
      }
    }
    const selectedProperty = properties.find((property) => property.title === saved.selectedProperty)?.id ?? saved.selectedProperty ?? defaultDraft.selectedProperty;
    return { ...defaultDraft, ...saved, selectedProperty, desiredArea: saved.desiredArea === "전국 전체" ? "" : saved.desiredArea, preferences };
  } catch {
    return defaultDraft;
  }
}

function ConditionsPage({ draft, setDraft, budget, setBudget, currentStep, onStepChange, resetVersion, onSaveAndExit, onRequestReset, onAiRecommend, onSupport, onNotify }) {
  const [checkedItems, setCheckedItems] = useState({});
  const isInitialResetVersion = useRef(true);
  const { income, deposit, roomType, desiredArea, workLocation, commute, selectedProperty, preferences } = draft;
  const steps = ["매물 조건 입력", "매물 추천 결과", "매물 비용 비교", "지원 정책·서류 확인"];
  const recommendations = buildDemoRecommendations(desiredArea, budget, deposit, roomType, preferences);
  const selectedRecommendation = recommendations.find((property) => property.id === selectedProperty) ?? recommendations[0];
  const preferenceTotal = Object.values(preferences).reduce((sum, value) => sum + value, 0);
  const priorityNames = Object.entries(preferences).sort(([, a], [, b]) => b - a).slice(0, 2).map(([name]) => name).join(" · ");
  const moveStep = (nextStep) => {
    const areaParts = desiredArea.trim().split(/\s+/);
    if (currentStep === 1 && nextStep > 1 && (areaParts.length < 2 || !/(?:구|군|시)$/.test(areaParts.at(-1)))) {
      onNotify("희망 지역을 시·군·구까지 입력해 주세요. 예: 대전 유성구");
      return;
    }
    if (currentStep === 1 && nextStep > 1 && !workLocation.trim()) {
      onNotify("직장·학교 위치를 입력해 주세요.");
      return;
    }
    if (currentStep === 1 && nextStep > 1 && recommendations.length === 0) {
      onNotify("월세는 1만원 이상, 보증금은 0만원 이상으로 입력해 주세요.");
      return;
    }
    if (nextStep > 2 && recommendations.length === 0) {
      onNotify("조건에 맞는 데모 매물이 없습니다. 희망 지역이나 예산을 수정해 주세요.");
      return;
    }
    onStepChange(Math.max(1, Math.min(4, nextStep)));
  };
  const changePreference = (name, nextValue) => {
    const updated = { ...preferences, [name]: nextValue };
    let excess = Object.values(updated).reduce((sum, value) => sum + value, 0) - 12;
    for (const [otherName] of preferenceItems.filter(([item]) => item !== name).sort(([a], [b]) => updated[b] - updated[a])) {
      const reduction = Math.min(excess, updated[otherName] - 1);
      updated[otherName] -= reduction;
      excess -= reduction;
      if (!excess) break;
    }
    updateDraft("preferences", updated);
  };

  useEffect(() => {
    if (isInitialResetVersion.current) {
      isInitialResetVersion.current = false;
      return;
    }
    setDraft(defaultDraft);
    setCheckedItems({});
    window.sessionStorage.removeItem(draftStorageKey);
  }, [resetVersion, setDraft]);

  const updateDraft = (key, value) => setDraft((valueBefore) => ({ ...valueBefore, [key]: value }));
  const saveAndExit = () => {
    window.sessionStorage.setItem(draftStorageKey, JSON.stringify(draft));
    onSaveAndExit();
  };

  return (
    <section className="condition-page">
      <style>{`
        .condition-page{width:100%;max-width:1540px;margin:0 auto;color:var(--color-text)}.condition-head{display:flex;justify-content:space-between;gap:30px;align-items:end;margin-bottom:28px}.condition-kicker{margin:0 0 9px;color:var(--color-primary-strong);font-size:14px;font-weight:800}.condition-head h1{margin:0;font-size:clamp(30px,2.7vw,46px);letter-spacing:-2.2px}.condition-head p{margin:10px 0 0;color:var(--color-text-muted);font-size:15px}.condition-score{min-width:250px;padding:17px 20px;border:1px solid var(--color-border);border-radius:14px;background:var(--color-surface-soft)}.condition-score span{display:block;color:var(--color-text-muted);font-size:12px}.condition-score b{display:block;margin-top:5px;color:var(--color-primary-strong);font-size:18px}.condition-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px}.condition-step{display:flex;align-items:center;gap:10px;padding:13px 16px;border:1px solid var(--color-background);border-radius:10px;background:#fff;color:var(--color-text-muted);font-size:13px}.condition-step strong{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:var(--color-surface-soft);color:var(--color-text-muted);font-size:11px}.condition-step.active{border-color:var(--color-primary-tint);background:var(--color-surface-soft);color:var(--color-primary-strong);font-weight:800}.condition-step.active strong{background:var(--color-primary-strong);color:#fff}.condition-layout{display:grid;grid-template-columns:1.25fr .75fr;gap:20px}.condition-form{display:grid;gap:18px}.form-panel{padding:23px;border:1px solid var(--color-background);border-radius:15px;background:#fff;box-shadow:0 8px 24px rgb(var(--color-primary-rgb) / 0.031)}.panel-title{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}.panel-title h2{margin:0;font-size:19px}.panel-title span{color:var(--color-text-muted);font-size:12px}.budget-grid,.location-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.location-grid{grid-template-columns:1.1fr 1.1fr .9fr}.field{display:grid;gap:8px;color:var(--color-text-muted);font-size:13px;font-weight:700}.field input,.field select{height:47px;padding:0 13px;border:1px solid var(--color-border);border-radius:8px;background:var(--color-surface);color:var(--color-text);font-size:14px}.field input:focus,.field select:focus{outline:2px solid var(--color-primary-tint);border-color:var(--color-primary)}.field small{font-weight:400;color:var(--color-text-muted);line-height:1.45}.commute-box{padding:6px 0}.commute-box b{display:block;margin-bottom:15px;font-size:15px}.commute-box input{width:100%;accent-color:var(--color-primary)}.range-label{display:flex;justify-content:space-between;margin-top:8px;color:var(--color-text-muted);font-size:12px}.preference-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.preference-card{padding:16px;border:1px solid var(--color-background);border-radius:10px;background:var(--color-surface)}.preference-card header{display:flex;justify-content:space-between;align-items:start}.preference-card b{font-size:15px}.preference-card span{display:block;margin-top:4px;color:var(--color-text-muted);font-size:12px}.preference-card em{font-style:normal;color:var(--color-primary-strong);font-size:12px;font-weight:800}.preference-card input{width:100%;margin-top:15px;accent-color:var(--color-primary)}.selection-summary{display:grid;gap:14px;align-content:start}.summary-card{padding:23px;border-radius:15px;background:linear-gradient(145deg,var(--color-primary-strong),var(--color-primary));color:#fff;box-shadow:0 14px 30px rgb(var(--color-primary-rgb) / 0.161)}.summary-card .summary-label{color:var(--color-border);font-size:12px}.summary-card h2{margin:8px 0 19px;font-size:23px;line-height:1.25}.summary-list{display:grid;gap:10px;margin:0;padding:0;list-style:none}.summary-list li{display:flex;justify-content:space-between;padding-top:10px;border-top:1px solid #ffffff38;font-size:13px}.summary-list b{font-size:14px}.guide-card{padding:21px;border:1px solid var(--color-background);border-radius:15px;background:var(--color-surface)}.guide-card h3{margin:0;font-size:17px}.guide-card p{margin:9px 0 14px;color:var(--color-text-muted);font-size:13px;line-height:1.55}.guide-list{display:grid;gap:10px;margin:0;padding:0;list-style:none}.guide-list li{display:flex;gap:9px;color:var(--color-text-secondary);font-size:13px;line-height:1.4}.guide-list i{font-style:normal;color:var(--color-primary-strong)}.condition-actions{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-top:22px;padding:18px 0 0;border-top:1px solid var(--color-background)}.condition-action-end{display:flex;align-items:center;justify-content:flex-end;gap:10px}.condition-actions .back-button,.condition-actions .reset-button,.condition-actions .save-button{padding:12px 20px;border:1px solid var(--color-border);border-radius:8px;background:#fff;color:var(--color-text-muted);font-weight:800}.condition-actions .reset-button{color:#8d5b46;border-color:#ead8cf}.condition-actions .save-button{color:var(--color-primary-strong);border-color:var(--color-primary-tint)}.condition-actions .next-button{padding:14px 23px;border:0;border-radius:8px;background:var(--color-primary-strong);color:#fff;font-weight:800;box-shadow:0 9px 17px rgb(var(--color-primary-rgb) / 0.200)}.condition-actions .next-button:hover{background:var(--color-primary)}@media(max-width:960px){.condition-layout{grid-template-columns:1fr}.selection-summary{grid-template-columns:1fr 1fr}.condition-score{display:none}}@media(max-width:700px){.condition-head{display:block}.condition-head h1{font-size:31px}.condition-steps{grid-template-columns:1fr 1fr}.condition-step{font-size:12px}.budget-grid,.location-grid,.preference-grid,.selection-summary{grid-template-columns:1fr}.form-panel{padding:18px}.panel-title{align-items:start;gap:10px}.condition-actions,.condition-action-end{flex-wrap:wrap}.condition-actions .back-button{flex:1 0 100%}.condition-action-end{width:100%}.condition-action-end button{flex:1}}
      `}</style>
      <style>{`.condition-layout .form-panel > .guide-card{margin-top:16px}`}</style>
      <style>{`.condition-action-end{display:flex;gap:10px}.condition-actions .ai-button{padding:12px 18px;border:1px solid var(--color-primary-tint);border-radius:8px;background:var(--color-surface-soft);color:var(--color-primary-strong);font-weight:800}.condition-actions .ai-button:hover{background:var(--color-background)}`}</style>
      <style>{`.demo-property-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.demo-property-card{display:flex;flex-direction:column;gap:14px;min-height:246px;padding:22px;border:1px solid var(--color-background);border-radius:17px;background:#fff;text-align:left;box-shadow:0 8px 24px rgb(var(--color-primary-rgb) / 0.035);transition:transform .18s,border-color .18s,box-shadow .18s}.demo-property-card:hover{transform:translateY(-3px);box-shadow:0 15px 30px rgb(var(--color-primary-rgb) / 0.094)}.demo-property-card.selected{border:2px solid var(--color-primary);background:var(--color-surface-soft)}.demo-property-top,.demo-property-bottom{display:flex;align-items:center;justify-content:space-between;gap:8px}.demo-property-top span{color:var(--color-primary-strong);font-size:12px;font-weight:800}.demo-property-top em{padding:5px 9px;border-radius:999px;background:var(--color-background);color:var(--color-primary-strong);font-size:11px;font-style:normal;font-weight:800}.demo-property-card h3{margin:0;color:var(--color-text);font-size:19px}.demo-property-location{margin:5px 0 0;color:var(--color-text-muted);font-size:12px}.demo-property-price{margin:0;color:var(--color-primary-strong);font-size:22px;font-weight:900}.demo-property-price small{display:block;margin-top:5px;color:var(--color-text-muted);font-size:12px;font-weight:500}.demo-property-tags{display:flex;flex-wrap:wrap;gap:6px}.demo-property-tags span{padding:5px 8px;border-radius:6px;background:var(--color-surface-soft);color:var(--color-text-secondary);font-size:11px}.demo-property-bottom{margin-top:auto;padding-top:12px;border-top:1px solid var(--color-background);color:var(--color-text-muted);font-size:12px}.demo-property-bottom strong{color:var(--color-primary-strong)}@media(max-width:900px){.demo-property-grid{grid-template-columns:1fr 1fr}}@media(max-width:650px){.demo-property-grid{grid-template-columns:1fr}}`}</style>
      <style>{`.cost-table-wrap{overflow-x:auto}.cost-table{width:100%;border-collapse:collapse;text-align:left}.cost-table th,.cost-table td{padding:17px;border-bottom:1px solid var(--color-background);white-space:nowrap}.cost-table thead th{background:var(--color-surface-soft);color:var(--color-text)}.cost-table th:first-child{min-width:140px;color:var(--color-text-muted)}.cost-table td{font-weight:700}.cost-table .selected{background:var(--color-surface-soft);color:var(--color-primary-strong)}.cost-table button{padding:8px 12px;border:1px solid var(--color-primary);border-radius:7px;background:#fff;color:var(--color-primary-strong);font-weight:800;cursor:pointer}.cost-table .selected button{background:var(--color-primary-strong);color:#fff}.preparation-layout{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(260px,.75fr);gap:18px}.preparation-checklist{display:grid;gap:12px}.preparation-checklist label{display:flex;gap:12px;align-items:flex-start;padding:15px;border:1px solid var(--color-background);border-radius:10px;line-height:1.5}.preparation-checklist input{margin-top:4px;accent-color:var(--color-primary)}.preparation-aside{padding:22px;border-radius:15px;background:var(--color-surface-soft)}.preparation-aside h3{margin:0 0 15px}.preparation-aside p{color:var(--color-text-secondary);line-height:1.6}.preparation-aside a{color:var(--color-primary-strong);font-weight:800}@media(max-width:760px){.preparation-layout{grid-template-columns:1fr}}`}</style>
      <style>{`.preparation-checklist label{position:relative;align-items:center;gap:15px;min-height:76px;padding:16px 18px;border-radius:14px;background:#fff;cursor:pointer;transition:border-color .2s,background .2s,box-shadow .2s,transform .2s}.preparation-checklist label:hover{transform:translateY(-2px);border-color:var(--color-primary-tint);box-shadow:0 10px 22px rgb(var(--color-primary-rgb) / 0.063)}.preparation-checklist label:has(input:checked){border-color:var(--color-primary);background:var(--color-surface-soft)}.preparation-checklist label:has(input:focus-visible){outline:2px solid var(--color-primary);outline-offset:3px}.preparation-checklist input{position:absolute;width:1px;height:1px;opacity:0}.preparation-check-icon{display:grid;place-items:center;flex:none;width:34px;height:34px;border:1px solid var(--color-border);border-radius:10px;background:var(--color-surface-soft);color:var(--color-text-muted);font-size:18px;font-weight:900}.preparation-checklist label:has(input:checked) .preparation-check-icon{border-color:var(--color-primary);background:var(--color-primary-strong);color:#fff}.preparation-check-copy{display:grid;gap:3px}.preparation-check-copy strong{color:var(--color-text);font-size:14px}.preparation-check-copy small{color:var(--color-text-muted);font-size:12px;line-height:1.4}`}</style>
      <header className="condition-head">
        <div>
          <p className="condition-kicker">0{currentStep} / {steps[currentStep - 1]}</p>
          <h1>{currentStep === 1 ? "나에게 맞는 매물 조건을 알려주세요" : currentStep === 2 ? "조건에 맞는 매물을 살펴보세요" : currentStep === 3 ? "추천 매물 3곳의 비용을 비교하세요" : "선택한 매물의 계약을 준비하세요"}</h1>
          <p>{currentStep === 1 ? "입력한 조건은 매물 추천, 비용 비교, 지원 정책 매칭과 신청 서류 안내에 반영됩니다." : "현재 단계의 결과는 데모 데이터이며, 실제 계약 전에는 공식 매물 정보와 현장 상태를 확인해야 합니다."}</p>
        </div>
        <aside className="condition-score"><span>진행 상태</span><b>{currentStep} / 4 단계 진행 중</b></aside>
      </header>

      <div className="condition-steps">{steps.map((step, index) => <button className={`condition-step ${currentStep === index + 1 ? "active" : ""}`} type="button" key={step} onClick={() => index + 1 <= currentStep && moveStep(index + 1)} disabled={index + 1 > currentStep}><strong>{index + 1}</strong>{step}</button>)}</div>

      {currentStep === 1 && <div className="condition-layout">
        <div className="condition-form">
          <section className="form-panel">
            <div className="panel-title"><h2>기본 예산 정보</h2><span>금액은 만원 단위로 입력해요</span></div>
            <div className="budget-grid">
              <label className="field">월 소득<input value={income} onChange={(event) => updateDraft("income", event.target.value)} inputMode="numeric" /></label>
              <label className="field">월세 예산<input value={budget} onChange={(event) => setBudget(event.target.value)} inputMode="numeric" /></label>
              <label className="field">보증금 예산<input value={deposit} onChange={(event) => updateDraft("deposit", event.target.value)} inputMode="numeric" /></label>
              <label className="field">희망 방 형태<select value={roomType} onChange={(event) => updateDraft("roomType", event.target.value)}><option>원룸</option><option>1.5룸</option><option>2룸</option></select></label>
            </div>
          </section>
          <section className="form-panel">
            <div className="panel-title"><h2>희망 지역과 통근</h2><span>선택한 지역 안에서 조건에 맞는 매물을 찾아요</span></div>
            <div className="location-grid">
              <label className="field">희망 지역 (시·군·구)<input value={desiredArea} onChange={(event) => updateDraft("desiredArea", event.target.value)} placeholder="예: 대전 유성구" /><small>시·군·구까지 입력해 주세요. 현재 추천 결과는 데모 매물입니다.</small></label>
              <label className="field">직장·학교 위치<input value={workLocation} onChange={(event) => updateDraft("workLocation", event.target.value)} placeholder="예: 대전 유성구" /><small>실제 통근 시간은 지도 경로 확인 후 반영할 수 있습니다.</small></label>
              <div className="commute-box"><b>최대 출퇴근 시간 · {commute}분</b><input type="range" min="20" max="90" value={commute} onChange={(event) => updateDraft("commute", Number(event.target.value))} /><div className="range-label"><span>20분</span><span>90분</span></div></div>
            </div>
          </section>
          <section className="form-panel">
            <div className="panel-title"><h2>생활 우선순위</h2><span>중요도 {preferenceTotal}/12점 · 한 항목을 올리면 다른 항목이 자동 조정돼요</span></div>
            <div className="preference-grid">{preferenceItems.map(([name, description]) => <article className="preference-card" key={name}><header><div><b>{name}</b><span>{description}</span></div><em>{preferences[name]}/5 중요</em></header><input type="range" min="1" max="5" value={preferences[name]} onChange={(event) => changePreference(name, Number(event.target.value))} /></article>)}</div>
          </section>
        </div>
        <aside className="selection-summary">
          <section className="summary-card"><span className="summary-label">입력 중인 나의 매물 조건</span><h2>{desiredArea}에서<br />월세 {budget || 0}만원 이하</h2><ul className="summary-list"><li><span>희망 방 형태</span><b>{roomType}</b></li><li><span>통근 기준</span><b>{commute}분 이내</b></li><li><span>우선 조건</span><b>{priorityNames}</b></li></ul></section>
          <section className="guide-card"><h3>데모 추천에 반영돼요</h3><p>희망 지역·방 형태·예산과 우선순위로 예시 매물의 순서를 정합니다. 실제 통근 시간은 아직 계산하지 않습니다.</p><ul className="guide-list"><li><i>✓</i>예산 충족 후보 우선 표시</li><li><i>✓</i>월세와 관리비 비교</li><li><i>✓</i>계약 전 확인 항목 안내</li></ul></section>
        </aside>
      </div>}
      {currentStep === 2 && <section className="form-panel"><div className="panel-title"><h2>{desiredArea} 추천 매물 3곳</h2><span>예산 충족 후보 우선 · 모두 예시 매물</span></div><div className="demo-property-grid">{recommendations.map((property, index) => <button className={`demo-property-card ${selectedRecommendation.id === property.id ? "selected" : ""}`} type="button" key={property.id} onClick={() => updateDraft("selectedProperty", property.id)}><div className="demo-property-top"><span>추천 {String(index + 1).padStart(2, "0")}</span><em>{selectedRecommendation.id === property.id ? "선택됨" : property.isWithinBudget ? "예산 충족" : "예산 초과"}</em></div><div><h3>{property.title}</h3><p className="demo-property-location">{property.location} · {property.roomType} · {property.area}</p></div><p className="demo-property-price">{property.rent}<small>보증금 {property.deposit} · 관리비 {property.maintenance}</small></p><div className="demo-property-tags">{property.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><div className="demo-property-bottom"><span>통근 {property.isGeneratedDemo ? "경로 확인 필요" : property.commute}</span><strong>{selectedRecommendation.id === property.id ? "선택 완료 ✓" : "이 매물 선택 →"}</strong></div></button>)}</div></section>}
      {currentStep === 3 && <section className="form-panel"><div className="panel-title"><h2>월 고정지출 비교</h2><span>금액 단위: 만원</span></div><div className="cost-table-wrap"><table className="cost-table"><thead><tr><th scope="col">비교 항목</th>{recommendations.map((property) => <th scope="col" className={selectedRecommendation.id === property.id ? "selected" : ""} key={property.id}>{property.title}</th>)}</tr></thead><tbody><tr><th scope="row">보증금</th>{recommendations.map((property) => <td key={property.id}>{property.deposit}</td>)}</tr><tr><th scope="row">월세</th>{recommendations.map((property) => <td key={property.id}>{property.rent}</td>)}</tr><tr><th scope="row">관리비</th>{recommendations.map((property) => <td key={property.id}>{property.maintenance}</td>)}</tr><tr><th scope="row">월세 + 관리비</th>{recommendations.map((property) => <td className={selectedRecommendation.id === property.id ? "selected" : ""} key={property.id}>월 {Number(property.rent.replace(/\D/g, "")) + Number(property.maintenance.replace(/\D/g, ""))}만원</td>)}</tr><tr><th scope="row">계약 준비</th>{recommendations.map((property) => <td className={selectedRecommendation.id === property.id ? "selected" : ""} key={property.id}><button type="button" onClick={() => updateDraft("selectedProperty", property.id)}>{selectedRecommendation.id === property.id ? "선택됨 ✓" : "선택하기"}</button></td>)}</tr></tbody></table></div><p className="cost-compare-note">데모 금액입니다. 공과금·교통비는 포함되지 않았고, 실제 매물 가격을 계약 전 확인해야 합니다.</p></section>}
      {currentStep === 4 && <section className="form-panel"><div className="panel-title"><h2>{selectedRecommendation.title} 계약 전 점검</h2><span>{selectedRecommendation.location}</span></div><div className="preparation-layout"><div className="preparation-checklist">{checklistItems.map(([title, detail]) => <label key={title}><input type="checkbox" checked={Boolean(checkedItems[selectedRecommendation.id]?.[title])} onChange={() => setCheckedItems((items) => ({ ...items, [selectedRecommendation.id]: { ...items[selectedRecommendation.id], [title]: !items[selectedRecommendation.id]?.[title] } }))} /><span className="preparation-check-icon" aria-hidden="true">✓</span><span className="preparation-check-copy"><strong>{title}</strong><small>{detail}</small></span></label>)}</div><aside className="preparation-aside"><h3>지원 정책·준비 서류</h3><p>청년 월세 지원과 LH·SH 공고는 소득·거주지·모집 시기별 요건을 확인하세요.</p><p>HUG 보증 가능 여부는 해당 주택과 보증금, 권리관계를 기준으로 공식 채널에서 확인해야 합니다.</p><p>신분증, 등본, 소득 증빙, 계약서 등은 신청 공고의 목록에 맞춰 준비하세요.</p></aside></div><p className="cost-compare-note">체크 상태는 저장되지 않는 화면용 점검표입니다. 이 화면은 지원 자격이나 보증 가능 여부를 판정하지 않습니다.</p></section>}
      <div className="condition-actions"><button className="back-button" type="button" onClick={() => currentStep === 1 ? onNotify("이전 단계가 없습니다.") : moveStep(currentStep - 1)}>이전</button><div className="condition-action-end">{currentStep === 1 && <button className="ai-button cta-button" type="button" onClick={onAiRecommend}>AI에게 간단히 추천받기</button>}<button className="reset-button" type="button" onClick={onRequestReset}>초기화</button><button className="save-button" type="button" onClick={saveAndExit}>저장하고 나가기</button><button className="next-button cta-button" type="button" onClick={() => currentStep === 4 ? onSupport() : moveStep(currentStep + 1)}>{currentStep === 4 ? "주거지원 정책 확인" : `${steps[currentStep]} 보기`}</button></div></div>
    </section>
  );
}

export default ConditionsPage;
