import React from "react";
import NotificationMenu from "./NotificationMenu";

function Header({ activeStep, onNavigate, onNotify, onOpenJourney, user, onLogout }) {
  const menuItems = [
    ["매물 검색", "property-map-search"],
    ["주거지원 정책", "support"],
    ["서류 검토", "documents"],
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
      {onOpenJourney && (
        <button
          className="header-journey-link"
          type="button"
          aria-current={activeStep === "moving-journey" ? "page" : undefined}
          onClick={onOpenJourney}
        >
          이사 여정
        </button>
      )}
      <nav aria-label="주 메뉴">
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
        {user ? <>
          <button className="mypage-link" onClick={() => onNavigate("mypage")}>{user.nickname}님</button>
          <button className="login-link" onClick={onLogout}>로그아웃</button>
        </> : <>
          <button className="login-link" onClick={() => onNavigate("login")}>로그인</button>
          <button className="mypage-link" onClick={() => onNavigate("login")}>마이페이지</button>
        </>}
        <NotificationMenu onNavigate={onNavigate} />
      </div>
    </header>
  );
}

export default Header;
