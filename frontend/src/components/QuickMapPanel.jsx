import React, { useState } from "react";

function QuickMapPanel({ onClose }) {
  const [isMapLoading, setIsMapLoading] = useState(true);

  return (
    <div className="quick-map-modal" role="dialog" aria-modal="true" aria-label="지역 이동 비교 지도">
      <style>{`
        .quick-map-modal{position:fixed;z-index:50;top:76px;right:0;bottom:0;left:0;background:#102d2633;animation:quick-map-fade .24s ease-out both}.quick-map-sheet{display:grid;grid-template-columns:minmax(290px,.62fr) minmax(0,1.38fr);gap:26px;height:min(460px,calc(100dvh - 76px));max-height:none;padding:26px clamp(36px,8vw,170px);border-bottom:1px solid #cfe5dd;background:#f6fcfa;box-shadow:0 18px 38px #163e3440;animation:quick-map-slide .34s cubic-bezier(.2,.8,.2,1) both}.quick-map-copy{display:flex;flex-direction:column;justify-content:center;min-width:0}.quick-map-copy span{color:#008b70;font-size:12px;font-weight:800}.quick-map-copy h2{margin:8px 0;font-size:clamp(22px,2vw,30px);letter-spacing:-1.6px}.quick-map-copy p{margin:0;color:#5e7a71;font-size:13px;line-height:1.65}.quick-map-tags{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.quick-map-tags b{padding:7px 9px;border-radius:999px;background:#e1f4ed;color:#087a65;font-size:11px}.quick-map-ai{margin-top:15px;padding:11px 13px;border:1px solid #bfe5d8;border-radius:9px;background:#fff;color:#426960;font-size:12px;line-height:1.5}.quick-map-ai strong{color:#008b70}.quick-map-close{align-self:flex-start;width:max-content;margin-top:15px;padding:9px 13px;border:1px solid #9bcdbc;border-radius:7px;background:#fff;color:#087a65;font-size:12px;font-weight:800}.quick-map-searchbar{display:flex;gap:8px;margin:15px 0 0}.quick-map-searchbar input{min-width:0;flex:1;height:39px;padding:0 12px;border:1px solid #cde3db;border-radius:8px;background:#fff;color:#29483f;font-size:12px}.quick-map-searchbar input:focus{outline:2px solid #9bdcca;border-color:#008b70}.quick-map-searchbar button{width:42px;border:0;border-radius:8px;background:#008b70;color:#fff;font-size:17px}.quick-map-frame{position:relative;min-width:0;min-height:0;height:100%;overflow:hidden;border:1px solid #d2e6df;border-radius:13px;background:#fff}.quick-map-frame iframe{display:block;width:100%;height:100%;border:0}.map-skeleton{position:absolute;z-index:1;inset:0;display:grid;place-items:center;overflow:hidden;background:linear-gradient(135deg,#e8f4ee,#f9fcfa)}.map-skeleton::before{content:"";position:absolute;width:135%;height:22px;background:#ffffffa8;transform:rotate(-28deg);box-shadow:0 64px #ffffff90,0 -64px #ffffff90}.map-skeleton-content{position:relative;z-index:1;display:grid;gap:10px;width:72%;padding:16px;border-radius:12px;background:#ffffffb8}.skeleton-line{height:12px;border-radius:999px;background:linear-gradient(90deg,#d7eae3 25%,#f3faf7 50%,#d7eae3 75%);background-size:200% 100%;animation:skeleton-shimmer 1.25s infinite}.skeleton-line.short{width:64%}.skeleton-pin{justify-self:center;width:28px;height:28px;border-radius:50% 50% 50% 0;background:#9ddbc9;transform:rotate(-45deg)}@keyframes quick-map-fade{from{opacity:0}to{opacity:1}}@keyframes quick-map-slide{from{opacity:0;transform:translateY(-100%)}to{opacity:1;transform:translateY(0)}}@keyframes skeleton-shimmer{to{background-position:-200% 0}}@media(max-width:760px){.quick-map-modal{top:56px}.quick-map-sheet{grid-template-columns:1fr;height:auto;max-height:calc(100dvh - 56px);overflow:auto;padding:22px 24px}.quick-map-frame{height:clamp(210px,38dvh,300px)}.quick-map-close{margin-top:14px}}
      `}</style>
      <section className="quick-map-sheet">
        <div className="quick-map-copy">
          <span>AI 지역 이동 비교 지도</span>
          <h2>같은 예산, 다른 생활권을<br />한눈에 비교해 보세요.</h2>
          <p>대전 유성구와 충남 아산시의 통근권, 생활 인프라, 소음과 치안 등 주거 환경을 지도에서 먼저 확인할 수 있어요.</p>
          <form className="quick-map-searchbar" onSubmit={(event) => event.preventDefault()}><input aria-label="지역 검색" placeholder="지역명, 역, 회사·학교 위치 검색" /><button type="submit" aria-label="지역 검색">⌕</button></form>
          <div className="quick-map-tags"><b>대전 유성구</b><b>충남 아산시</b><b>통근권 비교</b></div>
          <div className="quick-map-ai"><strong>AI 주변환경지수</strong><br />교통·편의시설·치안·소음·계절 날씨 데이터를 함께 분석해 지역별 강점과 주의할 점을 보여줍니다.</div>
          <button className="quick-map-close" type="button" onClick={onClose}>지도 닫기　×</button>
        </div>
        <div className="quick-map-frame">{isMapLoading && <div className="map-skeleton" aria-label="지도 불러오는 중"><div className="map-skeleton-content"><i className="skeleton-pin" /><i className="skeleton-line" /><i className="skeleton-line short" /></div></div>}<iframe title="대전과 아산 지역 비교 지도" src="https://www.openstreetmap.org/export/embed.html?bbox=126.72%2C36.25%2C127.55%2C36.85&amp;layer=mapnik" loading="lazy" onLoad={() => setIsMapLoading(false)} /></div>
      </section>
    </div>
  );
}

export default QuickMapPanel;
