import React, { useState } from "react";

function DocumentIcon({ type }) {
  const paths = {
    id: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8" cy="12" r="2" /><path d="M12 10h6M12 14h6" /></>,
    resident: <><circle cx="12" cy="8" r="3" /><path d="M5 21c.8-4.2 3.1-6 7-6s6.2 1.8 7 6M4 3h16v18H4" /></>,
    contract: <><path d="M7 3h8l3 3v15H7V3Z" /><path d="M15 3v4h4M10 12h5M10 16h5" /><path d="m9 9 1 1 2-2" /></>,
    income: <><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" /></>,
    bank: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 9h18M7 15h4" /></>,
  };

  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[type]}</svg>;
}

const documents = [
  ["신분 확인 서류", "주민등록증, 운전면허증, 여권 등", <DocumentIcon type="id" />],
  ["주민등록등본", "주소지 및 세대원 확인용", <DocumentIcon type="resident" />],
  ["임대차계약서", "보증금, 월세, 계약기간 등 필수 기재사항 확인", <DocumentIcon type="contract" />],
  ["소득 증빙 서류", "근로소득 원천징수영수증, 소득금액증명원 등", <DocumentIcon type="income" />],
  ["통장 사본", "지원금 수령 계좌 확인용", <DocumentIcon type="bank" />],
];

function DocumentsPage({ onNotify }) {
  const [checked, setChecked] = useState([true, false, false, false, false]);

  const toggleChecked = (index) => {
    setChecked((items) => items.map((item, itemIndex) => itemIndex === index ? !item : item));
  };

  return (
    <section className="document-review">
      <style>{`
        .document-review{width:100%;max-width:1540px;margin:0 auto;color:#14233b}.document-hero{display:grid;grid-template-columns:1.05fr .75fr;min-height:280px;align-items:center;gap:35px}.document-kicker{margin:0 0 12px;color:#008b70;font-size:14px;font-weight:900;letter-spacing:.08em}.document-hero h1{margin:0;font-size:clamp(42px,4.1vw,65px);line-height:1.1;letter-spacing:-.07em}.document-hero h1 b{color:#008b70}.document-hero p{margin:22px 0 0;color:#5d6c7c;font-size:17px;line-height:1.6}.document-visual{display:grid;place-items:center}.document-visual svg{width:min(100%,420px);height:245px}.document-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:24px}.upload-zone{display:grid;place-items:center;min-height:350px;padding:35px;border:2px dashed #9cddca;border-radius:17px;background:linear-gradient(145deg,#fbfffe,#edf9f5);text-align:center}.upload-icon{display:grid;place-items:center;width:66px;height:66px;border-radius:50%;background:#e3f8f0;color:#008b70;font-size:35px}.upload-zone h2{margin:18px 0 8px;font-size:24px}.upload-zone p{margin:0;color:#687d78;font-size:14px;line-height:1.6}.upload-zone button,.save-checklist{margin-top:20px;padding:12px 17px;border:0;border-radius:8px;background:#008b70;color:#fff;font-weight:900}.upload-hint{display:flex;gap:13px;flex-wrap:wrap;justify-content:center;margin-top:22px;color:#71827e;font-size:11px}.document-benefits{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:15px}.document-benefit{padding:17px;border:1px solid #dbeae5;border-radius:13px;background:#fff}.document-benefit i{color:#008b70;font-size:21px;font-style:normal}.document-benefit b,.document-benefit p{display:block}.document-benefit b{margin-top:9px;font-size:13px}.document-benefit p{margin:5px 0 0;color:#6c827c;font-size:11px;line-height:1.45}.document-checklist{padding:26px;border:1px solid #d8e8e3;border-radius:17px;background:#fff}.document-checklist-head{display:flex;justify-content:space-between;gap:15px;align-items:start}.document-checklist h2{margin:0;font-size:22px}.document-checklist-head button{border:0;background:transparent;color:#008b70;font-size:12px;font-weight:900}.document-item{display:flex;gap:13px;align-items:center;padding:15px 0;border-bottom:1px solid #e7efec}.document-item input{accent-color:#008b70}.document-item i{display:grid;place-items:center;width:33px;height:33px;border-radius:9px;background:#e8f8f2;color:#008b70;font-style:normal}.document-item span span{display:block;margin-top:4px;color:#71827d;font-size:11px}.review-history{display:flex;gap:16px;align-items:center;margin-top:24px;padding:19px 22px;border-radius:14px;background:#f2faf7}.review-history h3{margin:0;font-size:14px}.review-file{display:grid;gap:4px;flex:1;font-size:12px}.review-file span{color:#71817c}.review-status{padding:6px 9px;border-radius:999px;background:#dff6ed;color:#008b70;font-size:11px;font-weight:900}.review-history button{border:0;background:transparent;color:#008b70;font-weight:900}@media(max-width:900px){.document-hero,.document-grid{grid-template-columns:1fr}.document-visual{display:none}}@media(max-width:700px){.document-hero{min-height:auto;padding:15px 0 35px}.document-hero h1{font-size:42px}.document-benefits{grid-template-columns:1fr}.document-checklist{padding:20px}.review-history{display:block}.review-history>*{margin:7px 0}}
      `}</style>
      <header className="document-hero"><div><p className="document-kicker">CONTRACT & DOCUMENT CHECK</p><h1>계약서와 신청 서류를<br />계약 전에 <b>점검하세요.</b></h1><p>계약서를 업로드하면 AI가 주요 항목을 분석하고, 누락된 내용이나<br />주의해야 할 조항을 알려드려요. 청년 지원 신청 서류도 함께 확인할 수 있어요.</p></div><div className="document-visual"><svg viewBox="0 0 420 250" aria-hidden="true"><path d="M46 202c42-74 108-110 184-84 56-56 133-41 161 15v50H46Z" fill="#e3f7f0" /><path d="M254 43h99l20 20-13 145H226l13-145Z" fill="#fff" stroke="#7fd5bd" strokeWidth="7" /><path d="M273 90h65M273 119h65M273 148h48" stroke="#c3e5da" strokeWidth="8" strokeLinecap="round" /><path d="m246 90 8 8 14-16m-22 38 8 8 14-16m-22 38 8 8 14-16" stroke="#38b98d" strokeWidth="5" fill="none" /><path d="m101 162 58-49 57 49v52h-115Z" fill="#fff" stroke="#008b70" strokeWidth="7" /><circle cx="307" cy="176" r="40" fill="#fff" stroke="#008b70" strokeWidth="9" /><path d="m288 176 12 12 24-28" stroke="#008b70" strokeWidth="8" fill="none" strokeLinecap="round" /></svg></div></header>
      <div className="document-grid"><div><section className="upload-zone"><span className="upload-icon">⇧</span><h2>계약서 또는 서류 올리기</h2><p>이미지(PNG, JPG) 또는 PDF 파일을 업로드하면<br />계약 내용과 주요 항목을 자동으로 확인해 드려요.</p><button type="button" onClick={() => onNotify("목업 화면입니다. 실제 파일은 업로드되지 않습니다.")}>▱　파일 선택</button><div className="upload-hint"><span><b>지원 형식</b>　PDF, JPG, PNG</span><span><b>최대 용량</b>　20MB</span><span>여러 파일 업로드 가능</span></div></section><section className="document-benefits"><article className="document-benefit"><i>⌑</i><b>계약서 AI 분석</b><p>계약 내용을 요약하고 주의 조항을 알려드려요.</p></article><article className="document-benefit"><i>✓</i><b>서류 누락 확인</b><p>신청에 필요한 서류가 모두 준비됐는지 점검해요.</p></article><article className="document-benefit"><i>♢</i><b>정책 자격 연계</b><p>업로드한 정보로 신청 가능한 청년 지원을 안내해요.</p></article></section></div><section className="document-checklist"><div className="document-checklist-head"><h2>월세 계약·청년 지원 체크리스트</h2><button type="button" onClick={() => onNotify("정책별 필요 서류 안내를 준비하고 있습니다.")}>▣　필요 서류 안내 보기</button></div>{documents.map(([name, description, icon], index) => <label className="document-item" key={name}><input type="checkbox" checked={checked[index]} onChange={() => toggleChecked(index)} /><i>{icon}</i><span><b>{name}</b><span>{description}</span></span></label>)}<button className="save-checklist" type="button" onClick={() => onNotify("서류 준비 상태를 저장했습니다.")}>◉　준비 상태 저장</button></section></div>
      <footer className="review-history"><h3>◷　최근 검토한 내역</h3><div className="review-file"><b>임대차계약서_대전유성구.pdf</b><span>2026.11.17 · 계약서 AI 분석 완료</span></div><span className="review-status">분석 완료</span><button type="button">전체 내역 보기　›</button></footer>
    </section>
  );
}

export default DocumentsPage;
