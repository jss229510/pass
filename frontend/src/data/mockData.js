export const navItems = [
  { id: "home", label: "홈", icon: "⌂" },
  { id: "accounts", label: "계정 관리", icon: "◎" },
  { id: "graph", label: "계정 그래프", icon: "⌘" },
  { id: "incident", label: "사고 등록·분석", icon: "!" },
  { id: "plan", label: "복구 플랜", icon: "✓" },
  { id: "guide", label: "보안 가이드", icon: "?" },
];

export const accounts = [
  { id: 1, name: "주 이메일", service: "Gmail", address: "minji@example.com", mfa: "설정됨", tone: "blue" },
  { id: 2, name: "쇼핑몰 A", service: "Coupang", address: "minji@…", mfa: "미확인", tone: "orange" },
  { id: 3, name: "SNS B", service: "Instagram", address: "minji@…", mfa: "설정됨", tone: "purple" },
];

export const tasks = [
  { id: 1, priority: "먼저 확인", title: "주 이메일 복구 수단 점검", reason: "복구수단으로 연결된 서비스가 2개 있습니다.", status: "TODO", rule: "R-EML-01", icon: "✉" },
  { id: 2, priority: "다음 확인", title: "쇼핑몰 A 로그인 기록 확인", reason: "이상 로그인 알림을 확인했습니다.", status: "IN_PROGRESS", rule: "R-LGN-01", icon: "◷" },
  { id: 3, priority: "나중 확인", title: "SNS B MFA 설정 확인", reason: "계정 보호 설정을 다시 확인하세요.", status: "TODO", rule: "R-LGN-02", icon: "⌁" },
];

export const serviceCatalog = [
  "Google / Gmail",
  "Coupang",
  "Naver",
  "Instagram",
  "Kakao",
  "기타 서비스",
];

export const guideCards = [
  { category: "공식 안내", title: "이메일 계정 보안 점검", source: "KISA 118", type: "공식 문서" },
  { category: "공식 안내", title: "피싱 의심 시 대응 방법", source: "금융감독원", type: "공식 문서" },
  { category: "AI 생성 요약", title: "현재 사고와 관련된 점검 순서", source: "근거 문서 3개", type: "AI 생성 요약" },
];

export const securityAlerts = [
  {
    id: 1,
    severity: "high",
    title: "쇼핑몰 A의 이상 로그인 알림",
    detectedAt: "오늘 오전 10:42",
    account: "쇼핑몰 A",
    summary: "등록하지 않은 기기에서 로그인 시도가 있었다는 알림을 사용자가 등록했습니다.",
    evidence: ["사용자 등록 알림", "주 이메일 복구 수단 연결", "MFA 상태 미확인"],
    recommendedActions: ["쇼핑몰 A 로그인 기록 확인", "주 이메일 복구 수단 점검", "MFA 설정 여부 확인"],
  },
];

export const responseReport = {
  title: "쇼핑몰 A 이상 로그인 대응 기록",
  createdAt: "오늘 오전 10:46",
  status: "대응 진행 중",
  timeline: [
    { time: "10:42", label: "이상 로그인 알림 등록", detail: "사용자가 받은 알림 내용을 기록했습니다." },
    { time: "10:46", label: "대응 플랜 생성", detail: "규칙 R-LGN-01에 따라 점검 작업 3개를 만들었습니다." },
    { time: "진행 중", label: "사용자 확인 대기", detail: "외부 서비스에서 직접 점검한 결과를 기록하세요." },
  ],
};
