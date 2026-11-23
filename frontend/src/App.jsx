import React, { useEffect, useState } from "react";
import Header from "./components/Header";
import { properties } from "./data/housingData";
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
import PropertyRecommendationsPage from "./pages/PropertyRecommendationsPage";
import PropertyDetailPage from "./pages/PropertyDetailPage";
import PropertyComparePage from "./pages/PropertyComparePage";
import PropertyMapSearchPage from "./pages/PropertyMapSearchPage";
import SupportPage from "./pages/SupportPage";

const availableSteps = new Set(["landing", "login", "signup", "property-search", "custom-analysis", "property-recommendations", "property-compare", "property-detail", "property-map-search", "support", "documents", "mypage", "living-cost", "guide", "customer-center", "community-qna"]);
const legacyStepMap = {
  home: "property-search",
  "ai-recommend": "custom-analysis",
  recommend: "property-recommendations",
  compare: "property-compare",
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

function App() {
  const [step, setStep] = useState(getStoredStep);
  const [selectedProperty, setSelectedProperty] = useState(getStoredProperty);
  const [comparisonProperties, setComparisonProperties] = useState(properties.slice(0, 2));
  const [budget, setBudget] = useState("70");
  const [recommendationStep, setRecommendationStep] = useState(1);
  const [recommendationResetVersion, setRecommendationResetVersion] = useState(0);
  const [isRecommendationResetOpen, setIsRecommendationResetOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    window.sessionStorage.setItem("housingActiveStep", step);
  }, [step]);

  useEffect(() => {
    window.sessionStorage.setItem("housingSelectedProperty", selectedProperty.id);
  }, [selectedProperty]);

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  const openPropertyDetail = (property) => {
    setSelectedProperty(property);
    setStep("property-detail");
  };

  const openPropertyCompare = (propertyIds) => {
    setComparisonProperties(properties.filter((property) => propertyIds.includes(property.id)));
    setStep("property-compare");
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

  return (
    <div className="housing-app">
      {!isAuthPage && <Header activeStep={step === "community-qna" ? "customer-center" : step === "property-compare" || step === "property-detail" ? "property-recommendations" : step} onNavigate={setStep} onNotify={notify} />}
      <main className={step === "landing" ? "container landing-container" : isAuthPage ? "container auth-container" : "container"}>
        {step === "landing" && <LandingPage properties={properties} onStart={() => setStep("custom-analysis")} onNavigate={setStep} onPropertyDetail={openPropertyDetail} />}
        {isAuthPage && <AuthPage mode={step} onModeChange={setStep} onComplete={() => setStep("property-search")} />}
        {step === "property-search" && <ConditionsPage budget={budget} setBudget={setBudget} currentStep={recommendationStep} onStepChange={setRecommendationStep} resetVersion={recommendationResetVersion} onSaveAndExit={saveRecommendationAndExit} onRequestReset={() => setIsRecommendationResetOpen(true)} onAiRecommend={() => setStep("custom-analysis")} onSupport={() => setStep("support")} onNotify={notify} />}
        {step === "custom-analysis" && <AiRecommendationPage budget={budget} onBack={() => setStep("property-search")} onPropertyRecommendations={() => setStep("property-recommendations")} />}
        {step === "property-recommendations" && <PropertyRecommendationsPage budget={budget} properties={properties} onDetail={openPropertyDetail} onCompare={openPropertyCompare} onBack={() => setStep("property-search")} onNotify={notify} />}
        {step === "property-compare" && <PropertyComparePage properties={comparisonProperties} onBack={() => setStep("property-recommendations")} onDetail={openPropertyDetail} />}
        {step === "property-detail" && <PropertyDetailPage property={selectedProperty} onBack={() => setStep("property-recommendations")} onNext={() => setStep("support")} />}
        {step === "property-map-search" && <PropertyMapSearchPage />}
        {step === "support" &&<SupportPage onDocuments={() => setStep("documents")} />}
        {step === "documents" && <DocumentsPage onNotify={notify} />}
        {step === "mypage" && <MyPage onNavigate={setStep} onNotify={notify} />}
        {step === "living-cost" && <LivingCostPage onNavigate={setStep} />}
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
