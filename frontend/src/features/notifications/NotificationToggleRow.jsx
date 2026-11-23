import React from "react";
import { FaBell } from "react-icons/fa";

/**
 * 알림 종류 설정에 사용하는 공통 토글 행.
 * 부모가 checked 상태를 관리해 저장 전 변경 감지를 할 수 있도록 제어 컴포넌트로 만든다.
 */
function NotificationToggleRow({
  icon: Icon = FaBell,
  title,
  description,
  checked,
  onChange,
  disabled = false,
}) {
  const inputId = `notification-toggle-${title}`;

  return (
    <label className={`notification-toggle-row ${disabled ? "is-disabled" : ""}`} htmlFor={inputId}>
      <span className="notification-toggle-icon" aria-hidden="true"><Icon /></span>
      <span className="notification-toggle-copy">
        <strong>{title}</strong>
        {description && <small>{description}</small>}
      </span>
      <input
        id={inputId}
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
        aria-label={`${title} 알림`}
      />
    </label>
  );
}

export default NotificationToggleRow;
