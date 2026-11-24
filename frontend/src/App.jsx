import React, { useEffect, useRef, useState } from "react";
import Header from "./components/Header";
import { properties } from "./data/housingData";
import AiRecommendationPage from "./pages/AiRecommendationPage";
import AuthPage from "./pages/AuthPage";
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
import { hydrateMoveConditions, markOnboardingDone } from "./utils/conditionsStore";
import { clearUserLocalData } from "./utils/userLocalData";
import { getCurrentUser, logoutAccount } from "./utils/authStore";
import { hydrateRecentRegionState } from "./utils/recentRegionsStore";
import { loadUserState, saveUserState } from "./utils/userStateSync";

const availableSteps = new Set(["landing", "login", "signup", "onboarding", "conditions-edit", "custom-analysis", "property-recommendations", "property-compare", "property-detail", "property-map-search", "support", "documents", "contracts", "mypage", "notifications", "guide", "customer-center", "community-qna", "moving-journey", "journey-analysis", "journey-support", "journey-documents"]);
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
  home: "property-map-search",
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
    journeyView: -1,
  };
}

function App() {
  const [navigation, setNavigation] = useState(createInitialNavigation);
  const navigationRef = useRef(navigation);
  const { step, journeyView, maruFlow, demoMode } = navigation;
  const selectedProperty = properties.find(property => property.id === navigation.propertyId) ?? properties[0];
  const [journeyPlan, setJourneyPlan] = useState(getStoredJourney);
  const [isJourneyStateHydrated, setIsJourneyStateHydrated] = useState(false);
  const [demoPlan, setDemoPlan] = useState(getStoredDemoPlan);
  const [authUser, setAuthUser] = useState(getCurrentUser);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (authUser) {
      hydrateRecentRegionState();
      hydrateMoveConditions();
      loadUserState("journey")
        .then((value) => {
          if (value?.regions && value?.dates) setJourneyPlan((current) => ({ ...current, ...value }));
        })
        .catch(() => undefined)
        .finally(() => setIsJourneyStateHydrated(true));
    } else {
      setIsJourneyStateHydrated(false);
    }
  }, [authUser]);

  useEffect(() => {
    const expireSession = () => {
      setAuthUser(null);
      setToast("로그인이 만료되었습니다. 다시 로그인해 주세요.");
      window.setTimeout(() => setToast(""), 2400);
    };
    window.addEventListener("housing:session-expired", expireSession);
    return () => window.removeEventListener("housing:session-expired", expireSession);
  }, []);

  useEffect(() => {
    window.history.replaceState({ ...window.history.state, [navigationKey]: navigationRef.current }, "");
    const restoreEntry = event => {
      const entry = getNavigationEntry(event.state);
      if (!entry) return;
      navigationRef.current = entry;
      setNavigation(entry);
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
      if (authUser && isJourneyStateHydrated) saveUserState("journey", journeyPlan).catch(() => undefined);
    } catch {
      // The current plan remains available in memory when browser storage is unavailable.
    }
  }, [authUser, isJourneyStateHydrated, journeyPlan]);

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

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  const openPropertyDetail = (property) => {
    navigate("property-detail", { propertyId: property.id, section: null });
  };

  const openRegionComparison = (regions) => {
    navigate("property-map-search", { mapCompareRegions: regions });
  };

  const openRegionSearch = (region) => {
    navigate("property-map-search", { mapSearchRegion: region, mapCompareRegions: [] });
  };

  // 브라우저 캐시는 이전 사용자 것일 수 있으니 비우고, 기본정보 입력 여부는 서버에 저장된 이사 조건으로 판단합니다.
  const resetUserCache = () => {
    clearUserLocalData();
    setIsJourneyStateHydrated(false);
    setJourneyPlan(getStoredJourney());
  };

  const completeAuth = async (user, isNewAccount = false) => {
    resetUserCache();
    setAuthUser(user);
    window.sessionStorage.setItem("housingUserProfile", JSON.stringify({ name: user.nickname, email: user.email, income: "" }));
    const hasConditions = !isNewAccount && await hydrateMoveConditions();
    if (hasConditions) markOnboardingDone();
    navigate(hasConditions ? "landing" : "onboarding", {}, true);
  };

  const logout = () => {
    logoutAccount();
    resetUserCache();
    setAuthUser(null);
    notify("로그아웃했습니다.");
    navigate("landing", {}, true);
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
      {!isStandalonePage && <Header activeStep={headerStep} onOpenJourney={() => openJourney()} onNavigate={setStep} onNotify={notify} user={authUser} onLogout={logout} />}
      <main className={step === "landing" ? "container landing-container" : isOnboardingLayout ? "onboarding-container" : isStandalonePage ? "auth-container" : step === "moving-journey" ? "journey-container" : "container"}>
        {step === "landing" && (
          <LandingPage properties={properties} onStartJourney={() => openJourney()}
            onStartAnalysis={startJourneyAnalysis} onNavigate={setStep} onPropertyDetail={openPropertyDetail} onOpenRegionSearch={openRegionSearch} />
        )}
        {isAuthPage && <AuthPage mode={step} onModeChange={setStep} onComplete={completeAuth} />}
        {step === "onboarding" && <OnboardingPage onComplete={() => navigate("landing", {}, true)} onNotify={notify} />}
        {step === "conditions-edit" && <OnboardingPage editStep={navigation.editStep} onExit={() => goBack(() => navigate("mypage", { section: "conditions" }, true))} onNotify={notify} />}
        {step === "custom-analysis" && <AiRecommendationPage
          flow={maruFlow} onFlowChange={updateMaru} onBack={() => goBack(() => setStep("property-map-search"))}
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
        {["property-map-search", "property-recommendations", "property-compare"].includes(step) && <PropertyMapSearchPage initialSearchRegion={navigation.mapSearchRegion ?? ""} initialCompareRegions={navigation.mapCompareRegions ?? []} />}
        {step === "property-detail" && <PropertyDetailPage property={selectedProperty} activeCategoryId={navigation.section ?? "overview"} onCategoryChange={section => navigate(step, { section })} onBack={() => goBack(() => setStep("property-map-search"))} onNext={() => setStep("support")} />}
        {step === "support" && <SupportPage onDocuments={() => setStep("documents")} />}
        {step === "documents" && <DocumentsPage onNotify={notify} onContracts={() => setStep("contracts")} />}
        {step === "contracts" && <ContractsPage onNavigate={setStep} />}
        {step === "notifications" && <NotificationsPage />}
        {step === "mypage" && <MyPage active={navigation.section ?? "dashboard"} onSectionChange={section => navigate(step, { section })} onNavigate={setStep} onCompareRegions={openRegionComparison} onOpenRegionSearch={openRegionSearch} onEditCondition={stepId => navigate("conditions-edit", { editStep: stepId })} onNotify={notify} authUser={authUser} />}
        {step === "guide" && <GuidePage onNavigate={setStep} />}
        {step === "customer-center" && <CustomerCenterPage onNavigate={setStep} onNotify={notify} />}
        {step === "community-qna" && <CommunityQnaPage onNavigate={setStep} onNotify={notify} />}
      </main>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default App;
