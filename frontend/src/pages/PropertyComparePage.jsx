import React from "react";
import { FaBus, FaHome, FaMapMarkerAlt, FaShieldAlt, FaShoppingCart } from "react-icons/fa";

const comparisonRows = [
  { label: "AI 적합도", Icon: FaMapMarkerAlt, getValue: (property) => `${property.score}점` },
  { label: "보증금", Icon: FaHome, getValue: (property) => property.deposit },
  { label: "월세 · 관리비", Icon: FaHome, getValue: (property) => `${property.rent} · ${property.maintenance}` },
  { label: "방 구조 · 면적", Icon: FaShoppingCart, getValue: (property) => `${property.roomType} · ${property.area}` },
  { label: "예상 통근", Icon: FaBus, getValue: (property) => property.commute },
  { label: "생활·안전", Icon: FaShieldAlt, getValue: (property, index) => index === 0 ? "매우 좋음" : "좋음" },
];

function PropertyComparePage({ properties, onBack, onDetail }) {
  return (
    <section className="property-compare-page">
      <style>{`
        .property-compare-page{max-width:1540px;margin:-42px auto 0;color:var(--color-text)}.compare-back{padding:0;border:0;background:transparent;color:var(--color-text-muted);font-size:13px;font-weight:800}.compare-back:hover{color:var(--color-primary-strong)}.compare-hero{display:flex;justify-content:space-between;gap:24px;align-items:end;margin:18px 0 26px}.compare-kicker{margin:0 0 9px;color:var(--color-primary-strong);font-size:13px;font-weight:900;letter-spacing:.08em}.compare-hero h1{margin:0;font-size:clamp(34px,3.2vw,50px);letter-spacing:-.07em}.compare-hero h1 b{color:var(--color-primary-strong)}.compare-hero p{margin:12px 0 0;color:var(--color-text-muted);font-size:15px}.compare-count{padding:11px 14px;border-radius:999px;background:var(--color-background);color:var(--color-primary-strong);font-size:13px;font-weight:900}.compare-board{overflow:hidden;border:1px solid var(--color-background);border-radius:18px;background:#fff}.compare-head,.compare-row{display:grid;grid-template-columns:180px repeat(var(--property-count),minmax(160px,1fr))}.compare-head{background:var(--color-surface-soft)}.compare-head>div{min-height:104px;padding:20px;border-left:1px solid var(--color-background)}.compare-head>div:first-child{border-left:0}.compare-head span{display:block;color:var(--color-text-muted);font-size:12px}.compare-head b{display:block;margin-top:7px;font-size:21px}.compare-head button{margin-top:10px;padding:0;border:0;background:transparent;color:var(--color-primary-strong);font-size:12px;font-weight:900}.compare-row>div{display:flex;align-items:center;min-height:70px;padding:15px 20px;border-top:1px solid var(--color-background);border-left:1px solid var(--color-background);color:var(--color-text-secondary);font-size:14px;font-weight:800}.compare-row>div:first-child{gap:10px;border-left:0;background:var(--color-surface);color:var(--color-text-muted)}.compare-row i{display:grid;place-items:center;width:29px;height:29px;border-radius:9px;background:var(--color-background);color:var(--color-primary-strong);font-style:normal}.compare-note{margin:20px 0 0;padding:18px 21px;border-radius:14px;background:var(--color-surface-soft);color:var(--color-text-muted);font-size:13px;line-height:1.6}.compare-note b{color:var(--color-primary-strong)}.compare-actions{display:flex;justify-content:space-between;gap:12px;margin-top:24px}.compare-actions button{padding:13px 18px;border:1px solid var(--color-border);border-radius:9px;background:#fff;color:var(--color-text-secondary);font-weight:900}.compare-actions .primary{border-color:var(--color-primary);background:var(--color-primary-strong);color:#fff}@media(max-width:760px){.property-compare-page{margin-top:-15px}.compare-hero{display:block}.compare-count{display:inline-block;margin-top:16px}.compare-board{overflow-x:auto}.compare-head,.compare-row{min-width:620px}.compare-head,.compare-row{grid-template-columns:150px repeat(var(--property-count),minmax(180px,1fr))}.compare-actions{display:grid;grid-template-columns:1fr}.compare-actions button{width:100%}}
      `}</style>
      <button className="compare-back" type="button" onClick={onBack}>추천 결과로 돌아가기</button>
      <header className="compare-hero"><div><p className="compare-kicker">PROPERTY COMPARISON</p><h1>선택한 매물을 <b>한눈에 비교하세요.</b></h1><p>보증금, 월세, 관리비와 통근 조건을 나란히 확인할 수 있어요.</p></div><span className="compare-count">{properties.length}개 매물 비교 중</span></header>
      <main className="compare-board" style={{ "--property-count": properties.length }}><div className="compare-head"><div><span>비교 기준</span><b>내 조건</b></div>{properties.map((property) => <div key={property.id}><span>추천 매물</span><b>{property.title}</b><button type="button" onClick={() => onDetail(property)}>매물 상세 보기</button></div>)}</div>{comparisonRows.map(({ label, Icon, getValue }) => <div className="compare-row" key={label}><div><i><Icon /></i>{label}</div>{properties.map((property, index) => <div key={property.id}>{getValue(property, index)}</div>)}</div>)}</main>
      <p className="compare-note"><b>비교 안내</b> 추천 결과는 입력한 조건을 바탕으로 한 예시입니다. 계약과 지원 신청 전에는 공식 공고 및 현장 정보를 확인해 주세요.</p>
      <footer className="compare-actions"><button type="button" onClick={onBack}>추천 결과로 돌아가기</button><button className="primary cta-button" type="button" onClick={() => onDetail(properties[0])}>1순위 매물 상세 보기</button></footer>
    </section>
  );
}

export default PropertyComparePage;
