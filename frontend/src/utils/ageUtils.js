const toNumber = (value) => Number.parseInt(value, 10);

const getTodayParts = (today) => ({
  y: today.getFullYear(),
  m: today.getMonth() + 1,
  d: today.getDate(),
});

export const isLeapYear = (year) => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

export const isValidBirthDate = (birthDate, today = new Date()) => {
  const y = toNumber(birthDate?.y);
  const m = toNumber(birthDate?.m);
  const d = toNumber(birthDate?.d);
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d) || y < 1900) return false;

  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return false;

  const todayParts = getTodayParts(today);
  return y < todayParts.y || (y === todayParts.y && (m < todayParts.m || (m === todayParts.m && d <= todayParts.d)));
};

export const calculateFullAge = (birthDate, today = new Date()) => {
  if (!isValidBirthDate(birthDate, today)) return null;

  const y = toNumber(birthDate.y);
  const m = toNumber(birthDate.m);
  const d = toNumber(birthDate.d);
  const todayParts = getTodayParts(today);
  const hadBirthday = todayParts.m > m || (todayParts.m === m && todayParts.d >= d);
  return todayParts.y - y - (hadBirthday ? 0 : 1);
};

export const getBirthDateError = (birthDate, today = new Date()) => {
  const y = toNumber(birthDate?.y);
  const m = toNumber(birthDate?.m);
  const d = toNumber(birthDate?.d);
  if (!birthDate?.y || !birthDate?.m || !birthDate?.d) return "생년월일을 모두 입력해 주세요.";
  if (!Number.isInteger(y) || y < 1900) return "1900년 이후의 생년을 입력해 주세요.";

  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return "실존하는 날짜를 입력해 주세요.";
  if (!isValidBirthDate(birthDate, today)) return "미래 날짜는 입력할 수 없어요.";
  if (calculateFullAge(birthDate, today) < 14) return "만 14세 미만은 가입할 수 없어요.";
  return "";
};
