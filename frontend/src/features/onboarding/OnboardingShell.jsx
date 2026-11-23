import React, { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";

// 진행 바 + 질문 전환 컨테이너.
// stepKey가 바뀌면 이전 질문을 250ms 동안 내보내고(위로/아래로 페이드아웃),
// 새 질문을 300ms 동안 들여보낸다. prefers-reduced-motion이면 바로 바꾼다.

const LEAVE_MS = 250;

const StepActiveContext = createContext(true);

/** 나가는 중인 질문 안에서는 false. 숫자키·자동 넘김 같은 전역 동작을 막을 때 쓴다. */
export const useStepActive = () => useContext(StepActiveContext);

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

const ENTER_CLASS = { forward: "animate-ob-enter-up", back: "animate-ob-enter-down" };
const LEAVE_CLASS = { forward: "animate-ob-leave-up", back: "animate-ob-leave-down" };

const isComposing = (event) => event.nativeEvent?.isComposing || event.keyCode === 229;

/**
 * @param {object} props
 * @param {string} props.stepKey         현재 화면 id. 바뀌면 전환한다.
 * @param {"forward"|"back"} props.direction
 * @param {{ current: number, total: number } | null} props.count  "3 / 11" 표시. null이면 숨긴다.
 * @param {string | null} [props.headerLabel]  count 대신 오른쪽 위에 보여줄 글자(예: "이사 조건 수정")
 * @param {number} props.progress        0~1
 * @param {boolean} props.canNext        Enter로 넘어갈 수 있는지
 * @param {() => void} [props.onNext]    Enter
 * @param {() => void} [props.onPrev]    Shift+Enter
 */
export default function OnboardingShell({ stepKey, direction = "forward", count, headerLabel, progress, canNext, onNext, onPrev, children }) {
  const [shownKey, setShownKey] = useState(stepKey);
  const [enterDirection, setEnterDirection] = useState(null); // 첫 화면은 애니메이션 없이 보여준다
  const frozenChildren = useRef(children);
  const contentRef = useRef(null);

  const leaving = stepKey !== shownKey;

  // 나가는 동안에는 바뀌기 직전 화면을 그대로 보여준다.
  useLayoutEffect(() => {
    if (!leaving) frozenChildren.current = children;
  });

  useEffect(() => {
    if (!leaving) return undefined;
    const swap = () => {
      setShownKey(stepKey);
      setEnterDirection(prefersReducedMotion() ? null : direction);
    };
    if (prefersReducedMotion()) {
      swap();
      return undefined;
    }
    const timer = window.setTimeout(swap, LEAVE_MS);
    return () => window.clearTimeout(timer);
  }, [leaving, stepKey, direction]);

  // 새 질문이 들어오면 첫 입력칸에, 입력칸이 없으면 제목에 포커스를 준다.
  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;
    const target = root.querySelector("[data-autofocus]")
      ?? root.querySelector("input:not([disabled]):not([type='range']):not([type='hidden']), select:not([disabled]), textarea:not([disabled])")
      ?? root.querySelector("[data-step-title]");
    target?.focus({ preventScroll: true });
    window.scrollTo?.({ top: 0 });
  }, [shownKey]);

  const handleKeyDown = (event) => {
    if (event.key !== "Enter" || isComposing(event) || event.defaultPrevented || leaving) return;
    if (event.shiftKey) {
      event.preventDefault();
      onPrev?.();
      return;
    }
    // 버튼·링크는 Enter로 자기 동작을 한다(칩 선택 등). 검색 목록처럼 Enter를 직접 쓰는 곳은 data-enter-own.
    if (event.target.closest?.("button, a, textarea, [data-enter-own]")) return;
    event.preventDefault();
    if (canNext) onNext?.();
  };

  const content = leaving ? frozenChildren.current : children;
  const motionClass = leaving
    ? LEAVE_CLASS[direction]
    : enterDirection ? ENTER_CLASS[enterDirection] : "";
  const percent = Math.round(Math.min(1, Math.max(0, progress ?? 0)) * 100);

  return (
    <div className="min-h-dvh bg-white font-sans text-ink-900" onKeyDown={handleKeyDown}>
      <header className="flex h-16 items-center justify-between px-4 md:px-10">
        <span className="text-xl font-black tracking-tight text-brand-600">LOGO</span>
        {!count && headerLabel && <p className="m-0 text-sm font-semibold text-ink-500">{headerLabel}</p>}
        {count && (
          <p className="m-0 text-sm font-semibold tabular-nums text-ink-500">
            <span className="sr-only">진행 단계 </span>{count.current} / {count.total}
          </p>
        )}
      </header>

      <div
        className="h-1 w-full bg-brand-50"
        role="progressbar"
        aria-label="온보딩 진행률"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div
          className="h-full bg-brand-600 transition-[width] duration-300 ease-out motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mx-auto w-full max-w-[480px] px-4 pt-14 pb-24 md:px-0 md:pt-24">
        <StepActiveContext.Provider value={!leaving}>
          <div
            key={shownKey}
            ref={contentRef}
            data-ob-content
            className={`${motionClass} break-keep motion-reduce:animate-none`}
            inert={leaving}
          >
            {content}
          </div>
        </StepActiveContext.Provider>
      </div>
    </div>
  );
}
