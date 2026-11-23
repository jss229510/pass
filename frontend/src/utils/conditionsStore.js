export const ONBOARDING_DRAFT_KEY = "onboardingDraft";
export const MOVE_CONDITIONS_KEY = "moveConditions";
export const ONBOARDING_DONE_KEY = "onboardingDone";

export const createEmptyAnswers = () => ({
  birthDate: { y: "", m: "", d: "" },
  region: { sido: "", sigungu: "" },
  targetRegions: [],
  roomTypes: [],
  dealType: "",
  depositBudget: "",
  rentBudget: "",
  income: null,
  monthlyExpense: null,
  livesApart: null,
  homeless: null,
  workRegion: null,
  maxCommute: null,
  weights: { transport: 3, housingCost: 3, livingFacilities: 3, disasterExposure: 3 },
  optionalConsentAt: null,
});

const getStorage = () => (typeof window === "undefined" ? null : window.localStorage);

const normalizeAnswers = (value) => {
  const defaults = createEmptyAnswers();
  if (!value || typeof value !== "object") return defaults;

  return {
    ...defaults,
    ...value,
    birthDate: { ...defaults.birthDate, ...value.birthDate },
    region: { ...defaults.region, ...value.region },
    targetRegions: Array.isArray(value.targetRegions) ? value.targetRegions : [],
    roomTypes: Array.isArray(value.roomTypes) ? value.roomTypes : [],
    weights: { ...defaults.weights, ...value.weights },
  };
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
    return false;
  }
};

export const loadOnboardingDraft = () => {
  const saved = readJson(ONBOARDING_DRAFT_KEY);
  return {
    answers: normalizeAnswers(saved?.answers),
    currentStep: Number.isInteger(saved?.currentStep) && saved.currentStep >= 0 ? saved.currentStep : 0,
  };
};

export const saveOnboardingDraft = ({ answers, currentStep }) => writeJson(ONBOARDING_DRAFT_KEY, {
  answers: normalizeAnswers(answers),
  currentStep,
  savedAt: new Date().toISOString(),
});

export const loadMoveConditions = () => normalizeAnswers(readJson(MOVE_CONDITIONS_KEY));

export const saveMoveConditions = (answers) => writeJson(MOVE_CONDITIONS_KEY, normalizeAnswers(answers));

export const isOnboardingDone = () => getStorage()?.getItem(ONBOARDING_DONE_KEY) === "true";

export const finishOnboarding = (answers) => {
  const savedConditions = saveMoveConditions(answers);
  if (!savedConditions) return false;

  try {
    const storage = getStorage();
    if (!storage) return false;
    storage.setItem(ONBOARDING_DONE_KEY, "true");
    storage.removeItem(ONBOARDING_DRAFT_KEY);
    return true;
  } catch {
    return false;
  }
};
