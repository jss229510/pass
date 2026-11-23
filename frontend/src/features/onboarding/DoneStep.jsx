import React, { useEffect, useRef } from "react";
import { prefersReducedMotion } from "./OnboardingShell";

const STAY_MS = 1300; // 체크 그리기 600ms + 잠깐 머무름

/** 완료 화면: 체크 아이콘을 그린 뒤 onFinish */
export default function DoneStep({ onFinish }) {
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  useEffect(() => {
    const timer = window.setTimeout(() => finishRef.current?.(), prefersReducedMotion() ? 900 : STAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center pt-10 text-center" role="status">
      <svg viewBox="0 0 80 80" className="size-20 animate-ob-pop motion-reduce:animate-none" aria-hidden="true">
        <circle cx="40" cy="40" r="38" className="fill-brand-100" />
        <path
          d="M24 41.5 L35 52 L57 29"
          pathLength="1"
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="1"
          strokeDashoffset="0"
          className="stroke-brand-600 animate-ob-draw motion-reduce:animate-none"
        />
      </svg>
      <h1 tabIndex={-1} data-step-title className="m-0 mt-8 text-[28px] font-bold tracking-[-0.02em] text-ink-900 outline-none">
        준비가 끝났어요
      </h1>
      <p className="m-0 mt-3 text-[15px] text-ink-500">입력한 조건에 맞춰 홈 화면을 준비하고 있어요.</p>
    </div>
  );
}
