import React, { useEffect, useMemo, useState } from "react";
import { FaBell, FaCheckCircle, FaFileAlt, FaMapMarkerAlt, FaRegCalendarAlt } from "react-icons/fa";
import NotificationToggleRow from "../features/notifications/NotificationToggleRow";

const initialSettings = {
  types: { rent: true, policy: true, checklist: false, document: true },
  threshold: 3,
  rooms: ["원룸", "오피스텔"],
  regionScope: "전체",
  channels: { email: false, push: false },
  quietHours: "22:00 - 08:00",
};

const notificationTypes = [
  { key: "rent", title: "관심 지역 월세 변동", description: "중위 월세가 설정한 기준 이상 변하면 알려드려요.", icon: FaMapMarkerAlt, preview: "관악구 신림동 원룸 월세 중위값이 지난달 대비 ▲3.2% 변했어요." },
  { key: "policy", title: "정책 공고·신청 기간", description: "청년 주거 지원 공고와 신청 마감일을 확인해요.", icon: FaRegCalendarAlt, preview: "청년 월세 특별지원 신청이 7일 뒤 마감돼요." },
  { key: "checklist", title: "체크리스트 마감 임박", description: "이사 준비 항목의 예정일을 놓치지 않게 도와드려요.", icon: FaCheckCircle, preview: "전입신고 준비 항목의 예정일이 내일이에요." },
  { key: "document", title: "서류 검토 완료", description: "서류 검토가 끝나거나 확인할 내용이 생기면 알려드려요.", icon: FaFileAlt, preview: "임대차계약서_유성구.pdf의 점검이 완료됐어요." },
];

function NotificationsPage({ embedded = false }) {
  const [settings, setSettings] = useState(initialSettings);
  const [savedSettings, setSavedSettings] = useState(initialSettings);
  const [preview, setPreview] = useState(null);
  const [toast, setToast] = useState("");
  const isDirty = useMemo(() => JSON.stringify(settings) !== JSON.stringify(savedSettings), [settings, savedSettings]);
  const hasChannel = settings.channels.email || settings.channels.push;

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const updateType = (key, checked) => setSettings((value) => ({ ...value, types: { ...value.types, [key]: checked } }));
  const updateChannel = (key, checked) => setSettings((value) => ({ ...value, channels: { ...value.channels, [key]: checked } }));
  const toggleRoom = (room) => setSettings((value) => ({ ...value, rooms: value.rooms.includes(room) ? value.rooms.filter((item) => item !== room) : [...value.rooms, room] }));
  const save = () => { setSavedSettings(settings); setToast("알림 설정을 저장했어요."); };
  const cancel = () => setSettings(savedSettings);

  return (
    <section className={`notifications-page ${embedded ? "is-embedded" : ""}`}>
      <style>{`
        .notifications-page{max-width:1040px;margin:-42px auto 88px;color:#193a31}.notifications-page.is-embedded{max-width:none;margin:0;padding-bottom:88px}.notifications-page.is-embedded .notifications-head{display:none}.notifications-page.is-embedded .notification-sticky{position:fixed;z-index:15;right:max(24px,calc((100vw - 1540px) / 2));bottom:18px;left:calc(max(24px,calc((100vw - 1540px) / 2)) + 246px);margin:0}.notifications-head h1{margin:0;font-size:32px;letter-spacing:-.055em}.notifications-head p{margin:9px 0 25px;color:#6d857d;font-size:14px}.notifications-grid{display:grid;gap:16px}.notification-card{padding:24px;border:1px solid #dcebe6;border-radius:16px;background:#fff}.notification-card-head{display:flex;justify-content:space-between;gap:16px;align-items:start;margin-bottom:17px}.notification-card h2{margin:0;font-size:19px;letter-spacing:-.04em}.notification-card-head p{margin:6px 0 0;color:#738a82;font-size:12px}.notification-toggle-list{display:grid;gap:2px}.notification-toggle-row{display:grid;grid-template-columns:42px minmax(0,1fr) auto;gap:12px;align-items:center;padding:13px 0;border-top:1px solid #edf2ef;cursor:pointer}.notification-toggle-row:first-child{border-top:0}.notification-toggle-icon{display:grid;place-items:center;width:36px;height:36px;border-radius:11px;background:#eaf8f3;color:#008b70}.notification-toggle-copy strong,.notification-toggle-copy small{display:block}.notification-toggle-copy strong{font-size:14px}.notification-toggle-copy small{margin-top:4px;color:#748981;font-size:11px;line-height:1.45}.notification-toggle-row input,.notification-channel-row input{position:relative;width:42px;height:24px;margin:0;appearance:none;border:0;border-radius:999px;background:#cdded8;cursor:pointer;transition:background .2s}.notification-toggle-row input:after,.notification-channel-row input:after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 3px #173d3426;transition:transform .2s}.notification-toggle-row input:checked,.notification-channel-row input:checked{background:#008b70}.notification-toggle-row input:checked:after,.notification-channel-row input:checked:after{transform:translateX(18px)}.notification-preview-btn{border:1px solid #bde2d6;border-radius:8px;padding:8px 10px;background:#fff;color:#07816a;font-size:12px;font-weight:800}.notification-preview{margin-top:12px;padding:12px 14px;border-radius:5px 13px 13px;background:#eff9f5;color:#42635a;font-size:13px;line-height:1.55}.notification-preview b{display:block;margin-bottom:4px;color:#07816a;font-size:11px}.notification-fields{display:grid;gap:21px}.notification-field{display:grid;gap:9px}.notification-field>span{font-size:13px;font-weight:900}.notification-field small{color:#70867f;font-size:11px}.notification-range{display:grid;grid-template-columns:1fr auto;gap:13px;align-items:center}.notification-range input{accent-color:#008b70}.notification-range b{display:grid;place-items:center;min-width:46px;height:34px;border-radius:8px;background:#e8f8f2;color:#008b70;font-size:13px}.notification-chips{display:flex;gap:7px;flex-wrap:wrap}.notification-chips button{border:1px solid #d1e5de;border-radius:999px;padding:8px 11px;background:#fff;color:#607a71;font-size:12px;font-weight:800}.notification-chips button.active{border-color:#008b70;background:#e8f8f2;color:#007d67}.notification-warn{display:flex;gap:9px;align-items:center;margin-bottom:17px;padding:12px 13px;border:1px solid #f0d9a9;border-radius:10px;background:#fff8e9;color:#8a641a;font-size:12px;line-height:1.45}.notification-channel-list{display:grid;gap:1px}.notification-channel-row{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:12px 0;border-top:1px solid #edf2ef;font-size:14px;font-weight:800}.notification-channel-row:first-child{border-top:0}.notification-quiet{display:flex;justify-content:space-between;gap:15px;align-items:center;margin-top:10px;padding-top:17px;border-top:1px solid #edf2ef}.notification-quiet label{font-size:13px;font-weight:900}.notification-quiet select{padding:9px 11px;border:1px solid #d5e7e0;border-radius:8px;background:#fff;color:#3c5f54;font-size:12px}.notification-sticky{position:sticky;z-index:5;bottom:16px;display:flex;justify-content:flex-end;gap:9px;margin-top:20px;padding:13px 16px;border:1px solid #d6e7e1;border-radius:13px;background:#fffffff5;box-shadow:0 10px 24px #143d3315;backdrop-filter:blur(8px)}.notification-sticky button{padding:10px 14px;border:1px solid #cde3db;border-radius:8px;background:#fff;color:#52736a;font-size:13px;font-weight:900}.notification-sticky .save{border-color:#008b70;background:#008b70;color:#fff}.notification-sticky button:disabled{opacity:.45;cursor:default}.notification-toast{position:fixed;z-index:20;right:24px;bottom:24px;padding:12px 15px;border-radius:9px;background:#173c33;color:#fff;font-size:13px;font-weight:800;box-shadow:0 10px 22px #092e2533}@media(max-width:760px){.notifications-page{margin:-15px 0 84px}.notifications-page.is-embedded{margin:0;padding-bottom:78px}.notifications-page.is-embedded .notification-sticky{right:12px;bottom:10px;left:12px}.notifications-head h1{font-size:27px}.notification-card{padding:19px}.notification-card-head{display:block}.notification-card-head p{margin-bottom:12px}.notification-toggle-row{grid-template-columns:38px minmax(0,1fr)}.notification-preview-btn{grid-column:2;justify-self:start}.notification-quiet{display:grid}.notification-quiet select{width:100%}.notification-sticky{bottom:10px}.notification-toast{right:16px;bottom:16px}}
        .notifications-page.is-embedded{padding-bottom:0}.notifications-page.is-embedded .notification-sticky{position:static;display:flex;justify-content:flex-end;margin-top:20px;padding:0;border:0;border-radius:0;background:transparent;box-shadow:none;backdrop-filter:none}
        @media(max-width:760px){.notifications-page.is-embedded .notification-sticky{position:static;margin-top:16px;padding:0}}
      `}</style>

      <header className="notifications-head"><h1>알림 설정</h1><p>이사 준비에 필요한 변화와 일정만 골라 받아보세요.</p></header>
      <div className="notifications-grid">
        <section className="notification-card"><div className="notification-card-head"><div><h2>알림 종류</h2><p>받고 싶은 알림을 선택하세요.</p></div></div><div className="notification-toggle-list">{notificationTypes.map((item) => <React.Fragment key={item.key}><NotificationToggleRow icon={item.icon} title={item.title} description={item.description} checked={settings.types[item.key]} onChange={(checked) => updateType(item.key, checked)} /><button type="button" className="notification-preview-btn" onClick={() => setPreview(preview === item.key ? null : item.key)}>미리보기</button>{preview === item.key && <div className="notification-preview"><b>알림 예시</b>{item.preview}</div>}</React.Fragment>)}</div></section>
        <section className="notification-card"><div className="notification-card-head"><div><h2>변동 기준</h2><p>월세 변동과 알림 대상을 세밀하게 조정하세요.</p></div></div><div className="notification-fields"><label className="notification-field"><span>월세 변동 기준</span><div className="notification-range"><input type="range" min="1" max="10" value={settings.threshold} onChange={(event) => setSettings((value) => ({ ...value, threshold: Number(event.target.value) }))} /><b>±{settings.threshold}%</b></div></label><div className="notification-field"><span>대상 방 유형</span><div className="notification-chips">{["원룸", "투룸", "오피스텔", "아파트"].map((room) => <button type="button" className={settings.rooms.includes(room) ? "active" : ""} key={room} onClick={() => toggleRoom(room)}>{room}</button>)}</div></div><div className="notification-field"><span>대상 지역</span><div className="notification-chips">{["전체", "선택 지역"].map((scope) => <button type="button" className={settings.regionScope === scope ? "active" : ""} key={scope} onClick={() => setSettings((value) => ({ ...value, regionScope: scope }))}>{scope}</button>)}</div></div></div></section>
        <section className="notification-card"><div className="notification-card-head"><div><h2>수신 채널</h2><p>알림을 받을 채널과 방해 금지 시간을 설정하세요.</p></div></div>{!hasChannel && <div className="notification-warn"><FaBell aria-hidden="true" />수신 채널이 연결되지 않았어요. 이메일 또는 앱 푸시를 켜 주세요.</div>}<div className="notification-channel-list">{[["email", "이메일"], ["push", "앱 푸시"]].map(([key, label]) => <label className="notification-channel-row" key={key}>{label}<input type="checkbox" checked={settings.channels[key]} onChange={(event) => updateChannel(key, event.target.checked)} /></label>)}</div><div className="notification-quiet"><label htmlFor="quiet-hours">방해 금지 시간</label><select id="quiet-hours" value={settings.quietHours} onChange={(event) => setSettings((value) => ({ ...value, quietHours: event.target.value }))}><option>22:00 - 08:00</option><option>23:00 - 07:00</option><option>설정 안 함</option></select></div></section>
      </div>
      <footer className="notification-sticky"><button type="button" disabled={!isDirty} onClick={cancel}>변경 취소</button><button type="button" className="save" disabled={!isDirty} onClick={save}>저장</button></footer>
      {toast && <div className="notification-toast" role="status">{toast}</div>}
    </section>
  );
}

export default NotificationsPage;
