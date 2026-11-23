// 이사 조건을 "항목명 · 값" 행으로 바꾼다. 온보딩 요약 화면과 마이페이지 "내 이사 조건"이 함께 쓴다.
import { calculateFullAge, formatBirthDate } from "../../utils/ageUtils";
import {
  CONSENT_LABELS, EXPENSE_ITEM_LABELS, INCOME_BASIS_LABELS, TERNARY_LABELS, WEIGHT_LABELS,
} from "../../utils/conditionsStore";
import { formatDateTime, formatManwon, formatRegionName } from "./format";
import { getVisibleSteps } from "./steps";

export const SKIPPED = "건너뜀";

const describeExpense = (expense) => {
  if (!expense) return SKIPPED;
  const total = formatManwon(expense.total);
  if (!expense.detail) return total;
  const parts = Object.entries(EXPENSE_ITEM_LABELS)
    .filter(([key]) => expense.detail[key] !== null)
    .map(([key, label]) => `${label} ${formatManwon(expense.detail[key])}`);
  return `${total} (${parts.join(", ")})`;
};

/**
 * @returns {{ stepId: string, label: string, value: string }[]}
 *   stepId는 [수정]을 눌렀을 때 열 질문. value가 ""이면 아직 입력하지 않은 필수 항목.
 */
export const buildConditionRows = (answers) => {
  const visible = new Set(getVisibleSteps(answers));
  const age = calculateFullAge(answers.birthDate);
  const consentAt = formatDateTime(answers.optionalConsentAt);

  const rows = [
    { stepId: "birthDate", label: "생년월일", value: formatBirthDate(answers.birthDate) && `${formatBirthDate(answers.birthDate)} (만 ${age}세)` },
    { stepId: "region", label: "현재 거주지", value: formatRegionName(answers.region) },
    { stepId: "targetRegions", label: "이사 희망 지역", value: answers.targetRegions.length ? answers.targetRegions.map(formatRegionName).join(", ") : SKIPPED },
    { stepId: "roomDeal", label: "방 유형 · 거래 유형", value: answers.roomTypes.length && answers.dealType ? `${answers.roomTypes.join(", ")} · ${answers.dealType}` : "" },
    { stepId: "deposit", label: "보증금 예산", value: answers.depositBudget !== null ? formatManwon(answers.depositBudget) : "" },
  ];
  if (visible.has("rent")) rows.push({ stepId: "rent", label: "월세 예산", value: answers.rentBudget !== null ? formatManwon(answers.rentBudget) : "" });

  rows.push({
    stepId: "consent",
    label: "소득·지출 동의",
    value: answers.optionalConsent ? `${CONSENT_LABELS[answers.optionalConsent]}${consentAt ? ` · ${consentAt}` : ""}` : "",
  });
  if (visible.has("income")) {
    rows.push({
      stepId: "income",
      label: "월 소득",
      value: answers.income ? `${formatManwon(answers.income.amount)}${answers.income.basis ? ` (${INCOME_BASIS_LABELS[answers.income.basis]})` : ""}` : SKIPPED,
    });
    rows.push({ stepId: "expense", label: "월 평균 지출", value: describeExpense(answers.monthlyExpense) });
  }

  rows.push(
    { stepId: "livesApart", label: "부모와 별도 거주", value: answers.livesApart ? TERNARY_LABELS[answers.livesApart] : "" },
    { stepId: "homeless", label: "무주택 여부", value: answers.homeless ? TERNARY_LABELS[answers.homeless] : "" },
    {
      stepId: "commute",
      label: "직장·학교 / 최대 출퇴근",
      value: answers.workRegion ? `${formatRegionName(answers.workRegion)} · 최대 ${answers.maxCommute ?? "-"}분` : SKIPPED,
    },
    { stepId: "weights", label: "우선순위", value: Object.entries(WEIGHT_LABELS).map(([key, label]) => `${label} ${answers.weights[key]}`).join(" · ") },
  );
  return rows;
};
