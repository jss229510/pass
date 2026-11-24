import React, { useState } from "react";

const guideSteps = [
  [
    "01",
    "매물 조건 입력",
    "월세 예산, 희망 지역, 방 형태와 통근 조건을 입력해요.",
  ],
  [
    "02",
    "추천 매물 비교",
    "같은 지역 안에서 보증금, 월세, 관리비와 생활 환경을 비교해요.",
  ],
  [
    "03",
    "지원 혜택 확인",
    "청년 월세 지원, LH·SH 청약, 지역 이사 지원을 확인해요.",
  ],
  [
    "04",
    "계약 전 점검",
    "계약서 조항, 필요 서류, HUG 보증 가능 여부를 확인해요.",
  ],
];
const warnings = [
  "계약금·보증금 지급 전 등기부등본과 선순위 권리를 확인하세요.",
  "보증 가능 여부와 지원 자격은 반드시 공식 기관에서 최종 확인하세요.",
  "계약서 특약은 모호한 표현 없이 구체적으로 작성하세요.",
];

function GuidePage() {
  const [openIndex, setOpenIndex] = useState(null);
  return (
    <section className="guide-page">
      <style>{`
    .guide-page{width:100%;max-width:1540px;margin:0 auto;color:var(--color-text)}.guide-hero{display:grid;grid-template-columns:1fr .75fr;align-items:center;min-height:290px;gap:35px}.guide-kicker{margin:0 0 12px;color:var(--color-primary-strong);font-size:14px;font-weight:900;letter-spacing:.08em}.guide-hero h1{margin:0;font-size:clamp(42px,4vw,64px);line-height:1.1;letter-spacing:-.07em}.guide-hero h1 b{color:var(--color-primary-strong)}.guide-hero p{margin:20px 0 0;color:var(--color-text-muted);font-size:17px;line-height:1.6}.guide-visual{display:grid;place-items:center;min-height:210px;border-radius:50% 50% 12% 12%;background:linear-gradient(145deg,var(--color-surface-soft),var(--color-background))}.guide-visual svg{width:min(100%,360px);height:210px}.guide-section{margin-top:24px}.guide-section h2{margin:0 0 17px;font-size:24px}.guide-step-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:15px}.guide-step{padding:22px;border:1px solid var(--color-background);border-radius:14px;background:#fff}.guide-step strong{display:block;color:var(--color-primary-strong);font-size:13px}.guide-step h3{margin:15px 0 8px;font-size:19px}.guide-step p{margin:0;color:var(--color-text-muted);font-size:13px;line-height:1.55}.guide-warning{padding:23px;border-radius:15px;background:var(--color-accent-soft)}.guide-warning h2{color:#79561b}.guide-warning ul{display:grid;gap:12px;margin:0;padding:0;list-style:none}.guide-warning li{display:flex;gap:10px;color:#705c35;font-size:14px;line-height:1.5}.guide-warning li:before{content:"!";display:grid;place-items:center;width:20px;height:20px;flex:none;border-radius:50%;background:#f2c766;color:#fff;font-weight:900}.guide-faq{border:1px solid var(--color-background);border-radius:15px;background:#fff;overflow:hidden}.guide-faq-item{border-top:1px solid var(--color-background)}.guide-faq-item:first-child{border-top:0}.guide-faq-question{display:flex;justify-content:space-between;width:100%;padding:18px 21px;border:0;background:#fff;color:var(--color-text);text-align:left;font-size:15px;font-weight:800}.guide-faq-question span:last-child{color:var(--color-primary-strong);transition:transform .2s}.guide-faq-question[aria-expanded="true"] span:last-child{transform:rotate(180deg)}.guide-faq-answer{max-height:0;overflow:hidden;padding:0 21px;color:var(--color-text-muted);font-size:13px;line-height:1.6;transition:max-height .25s ease,padding .25s ease}.guide-faq-answer.open{max-height:100px;padding:0 21px 17px}.guide-cta{display:flex;justify-content:space-between;align-items:center;margin-top:25px;padding:25px 28px;border-radius:15px;background:linear-gradient(100deg,var(--color-background),var(--color-surface-soft))}.guide-cta h2{margin:0;font-size:23px}.guide-cta p{margin:7px 0 0;color:var(--color-text-muted);font-size:13px}.guide-cta button{padding:13px 19px;border:0;border-radius:8px;background:var(--color-primary-strong);color:#fff;font-weight:900}@media(max-width:900px){.guide-hero,.guide-step-grid{grid-template-columns:1fr}.guide-visual{display:none}}@media(max-width:700px){.guide-hero{min-height:auto;padding:16px 0 30px}.guide-hero h1{font-size:42px}.guide-cta{display:block}.guide-cta button{margin-top:16px;width:100%}}
  `}</style>
      <header className="guide-hero">
        <div>
          <p className="guide-kicker">SERVICE GUIDE</p>
          <h1>
            처음이어도 괜찮아요.
            <br />
            <b>집 고르는 과정</b>을 함께할게요.
          </h1>
          <p>
            희망 지역의 매물 탐색부터 월세 계약, 청년 주거지원 신청까지
            <br />
            필요한 순서와 확인할 내용을 안내합니다.
          </p>
        </div>
        <div className="guide-visual">
          <svg viewBox="0 0 360 210" aria-hidden="true">
            <path
              d="M32 180c35-68 84-82 139-45 42-61 118-54 158 11v25H32Z"
              fill="var(--color-border)"
            />
            <path
              d="m78 139 61-54 62 54v44H78Z"
              fill="#fff"
              stroke="var(--color-primary)"
              strokeWidth="7"
            />
            <path
              d="M115 141h25v42h-25zM159 141h22v18h-22z"
              fill="var(--color-border)"
            />
            <path
              d="M226 46h70l14 14-9 119h-82l7-119Z"
              fill="#fff"
              stroke="var(--color-primary)"
              strokeWidth="7"
            />
            <path
              d="m244 94 8 8 16-18m-24 39 8 8 16-18m-24 39 8 8 16-18"
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="5"
            />
          </svg>
        </div>
      </header>
      <section className="guide-section">
        <h2>이렇게 이용해 보세요</h2>
        <div className="guide-step-grid">
          {guideSteps.map(([number, title, description]) => (
            <article className="guide-step" key={number}>
              <strong>{number}</strong>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="guide-section guide-warning">
        <h2>계약 전 꼭 기억하세요</h2>
        <ul>
          {warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      </section>
      <section className="guide-section">
        <h2>자주 묻는 질문</h2>
        <div className="guide-faq">
          {[
            [
              "HUG 보증 가능 여부는 어디서 확인하나요?",
              "주택 주소와 보증금, 선순위 권리 등을 기준으로 HUG 공식 채널에서 확인해야 합니다.",
            ],
            [
              "지역별 청년 혜택은 어떻게 찾나요?",
              "선택한 매물 지역의 지자체 공고와 청년정책 포털을 함께 확인하고, 공고별 자격 조건을 비교하세요.",
            ],
            [
              "계약서를 올리면 바로 계약해도 되나요?",
              "서류 검토 결과는 확인 보조 정보입니다. 계약 전 공인중개사·공식 기관 안내를 포함해 최종 검토하세요.",
            ],
          ].map(([question, answer], index) => (
            <article className="guide-faq-item" key={question}>
              <button
                className="guide-faq-question"
                type="button"
                aria-expanded={openIndex === index}
                onClick={() =>
                  setOpenIndex((open) => (open === index ? null : index))
                }
              >
                <span>{question}</span>
              </button>
              <div
                className={`guide-faq-answer ${openIndex === index ? "open" : ""}`}
              >
                {answer}
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

export default GuidePage;
