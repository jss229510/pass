package com.housing.domain.housingcondition.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "HOUSING_CONDITIONS")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@SequenceGenerator(name = "housingConditionsSequence", sequenceName = "HOUSING_CONDITIONS_SEQ", allocationSize = 1)
public class HousingConditionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "housingConditionsSequence")
    @Column(name = "CONDITION_ID")
    private Long id;

    @Column(name = "USER_ID", nullable = false)
    private Long userId;

    @Column(name = "HOUSEHOLD_TYPE", nullable = false, length = 30)
    private String householdType;

    @Column(name = "DESIRED_AREA", nullable = false, length = 100)
    private String desiredArea;

    @Column(name = "WORK_LOCATION", length = 100)
    private String workLocation;

    @Column(name = "DEPOSIT_BUDGET")
    private Long depositBudget;

    @Column(name = "MONTHLY_RENT_BUDGET", nullable = false)
    private Long monthlyRentBudget;

    @Column(name = "MAX_COMMUTE_MINUTES")
    private Integer maxCommuteMinutes;

    @Column(name = "HOUSING_TYPE", length = 30)
    private String housingType;

    @Column(name = "PRIORITY_CONDITIONS", length = 500)
    private String priorityConditions;

    @Column(name = "IS_ACTIVE", nullable = false, length = 1)
    private String active;

    @Column(name = "CREATED_AT", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "UPDATED_AT", nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    private HousingConditionEntity(Long userId, String householdType, String desiredArea, String workLocation,
                                   Long depositBudget, Long monthlyRentBudget, Integer maxCommuteMinutes,
                                   String housingType, String priorityConditions) {
        this.userId = userId;
        this.householdType = householdType;
        this.desiredArea = desiredArea;
        this.workLocation = workLocation;
        this.depositBudget = depositBudget;
        this.monthlyRentBudget = monthlyRentBudget;
        this.maxCommuteMinutes = maxCommuteMinutes;
        this.housingType = housingType;
        this.priorityConditions = priorityConditions;
        this.active = "Y";
    }

    public void deactivate() {
        active = "N";
    }

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
