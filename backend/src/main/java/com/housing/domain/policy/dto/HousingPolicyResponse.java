package com.housing.domain.policy.dto;

import com.housing.domain.policy.entity.HousingPolicyEntity;
import java.time.LocalDate;

public record HousingPolicyResponse(Long id, String title, String organization, String policyType,
                                    String eligibilitySummary, String benefitSummary, String applicationUrl,
                                    LocalDate startDate, LocalDate endDate, String status) {
    public static HousingPolicyResponse from(HousingPolicyEntity policy) {
        return new HousingPolicyResponse(policy.getId(), policy.getTitle(), policy.getOrganization(),
                policy.getPolicyType(), policy.getEligibilitySummary(), policy.getBenefitSummary(),
                policy.getApplicationUrl(), policy.getStartDate(), policy.getEndDate(), policy.getStatus());
    }
}
