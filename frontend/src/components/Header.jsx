import React from "react";
import { FaMapMarkedAlt } from "react-icons/fa";

function Header({ activeStep, isMapOpen, onMapToggle, onNavigate, onNotify }) {
  const menuItems = [
    ["지역 추천", "home"],
    ["지역 비교", "recommend"],
    ["주거지원 정책", "support"],
    ["생활비 분석", "living-cost"],
    ["서류 검토", "documents"],
    ["AI 추천", "ai-recommend"],
    ["이용 가이드", "guide"],
    ["고객센터", "customer-center"],
  ];

  const moveTo = (label, step) => {
    if (step) {
      onNavigate(step);
      return;
    }
    onNotify(`${label} 기능은 다음 화면에서 제공할 예정입니다.`);
  };

  return (
    <header className="header">
      <button className="logo" onClick={() => onNavigate("landing")}>LOGO</button>
      <nav>
        {menuItems.map(([label, step]) => (
          <button
            className={step === activeStep ? "active" : ""}
            key={label}
            onClick={() => moveTo(label, step)}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="header-actions">
        <button className="login-link" onClick={() => onNavigate("login")}>로그인</button>
        <button className="mypage-link" onClick={() => onNavigate("mypage")}>마이페이지</button>
        <button className={`header-map-button ${isMapOpen ? "active" : ""}`} type="button" aria-label="지역 비교 지도 보기" aria-pressed={isMapOpen} onClick={onMapToggle}><FaMapMarkedAlt aria-hidden="true" /></button>
      </div>
    </header>
  );
}

export default Header;
