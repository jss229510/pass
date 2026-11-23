import React, { useState } from "react";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaFileAlt,
  FaHourglassHalf,
  FaRegClock,
  FaTimesCircle,
} from "react-icons/fa";

const statusOptions = {
  "분석 전": { icon: FaRegClock, className: "is-pending", action: "분석하기", actionType: "primary" },
  "분석 중": { icon: FaHourglassHalf, className: "is-analyzing", action: "분석 중", actionType: "progress" },
  "확인 필요": { icon: FaExclamationTriangle, className: "is-warning", action: "확인하기", actionType: "primary" },
  "점검 완료": { icon: FaCheckCircle, className: "is-complete", action: "결과 보기", actionType: "secondary" },
  실패: { icon: FaTimesCircle, className: "is-failed", action: "다시 시도", actionType: "primary" },
};

function ContractRow({ contract, onAction, onRequestRename, onRequestDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const status = statusOptions[contract.status] ?? statusOptions["분석 전"];
  const StatusIcon = status.icon;
  const isAnalyzing = contract.status === "분석 중";

  return (
    <article className={`contract-row ${expanded ? "is-expanded" : ""}`}>
      <div className="contract-row-main">
        <button
          type="button"
          className="contract-row-document"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-controls={`contract-detail-${contract.id}`}
        >
          <span className="contract-row-file-icon" aria-hidden="true"><FaFileAlt /></span>
          <span>
            <strong>{contract.fileName}</strong>
            <small>{contract.subtitle ?? "주요 조항 점검 완료 · 어제"}</small>
          </span>
        </button>

        <span className={`contract-row-status ${status.className}`}><StatusIcon aria-hidden="true" />{contract.status}</span>

        {isAnalyzing ? (
          <span className="contract-row-progress" aria-label="분석 진행 중"><i />분석 중</span>
        ) : (
          <button type="button" className={`contract-row-action ${status.actionType}`} onClick={() => onAction?.(contract)}>{status.action}</button>
        )}

        <div className="contract-row-menu">
          <button type="button" className="contract-row-more" onClick={() => setMenuOpen((value) => !value)} aria-label={`${contract.fileName} 더보기`} aria-expanded={menuOpen}>⋯</button>
          {menuOpen && (
            <div className="contract-row-menu-popover" role="menu">
              <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); onRequestRename?.(contract); }}>이름 변경</button>
              <button type="button" role="menuitem" className="danger" onClick={() => { setMenuOpen(false); onRequestDelete?.(contract); }}>삭제</button>
            </div>
          )}
        </div>
      </div>

      {expanded && (
        <dl className="contract-row-detail" id={`contract-detail-${contract.id}`}>
          <div><dt>문서 유형</dt><dd>{contract.documentType ?? "임대차계약서"}</dd></div>
          <div><dt>관련 지역</dt><dd>{contract.region ?? "대전광역시 유성구"}</dd></div>
          <div><dt>업로드일</dt><dd>{contract.uploadedAt ?? "2026.11.23"}</dd></div>
          <div><dt>자동 파기 예정</dt><dd>{contract.disposalDue ?? "D-30"}</dd></div>
          <div className="summary"><dt>점검 요약</dt><dd>{contract.summary ?? "미충족 1 · 확인 필요 2"}</dd></div>
        </dl>
      )}
    </article>
  );
}

export default ContractRow;
