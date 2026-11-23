import React, { useEffect, useRef } from "react";
import { TERNARY_LABELS } from "../../utils/conditionsStore";
import { ChoiceCard, Question, StepActions, useNumberKeys } from "./fields";
import { useStepActive } from "./OnboardingShell";

const AUTO_NEXT_MS = 300;

const CONFIG = {
  livesApart: {
    title: "부모님과 따로 살고 있나요?",
    help: "청년 주거 지원은 부모와 따로 사는지에 따라 조건이 달라져요. 지금 기준으로 골라 주세요.",
    descriptions: { yes: "부모님과 다른 집에 살아요", no: "부모님과 함께 살아요", unknown: "확실하지 않아요" },
  },
  homeless: {
    title: "무주택자인가요?",
    help: "본인 명의로 된 집이 없으면 '예'를 골라 주세요.",
    descriptions: { yes: "내 명의의 집이 없어요", no: "내 명의의 집이 있어요", unknown: "확실하지 않아요" },
  },
};

const OPTIONS = Object.keys(TERNARY_LABELS);

/** 예/아니오/모름 큰 카드. 고르면 300ms 뒤 자동으로 다음 질문 */
export default function ChoiceCardStep({ field, answers, update, onNext, onPrev, prevLabel, canNext }) {
  const config = CONFIG[field];
  const active = useStepActive();
  const timerRef = useRef(null);
  const nextRef = useRef(onNext);
  nextRef.current = onNext;

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const choose = (value) => {
    if (!active) return;
    update({ [field]: value });
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => nextRef.current?.(), AUTO_NEXT_MS);
  };

  useNumberKeys(OPTIONS.length, (index) => choose(OPTIONS[index]));

  return (
    <Question label="가구 상황" title={config.title} help={config.help}>
      <div className="flex flex-col gap-3" role="group" aria-label={config.title}>
        {OPTIONS.map((value, index) => (
          <ChoiceCard
            key={value}
            selected={answers[field] === value}
            onClick={() => choose(value)}
            title={TERNARY_LABELS[value]}
            description={config.descriptions[value]}
            shortcut={String(index + 1)}
          />
        ))}
      </div>
      <StepActions onPrev={onPrev} prevLabel={prevLabel} onNext={onNext} canNext={canNext} />
    </Question>
  );
}
