// 지역별 원룸·1.5룸·투룸 월세/전세 중위값 목업 데이터
// 백엔드 /api/market-prices를 쓸 수 없을 때 홈 화면 시세 카드에 같은 형태로 사용합니다.

const BASE_MONTH = "2026.10";
const ROOM_TYPES = ["원룸", "1.5룸", "투룸"];
const DEAL_TYPES = ["월세", "전세"];

// 원룸 기준값 (단위: 만원). 1.5룸·투룸 시세는 배율로 계산합니다.
const marketRegions = [
  { id: "daejeon-yuseong", sido: "대전", sigungu: "유성구", monthly: { deposit: 600, rent: 37, change: -2.6, samples: 60 }, jeonse: { deposit: 9800, change: -1.4, samples: 22 } },
  { id: "seoul-gwanak-sillim", sido: "서울", sigungu: "관악구", dong: "신림동", monthly: { deposit: 900, rent: 55, change: 3.8, samples: 44 }, jeonse: { deposit: 15500, change: 1.9, samples: 18 } },
  { id: "seoul-mapo", sido: "서울", sigungu: "마포구", monthly: { deposit: 1200, rent: 69, change: 6.2, samples: 84 }, jeonse: { deposit: 21000, change: 3.1, samples: 31 } },
  { id: "gyeonggi-suwon-yeongtong", sido: "경기", sigungu: "수원시 영통구", monthly: { deposit: 800, rent: 48, change: 2.1, samples: 65 }, jeonse: { deposit: 13500, change: 0.8, samples: 27 } },
  { id: "gwangju-buk", sido: "광주", sigungu: "북구", monthly: { deposit: 500, rent: 38, change: 1.2, samples: 52 }, jeonse: { deposit: 8200, change: -0.6, samples: 19 } },
  { id: "chungnam-asan", sido: "충남", sigungu: "아산시", monthly: { deposit: 500, rent: 35, change: -1.1, samples: 41 }, jeonse: { deposit: 7600, change: -2.2, samples: 16 } },
  { id: "seoul-gangnam", sido: "서울", sigungu: "강남구", monthly: { deposit: 1500, rent: 85, change: 4.4, samples: 96 }, jeonse: { deposit: 26000, change: 2.7, samples: 38 } },
  { id: "seoul-seongdong", sido: "서울", sigungu: "성동구", monthly: { deposit: 1200, rent: 72, change: 5.1, samples: 47 }, jeonse: { deposit: 22000, change: 3.4, samples: 20 } },
  { id: "seoul-dongjak", sido: "서울", sigungu: "동작구", monthly: { deposit: 1000, rent: 58, change: 2.9, samples: 58 }, jeonse: { deposit: 17000, change: 1.5, samples: 24 } },
  { id: "daejeon-seo", sido: "대전", sigungu: "서구", monthly: { deposit: 500, rent: 36, change: -0.8, samples: 49 }, jeonse: { deposit: 9000, change: -1.0, samples: 21 } },
  { id: "gyeonggi-seongnam-bundang", sido: "경기", sigungu: "성남시 분당구", monthly: { deposit: 1000, rent: 60, change: 3.3, samples: 55 }, jeonse: { deposit: 18500, change: 2.0, samples: 26 } },
  { id: "incheon-yeonsu", sido: "인천", sigungu: "연수구", monthly: { deposit: 700, rent: 45, change: 1.7, samples: 38 }, jeonse: { deposit: 12000, change: 0.4, samples: 17 } },
  { id: "busan-haeundae", sido: "부산", sigungu: "해운대구", monthly: { deposit: 700, rent: 46, change: 0.9, samples: 43 }, jeonse: { deposit: 11500, change: -0.3, samples: 15 } },
  { id: "daegu-suseong", sido: "대구", sigungu: "수성구", monthly: { deposit: 600, rent: 42, change: -1.9, samples: 36 }, jeonse: { deposit: 10500, change: -2.8, samples: 14 } },
];

const defaultRegionIds = ["daejeon-yuseong", "seoul-gwanak-sillim", "seoul-mapo", "gyeonggi-suwon-yeongtong", "gwangju-buk", "chungnam-asan"];

const roomTypeScale = {
  원룸: { deposit: 1, rent: 1, change: 0, samples: 1 },
  "1.5룸": { deposit: 1.4, rent: 1.28, change: -0.4, samples: 0.55 },
  투룸: { deposit: 2, rent: 1.62, change: -0.9, samples: 0.4 },
};

const joinParts = (region, separator) => [region.sido, region.sigungu, region.dong].filter(Boolean).join(separator);

function createRandom(seedText) {
  let seed = 0;
  for (const char of seedText) seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

// 1년 전 값에서 현재 값까지 12개월 추이를 만들되, 중간 달에는 약간의 등락을 섞습니다.
function buildYearSeries(endValue, changePct, seedText) {
  const random = createRandom(seedText);
  const startValue = endValue / (1 + changePct / 100);
  const amplitude = Math.abs(endValue - startValue) * 0.35 + endValue * 0.006;
  return Array.from({ length: 12 }, (_, index) => {
    const base = startValue + ((endValue - startValue) * index) / 11;
    if (index === 0 || index === 11) return base;
    return base + (random() - 0.5) * 2 * amplitude;
  });
}

const roundTo = (value, unit) => Math.max(unit, Math.round(value / unit) * unit);

function getMarketSnapshot(region, roomType, dealType) {
  const scale = roomTypeScale[roomType] ?? roomTypeScale.원룸;
  const source = dealType === "전세" ? region.jeonse : region.monthly;
  const change = Math.round((source.change + scale.change) * 10) / 10;
  const samples = Math.max(3, Math.round(source.samples * scale.samples));
  const seedText = `${region.id}-${roomType}-${dealType}`;

  if (dealType === "전세") {
    const deposit = roundTo(source.deposit * scale.deposit, 100);
    return { deposit, rent: null, change, samples, series: buildYearSeries(deposit, change, seedText) };
  }

  const deposit = roundTo(source.deposit * scale.deposit, 50);
  const rent = Math.round(source.rent * scale.rent);
  return { deposit, rent, change, samples, series: buildYearSeries(rent, change, seedText) };
}

// GET /api/market-prices 응답과 같은 형태를 만듭니다.
export function buildMarketPrices(roomType, dealType) {
  return {
    baseMonth: BASE_MONTH,
    roomType,
    dealType,
    roomTypes: ROOM_TYPES,
    dealTypes: DEAL_TYPES,
    defaultRegionIds,
    regions: marketRegions.map(({ id, sido, sigungu, dong = null, ...region }) => ({
      id,
      sido,
      sigungu,
      dong,
      label: joinParts({ sido, sigungu, dong }, " "),
      path: joinParts({ sido, sigungu, dong }, " > "),
      snapshot: getMarketSnapshot({ id, ...region }, roomType, dealType),
    })),
  };
}
