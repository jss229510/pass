import React, { useEffect, useRef, useState } from "react";
import contractA from "../assets/journey-contract-a.png";
import contractB from "../assets/journey-contract-b.png";
import records from "../data/journeyDemoOcr.json";
import { step } from "../data/maruRecommendation";

const rentPolicy = "https://young.busan.go.kr/index.nm?menuCd=37";
const movePolicy = "https://young.busan.go.kr/index.nm?menuCd=271";
const youthPortal = "https://www.youthcenter.go.kr/";
const moveIn = "https://www.gov.kr/mw/AA020InfoCappView.do?CappBizCD=13100000016";
const leaseReport = "https://rtms.molit.go.kr/main/serviceInfo.do";
const contractImages = { a: contractA, b: contractB };
export const demoScenario = {
  origin: "서울 관악구 봉천동",
  city: "부산",
  neighborhood: "우동",
  destination: "부산 해운대구 우동",
  answers: {
    [step.city]: "부산 센텀시티", [step.range]: "30분", [step.mode]: "대중교통",
    [step.lease]: "월세", [step.building]: "오피스텔", [step.room]: "원룸",
    [step.budget]: "65만 원", [step.deposit]: "1000만 원", [step.environment]: "골고루",
  },
};
const monthlyGrant = 20;
const movingGrant = 40;
const numberFormat = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 });
const dateFormat = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", timeZone: "UTC" });

const contractChecks = [
  { match: "하자는", label: "임차인에게 유리한 내용", question: "수리 항목과 완료일을 별지에 적고 입주 전에 같이 확인할 수 있나요?" },
  { match: "포함 항목", label: "비용이 불명확한 내용", question: "수도·인터넷 포함 여부와 전기·가스 별도 청구 여부를 계약서에 적을 수 있나요?" },
  { match: "모든 수리비", label: "임차인 부담 가능성", question: "노후로 인한 고장과 임차인 과실로 인한 파손을 구분해서 수리비 부담을 명시할 수 있나요?" },
];
const vendors = [
  { id: "road", name: "한길 장거리이사", max: 500, surcharge: 0, type: "소형 반포장 · 수도권↔부산", coverage: "운송 중 파손·분실의 보상 한도와 자기부담금 확인", extra: "유리·전자기기 별도 포장 조건 확인" },
  { id: "home", name: "햇살 소형이사", max: 450, surcharge: 8, type: "소형 포장이사 · 수도권↔부산", coverage: "포장·운송·하역 중 보상 범위 확인", extra: "가전 분리·재설치가 견적에 포함되는지 확인" },
  { id: "local", name: "동네 원룸이사", max: 70, surcharge: -5, type: "소형 일반이사 · 단거리", coverage: "보험 가입 증빙과 운송 중 보상 범위 확인", extra: "계단 작업과 주차 요금 별도 여부 확인" },
];

export const demoStageTasks = {
  3: ["계약서와 등기사항에서 주소·소유자 일치 확인", "관리비의 포함 항목과 최근 고지서 확인", "노후 고장과 파손의 수리비 분담을 특약에 명시", "입주 전 하자 사진·수리 완료일을 별지에 기록", "반환보증의 신청 조건·필요 서류를 공식 기관에 문의"],
  4: ["동일한 조건으로 견적서와 추가 작업비 확인", "이사업체의 배상책임보험 가입 증빙과 보상 범위 확인", "관리실과 승강기·주차·공과금 이전 확인", "잔금과 열쇠 인수 시간 확정", "이사비 지원 증빙용 계약서·결제 영수증 보관"],
  5: ["입주 당일 하자·옵션·계량기 사진 보관", "전입신고 신청 후 처리 완료 확인", "임대차계약 신고 대상 여부와 확정일자 부여 여부 확인", "보증금 반환보증 신청 조건·기한 확인 및 접수", "반환보증 발급 후 주소·보증금·기간 대조", "관리비·공과금 명의 변경 및 자동납부 확인", "월세·이사비 지원의 새 공고와 본인 증빙 확인"],
};

export function createDemoPlan() {
  return {
    area: null,
    dates: { contract: "2026-11-27", balance: "2026-12-12", move: "2026-12-12" },
    regions: {
      [demoScenario.city + " " + demoScenario.neighborhood]: {
        homes: [
          { id: "a", title: "역세권 오피스텔 A", source: "부동산 앱에서 링크를 보고 직접 저장한 예시", deposit: 1000, rent: 55, maintenance: 14, transport: 5, oneTime: 128, area: 23, commute: 12, available: "2026-12-12", question: "관리비 14만 원 중 고정 항목과 별도 공과금은 무엇인가요?", contract: "a" },
          { id: "b", title: "주택가 오피스텔 B", source: "현장 방문 뒤 중개사 안내를 메모한 예시", deposit: 700, rent: 58, maintenance: 6, transport: 4, oneTime: 125, area: 26, commute: 18, available: "2026-12-12", question: "관리비 6만 원에 수도와 인터넷이 들어가나요?", contract: "b" },
        ],
        progress: {},
      },
    },
    moving: { distance: 400, stairs: false, vendorId: null },
  };
}

function cost(amount) {
  return numberFormat.format(amount) + "만 원";
}

function OfficialLink({ href, children }) {
  return <a href={href} target="_blank" rel="noreferrer">{children}</a>;
}

function PolicySources({ moving = false }) {
  return (
    <div className="journey-demo-links">
      <OfficialLink href={moving ? movePolicy : rentPolicy}>{moving ? "부산시 이사비 지원 공고" : "부산청년플랫폼 월세 지원"}</OfficialLink>
      <OfficialLink href={youthPortal}>온통청년 정책 검색</OfficialLink>
    </div>
  );
}

export function DemoCompare({ homes, selected, onSelect }) {
  const [applyGrant, setApplyGrant] = useState(true);
  return (
    <section className="journey-demo-section" aria-labelledby="demo-compare-title">
      <h2 id="demo-compare-title">내가 찾은 집, 매달 드는 돈으로 비교</h2>
      <div className="journey-support-strip">
        <div><strong>청년월세 지원</strong><p>선정 가정 · 월 최대 20만 원</p></div>
        <label><input type="checkbox" checked={applyGrant} onChange={event => setApplyGrant(event.target.checked)} /> 비교에 반영</label>
      </div>
      <div className="journey-demo-grid">
        {homes.map(home => {
          const total = (home.rent ?? 0) + (home.maintenance ?? 0) + (home.transport ?? 0);
          const grant = Math.min(home.rent ?? 0, monthlyGrant);
          const incomplete = home.maintenance == null || home.transport == null;
          return <article key={home.id} className="journey-home" data-selected={selected?.id === home.id}>
            <h3>{home.title}</h3>
            <p className="journey-meta">{home.area == null ? "면적 미확인" : "전용 " + home.area + "㎡"} · {home.commute == null ? "통근 미확인" : "편도 " + home.commute + "분"}</p>
            <p className="journey-demo-total">{applyGrant ? "지원기간 월 부담" : "지원 전 월 지출"}<strong>{cost(applyGrant ? total - grant : total)}{incomplete ? " 이상" : ""}</strong>
              {applyGrant && <small>지원 전 {cost(total)} · 가정 지원금 월 −{cost(grant)}</small>}
            </p>
            <dl>
              <div><dt>보증금</dt><dd>{cost(home.deposit ?? 0)}</dd></div>
              <div><dt>중개·이사비 등 추정</dt><dd>{home.oneTime == null ? "미확인" : cost(home.oneTime)}</dd></div>
              <div><dt>월세</dt><dd>{cost(home.rent ?? 0)}</dd></div>
              <div><dt>관리비</dt><dd>{home.maintenance == null ? "미확인" : cost(home.maintenance)}</dd></div>
              <div><dt>월 교통비</dt><dd>{home.transport == null ? "미확인" : cost(home.transport)}</dd></div>
            </dl>
            {home.question && <details><summary>중개사에게 물어볼 질문</summary><p>{home.question}</p></details>}
            <button className="journey-primary" type="button" onClick={() => onSelect(home)}>{selected?.id === home.id ? "계약 검토 이어가기" : "이 집으로 계약 검토"}</button>
          </article>;
        })}
      </div>
      <details className="journey-compact"><summary>월세 지원 가정과 공식 공고</summary>
        <p>부산청년플랫폼에 안내된 국토부 청년월세 사업의 2026년 접수는 마감됐어요. 새 공고에서 같은 조건으로 선정됐다고 가정해 실제 월세 범위에서 월 최대 20만 원을 반영했어요.</p>
        <PolicySources />
      </details>
    </section>
  );
}

export function DemoContract({ home }) {
  const [status, setStatus] = useState("empty");
  const [fileLabel, setFileLabel] = useState("");
  const [error, setError] = useState("");
  const fileInput = useRef(null);
  const timer = useRef(null);
  const record = records[home?.contract];
  const original = contractImages[home?.contract];
  const fileName = "발표용-임대차계약서-" + home?.contract + ".png";
  useEffect(() => () => window.clearTimeout(timer.current), []);

  function loadExample() {
    setFileLabel(fileName);
    setError("");
    setStatus("ready");
  }

  async function selectFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setStatus("checking");
    setError("");
    try {
      if (file.size > 2_000_000) throw new Error("Unsupported sample");
      const bytes = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
      const digest = Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, "0")).join("");
      if (digest !== record.sha256) throw new Error("Unsupported sample");
      setFileLabel(file.name);
      setStatus("ready");
    } catch {
      setError("현재 집의 예시 PNG를 내려받아 다시 올리거나 예시 계약서 불러오기를 눌러주세요.");
      setStatus("empty");
    }
  }

  function analyze() {
    setStatus("analyzing");
    // Replay the OCR output captured from this exact sample.
    timer.current = window.setTimeout(() => setStatus("done"), 1400);
  }

  const busy = status === "checking" || status === "analyzing";
  const preview = ["ready", "analyzing", "done"].includes(status);
  const amounts = record?.lines.filter(line => /^[\d,′’'\s]+원$/.test(line))
    .map(line => Number(line.replace(/\D/g, ""))) ?? [];
  const fields = record ? [
    ["소재지", record.lines.find(line => line.includes("가상주소"))],
    ...[["보증금", home.deposit], ["월세", home.rent], ["관리비", home.maintenance]].map(([label, expected], index) => [
      label, amounts[index] == null ? null : numberFormat.format(amounts[index]) + "원",
      amounts[index] != null && expected != null && amounts[index] !== expected * 10000,
    ]),
    ["입주일", record.lines.find(line => /^\d{4}년/.test(line))],
  ] : [];

  return (
    <>
      <section className="journey-contract-upload" aria-labelledby="demo-ocr-title" aria-busy={busy}>
        {!preview ? <>
          <span className="journey-upload-icon" aria-hidden="true">↑</span>
          <h2 id="demo-ocr-title">계약서 이미지 올리기</h2>
          <p>{record ? "선택한 집의 발표용 PNG를 올리거나 바로 불러오세요." : "발표용 계약서는 우동의 A·B 매물을 선택하면 사용할 수 있어요."}</p>
        </> : <figure className="journey-demo-original">
          <figcaption id="demo-ocr-title">{fileLabel}</figcaption>
          <img src={original} alt={home.title + "의 발표용 가상 임대차계약서"} />
        </figure>}
        {record && <>
          <input ref={fileInput} hidden aria-label="계약서 PNG 선택" type="file" accept=".png,image/png" disabled={busy} onChange={selectFile} />
          <div className="journey-actions">
            <button type="button" className={preview ? undefined : "journey-primary"} disabled={busy} onClick={() => fileInput.current?.click()}>파일 선택</button>
            {!preview && <button type="button" disabled={busy} onClick={loadExample}>예시 계약서 불러오기</button>}
            {preview && <button type="button" className="journey-primary" disabled={busy || status === "done"} onClick={analyze}>{status === "analyzing" ? "이미지 분석 중…" : status === "done" ? "분석 완료" : "OCR로 AI 분석"}</button>}
          </div>
          <a href={original} download={fileName}>예시 계약서 내려받기</a>
        </>}
        {error && <p role="alert" className="journey-ocr-error">{error}</p>}
      </section>
      {busy && <div className="journey-ocr-loading" role="status"><span aria-hidden="true" />{status === "checking" ? "예시 파일 확인 중" : "계약서 이미지 분석 중 · OCR 결과 불러오는 중"}</div>}
      {status === "done" && <section className="journey-ocr-result" aria-labelledby="ocr-result-title">
        <header>
          <div><span className="journey-tag">분석 완료</span><h2 id="ocr-result-title" tabIndex={-1} ref={element => element?.focus()}>계약서 분석 결과</h2></div>
          <p>이 가상 문서를 Windows 한국어 OCR로 미리 읽은 결과예요. 특약은 규칙으로 분류해 보여줘요.</p>
        </header>
        <dl className="journey-ocr-fields">{fields.map(([label, value, mismatch]) => (
          <div key={label}><dt>{label}</dt><dd>{value ?? "원본 확인 필요"}{mismatch && <small>매물과 대조 필요</small>}</dd></div>
        ))}</dl>
        <div className="journey-demo-observations">
          <h3>특약과 중개사에게 물어볼 질문</h3>
          {contractChecks.map(({ match, label, question }, index) => {
            const excerpt = record.lines.find(line => line.includes(match));
            return <article className="journey-home" key={match}>
              <strong className="journey-tag" data-tone={excerpt ? ["ok", "check", "risk"][index] : "check"}>{excerpt ? label : "원본 확인 필요"}</strong>
              <p>OCR 원문 · {excerpt ?? "문자 인식 결과를 원본에서 확인해 주세요."}</p>
              <p><b>중개사에게 질문</b> · {question}</p>
            </article>;
          })}
        </div>
        <details><summary>OCR 전체 원문 보기</summary><pre className="journey-demo-raw">{record.lines.join("\n")}</pre></details>
      </section>}
    </>
  );
}

export function DemoMoving({ moving, onChange }) {
  const [showRequest, setShowRequest] = useState(false);
  const { distance, stairs, vendorId } = moving;
  const km = distance === "" ? null : Number(distance);
  const estimate = km == null ? null : Math.round(23 + km * 0.2 + (stairs ? 6 : 0));
  const available = km == null ? [] : vendors.filter(vendor => km <= vendor.max);
  const vendor = available.find(item => item.id === vendorId);
  const amount = estimate == null ? null : estimate + (vendor?.surcharge ?? 0);
  return (
    <section className="journey-demo-section" aria-labelledby="demo-moving-title">
      <h2 id="demo-moving-title">거리로 이사비 가늠하기</h2>
      <p className="journey-meta">서울 봉천동 → 부산 우동 · 1톤 소형 이사 예시</p>
      <div className="journey-fields journey-moving-fields">
        <label>이사 거리 (km)<input type="number" min="0" max="800" step="1" value={distance}
          onChange={event => { const value = event.target.value; if (!value || (+value >= 0 && +value <= 800)) { setShowRequest(false); onChange({ distance: value, vendorId: null }); } }} /></label>
        <label className="journey-demo-checkbox"><input type="checkbox" checked={stairs} onChange={event => onChange({ stairs: event.target.checked })} /> 계단 작업 가정 (+6만 원)</label>
      </div>
      {estimate != null && <p className="journey-demo-total">예상 이사비 <strong>{cost(estimate)}</strong><small>기본 23만 원 + 거리 요금{stairs && " + 계단 작업 6만 원"} · 시연용</small></p>}
      <h3>이 구간을 운행하는 이사업체 예시</h3>
      {available.length === 0 && <p>{km == null ? "거리를 입력하면 운행 범위를 비교할 수 있어요." : "가상 업체 목록에 이 거리를 운행하는 곳이 없어요."}</p>}
      <div className="journey-demo-grid">
        {available.map(item => <article key={item.id} className="journey-home" data-selected={vendorId === item.id}>
          <h3>{item.name} · 가상</h3>
          <p>{item.type} · 최대 {item.max}km</p>
          <p className="journey-quote"><strong>{cost(Math.max(0, estimate + item.surcharge))}</strong> <small>견적 예시</small></p>
          <button type="button" onClick={() => { onChange({ vendorId: item.id }); setShowRequest(true); }}>견적 문의 예시 열기</button>
        </article>)}
      </div>
      {showRequest && vendor && <div className="journey-demo-policy">
        <h3>{vendor.name}에 물어볼 내용</h3>
        <p>{demoScenario.origin}에서 {demoScenario.destination}까지 {km}km, 1톤 이사가 가능한가요? 계단과 가전 설치 비용이 포함된 견적서를 받을 수 있나요?</p>
        <p>{vendor.coverage} · {vendor.extra}</p>
        <p>시연에서는 문의 내용을 미리 보여줘요.</p>
      </div>}
      <div className="journey-demo-policy">
        <h3>부산청년 중개보수·이사비 지원</h3>
        {amount != null && <p className="journey-quote"><strong>{cost(Math.max(0, amount - movingGrant))}</strong> <small>선정 가정 후 부담 · 지원 전 {cost(amount)}</small></p>}
        <details><summary>지원 가정과 공식 공고 보기</summary><p>2026년 부산시 접수는 마감됐어요. 새 공고에서 인정 지출을 최대 40만 원까지 지원받았다고 가정했어요.</p><PolicySources moving /></details>
      </div>
    </section>
  );
}

export function DemoMoveIn({ moveDate }) {
  return (
    <section className="journey-demo-section">
      <h2>입주 후 확인 순서</h2>
      <div className="journey-demo-grid journey-movein-grid">
        <article className="journey-home"><span className="journey-tag">입주 당일</span><h3>집 상태 기록</h3><p>{moveDate ? dateFormat.format(new Date(moveDate)) + " 입주 예정 · " : ""}계량기와 하자를 촬영하고 열쇠·출입카드를 확인해요.</p></article>
        <article className="journey-home"><span className="journey-tag">주소·행정</span><h3>전입신고 · 확정일자</h3><p>신고와 확정일자 처리 상태를 확인해요.</p><div className="journey-demo-links"><OfficialLink href={moveIn}>정부24 전입신고</OfficialLink><OfficialLink href={leaseReport}>주택임대차 신고 안내</OfficialLink></div></article>
        <article className="journey-home"><span className="journey-tag">지원 준비</span><h3>청년지원 증빙</h3><p>다음 월세·이사비 공고에 제출할 증빙을 챙겨요.</p><div className="journey-demo-links"><OfficialLink href={youthPortal}>청년정책 검색</OfficialLink></div></article>
      </div>
    </section>
  );
}
