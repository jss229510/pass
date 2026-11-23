import React, { useCallback, useEffect, useRef, useState } from "react";
import OnboardingShell, { prefersReducedMotion } from "../features/onboarding/OnboardingShell";
import BirthDateStep from "../features/onboarding/BirthDateStep";
import RegionStep from "../features/onboarding/RegionStep";
import TargetRegionsStep from "../features/onboarding/TargetRegionsStep";
import RoomDealStep from "../features/onboarding/RoomDealStep";
import BudgetStep from "../features/onboarding/BudgetStep";
import ConsentStep from "../features/onboarding/ConsentStep";
import IncomeStep from "../features/onboarding/IncomeStep";
import ExpenseStep from "../features/onboarding/ExpenseStep";
import ChoiceCardStep from "../features/onboarding/ChoiceCardStep";
import CommuteStep from "../features/onboarding/CommuteStep";
import WeightsStep from "../features/onboarding/WeightsStep";
import SummaryStep from "../features/onboarding/SummaryStep";
import DoneStep from "../features/onboarding/DoneStep";
import {
  STEP_ORDER, SUMMARY, canProceed, getMissingRequired, getNextStep, getPrevStep, getProgress, resolveResumeStep,
} from "../features/onboarding/steps";
import {
  completeOnboarding, createEmptyAnswers, isOnboardingDone, loadMoveConditions, loadOnboardingDraft, normalizeAnswers, saveMoveConditions,
  saveOnboardingDraft, setOptionalConsent,
} from "../utils/conditionsStore";

const DONE = "done";
// 나가는 애니메이션(250ms) 동안만 이동을 막는다. 새 질문이 보인 뒤의 클릭은 막지 않는다.
// 카드 자동 넘김(300ms)과 Enter가 겹쳐도, 타이머가 교체 전에 울리면 이 잠금에 걸리고
// 교체 후라면 카드가 언마운트되며 타이머가 취소돼 두 칸 넘어가지 않는다.
const TRANSITION_LOCK_MS = 250;

const loadInitialState = (editStep) => {
  if (editStep) {
    // 마이페이지에서 수정: 저장된 이사 조건의 해당 질문부터
    const answers = loadMoveConditions();
    const valid = answers && STEP_ORDER.includes(editStep);
    return { answers: answers ?? createEmptyAnswers(), stepId: valid ? editStep : null };
  }
  const draft = loadOnboardingDraft();
  const answers = draft?.answers ?? createEmptyAnswers();
  return { answers, stepId: resolveResumeStep(draft?.stepId ?? null, answers) };
};

/**
 * 로그인 직후 한 번 보여주는 기본 정보 입력.
 * App.jsx가 화면 이름(step)으로 화면을 바꾸므로 완료 후 메인 홈(landing)으로 가는 이동은 onComplete() 호출이다.
 *
 * editStep을 주면 "수정 모드": 마이페이지 "내 이사 조건"에서 질문 하나(와 그에 딸린 질문)만 고친다.
 * [다음]을 끝까지 누르면 moveConditions에 저장하고 onExit(true), [취소]면 저장하지 않고 onExit(false).
 */
export default function OnboardingPage({ onComplete, onNotify, editStep, onExit }) {
  const isEditMode = Boolean(editStep);
  const [alreadyDone] = useState(() => !isEditMode && isOnboardingDone());
  const [initial] = useState(() => loadInitialState(editStep));
  const [answers, setAnswers] = useState(initial.answers);
  const [stepId, setStepId] = useState(initial.stepId);
  const [direction, setDirection] = useState("forward");
  const [editing, setEditing] = useState(isEditMode); // 요약 또는 마이페이지에서 [수정]으로 들어왔는지
  const [completing, setCompleting] = useState(false);
  const [finished, setFinished] = useState(false);

  const answersRef = useRef(answers);
  const stepRef = useRef(stepId);
  const lockUntilRef = useRef(0);
  const saveFailedRef = useRef(false);
  // App이 매 렌더 새 함수를 넘겨도 effect가 다시 돌지 않게 ref로 받는다
  const onCompleteRef = useRef(onComplete);
  const onNotifyRef = useRef(onNotify);
  const onExitRef = useRef(onExit);
  onCompleteRef.current = onComplete;
  onNotifyRef.current = onNotify;
  onExitRef.current = onExit;

  // 수정 모드인데 고칠 질문이나 저장된 조건이 없으면 바로 돌아간다
  useEffect(() => {
    if (isEditMode && initial.stepId === null) onExitRef.current?.(false);
  }, [isEditMode, initial.stepId]);

  // 이미 끝낸 사용자는 바로 메인 홈으로
  useEffect(() => {
    if (alreadyDone) onCompleteRef.current?.();
  }, [alreadyDone]);

  // 답변·현재 화면이 바뀔 때마다 임시 저장. 실패하면 한 번만 알린다.
  useEffect(() => {
    if (alreadyDone || finished || isEditMode) return;
    const ok = saveOnboardingDraft({ answers, stepId });
    if (!ok && !saveFailedRef.current) onNotifyRef.current?.("입력한 내용을 이 기기에 저장하지 못했어요. 새로고침하면 사라질 수 있어요.");
    saveFailedRef.current = !ok;
  }, [answers, stepId, alreadyDone, finished, isEditMode]);

  const update = useCallback((patch) => {
    const next = normalizeAnswers({ ...answersRef.current, ...patch });
    answersRef.current = next;
    setAnswers(next);
  }, []);

  const goTo = useCallback((nextId, nextDirection) => {
    if (!nextId) return;
    const now = Date.now();
    if (now < lockUntilRef.current) return; // 전환 중 연타 방지
    if (isEditMode && nextId === SUMMARY) {
      // 수정 모드에는 요약이 없다: 앞으로 가면 저장, 뒤로 가면 취소
      if (nextDirection === "back") {
        onExitRef.current?.(false);
      } else if (saveMoveConditions(answersRef.current)) {
        onNotifyRef.current?.("이사 조건을 저장했어요.");
        onExitRef.current?.(true);
      } else {
        onNotifyRef.current?.("저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
      }
      return;
    }
    lockUntilRef.current = prefersReducedMotion() ? 0 : now + TRANSITION_LOCK_MS;
    if (nextId === SUMMARY) setEditing(false);
    stepRef.current = nextId;
    setDirection(nextDirection);
    setStepId(nextId);
  }, [isEditMode]);

  // 요약에서 수정 중일 때 [다음]의 목적지
  const getEditNext = (current, latest) => {
    if (current === "consent" && latest.optionalConsent === "agreed") return "income";
    if (current === "income") return "expense";
    // 거래 유형을 월세로 바꾼 경우처럼 비어 있는 필수 질문이 생겼으면 거기로(바로 다음 질문이 아니어도)
    return getMissingRequired(latest)[0] ?? SUMMARY;
  };

  const goNext = useCallback(({ force = false } = {}) => {
    const latest = answersRef.current;
    const current = stepRef.current;
    if (!force && !canProceed(current, latest)) return;
    goTo(editing ? getEditNext(current, latest) : getNextStep(current, latest), "forward");
  }, [editing, goTo]);

  const goPrev = useCallback(() => {
    if (editing) {
      goTo(SUMMARY, "back");
      return;
    }
    goTo(getPrevStep(stepRef.current, answersRef.current), "back");
  }, [editing, goTo]);

  const skip = useCallback((patch) => {
    update(patch);
    goNext({ force: true });
  }, [update, goNext]);

  const decideConsent = (agreed) => {
    update(setOptionalConsent(answersRef.current, agreed));
    goNext({ force: true });
  };

  const editFromSummary = (id) => {
    setEditing(true);
    goTo(id, "back");
  };

  const complete = () => {
    if (completing || getMissingRequired(answersRef.current).length > 0) return;
    setCompleting(true);
    if (!completeOnboarding(answersRef.current)) {
      setCompleting(false);
      onNotifyRef.current?.("저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
      return;
    }
    lockUntilRef.current = 0;
    setDirection("forward");
    setFinished(true);
  };

  if (alreadyDone || stepId === null) return null;

  const isFirst = getPrevStep(stepId, answers) === null;
  const common = {
    answers,
    update,
    onNext: () => goNext(),
    onPrev: isFirst && !editing ? undefined : goPrev,
    prevLabel: isEditMode ? "취소" : editing ? "요약으로" : "이전",
    canNext: canProceed(stepId, answers),
    onSkip: skip,
  };

  let screen;
  switch (stepId) {
    case "birthDate": screen = <BirthDateStep {...common} />; break;
    case "region": screen = <RegionStep {...common} />; break;
    case "targetRegions": screen = <TargetRegionsStep {...common} />; break;
    case "roomDeal": screen = <RoomDealStep {...common} />; break;
    case "deposit": screen = <BudgetStep {...common} kind="deposit" />; break;
    case "rent": screen = <BudgetStep {...common} kind="rent" />; break;
    case "consent": screen = <ConsentStep {...common} onAgree={() => decideConsent(true)} onDecline={() => decideConsent(false)} />; break;
    case "income": screen = <IncomeStep {...common} />; break;
    case "expense": screen = <ExpenseStep {...common} />; break;
    case "livesApart": screen = <ChoiceCardStep {...common} field="livesApart" />; break;
    case "homeless": screen = <ChoiceCardStep {...common} field="homeless" />; break;
    case "commute": screen = <CommuteStep {...common} />; break;
    case "weights": screen = <WeightsStep {...common} />; break;
    default:
      screen = (
        <SummaryStep
          answers={answers}
          onEdit={editFromSummary}
          onPrev={goPrev}
          onComplete={complete}
          completing={completing}
        />
      );
  }

  if (finished) screen = <DoneStep onFinish={() => onCompleteRef.current?.()} />;

  const progress = finished || isEditMode ? { count: null, ratio: 1 } : getProgress(stepId, answers);
  const screenKey = finished ? DONE : stepId;
  const isSummary = stepId === SUMMARY && !finished;

  return (
    <OnboardingShell
      stepKey={screenKey}
      direction={direction}
      count={progress.count}
      headerLabel={isEditMode ? "이사 조건 수정" : null}
      progress={progress.ratio}
      canNext={finished ? false : isSummary ? getMissingRequired(answers).length === 0 : canProceed(stepId, answers)}
      onNext={isSummary ? complete : () => goNext()}
      onPrev={finished ? undefined : goPrev}
    >
      {screen}
    </OnboardingShell>
  );
}
