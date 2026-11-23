import React, { useId, useRef } from "react";
import { validateBirthDate } from "../../utils/ageUtils";
import { FieldError, Question, StepActions, inputClass } from "./fields";

const FIELDS = [
  { key: "y", label: "출생 연도", placeholder: "YYYY", maxLength: 4, unit: "년" },
  { key: "m", label: "출생 월", placeholder: "MM", maxLength: 2, unit: "월" },
  { key: "d", label: "출생 일", placeholder: "DD", maxLength: 2, unit: "일" },
];

// 한 자리만 쳐도 더 올 수 없는 값이면 바로 다음 칸으로 (월 2~9, 일 4~9)
const isFieldDone = (key, text) => {
  if (key === "y") return text.length === 4;
  if (key === "m") return text.length === 2 || (text.length === 1 && Number(text) >= 2);
  return false;
};

export default function BirthDateStep({ answers, update, onNext, onPrev, canNext }) {
  const errorId = useId();
  const ageId = useId();
  const refs = { y: useRef(null), m: useRef(null), d: useRef(null) };
  const value = answers.birthDate;
  const result = validateBirthDate(value);

  const change = (key, raw) => {
    const text = raw.replace(/\D/g, "").slice(0, FIELDS.find((field) => field.key === key).maxLength);
    update({ birthDate: { ...value, [key]: text } });
    if (isFieldDone(key, text)) {
      const nextKey = key === "y" ? "m" : "d";
      refs[nextKey].current?.focus();
      refs[nextKey].current?.select();
    }
  };

  const handleKeyDown = (key, event) => {
    // 빈 칸에서 Backspace → 앞 칸으로
    if (event.key === "Backspace" && !event.currentTarget.value && key !== "y") {
      event.preventDefault();
      refs[key === "d" ? "m" : "y"].current?.focus();
    }
  };

  const describedBy = `${ageId} ${errorId}`;

  return (
    <Question label="기본 정보" title="생년월일을 알려주세요" help="만 나이로 확인 가능한 지원 정책을 알려드리기 위해 사용해요.">
      <fieldset className="m-0 border-0 p-0">
        <legend className="sr-only">생년월일</legend>
        <div className="grid grid-cols-[1.6fr_1fr_1fr] gap-2">
          {FIELDS.map((field) => (
            <label key={field.key} className="relative block">
              <span className="sr-only">{field.label}</span>
              <input
                ref={refs[field.key]}
                type="text"
                inputMode="numeric"
                autoComplete={field.key === "y" ? "bday-year" : field.key === "m" ? "bday-month" : "bday-day"}
                maxLength={field.maxLength}
                placeholder={field.placeholder}
                value={value[field.key]}
                aria-invalid={result.field === field.key || result.status === "underage" || undefined}
                aria-describedby={describedBy}
                onChange={(event) => change(field.key, event.target.value)}
                onKeyDown={(event) => handleKeyDown(field.key, event)}
                className={`${inputClass} pr-9 text-center tabular-nums`}
              />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[15px] text-ink-500" aria-hidden="true">
                {field.unit}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <FieldError id={errorId}>{result.error}</FieldError>

      <p
        id={ageId}
        aria-live="polite"
        className={`m-0 mt-2 inline-flex min-h-9 items-center rounded-full px-4 text-[15px] font-bold transition-opacity duration-200 ${
          result.age === null ? "opacity-0" : result.status === "underage" ? "bg-danger-50 text-danger-600 opacity-100" : "bg-brand-100 text-brand-700 opacity-100"
        }`}
      >
        {result.age !== null ? `만 ${result.age}세` : ""}
      </p>

      <StepActions onPrev={onPrev} onNext={onNext} canNext={canNext} />
    </Question>
  );
}
