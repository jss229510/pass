import React, { useEffect, useId, useRef, useState } from "react";
import { EXPENSE_ITEM_LABELS, sumExpenseDetail } from "../../utils/conditionsStore";
import { AmountInput, Question, StepActions, buttonClass } from "./fields";
import { formatManwon } from "./format";

const ITEM_KEYS = Object.keys(EXPENSE_ITEM_LABELS);

/** 월 평균 지출(선택): 합계 또는 항목별 입력 */
export default function ExpenseStep({ answers, update, onNext, onPrev, prevLabel, canNext, onSkip }) {
  const panelId = useId();
  const readoutId = useId();
  const expense = answers.monthlyExpense;
  const [detailOpen, setDetailOpen] = useState(Boolean(expense?.detail));
  const [draftDetail, setDraftDetail] = useState(() => expense?.detail ?? Object.fromEntries(ITEM_KEYS.map((key) => [key, null])));

  const firstItemRef = useRef(null);
  const [focusFirstItem, setFocusFirstItem] = useState(false);
  useEffect(() => {
    if (focusFirstItem) firstItemRef.current?.focus();
    setFocusFirstItem(false);
  }, [focusFirstItem]);

  const hasDetail = detailOpen && ITEM_KEYS.some((key) => draftDetail[key] !== null);
  const total = expense?.total ?? null;

  const setTotal = (value) => update({ monthlyExpense: value === null ? null : { total: value, detail: null } });

  const setItem = (key, value) => {
    const detail = { ...draftDetail, [key]: value };
    setDraftDetail(detail);
    const anyValue = ITEM_KEYS.some((item) => detail[item] !== null);
    update({ monthlyExpense: anyValue ? { total: sumExpenseDetail(detail), detail } : null });
  };

  const toggleDetail = () => {
    if (detailOpen) {
      // 접으면 합계만 남긴다
      setDetailOpen(false);
      update({ monthlyExpense: total === null ? null : { total, detail: null } });
    } else {
      setDetailOpen(true);
      setFocusFirstItem(true);
    }
  };

  return (
    <Question label="소득·지출 (선택)" title="한 달 고정 지출은 얼마인가요?" help="월세는 빼고 식비·교통비·통신비·구독료처럼 매달 나가는 돈의 합계예요.">
      <AmountInput
        size="lg"
        value={total}
        onChange={setTotal}
        aria-label="월 고정 지출 합계 (만원)"
        describedBy={readoutId}
        disabled={hasDetail}
        autoFocus={!hasDetail}
      />
      <p id={readoutId} className="m-0 mt-2 min-h-5 text-sm text-ink-500" aria-live="polite">
        {hasDetail ? `항목 합계 ${formatManwon(total ?? 0)}` : total !== null ? formatManwon(total) : "만원 단위로 적어 주세요."}
      </p>

      <button
        type="button"
        aria-expanded={detailOpen}
        aria-controls={panelId}
        onClick={toggleDetail}
        className={`${buttonClass.link} mt-4 -ml-3`}
      >
        {detailOpen ? "항목별 입력 접기" : "항목별로 입력"}
        <span aria-hidden="true" className={`inline-block transition-transform duration-200 motion-reduce:transition-none ${detailOpen ? "rotate-180" : ""}`}>▾</span>
      </button>

      {detailOpen && (
        <div id={panelId} className="mt-3 grid grid-cols-1 gap-4 animate-ob-enter-up motion-reduce:animate-none sm:grid-cols-2">
          {ITEM_KEYS.map((key, index) => (
            <label key={key} className="block">
              <span className="mb-2 block text-[15px] font-semibold text-ink-900">{EXPENSE_ITEM_LABELS[key]}</span>
              <AmountInput ref={index === 0 ? firstItemRef : undefined} value={draftDetail[key]} onChange={(value) => setItem(key, value)} autoFocus={index === 0} />
            </label>
          ))}
        </div>
      )}

      <StepActions
        onPrev={onPrev}
        prevLabel={prevLabel}
        onNext={onNext}
        canNext={canNext}
        extra={[{ label: "건너뛰기", onClick: () => onSkip({ monthlyExpense: null }) }]}
      />
    </Question>
  );
}
