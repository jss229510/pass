import React from "react";

function Header({ activeStep, onNavigate, onNotify }) {
  const menuItems = [
    ["지역 추천", "home"],
    ["지역 비교", "recommend"],
    ["주거지원 정책", "support"],
    ["생활비 분석", "living-cost"],
    ["서류 검토", "documents"],
    ["AI 상담", null],
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
        <button className="menu-link" onClick={() => onNotify("전체 메뉴는 준비 중입니다.")}>메뉴</button>
        <button className="login-link" onClick={() => onNavigate("login")}>로그인</button>
        <button className="mypage-link" onClick={() => onNavigate("mypage")}>마이페이지</button>
      </div>
    </header>
  );
}

export default Header;
