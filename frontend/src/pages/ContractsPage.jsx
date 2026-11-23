import React, { useMemo, useState } from "react";
import { FaExclamationTriangle, FaPlus, FaTimes } from "react-icons/fa";
import ContractRow from "../features/contracts/ContractRow";
import { useContracts } from "../hooks/useContracts";
import { links } from "../links";

const filters = ["전체", "분석 전", "확인 필요", "점검 완료"];
const maxFileSize = 10 * 1024 * 1024;

function ContractsPage({ onNavigate, embedded = false }) {
  const { contracts, isLoading, error, load, addContract, renameContract, removeContract, restoreContract } = useContracts();
  const [filter, setFilter] = useState("전체");
  const [sort, setSort] = useState("recent");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState("임대차계약서");
  const [uploadError, setUploadError] = useState("");
  const [toast, setToast] = useState(null);

  const displayedContracts = useMemo(() => contracts
    .filter((contract) => filter === "전체" || contract.status === filter)
    .sort((a, b) => sort === "name" ? a.fileName.localeCompare(b.fileName, "ko") : b.id.localeCompare(a.id)), [contracts, filter, sort]);

  const showToast = (message, undo) => {
    setToast({ message, undo });
    window.setTimeout(() => setToast(null), 4500);
  };

  const selectFile = (selectedFile) => {
    if (!selectedFile) return;
    const validType = ["application/pdf", "image/jpeg", "image/png"].includes(selectedFile.type);
    if (!validType) { setUploadError("PDF, JPG, PNG 파일만 추가할 수 있어요."); return; }
    if (selectedFile.size > maxFileSize) { setUploadError("파일 크기는 10MB 이하만 가능해요."); return; }
    setFile(selectedFile);
    setUploadError("");
  };

  const addSelectedContract = (sample = false) => {
    if (!file && !sample) { setUploadError("추가할 파일을 선택해 주세요."); return; }
    const newFile = sample ? { name: "임대차계약서_합성샘플.pdf" } : file;
    addContract({ fileName: newFile.name, subtitle: "분석을 시작할 준비가 됐어요 · 방금 전", documentType, region: "대전광역시 유성구" });
    setUploadOpen(false); setFile(null); setUploadError("");
    showToast("계약서를 추가했어요.");
  };

  const deleteContract = () => {
    if (!deleteTarget) return;
    const removed = deleteTarget;
    removeContract(removed.id);
    setDeleteTarget(null);
    showToast("계약서를 삭제했어요.", () => restoreContract(removed));
  };

  return <section className={`contracts-page ${embedded ? "is-embedded" : ""}`}>
    <style>{`
      .contracts-page{max-width:1100px;margin:-42px auto 84px;color:#172b4d}.contracts-page.is-embedded{max-width:none;margin:0}.contracts-page.is-embedded>h1,.contracts-page.is-embedded>.contracts-subtitle{display:none}.contracts-page h1{margin:0;font-size:32px;letter-spacing:-.055em}.contracts-page>.contracts-subtitle{margin:9px 0 26px;color:#596b85;font-size:14px}.contracts-card{border:1px solid #d9e5f8;border-radius:16px;background:#fff}.contracts-head{display:flex;justify-content:space-between;gap:18px;align-items:start;padding:25px 25px 18px}.contracts-head h2{margin:0;font-size:20px}.contracts-head p{margin:7px 0 0;color:#596b85;font-size:12px}.contracts-add,.contract-row-action.primary{border:0;border-radius:8px;background:#1d4ed8;color:#fff;font-weight:900}.contracts-add{padding:10px 13px;font-size:13px}.contracts-disclaimer{margin:0 24px;padding:11px 13px;border:1px solid #f2dcad;border-radius:9px;background:#fff8ea;color:#80601e;font-size:12px}.contracts-controls{display:flex;justify-content:space-between;gap:14px;align-items:center;padding:18px 24px;border-bottom:1px solid #d9e5f8}.contracts-filter{display:flex;gap:7px;flex-wrap:wrap}.contracts-filter button{border:1px solid #d9e5f8;border-radius:999px;padding:7px 10px;background:#fff;color:#425877;font-size:12px;font-weight:800}.contracts-filter button.active{border-color:#1d4ed8;background:#eff6ff;color:#1d4ed8}.contracts-sort{border:1px solid #d9e5f8;border-radius:8px;padding:8px 9px;background:#fff;color:#425877;font-size:12px}.contracts-list{padding:0 24px}.contract-row{position:relative;border-bottom:1px solid #d9e5f8}.contract-row-main{display:grid;grid-template-columns:minmax(0,1fr) 96px 92px 30px;gap:12px;align-items:center;min-height:72px}.contract-row-document{display:flex;min-width:0;gap:11px;align-items:center;border:0;background:transparent;text-align:left;cursor:pointer}.contract-row-file-icon{display:grid;flex:0 0 auto;place-items:center;width:34px;height:34px;border-radius:9px;background:#eff6ff;color:#1d4ed8}.contract-row-document strong,.contract-row-document small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.contract-row-document strong{font-size:13px;color:#172b4d}.contract-row-document small{margin-top:5px;color:#596b85;font-size:11px}.contract-row-status{display:flex;gap:5px;align-items:center;font-size:11px;font-weight:900}.contract-row-status.is-pending{color:#596b85}.contract-row-status.is-analyzing{color:#2375b9}.contract-row-status.is-warning{color:#ba791b}.contract-row-status.is-complete{color:#1d4ed8}.contract-row-status.is-failed{color:#c75a52}.contract-row-action{padding:8px;border:1px solid #bfdbfe;border-radius:8px;background:#fff;color:#1d4ed8;font-size:12px;font-weight:900}.contract-row-action.secondary{background:#f7faff}.contract-row-progress{display:flex;gap:6px;align-items:center;color:#596b85;font-size:12px;font-weight:800}.contract-row-progress i{width:11px;height:11px;border:2px solid #bfdbfe;border-top-color:#1d4ed8;border-radius:50%;animation:contract-spin .8s linear infinite}.contract-row-menu{position:relative}.contract-row-more{border:0;background:transparent;color:#425877;font-size:21px;line-height:1}.contract-row-menu-popover{position:absolute;z-index:3;right:0;top:30px;width:100px;padding:5px;border:1px solid #d9e5f8;border-radius:8px;background:#fff;box-shadow:0 8px 20px #172b4d22}.contract-row-menu-popover button{width:100%;padding:7px;border:0;border-radius:5px;background:#fff;color:#425877;text-align:left;font-size:12px}.contract-row-menu-popover .danger{color:#bf544d}.contract-row-detail{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:0 0 14px;padding:13px;border-radius:10px;background:#f7faff}.contract-row-detail div{min-width:0}.contract-row-detail .summary{grid-column:span 2}.contract-row-detail dt{color:#596b85;font-size:10px}.contract-row-detail dd{margin:4px 0 0;color:#425877;font-size:11px;font-weight:800}.contracts-empty{padding:68px 24px;text-align:center;color:#596b85}.contracts-empty button{margin-left:8px;border:0;background:transparent;color:#1d4ed8;font-weight:900}.contracts-skeleton{height:72px;margin:0 24px;border-bottom:1px solid #d9e5f8;background:linear-gradient(90deg,#f7faff,#fbfdff,#f7faff);background-size:200% 100%;animation:contract-shimmer 1.3s infinite}.contracts-error{padding:46px 24px;text-align:center;color:#8d574e}.contracts-error button{margin-left:8px;border:0;background:transparent;color:#1d4ed8;font-weight:900}.contracts-modal-backdrop{position:fixed;z-index:30;inset:0;display:grid;place-items:center;padding:20px;background:#172b4d75}.contracts-modal{width:min(100%,460px);padding:24px;border-radius:16px;background:#fff;box-shadow:0 20px 50px #172b4d44}.contracts-modal-head{display:flex;justify-content:space-between;align-items:center}.contracts-modal h3{margin:0;font-size:20px}.contracts-modal-head button{border:0;background:transparent;font-size:18px}.contracts-modal p{color:#596b85;font-size:12px;line-height:1.55}.contracts-file-input{display:grid;gap:7px;margin:17px 0;font-size:12px;font-weight:900}.contracts-file-input input,.contracts-modal select,.contracts-modal input{width:100%;box-sizing:border-box;padding:10px;border:1px solid #bfdbfe;border-radius:8px;color:#425877}.contracts-error-message{margin:9px 0;color:#bc514a;font-size:12px}.contracts-modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:20px}.contracts-modal-actions button{padding:10px 12px;border:1px solid #bfdbfe;border-radius:8px;background:#fff;color:#425877;font-weight:900}.contracts-modal-actions .primary{border-color:#1d4ed8;background:#1d4ed8;color:#fff}.contracts-toast{position:fixed;z-index:40;right:24px;bottom:24px;display:flex;gap:12px;align-items:center;padding:12px 14px;border-radius:9px;background:#172b4d;color:#fff;font-size:13px;font-weight:800;box-shadow:0 9px 25px #172b4d33}.contracts-toast button{border:0;background:transparent;color:#bfdbfe;font-weight:900}@keyframes contract-spin{to{transform:rotate(360deg)}}@keyframes contract-shimmer{to{background-position:-200% 0}}@media(max-width:760px){.contracts-page{margin:-15px 0 70px}.contracts-page.is-embedded{margin:0}.contracts-head{padding:19px;display:block}.contracts-add{margin-top:14px}.contracts-disclaimer{margin:0 19px}.contracts-controls{padding:16px 19px;align-items:start;flex-direction:column}.contracts-list{padding:0 19px}.contract-row-main{grid-template-columns:minmax(0,1fr) 28px;gap:8px;padding:12px 0}.contract-row-status{grid-column:1;grid-row:2}.contract-row-action,.contract-row-progress{grid-column:1;grid-row:3;width:max-content}.contract-row-menu{grid-column:2;grid-row:1}.contract-row-detail{grid-template-columns:1fr 1fr}.contract-row-detail .summary{grid-column:span 2}}
    `}</style>
    <h1>계약서 분석 내역</h1><p className="contracts-subtitle">내 주거 조건, 비교 기록, 계약 준비를 한곳에서 관리하세요.</p>
    <section className="contracts-card"><header className="contracts-head"><div><h2>계약서 분석 내역</h2><p>분석한 계약서와 점검 결과를 관리합니다.</p></div><button className="contracts-add" type="button" onClick={() => setUploadOpen(true)}><FaPlus aria-hidden="true" /> 계약서 추가</button></header><p className="contracts-disclaimer"><FaExclamationTriangle aria-hidden="true" /> 서비스 내부 모의 검토이며 최종 판단은 기관·전문가 확인이 필요합니다.</p><div className="contracts-controls"><div className="contracts-filter">{filters.map((item) => <button type="button" className={filter === item ? "active" : ""} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div><select className="contracts-sort" value={sort} onChange={(event) => setSort(event.target.value)} aria-label="계약서 정렬"><option value="recent">최근순</option><option value="name">이름순</option></select></div>{isLoading ? <>{[1, 2, 3].map((item) => <div className="contracts-skeleton" key={item} />)}</> : error ? <div className="contracts-error">{error}<button type="button" onClick={load}>다시 시도</button></div> : <div className="contracts-list">{displayedContracts.length ? displayedContracts.map((contract) => <ContractRow key={contract.id} contract={contract} onAction={() => onNavigate?.(links.contractAnalysis(contract.id))} onRequestRename={setRenameTarget} onRequestDelete={setDeleteTarget} />) : <div className="contracts-empty">아직 분석한 계약서가 없어요<button type="button" onClick={() => setUploadOpen(true)}>계약서 추가</button></div>}</div>}</section>
    {uploadOpen && <div className="contracts-modal-backdrop" role="presentation"><section className="contracts-modal" role="dialog" aria-modal="true" aria-label="계약서 추가"><div className="contracts-modal-head"><h3>계약서 추가</h3><button type="button" onClick={() => setUploadOpen(false)} aria-label="닫기"><FaTimes /></button></div><p>PDF·JPG·PNG 파일을 10MB 이하로 추가할 수 있어요.</p><label className="contracts-file-input">파일 선택<input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => selectFile(event.target.files?.[0])} /></label><label className="contracts-file-input">서류 유형<select value={documentType} onChange={(event) => setDocumentType(event.target.value)}><option>임대차계약서</option><option>월세 이체내역</option></select></label>{file && <p>{file.name}</p>}{uploadError && <p className="contracts-error-message">{uploadError}</p>}<div className="contracts-modal-actions"><button type="button" onClick={() => addSelectedContract(true)}>합성 샘플 사용</button><button type="button" className="primary" onClick={() => addSelectedContract()}>추가하기</button></div></section></div>}
    {renameTarget && <div className="contracts-modal-backdrop" role="presentation"><form className="contracts-modal" onSubmit={(event) => { event.preventDefault(); const name = new FormData(event.currentTarget).get("fileName")?.toString().trim(); if (name) { renameContract(renameTarget.id, name); showToast("이름을 변경했어요."); setRenameTarget(null); } }}><div className="contracts-modal-head"><h3>이름 변경</h3><button type="button" onClick={() => setRenameTarget(null)} aria-label="닫기"><FaTimes /></button></div><label className="contracts-file-input">파일명<input name="fileName" defaultValue={renameTarget.fileName} /></label><div className="contracts-modal-actions"><button type="button" onClick={() => setRenameTarget(null)}>취소</button><button className="primary" type="submit">변경</button></div></form></div>}
    {deleteTarget && <div className="contracts-modal-backdrop" role="presentation"><section className="contracts-modal" role="dialog" aria-modal="true" aria-label="계약서 삭제"><h3>계약서를 삭제할까요?</h3><p>{deleteTarget.fileName}만 삭제됩니다.</p><div className="contracts-modal-actions"><button type="button" onClick={() => setDeleteTarget(null)}>취소</button><button type="button" className="primary" onClick={deleteContract}>삭제</button></div></section></div>}
    {toast && <div className="contracts-toast" role="status">{toast.message}{toast.undo && <button type="button" onClick={() => { toast.undo(); setToast(null); }}>실행 취소</button>}</div>}
  </section>;
}

export default ContractsPage;
