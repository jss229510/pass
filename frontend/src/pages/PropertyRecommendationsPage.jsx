import React, { useMemo, useState } from "react";

function PropertyRecommendationsPage({ budget, properties, onBack, onDetail, onCompare, onNotify }) {
  const [selectedId, setSelectedId] = useState(properties[0]?.id);
  const [comparisonIds, setComparisonIds] = useState([properties[0]?.id]);
  const selected = useMemo(
    () => properties.find((property) => property.id === selectedId) ?? properties[0],
    [properties, selectedId],
  );
  const toggleComparison = (propertyId) => {
    setComparisonIds((ids) => ids.includes(propertyId) ? ids.filter((id) => id !== propertyId) : [...ids, propertyId]);
  };

  return (
    <section className="recommendations-page">
      <style>{`
        .recommendations-page{width:100%;max-width:1540px;margin:0 auto;color:#18352e}.recommend-top{display:flex;justify-content:space-between;gap:25px;align-items:end;margin-bottom:24px}.recommend-kicker{margin:0 0 9px;color:#008b70;font-size:14px;font-weight:800}.recommend-top h1{margin:0;font-size:clamp(30px,2.8vw,47px);letter-spacing:-2.3px}.recommend-top h1 b{color:#008b70}.recommend-top p{margin:10px 0 0;color:#6b837c;font-size:15px}.edit-condition{padding:12px 17px;border:1px solid #008b70;border-radius:8px;background:#fff;color:#007b64;font-size:14px;font-weight:800;white-space:nowrap}.condition-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:21px;padding:15px;border:1px solid #d9eae5;border-radius:14px;background:#f7fcfa}.condition-chip{display:flex;gap:11px;align-items:center;padding:7px 10px;border-right:1px solid #d9e8e3}.condition-chip:last-child{border:0}.condition-chip i{display:grid;place-items:center;width:35px;height:35px;border-radius:50%;background:#dff4ed;color:#008b70;font-style:normal;font-size:18px}.condition-chip span{display:block;color:#76928a;font-size:11px}.condition-chip b{display:block;margin-top:3px;font-size:14px}.recommend-layout{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(350px,.65fr);gap:21px}.recommend-list-panel{padding:25px;border:1px solid #d9e9e4;border-radius:16px;background:#fff}.result-title{display:flex;align-items:center;justify-content:space-between;margin-bottom:17px}.result-title h2{margin:0;font-size:22px}.result-title span{padding:7px 10px;border-radius:999px;background:#edf9f5;color:#008b70;font-size:12px;font-weight:800}.property-result{display:grid;grid-template-columns:54px minmax(0,1fr) auto;gap:18px;align-items:center;padding:21px 14px;border-top:1px solid #e4eeeb;transition:.18s}.property-result:first-of-type{border-top:0}.property-result:hover,.property-result.selected{border-radius:12px;background:#f4fbf8}.property-rank{font-size:25px;font-weight:900;color:#008b70}.property-copy h3{margin:0;font-size:19px}.property-copy p{margin:7px 0;color:#506e65;font-size:13px;line-height:1.55}.property-metrics{display:flex;gap:15px;margin-top:10px}.property-metrics span{color:#6d887f;font-size:12px}.property-metrics b{color:#173d34}.property-actions{display:flex;gap:8px}.property-actions button{padding:10px 12px;border:1px solid #9fcfc2;border-radius:7px;background:#fff;color:#087d67;font-size:12px;font-weight:800;white-space:nowrap}.property-actions .detail-button{border-color:#008b70;background:#008b70;color:#fff}.list-footer{display:flex;justify-content:space-between;align-items:center;margin-top:15px;padding-top:19px;border-top:1px solid #e2ece9}.list-footer p{margin:0;color:#6d867f;font-size:12px}.compare-button{padding:12px 18px;border:0;border-radius:8px;background:#173f36;color:#fff;font-weight:800}.map-panel{overflow:hidden;border:1px solid #d9e9e4;border-radius:16px;background:#fff}.map-panel header{padding:20px 20px 13px}.map-panel header h2{margin:0;font-size:19px}.map-panel header p{margin:6px 0 0;color:#718a83;font-size:12px}.map-panel iframe{display:block;width:100%;height:342px;border:0}.map-caption{padding:14px 20px 20px}.map-caption b{display:block;font-size:15px}.map-caption p{margin:6px 0 0;color:#668179;font-size:12px;line-height:1.5}.recommend-insight{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:21px}.insight-card{padding:19px;border:1px solid #dceae6;border-radius:13px;background:#f9fcfb}.insight-card i{display:grid;place-items:center;width:35px;height:35px;border-radius:10px;background:#e0f5ee;color:#008b70;font-style:normal}.insight-card b{display:block;margin-top:12px;font-size:15px}.insight-card p{margin:6px 0 0;color:#6a827b;font-size:12px;line-height:1.5}@media(max-width:960px){.recommend-layout{grid-template-columns:1fr}.map-panel iframe{height:280px}.condition-strip{grid-template-columns:1fr 1fr}.condition-chip:nth-child(2){border-right:0}}@media(max-width:700px){.recommend-top{display:block}.recommend-top h1{font-size:32px}.edit-condition{margin-top:15px}.condition-strip{grid-template-columns:1fr;padding:10px}.condition-chip{border-right:0;border-bottom:1px solid #d9e8e3}.condition-chip:last-child{border-bottom:0}.recommend-list-panel{padding:18px}.property-result{grid-template-columns:38px 1fr;gap:11px;padding:17px 6px}.property-actions{grid-column:2;justify-content:flex-start}.property-metrics{flex-wrap:wrap;gap:8px 13px}.list-footer{display:block}.compare-button{width:100%;margin-top:14px}.recommend-insight{grid-template-columns:1fr}}
      `}</style>
      <header className="recommend-top">
        <div><p className="recommend-kicker">02 / AI 매물 추천 결과</p><h1>내 조건에 맞춘 <b>추천 매물 TOP 3</b></h1><p>희망 지역 · 월세 예산 {budget}만원 · 통근 {`45분 이내`} 조건을 바탕으로 분석했어요.</p></div>
        <button className="edit-condition" onClick={onBack}>⌘　조건 수정하기</button>
      </header>
      <section className="condition-strip" aria-label="추천에 반영한 조건">
        <div className="condition-chip"><i>♟</i><div><span>가구 형태</span><b>청년 1인 가구</b></div></div>
        <div className="condition-chip"><i>₩</i><div><span>월세 예산</span><b>{budget}만원 이하</b></div></div>
        <div className="condition-chip"><i>◷</i><div><span>통근 시간</span><b>45분 이내</b></div></div>
        <div className="condition-chip"><i>⌂</i><div><span>우선 조건</span><b>주거비 · 교통</b></div></div>
      </section>
      <div className="recommend-layout">
        <section className="recommend-list-panel">
          <div className="result-title"><h2>추천 매물 비교</h2><span>AI 적합도 순</span></div>
          {properties.map((property, index) => <article className={`property-result ${selectedId === property.id ? "selected" : ""}`} key={property.id} onMouseEnter={() => setSelectedId(property.id)}><div className="property-rank">0{index + 1}</div><div className="property-copy"><h3>{property.title}</h3><p>{property.location} · {property.roomType} · {property.area} · {property.tags.join(" · ")}</p><div className="property-metrics"><span>적합도 <b>{property.score}점</b></span><span>보증금 <b>{property.deposit}</b></span><span>월세 <b>{property.rent}</b></span><span>관리비 <b>{property.maintenance}</b></span></div></div><div className="property-actions"><button className="detail-button" onClick={() => onDetail(property)}>상세보기</button><button className={comparisonIds.includes(property.id) ? "compare-add selected" : "compare-add"} onClick={() => toggleComparison(property.id)}>{comparisonIds.includes(property.id) ? "비교 선택됨" : "비교에 추가"}</button></div></article>)}
          <footer className="list-footer"><p>비교할 매물을 2곳 이상 선택해 주세요. 현재 {comparisonIds.length}곳 선택</p><button className="compare-button" onClick={() => comparisonIds.length < 2 ? onNotify("비교할 매물을 2곳 이상 선택해 주세요.") : onCompare(comparisonIds)}>선택 매물 비교하기</button></footer>
        </section>
        <aside className="map-panel"><header><h2>추천 매물 위치</h2><p>선택한 매물의 위치와 주변 생활권을 살펴보세요.</p></header><iframe title="추천 매물 위치 지도" src="https://www.openstreetmap.org/export/embed.html?bbox=126.10%2C34.20%2C129.60%2C38.70&amp;layer=mapnik" loading="lazy" /><div className="map-caption"><b>현재 선택 · {selected.title}</b><p>{selected.location} · {selected.tags.join(" · ")} 조건에서 높은 적합도를 보였어요.</p></div></aside>
      </div>
      <section className="recommend-insight"><article className="insight-card"><i>₩</i><b>월 고정지출 예상</b><p>월세와 관리비를 합쳐 약 45~49만원 범위로 예상됩니다.</p></article><article className="insight-card"><i>◷</i><b>통근 시간 비교</b><p>추천 매물은 설정한 통근 시간을 만족하는 조건을 우선 반영했어요.</p></article><article className="insight-card"><i>✓</i><b>지원 정책 매칭</b><p>매물 위치를 기준으로 확인할 청년 주거지원 정책과 서류를 안내합니다.</p></article></section>
    </section>
  );
}

export default PropertyRecommendationsPage;
