// 이사 조건(온보딩 답변) 읽기·쓰기를 한곳에 모은다.
// OnboardingPage와 ConditionsPage는 localStorage를 직접 만지지 말고 이 모듈만 사용한다.
//
// answers 형식
// {
//   birthDate:      { y: "2001", m: "03", d: "05" }      // 입력한 숫자 문자열 그대로
//   region:         { sido, sigungu }                     // 현재 거주지, 상세 주소 없음
//   targetRegions:  [{ sido, sigungu }]                   // 최대 5개
//   roomTypes:      ["원룸" | "1.5룸" | "투룸"]
//   dealType:       "월세" | "전세" | null
//   depositBudget:  number(만원) | null
//   rentBudget:     number(만원) | null                   // 전세면 항상 null
//   income:         { amount: number(만원), basis: "pre_tax" | "post_tax" | null } | null
//   monthlyExpense: { total: number(만원), detail: { food, transport, telecom, other } | null } | null
//   livesApart:     "yes" | "no" | "unknown" | null
//   homeless:       "yes" | "no" | "unknown" | null
//   workRegion:     { sido, sigungu } | null
//   maxCommute:     number(분) | null
//   weights:        { transport, housingCost, amenities, disaster }   // 각 1~5
//   optionalConsent:   "agreed" | "declined" | null      // 소득·지출 동의 여부
//   optionalConsentAt: ISO 문자열 | null                   // 동의 또는 건너뛴 시각
// }
//
// 규칙(normalizeAnswers에서 항상 적용)
// - 위에 없는 필드는 저장하지 않는다(주민등록번호·상세 주소·전화번호 등이 섞여 들어와도 버려진다).
// - 소득·지출에 동의하지 않았으면 income, monthlyExpense는 null이다.
// - 전세면 rentBudget은 null이다.
// - 항목별 지출을 입력하면 total은 항목 합계로 다시 계산한다.

export const STORAGE_KEYS = {
  draft: "onboardingDraft",
  conditions: "moveConditions",
  done: "onboardingDone",
};

const DRAFT_VERSION = 1;

export const ROOM_TYPES = ["원룸", "1.5룸", "투룸"];
export const DEAL_TYPES = ["월세", "전세"];
export const MAX_TARGET_REGIONS = 5;

export const INCOME_BASIS_LABELS = { pre_tax: "세전", post_tax: "세후" };
export const TERNARY_LABELS = { yes: "예", no: "아니오", unknown: "모름" };
export const EXPENSE_ITEM_LABELS = { food: "식비", transport: "교통비", telecom: "통신비", other: "구독·기타" };
export const WEIGHT_LABELS = { transport: "교통", housingCost: "월 주거비", amenities: "생활시설", disaster: "재난 노출" };
export const CONSENT_LABELS = { agreed: "동의함", declined: "동의하지 않음" };

export const WEIGHT_MIN = 1;
export const WEIGHT_MAX = 5;
const WEIGHT_DEFAULT = 3;

const MAX_AMOUNT = 1_000_000; // 만원 단위 상한(100억)
const MAX_COMMUTE_MINUTES = 240;

// ─── 값 정리 도우미 ─────────────────────────────────────────

const isPlainObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

const toText = (value) => (typeof value === "string" ? value.trim() : "");

const toDigits = (value, maxLength) => String(value ?? "").replace(/\D/g, "").slice(0, maxLength);

/** 숫자 또는 "1,000" 같은 문자열을 0 이상 정수로. 아니면 null. */
const toAmount = (value, max = MAX_AMOUNT) => {
  if (value === null || value === undefined || value === "") return null;
  const number = typeof value === "number" ? value : Number(String(value).replace(/,/g, "").trim());
  if (!Number.isFinite(number) || number < 0) return null;
  return Math.min(Math.round(number), max);
};

const pickKey = (value, labels) => (typeof value === "string" && Object.hasOwn(labels, value) ? value : null);

const normalizeRegion = (value) => {
  // RegionPicker가 쓰던 "서울특별시 마포구" 문자열도 받아준다.
  if (typeof value === "string") {
    const [sido = "", ...rest] = value.trim().split(/\s+/);
    return { sido, sigungu: rest.join(" ") };
  }
  return { sido: toText(value?.sido), sigungu: toText(value?.sigungu) };
};

const normalizeOptionalRegion = (value) => {
  const region = normalizeRegion(value);
  return region.sido ? region : null;
};

export const regionKey = (region) => `${region?.sido ?? ""}|${region?.sigungu ?? ""}`;

export const formatRegion = (region) => [region?.sido, region?.sigungu].filter(Boolean).join(" ");

const normalizeTargetRegions = (value) => {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const regions = [];
  for (const item of value) {
    const region = normalizeOptionalRegion(item);
    if (!region || seen.has(regionKey(region))) continue;
    seen.add(regionKey(region));
    regions.push(region);
    if (regions.length === MAX_TARGET_REGIONS) break;
  }
  return regions;
};

const normalizeRoomTypes = (value) => (Array.isArray(value) ? ROOM_TYPES.filter((type) => value.includes(type)) : []);

const normalizeIncome = (value) => {
  if (!isPlainObject(value)) return null;
  const amount = toAmount(value.amount);
  return amount === null ? null : { amount, basis: pickKey(value.basis, INCOME_BASIS_LABELS) };
};

export const sumExpenseDetail = (detail) =>
  Object.keys(EXPENSE_ITEM_LABELS).reduce((sum, key) => sum + (toAmount(detail?.[key]) ?? 0), 0);

const normalizeMonthlyExpense = (value) => {
  if (!isPlainObject(value)) return null;

  let detail = null;
  if (isPlainObject(value.detail)) {
    const entries = Object.keys(EXPENSE_ITEM_LABELS).map((key) => [key, toAmount(value.detail[key])]);
    if (entries.some(([, amount]) => amount !== null)) detail = Object.fromEntries(entries);
  }

  const total = detail ? sumExpenseDetail(detail) : toAmount(value.total);
  return total === null ? null : { total, detail };
};

const normalizeWeights = (value) =>
  Object.fromEntries(Object.keys(WEIGHT_LABELS).map((key) => {
    const weight = toAmount(value?.[key], WEIGHT_MAX);
    return [key, weight === null || weight < WEIGHT_MIN ? WEIGHT_DEFAULT : weight];
  }));

const normalizeTimestamp = (value) => (typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : null);

// ─── answers ────────────────────────────────────────────────

export const createEmptyAnswers = () => ({
  birthDate: { y: "", m: "", d: "" },
  region: { sido: "", sigungu: "" },
  targetRegions: [],
  roomTypes: [],
  dealType: null,
  depositBudget: null,
  rentBudget: null,
  income: null,
  monthlyExpense: null,
  livesApart: null,
  homeless: null,
  workRegion: null,
  maxCommute: null,
  weights: normalizeWeights(null),
  optionalConsent: null,
  optionalConsentAt: null,
});

/** 어떤 값이 들어와도 위 형식에 맞는 새 객체를 돌려준다. */
export const normalizeAnswers = (value) => {
  const raw = isPlainObject(value) ? value : {};
  const dealType = DEAL_TYPES.includes(raw.dealType) ? raw.dealType : null;
  const optionalConsent = raw.optionalConsent === "agreed" || raw.optionalConsent === "declined" ? raw.optionalConsent : null;
  const consented = optionalConsent === "agreed";

  return {
    birthDate: {
      y: toDigits(raw.birthDate?.y, 4),
      m: toDigits(raw.birthDate?.m, 2),
      d: toDigits(raw.birthDate?.d, 2),
    },
    region: normalizeRegion(raw.region),
    targetRegions: normalizeTargetRegions(raw.targetRegions),
    roomTypes: normalizeRoomTypes(raw.roomTypes),
    dealType,
    depositBudget: toAmount(raw.depositBudget),
    rentBudget: dealType === "전세" ? null : toAmount(raw.rentBudget),
    income: consented ? normalizeIncome(raw.income) : null,
    monthlyExpense: consented ? normalizeMonthlyExpense(raw.monthlyExpense) : null,
    livesApart: pickKey(raw.livesApart, TERNARY_LABELS),
    homeless: pickKey(raw.homeless, TERNARY_LABELS),
    workRegion: normalizeOptionalRegion(raw.workRegion),
    maxCommute: toAmount(raw.maxCommute, MAX_COMMUTE_MINUTES),
    weights: normalizeWeights(raw.weights),
    optionalConsent,
    optionalConsentAt: optionalConsent ? normalizeTimestamp(raw.optionalConsentAt) : null,
  };
};

/** 소득·지출 동의 카드: [동의하고 입력] → true, [건너뛰기] → false. 시각도 함께 기록한다. */
export const setOptionalConsent = (answers, agreed, now = new Date()) => normalizeAnswers({
  ...answers,
  optionalConsent: agreed ? "agreed" : "declined",
  optionalConsentAt: now.toISOString(),
});

/** 설정·이사 조건 페이지에서 동의 철회: 소득·지출 값도 함께 지운다. */
export const withdrawOptionalConsent = (answers, now = new Date()) => setOptionalConsent(answers, false, now);

// ─── localStorage ──────────────────────────────────────────
// 쓰기 함수는 성공 여부(boolean)를 돌려준다. false면 호출한 쪽에서 Toast를 띄운다.

const getStorage = () => {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null; // 사파리 개인 정보 보호 모드 등에서 접근 자체가 막힌 경우
  }
};

const readJson = (key) => {
  try {
    const raw = getStorage()?.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeJson = (key, value) => {
  try {
    const storage = getStorage();
    if (!storage) return false;
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false; // 용량 초과 등
  }
};

const removeKey = (key) => {
  try {
    getStorage()?.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

// 온보딩 임시 저장 ------------------------------------------------

/**
 * 저장된 진행 상황. 없으면 null.
 * stepId는 질문 순서가 바뀌어도 이어갈 수 있도록 인덱스 대신 질문 id를 쓴다.
 * @returns {{ answers: object, stepId: string | null, savedAt: string | null } | null}
 */
export const loadOnboardingDraft = () => {
  const saved = readJson(STORAGE_KEYS.draft);
  if (!isPlainObject(saved)) return null;
  return {
    answers: normalizeAnswers(saved.answers),
    stepId: typeof saved.stepId === "string" ? saved.stepId : null,
    savedAt: normalizeTimestamp(saved.savedAt),
  };
};

export const saveOnboardingDraft = ({ answers, stepId }) => writeJson(STORAGE_KEYS.draft, {
  version: DRAFT_VERSION,
  answers: normalizeAnswers(answers),
  stepId: typeof stepId === "string" ? stepId : null,
  savedAt: new Date().toISOString(),
});

export const clearOnboardingDraft = () => removeKey(STORAGE_KEYS.draft);

// 확정된 이사 조건 -------------------------------------------------

/** 온보딩을 마친 뒤 저장된 이사 조건. 아직 없으면 null. */
export const loadMoveConditions = () => {
  const saved = readJson(STORAGE_KEYS.conditions);
  return isPlainObject(saved) ? normalizeAnswers(saved) : null;
};

export const saveMoveConditions = (answers) => writeJson(STORAGE_KEYS.conditions, normalizeAnswers(answers));

/**
 * ConditionsPage에서 일부 항목만 고칠 때.
 * @returns {{ ok: boolean, answers: object }} ok가 false여도 answers는 화면에 반영할 값이다.
 */
export const updateMoveConditions = (patch) => {
  const answers = normalizeAnswers({ ...(loadMoveConditions() ?? createEmptyAnswers()), ...patch });
  return { ok: writeJson(STORAGE_KEYS.conditions, answers), answers };
};

// 온보딩 완료 여부 --------------------------------------------------

export const isOnboardingDone = () => {
  try {
    return getStorage()?.getItem(STORAGE_KEYS.done) === "true";
  } catch {
    return false;
  }
};

/**
 * [완료하고 시작하기]: 이사 조건 저장 → 완료 표시 → 임시 저장 삭제.
 * 앞의 두 단계 중 하나라도 실패하면 false(임시 저장은 남겨 둬서 다시 시도할 수 있다).
 */
export const completeOnboarding = (answers) => {
  if (!saveMoveConditions(answers)) return false;
  try {
    const storage = getStorage();
    if (!storage) return false;
    storage.setItem(STORAGE_KEYS.done, "true");
  } catch {
    return false;
  }
  clearOnboardingDraft();
  return true;
};

/** @deprecated 기존 OnboardingPage 초안 호환용. OnboardingPage 조립 단계에서 제거한다. */
export const finishOnboarding = completeOnboarding;

/** 개발·테스트용: 온보딩을 처음부터 다시 보게 한다. */
export const resetOnboarding = () => [STORAGE_KEYS.draft, STORAGE_KEYS.conditions, STORAGE_KEYS.done].every(removeKey);
