import React from "react";
import { Question, StepActions } from "./fields";
import { RegionSelect } from "./RegionField";

/** 현재 거주지(필수): 시도 → 시군구 */
export default function RegionStep({ answers, update, onNext, onPrev, prevLabel, canNext }) {
  return (
    <Question label="기본 정보" title="지금 어디에 살고 있나요?" help="시·군·구까지만 받아요. 상세 주소는 묻지 않아요.">
      <RegionSelect idPrefix="current-region" value={answers.region} onChange={(region) => update({ region })} />
      <StepActions onPrev={onPrev} prevLabel={prevLabel} onNext={onNext} canNext={canNext} />
    </Question>
  );
}
