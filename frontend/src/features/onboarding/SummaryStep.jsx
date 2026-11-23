import React from "react";
import { Question, StepActions, buttonClass } from "./fields";
import { SKIPPED, buildConditionRows } from "./conditionRows";
import { getMissingRequired } from "./steps";

export default function SummaryStep({ answers, onEdit, onPrev, onComplete, completing }) {
  const missing = new Set(getMissingRequired(answers));
  const rows = buildConditionRows(answers);

  return (
    <Question label="마지막 확인" title="입력한 내용을 확인해 주세요" help="고칠 항목은 [수정]을 눌러 바꿀 수 있어요.">
      <dl className="m-0 divide-y divide-border-subtle border-y border-border-subtle">
        {rows.map((row) => {
          const isMissing = missing.has(row.stepId);
          return (
            <div key={row.stepId} className="flex items-start gap-3 py-4">
              <div className="min-w-0 flex-1">
                <dt className="text-sm font-semibold text-ink-500">{row.label}</dt>
                <dd className={`m-0 mt-1 text-base leading-relaxed break-keep ${isMissing ? "font-semibold text-danger-600" : row.value === SKIPPED ? "text-ink-500" : "text-ink-900"}`}>
                  {isMissing ? "입력이 필요해요" : row.value}
                </dd>
              </div>
              <button
                type="button"
                onClick={() => onEdit(row.stepId)}
                aria-label={`${row.label} 수정`}
                className={`${buttonClass.link} -mr-3 shrink-0`}
              >
                수정
              </button>
            </div>
          );
        })}
      </dl>

      {missing.size > 0 && (
        <p className="m-0 mt-4 text-sm font-medium text-danger-600" aria-live="polite">
          필수 항목 {missing.size}개를 입력하면 시작할 수 있어요.
        </p>
      )}

      <StepActions
        onPrev={onPrev}
        onNext={onComplete}
        nextLabel={completing ? "저장하는 중…" : "완료하고 시작하기"}
        canNext={missing.size === 0 && !completing}
      />
    </Question>
  );
}
