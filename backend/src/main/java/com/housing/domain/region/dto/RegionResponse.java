package com.housing.domain.region.dto;

import com.housing.domain.region.entity.RegionEntity;
import java.math.BigDecimal;

public record RegionResponse(
        Long id,
        String sido,
        String sigungu,
        String displayName,
        BigDecimal latitude,
        BigDecimal longitude,
        Long averageRent,
        Long averageManagementFee,
        Integer transportScore,
        Integer infraScore,
        Integer safetyScore,
        Integer supportScore
) {
    public static RegionResponse from(RegionEntity region) {
        return new RegionResponse(
                region.getId(), region.getSido(), region.getSigungu(), region.getDisplayName(),
                region.getLatitude(), region.getLongitude(), region.getAverageRent(), region.getAverageManagementFee(),
                region.getTransportScore(), region.getInfraScore(), region.getSafetyScore(), region.getSupportScore()
        );
    }
}
