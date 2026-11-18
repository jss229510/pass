package com.housing.domain.housingcondition.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record HousingConditionRequest(
        @NotBlank @Size(max = 30) String householdType,
        @NotBlank @Size(max = 100) String desiredArea,
        @Size(max = 100) String workLocation,
        @PositiveOrZero Long depositBudget,
        @NotNull @PositiveOrZero Long monthlyRentBudget,
        @PositiveOrZero Integer maxCommuteMinutes,
        @Size(max = 30) String housingType,
        @Size(max = 500) String priorityConditions
) {
}
