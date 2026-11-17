import React from "react";
import { supports } from "../data/housingData";

const supportDetails = [
  { description: "청년 월세 지원 등 내 조건에 맞는 혜택을 비교해 보세요.", points: ["만 19~39세 청년", "소득·자산 기준 충족"], icon: "house" },
  { description: "청년·신혼부부 대상 공공임대 주택 공고를 비교해 보세요.", points: ["LH·SH 공고 확인", "모집 일정 상시 확인"], icon: "building" },
  { description: "이사비·중개보수 등 지역별 청년 지원 혜택을 확인해 보세요.", points: ["지자체별 지원 여부 상이", "공고문에서 조건 확인"], icon: "move" },
];

function Illustration({ name }) {
  if (name === "house") return <svg viewBox="0 0 160 120" aria-hidden="true"><path d="m33 61 43-35 43 35v44H33Z" fill="#e7faf3" stroke="#38b98d" strokeWidth="5" /><path d="M78 28v79" stroke="#38b98d" strokeWidth="5" /><path d="M55 74h13v13H55zM91 74h13v13H91z" fill="#ffd67b" /><path d="M22 90c12-10 29-8 37 0M102 91c12-11 29-8 37 0" stroke="#55bd83" strokeWidth="7" strokeLinecap="round" /></svg>;
  if (name === "building") return <svg viewBox="0 0 160 120" aria-hidden="true"><path d="M37 106V48h38v58M77 106V28h38v78" fill="#e6f5f2" stroke="#69ad9e" strokeWidth="4" /><path d="M48 60h7m-7 14h7m-7 14h7m34-43h8m-8 15h8m-8 15h8m-8 15h8" stroke="#69ad9e" strokeWidth="5" strokeLinecap="round" /><path d="M22 107h116" stroke="#4caf80" strokeWidth="7" strokeLinecap="round" /></svg>;
  return <svg viewBox="0 0 160 120" aria-hidden="true"><path d="M26 56h72v42H26Z" fill="#e7faf3" stroke="#38b98d" strokeWidth="5" /><path d="M98 68h19l14 14v16H98Z" fill="#c8f0e0" stroke="#38b98d" strokeWidth="5" /><circle cx="52" cy="102" r="10" fill="#47645d" /><circle cx="113" cy="102" r="10" fill="#47645d" /><path d="M43 58h26v21H43z" fill="#fff" /><path d="M14 107h132" stroke="#f2c463" strokeWidth="6" strokeLinecap="round" /></svg>;
}

function SupportPage({ onDocuments }) {
  return (
    <section className="support-page">
      <style>{`
        .support-page{width:100%;max-width:1540px;margin:0 auto;color:#14233b}.support-hero{display:grid;grid-template-columns:1fr .8fr;align-items:center;min-height:310px;gap:35px}.support-kicker{margin:0 0 12px;color:#008b70;font-size:15px;font-weight:900;letter-spacing:.08em}.support-hero h1{margin:0;font-size:clamp(42px,4.2vw,67px);line-height:1.1;letter-spacing:-.07em}.support-hero h1 b{color:#008b70}.support-hero p{margin:22px 0 0;color:#5d6c7c;font-size:17px;line-height:1.6}.support-visual{display:grid;place-items:center;min-height:250px;border-radius:50% 50% 18% 18%;background:radial-gradient(circle at 60% 45%,#fff 0 7%,transparent 8%),linear-gradient(145deg,#f2fbf8,#dff3ed)}.support-visual svg{width:min(100%,390px);height:240px}.support-result-label{margin:0 0 18px;text-align:right;color:#008b70;font-size:13px;font-weight:800}.support-card-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.housing-support-card{position:relative;min-height:285px;padding:27px;border:1px solid #d8e7e3;border-radius:17px;background:#fff;overflow:hidden}.support-status{display:inline-block;padding:7px 10px;border-radius:999px;background:#e8f8f2;color:#008b70;font-size:12px;font-weight:900}.housing-support-card h2{margin:20px 0 9px;font-size:27px;letter-spacing:-.05em}.housing-support-card p{max-width:66%;margin:0;color:#5e7277;font-size:14px;line-height:1.55}.support-points{display:flex;gap:16px;flex-wrap:wrap;margin:20px 0;padding:0;list-style:none}.support-points li{color:#39514d;font-size:12px}.support-points li:before{content:"✓";margin-right:6px;color:#008b70;font-weight:900}.support-doc-button{position:absolute;bottom:24px;left:27px;border:0;background:transparent;color:#008b70;font-size:15px;font-weight:900}.support-art{position:absolute;right:11px;bottom:22px;width:39%;height:120px}.support-notice{display:flex;gap:13px;align-items:center;margin-top:28px;padding:19px 24px;border-radius:13px;background:#fff6df;color:#725215;font-size:14px}.support-notice i{font-style:normal;font-size:23px}@media(max-width:900px){.support-hero,.support-card-grid{grid-template-columns:1fr}.support-visual{display:none}.housing-support-card p{max-width:70%}}@media(max-width:700px){.support-hero{min-height:auto;padding:15px 0 35px}.support-hero h1{font-size:42px}.support-card-grid{gap:14px}.housing-support-card{min-height:260px;padding:22px}.support-notice{align-items:flex-start;font-size:12px}}
      `}</style>
      <header className="support-hero"><div><p className="support-kicker">YOUTH HOUSING SUPPORT</p><h1>이동할 지역에서 받을 수 있는<br /><b>혜택을 먼저 확인하세요.</b></h1><p>청년 월세 지원, 공공임대, 지자체 이사 지원 등<br />내 조건에 맞는 주거지원 혜택을 한눈에 비교할 수 있어요.</p></div><div className="support-visual"><Illustration name="house" /></div></header>
      <p className="support-result-label">조건 기반 맞춤 결과　›</p>
      <section className="support-card-grid">{supports.map((support, index) => { const detail = supportDetails[index]; return <article className="housing-support-card" key={support.title}><span className="support-status">{support.status}</span><h2>{support.title}</h2><p>{detail.description}</p><ul className="support-points">{detail.points.map((point) => <li key={point}>{point}</li>)}</ul><button className="support-doc-button" type="button" onClick={onDocuments}>필요 서류 확인　→</button><div className="support-art"><Illustration name={detail.icon} /></div></article>; })}</section>
      <aside className="support-notice"><i>🔔</i><div><b>알림　</b>실제 자격, HUG 보증 가능 여부, 지원 금액과 공고 일정은 공식 기관(LH·SH·지자체 등)의 공고문에서 최종 확인해야 합니다.</div></aside>
    </section>
  );
}

export default SupportPage;
