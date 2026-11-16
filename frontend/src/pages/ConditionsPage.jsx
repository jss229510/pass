import React, { useState } from "react";

const preferenceItems = [
  ["교통", "대중교통·통근 편의", 4],
  ["안전", "치안·야간 귀가 환경", 4],
  ["생활편의", "마트·병원·문화시설", 3],
  ["주거비", "예산 안에서의 여유", 5],
];

function ConditionsPage({ budget, setBudget, onNext, onNotify }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [commute, setCommute] = useState(45);
  const [roomType, setRoomType] = useState("원룸");
  const [selectedRegion, setSelectedRegion] = useState("대전 유성구");
  const [preferences, setPreferences] = useState(
    Object.fromEntries(preferenceItems.map(([name, , value]) => [name, value])),
  );
  const steps = ["주거 조건 입력", "지역 추천 결과", "지역·생활비 비교", "지원 정책·서류 확인"];
  const recommendations = [
    { name: "대전 유성구", rent: "월 45만원", commute: "18분", detail: "연구단지·대학가 생활권과 대중교통을 함께 고려한 선택" },
    { name: "충남 아산시", rent: "월 38만원", commute: "22분", detail: "산업단지 접근성과 월세 부담 완화를 우선한 선택" },
    { name: "광주 북구", rent: "월 41만원", commute: "26분", detail: "상업시설 접근성과 청년 지원 정보를 함께 비교한 선택" },
  ];
  const selectedRecommendation = recommendations.find((region) => region.name === selectedRegion) ?? recommendations[0];
  const moveStep = (nextStep) => setCurrentStep(Math.max(1, Math.min(4, nextStep)));

  return (
    <section className="condition-page">
      <style>{`
        .condition-page{width:100%;max-width:1540px;margin:0 auto;color:#18352e}.condition-head{display:flex;justify-content:space-between;gap:30px;align-items:end;margin-bottom:28px}.condition-kicker{margin:0 0 9px;color:#008b70;font-size:14px;font-weight:800}.condition-head h1{margin:0;font-size:clamp(30px,2.7vw,46px);letter-spacing:-2.2px}.condition-head p{margin:10px 0 0;color:#678078;font-size:15px}.condition-score{min-width:250px;padding:17px 20px;border:1px solid #cfe7df;border-radius:14px;background:#f1faf6}.condition-score span{display:block;color:#5e8177;font-size:12px}.condition-score b{display:block;margin-top:5px;color:#007c65;font-size:18px}.condition-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px}.condition-step{display:flex;align-items:center;gap:10px;padding:13px 16px;border:1px solid #dcebe6;border-radius:10px;background:#fff;color:#8aa19a;font-size:13px}.condition-step strong{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#edf5f2;color:#5f8177;font-size:11px}.condition-step.active{border-color:#8bd8c7;background:#effaf6;color:#007e67;font-weight:800}.condition-step.active strong{background:#008b70;color:#fff}.condition-layout{display:grid;grid-template-columns:1.25fr .75fr;gap:20px}.condition-form{display:grid;gap:18px}.form-panel{padding:23px;border:1px solid #dce9e5;border-radius:15px;background:#fff;box-shadow:0 8px 24px #0f766e08}.panel-title{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}.panel-title h2{margin:0;font-size:19px}.panel-title span{color:#78938b;font-size:12px}.budget-grid,.location-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.location-grid{grid-template-columns:1.1fr 1.1fr .9fr}.field{display:grid;gap:8px;color:#55746b;font-size:13px;font-weight:700}.field input,.field select{height:47px;padding:0 13px;border:1px solid #d5e4df;border-radius:8px;background:#fbfefd;color:#1c3931;font-size:14px}.field input:focus,.field select:focus{outline:2px solid #90dcca;border-color:#008b70}.field small{font-weight:400;color:#829991;line-height:1.45}.commute-box{padding:6px 0}.commute-box b{display:block;margin-bottom:15px;font-size:15px}.commute-box input{width:100%;accent-color:#008b70}.range-label{display:flex;justify-content:space-between;margin-top:8px;color:#6c847d;font-size:12px}.preference-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.preference-card{padding:16px;border:1px solid #e0ede9;border-radius:10px;background:#fbfefd}.preference-card header{display:flex;justify-content:space-between;align-items:start}.preference-card b{font-size:15px}.preference-card span{display:block;margin-top:4px;color:#7c948d;font-size:12px}.preference-card em{font-style:normal;color:#008b70;font-size:12px;font-weight:800}.preference-card input{width:100%;margin-top:15px;accent-color:#008b70}.selection-summary{display:grid;gap:14px;align-content:start}.summary-card{padding:23px;border-radius:15px;background:linear-gradient(145deg,#008b70,#04725f);color:#fff;box-shadow:0 14px 30px #008b7029}.summary-card .summary-label{color:#c5f1e5;font-size:12px}.summary-card h2{margin:8px 0 19px;font-size:23px;line-height:1.25}.summary-list{display:grid;gap:10px;margin:0;padding:0;list-style:none}.summary-list li{display:flex;justify-content:space-between;padding-top:10px;border-top:1px solid #ffffff38;font-size:13px}.summary-list b{font-size:14px}.guide-card{padding:21px;border:1px solid #dce9e5;border-radius:15px;background:#f7fcfa}.guide-card h3{margin:0;font-size:17px}.guide-card p{margin:9px 0 14px;color:#668078;font-size:13px;line-height:1.55}.guide-list{display:grid;gap:10px;margin:0;padding:0;list-style:none}.guide-list li{display:flex;gap:9px;color:#43675d;font-size:13px;line-height:1.4}.guide-list i{font-style:normal;color:#008b70}.condition-actions{display:flex;justify-content:space-between;align-items:center;margin-top:22px;padding:18px 0 0;border-top:1px solid #e1ece8}.condition-actions .back-button{padding:12px 20px;border:1px solid #cfe2dc;border-radius:8px;background:#fff;color:#4f7368;font-weight:800}.condition-actions .next-button{padding:14px 23px;border:0;border-radius:8px;background:#008b70;color:#fff;font-weight:800;box-shadow:0 9px 17px #008b7033}.condition-actions .next-button:hover{background:#007761}@media(max-width:960px){.condition-layout{grid-template-columns:1fr}.selection-summary{grid-template-columns:1fr 1fr}.condition-score{display:none}}@media(max-width:700px){.condition-head{display:block}.condition-head h1{font-size:31px}.condition-steps{grid-template-columns:1fr 1fr}.condition-step{font-size:12px}.budget-grid,.location-grid,.preference-grid,.selection-summary{grid-template-columns:1fr}.form-panel{padding:18px}.panel-title{align-items:start;gap:10px}.condition-actions{gap:10px}.condition-actions button{flex:1}}
      `}</style>
      <header className="condition-head">
        <div>
          <p className="condition-kicker">0{currentStep} / {steps[currentStep - 1]}</p>
          <h1>{currentStep === 1 ? "나에게 맞는 주거 조건을 알려주세요" : currentStep === 2 ? "조건에 맞는 지역을 비교해 보세요" : currentStep === 3 ? "선택한 지역의 생활비를 확인하세요" : "지원 정책과 준비 서류를 점검하세요"}</h1>
          <p>{currentStep === 1 ? "입력한 조건은 지역 추천, 주거비 비교, 지원 정책 매칭과 신청 서류 안내에 반영됩니다." : "현재 단계의 결과는 데모 데이터이며, 실제 계약 전에는 공식 공고와 현장 정보를 확인해야 합니다."}</p>
        </div>
        <aside className="condition-score"><span>진행 상태</span><b>{currentStep} / 4 단계 진행 중</b></aside>
      </header>

      <div className="condition-steps">{steps.map((step, index) => <button className={`condition-step ${currentStep === index + 1 ? "active" : ""}`} type="button" key={step} onClick={() => index + 1 <= currentStep && moveStep(index + 1)} disabled={index + 1 > currentStep}><strong>{index + 1}</strong>{step}</button>)}</div>

      {currentStep === 1 && <div className="condition-layout">
        <div className="condition-form">
          <section className="form-panel">
            <div className="panel-title"><h2>기본 예산 정보</h2><span>금액은 만원 단위로 입력해요</span></div>
            <div className="budget-grid">
              <label className="field">월 소득<input defaultValue="250" inputMode="numeric" /></label>
              <label className="field">월세 예산<input value={budget} onChange={(event) => setBudget(event.target.value)} inputMode="numeric" /></label>
              <label className="field">보증금 예산<input defaultValue="1000" inputMode="numeric" /></label>
              <label className="field">희망 방 형태<select value={roomType} onChange={(event) => setRoomType(event.target.value)}><option>원룸</option><option>1.5룸</option><option>2룸</option></select></label>
            </div>
          </section>
          <section className="form-panel">
            <div className="panel-title"><h2>희망 지역과 통근</h2><span>현재 기준으로 언제든 수정할 수 있어요</span></div>
            <div className="location-grid">
              <label className="field">희망 지역<select defaultValue=""><option value="" disabled>지역을 선택해 주세요</option><option>서울 성북구</option><option>서울 관악구</option><option>서울 동대문구</option></select><small>선택한 지역을 기준으로 주변 지역도 함께 추천합니다.</small></label>
              <label className="field">직장·학교 위치<select defaultValue="서울 광화문"><option>서울 광화문</option><option>서울 강남역</option><option>서울 여의도</option><option>서울 신촌</option></select><small>직장 또는 학교와의 통근 시간을 계산합니다.</small></label>
              <div className="commute-box"><b>최대 출퇴근 시간 · {commute}분</b><input type="range" min="20" max="90" value={commute} onChange={(event) => setCommute(event.target.value)} /><div className="range-label"><span>20분</span><span>90분</span></div></div>
            </div>
          </section>
          <section className="form-panel">
            <div className="panel-title"><h2>생활 우선순위</h2><span>중요한 조건일수록 점수를 높여 주세요</span></div>
            <div className="preference-grid">{preferenceItems.map(([name, description]) => <article className="preference-card" key={name}><header><div><b>{name}</b><span>{description}</span></div><em>{preferences[name]}/5 중요</em></header><input type="range" min="1" max="5" value={preferences[name]} onChange={(event) => setPreferences({ ...preferences, [name]: Number(event.target.value) })} /></article>)}</div>
          </section>
        </div>
        <aside className="selection-summary">
          <section className="summary-card"><span className="summary-label">입력 중인 나의 주거 프로필</span><h2>서울에서<br />월세 {budget || 0}만원 이하</h2><ul className="summary-list"><li><span>가구 형태</span><b>청년 1인 가구</b></li><li><span>통근 기준</span><b>{commute}분 이내</b></li><li><span>가장 중요한 조건</span><b>주거비 · 교통</b></li></ul></section>
          <section className="guide-card"><h3>추천 결과에 반영돼요</h3><p>입력된 조건을 바탕으로 월세 부담, 통근 시간, 생활 인프라, 지원 대상 가능성을 함께 분석합니다.</p><ul className="guide-list"><li><i>✓</i>내 예산에 맞는 지역 TOP 3</li><li><i>✓</i>월 고정지출 예상 금액</li><li><i>✓</i>신청 가능한 청년 주거지원 정책</li></ul></section>
        </aside>
      </div>}
      {currentStep === 2 && <section className="form-panel"><div className="panel-title"><h2>예산과 통근 기준 추천 지역</h2><span>선택하면 다음 단계에서 상세 비교합니다.</span></div><div className="preference-grid">{recommendations.map((region) => <button className="preference-card" type="button" key={region.name} onClick={() => setSelectedRegion(region.name)} style={{ textAlign: "left", background: selectedRegion === region.name ? "#effaf6" : "#fff" }}><header><div><b>{region.name}</b><span>{region.detail}</span></div><em>선택</em></header><p>예상 월세 <b>{region.rent}</b> · 직장까지 {region.commute}</p></button>)}</div></section>}
      {currentStep === 3 && <div className="condition-layout"><section className="form-panel"><div className="panel-title"><h2>{selectedRecommendation.name} 생활비 비교</h2><span>{roomType} · 월세 예산 {budget}만원</span></div><div className="budget-grid"><article className="preference-card"><b>예상 월세</b><span>{selectedRecommendation.rent}</span></article><article className="preference-card"><b>예상 관리비</b><span>월 7~12만원</span></article><article className="preference-card"><b>통근 시간</b><span>{selectedRecommendation.commute}</span></article></div><section className="guide-card"><h3>주변 환경 확인</h3><ul className="guide-list"><li><i>✓</i>직장·산업단지까지 통근 경로 확인</li><li><i>✓</i>마트·병원·대중교통 등 생활 인프라 확인</li><li><i>✓</i>매물 계약 전 등기·보증 가능 여부 확인</li></ul></section></section><aside className="selection-summary"><section className="summary-card"><span className="summary-label">현재 비교 중인 지역</span><h2>{selectedRecommendation.name}</h2><ul className="summary-list"><li><span>주거 형태</span><b>{roomType}</b></li><li><span>월세 예산</span><b>{budget}만원 이하</b></li><li><span>통근 기준</span><b>{commute}분 이내</b></li></ul></section></aside></div>}
      {currentStep === 4 && <div className="condition-layout"><section className="form-panel"><div className="panel-title"><h2>{selectedRecommendation.name} 지원·계약 준비</h2><span>신청 전 공식 공고를 확인하세요</span></div><div className="preference-grid"><article className="preference-card"><b>청년 월세 지원</b><span>소득·거주 조건과 지자체 공고 확인</span></article><article className="preference-card"><b>LH·SH 청약</b><span>지역별 모집 공고와 자격 확인</span></article><article className="preference-card"><b>HUG 보증</b><span>주택·보증금·선순위 권리 기준 확인</span></article><article className="preference-card"><b>계약 준비 서류</b><span>신분 확인, 등본, 계약서, 소득 증빙</span></article></div></section><aside className="selection-summary"><section className="guide-card"><h3>계약 전 마지막 점검</h3><ul className="guide-list"><li><i>✓</i>특약과 불리한 조항을 확인했나요?</li><li><i>✓</i>보증 가능 여부를 공식 채널에서 확인했나요?</li><li><i>✓</i>신청 서류와 마감일을 확인했나요?</li></ul></section></aside></div>}
      <div className="condition-actions"><button className="back-button" onClick={() => currentStep === 1 ? onNotify("이전 단계가 없습니다.") : moveStep(currentStep - 1)}>이전</button><button className="next-button" onClick={() => currentStep === 4 ? onNotify("4단계 준비 점검을 완료했습니다. 실제 신청 전 공식 공고를 확인하세요.") : moveStep(currentStep + 1)}>{currentStep === 4 ? "준비 점검 완료" : `${steps[currentStep]} 보기　→`}</button></div>
    </section>
  );
}

export default ConditionsPage;
