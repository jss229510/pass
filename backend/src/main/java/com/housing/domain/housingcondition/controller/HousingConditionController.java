package com.housing.domain.housingcondition.controller;

import com.housing.domain.housingcondition.dto.HousingConditionRequest;
import com.housing.domain.housingcondition.dto.HousingConditionResponse;
import com.housing.domain.housingcondition.service.HousingConditionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/{userId}/housing-conditions")
@RequiredArgsConstructor
public class HousingConditionController {

    private final HousingConditionService housingConditionService;

    @PutMapping("/active")
    public ResponseEntity<HousingConditionResponse> saveActiveCondition(
            @PathVariable Long userId,
            @Valid @RequestBody HousingConditionRequest request
    ) {
        return ResponseEntity.ok(housingConditionService.saveActiveCondition(userId, request));
    }

    @GetMapping("/active")
    public HousingConditionResponse getActiveCondition(@PathVariable Long userId) {
        return housingConditionService.getActiveCondition(userId);
    }
}
