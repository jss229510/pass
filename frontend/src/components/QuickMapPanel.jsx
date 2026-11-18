import React, { useState } from "react";
import KakaoMap from "./KakaoMap";

function QuickMapPanel({ onClose }) {
  const [searchText, setSearchText] = useState("대전 유성구");
  const [mapQuery, setMapQuery] = useState("대전 유성구");
  const [places, setPlaces] = useState([]);

  return (
    <div className="quick-map-modal" role="dialog" aria-modal="true" aria-label="지역 이동 비교 지도">
      <style>{`
        .quick-map-modal{position:fixed;z-index:50;top:76px;right:0;bottom:0;left:0;background:#102d2633}.quick-map-sheet{display:grid;grid-template-columns:minmax(290px,.62fr) minmax(0,1.38fr);gap:26px;height:min(460px,calc(100dvh - 76px));padding:26px clamp(36px,8vw,170px);background:#f6fcfa}.quick-map-copy{display:flex;flex-direction:column;justify-content:center}.quick-map-copy span{color:#008b70;font-size:12px;font-weight:800}.quick-map-copy h2{margin:8px 0;font-size:clamp(22px,2vw,30px)}.quick-map-copy p{margin:0;color:#5e7a71;font-size:13px;line-height:1.65}.quick-map-tags{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.quick-map-tags b{padding:7px 9px;border-radius:999px;background:#e1f4ed;color:#087a65;font-size:11px}.quick-map-ai{margin-top:15px;padding:11px 13px;border:1px solid #bfe5d8;border-radius:9px;background:#fff;color:#426960;font-size:12px}.quick-map-ai strong{color:#008b70}.quick-map-close{align-self:flex-start;margin-top:15px;padding:9px 13px;border:1px solid #9bcdbc;border-radius:7px;background:#fff;color:#087a65;font-size:12px;font-weight:800}.quick-map-searchbar{display:flex;gap:8px;margin-top:15px}.quick-map-searchbar input{flex:1;height:39px;padding:0 12px;border:1px solid #cde3db;border-radius:8px}.quick-map-searchbar button{padding:0 13px;border:0;border-radius:8px;background:#008b70;color:#fff}.quick-map-frame{position:relative;overflow:hidden;border:1px solid #d2e6df;border-radius:13px}.quick-map-frame .kakao-map-canvas{height:100%;border-radius:0}.quick-map-results{position:absolute;right:12px;bottom:12px;left:12px;display:flex;gap:6px;flex-wrap:wrap}.quick-map-results span{padding:7px 9px;border-radius:999px;background:#fffffff0;color:#31584e;font-size:11px;font-weight:800}@media(max-width:760px){.quick-map-modal{top:56px}.quick-map-sheet{grid-template-columns:1fr;height:auto;max-height:calc(100dvh - 56px);overflow:auto;padding:22px 24px}.quick-map-frame{height:300px}}
      `}</style>
      <section className="quick-map-sheet">
        <div className="quick-map-copy">
          <span>AI 장소·생활권 검색 지도</span>
          <h2><b>{mapQuery}</b> 주변을<br />지도에서 확인해 보세요.</h2>
          <p>{mapQuery} 주변의 대중교통, 생활 편의시설, 주거 환경을 실제 지도와 장소 검색 결과로 확인할 수 있어요.</p>
          <form className="quick-map-searchbar" onSubmit={(event) => { event.preventDefault(); if (searchText.trim()) setMapQuery(searchText.trim()); }}><input value={searchText} onChange={(event) => setSearchText(event.target.value)} aria-label="지역 검색" placeholder="지역명, 역, 회사·학교 위치 검색" /><button type="submit" aria-label="지역 검색">검색</button></form>
          <div className="quick-map-tags"><b>{mapQuery}</b><b>장소 검색</b><b>주변 환경 확인</b></div>
          <div className="quick-map-ai"><strong>{mapQuery} 주변환경</strong><br />검색한 장소를 기준으로 교통·편의시설·치안 등 주변 생활 정보를 확인해 보세요.</div>
          <button className="quick-map-close" type="button" onClick={onClose}>지도 닫기　×</button>
        </div>
        <div className="quick-map-frame"><KakaoMap regionName="대전 유성구" categoryId="overview" searchQuery={mapQuery} onPlacesChange={setPlaces} /><div className="quick-map-results">{places.slice(0, 3).map((place) => <span key={place}>{place}</span>)}</div></div>
      </section>
    </div>
  );
}

export default QuickMapPanel;
