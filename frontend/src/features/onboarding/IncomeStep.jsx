import React, { useId } from "react";
import { INCOME_BASIS_LABELS } from "../../utils/conditionsStore";
import { AmountInput, Chip, GroupLabel, Question, StepActions } from "./fields";
import { formatManwon } from "./format";

/** 월 소득(선택): 금액 + 세전/세후 */
export default function IncomeStep({ answers, update, onNext, onPrev, prevLabel, canNext, onSkip }) {
  const basisLabelId = useId();
  const readoutId = useId();
  const income = answers.income;
  const amount = income?.amount ?? null;
  const basis = income?.basis ?? null;

  const setIncome = (next) => {
    const merged = { amount, basis, ...next };
    // 금액을 지우면 소득 전체를 비운다(세전/세후 선택만 남지 않게)
    update({ income: merged.amount === null ? null : merged });
  };

  return (
    <Question label="소득·지출 (선택)" title="한 달 소득은 얼마인가요?" help="정책 조건 확인에만 사용하고, 설정에서 언제든 지울 수 있어요.">
      <AmountInput size="lg" value={amount} onChange={(value) => setIncome({ amount: value })} aria-label="월 소득 (만원)" describedBy={readoutId} autoFocus />
      <p id={readoutId} className="m-0 mt-2 min-h-5 text-sm text-ink-500" aria-live="polite">
        {amount !== null ? formatManwon(amount) : "만원 단위로 적어 주세요."}
      </p>

      <div role="group" aria-labelledby={basisLabelId} className="mt-6">
        <GroupLabel id={basisLabelId}>기준</GroupLabel>
        <div className="flex gap-2">
          {Object.entries(INCOME_BASIS_LABELS).map(([key, label]) => (
            <Chip key={key} selected={basis === key} disabled={amount === null} onClick={() => setIncome({ basis: key })}>
              {label}
            </Chip>
          ))}
        </div>
        {amount !== null && !basis && <p className="m-0 mt-2 text-sm text-ink-500">세전인지 세후인지 골라 주세요.</p>}
      </div>

      <StepActions
        onPrev={onPrev}
        prevLabel={prevLabel}
        onNext={onNext}
        canNext={canNext}
        extra={[
          { label: "건너뛰기", onClick: () => onSkip({ income: null }) },
          { label: "말하고 싶지 않아요", onClick: () => onSkip({ income: null }) },
        ]}
      />
    </Question>
  );
}
