// 질문 순서·노출 조건·진행 가능 여부. OnboardingPage와 SummaryStep이 함께 쓴다.
import { validateBirthDate } from "../../utils/ageUtils";
import { isCompleteRegion } from "../../data/regions";

// consent는 질문이 아니라 안내 카드라서 "3 / 11" 개수에 넣지 않는다.
export const STEP_ORDER = [
  "birthDate",
  "region",
  "targetRegions",
  "roomDeal",
  "deposit",
  "rent",
  "consent",
  "income",
  "expense",
  "livesApart",
  "homeless",
  "commute",
  "weights",
];

export const SUMMARY = "summary";

const NOT_COUNTED = new Set(["consent"]);

/** 지금 답변 기준으로 보여줄 화면들 */
export const getVisibleSteps = (answers) => STEP_ORDER.filter((id) => {
  if (id === "rent") return answers.dealType !== "전세";
  if (id === "income" || id === "expense") return answers.optionalConsent !== "declined";
  return true;
});

/** [다음]을 누를 수 있는지. 선택 질문은 [건너뛰기]로 따로 넘어간다. */
export const canProceed = (id, answers) => {
  switch (id) {
    case "birthDate": return validateBirthDate(answers.birthDate).canProceed;
    case "region": return isCompleteRegion(answers.region);
    case "targetRegions": return true;
    case "roomDeal": return answers.roomTypes.length > 0 && Boolean(answers.dealType);
    case "deposit": return answers.depositBudget !== null;
    case "rent": return answers.rentBudget !== null;
    case "consent": return answers.optionalConsent !== null;
    case "income": return answers.income !== null && Boolean(answers.income.basis);
    case "expense": return answers.monthlyExpense !== null;
    case "livesApart": return answers.livesApart !== null;
    case "homeless": return answers.homeless !== null;
    case "commute": return isCompleteRegion(answers.workRegion);
    case "weights": return true;
    default: return false;
  }
};

const REQUIRED = new Set(["birthDate", "region", "roomDeal", "deposit", "rent", "consent", "livesApart", "homeless"]);

export const isRequired = (id) => REQUIRED.has(id);

/** 요약에서 [완료하고 시작하기]를 막는 빈 필수 항목 */
export const getMissingRequired = (answers) =>
  getVisibleSteps(answers).filter((id) => REQUIRED.has(id) && !canProceed(id, answers));

export const getNextStep = (id, answers) => {
  const visible = getVisibleSteps(answers);
  const index = STEP_ORDER.indexOf(id);
  return visible.find((stepId) => STEP_ORDER.indexOf(stepId) > index) ?? SUMMARY;
};

export const getPrevStep = (id, answers) => {
  const visible = getVisibleSteps(answers);
  if (id === SUMMARY) return visible[visible.length - 1];
  const index = STEP_ORDER.indexOf(id);
  return [...visible].reverse().find((stepId) => STEP_ORDER.indexOf(stepId) < index) ?? null;
};

/** 새로고침 후 이어갈 화면. 저장된 화면이 지금은 숨겨졌으면 그 다음 화면으로. */
export const resolveResumeStep = (savedId, answers) => {
  if (savedId === SUMMARY) return SUMMARY;
  if (!STEP_ORDER.includes(savedId)) return STEP_ORDER[0];
  if (getVisibleSteps(answers).includes(savedId)) return savedId;
  return getNextStep(savedId, answers);
};

/** 상단 "3 / 11"과 진행 바 */
export const getProgress = (id, answers) => {
  const questions = getVisibleSteps(answers).filter((stepId) => !NOT_COUNTED.has(stepId));
  const total = questions.length;
  if (id === SUMMARY) return { count: null, ratio: 1 };
  const index = STEP_ORDER.indexOf(id);
  const done = questions.filter((stepId) => STEP_ORDER.indexOf(stepId) < index).length;
  // 안내 카드는 직전 질문 번호를 그대로 보여준다
  const current = NOT_COUNTED.has(id) ? Math.max(done, 1) : done + 1;
  return { count: { current, total }, ratio: done / total };
};
