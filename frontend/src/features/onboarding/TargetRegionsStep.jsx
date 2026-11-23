import React from "react";
import { MAX_TARGET_REGIONS, regionKey } from "../../utils/conditionsStore";
import { Question, StepActions } from "./fields";
import { formatRegionName } from "./format";
import { RegionSearch } from "./RegionField";

/** 이사 희망 지역(선택): 검색 + 칩, 최대 5개 */
export default function TargetRegionsStep({ answers, update, onNext, onPrev, prevLabel, onSkip }) {
  const regions = answers.targetRegions;
  const isFull = regions.length >= MAX_TARGET_REGIONS;

  const add = (region) => {
    if (isFull || regions.some((item) => regionKey(item) === regionKey(region))) return;
    update({ targetRegions: [...regions, region] });
  };
  const remove = (region) => update({ targetRegions: regions.filter((item) => regionKey(item) !== regionKey(region)) });

  return (
    <Question label="이사 조건" title="어느 지역으로 이사하고 싶나요?" help={`최대 ${MAX_TARGET_REGIONS}개까지 고를 수 있어요. 아직 정하지 않았다면 건너뛰어도 돼요.`}>
      <RegionSearch
        onPick={add}
        exclude={regions}
        disabled={isFull}
        autoFocus
        placeholder={isFull ? `${MAX_TARGET_REGIONS}개를 모두 골랐어요` : "시·군·구 이름으로 검색 (예: 유성구)"}
      />

      <div className="mt-4 flex min-h-11 flex-wrap gap-2" aria-live="polite">
        {regions.length === 0 && <p className="m-0 self-center text-[15px] text-ink-500">아직 고른 지역이 없어요.</p>}
        {regions.map((region) => (
          <span key={regionKey(region)} className="inline-flex h-11 items-center gap-1 rounded-full border border-solid border-brand-600 bg-brand-100 pr-1 pl-4 text-[15px] font-semibold text-brand-700">
            {formatRegionName(region)}
            <button
              type="button"
              onClick={() => remove(region)}
              aria-label={`${formatRegionName(region)} 빼기`}
              className="grid size-8 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-lg leading-none text-brand-700 hover:bg-brand-200 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-brand-600"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <p className="m-0 mt-2 text-right text-sm tabular-nums text-ink-500">{regions.length} / {MAX_TARGET_REGIONS}</p>

      <StepActions
        onPrev={onPrev}
        prevLabel={prevLabel}
        onNext={onNext}
        canNext
        extra={[{ label: "건너뛰기", onClick: () => onSkip({ targetRegions: [] }) }]}
      />
    </Question>
  );
}
