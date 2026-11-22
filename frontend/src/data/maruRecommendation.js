// Demo prices, commute times, and environment scores are illustrative.

export const cities = [
 {name:'대전',alias:/대전|둔산|유성|카이스트/,work:[36.3504,127.3845],areas:[['둔산동',36.3568,127.3797,13,19,62,18500,95,64,79],['월평동',36.3580,127.3558,13,24,49,14200,83,80,90],['노은동',36.3713,127.3198,20,30,43,12500,73,86,96],['관저동',36.2999,127.3375,23,42,39,10600,75,92,83]]},
 {name:'부산',alias:/부산|센텀|해운대|벡스코/,work:[35.1692,129.1287],areas:[['우동',35.1638,129.1460,11,18,64,18600,95,70,88],['재송동',35.1851,129.1241,14,23,48,13200,78,82,85],['광안동',35.1587,129.1117,17,26,53,15300,89,70,84],['연산동',35.1859,129.0821,24,38,41,11000,83,88,73]]},
 {name:'전주',alias:/전주|전북대/,work:[35.8466,127.1337],areas:[['금암동',35.8422,127.1384,9,16,39,11400,87,74,68],['덕진동',35.8532,127.1217,12,22,36,10800,74,85,96],['서신동',35.8296,127.1140,15,29,45,13200,92,77,82],['효자동',35.8108,127.1125,24,40,49,14500,94,90,88]]},
 {name:'청주',alias:/청주|오송/,work:[36.6201,127.3271],areas:[['오송읍',36.6259,127.3303,9,15,47,12300,80,85,91],['강내면',36.6158,127.3605,14,23,35,9800,66,91,95],['가경동',36.6216,127.4359,23,34,49,14300,92,74,77],['복대동',36.6383,127.4335,26,42,53,15400,94,70,82]]}
];

export const step = {city:0,range:1,mode:2,arrival:3,lease:4,building:5,room:6,budget:7,deposit:8,environment:9};
export const names = ['근무지','거리','교통','도착','임대','건물','구조','예산','보증금','환경'];
export const totalSteps = names.length;
const buildingTypes=[
 {name:'아파트',match:/아파트/,rentFactor:1.16,rentDeposit:2000,jeonseFactor:1.18,areas:[39,59,84]},
 {name:'빌라',match:/빌라|연립|다세대/,rentFactor:.90,rentDeposit:1000,jeonseFactor:.86,areas:[26,39,52]},
 {name:'오피스텔',match:/오피스텔/,rentFactor:1,rentDeposit:500,jeonseFactor:1,areas:[20,29,43]},
 {name:'단독·다가구',match:/단독|다가구/,rentFactor:.80,rentDeposit:300,jeonseFactor:.72,areas:[19,27,41]}
];
export const noPreference = '상관없음';
export const noArrival = '도착 시각 미정';

export function isSkipped(index, answers){
 return (index===step.arrival&&answers[step.mode]==='자차')
  ||(index===step.deposit&&answers[step.lease]==='전세');
}
function roomPreference(text){
 if(/상관없|미정/.test(text))return noPreference;
 const rooms=[['원룸',/원룸|1룸/],['1.5룸',/1[.]5룸|분리형/],['투룸',/투룸|2룸/]]
  .filter(([,pattern])=>pattern.test(text)).map(([name])=>name);
 return rooms.length?rooms.join('·'):null;
}
function arrivalPreference(text){
 if(/미정|상관없|건너뛰/.test(text))return noArrival;
 const time=text.match(/(오전|오후)?\s*(\d{1,2})\s*(?::\s*(\d{2})|시(?:\s*(\d{1,2})\s*분?)?)/);
 if(!time)return null;
 let hour=Number(time[2]);
 const minute=Number(time[3]??time[4]??0);
 if(minute>59||(time[1]?(hour<1||hour>12):hour>23))return null;
 if(time[1])hour=hour%12+(time[1]==='오후'?12:0);
 return String(hour).padStart(2,'0')+':'+String(minute).padStart(2,'0');
}

export const envNames = ['편의시설','조용함','공원·산책'];

export const agencies = {
 대전:{
  월평동:[
   ['월평공인중개사사무소','대전광역시 서구 월평중로13번길 46, 102호','042-586-5114',6260],
   ['월평랜드공인중개사사무소','대전광역시 서구 청사로 70, 상가동 105호','042-488-5900',6260],
   ['월평주공공인중개사사무소','대전광역시 서구 월평북로 11, 상가 104호','042-488-5544',6260]
  ],
  둔산동:[
   ['둔산일번지공인중개사사무소','대전광역시 서구 둔산북로 175, 상가동 109동','042-486-2020',2445],
   ['샘머리공인중개사사무소','대전광역시 서구 문예로 174, 주상가동 104호','042-484-8944',4275],
   ['크로바시티공인중개사사무소','대전광역시 서구 둔산로 155, 단지내상가 102호','042-477-2244',7649]
  ],
  노은동:[
   ['새미래랜드공인중개사사무소','대전광역시 유성구 은구비남로 34, 상가동 104호','042-477-6200',4186],
   ['새미래타운공인중개사사무소','대전광역시 유성구 은구비남로 34, 상가동 107호','042-477-2040',4186],
   ['신일류공인중개사사무소','대전광역시 유성구 왕가봉로2번길 27-2, 노은우리텔 102호','042-823-2034',5177]
  ],
  관저동:[
   ['대주공인중개사사무소','대전광역시 서구 관저동로90번길 16, 101호','042-546-5900',2025]
  ]
 },
 부산:{
  우동:[
   ['센텀강남공인중개사사무소','부산광역시 해운대구 센텀동로 9, 1층 107호','051-744-3666',4624],
   ['센텀에이스공인중개사사무소','부산광역시 해운대구 센텀1로 9, S-116','051-731-0119',4556]
  ],
  재송동:[
   ['센텀경동공인중개사사무소','부산광역시 해운대구 해운대로76번길 52, 1층','051-781-1001',4624],
   ['센텀우리집공인중개사사무소','부산광역시 해운대구 센텀중앙로 145, 상가4동 109호','051-744-5520',4556]
  ],
  연산동:[
   ['센텀탑공인중개사사무소','부산광역시 연제구 좌수영로 225, S1동 B215호','051-992-4989',4631]
  ],
  광안동:[
   ['드파인스타부동산중개사무소','부산광역시 수영구 수영로545번길 30, 403동 301호','051-751-7535',2517],
   ['드파인태양공인중개사사무소','부산광역시 수영구 호암로29번길 50, 302동 103호','051-945-8945',2517]
  ]
 },
 전주:{
  금암동:[
   ['전대탄탄 공인중개사사무소','전북특별자치도 전주시 덕진구 백제대로 563, 코앞 상가 115호','063-272-4959',6714]
  ],
  덕진동:[
   ['더리치 공인중개사 사무소','전북특별자치도 전주시 덕진구 백제대로 496, 2층','063-225-8245',2062],
   ['웰 공인중개사사무소','전북특별자치도 전주시 덕진구 가리내9길 10, 1층 102호','063-273-3603',6163]
  ],
  서신동:[
   ['다인 공인중개사사무소','전북특별자치도 전주시 완산구 안터1길 9, 102호','063-715-3071',1651],
   ['유한회사에이플러스부동산중개법인','전북특별자치도 전주시 완산구 감나무4길 9, 1층','063-223-3399',6332]
  ],
  효자동:[
   ['신명지공인중개사사무소','전북특별자치도 전주시 완산구 우전로 325, 103호','063-263-9001',5079],
   ['서곡 공인중개사사무소','전북특별자치도 전주시 완산구 서곡로 12, 102호','063-277-9993',4261]
  ]
 },
 청주:{
  오송읍:[
   ['오송시티공인중개사사무소','충청북도 청주시 흥덕구 오송읍 오송생명5로 303, 103호','043-234-6508',5858],
   ['오송써니공인중개사사무소','충청북도 청주시 흥덕구 오송읍 오송생명12로 102-24, 101호','043-234-3738',5858]
  ],
  강내면:[
   ['더뉴사랑채공인중개사사무소','충청북도 청주시 흥덕구 강내면 가로수로 640-47, 상가동 103호','043-232-7476',2055],
   ['필부동산공인중개사사무소','충청북도 청주시 흥덕구 강내면 가로수로 550, 7호','043-715-7939',8135]
  ],
  가경동:[
   ['청주리더스공인중개사사무소','충청북도 청주시 흥덕구 서현로 66, 단지내상가 104호','043-238-2111',7471],
   ['가경자이공인중개사사무소','충청북도 청주시 흥덕구 서현로 32, 107호','043-277-8481',398]
  ],
  복대동:[
   ['청춘부동산중개사무소','충청북도 청주시 흥덕구 성봉로 293-1, 1층','043-262-2006',7481]
  ]
 }
};

export const money = num=>num>=10000?(num/10000).toLocaleString('ko-KR')+'억 원':num.toLocaleString('ko-KR')+'만 원';
export const priceText = (type,price)=>(type==='월세'?'월 ':'전세 ')+money(price);
export const pyeong = area=>(area/3.305785).toLocaleString('ko-KR',{maximumFractionDigits:1})+'평';
export const areaText = area=>'전용 '+area+'㎡ · '+pyeong(area);

function distance(a,b){const rad=x=>x*Math.PI/180;const h=Math.sin(rad(b[0]-a[0])/2)**2+Math.cos(rad(a[0]))*Math.cos(rad(b[0]))*Math.sin(rad(b[1]-a[1])/2)**2;return 12742*Math.asin(Math.min(1,Math.sqrt(h)));}
function commuteCandidates(city,range,mode){
 return city.areas.flatMap(([name,lat,lng,car,bus,rent,jeonse,...environment])=>{
  const km=distance(city.work,[lat,lng]);
  const commute=mode==='자차'?car:mode==='대중교통'?bus:Math.min(car,bus);
  if(range&&(range.unit==='km'?km>range.value:commute>range.value))return [];
  return [{name,at:[lat,lng],km,commute,rent,jeonse,environment}];
 }).sort((a,b)=>a.commute-b.commute||a.km-b.km);
}

export function getRecommendations(answers) {
 const [city,range,mode,,type,building,,budget,depositCeiling,pref]=answers;
 if(!city)return [];
 return commuteCandidates(city,range,mode).map((row,index)=>{
  const base={...row,commuteRank:index+1,failures:[]};
  if(!type)return base;
  // Synthetic price examples for each supported building type.
  const prices=buildingTypes
   .filter(option=>!building||building===noPreference||building===option.name)
   .map(option=>{
    const price=type==='전세'?Math.round(row.jeonse*option.jeonseFactor/100)*100:Math.round(row.rent*option.rentFactor);
    const rentDeposit=type==='월세'?option.rentDeposit:null;
    const failures=[];
    if(budget!=null&&price>budget)failures.push(type+' 한도 '+money(price-budget)+' 초과');
    if(depositCeiling!=null&&rentDeposit>depositCeiling)failures.push('보증금 한도 '+money(rentDeposit-depositCeiling)+' 초과');
    return {building:option.name,price,rentDeposit,area:option.areas[1],areas:option.areas,failures};
   })
   .sort((a,b)=>a.failures.length-b.failures.length||a.price-b.price);
  const priceSample=prices[0];
  const {environment,commute,km}=row;
  const environmentScore=pref?.length?environment.reduce((sum,value,i)=>sum+value*(pref.includes(i)?3:1),0)/(3+2*pref.length):environment.reduce((sum,value)=>sum+value,0)/3;
  const commuteScore=range?.unit==='분'?100-commute/range.value*50:100-km/(range?.value||10)*50;
  const budgetScore=budget?100-priceSample.price/budget*50:50;
  const score=Math.round(environmentScore*.60+Math.max(0,commuteScore)*.25+Math.max(0,budgetScore)*.15);
  return {...base,environmentScore,score,...priceSample};
 }).sort((a,b)=>Number(Boolean(a.failures.length))-Number(Boolean(b.failures.length))
  ||(pref&&!a.failures.length?b.score-a.score:0)||a.commuteRank-b.commuteRank)
  .map((row,index)=>({...row,rank:pref&&!row.failures.length?index+1:null}));
}

const questions=[
 ['새 직장은 어디에 있어요?','도시나 근무지 이름을 알려주세요.','예: 대전 둔산동에서 일해요',['대전 둔산동','부산 센텀시티','전주 전북대','청주 오송']],
 ['출퇴근은 편도로 어디까지 괜찮아요?','시간 또는 직선거리 기준으로 동네 범위를 좁혀볼게요.','예: 편도 30분 또는 5km',['20분','30분','5km','10km']],
 ['무엇을 타고 출근할 예정이에요?','이동 수단에 맞춰 통근 후보를 다시 골라볼게요.','예: 버스로 다닐 거예요',['대중교통','자차']],
 ['몇 시까지 도착해야 해요?','평일 도착 기준을 정해두면 확인 항목에 남겨요. 시간표는 연동 전이라 실제 도착 여부는 미확인이에요.','예: 오전 7시 30분',['오전 7시','오전 8시','도착 시각 미정']],
 ['어떤 임대 조건으로 찾을까요?','선택한 유형에 맞춰 다음 질문에서 예산을 확인할게요.','예: 월세로 구할래요',['월세','전세']],
 ['어떤 종류의 집을 보고 싶어요?','고른 건물 유형의 예시 가격을 기준으로 비교할게요.','예: 빌라를 보고 싶어요',['아파트','빌라','오피스텔','단독·다가구','상관없음']],
 ['선호하는 방 구조가 있어요?','원룸이나 투룸을 적어두면 개별 매물을 볼 때 확인할 수 있어요.','예: 원룸이나 1.5룸',['원룸','1.5룸','투룸','상관없음']],
 ['예산은 어느 정도 생각하고 있어요?','','',[]],
 ['보증금은 최대 얼마까지 괜찮아요?','월세와 별도로 낼 수 있는 보증금 한도를 알려주세요.','예: 1,000만 원까지',['300만 원','500만 원','1000만 원','2000만 원']],
 ['동네에서 어떤 환경이 중요해요?','여러 항목을 한 문장에 적어도 돼요. 고른 항목은 환경 점수에서 세 배 가중치를 적용해요.','예: 조용하고 산책할 공원이 있으면 좋겠어',['편의시설','조용함','공원·산책','골고루']]
];
export function answerLabel(i, a){
 if(i===step.city)return a.name;
 if(i===step.range)return a.value+a.unit+' 이내';
 if(i===step.budget||i===step.deposit)return money(a)+' 이내';
 if(i===step.environment)return a.length?a.map(x=>envNames[x]).join('·'):'골고루';
 return a;
}
function parseBudget(text, i, answers){
 const amount=text.replaceAll(',','')
  .match(/^(?:최대\s*)?(?:월(?:세)?\s*)?(?:보증금\s*)?(?:(\d+(?:\.\d+)?)\s*억\s*(?:원\s*)?)?(?:(\d+(?:\.\d+)?)\s*만\s*(?:원\s*)?)?(?:이내|까지|정도|이하)?$/);
 if(!amount||(!amount[1]&&!amount[2]))return null;
 const total=Number(amount[1]||0)*10000+Number(amount[2]||0);
 const isMonthly=i===step.budget&&answers[step.lease]==='월세';
 return Number.isFinite(total)&&(i===step.deposit?total>=0:total>0)&&(!isMonthly||total<1000)?total:null;
}
function parseAnswer(text, i, answers){
 if(i===step.city){const c=cities.filter(c=>c.alias.test(text));return c.length===1?c[0]:null;}
 if(i===step.range){
  const h=text.match(/(\d+(?:\.\d+)?)\s*시간\s*(?:(\d+)\s*분)?/);
  const m=[...text.matchAll(/(\d+(?:\.\d+)?)\s*(분|km|킬로미터)/gi)];
  if(h?m.length>1||m.some(x=>x[2]!=='분'):m.length!==1)return null;
  const unit=h||m[0][2].toLowerCase()==='분'?'분':'km';
  const value=h?Number(h[1])*60+Number(h[2]||0):Number(m[0][1]);
  return value>0&&value<=(unit==='분'?180:50)?{value,unit}:null;
 }
 if(i===step.mode){const car=/자차|자동차|운전|차로|차를/.test(text),bus=/대중교통|버스|지하철/.test(text);return car===bus?null:car?'자차':'대중교통';}
 if(i===step.arrival)return arrivalPreference(text);
 if(i===step.lease){const rent=text.includes('월세'),deposit=text.includes('전세');return rent===deposit?null:rent?'월세':'전세';}
 if(i===step.building){
  if(/상관없|미정/.test(text))return noPreference;
  const found=buildingTypes.filter(type=>type.match.test(text));
  return found.length===1?found[0].name:null;
 }
 if(i===step.room)return roomPreference(text);
 if(i===step.budget||i===step.deposit)return parseBudget(text, i, answers);
 if(/골고루|균형/.test(text))return [];
 const indexes=[/편의|마트|상권|병원/,/조용|소음|한적/,/공원|산책|녹지/].flatMap((pattern,index)=>pattern.test(text)?[index]:[]);
 return indexes.length?indexes:null;
}

export function getQuestion(answers) {
  const index = answers.length;
  const question = questions[index];
  if (!question) return null;

  const [title, description, placeholder, choices] = question;
  if (index !== step.budget) return { title, description, placeholder, choices };

  if (answers[step.lease] === '월세') {
    return {
      title,
      description: '관리비와 보증금을 제외한 월세 한도를 알려주세요.',
      placeholder: '예: 월 50만 원까지',
      choices: ['40만 원', '50만 원', '65만 원'],
    };
  }

  return {
    title,
    description: '전세 보증금 한도를 알려주세요.',
    placeholder: '예: 1억 5,000만 원까지',
    choices: ['1억 원', '1억 5000만 원', '2억 원'],
  };
}

export function addAnswer(answers, input) {
  if (answers.length >= totalSteps || typeof input !== 'string') return null;

  const answer = parseAnswer(input.trim(), answers.length, answers);
  if (answer === null) return null;

  const next = [...answers, answer];
  while (isSkipped(next.length, next)) {
    next.push(null);
  }
  return next;
}

export function marketSample(row,area,type){
 const factor=Math.sqrt(area/row.area);
 const price=type==='월세'?Math.round(row.price*factor):Math.round(row.price*factor/100)*100;
 return {...row,area,price};
}
