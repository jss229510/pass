import React from "react";
import { LabeledSlider, Question, StepActions } from "./fields";
import { RegionSelect } from "./RegionField";

export const DEFAULT_MAX_COMMUTE = 60;

/** 직장·학교 위치(시군구까지) + 최대 출퇴근 시간(분). 선택 */
export default function CommuteStep({ answers, update, onNext, onPrev, prevLabel, canNext, onSkip }) {
  const minutes = answers.maxCommute ?? DEFAULT_MAX_COMMUTE;

  return (
    <Question label="생활권 (선택)" title="직장이나 학교는 어디에 있나요?" help="시·군·구까지만 받아요. 출퇴근에 쓸 수 있는 최대 시간도 정해 주세요.">
      <RegionSelect
        idPrefix="work-region"
        value={answers.workRegion ?? { sido: "", sigungu: "" }}
        onChange={(region) => update({ workRegion: region, maxCommute: answers.maxCommute ?? DEFAULT_MAX_COMMUTE })}
      />

      <div className="mt-8">
        <LabeledSlider
          label="최대 출퇴근 시간 (편도)"
          value={minutes}
          min={10}
          max={120}
          step={5}
          valueText={`${minutes}분`}
          minLabel="10분"
          maxLabel="2시간"
          onChange={(value) => update({ maxCommute: value })}
        />
      </div>

      <StepActions
        onPrev={onPrev}
        prevLabel={prevLabel}
        onNext={onNext}
        canNext={canNext}
        extra={[{ label: "건너뛰기", onClick: () => onSkip({ workRegion: null, maxCommute: null }) }]}
      />
    </Question>
  );
}
