import React from "react";
import MarketPriceSection from "../components/MarketPriceSection";
import maruImage from "../assets/maru-guide-v2.png";
import { formatPrice } from "../utils/marketPrices";
import { useRegionRecommendations } from "../utils/regionRecommendations";

function RecommendedRegions({ recommendations, onNavigate, onOpenRegionSearch }) {
  if (!recommendations) {
    return <div className="area-list" aria-busy="true">{[0, 1, 2].map((index) => <div className="area-card area-card-loading" key={index} />)}</div>;
  }
  const { personalized, items, roomType, dealType } = recommendations;
  return (
    <>
      <p className="candidate-basis">
        {personalized
          ? `내 기본 정보(희망 지역·근무지·예산·중요도) 기준 · ${roomType} ${dealType}`
          : "기본 정보를 입력하면 내 조건에 맞는 지역을 추천해 드려요."}
        {!personalized && <button type="button" className="candidate-basis-link" onClick={() => onNavigate("onboarding")}>기본 정보 입력 →</button>}
      </p>
      <ol className="area-list">
        {items.map(({ region, snapshot, score, reasons }, index) => (
          <li key={region.id}>
            <button className="area-card" type="button" onClick={() => onOpenRegionSearch(region.label)} title="지도에서 보기">
              <span className="area-rank">
                {index + 1}위{score !== null && <em>적합도 {score}점</em>}
              </span>
              <b>{region.label}</b>
              <span className="area-reasons">{reasons.slice(0, 2).join(" · ")}</span>
              <small className="area-price">{roomType} {dealType} {formatPrice(snapshot)}</small>
            </button>
          </li>
        ))}
      </ol>
    </>
  );
}

function FeatureIcon({ type }) {
  if (type === "environment") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s7-4.7 7-11a7 7 0 1 0-14 0c0 6.3 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" /><path d="M17.5 17.2 21 20.5M18.7 19.2l1.8-1.8" /></svg>;
  if (type === "contract") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h5M9 12h6M9 16h3" /><path d="M18.3 17.8a2.3 2.3 0 1 0-3.3 0c-.7.4-1.1 1.1-1.1 1.9" /></svg>;
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16M8.5 15l2.1 2.1 4.5-4.5" /></svg>;
}

function LandingPage({ onStartJourney, onStartAnalysis, onNavigate, onOpenRegionSearch }) {
  const guideSteps = ["조건 입력", "매물 추천", "매물 비교", "계약 점검"];
  // AI 추천 카드와 지역별 시세가 같은 추천 결과를 쓴다.
  const recommendations = useRegionRecommendations();
  const openRegion = onOpenRegionSearch ?? (() => onNavigate("property-map-search"));

  return (
    <section className="housing-landing">
      <style>{`
        .housing-landing{max-width:1200px;margin:0 auto;background:#fff;color:#18262b;overflow:hidden;font-family:Arial,"Noto Sans KR",sans-serif;box-shadow:0 18px 55px rgb(var(--color-primary-rgb) / 0.078)}.housing-landing button{font:inherit;cursor:pointer}.landing-hero{position:relative;min-height:355px;padding:0 7%;overflow:hidden;background:linear-gradient(95deg,var(--color-surface) 0%,var(--color-surface-soft) 45%,var(--color-background) 100%)}.landing-hero:after{content:"";position:absolute;inset:0 0 0 48%;background:linear-gradient(90deg,#ffffff00,rgb(var(--color-primary-rgb) / 0.200) 40%,rgb(var(--color-primary-rgb) / 0.800)),url("https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1100&q=85") center 34%/cover;opacity:.98}.hero-copy{position:relative;z-index:2;width:47%;padding-top:37px}.hero-copy .eyebrow{margin:0 0 8px;color:var(--color-primary-strong);font-weight:700;font-size:14px}.hero-copy h1{margin:0;font-size:39px;line-height:1.13;letter-spacing:-2.8px}.hero-copy h1 b{color:var(--color-primary-strong)}.hero-copy .desc{max-width:390px;margin:20px 0 18px;font-size:13px;line-height:1.65;color:var(--color-text-secondary)}.hero-actions{display:flex;gap:12px}.hero-actions button{height:39px;padding:0 21px;border-radius:7px;font-size:12px;font-weight:700}.hero-actions .start{border:1px solid var(--color-primary);background:var(--color-primary-strong);color:#fff}.hero-actions .outline{border:1px solid var(--color-primary);background:#ffffffc9;color:var(--color-primary-strong)}.map-open-button{position:absolute;z-index:4;top:22px;right:clamp(24px,6vw,110px);border:1px solid var(--color-primary);border-radius:7px;padding:10px 14px;background:#ffffffeb;color:var(--color-primary-strong);font-size:12px;font-weight:800;box-shadow:0 5px 14px rgb(var(--color-primary-rgb) / 0.125)}.map-modal{position:absolute;z-index:3;top:22px;right:calc(clamp(24px,6vw,110px) + 154px);width:440px;overflow:hidden;border-radius:16px;background:#fff;box-shadow:0 24px 60px rgb(var(--color-primary-rgb) / 0.302);animation:map-panel-enter .28s ease-out both}.map-modal-header{display:flex;align-items:center;justify-content:space-between;padding:17px 20px;border-bottom:1px solid var(--color-background)}.map-modal-header b{font-size:16px}.map-modal-close{width:30px;height:30px;border:0;border-radius:50%;background:var(--color-surface-soft);color:var(--color-primary-strong);font-size:20px}.map-search{height:42px;display:flex;align-items:center;gap:9px;padding:0 16px;font-size:12px;color:var(--color-text-muted)}.map-art{height:190px;position:relative;background:linear-gradient(28deg,var(--color-border) 0 17%,transparent 17% 100%),repeating-linear-gradient(48deg,var(--color-border) 0 19px,var(--color-accent-soft) 20px 25px,var(--color-border) 26px 28px);overflow:hidden}.pin{position:absolute;width:19px;height:19px;border-radius:50% 50% 50% 0;background:var(--color-primary);transform:rotate(-45deg)}.pin:after{content:"";position:absolute;width:6px;height:6px;top:6px;left:6px;border-radius:50%;background:#fff}.pin.one{top:62px;left:70px}.pin.two{top:115px;left:242px}.pin.three{top:42px;right:62px}.map-bubble{position:absolute;top:28px;left:92px;min-width:126px;padding:10px 13px;border-radius:8px;background:#fff;box-shadow:0 4px 12px rgb(var(--color-primary-rgb) / 0.200);font-size:11px;color:var(--color-text-secondary)}.map-bubble b{display:block;color:var(--color-text);margin-bottom:2px}.map-result{display:flex;gap:12px;padding:14px}.map-result img{width:82px;height:65px;border-radius:6px;object-fit:cover}.map-result b{font-size:15px}.map-result span{font-size:11px;color:var(--color-text-muted)}@keyframes map-panel-enter{from{opacity:0;transform:translateX(16px) translateY(-6px)}to{opacity:1;transform:translateX(0) translateY(0)}}.landing-content{padding:19px 7% 15px}.content-top{display:grid;grid-template-columns:1.05fr 1fr;gap:38px}.landing-content h2{margin:0 0 11px;font-size:15px;letter-spacing:-1px}.area-list{display:flex;gap:10px}.area-card{display:flex;gap:8px;align-items:center;min-width:0;flex:1;padding:6px;border:1px solid var(--color-background);border-radius:8px}.area-card img{width:54px;height:54px;border-radius:6px;object-fit:cover}.area-card b{display:block;font-size:11px}.area-card span{display:block;margin-top:4px;font-size:9px;line-height:1.35;color:var(--color-text-muted)}.easy-title{display:flex;justify-content:space-between;align-items:center}.easy-title a{font-size:9px;color:var(--color-text-muted)}.easy-list{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.easy-item{display:flex;gap:9px;align-items:center}.easy-icon{display:grid;width:43px;height:43px;place-items:center;flex:none;border-radius:50%;background:var(--color-surface-soft);color:var(--color-primary-strong);font-size:20px}.easy-icon svg{width:23px;height:23px}.easy-item b,.flow-step b{display:block;font-size:11px}.easy-item span,.flow-step span{display:block;margin-top:4px;font-size:9px;line-height:1.35;color:var(--color-text-muted)}.flow-row{display:grid;grid-template-columns:1.1fr repeat(3,1fr);gap:0;align-items:center;margin-top:20px;padding:13px 20px;border-radius:9px;background:linear-gradient(90deg,var(--color-surface-soft),var(--color-surface))}.flow-intro b{font-size:13px}.flow-intro span{display:block;margin-top:4px;font-size:9px;color:var(--color-text-muted)}.flow-step{position:relative;padding-left:18px;border-left:1px solid var(--color-background)}.flow-step:after{content:"→";position:absolute;right:10px;top:7px;color:var(--color-text-muted);font-size:17px}.flow-step:last-child:after{display:none}.bottom-row{display:grid;grid-template-columns:1fr 1.05fr;gap:25px;align-items:start;margin-top:15px}.policy-banner{display:flex;align-items:center;justify-content:space-between;padding:17px 24px;border-radius:10px;background:linear-gradient(105deg,var(--color-surface-soft),var(--color-surface-soft))}.policy-banner .house{font-size:38px;color:var(--color-primary-strong)}.policy-banner b{display:block;color:var(--color-primary-strong);font-size:16px;line-height:1.1}.policy-banner span{display:block;margin-top:6px;font-size:9px;color:var(--color-text-muted)}.policy-banner em{font-style:normal;font-size:34px;color:var(--color-primary-strong)}.faq-head{display:flex;justify-content:space-between;align-items:center}.faq-head span{font-size:9px;color:var(--color-text-muted)}.faq-item{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--color-background);font-size:10px;color:var(--color-text-secondary)}.landing-footer{display:flex;align-items:center;gap:25px;padding:11px 7%;font-size:9px;color:var(--color-text-muted)}.landing-footer strong{font-size:13px;color:var(--color-text)}.landing-footer .copyright{margin-left:auto}@media(max-width:760px){.housing-landing{box-shadow:none}.landing-hero{padding:0 24px;min-height:510px}.landing-hero:after{inset:230px 0 0;background-position:center}.hero-copy{width:100%;padding-top:25px}.hero-copy h1{font-size:34px}.map-open-button{top:16px;right:24px}.map-modal{top:66px;right:24px;width:calc(100% - 48px)}.landing-content{padding:20px 24px}.content-top,.bottom-row{grid-template-columns:1fr;gap:22px}.area-list{overflow:auto}.area-card{min-width:150px}.easy-list{grid-template-columns:1fr}.flow-row{grid-template-columns:1fr;gap:13px}.flow-step{border-left:0;border-top:1px solid var(--color-background);padding:10px 0 0}.flow-step:after{display:none}.landing-footer{flex-wrap:wrap;padding:14px 24px}.landing-footer .copyright{margin-left:0}}
      `}</style>
      <style>{`
        .housing-landing{max-width:none;min-height:calc(100vh - 76px);box-shadow:none}.landing-hero{min-height:510px;padding-left:clamp(36px,8vw,170px);padding-right:clamp(36px,8vw,170px)}.landing-hero:after{inset:0 0 0 49%}.hero-copy{padding-top:76px}.hero-copy .eyebrow{margin-bottom:12px;font-size:17px}.hero-copy h1{font-size:clamp(46px,3.4vw,68px);line-height:1.12}.hero-copy .desc{max-width:520px;margin:26px 0 25px;font-size:16px}.hero-actions{gap:16px}.hero-actions button{height:48px;padding:0 27px;border-radius:8px;font-size:15px}.map-preview{top:108px;width:340px;border-radius:12px}.map-search{height:45px;padding:0 16px;font-size:13px}.map-art{height:155px}.map-result{gap:12px;padding:11px}.map-result img{width:77px;height:62px}.map-result b{font-size:15px}.map-result span{font-size:11px}.map-bubble{top:22px;left:74px;padding:10px 13px;font-size:11px}.pin{width:19px;height:19px}.pin:after{width:6px;height:6px;top:6px;left:6px}.landing-content{padding:32px clamp(36px,8vw,170px) 25px}.content-top{gap:58px}.landing-content h2{margin-bottom:15px;font-size:20px}.area-list{gap:14px}.area-card{gap:10px;padding:8px;border-radius:10px}.area-card img{width:70px;height:70px}.area-card b{font-size:14px}.area-card span{margin-top:6px;font-size:11px}.easy-list{gap:16px}.easy-icon{width:52px;height:52px;font-size:24px}.easy-item{gap:12px}.easy-item b,.flow-step b{font-size:14px}.easy-item span,.flow-step span{margin-top:5px;font-size:11px}.flow-row{margin-top:28px;padding:18px 26px;border-radius:12px}.flow-intro b{font-size:16px}.flow-intro span{font-size:11px}.flow-step{padding-left:24px}.flow-step:after{right:13px;top:12px;font-size:22px}.bottom-row{gap:42px;margin-top:24px}.policy-banner{padding:25px 32px;border-radius:13px}.policy-banner .house{font-size:48px}.policy-banner b{font-size:21px}.policy-banner span{font-size:11px}.policy-banner em{font-size:42px}.faq-head span,.faq-item{font-size:12px}.faq-item{padding:10px 0}.landing-footer{padding:17px clamp(36px,8vw,170px);font-size:11px}.landing-footer strong{font-size:16px}@media(max-width:760px){.housing-landing{min-height:auto}.landing-hero{min-height:545px;padding:0 24px}.hero-copy{padding-top:34px}.hero-copy .eyebrow{font-size:14px}.hero-copy h1{font-size:38px}.hero-copy .desc{font-size:14px}.hero-actions button{height:43px;padding:0 15px;font-size:12px}.map-preview{top:324px;width:calc(100% - 48px)}.landing-content{padding:25px 24px}.landing-content h2{font-size:17px}.area-card img{width:58px;height:58px}.bottom-row{gap:24px}.landing-footer{padding:16px 24px}}
      `}</style>
      <style>{`
        .landing-hero.landing-journey-hero {
          display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(270px, .85fr);
          gap: clamp(24px, 5vw, 76px); align-items: center;
          min-height: 500px; padding: clamp(32px, 5vw, 80px) clamp(24px, 8vw, 170px);
          background: radial-gradient(ellipse at 94% 18%, #dbeafe, transparent 53%), linear-gradient(120deg, #f8fbff, #e8f1ff);
        }
        .landing-journey-hero:after { display: none; }
        .landing-journey-hero .hero-copy { width: auto; padding: 0; }
        .landing-journey-hero .hero-copy h1 { font-size: clamp(35px, 4.5vw, 68px); word-break: keep-all; }
        .landing-journey-hero .hero-copy .desc { line-height: 1.65; word-break: keep-all; }
        .landing-journey-hero .hero-copy h1 b { color: var(--color-primary-strong); }
        .landing-journey-hero .hero-actions .start { background: var(--color-primary-strong); border-color: var(--color-primary-strong); }
        .landing-maru { display: grid; justify-items: center; align-self: stretch; align-content: center; min-width: 0; }
        .landing-maru img { display: block; width: min(100%, 310px); height: clamp(145px, 28vw, 325px); object-fit: contain; filter: drop-shadow(0 10px 14px rgb(var(--color-primary-rgb) / .22)); }
        .landing-maru-card {
          width: min(100%, 380px); text-align: left; padding: 16px 18px; border: 1px solid var(--color-primary-tint);
          border-radius: 14px; background: #fff; box-shadow: 0 8px 25px rgb(var(--color-primary-rgb) / .08);
        }
        .landing-maru-card h2 { margin: 0; color: var(--color-text); font-size: clamp(17px, 2vw, 24px); }
        .landing-maru-card p { margin: 6px 0 12px; color: var(--color-text-secondary); font-size: .9rem; line-height: 1.5; }
        .landing-maru-card .hero-actions button { height: auto; min-height: 42px; padding: 8px 13px; font-size: 14px; }
        @media(max-width: 760px) {
          .landing-hero.landing-journey-hero { grid-template-columns: minmax(0, 1fr); gap: 22px; min-height: auto; }
          .landing-maru { grid-template-columns: minmax(0, .65fr) minmax(0, 1fr); gap: 10px; align-items: center; }
        }
        @media(max-width: 359px) {
          .landing-maru { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="landing-hero landing-journey-hero">
        <div className="hero-copy">
          <p className="eyebrow">이사 여정</p>
          <h1>살 동네를 찾는 날부터,<br /><b>새집에 들어가는 날까지.</b></h1>
          <p className="desc">마루와 통근·예산에 맞는 동네를 찾고, 관심 매물 비교부터 계약·보증 확인, 청년 주거지원과 입주 준비까지 한곳에서 이어가세요.</p>
          <div className="hero-actions">
            <button className="start" type="button" onClick={onStartJourney}>이사 여정 시작하기</button>
          </div>
        </div>
        <div className="landing-maru">
          <img src={maruImage} alt="지도를 들고 안내하는 마루" />
          <div className="landing-maru-card">
            <h2>마루의 AI 맞춤 분석</h2>
            <p>근무지와 원하는 조건을 알려주면, 살펴볼 동네를 지도에서 함께 찾아요.</p>
            <div className="hero-actions">
              <button className="outline" type="button" onClick={onStartAnalysis}>AI 맞춤 분석 시작하기</button>
            </div>
          </div>
        </div>
      </div>
      <main className="landing-content">
        <style>{`.policy-icon{display:grid;place-items:center;width:52px;height:52px;color:var(--color-primary-strong)}.policy-icon svg{width:42px;height:42px}`}</style>
        <div className="content-top">
          <section className="candidate-section">
            <div className="candidate-heading"><h2>AI가 추천한 지역</h2><button className="candidate-shortcut" type="button" onClick={() => onNavigate("property-map-search")}>지도에서 보기</button></div>
            <RecommendedRegions recommendations={recommendations} onNavigate={onNavigate} onOpenRegionSearch={openRegion} />
          </section>
          <section><div className="easy-title"><h2>AI가 이사 결정을 돕는 세 가지</h2></div><div className="easy-list"><div className="easy-item"><i className="easy-icon"><FeatureIcon type="environment" /></i><div><b>주변환경지수 분석</b><span>교통·치안·소음·날씨·편의시설을<br />점수로 비교해요.</span></div></div><div className="easy-item"><i className="easy-icon"><FeatureIcon type="contract" /></i><div><b>계약서 질문 생성</b><span>관리비 등 확인할 질문을<br />계약서 내용에 맞춰 만들어요.</span></div></div><div className="easy-item"><i className="easy-icon"><FeatureIcon type="move" /></i><div><b>입주 계획 정리</b><span>청년지원·필수 서류·입주일까지<br />해야 할 일을 정리해요.</span></div></div></div></section>
        </div>
        <MarketPriceSection onNavigate={onNavigate} recommendations={recommendations} />
        <section className="flow-row">
          <div className="flow-intro"><b>이사 여정 한눈에 보기</b></div>
          <div className="flow-step"><b>동네 찾기</b><span>마루와 통근·예산에 맞는 후보를 골라요.</span></div>
          <div className="flow-step"><b>집 비교하기</b><span>관심 매물의 보증금과 월 지출을 비교해요.</span></div>
          <div className="flow-step"><b>계약부터 입주까지</b><span>보증, 이사 준비와 입주 후 할 일을 챙겨요.</span></div>
        </section>
        <div className="bottom-row"><section className="policy-banner"><span className="policy-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 3 5 6v5c0 4.6 3 8.3 7 10 4-1.7 7-5.4 7-10V6l-7-3Z" /><path d="M8.5 12.5 11 15l4.5-5" /><path d="M3 19h5M16 19h5" /></svg></span><div><b>내가 받을 수 있는<br />청년 주거 혜택을 찾으세요.</b><span>지역별 월세 지원과 LH·SH 청약 정보를 조건에 맞춰 확인해 보세요.</span></div></section><section className="guide-entry"><button className="guide-entry-card" type="button" onClick={() => onNavigate("guide")}><span className="guide-entry-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z" /><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z" /><path d="M7 8h1.5M7 11h1.5M15.5 8H17M15.5 11H17" /></svg></span><div className="guide-entry-body"><b>이용 가이드</b><span>조건 입력부터 계약 전 점검까지,<br />서비스 이용 방법을 단계별로 안내해요.</span><ol className="guide-entry-steps">{guideSteps.map((label, index) => <li key={label}><i>{String(index + 1).padStart(2, "0")}</i>{label}</li>)}</ol></div></button></section></div>
        <style>{`
          .bottom-row{grid-template-columns:1fr 1fr;align-items:start}.bottom-row>section{min-height:166px}.policy-banner{height:166px;justify-content:flex-start;gap:34px}.policy-banner>div{flex:0 1 auto}.bottom-row>section:last-child{padding:0}.candidate-heading{display:flex;align-items:start;justify-content:space-between}.candidate-heading .candidate-shortcut{margin:0;border:0;background:transparent;color:var(--color-primary-strong);font-size:12px;font-weight:800}.candidate-heading .candidate-shortcut:hover{text-decoration:underline}.area-card{font:inherit;text-align:left}.area-card:hover{border-color:var(--color-primary);background:var(--color-surface-soft)}.candidate-section{min-width:0}.candidate-section ol.area-list{margin:0;padding:0;list-style:none}.candidate-section ol.area-list>li{display:flex;flex:1;min-width:0}.candidate-section .area-card{flex-direction:column;align-items:stretch;gap:5px;width:100%;padding:12px 13px;background:#fff}.area-card .area-rank{display:flex;align-items:center;justify-content:space-between;gap:6px;margin:0 0 2px;color:var(--color-primary-strong);font-size:12px;font-weight:900}.area-card .area-rank em{padding:2px 7px;border-radius:999px;background:var(--color-surface-soft);font-style:normal;font-size:11px;font-weight:800}.candidate-section .area-card b{font-size:14px;line-height:1.35;word-break:keep-all}.area-card .area-reasons{margin:0;line-height:1.45;word-break:keep-all}.area-card .area-price{display:block;margin-top:auto;padding-top:6px;border-top:1px solid var(--color-background);color:var(--color-text);font-size:12px;font-weight:800}.area-card-loading{min-height:88px;flex:1;background:var(--color-surface-soft)}.candidate-basis{display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;margin:-6px 0 12px;color:var(--color-text-muted);font-size:12px}.candidate-basis-link{padding:0;border:0;background:transparent;color:var(--color-primary-strong);font-size:12px;font-weight:800}.candidate-basis-link:hover{text-decoration:underline}@media(max-width:760px){.candidate-section ol.area-list>li{min-width:200px}}@media(max-width:760px){.bottom-row>section,.policy-banner{min-height:auto;height:auto}.policy-banner{gap:20px}}
        `}</style>
        <style>{`.guide-entry-card{display:flex;align-items:center;gap:26px;width:100%;height:166px;padding:25px 30px;border:1px solid var(--color-background);border-radius:13px;background:#fff;color:inherit;text-align:left;transition:border-color .2s ease,box-shadow .2s ease,background .2s ease}.guide-entry-card:hover{border-color:var(--color-primary);background:var(--color-surface);box-shadow:0 8px 22px rgb(var(--color-primary-rgb) / 0.071)}.guide-entry-icon{display:grid;place-items:center;flex:none;width:58px;height:58px;border-radius:50%;background:var(--color-surface-soft);color:var(--color-primary-strong)}.guide-entry-icon svg{width:28px;height:28px}.guide-entry-body{flex:1;min-width:0}.guide-entry-body>b{display:block;color:#18262b;font-size:21px;line-height:1.1;letter-spacing:-.5px}.guide-entry-body>span{display:block;margin-top:7px;font-size:11px;line-height:1.5;color:var(--color-text-muted)}.guide-entry-steps{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 0;padding:0;list-style:none}.guide-entry-steps li{display:flex;align-items:center;gap:5px;padding:4px 9px;border-radius:999px;background:var(--color-surface-soft);color:var(--color-text-secondary);font-size:11px}.guide-entry-steps i{font-style:normal;font-weight:800;color:var(--color-primary-strong);font-size:10px}.guide-entry-arrow{display:grid;place-items:center;flex:none;width:38px;height:38px;border-radius:50%;background:var(--color-surface-soft);color:var(--color-primary-strong);font-size:18px;transition:transform .2s ease,background .2s ease,color .2s ease}.guide-entry-card:hover .guide-entry-arrow{transform:translateX(3px);background:var(--color-primary-strong);color:#fff}.guide-entry-card:focus-visible{outline:2px solid var(--color-primary);outline-offset:2px}@media(max-width:760px){.guide-entry-card{height:auto;gap:16px;padding:20px}.guide-entry-icon{width:48px;height:48px}.guide-entry-body>b{font-size:18px}.guide-entry-arrow{display:none}}`}</style>
      </main>
      <footer className="landing-footer"><strong>LOGO</strong><span>이용약관　 개인정보처리방침　 고객센터</span><span className="copyright">© 2026 LOGO. All rights reserved.</span></footer>
    </section>
  );
}

export default LandingPage;
