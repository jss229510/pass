import React from "react";
import { WEIGHT_LABELS, WEIGHT_MAX, WEIGHT_MIN } from "../../utils/conditionsStore";
import { LabeledSlider, Question, StepActions } from "./fields";

const LEVEL_TEXT = { 1: "덜 중요", 2: "조금 중요", 3: "보통", 4: "중요", 5: "아주 중요" };

/** 우선순위 4개 슬라이더(1~5) */
export default function WeightsStep({ answers, update, onNext, onPrev, prevLabel }) {
  const setWeight = (key, value) => update({ weights: { ...answers.weights, [key]: value } });

  return (
    <Question label="우선순위" title="무엇을 더 중요하게 볼까요?" help="가중치는 직접 정해요. 1은 덜 중요, 5는 아주 중요해요.">
      <div className="flex flex-col gap-7">
        {Object.entries(WEIGHT_LABELS).map(([key, label]) => (
          <LabeledSlider
            key={key}
            label={label}
            value={answers.weights[key]}
            min={WEIGHT_MIN}
            max={WEIGHT_MAX}
            valueText={`${answers.weights[key]} · ${LEVEL_TEXT[answers.weights[key]]}`}
            minLabel="1"
            maxLabel="5"
            onChange={(value) => setWeight(key, value)}
          />
        ))}
      </div>
      <StepActions onPrev={onPrev} prevLabel={prevLabel} onNext={onNext} nextLabel="입력 내용 확인" />
    </Question>
  );
}
