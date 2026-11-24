import React, { useEffect, useId, useRef } from "react";
import { useStepActive } from "./OnboardingShell";
import { formatManwon, formatNumber, parseAmount } from "./format";

// Tailwind preflight를 쓰지 않으므로 버튼·입력칸의 배경·테두리·여백을 모두 직접 지정한다.

const cx = (...classes) => classes.filter(Boolean).join(" ");

// 글자 크기는 빼 둔 기본형. 같은 속성 클래스가 두 개 붙으면 CSS 순서로 승패가 갈리므로 크기는 따로 고른다.
const inputBase = cx(
  "box-border block h-14 w-full rounded-[10px] border border-solid border-border-strong bg-white px-4",
  "text-ink-900 placeholder:text-ink-500",
  "transition-colors duration-150",
  "focus:border-brand-600 focus:outline-2 focus:outline-offset-0 focus:outline-solid focus:outline-brand-600",
  "aria-[invalid=true]:border-danger-600 aria-[invalid=true]:focus:outline-danger-600",
  "disabled:cursor-not-allowed disabled:bg-brand-50 disabled:text-ink-700",
);

export const inputClass = cx(inputBase, "text-[17px]");

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-brand-600";

// 높이·여백·색·굵기는 종류별로만 정한다(같은 속성 클래스가 겹치지 않게).
const buttonBase = cx(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-[10px] text-base whitespace-nowrap",
  "transition-colors duration-150 disabled:cursor-not-allowed",
  focusRing,
);

export const buttonClass = {
  primary: cx(buttonBase, "h-12 border-0 bg-brand-600 px-5 font-bold text-white hover:bg-brand-700 disabled:bg-border-subtle disabled:text-ink-500"),
  secondary: cx(buttonBase, "h-12 border border-solid border-border-strong bg-white px-5 font-bold text-ink-900 hover:bg-brand-50"),
  /** 건너뛰기 같은 보조 텍스트 버튼 */
  text: cx(buttonBase, "h-11 border-0 bg-transparent px-3 font-semibold text-ink-500 underline-offset-4 hover:text-ink-900 hover:underline"),
  /** [수정]·[항목별로 입력] 같은 파란 텍스트 버튼 */
  link: cx(buttonBase, "h-11 border-0 bg-transparent px-3 font-semibold text-brand-600 underline-offset-4 hover:text-brand-700 hover:underline"),
};

/** 질문 머리(라벨·제목·도움말) + 입력 영역 */
export function Question({ label, title, help, children }) {
  const titleId = useId();
  const helpId = useId();
  return (
    <section aria-labelledby={titleId} aria-describedby={help ? helpId : undefined}>
      <div aria-live="polite">
        {label && <p className="m-0 text-sm font-bold text-brand-600">{label}</p>}
        <h1
          id={titleId}
          tabIndex={-1}
          data-step-title
          className="m-0 mt-2 text-[28px] leading-[1.35] font-bold tracking-[-0.02em] text-ink-900 outline-none"
        >
          {title}
        </h1>
        {help && <p id={helpId} className="m-0 mt-3 text-[15px] leading-relaxed text-ink-500">{help}</p>}
      </div>
      <div className="mt-10">{children}</div>
    </section>
  );
}

/**
 * [이전] [다음] 한 줄, 그 아래 [건너뛰기] 같은 텍스트 버튼.
 * @param {{ label: string, onClick: () => void }[]} [props.extra]
 */
export function StepActions({ onPrev, prevLabel = "이전", onNext, nextLabel = "다음", canNext = true, extra = [] }) {
  return (
    <div className="mt-10">
      <div className="flex items-center gap-3">
        {onPrev && (
          <button type="button" className={buttonClass.secondary} onClick={onPrev}>
            {prevLabel}
          </button>
        )}
        {onNext && (
          <button type="button" className={cx(buttonClass.primary, "flex-1 md:ml-auto md:flex-none md:min-w-36")} onClick={onNext} disabled={!canNext}>
            {nextLabel}
          </button>
        )}
      </div>
      {extra.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-1 md:justify-end">
          {extra.map((action) => (
            <button key={action.label} type="button" className={buttonClass.text} onClick={action.onClick}>
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function FieldError({ id, children }) {
  return (
    <p id={id} className="m-0 mt-2 min-h-5 text-sm font-medium text-danger-600" aria-live="polite">
      {children}
    </p>
  );
}

export function GroupLabel({ id, children, className = "" }) {
  return <p id={id} className={cx("m-0 mb-3 text-[15px] font-bold text-ink-900", className)}>{children}</p>;
}

/** 칩: 복수 선택은 aria-pressed, 단일 선택 묶음도 같은 모양을 쓴다 */
export function Chip({ selected, onClick, children, shortcut, disabled }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-keyshortcuts={shortcut}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        "inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-solid px-4 text-[15px] font-semibold transition-colors duration-150",
        focusRing,
        selected
          ? "border-brand-600 bg-brand-100 text-brand-700"
          : "border-border-strong bg-white text-ink-900 hover:bg-brand-50",
        "disabled:cursor-not-allowed disabled:opacity-50",
      )}
    >
      {children}
    </button>
  );
}

/** 큰 선택 카드 */
export function ChoiceCard({ selected, onClick, title, description, shortcut }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-keyshortcuts={shortcut}
      onClick={onClick}
      className={cx(
        "flex min-h-[72px] w-full cursor-pointer items-center gap-4 rounded-xl border border-solid px-5 py-4 text-left transition-colors duration-150",
        focusRing,
        selected ? "border-brand-600 bg-brand-100" : "border-border-strong bg-white hover:bg-brand-50",
      )}
    >
      <span className="flex flex-col gap-1">
        <span className="text-[17px] font-bold text-ink-900">{title}</span>
        {description && <span className={cx("text-sm", selected ? "text-ink-700" : "text-ink-500")}>{description}</span>}
      </span>
    </button>
  );
}

/**
 * 숫자키 1~N으로 선택. 글자 입력칸에 포커스가 있을 때와 나가는 중인 질문에서는 동작하지 않는다.
 * @param {((index: number) => void) | null} onPick
 */
export function useNumberKeys(count, onPick) {
  const active = useStepActive();
  const pickRef = useRef(onPick);
  pickRef.current = onPick;

  useEffect(() => {
    if (!active || !count) return undefined;
    const handleKeyDown = (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.repeat || event.isComposing) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || target.closest("input, textarea, select"))) return;
      const index = Number(event.key) - 1;
      if (!Number.isInteger(index) || index < 0 || index >= Math.min(count, 4)) return;
      event.preventDefault();
      pickRef.current?.(index);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active, count]);
}

/** 만원 단위 숫자 입력. 값은 number | null */
export function AmountInput({ value, onChange, unit = "만원", size = "md", max, describedBy, invalid, autoFocus, ...rest }) {
  return (
    <div className="relative">
      <input
        {...rest}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        data-autofocus={autoFocus ? true : undefined}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        value={formatNumber(value)}
        onChange={(event) => onChange(parseAmount(event.target.value, max))}
        className={cx(inputBase, "pr-16 tabular-nums", size === "lg" ? "text-2xl font-bold" : "text-[17px]")}
      />
      <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[15px] font-semibold text-ink-500">{unit}</span>
    </div>
  );
}

/** 큰 숫자 입력 + 슬라이더 + 빠른 선택 칩(숫자키 1~4) */
export function AmountField({ label, value, onChange, sliderMax, sliderStep, quickValues = [] }) {
  const readoutId = useId();
  const sliderValue = Math.min(value ?? 0, sliderMax);
  useNumberKeys(quickValues.length, (index) => onChange(quickValues[index]));

  return (
    <div>
      <AmountInput
        size="lg"
        value={value}
        onChange={onChange}
        aria-label={`${label} (만원)`}
        describedBy={readoutId}
        autoFocus
      />
      <p id={readoutId} className="m-0 mt-2 min-h-5 text-sm text-ink-500" aria-live="polite">
        {value !== null && value !== undefined ? formatManwon(value) : "금액을 입력하거나 아래에서 골라 주세요."}
      </p>

      <input
        type="range"
        min={0}
        max={sliderMax}
        step={sliderStep}
        value={sliderValue}
        aria-label={`${label} 슬라이더`}
        aria-valuetext={formatManwon(sliderValue)}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-6 block h-6 w-full cursor-pointer accent-brand-600"
      />
      <div className="mt-1 flex justify-between text-xs text-ink-500" aria-hidden="true">
        <span>0</span>
        <span>{formatManwon(sliderMax)}</span>
      </div>

      {quickValues.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="빠른 선택">
          {quickValues.map((amount, index) => (
            <Chip key={amount} selected={value === amount} onClick={() => onChange(amount)} shortcut={index < 4 ? String(index + 1) : undefined}>
              {formatManwon(amount).replace(" 원", "")}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}

/** 1~N 또는 분 단위 슬라이더 한 줄 */
export function LabeledSlider({ label, value, onChange, min, max, step = 1, valueText, minLabel, maxLabel }) {
  const id = useId();
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-[15px] font-bold text-ink-900">{label}</label>
        <span className="text-[15px] font-bold tabular-nums text-brand-600" aria-hidden="true">{valueText}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={valueText}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 block h-6 w-full cursor-pointer accent-brand-600"
      />
      {(minLabel || maxLabel) && (
        <div className="mt-1 flex justify-between text-xs text-ink-500" aria-hidden="true">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  );
}
