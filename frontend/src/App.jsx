import React, { useState } from "react";
import Header from "./components/Header";
import QuickMapPanel from "./components/QuickMapPanel";
import { regions } from "./data/housingData";
import AiRecommendationPage from "./pages/AiRecommendationPage";
import AuthPage from "./pages/AuthPage";
import ConditionsPage from "./pages/ConditionsPage";
import CustomerCenterPage from "./pages/CustomerCenterPage";
import DocumentsPage from "./pages/DocumentsPage";
import GuidePage from "./pages/GuidePage";
import LandingPage from "./pages/LandingPage";
import LivingCostPage from "./pages/LivingCostPage";
import MyPage from "./pages/MyPage";
import RecommendationsPage from "./pages/RecommendationsPage";
import RegionDetailPage from "./pages/RegionDetailPage";
import SupportPage from "./pages/SupportPage";

function App() {
  const [step, setStep] = useState("landing");
  const [selectedRegion, setSelectedRegion] = useState(regions[0]);
  const [budget, setBudget] = useState("70");
  const [toast, setToast] = useState("");
  const [isQuickMapOpen, setIsQuickMapOpen] = useState(false);

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  const openRegionDetail = (region) => {
    setSelectedRegion(region);
    setStep("detail");
  };

  const isAuthPage = step === "login" || step === "signup";

  return (
    <div className="housing-app">
      {!isAuthPage && <Header activeStep={step} isMapOpen={isQuickMapOpen} onMapToggle={() => setIsQuickMapOpen((isOpen) => !isOpen)} onNavigate={setStep} onNotify={notify} />}
      {!isAuthPage && isQuickMapOpen && <QuickMapPanel onClose={() => setIsQuickMapOpen(false)} />}
      <main className={step === "landing" ? "container landing-container" : isAuthPage ? "container auth-container" : "container"}>
        {step === "landing" && <LandingPage regions={regions} onStart={() => setStep("home")} onNavigate={setStep} onRegionDetail={openRegionDetail} />}
        {isAuthPage && <AuthPage mode={step} onModeChange={setStep} onComplete={() => setStep("home")} />}
        {step === "home" && <ConditionsPage budget={budget} setBudget={setBudget} onNext={() => setStep("recommend")} onAiRecommend={() => setStep("ai-recommend")} onNotify={notify} />}
        {step === "ai-recommend" && <AiRecommendationPage budget={budget} onBack={() => setStep("home")} />}
        {step === "recommend" && <RecommendationsPage budget={budget} regions={regions} onDetail={openRegionDetail} onBack={() => setStep("home")} onNotify={notify} />}
        {step === "detail" && <RegionDetailPage region={selectedRegion} onBack={() => setStep("home")} onNext={() => setStep("support")} />}
        {step === "support" && <SupportPage onDocuments={() => setStep("documents")} />}
        {step === "documents" && <DocumentsPage onNotify={notify} />}
        {step === "mypage" && <MyPage onNavigate={setStep} onNotify={notify} />}
        {step === "living-cost" && <LivingCostPage onNavigate={setStep} />}
        {step === "guide" && <GuidePage onNavigate={setStep} />}
        {step === "customer-center" && <CustomerCenterPage onNotify={notify} />}
      </main>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default App;
