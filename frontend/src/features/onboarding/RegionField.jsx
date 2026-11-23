import React, { useId, useMemo, useState } from "react";
import { SIDO_NAMES, getSigunguList, hasSigungu, searchRegions } from "../../data/regions";
import { regionKey } from "../../utils/conditionsStore";
import { formatRegionName } from "./format";
import { inputClass } from "./fields";

const selectClass = `${inputClass} cursor-pointer appearance-auto pr-10`;

/**
 * 지역 검색 콤보박스. 결과를 고르면 onPick({ sido, sigungu }).
 * Enter·방향키는 목록이 열려 있을 때 이 칸이 직접 처리한다(data-enter-own).
 */
export function RegionSearch({ onPick, exclude = [], placeholder = "시·군·구 이름으로 검색 (예: 마포구)", disabled, autoFocus }) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const excluded = useMemo(() => new Set(exclude.map(regionKey)), [exclude]);
  const results = useMemo(
    () => searchRegions(query, 12).filter((region) => !excluded.has(regionKey(region))).slice(0, 8),
    [query, excluded],
  );
  const expanded = open && query.trim() !== "";

  const pick = (region) => {
    onPick(region);
    setQuery("");
    setOpen(false);
    setActiveIndex(0);
  };

  const handleKeyDown = (event) => {
    if (!expanded) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!results.length) return;
      const delta = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((index) => (index + delta + results.length) % results.length);
    } else if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      if (!results.length) return;
      event.preventDefault();
      pick(results[Math.min(activeIndex, results.length - 1)]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <input
        type="search"
        role="combobox"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={expanded && results.length ? `${listId}-${activeIndex}` : undefined}
        aria-label="지역 검색"
        data-enter-own={expanded && results.length ? true : undefined}
        data-autofocus={autoFocus ? true : undefined}
        autoComplete="off"
        disabled={disabled}
        placeholder={placeholder}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActiveIndex(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
        className={inputClass}
      />
      {expanded && (
        <ul
          id={listId}
          role="listbox"
          aria-label="검색 결과"
          className="absolute top-full right-0 left-0 z-10 m-0 mt-1 max-h-72 list-none overflow-auto rounded-[10px] border border-solid border-border-strong bg-white p-1 shadow-lg"
        >
          {results.length === 0 && <li className="px-3 py-3 text-[15px] text-ink-500">찾는 지역이 없어요. 시·군·구 이름을 확인해 주세요.</li>}
          {results.map((region, index) => (
            <li
              key={regionKey(region)}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => pick(region)}
              onMouseEnter={() => setActiveIndex(index)}
              className={`cursor-pointer rounded-lg px-3 py-3 text-[15px] ${index === activeIndex ? "bg-brand-100 text-ink-900" : "text-ink-900"}`}
            >
              <span className="font-semibold">{region.sigungu || region.sido}</span>
              {region.sigungu && <span className="ml-2 text-ink-700">{region.sido}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** 시도 → 시군구 2단 선택 + 검색으로 바로 고르기 */
export function RegionSelect({ value, onChange, idPrefix }) {
  const sidoId = `${idPrefix}-sido`;
  const sigunguId = `${idPrefix}-sigungu`;
  const sido = value?.sido ?? "";
  const sigunguList = getSigunguList(sido);
  const needsSigungu = sido ? hasSigungu(sido) : true;

  return (
    <div>
      <RegionSearch onPick={(region) => onChange(region)} autoFocus />
      <p className="m-0 mt-6 mb-3 text-sm text-ink-500">또는 직접 고르기</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor={sidoId} className="sr-only">시도</label>
          <select
            id={sidoId}
            value={sido}
            onChange={(event) => onChange({ sido: event.target.value, sigungu: "" })}
            className={selectClass}
          >
            <option value="">시·도</option>
            {SIDO_NAMES.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={sigunguId} className="sr-only">시군구</label>
          <select
            id={sigunguId}
            value={value?.sigungu ?? ""}
            disabled={!sido || !needsSigungu}
            onChange={(event) => onChange({ sido, sigungu: event.target.value })}
            className={selectClass}
          >
            <option value="">{sido && !needsSigungu ? "시·군·구 없음" : "시·군·구"}</option>
            {sigunguList.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>
      </div>
      {sido && (
        <p className="m-0 mt-4 text-[15px] text-ink-700" aria-live="polite">
          선택한 지역: <b className="text-ink-900">{formatRegionName(value)}</b>
          {needsSigungu && !value?.sigungu && <span className="text-ink-500"> (시·군·구를 골라 주세요)</span>}
        </p>
      )}
    </div>
  );
}
