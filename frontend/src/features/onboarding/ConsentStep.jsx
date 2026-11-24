import React from "react";
import { CONSENT_LABELS } from "../../utils/conditionsStore";
import { Question, StepActions, buttonClass, useNumberKeys } from "./fields";
import { formatDateTime } from "./format";

/** 소득·지출 입력 전 안내 카드. 1 = 동의하고 입력, 2 = 건너뛰기 */
export default function ConsentStep({ answers, onAgree, onDecline, onPrev, prevLabel }) {
  useNumberKeys(2, (index) => (index === 0 ? onAgree() : onDecline()));

  return (
    <Question label="선택 정보" title="소득·지출은 선택 정보예요" help="정책 확인과 실부담 계산에만 쓰고 언제든 철회할 수 있어요.">
      <div className="rounded-xl border border-solid border-border-subtle bg-brand-50 p-5">
        <ul className="m-0 flex list-none flex-col gap-3 p-0 text-[15px] leading-relaxed text-ink-700">
          <li className="flex gap-3"><span aria-hidden="true" className="text-brand-600">✓</span>월 소득과 고정 지출만 물어봐요. 부모님 소득은 받지 않아요.</li>
          <li className="flex gap-3"><span aria-hidden="true" className="text-brand-600">✓</span>지원 정책 조건 확인과 월 실부담 계산에만 써요.</li>
          <li className="flex gap-3"><span aria-hidden="true" className="text-brand-600">✓</span>설정에서 언제든 동의를 철회하고 값을 지울 수 있어요.</li>
        </ul>
      </div>

      {answers.optionalConsent && (
        <p className="m-0 mt-4 text-sm text-ink-500">
          현재 상태: {CONSENT_LABELS[answers.optionalConsent]}
          {answers.optionalConsentAt && ` · ${formatDateTime(answers.optionalConsentAt)}`}
        </p>
      )}

      <div className="mt-8 grid gap-2 md:grid-cols-2">
        <button type="button" aria-keyshortcuts="1" className={buttonClass.primary} onClick={onAgree}>
          동의하고 입력
        </button>
        <button type="button" aria-keyshortcuts="2" className={buttonClass.secondary} onClick={onDecline}>
          건너뛰기
        </button>
      </div>

      <StepActions onPrev={onPrev} prevLabel={prevLabel} />
    </Question>
  );
}
