import React, { useEffect, useState } from "react";
import Header from "./components/Header";
import QuickMapPanel from "./components/QuickMapPanel";
import { regions } from "./data/housingData";
import AiRecommendationPage from "./pages/AiRecommendationPage";
import AuthPage from "./pages/AuthPage";
import ConditionsPage from "./pages/ConditionsPage";
import CustomerCenterPage from "./pages/CustomerCenterPage";
import DocumentsPage from "./pages/DocumentsPage";
import CommunityQnaPage from "./pages/CommunityQnaPage";
import GuidePage from "./pages/GuidePage";
import LandingPage from "./pages/LandingPage";
import LivingCostPage from "./pages/LivingCostPage";
import MyPage from "./pages/MyPage";
import RecommendationsPage from "./pages/RecommendationsPage";
import RegionDetailPage from "./pages/RegionDetailPage";
import RegionComparePage from "./pages/RegionComparePage";
import SupportPage from "./pages/SupportPage";

const availableSteps = new Set(["landing", "login", "signup", "home", "ai-recommend", "recommend", "compare", "detail", "support", "documents", "mypage", "living-cost", "guide", "customer-center", "community-qna"]);

function getStoredStep() {
  const savedStep = window.sessionStorage.getItem("housingActiveStep");
  return availableSteps.has(savedStep) ? savedStep : "landing";
}

function getStoredRegion() {
  const savedRegionName = window.sessionStorage.getItem("housingSelectedRegion");
  return regions.find((region) => region.name === savedRegionName) ?? regions[0];
}

function App() {
  const [step, setStep] = useState(getStoredStep);
  const [selectedRegion, setSelectedRegion] = useState(getStoredRegion);
  const [comparisonRegions, setComparisonRegions] = useState(regions.slice(0, 2));
  const [budget, setBudget] = useState("70");
  const [recommendationStep, setRecommendationStep] = useState(1);
  const [recommendationResetVersion, setRecommendationResetVersion] = useState(0);
  const [isRecommendationResetOpen, setIsRecommendationResetOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [isQuickMapOpen, setIsQuickMapOpen] = useState(false);

  useEffect(() => {
    window.sessionStorage.setItem("housingActiveStep", step);
  }, [step]);

  useEffect(() => {
    window.sessionStorage.setItem("housingSelectedRegion", selectedRegion.name);
  }, [selectedRegion]);

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  const openRegionDetail = (region) => {
    setSelectedRegion(region);
    setStep("detail");
  };

  const openRegionCompare = (regionNames) => {
    setComparisonRegions(regions.filter((region) => regionNames.includes(region.name)));
    setStep("compare");
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
    notify("지역 추천 조건을 초기화했습니다.");
  };

  const isAuthPage = step === "login" || step === "signup";

  return (
    <div className="housing-app">
      {!isAuthPage && <Header activeStep={step === "community-qna" ? "customer-center" : step === "compare" ? "recommend" : step} isMapOpen={isQuickMapOpen} onMapToggle={() => setIsQuickMapOpen((isOpen) => !isOpen)} onNavigate={setStep} onNotify={notify} />}
      {!isAuthPage && isQuickMapOpen && <QuickMapPanel onClose={() => setIsQuickMapOpen(false)} />}
      <main className={step === "landing" ? "container landing-container" : isAuthPage ? "container auth-container" : "container"}>
        {step === "landing" && <LandingPage regions={regions} onStart={() => setStep("home")} onNavigate={setStep} onRegionDetail={openRegionDetail} />}
        {isAuthPage && <AuthPage mode={step} onModeChange={setStep} onComplete={() => setStep("home")} />}
        {step === "home" && <ConditionsPage budget={budget} setBudget={setBudget} currentStep={recommendationStep} onStepChange={setRecommendationStep} resetVersion={recommendationResetVersion} onSaveAndExit={saveRecommendationAndExit} onRequestReset={() => setIsRecommendationResetOpen(true)} onNext={() => setStep("recommend")} onAiRecommend={() => setStep("ai-recommend")} onNotify={notify} />}
        {step === "ai-recommend" && <AiRecommendationPage budget={budget} onBack={() => setStep("home")} />}
        {step === "recommend" && <RecommendationsPage budget={budget} regions={regions} onDetail={openRegionDetail} onCompare={openRegionCompare} onBack={() => setStep("home")} onNotify={notify} />}
        {step === "compare" && <RegionComparePage regions={comparisonRegions} onBack={() => setStep("recommend")} onDetail={openRegionDetail} />}
        {step === "detail" && <RegionDetailPage region={selectedRegion} onBack={() => setStep("home")} onNext={() => setStep("support")} />}
        {step === "support" && <SupportPage onDocuments={() => setStep("documents")} />}
        {step === "documents" && <DocumentsPage onNotify={notify} />}
        {step === "mypage" && <MyPage onNavigate={setStep} onNotify={notify} />}
        {step === "living-cost" && <LivingCostPage onNavigate={setStep} />}
        {step === "guide" && <GuidePage onNavigate={setStep} />}        {step === "customer-center" && <CustomerCenterPage onNavigate={setStep} onNotify={notify} />}
        {step === "community-qna" && <CommunityQnaPage onNavigate={setStep} onNotify={notify} />}
      </main>
      {toast && <div className="toast">{toast}</div>}
      {isRecommendationResetOpen && (
        <div className="confirmation-backdrop" role="presentation">
          <section className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="reset-dialog-title">
            <p className="confirmation-kicker">지역 추천 초기화</p>
            <h2 id="reset-dialog-title">입력한 조건과 진행 단계가<br />처음으로 돌아갑니다.</h2>
            <p>초기화하면 현재 입력 중인 지역 추천 조건을 다시 설정해야 해요.</p>
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
