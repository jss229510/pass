import React, { useEffect, useRef, useState } from "react";
import Header from "./components/Header";
import { properties } from "./data/housingData";
import AiRecommendationPage from "./pages/AiRecommendationPage";
import AuthPage from "./pages/AuthPage";
import ConditionsPage, { loadDraft } from "./pages/ConditionsPage";
import CustomerCenterPage from "./pages/CustomerCenterPage";
import DocumentsPage from "./pages/DocumentsPage";
import CommunityQnaPage from "./pages/CommunityQnaPage";
import ContractsPage from "./pages/ContractsPage";
import GuidePage from "./pages/GuidePage";
import LandingPage from "./pages/LandingPage";
import MyPage from "./pages/MyPage";
import NotificationsPage from "./pages/NotificationsPage";
import MovingJourneyPage from "./pages/MovingJourneyPage";
import { createDemoPlan, demoScenario } from "./pages/MovingJourneyDemo";
import PropertyDetailPage from "./pages/PropertyDetailPage";
import PropertyMapSearchPage from "./pages/PropertyMapSearchPage";
import SupportPage from "./pages/SupportPage";
import OnboardingPage from "./pages/OnboardingPage";
import { isOnboardingDone, loadMoveConditions } from "./utils/conditionsStore";

const availableSteps = new Set(["landing", "login", "signup", "onboarding", "conditions-edit", "property-search", "custom-analysis", "property-recommendations", "property-compare", "property-detail", "property-map-search", "support", "documents", "contracts", "mypage", "notifications", "guide", "customer-center", "community-qna", "moving-journey", "journey-analysis", "journey-support", "journey-documents"]);
const journeyStorageKey = "passMovingJourney";
const demoStorageKey = "passMovingJourneyBusanDemo";

function getStoredDemoPlan() {
  try {
    return JSON.parse(window.sessionStorage.getItem(demoStorageKey)) ?? createDemoPlan();
  } catch {
    return createDemoPlan();
  }
}
const journeySteps = new Set(["moving-journey", "journey-analysis", "journey-support", "journey-documents"]);

function getStoredJourney() {
  const empty = { area: null, regions: {}, dates: {} };
  try {
    const saved = JSON.parse(window.localStorage.getItem(journeyStorageKey));
    return saved?.regions && saved?.dates ? { ...empty, ...saved } : empty;
  } catch {
    return empty;
  }
}

const legacyStepMap = {
  home: "property-search",
  "ai-recommend": "custom-analysis",
  recommend: "property-map-search",
  compare: "property-map-search",
  detail: "property-detail",
};

function getStoredStep() {
  const savedStep = window.sessionStorage.getItem("housingActiveStep");
  const migratedStep = legacyStepMap[savedStep] ?? savedStep;
  return availableSteps.has(migratedStep) ? migratedStep : "landing";
}

function getStoredProperty() {
  const savedPropertyId = window.sessionStorage.getItem("housingSelectedProperty");
  return properties.find((property) => property.id === savedPropertyId) ?? properties[0];
}

const navigationKey = "passNavigation";

function getNavigationEntry(state) {
  const entry = state?.[navigationKey];
  return entry && availableSteps.has(entry.step) ? entry : null;
}

function createInitialNavigation() {
  return getNavigationEntry(window.history.state) ?? {
    step: getStoredStep(),
    depth: 0,
    propertyId: getStoredProperty().id,
    recommendationStep: 1,
    journeyView: -1,
  };
}

function App() {
  const [navigation, setNavigation] = useState(createInitialNavigation);
  const navigationRef = useRef(navigation);
  const { step, recommendationStep, journeyView, maruFlow, demoMode } = navigation;
  const selectedProperty = properties.find(property => property.id === navigation.propertyId) ?? properties[0];
  const [journeyPlan, setJourneyPlan] = useState(getStoredJourney);
  const [demoPlan, setDemoPlan] = useState(getStoredDemoPlan);
  const [budget, setBudget] = useState("70");
  const [recommendationDraft, setRecommendationDraft] = useState(loadDraft);
  const [recommendationResetVersion, setRecommendationResetVersion] = useState(0);
  const [isRecommendationResetOpen, setIsRecommendationResetOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    window.history.replaceState({ ...window.history.state, [navigationKey]: navigationRef.current }, "");
    const restoreEntry = event => {
      const entry = getNavigationEntry(event.state);
      if (!entry) return;
      navigationRef.current = entry;
      setNavigation(entry);
      setIsRecommendationResetOpen(false);
    };
    window.addEventListener("popstate", restoreEntry);
    return () => window.removeEventListener("popstate", restoreEntry);
  }, []);

  function navigate(nextStep, changes = {}, replace = false) {
    const current = navigationRef.current;
    const next = {
      ...current,
      ...(nextStep !== current.step && { maruFlow: null, section: null, demoMode: false }),
      ...changes,
      step: nextStep,
    };
    if (Object.keys(next).every(key => Object.is(next[key], current[key]))) return;
    if (!replace) next.depth += 1;
    const state = { ...window.history.state, [navigationKey]: next };
    if (replace) window.history.replaceState(state, "");
    else window.history.pushState(state, "");
    navigationRef.current = next;
    setNavigation(next);
  }

  function setStep(nextStep) {
    navigate(nextStep);
  }

  function goBack(fallback) {
    if (navigationRef.current.depth > 0) window.history.back();
    else fallback();
  }

  function setRecommendationStep(value) {
    navigate("property-search", { recommendationStep: value });
  }

  function updateMaru(values, replace) {
    const current = navigationRef.current;
    navigate(current.step, { maruFlow: { ...current.maruFlow, ...values } }, replace);
  }


  useEffect(() => {
    window.sessionStorage.setItem("housingActiveStep", step);
  }, [step]);

  useEffect(() => {
    window.sessionStorage.setItem("housingSelectedProperty", selectedProperty.id);
  }, [selectedProperty]);

  useEffect(() => {
    try {
      window.localStorage.setItem(journeyStorageKey, JSON.stringify(journeyPlan));
    } catch {
      // The current plan remains available in memory when browser storage is unavailable.
    }
  }, [journeyPlan]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(demoStorageKey, JSON.stringify(demoPlan));
    } catch {
      // Keep the demo available in memory if browser storage is unavailable.
    }
  }, [demoPlan]);

  const openJourney = (view = -1) => {
    navigate("moving-journey", { journeyView: view, demoMode: view !== -1 && Boolean(navigationRef.current.demoMode) });
    window.scrollTo(0, 0);
  };

  const openDemo = () => {
    setDemoPlan(createDemoPlan());
    navigate("journey-analysis", { demoMode: true, maruFlow: null });
    window.scrollTo(0, 0);
  };

  const startJourneyAnalysis = (useDemo = false) => {
    navigate("journey-analysis", { demoMode: useDemo === true });
    window.scrollTo(0, 0);
  };

  const saveJourneyArea = (area) => {
    if (navigationRef.current.demoMode) {
      if (area.city !== demoScenario.city || area.name !== demoScenario.neighborhood) return;
      setDemoPlan(plan => ({ ...plan, area }));
    } else {
      setJourneyPlan(plan => ({ ...plan, area }));
    }
    openJourney(2);
  };

  // 이사 조건(온보딩·마이페이지)이 저장된 뒤 매물 추천 화면이 쓰는 상태를 다시 읽는다
  const syncRecommendationFromConditions = () => {
    setRecommendationDraft(loadDraft());
    const conditions = loadMoveConditions();
    if (conditions?.rentBudget !== null && conditions?.rentBudget !== undefined) setBudget(String(conditions.rentBudget));
  };

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  const openPropertyDetail = (property) => {
    navigate("property-detail", { propertyId: property.id, section: null });
  };

  const saveRecommendationAndExit = () => {
    setStep("landing");
    notify(`${recommendationStep}단계 진행 내용을 저장했습니다.`);
  };

  const resetRecommendation = () => {
    setRecommendationStep(1);
    setBudget("70");
    setRecommendationResetVersion((version) => version + 1);
    setIsRecommendationResetOpen(false);
    notify("매물 추천 조건을 초기화했습니다.");
  };

  const isAuthPage = step === "login" || step === "signup";
  const isOnboardingLayout = step === "onboarding" || step === "conditions-edit";
  const isStandalonePage = isAuthPage || isOnboardingLayout;
  const headerStep = journeySteps.has(step) ? "moving-journey"
    : step === "community-qna" ? "customer-center"
    : ["property-compare", "property-detail", "property-recommendations"].includes(step) ? "property-map-search"
    : step;

  return (
    <div className="housing-app">
      {!isStandalonePage && <Header activeStep={headerStep} onOpenJourney={() => openJourney()} onNavigate={setStep} onNotify={notify} />}
      <main className={step === "landing" ? "container landing-container" : isOnboardingLayout ? "onboarding-container" : isStandalonePage ? "auth-container" : step === "moving-journey" ? "journey-container" : "container"}>
        {step === "landing" && (
          <LandingPage properties={properties} onStartJourney={() => openJourney()}
            onStartAnalysis={startJourneyAnalysis} onNavigate={setStep} onPropertyDetail={openPropertyDetail} />
        )}
        {isAuthPage && <AuthPage mode={step} onModeChange={setStep} onComplete={() => setStep(isOnboardingDone() ? "landing" : "onboarding")} />}
        {step === "onboarding" && <OnboardingPage onComplete={() => { syncRecommendationFromConditions(); navigate("landing", {}, true); }} onNotify={notify} />}
        {step === "conditions-edit" && <OnboardingPage editStep={navigation.editStep} onExit={saved => { if (saved) syncRecommendationFromConditions(); goBack(() => navigate("mypage", { section: "conditions" }, true)); }} onNotify={notify} />}
        {step === "property-search" && <ConditionsPage draft={recommendationDraft} setDraft={setRecommendationDraft} budget={budget} setBudget={setBudget} currentStep={recommendationStep} onStepChange={setRecommendationStep} resetVersion={recommendationResetVersion} onSaveAndExit={saveRecommendationAndExit} onRequestReset={() => setIsRecommendationResetOpen(true)} onAiRecommend={() => setStep("custom-analysis")} onSupport={() => setStep("support")} onNotify={notify} />}
        {step === "custom-analysis" && <AiRecommendationPage
          flow={maruFlow} onFlowChange={updateMaru} onBack={() => goBack(() => setStep("property-search"))}
        />}
        {step === "moving-journey" && (
          <MovingJourneyPage
            view={journeyView}
            onViewChange={openJourney}
            onBack={() => goBack(() => openJourney(journeyView - 1))}
            demo={Boolean(demoMode)}
            onOpenDemo={openDemo}
            onExitDemo={() => openJourney(-1)}
            plan={demoMode ? demoPlan : journeyPlan}
            onUpdate={demoMode ? setDemoPlan : setJourneyPlan}
            onMaru={() => startJourneyAnalysis(Boolean(demoMode))}
            onSupport={() => setStep("journey-support")}
            onDocuments={() => setStep("journey-documents")}
          />
        )}
        {step === "journey-analysis" && (
          <AiRecommendationPage
            flow={maruFlow} onFlowChange={updateMaru}
            onBack={demoMode ? () => openJourney(-1) : () => openJourney(1)}
            demoScenario={demoMode ? demoScenario : undefined}
            onSaveNeighborhood={saveJourneyArea} startInConversation
          />
        )}
        {step === "journey-support" && (
          <>
            <button className="back" type="button" onClick={() => openJourney(0)}>이사 여정 대시보드</button>
            <SupportPage onDocuments={() => setStep("journey-documents")} />
          </>
        )}
        {step === "journey-documents" && (
          <>
            <button className="back" type="button" onClick={() => openJourney(3)}>이사 여정 계약·보증 확인</button>
            <DocumentsPage onNotify={notify} onContracts={() => setStep("contracts")} />
          </>
        )}
        {["property-map-search", "property-recommendations", "property-compare"].includes(step) && <PropertyMapSearchPage />}
        {step === "property-detail" && <PropertyDetailPage property={selectedProperty} activeCategoryId={navigation.section ?? "overview"} onCategoryChange={section => navigate(step, { section })} onBack={() => goBack(() => setStep("property-map-search"))} onNext={() => setStep("support")} />}
        {step === "support" && <SupportPage onDocuments={() => setStep("documents")} />}
        {step === "documents" && <DocumentsPage onNotify={notify} onContracts={() => setStep("contracts")} />}
        {step === "contracts" && <ContractsPage onNavigate={setStep} />}
        {step === "notifications" && <NotificationsPage />}
        {step === "mypage" && <MyPage active={navigation.section ?? "dashboard"} onSectionChange={section => navigate(step, { section })} onNavigate={setStep} onEditCondition={stepId => navigate("conditions-edit", { editStep: stepId })} onNotify={notify} />}
        {step === "guide" && <GuidePage onNavigate={setStep} />}
        {step === "customer-center" && <CustomerCenterPage onNavigate={setStep} onNotify={notify} />}
        {step === "community-qna" && <CommunityQnaPage onNavigate={setStep} onNotify={notify} />}
      </main>
      {toast && <div className="toast">{toast}</div>}
      {isRecommendationResetOpen && (
        <div className="confirmation-backdrop" role="presentation">
          <section className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="reset-dialog-title">
            <p className="confirmation-kicker">매물 추천 초기화</p>
            <h2 id="reset-dialog-title">입력한 조건과 진행 단계가<br />처음으로 돌아갑니다.</h2>
            <p>초기화하면 현재 입력 중인 매물 추천 조건을 다시 설정해야 해요.</p>
            <div className="confirmation-actions">
              <button type="button" onClick={() => setIsRecommendationResetOpen(false)}>계속 진행하기</button>
              <button className="danger" type="button" onClick={resetRecommendation}>초기화하기</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
