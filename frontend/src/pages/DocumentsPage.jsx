import React, { useEffect, useRef, useState } from "react";

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

const demoPolicies = [
  { id: "monthly", title: "청년 월세 지원", maxDeposit: 5000, required: [0, 1, 2, 3, 4] },
  { id: "housing", title: "LH·SH 청약", required: [0, 1, 3] },
  { id: "moving", title: "지역 청년 이사 지원", region: /^(대전|대전광역시)(\s|$)/, maxDeposit: 3000, required: [0, 1, 2, 4] },
];

const leaseDocumentIndex = 2;
const leaseReviewExample = [
  ["계약서 주소", "대전광역시 유성구 예시로 12, 302호"],
  ["임대인 일치 여부", "일치 · 계약서의 임대인과 등기부등본의 소유자 비교 예시"],
  ["월 관리비", "월 7만 원 · 수도 포함, 전기·가스 별도"],
  ["입주 예정일", "2026년 12월 15일"],
];

function readSavedValue(key) {
  try {
    return JSON.parse(window.sessionStorage.getItem(key));
  } catch {
    return null;
  }
}

function DocumentsPage({ onNotify }) {
  const [draft] = useState(() => readSavedValue("housingRecommendationDraft"));
  const [checked, setChecked] = useState(() => readSavedValue("housingDocumentChecklist") ?? {});
  const [documentType, setDocumentType] = useState("");
  const [files, setFiles] = useState([]);
  const [policyId, setPolicyId] = useState(null);
  const [isPolicyOpen, setIsPolicyOpen] = useState(true);
  const [leaseFile, setLeaseFile] = useState(null);
  const [leasePreviewUrl, setLeasePreviewUrl] = useState("");
  const [confirmedLeaseFields, setConfirmedLeaseFields] = useState({});
  const leaseDialog = useRef(null);
  const fileInput = useRef(null);
  const area = draft?.desiredArea?.trim();
  const deposit = String(draft?.deposit ?? "").trim() ? Number(draft.deposit) : NaN;
  const policies = area ? demoPolicies.filter((policy) =>
    (!policy.region || policy.region.test(area)) &&
    (policy.maxDeposit === undefined || (deposit >= 0 && deposit <= policy.maxDeposit))
  ) : demoPolicies;
  const selectedPolicy = policies.find((policy) => policy.id === policyId);
  const visibleDocuments = selectedPolicy?.required ?? documents.map((_, index) => index);

  useEffect(() => {
    if (!leaseFile) return;

    const url = URL.createObjectURL(leaseFile);
    setLeasePreviewUrl(url);
    if (!leaseDialog.current?.open) leaseDialog.current?.showModal();

    return () => URL.revokeObjectURL(url);
  }, [leaseFile]);

  const toggleChecked = (index) => {
    setChecked((items) => ({ ...items, [index]: !items[index] }));
  };

  const addFiles = (event) => {
    const selectedFiles = Array.from(event.target.files);
    event.target.value = "";
    if (!selectedFiles.length || documentType === "") return;
    const acceptedFiles = selectedFiles.filter((file) =>
      /\.(pdf|jpe?g|png)$/i.test(file.name) && file.size > 0 && file.size <= 20 * 1024 * 1024
    );
    if (acceptedFiles.length) {
      setChecked((items) => ({ ...items, [documentType]: true }));
      setFiles((previous) => [...previous, ...acceptedFiles.map((file) => file.name)]);
      if (Number(documentType) === leaseDocumentIndex) {
        setLeaseFile(acceptedFiles.at(-1));
        setConfirmedLeaseFields({});
      }
    }
    const rejectedCount = selectedFiles.length - acceptedFiles.length;
    onNotify(rejectedCount
      ? `${acceptedFiles.length}개 추가, ${rejectedCount}개 제외. 20MB 이하의 PDF, JPG, PNG를 선택해 주세요.`
      : "파일을 추가하고 해당 서류를 체크했습니다.");
  };

  const selectPolicy = (id) => {
    setPolicyId(id);
    setDocumentType("");
  };

  const saveChecklist = () => {
    try {
      window.sessionStorage.setItem("housingDocumentChecklist", JSON.stringify(checked));
      onNotify("이 탭에 서류 준비 상태를 저장했습니다.");
    } catch {
      onNotify("서류 준비 상태를 저장할 수 없습니다.");
    }
  };

  return (
    <section className="document-review">
      <style>{`
        .document-review{width:100%;max-width:1540px;margin:0 auto;color:#14233b}.document-hero{display:grid;grid-template-columns:1.05fr .75fr;min-height:280px;align-items:center;gap:35px}.document-kicker{margin:0 0 12px;color:#1d4ed8;font-size:14px;font-weight:900;letter-spacing:.08em}.document-hero h1{margin:0;font-size:clamp(42px,4.1vw,65px);line-height:1.1;letter-spacing:-.07em}.document-hero h1 b{color:#1d4ed8}.document-hero p{margin:22px 0 0;color:#5d6c7c;font-size:17px;line-height:1.6}.document-visual{display:grid;place-items:center}.document-visual svg{width:min(100%,420px);height:245px}.document-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:24px}.upload-zone{display:grid;place-items:center;min-height:350px;padding:35px;border:2px dashed #bfdbfe;border-radius:17px;background:linear-gradient(145deg,#fbfdff,#f7faff);text-align:center}.upload-icon{display:grid;place-items:center;width:66px;height:66px;border-radius:50%;background:#eff6ff;color:#1d4ed8;font-size:35px}.upload-zone h2{margin:18px 0 8px;font-size:24px}.upload-zone p{margin:0;color:#687d78;font-size:14px;line-height:1.6}.upload-zone button,.save-checklist{margin-top:20px;padding:12px 17px;border:0;border-radius:8px;background:#1d4ed8;color:#fff;font-weight:900}.upload-hint{display:flex;gap:13px;flex-wrap:wrap;justify-content:center;margin-top:22px;color:#596b85;font-size:11px}.document-benefits{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:15px}.document-benefit{padding:17px;border:1px solid #d9e5f8;border-radius:13px;background:#fff}.document-benefit i{color:#1d4ed8;font-size:21px;font-style:normal}.document-benefit b,.document-benefit p{display:block}.document-benefit b{margin-top:9px;font-size:13px}.document-benefit p{margin:5px 0 0;color:#596b85;font-size:11px;line-height:1.45}.document-checklist{padding:26px;border:1px solid #d9e5f8;border-radius:17px;background:#fff}.document-checklist-head{display:flex;justify-content:space-between;gap:15px;align-items:start}.document-checklist h2{margin:0;font-size:22px}.document-checklist-head button{border:0;background:transparent;color:#1d4ed8;font-size:12px;font-weight:900}.document-item{display:flex;gap:13px;align-items:center;padding:15px 0;border-bottom:1px solid #d9e5f8}.document-item input{accent-color:#1d4ed8}.document-item i{display:grid;place-items:center;width:33px;height:33px;border-radius:9px;background:#eff6ff;color:#1d4ed8;font-style:normal}.document-item span span{display:block;margin-top:4px;color:#596b85;font-size:11px}.review-history{display:flex;gap:16px;align-items:center;margin-top:24px;padding:19px 22px;border-radius:14px;background:#f7faff}.review-history h3{margin:0;font-size:14px}.review-file{display:grid;gap:4px;flex:1;font-size:12px}.review-file span{color:#596b85}.review-status{padding:6px 9px;border-radius:999px;background:#dbeafe;color:#1d4ed8;font-size:11px;font-weight:900}.review-history button{border:0;background:transparent;color:#1d4ed8;font-weight:900}@media(max-width:900px){.document-hero,.document-grid{grid-template-columns:1fr}.document-visual{display:none}}@media(max-width:700px){.document-hero{min-height:auto;padding:15px 0 35px}.document-hero h1{font-size:42px}.document-benefits{grid-template-columns:1fr}.document-checklist{padding:20px}.review-history{display:block}.review-history>*{margin:7px 0}}
        .document-review{container-type:inline-size}
        .document-grid{align-items:start}
        .document-checklist{position:relative}
        .document-review .upload-zone{min-height:240px;padding:16px}
        .upload-zone h2{margin:10px 0 5px;font-size:22px}
        .upload-zone button,.upload-hint{margin-top:10px}
        .document-checklist-head{display:block}
        .document-upload-column{min-width:0}
        .document-upload-column .review-history{margin-top:16px;flex-wrap:wrap}
        .document-policy-panel{position:absolute;z-index:2;top:26px;right:calc((100cqw - 100vw) / 2 + 24px);display:flex;flex-direction:row-reverse;align-items:center;width:min(234px,calc(100vw - 48px));margin:0}
        .document-checklist-head .document-policy-toggle{z-index:1;flex:0 0 36px;height:56px;margin-left:-1px;border:1px solid #d9e5f8;border-radius:8px;background:#fff;font-size:18px}
        .document-policy-toggle[aria-expanded="false"] + .document-policy-list{visibility:hidden}
        .document-policy-list{flex:1;min-width:0;max-height:300px;overflow-y:auto;padding:14px;border:1px solid #d9e5f8;border-radius:12px;background:#fff;box-shadow:0 10px 30px #172b4d26}
        @media(max-width:700px){.document-policy-panel{top:20px}}
        .document-policy-list p{margin:7px 0;color:#5d6c7c;font-size:12px}
        .document-checklist-head .document-policy-list button{display:block;width:100%;margin-top:6px;padding:11px 9px;border:1px solid #d9e5f8;border-radius:8px;text-align:left}
        .document-policy-list button:hover,.document-policy-list button[aria-pressed="true"]{background:#eff6ff}
        .document-type{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:8px;margin-top:10px}
        .document-type select{max-width:100%;padding:8px;border:1px solid #bfdbfe;border-radius:8px;background:#fff}
        .upload-zone .upload-icon{width:42px;height:42px;margin:0 auto;font-size:25px}
        .review-file{min-width:0;overflow-wrap:anywhere}
        .lease-review{width:min(1120px,calc(100% - 32px));max-height:calc(100dvh - 32px);padding:22px;border:1px solid #d9e5f8;border-radius:16px;background:#fff;color:#14233b;overflow-wrap:anywhere}
        .lease-review::backdrop{background:#172b4d45}
        .lease-review-header{display:flex;align-items:start;justify-content:space-between;gap:12px}
        .lease-review h2{margin:0;font-size:20px}
        .lease-review p{margin:8px 0;color:#5d6c7c;font-size:14px}
        .lease-review-layout{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:20px;margin-top:16px}
        .lease-review-layout h3{margin:0 0 10px;font-size:16px}
        .lease-preview{display:grid;place-items:center;min-height:240px;border:1px solid #d9e5f8;border-radius:10px;background:#f7faff;overflow:hidden}
        .lease-preview img{display:block;max-width:100%;max-height:min(560px,55dvh);object-fit:contain}
        .lease-preview iframe{width:100%;height:min(560px,55dvh);border:0}
        .lease-review-fields{display:grid;gap:8px}
        .lease-review-field{display:flex;align-items:start;gap:9px;padding:11px;border:1px solid #d9e5f8;border-radius:8px;background:#f7faff;font-size:14px}
        .lease-review-field input{accent-color:#1d4ed8}
        .lease-review-field small{display:block;margin-top:5px;color:#5d6c7c}
        .lease-review-button{padding:8px 12px;border:1px solid #d9e5f8;border-radius:8px;background:#fff;color:#1d4ed8;font-weight:800}
        @media(max-width:700px){.lease-review-layout{grid-template-columns:1fr}}
      `}</style>
      <header className="document-hero"><div><p className="document-kicker">CONTRACT & DOCUMENT CHECK</p><h1>계약서와 신청 서류를<br />계약 전에 <b>점검하세요.</b></h1><p>계약 서류와 청년 지원 정책별 필요 서류를 확인하고 준비 상태를 기록하세요.</p></div><div className="document-visual"><svg viewBox="0 0 420 250" aria-hidden="true"><path d="M46 202c42-74 108-110 184-84 56-56 133-41 161 15v50H46Z" fill="#eff6ff" /><path d="M254 43h99l20 20-13 145H226l13-145Z" fill="#fff" stroke="#93c5fd" strokeWidth="7" /><path d="M273 90h65M273 119h65M273 148h48" stroke="#c3e5da" strokeWidth="8" strokeLinecap="round" /><path d="m246 90 8 8 14-16m-22 38 8 8 14-16m-22 38 8 8 14-16" stroke="#3b82f6" strokeWidth="5" fill="none" /><path d="m101 162 58-49 57 49v52h-115Z" fill="#fff" stroke="#1d4ed8" strokeWidth="7" /><circle cx="307" cy="176" r="40" fill="#fff" stroke="#1d4ed8" strokeWidth="9" /><path d="m288 176 12 12 24-28" stroke="#1d4ed8" strokeWidth="8" fill="none" strokeLinecap="round" /></svg></div></header>
      <div className="document-grid">
        <div className="document-upload-column">
          <section className="upload-zone">
            <div>
              <span className="upload-icon" aria-hidden="true">⇧</span>
              <h2>계약서 또는 서류 올리기</h2>
              <p>서류 종류를 선택하고 파일을 추가하면 해당 항목이 체크돼요.</p>
              <label className="document-type">
                서류 종류
                <select value={documentType} onChange={(event) => setDocumentType(event.target.value)}>
                  <option value="">선택해 주세요</option>
                  {visibleDocuments.map((index) => (
                    <option key={index} value={index}>{documents[index][0]}</option>
                  ))}
                </select>
              </label>
              <input ref={fileInput} type="file" hidden multiple accept=".pdf,.jpg,.jpeg,.png" onChange={addFiles} />
              <button type="button" onClick={() => {
                if (documentType === "") {
                  onNotify("먼저 서류 종류를 선택해 주세요.");
                  return;
                }
                fileInput.current?.click();
              }}>파일 선택</button>
              <div className="upload-hint"><span>PDF, JPG, PNG · 파일당 최대 20MB</span></div>
            </div>
          </section>
          {files.length > 0 && (
            <section className="review-history" aria-label="첨부 파일 목록">
              <h3>이번 화면에서 추가한 파일</h3>
              <ul className="review-file">{files.map((name, index) => <li key={index}>{name}</li>)}</ul>
              {leaseFile && <button type="button" onClick={() => leaseDialog.current?.showModal()}>계약서 검토 다시 열기</button>}
            </section>
          )}
        </div>
        <section className="document-checklist">
          <div className="document-checklist-head">
            <h2>{selectedPolicy ? selectedPolicy.title : "월세 계약·청년 지원"} 체크리스트</h2>
            <div className="document-policy-panel">
              <button
                className="document-policy-toggle"
                type="button"
                aria-controls="document-policy-list"
                aria-expanded={isPolicyOpen}
                aria-label={isPolicyOpen ? "정책 목록 접기" : "정책 목록 펼치기"}
                onClick={() => setIsPolicyOpen((open) => !open)}
              >
                {isPolicyOpen ? ">" : "<"}
              </button>
              <div className="document-policy-list" id="document-policy-list">
                <strong>{area ? "조건에 맞는 정책" : "정책"}</strong>
                <p>데모 정책 · 실제 신청 자격과 서류는 공고를 확인해 주세요.</p>
                {area && <p>희망 지역 {area} {Number.isFinite(deposit) && `· 보증금 ${deposit.toLocaleString("ko-KR")}만 원`}</p>}
                {area && !policies.length && <p>조건에 맞는 정책이 없어요.</p>}
                {policies.map((policy) => (
                  <button key={policy.id} type="button" aria-pressed={policyId === policy.id} onClick={() => selectPolicy(policy.id)}>
                    {policy.title}
                  </button>
                ))}
                {selectedPolicy && <button type="button" onClick={() => selectPolicy(null)}>기본 체크리스트 보기</button>}
              </div>
            </div>
          </div>
          {visibleDocuments.map((index) => {
            const [name, description, icon] = documents[index];
            return (
              <label className="document-item" key={name}>
                <input type="checkbox" checked={Boolean(checked[index])} onChange={() => toggleChecked(index)} />
                <i>{icon}</i>
                <span><b>{name}</b><span>{description}</span></span>
              </label>
            );
          })}
          <button className="save-checklist" type="button" onClick={saveChecklist}>준비 상태 저장</button>
        </section>
      </div>
      <dialog ref={leaseDialog} className="lease-review" aria-labelledby="lease-review-title">
        {leaseFile && (
          <>
            <header className="lease-review-header">
              <div>
                <h2 id="lease-review-title">임대차계약서 검토</h2>
                <p>{leaseFile.name}</p>
              </div>
              <form method="dialog"><button className="lease-review-button" type="submit">닫기</button></form>
            </header>
            <div className="lease-review-layout">
              <section>
                <h3>첨부 원본</h3>
                {leasePreviewUrl && (
                  <div className="lease-preview">
                    {/\.pdf$/i.test(leaseFile.name)
                      ? <iframe src={leasePreviewUrl} title="임대차계약서 PDF 미리보기" />
                      : <img src={leasePreviewUrl} alt="첨부한 임대차계약서 원본" />}
                  </div>
                )}
                {leasePreviewUrl && <p><a href={leasePreviewUrl} target="_blank" rel="noopener noreferrer">원본 새 탭에서 열기</a></p>}
              </section>
              <section>
                <h3>작성 내용 확인</h3>
                <p>표시된 값은 OCR 화면 예시입니다. 원본과 대조한 항목을 직접 체크해 주세요.</p>
                <div className="lease-review-fields">
                  {leaseReviewExample.map(([label, value]) => (
                    <label className="lease-review-field" key={label}>
                      <input
                        type="checkbox"
                        checked={Boolean(confirmedLeaseFields[label])}
                        onChange={(event) => {
                          const { checked: isConfirmed } = event.target;
                          setConfirmedLeaseFields((fields) => ({ ...fields, [label]: isConfirmed }));
                        }}
                      />
                      <span><b>{label}</b><small>{value}</small></span>
                    </label>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}
      </dialog>
    </section>
  );
}

export default DocumentsPage;
