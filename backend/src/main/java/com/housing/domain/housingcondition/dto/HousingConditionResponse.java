package com.housing.domain.housingcondition.dto;

import com.housing.domain.housingcondition.entity.HousingConditionEntity;
import java.time.LocalDateTime;

public record HousingConditionResponse(
        Long id,
        Long userId,
        String householdType,
        String desiredArea,
        String workLocation,
        Long depositBudget,
        Long monthlyRentBudget,
        Integer maxCommuteMinutes,
        String housingType,
        String priorityConditions,
        LocalDateTime updatedAt
) {
    public static HousingConditionResponse from(HousingConditionEntity condition) {
        return new HousingConditionResponse(
                condition.getId(), condition.getUserId(), condition.getHouseholdType(), condition.getDesiredArea(),
                condition.getWorkLocation(), condition.getDepositBudget(), condition.getMonthlyRentBudget(),
                condition.getMaxCommuteMinutes(), condition.getHousingType(), condition.getPriorityConditions(),
                condition.getUpdatedAt()
        );
    }
}
