import React, { useId } from "react";
import { DEAL_TYPES, ROOM_TYPES } from "../../utils/conditionsStore";
import { Chip, GroupLabel, Question, StepActions, useNumberKeys } from "./fields";

/** 희망 방 유형(복수) + 거래 유형(단일). 숫자키 1~3은 방 유형 */
export default function RoomDealStep({ answers, update, onNext, onPrev, prevLabel, canNext }) {
  const roomLabelId = useId();
  const dealLabelId = useId();

  const toggleRoom = (type) => {
    const selected = answers.roomTypes.includes(type);
    update({ roomTypes: selected ? answers.roomTypes.filter((item) => item !== type) : [...answers.roomTypes, type] });
  };

  useNumberKeys(ROOM_TYPES.length, (index) => toggleRoom(ROOM_TYPES[index]));

  return (
    <Question label="이사 조건" title="어떤 집을 찾고 있나요?" help="방 유형은 여러 개를 고를 수 있어요.">
      <div role="group" aria-labelledby={roomLabelId}>
        <GroupLabel id={roomLabelId}>방 유형</GroupLabel>
        <div className="flex flex-wrap gap-2">
          {ROOM_TYPES.map((type, index) => (
            <Chip key={type} selected={answers.roomTypes.includes(type)} onClick={() => toggleRoom(type)} shortcut={String(index + 1)}>
              {type}
            </Chip>
          ))}
        </div>
      </div>

      <div role="group" aria-labelledby={dealLabelId} className="mt-8">
        <GroupLabel id={dealLabelId}>거래 유형</GroupLabel>
        <div className="grid grid-cols-2 gap-2">
          {DEAL_TYPES.map((type) => {
            const selected = answers.dealType === type;
            return (
              <button
                key={type}
                type="button"
                aria-pressed={selected}
                onClick={() => update({ dealType: type })}
                className={`h-14 cursor-pointer rounded-[10px] border border-solid text-[17px] font-bold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-brand-600 ${
                  selected ? "border-brand-600 bg-brand-100 text-brand-700" : "border-border-strong bg-white text-ink-900 hover:bg-brand-50"
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>
        {answers.dealType === "전세" && <p className="m-0 mt-3 text-sm text-ink-500">전세를 고르면 월세 예산 질문은 건너뛰어요.</p>}
      </div>

      <StepActions onPrev={onPrev} prevLabel={prevLabel} onNext={onNext} canNext={canNext} />
    </Question>
  );
}
