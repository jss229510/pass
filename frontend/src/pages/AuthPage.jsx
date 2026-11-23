import React from "react";

const socialLogins = [
  ["Google", "https://cdn.simpleicons.org/google/4285F4"],
  ["네이버", "https://cdn.simpleicons.org/naver/03C75A"],
  ["카카오", "https://cdn.simpleicons.org/kakaotalk/3C1E1E"],
  ["GitHub", "https://cdn.simpleicons.org/github/181717"],
];

function AuthPage({ mode, onModeChange, onComplete }) {
  const isLogin = mode === "login";

  return (
    <section className={`auth-v2 ${mode}`}>
      <style>{`
        .housing-app .auth-container{padding:0}
        .auth-v2{position:relative;display:grid;grid-template-columns:1fr 1fr;height:100vh;height:100dvh;overflow:hidden;background:#fff;font-family:Arial,"Noto Sans KR",sans-serif}
        .auth-v2 *{box-sizing:border-box}
        .auth-v2:before{content:"";position:absolute;z-index:0;top:-35%;left:-30%;width:80%;height:170%;border-radius:50%;background:linear-gradient(135deg,var(--color-primary),var(--color-primary));box-shadow:0 16px 45px rgb(var(--color-primary-rgb) / 0.322);transition:transform .7s cubic-bezier(.65,0,.35,1)}
        .auth-v2.signup:before{transform:translateX(100%)}
        .auth-v2-copy{position:relative;z-index:2;display:grid;place-items:center;padding:60px;color:#fff}
        .auth-v2-copy>div{width:min(100%,360px)}
        .auth-v2-copy h1{margin:0 0 16px;font-size:clamp(40px,4vw,62px);line-height:1.08;letter-spacing:-.07em}
        .auth-v2-copy p{margin:0;font-size:16px;line-height:1.7}
        .auth-v2-copy button{margin-top:26px;border:1px solid #fff;border-radius:999px;padding:12px 22px;background:transparent;color:#fff;font-weight:900}
        /* 카드는 화면 높이 안에서 가운데. 화면이 아주 낮을 때만 이 영역 안에서 스크롤된다(페이지는 스크롤되지 않음). */
        .auth-v2-card-wrap{position:relative;z-index:1;display:flex;flex-direction:column;min-height:0;overflow-y:auto;padding:clamp(12px,3vh,42px) 42px}
        .auth-v2-card{width:min(100%,460px);margin:auto;padding:clamp(20px,3.6vh,36px) 36px;border-radius:22px;background:#fff;box-shadow:0 18px 42px rgb(var(--color-primary-rgb) / 0.149)}
        .auth-v2-logo{display:block;margin-bottom:clamp(6px,1.6vh,20px);color:var(--color-text);font-size:18px;font-weight:900}
        .auth-v2-card h2{margin:0 0 clamp(8px,2vh,24px);color:var(--color-text);font-size:clamp(24px,3.4vh,30px);letter-spacing:-.06em}
        .auth-v2-field{display:grid;gap:clamp(4px,.7vh,7px);margin:clamp(6px,1.2vh,13px) 0;color:var(--color-text-secondary);font-size:13px;font-weight:800}
        .auth-v2-field input{width:100%;min-width:0;height:clamp(40px,5.4vh,47px);padding:0 14px;border:2px solid transparent;border-radius:9px;outline:0;background:var(--color-surface-soft);color:var(--color-text);font-size:14px}
        .auth-v2-field input:focus{border-color:var(--color-primary);background:#fff}
        /* 회원가입 입력칸: 두 칸씩, 카드가 좁으면 한 칸씩 */
        .auth-v2-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));column-gap:12px}
        .auth-v2-fields .auth-v2-field{min-width:0}
        .auth-v2-submit{width:100%;height:clamp(42px,5.6vh,48px);margin-top:clamp(4px,1vh,10px);border:0;border-radius:9px;background:var(--color-primary-strong);color:#fff;font-size:15px;font-weight:900}
        .auth-v2-options{display:flex;justify-content:space-between;align-items:center;margin:clamp(8px,1.6vh,16px) 0;color:var(--color-text-muted);font-size:12px}
        .auth-v2-options label,.auth-v2-agree{display:flex;align-items:center;gap:7px}
        .auth-v2-options input,.auth-v2-agree input{accent-color:var(--color-primary)}
        .auth-v2-link{border:0;background:transparent;color:var(--color-primary-strong);font-weight:900}
        .auth-v2-divider{display:flex;align-items:center;gap:10px;margin:clamp(10px,2vh,22px) 0 clamp(8px,1.4vh,14px);color:var(--color-text-muted);font-size:11px}
        .auth-v2-divider:before,.auth-v2-divider:after{content:"";height:1px;flex:1;background:var(--color-background)}
        .auth-v2-socials{display:grid;grid-template-columns:1fr 1fr;gap:9px}
        .auth-v2-socials button{display:flex;align-items:center;justify-content:center;gap:9px;height:clamp(38px,5vh,45px);border:1px solid var(--color-background);border-radius:8px;background:#fff;color:var(--color-text);font-size:13px;font-weight:800}
        .auth-v2-socials img{width:18px;height:18px}
        .auth-v2-switch{margin:clamp(10px,2vh,21px) 0 0;text-align:center;color:var(--color-text-muted);font-size:13px}
        .auth-v2-agree{margin:clamp(8px,1.5vh,15px) 0;color:var(--color-text-muted);font-size:12px}
        .auth-v2.signup .auth-v2-copy{grid-column:2;grid-row:1}
        .auth-v2.signup .auth-v2-card-wrap{grid-column:1;grid-row:1}
        /* 태블릿·모바일: 위쪽 파란 헤더 + 그 아래 카드 */
        @media(max-width:900px){
          .auth-v2{display:flex;flex-direction:column}
          .auth-v2:before{display:none}
          .auth-v2-copy{z-index:0;flex:none;display:block;padding:clamp(18px,4vh,44px) 24px clamp(40px,7vh,64px);background:linear-gradient(135deg,var(--color-primary),var(--color-primary-strong));border-radius:0 0 28px 28px}
          .auth-v2-copy>div{width:auto}
          .auth-v2-copy h1{margin:0;font-size:clamp(26px,4.4vh,35px)}
          .auth-v2-copy p{display:none}
          .auth-v2-copy button{margin-top:clamp(8px,1.6vh,14px);padding:8px 16px}
          .auth-v2-card-wrap{flex:1;margin-top:-28px;padding:0 16px clamp(12px,2.4vh,24px)}
          .auth-v2-card{margin:0 auto auto;padding:clamp(16px,2.8vh,28px) 20px}
          .auth-v2.signup .auth-v2-copy,.auth-v2.signup .auth-v2-card-wrap{grid-column:auto;grid-row:auto}
        }
      `}</style>
      <div className="auth-v2-copy"><div><h1>{isLogin ? "Welcome" : "Join with us"}</h1><p>{isLogin ? <>나에게 맞는 월세 원룸과<br />청년 주거 혜택을 찾아보세요.</> : <>더 나은 주거 선택의 시작을<br />함께 준비해 보세요.</>}</p><button type="button" onClick={() => onModeChange(isLogin ? "signup" : "login")}>{isLogin ? "회원가입하기" : "로그인하기"}</button></div></div>
      <div className="auth-v2-card-wrap">{isLogin ? <form className="auth-v2-card" onSubmit={(event) => { event.preventDefault(); onComplete(); }}><strong className="auth-v2-logo">LOGO</strong><h2>로그인</h2><label className="auth-v2-field">이메일<input type="email" placeholder="이메일" required /></label><label className="auth-v2-field">비밀번호<input type="password" placeholder="비밀번호" required /></label><div className="auth-v2-options"><label><input type="checkbox" /> 로그인 상태 유지</label><button className="auth-v2-link" type="button">비밀번호 찾기</button></div><button className="auth-v2-submit cta-button" type="submit">로그인</button><div className="auth-v2-divider">또는 소셜 계정으로 로그인</div><div className="auth-v2-socials">{socialLogins.map(([label, icon]) => <button key={label} type="button" onClick={onComplete}><img src={icon} alt="" />{label}</button>)}</div><p className="auth-v2-switch">아직 회원이 아니신가요? <button className="auth-v2-link" type="button" onClick={() => onModeChange("signup")}>회원가입</button></p></form> : <form className="auth-v2-card" onSubmit={(event) => { event.preventDefault(); onModeChange("login"); }}><strong className="auth-v2-logo">LOGO</strong><h2>회원가입</h2><div className="auth-v2-fields"><label className="auth-v2-field">이메일<input type="email" placeholder="이메일" required /></label><label className="auth-v2-field">인증번호<input inputMode="numeric" placeholder="인증번호 6자리" required /></label><label className="auth-v2-field">사용자 ID<input placeholder="사용할 ID" required /></label><label className="auth-v2-field">닉네임<input placeholder="닉네임" required /></label><label className="auth-v2-field">비밀번호<input type="password" placeholder="비밀번호" required /></label><label className="auth-v2-field">비밀번호 확인<input type="password" placeholder="한 번 더 입력" required /></label></div><label className="auth-v2-agree"><input type="checkbox" required /> 필수 약관에 동의합니다</label><button className="auth-v2-submit cta-button" type="submit">회원가입 완료</button><p className="auth-v2-switch">이미 계정이 있나요? <button className="auth-v2-link" type="button" onClick={() => onModeChange("login")}>로그인</button></p></form>}</div>
    </section>
  );
}

export default AuthPage;
