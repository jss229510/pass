export const policyRegions = ["전국", "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];

export const policyPortals = [
  { id: "youth", mark: "청", name: "온통청년", description: "전국·지자체 청년지원 정책", url: "https://www.youthcenter.go.kr/" },
  { id: "lh", mark: "LH", name: "LH청약플러스", description: "공공임대·주택 모집공고", url: "https://apply.lh.or.kr/" },
  { id: "myhome", mark: "집", name: "마이홈포털", description: "주거복지 안내·지원 정보", url: "https://www.myhome.go.kr/" },
  { id: "seoul", mark: "S", name: "서울주거포털", description: "서울시 주거정책·지원 안내", url: "https://housing.seoul.go.kr/" },
];

// Explicitly opt-in layout examples. Never merged into actual policy results.
export const policyExamples = [
  ["청년 월세 지원", "월세·주거비", "전국", "youth", "월세 부담을 줄이기 위한 주거비 지원 자료입니다."],
  ["청년 부동산 중개보수 및 이사비 지원", "이사·중개비", "서울", "youth", "이사할 때 필요한 중개보수·이사비 관련 자료입니다."],
  ["청년 전세자금 대출 지원", "전세·금융", "전국", "youth", "전세 보증금 마련을 위한 주거 금융 자료입니다."],
  ["청년 매입임대주택 입주자 모집", "공공임대", "경기", "lh", "청년을 위한 공공임대주택 모집공고 자료입니다."],
  ["전세보증금 반환보증 보증료 지원", "전세·금융", "전국", "youth", "전세보증금 반환보증 가입과 관련한 지원 자료입니다."],
  ["행복주택 입주자 모집", "공공임대", "부산", "lh", "행복주택의 입주 자격과 모집 정보를 살펴보는 자료입니다."],
  ["청년 주거 상담 안내", "기타 주거지원", "서울", "youth", "주거 문제와 계약에 관한 상담 안내 자료입니다."],
  ["주거급여 지원 안내", "월세·주거비", "전국", "youth", "주거비 지원 제도를 알아보기 위한 안내 자료입니다."],
  ["청년 전세임대주택 모집", "공공임대", "전국", "lh", "청년 전세임대주택의 모집 절차를 확인하는 자료입니다."],
].map(([title, category, region, source, benefit], index) => ({
  id: `example-${index}`, title, category, region, source, benefit, example: true,
  organization: source === "lh" ? "한국토지주택공사" : "정책 운영기관",
  description: "자료실 화면 구성을 보여주기 위한 예시 자료입니다. 실제 모집 중인 공고가 아닙니다.",
  eligibility: "지원 대상과 소득·연령 기준은 실제 공고에 따라 제공됩니다.",
  applicationMethod: "실제 API 연결 후 공식 공고에서 신청 방법을 확인할 수 있습니다.",
  documents: "필요 서류는 실제 공고에 따라 다릅니다.",
  period: "예시 자료 · 실제 신청 기간 없음", status: "공고 확인", publishedAt: "", updatedAt: "",
  originalUrl: source === "lh" ? "https://apply.lh.or.kr/" : "https://www.youthcenter.go.kr/",
}));
