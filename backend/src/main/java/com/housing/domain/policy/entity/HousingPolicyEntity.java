package com.housing.domain.policy.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "HOUSING_POLICIES")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@SequenceGenerator(name = "housingPoliciesSequence", sequenceName = "HOUSING_POLICIES_SEQ", allocationSize = 1)
public class HousingPolicyEntity {
    @Id @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "housingPoliciesSequence") @Column(name = "POLICY_ID") private Long id;
    @Column(name = "TITLE", nullable = false, length = 200) private String title;
    @Column(name = "ORGANIZATION", nullable = false, length = 100) private String organization;
    @Column(name = "POLICY_TYPE", nullable = false, length = 30) private String policyType;
    @Column(name = "ELIGIBILITY_SUMMARY", nullable = false, length = 1000) private String eligibilitySummary;
    @Column(name = "BENEFIT_SUMMARY", length = 1000) private String benefitSummary;
    @Column(name = "APPLICATION_URL", length = 500) private String applicationUrl;
    @Column(name = "START_DATE") private LocalDate startDate;
    @Column(name = "END_DATE") private LocalDate endDate;
    @Column(name = "STATUS", nullable = false, length = 20) private String status;
}
