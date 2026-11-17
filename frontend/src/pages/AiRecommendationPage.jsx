import React, { useState } from "react";

const starterMessages = [
  { role: "assistant", text: "안녕하세요. 이사 지역과 주거 조건을 함께 정리해 드릴게요. 예산, 통근 위치, 꼭 필요한 생활 조건부터 알려주세요." },
  { role: "assistant", text: "현재 입력된 조건을 기준으로는 대전 유성구, 충남 아산시, 광주 북구를 우선 비교해 볼 수 있어요." },
];

const quickQuestions = ["월세 70만원 이하 지역 추천", "재택근무하기 좋은 지역", "청년 월세 지원 받을 수 있을까?"];

function AiRecommendationPage({ budget, onBack }) {
  const [messages, setMessages] = useState(starterMessages);
  const [input, setInput] = useState("");

  const sendMessage = (message = input) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    setMessages((items) => [
      ...items,
      { role: "user", text: trimmedMessage },
      { role: "assistant", text: `입력해 주신 “${trimmedMessage}” 조건을 반영해 볼게요. 월세 ${budget}만원 이하, 통근 시간, 생활 인프라 우선순위를 함께 비교하면 더 정확한 지역 추천이 가능합니다.` },
    ]);
    setInput("");
  };

  return (
    <section className="ai-recommendation-page">
      <style>{`
        .ai-recommendation-page{width:100%;max-width:1540px;margin:0 auto;color:#18352e}.ai-recommendation-head{display:flex;justify-content:space-between;align-items:end;gap:24px;margin-bottom:24px}.ai-recommendation-kicker{margin:0 0 8px;color:#008b70;font-size:14px;font-weight:900;letter-spacing:.08em}.ai-recommendation-head h1{margin:0;font-size:clamp(32px,3vw,48px);letter-spacing:-.07em}.ai-recommendation-head h1 b{color:#008b70}.ai-recommendation-head p{margin:12px 0 0;color:#688078;font-size:15px}.ai-back-button{padding:11px 16px;border:1px solid #a5d5c8;border-radius:8px;background:#fff;color:#087e68;font-weight:800;white-space:nowrap}.ai-layout{display:grid;grid-template-columns:310px minmax(0,1fr);min-height:590px;border:1px solid #d8e9e3;border-radius:18px;background:#fff;overflow:hidden}.ai-context{padding:26px;border-right:1px solid #dcebe6;background:linear-gradient(160deg,#f5fcf9,#e7f7f0)}.ai-context-logo{display:grid;place-items:center;width:45px;height:45px;border-radius:13px;background:#008b70;color:#fff;font-size:21px;font-weight:900}.ai-context h2{margin:18px 0 8px;font-size:22px}.ai-context>p{margin:0;color:#617b73;font-size:13px;line-height:1.6}.ai-profile{margin-top:24px;padding:18px;border:1px solid #cee7de;border-radius:13px;background:#fff}.ai-profile span{display:block;color:#79938b;font-size:11px}.ai-profile b{display:block;margin-top:6px;font-size:15px}.ai-profile ul{display:grid;gap:9px;margin:15px 0 0;padding:0;list-style:none}.ai-profile li{display:flex;justify-content:space-between;color:#607a72;font-size:12px}.ai-profile li strong{color:#1f4a40}.ai-tips{margin-top:22px}.ai-tips h3{margin:0 0 11px;font-size:14px}.ai-tips button{display:block;width:100%;margin-top:8px;padding:11px;border:1px solid #cce5dc;border-radius:8px;background:#fff;color:#397165;text-align:left;font-size:12px}.ai-chat{display:flex;min-width:0;flex-direction:column;background:#fff}.ai-chat-header{display:flex;justify-content:space-between;align-items:center;padding:21px 25px;border-bottom:1px solid #e2eeea}.ai-chat-header b{font-size:17px}.ai-status{display:flex;align-items:center;gap:7px;color:#168a73;font-size:12px;font-weight:800}.ai-status i{width:8px;height:8px;border-radius:50%;background:#19a885}.ai-message-list{display:flex;flex:1;flex-direction:column;gap:14px;min-height:0;overflow:auto;padding:27px}.ai-message{display:flex;gap:10px;max-width:min(78%,650px)}.ai-message.user{align-self:flex-end;flex-direction:row-reverse}.ai-avatar{display:grid;place-items:center;width:31px;height:31px;flex:none;border-radius:10px;background:#e4f6ef;color:#008b70;font-size:14px;font-weight:900}.ai-message.user .ai-avatar{background:#e8eef0;color:#54706a}.ai-bubble{padding:13px 15px;border-radius:4px 14px 14px 14px;background:#f1faf6;color:#31564d;font-size:14px;line-height:1.6}.ai-message.user .ai-bubble{border-radius:14px 4px 14px 14px;background:#008b70;color:#fff}.ai-composer{padding:18px 25px 23px;border-top:1px solid #e2eeea}.ai-composer form{display:flex;gap:10px;padding:8px 8px 8px 15px;border:1px solid #b9dbd0;border-radius:11px;background:#fff}.ai-composer input{min-width:0;flex:1;border:0;outline:0;color:#24463d;font-size:14px}.ai-composer button{width:42px;height:42px;border:0;border-radius:8px;background:#008b70;color:#fff;font-size:18px}.ai-composer small{display:block;margin-top:10px;color:#82978f;font-size:11px}@media(max-width:900px){.ai-layout{grid-template-columns:1fr}.ai-context{border-right:0;border-bottom:1px solid #dcebe6}.ai-profile,.ai-tips{display:none}.ai-chat{min-height:540px}}@media(max-width:700px){.ai-recommendation-head{display:block}.ai-back-button{margin-top:15px}.ai-layout{margin:0 -2px;border-radius:13px}.ai-context{padding:20px}.ai-context h2{margin-top:10px}.ai-message-list{padding:20px}.ai-message{max-width:90%}.ai-composer{padding:14px}.ai-recommendation-head h1{font-size:34px}}
      `}</style>
      <style>{`.ai-recommendation-page{margin-top:-42px}.ai-recommendation-head{margin-bottom:18px}.ai-layout{height:600px;min-height:0}.ai-chat{height:100%;min-height:0;overflow:hidden}.ai-message-list{min-height:0;overflow-y:auto}.ai-composer button{width:auto;padding:0 14px;font-size:13px;font-weight:800}@media(max-width:900px){.ai-recommendation-page{margin-top:-15px}.ai-layout{height:620px}.ai-chat{min-height:0}}`}</style>
      <header className="ai-recommendation-head"><div><p className="ai-recommendation-kicker">AI HOUSING ASSISTANT</p><h1>대화로 찾는 <b>나만의 이사 지역</b></h1><p>복잡한 조건을 하나씩 말해 주시면, 비교 기준과 다음 행동을 함께 정리해 드립니다.</p></div><button className="ai-back-button" type="button" onClick={onBack}>조건 직접 입력하기</button></header>
      <div className="ai-layout">
        <aside className="ai-context"><div className="ai-context-logo">AI</div><h2>주거 추천 도우미</h2><p>예산, 통근, 생활 환경, 청년 지원 정책을 대화로 비교해 보세요.</p><section className="ai-profile"><span>현재 반영한 조건</span><b>청년 1인 가구</b><ul><li><span>월세 예산</span><strong>{budget}만원 이하</strong></li><li><span>탐색 범위</span><strong>전국</strong></li><li><span>우선 조건</span><strong>주거비 · 교통</strong></li></ul></section><section className="ai-tips"><h3>이렇게 물어보세요</h3>{quickQuestions.map((question) => <button type="button" key={question} onClick={() => sendMessage(question)}>{question}</button>)}</section></aside>
        <section className="ai-chat"><header className="ai-chat-header"><b>AI 추천 상담</b><span className="ai-status"><i />상담 준비 완료</span></header><div className="ai-message-list">{messages.map((message, index) => <article className={`ai-message ${message.role}`} key={`${message.role}-${index}`}><i className="ai-avatar">{message.role === "assistant" ? "AI" : "나"}</i><div className="ai-bubble">{message.text}</div></article>)}</div><footer className="ai-composer"><form onSubmit={(event) => { event.preventDefault(); sendMessage(); }}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="예: 대전에서 월세 60만원 이하, 역과 가까운 곳을 찾고 있어요" /><button type="submit" aria-label="메시지 보내기">전송</button></form><small>현재는 데모 응답입니다. 실제 서비스에서는 공공 주거·교통·생활 데이터와 연결됩니다.</small></footer></section>
      </div>
    </section>
  );
}

export default AiRecommendationPage;
