import React, { useEffect, useRef } from "react";
import { calculateFullAge, getBirthDateError } from "../../utils/ageUtils";

export default function BirthDateStep({ value, onChange, onNext, headingRef }) {
  const monthRef = useRef(null); const dayRef = useRef(null); const error = getBirthDateError(value);
  useEffect(() => { document.getElementById("birth-year")?.focus(); }, []);
  const update = (key, next) => { const values = { ...value, [key]: next.replace(/\D/g, "") }; onChange(values); if (key === "y" && values.y.length === 4) monthRef.current?.focus(); if (key === "m" && values.m.length === 2) dayRef.current?.focus(); };
  const age = calculateFullAge(value);
  return <><p className="onboarding-kicker">기본 정보</p><h1 ref={headingRef} tabIndex="-1">생년월일을 알려주세요</h1><p className="onboarding-help">만 나이로 확인 가능한 지원 정책을 알려드리기 위해 사용해요.</p><div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:8 }}><input id="birth-year" className="onboarding-field" inputMode="numeric" maxLength="4" placeholder="년" value={value.y} onChange={e=>update("y",e.target.value)} /><input ref={monthRef} className="onboarding-field" inputMode="numeric" maxLength="2" placeholder="월" value={value.m} onChange={e=>update("m",e.target.value)} /><input ref={dayRef} className="onboarding-field" inputMode="numeric" maxLength="2" placeholder="일" value={value.d} onChange={e=>update("d",e.target.value)} /></div>{age !== null && <p className="onboarding-help" style={{ marginTop:12,marginBottom:0 }}>만 {age}세</p>}{error && <p role="alert" style={{ color:"#d93d42",fontSize:13 }}>{error}</p>}<div className="onboarding-actions"><span /><button className="primary" type="button" disabled={Boolean(error)} onClick={onNext}>다음</button></div></>;
}
