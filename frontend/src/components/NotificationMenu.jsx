import React, { useEffect, useRef, useState } from "react";
import { FaRegBell } from "react-icons/fa";
import { FiFileText, FiGift, FiHome, FiTrendingUp } from "react-icons/fi";
import "./NotificationMenu.css";

const initialNotifications = [
  { id: "market-mapo", type: "market", title: "관심 지역 시세 변동", message: "서울 마포구 원룸 월세 중위값이 1년간 6.2% 올랐어요.", time: "2시간 전", step: "landing", read: false },
  { id: "property-gungdong", type: "property", title: "찜한 매물 가격 변경", message: "'궁동 풀옵션 원룸' 월세가 2만원 내렸어요.", time: "5시간 전", step: "property-recommendations", read: false },
  { id: "support-rent", type: "support", title: "청년 월세 지원 마감 임박", message: "청년 월세 한시 특별지원 신청이 12월 5일에 마감돼요.", time: "어제", step: "support", read: false },
  { id: "document-review", type: "document", title: "서류 검토 완료", message: "계약서 검토 결과가 준비됐어요. 확인할 질문이 3개 있어요.", time: "3일 전", step: "documents", read: true },
];

const typeIcons = {
  market: FiTrendingUp,
  property: FiHome,
  support: FiGift,
  document: FiFileText,
};

function NotificationMenu({ onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const menuRef = useRef(null);
  const unreadCount = notifications.filter((item) => !item.read).length;

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) setIsOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const markAllRead = () => setNotifications((items) => items.map((item) => ({ ...item, read: true })));

  const openNotification = (notification) => {
    setNotifications((items) => items.map((item) => (item.id === notification.id ? { ...item, read: true } : item)));
    setIsOpen(false);
    onNavigate(notification.step);
  };

  return (
    <div className="notification-menu" ref={menuRef}>
      <button
        className={`header-notification-button ${isOpen ? "active" : ""}`}
        type="button"
        aria-label={unreadCount ? `알림 ${unreadCount}개 읽지 않음` : "알림"}
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => setIsOpen((open) => !open)}
      >
        <FaRegBell aria-hidden="true" />
        {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-panel" role="dialog" aria-label="알림">
          <div className="notification-panel-head">
            <b>알림</b>
            <button type="button" onClick={markAllRead} disabled={!unreadCount}>모두 읽음</button>
          </div>
          <ul>
            {notifications.map((notification) => {
              const Icon = typeIcons[notification.type];
              return (
                <li key={notification.id}>
                  <button type="button" className={notification.read ? "" : "unread"} onClick={() => openNotification(notification)}>
                    <span className={`notification-icon ${notification.type}`}><Icon aria-hidden="true" /></span>
                    <span className="notification-body">
                      <b>{notification.title}</b>
                      <span>{notification.message}</span>
                      <small>{notification.time}</small>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default NotificationMenu;
