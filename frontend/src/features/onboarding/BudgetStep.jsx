import React from "react";
import { AmountField, Question, StepActions } from "./fields";

const CONFIG = {
  deposit: {
    field: "depositBudget",
    label: "보증금 예산",
    title: "보증금은 얼마까지 생각하세요?",
    help: "단위는 만원이에요. 바로 낼 수 있는 금액 기준으로 적어 주세요.",
    quick: [500, 1000, 2000, 3000],
    slider: { 월세: { max: 5000, step: 50 }, 전세: { max: 50000, step: 500 } },
  },
  rent: {
    field: "rentBudget",
    label: "월세 예산",
    title: "월세는 한 달에 얼마까지 괜찮나요?",
    help: "단위는 만원이에요. 관리비는 빼고 생각해 주세요.",
    quick: [30, 40, 50, 70],
    slider: { 월세: { max: 200, step: 1 } },
  },
};

/** 보증금·월세 예산 공용: 큰 숫자 입력 + 슬라이더 + 빠른 선택 칩 */
export default function BudgetStep({ kind, answers, update, onNext, onPrev, prevLabel, canNext }) {
  const config = CONFIG[kind];
  const slider = config.slider[answers.dealType] ?? config.slider.월세;

  return (
    <Question label="예산" title={config.title} help={config.help}>
      <AmountField
        label={config.label}
        value={answers[config.field]}
        onChange={(value) => update({ [config.field]: value })}
        sliderMax={slider.max}
        sliderStep={slider.step}
        quickValues={config.quick}
      />
      <StepActions onPrev={onPrev} prevLabel={prevLabel} onNext={onNext} canNext={canNext} />
    </Question>
  );
}
