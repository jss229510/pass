// 생년월일 검증과 만 나이 계산.
// 입력값 {y, m, d}는 숫자 또는 숫자 문자열("2001", "03", "5")을 모두 받는다.
// 날짜 비교는 모두 로컬 날짜(연·월·일) 기준이며, 테스트를 위해 today를 주입할 수 있다.

export const MIN_BIRTH_YEAR = 1900;
export const MIN_SIGNUP_AGE = 14;

export const BIRTH_DATE_ERRORS = {
  year: "1900년 이후의 연도를 입력해 주세요.",
  month: "월은 1~12 사이로 입력해 주세요.",
  day: "일은 1~31 사이로 입력해 주세요.",
  invalid: "존재하지 않는 날짜예요.",
  future: "미래 날짜는 입력할 수 없어요.",
  underage: `만 ${MIN_SIGNUP_AGE}세 미만은 가입할 수 없어요.`,
};

const toInt = (value) => {
  if (typeof value === "number") return Number.isInteger(value) ? value : null;
  if (typeof value !== "string" || !/^\d+$/.test(value.trim())) return null;
  return Number.parseInt(value.trim(), 10);
};

const hasValue = (value) => value !== null && value !== undefined && String(value).trim() !== "";

const toParts = (date) => ({ y: date.getFullYear(), m: date.getMonth() + 1, d: date.getDate() });

// a가 b보다 앞이면 음수, 같으면 0, 뒤면 양수
const compareParts = (a, b) => (a.y - b.y) || (a.m - b.m) || (a.d - b.d);

export const isLeapYear = (year) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

export const getDaysInMonth = (year, month) => {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
};

/** 실존하는 날짜인지(2월 30일·평년 2월 29일 불가). 범위·미래 여부는 보지 않는다. */
export const isRealDate = (y, m, d) =>
  Number.isInteger(y) && Number.isInteger(m) && Number.isInteger(d)
  && m >= 1 && m <= 12 && d >= 1 && d <= getDaysInMonth(y, m);

/** {y, m, d}를 정수로 바꾼다. 세 칸 중 하나라도 숫자가 아니면 null. */
export const parseBirthDate = (birthDate) => {
  const y = toInt(birthDate?.y);
  const m = toInt(birthDate?.m);
  const d = toInt(birthDate?.d);
  return y === null || m === null || d === null ? null : { y, m, d };
};

/** 1900년 이후, 실존, 미래 아님을 모두 만족하면 true. */
export const isValidBirthDate = (birthDate, today = new Date()) => {
  const parts = parseBirthDate(birthDate);
  if (!parts || parts.y < MIN_BIRTH_YEAR || !isRealDate(parts.y, parts.m, parts.d)) return false;
  return compareParts(parts, toParts(today)) <= 0;
};

/**
 * 만 나이. 유효하지 않은 날짜면 null.
 * 2월 29일생은 평년에 3월 1일이 되어야 한 살을 더한다(민법 제160조 제3항과 같은 결과).
 */
export const calculateFullAge = (birthDate, today = new Date()) => {
  if (!isValidBirthDate(birthDate, today)) return null;
  const birth = parseBirthDate(birthDate);
  const now = toParts(today);
  const hadBirthday = now.m > birth.m || (now.m === birth.m && now.d >= birth.d);
  return now.y - birth.y - (hadBirthday ? 0 : 1);
};

/**
 * 입력 중인 생년월일을 검사한다. 입력이 덜 끝났을 때는 확실히 틀린 칸만 오류로 알려준다.
 *
 * @returns {{
 *   status: "empty" | "incomplete" | "invalid" | "underage" | "valid",
 *   field: "y" | "m" | "d" | null,   // 오류가 난 칸(포커스·aria-invalid용)
 *   error: string,                   // 입력칸 아래에 보여줄 문구, 없으면 ""
 *   age: number | null,              // "만 N세" 미리보기용
 *   canProceed: boolean,
 * }}
 */
export const validateBirthDate = (birthDate, today = new Date()) => {
  const raw = { y: birthDate?.y, m: birthDate?.m, d: birthDate?.d };
  const result = (status, field = null, error = "", age = null) => ({ status, field, error, age, canProceed: status === "valid" });

  if (!hasValue(raw.y) && !hasValue(raw.m) && !hasValue(raw.d)) return result("empty");

  const y = toInt(raw.y);
  const m = toInt(raw.m);
  const d = toInt(raw.d);
  const now = toParts(today);

  // 칸별로 확정할 수 있는 오류는 나머지 칸을 다 채우기 전에도 바로 보여준다.
  const yearDone = y !== null && String(raw.y).trim().length >= 4;
  if (hasValue(raw.y) && (y === null || (yearDone && (y < MIN_BIRTH_YEAR || y > now.y)))) {
    return result("invalid", "y", y !== null && y > now.y ? BIRTH_DATE_ERRORS.future : BIRTH_DATE_ERRORS.year);
  }
  if (hasValue(raw.m) && (m === null || m > 12 || (m === 0 && String(raw.m).trim().length >= 2))) {
    return result("invalid", "m", BIRTH_DATE_ERRORS.month);
  }
  if (hasValue(raw.d) && (d === null || d > 31 || (d === 0 && String(raw.d).trim().length >= 2))) {
    return result("invalid", "d", BIRTH_DATE_ERRORS.day);
  }

  if (!yearDone || m === null || m === 0 || d === null || d === 0) return result("incomplete");

  if (!isRealDate(y, m, d)) return result("invalid", "d", BIRTH_DATE_ERRORS.invalid);
  if (compareParts({ y, m, d }, now) > 0) return result("invalid", "d", BIRTH_DATE_ERRORS.future);

  const age = calculateFullAge({ y, m, d }, today);
  if (age < MIN_SIGNUP_AGE) return result("underage", null, BIRTH_DATE_ERRORS.underage, age);
  return result("valid", null, "", age);
};

/** 오류 문구만 필요할 때. 통과하거나 아직 입력 중이면 "". */
export const getBirthDateError = (birthDate, today = new Date()) => validateBirthDate(birthDate, today).error;

// 드롭다운 입력용 선택지
export const getYearOptions = (today = new Date()) => {
  const years = [];
  for (let y = today.getFullYear(); y >= MIN_BIRTH_YEAR; y -= 1) years.push(y);
  return years;
};

export const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

/** 연·월이 정해지면 그 달의 일수만큼, 아니면 31일까지. */
export const getDayOptions = (year, month) => {
  const y = toInt(year);
  const m = toInt(month);
  const count = y !== null && m !== null && m >= 1 && m <= 12 ? getDaysInMonth(y, m) : 31;
  return Array.from({ length: count }, (_, i) => i + 1);
};

/** 요약 화면 표시용: "2001년 3월 5일". 유효하지 않으면 "". */
export const formatBirthDate = (birthDate) => {
  const parts = parseBirthDate(birthDate);
  return parts && isRealDate(parts.y, parts.m, parts.d) ? `${parts.y}년 ${parts.m}월 ${parts.d}일` : "";
};
