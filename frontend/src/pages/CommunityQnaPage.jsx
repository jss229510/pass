import React, { useMemo, useState } from "react";

const categories = ["전체", "지역·매물", "계약·보증", "청년 지원", "이사 준비"];

const initialQuestions = [
  {
    id: 8,
    category: "계약·보증",
    title: "HUG 보증보험 가입 거절되면 계약금 돌려받을 수 있나요?",
    body: "계약서에 보증보험 가입 불가 시 계약 해제 특약을 넣으려고 하는데, 문구를 어떻게 써야 하는지 궁금합니다.",
    author: "이사준비중",
    date: "2026.11.17",
    helpful: 24,
    answers: [
      { author: "운영팀", official: true, text: "'임차인의 전세보증금 반환보증 가입이 불가한 경우 본 계약은 무효로 하며, 임대인은 계약금 전액을 즉시 반환한다'처럼 조건과 반환 시점을 구체적으로 적는 것이 좋아요. 최종 문구는 공인중개사와 함께 확인하세요." },
      { author: "성수동새내기", text: "저도 같은 특약 넣었는데 중개사분이 먼저 문구를 제안해 주셨어요. 계약 전에 꼭 요청해 보세요." },
    ],
  },
  {
    id: 7,
    category: "청년 지원",
    title: "청년 월세 지원이랑 지자체 이사비 지원 같이 받을 수 있나요?",
    body: "서울로 이직하면서 이사하게 됐는데 두 가지 지원을 중복으로 신청 가능한지 알고 싶어요.",
    author: "판교출근러",
    date: "2026.11.16",
    helpful: 18,
    answers: [
      { author: "운영팀", official: true, text: "정책마다 중복 수혜 제한 조건이 달라요. 지원 공고의 '중복 지원 제한' 항목을 확인하고, 애매하면 해당 지자체 담당 부서에 문의하는 것이 가장 정확합니다." },
    ],
  },
  {
    id: 6,
    category: "지역·매물",
    title: "강남 출근이면 성수랑 왕십리 중에 어디가 더 나을까요?",
    body: "월세 예산 70만 원 정도이고 통근 40분 이내를 원해요. 실제로 살아보신 분들 의견 궁금합니다.",
    author: "통근40분",
    date: "2026.11.15",
    helpful: 11,
    answers: [
      { author: "왕십리3년차", text: "왕십리는 환승 노선이 많아서 출근 경로 선택지가 넓어요. 대신 역 근처는 저녁에 조금 시끄러운 편입니다." },
      { author: "성수거주", text: "성수는 생활 인프라는 좋은데 같은 예산이면 방 크기가 작아지는 편이에요. 지역 비교 화면에서 두 곳 점수 비교해 보시는 것도 추천해요." },
    ],
  },
  {
    id: 5,
    category: "이사 준비",
    title: "전입신고는 이사 당일에 꼭 해야 하나요?",
    body: "입주일이 금요일이라 주말이 끼는데, 월요일에 해도 괜찮을지 궁금해요.",
    author: "첫자취",
    date: "2026.11.14",
    helpful: 9,
    answers: [
      { author: "운영팀", official: true, text: "전입신고는 이사 후 14일 이내에 하면 되지만, 대항력은 전입신고 다음 날 0시부터 생기기 때문에 가능한 한 빨리 하는 것이 안전해요. 정부24에서 온라인 신고도 가능합니다." },
    ],
  },
  {
    id: 4,
    category: "계약·보증",
    title: "등기부등본에서 근저당 금액이 어느 정도면 위험한가요?",
    body: "매물 등기부를 떼 봤는데 근저당이 잡혀 있어요. 보증금이랑 합쳐서 어느 정도면 피해야 할까요?",
    author: "꼼꼼체크",
    date: "2026.11.12",
    helpful: 31,
    answers: [],
  },
  {
    id: 3,
    category: "청년 지원",
    title: "LH 청년 매입임대 신청할 때 소득 기준은 세전인가요?",
    body: "공고문에 월평균 소득 기준이 있는데 세전 기준인지 세후 기준인지 헷갈립니다.",
    author: "청약도전",
    date: "2026.11.10",
    helpful: 7,
    answers: [
      { author: "작년당첨자", text: "제가 신청했을 때는 세전 기준으로 계산했어요. 다만 공고마다 다를 수 있으니 공고문 소득 산정 기준을 꼭 확인하세요." },
    ],
  },
  {
    id: 2,
    category: "이사 준비",
    title: "포장이사 견적은 보통 몇 군데 받아보시나요?",
    body: "원룸에서 투룸으로 옮기는데 견적 차이가 너무 커서 고민이에요.",
    author: "짐많은편",
    date: "2026.11.08",
    helpful: 5,
    answers: [],
  },
];

function maskAuthor(name) {
  return name.length <= 2 ? `${name[0]}*` : `${name.slice(0, 2)}${"*".repeat(Math.min(name.length - 2, 3))}`;
}

function CommunityQnaPage({ onNavigate, onNotify }) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [category, setCategory] = useState("전체");
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState("latest");
  const [openId, setOpenId] = useState(null);
  const [helpedIds, setHelpedIds] = useState([]);
  const [isWriting, setIsWriting] = useState(false);
  const [draft, setDraft] = useState({ category: categories[1], title: "", body: "" });

  const visibleQuestions = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    const filtered = questions.filter((question) => {
      const matchesCategory = category === "전체" || question.category === category;
      const matchesKeyword = !query || `${question.title} ${question.body}`.toLowerCase().includes(query);
      return matchesCategory && matchesKeyword;
    });
    return [...filtered].sort((a, b) => (sort === "helpful" ? b.helpful - a.helpful : b.id - a.id));
  }, [questions, category, keyword, sort]);

  const toggleHelpful = (id) => {
    const alreadyHelped = helpedIds.includes(id);
    setHelpedIds((ids) => (alreadyHelped ? ids.filter((value) => value !== id) : [...ids, id]));
    setQuestions((list) => list.map((question) => (question.id === id ? { ...question, helpful: question.helpful + (alreadyHelped ? -1 : 1) } : question)));
  };

  const submitQuestion = (event) => {
    event.preventDefault();
    if (!draft.title.trim() || !draft.body.trim()) {
      onNotify("질문 제목과 내용을 모두 입력해 주세요.");
      return;
    }
    const today = new Date();
    const date = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;
    const nextId = Math.max(...questions.map((question) => question.id)) + 1;
    setQuestions((list) => [{ id: nextId, category: draft.category, title: draft.title.trim(), body: draft.body.trim(), author: "나", date, helpful: 0, answers: [] }, ...list]);
    setDraft({ category: categories[1], title: "", body: "" });
    setIsWriting(false);
    setCategory("전체");
    setKeyword("");
    setSort("latest");
    setOpenId(nextId);
    onNotify("질문이 등록되었어요. 목업 화면이라 새로고침하면 사라집니다.");
  };

  return (
    <section className="qna-page">
      <style>{`
        .qna-page{width:100%;max-width:1540px;margin:0 auto;color:#17342e}
        .qna-page button{font:inherit;cursor:pointer}
        .qna-back{display:inline-flex;align-items:center;gap:6px;margin-top:8px;padding:0;border:0;background:transparent;color:#5f7a72;font-size:13px;font-weight:800}
        .qna-back:hover{color:#008b70}
        .qna-hero{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;padding:26px 0 30px}
        .qna-kicker{margin:0 0 12px;color:#008b70;font-size:14px;font-weight:900;letter-spacing:.08em}
        .qna-hero h1{margin:0;font-size:clamp(36px,3.4vw,54px);line-height:1.12;letter-spacing:-.06em}
        .qna-hero h1 b{color:#008b70}
        .qna-hero p{margin:16px 0 0;color:#647680;font-size:16px;line-height:1.6}
        .qna-write-button{flex:none;padding:13px 20px;border:0;border-radius:8px;background:#008b70;color:#fff;font-size:14px;font-weight:900}
        .qna-write-button:hover{background:#007a63}
        .qna-form{display:grid;gap:12px;margin-bottom:22px;padding:22px;border:1px solid #cfe6de;border-radius:15px;background:linear-gradient(145deg,#fbfffd,#eef9f5)}
        .qna-form-row{display:grid;grid-template-columns:180px 1fr;gap:12px}
        .qna-form select,.qna-form input,.qna-form textarea{width:100%;padding:12px;border:1px solid #d4e3de;border-radius:8px;background:#fff;color:#24463c;font:inherit;font-size:14px}
        .qna-form textarea{min-height:110px;resize:vertical}
        .qna-form-actions{display:flex;justify-content:flex-end;gap:8px}
        .qna-form-actions button{padding:11px 18px;border-radius:8px;font-size:13px;font-weight:900}
        .qna-form-actions .cancel{border:1px solid #cfe0da;background:#fff;color:#5c766e}
        .qna-form-actions .submit{border:0;background:#008b70;color:#fff}
        .qna-toolbar{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:14px}
        .qna-chips{display:flex;flex-wrap:wrap;gap:8px}
        .qna-chip{padding:8px 14px;border:1px solid #dceae5;border-radius:999px;background:#fff;color:#4c665e;font-size:13px;font-weight:800}
        .qna-chip:hover{border-color:#83cdbb}
        .qna-chip.active{border-color:#008b70;background:#008b70;color:#fff}
        .qna-tools{display:flex;align-items:center;gap:10px}
        .qna-search{width:240px;padding:9px 13px;border:1px solid #dceae5;border-radius:8px;background:#fff;color:#24463c;font:inherit;font-size:13px}
        .qna-search:focus,.qna-form select:focus,.qna-form input:focus,.qna-form textarea:focus{outline:2px solid #9fdccb;border-color:#36ae99}
        .qna-sort{display:flex;padding:3px;border-radius:8px;background:#eef6f3}
        .qna-sort button{padding:6px 11px;border:0;border-radius:6px;background:transparent;color:#6b827b;font-size:12px;font-weight:800}
        .qna-sort button.active{background:#fff;color:#008b70;box-shadow:0 1px 4px #174b3b1a}
        .qna-list{border:1px solid #dceae5;border-radius:15px;background:#fff;overflow:hidden}
        .qna-item{border-top:1px solid #e6efec}
        .qna-item:first-child{border-top:0}
        .qna-question{display:block;width:100%;padding:19px 22px;border:0;background:#fff;color:inherit;text-align:left}
        .qna-question:hover{background:#f9fdfb}
        .qna-badges{display:flex;gap:6px;margin-bottom:9px}
        .qna-badge{padding:3px 8px;border-radius:5px;background:#f1f8f6;color:#4c605d;font-size:11px;font-weight:800}
        .qna-badge.done{background:#e3f6ef;color:#008b70}
        .qna-badge.wait{background:#fff4dc;color:#9a6c12}
        .qna-title-row{display:flex;justify-content:space-between;gap:16px}
        .qna-title-row b{font-size:16px;line-height:1.45;color:#22433a}
        .qna-title-row i{flex:none;color:#008b70;font-style:normal;transition:transform .2s}
        .qna-question[aria-expanded="true"] .qna-title-row i{transform:rotate(180deg)}
        .qna-preview{margin:6px 0 0;color:#6b817a;font-size:13px;line-height:1.55;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .qna-question[aria-expanded="true"] .qna-preview{white-space:normal}
        .qna-meta{display:flex;flex-wrap:wrap;gap:12px;margin-top:10px;color:#8a9b97;font-size:12px}
        .qna-detail{padding:0 22px 20px}
        .qna-answer{margin-top:10px;padding:15px 17px;border-radius:11px;background:#f5faf8}
        .qna-answer.official{background:#eaf8f3;border:1px solid #cdebe0}
        .qna-answer-author{display:flex;align-items:center;gap:6px;margin-bottom:6px;color:#3d5e55;font-size:13px;font-weight:900}
        .qna-answer-author em{padding:2px 6px;border-radius:4px;background:#008b70;color:#fff;font-size:10px;font-style:normal}
        .qna-answer p{margin:0;color:#557069;font-size:13px;line-height:1.65}
        .qna-no-answer{margin-top:10px;padding:15px 17px;border-radius:11px;background:#fafcfb;color:#8a9b97;font-size:13px}
        .qna-helpful{display:inline-flex;align-items:center;gap:6px;margin-top:13px;padding:7px 12px;border:1px solid #dceae5;border-radius:999px;background:#fff;color:#5c766e;font-size:12px;font-weight:800}
        .qna-helpful:hover{border-color:#83cdbb}
        .qna-helpful.active{border-color:#008b70;background:#e9f8f3;color:#008b70}
        .qna-empty{padding:48px 20px;color:#8a9b97;font-size:14px;text-align:center}
        .qna-notice{margin:14px 0 0;color:#8a9b97;font-size:12px}
        @media(max-width:760px){
          .qna-hero{display:block;padding:16px 0 24px}
          .qna-hero h1{font-size:34px}
          .qna-write-button{width:100%;margin-top:18px}
          .qna-form-row{grid-template-columns:1fr}
          .qna-tools{width:100%}
          .qna-search{flex:1;width:auto;min-width:0}
          .qna-question{padding:17px}
          .qna-detail{padding:0 17px 17px}
        }
      `}</style>

      <button className="qna-back" type="button" onClick={() => onNavigate("customer-center")}>← 고객센터로 돌아가기</button>

      <header className="qna-hero">
        <div>
          <p className="qna-kicker">COMMUNITY Q&amp;A</p>
          <h1>다른 이용자들은<br /><b>이런 걸 궁금해했어요.</b></h1>
          <p>이사·계약·청년 지원에 대해 이용자들이 남긴 질문과 답변을 모아 봤어요.</p>
        </div>
        <button className="qna-write-button" type="button" onClick={() => setIsWriting((value) => !value)}>{isWriting ? "작성 닫기" : "질문 남기기"}</button>
      </header>

      {isWriting && (
        <form className="qna-form" onSubmit={submitQuestion}>
          <div className="qna-form-row">
            <select value={draft.category} onChange={(event) => setDraft((value) => ({ ...value, category: event.target.value }))} aria-label="질문 분류">
              {categories.slice(1).map((name) => <option key={name}>{name}</option>)}
            </select>
            <input value={draft.title} onChange={(event) => setDraft((value) => ({ ...value, title: event.target.value }))} placeholder="질문 제목을 입력해 주세요." aria-label="질문 제목" maxLength={80} />
          </div>
          <textarea value={draft.body} onChange={(event) => setDraft((value) => ({ ...value, body: event.target.value }))} placeholder="상황을 구체적으로 적어 주면 더 정확한 답변을 받을 수 있어요. 주소·연락처 같은 개인정보는 입력하지 마세요." aria-label="질문 내용" />
          <div className="qna-form-actions">
            <button className="cancel" type="button" onClick={() => setIsWriting(false)}>취소</button>
            <button className="submit" type="submit">등록하기</button>
          </div>
        </form>
      )}

      <div className="qna-toolbar">
        <div className="qna-chips">
          {categories.map((name) => <button className={`qna-chip ${category === name ? "active" : ""}`} type="button" key={name} onClick={() => setCategory(name)}>{name}</button>)}
        </div>
        <div className="qna-tools">
          <input className="qna-search" type="search" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="질문 검색" aria-label="질문 검색" />
          <div className="qna-sort">
            <button className={sort === "latest" ? "active" : ""} type="button" onClick={() => setSort("latest")}>최신순</button>
            <button className={sort === "helpful" ? "active" : ""} type="button" onClick={() => setSort("helpful")}>도움순</button>
          </div>
        </div>
      </div>

      <div className="qna-list">
        {visibleQuestions.length === 0 && <p className="qna-empty">조건에 맞는 질문이 없어요. 직접 질문을 남겨 보세요.</p>}
        {visibleQuestions.map((question) => {
          const isOpen = openId === question.id;
          const hasAnswer = question.answers.length > 0;
          return (
            <article className="qna-item" key={question.id}>
              <button className="qna-question" type="button" aria-expanded={isOpen} onClick={() => setOpenId(isOpen ? null : question.id)}>
                <div className="qna-badges">
                  <span className="qna-badge">{question.category}</span>
                  <span className={`qna-badge ${hasAnswer ? "done" : "wait"}`}>{hasAnswer ? "답변완료" : "답변대기"}</span>
                </div>
                <div className="qna-title-row"><b>{question.title}</b><i aria-hidden="true">⌄</i></div>
                <p className="qna-preview">{question.body}</p>
                <div className="qna-meta">
                  <span>{question.author === "나" ? "나" : maskAuthor(question.author)}</span>
                  <span>{question.date}</span>
                  <span>답변 {question.answers.length}</span>
                  <span>도움돼요 {question.helpful}</span>
                </div>
              </button>
              {isOpen && (
                <div className="qna-detail">
                  {hasAnswer
                    ? question.answers.map((answer, index) => (
                        <div className={`qna-answer ${answer.official ? "official" : ""}`} key={index}>
                          <div className="qna-answer-author">{answer.official ? "운영팀" : maskAuthor(answer.author)}{answer.official && <em>공식</em>}</div>
                          <p>{answer.text}</p>
                        </div>
                      ))
                    : <p className="qna-no-answer">아직 답변이 없어요. 운영팀과 다른 이용자의 답변을 기다리고 있어요.</p>}
                  <button className={`qna-helpful ${helpedIds.includes(question.id) ? "active" : ""}`} type="button" onClick={() => toggleHelpful(question.id)}>👍 도움돼요 {question.helpful}</button>
                </div>
              )}
            </article>
          );
        })}
      </div>
      <p className="qna-notice">이용자 답변은 개인 경험에 기반한 참고 정보예요. 계약·보증·지원 자격은 반드시 공식 기관에서 최종 확인하세요.</p>
    </section>
  );
}

export default CommunityQnaPage;
