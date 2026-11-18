package com.housing.domain.housingcondition.service;

import com.housing.domain.housingcondition.dto.HousingConditionRequest;
import com.housing.domain.housingcondition.dto.HousingConditionResponse;
import com.housing.domain.housingcondition.entity.HousingConditionEntity;
import com.housing.domain.housingcondition.repository.HousingConditionRepository;
import com.housing.domain.user.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HousingConditionService {

    private final HousingConditionRepository housingConditionRepository;
    private final UserRepository userRepository;

    @Transactional
    public HousingConditionResponse saveActiveCondition(Long userId, HousingConditionRequest request) {
        if (!userRepository.existsById(userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다.");
        }

        housingConditionRepository.findAllByUserIdAndActiveOrderByUpdatedAtDesc(userId, "Y")
                .forEach(HousingConditionEntity::deactivate);

        HousingConditionEntity condition = HousingConditionEntity.builder()
                .userId(userId)
                .householdType(request.householdType())
                .desiredArea(request.desiredArea())
                .workLocation(request.workLocation())
                .depositBudget(request.depositBudget())
                .monthlyRentBudget(request.monthlyRentBudget())
                .maxCommuteMinutes(request.maxCommuteMinutes())
                .housingType(request.housingType())
                .priorityConditions(request.priorityConditions())
                .build();

        return HousingConditionResponse.from(housingConditionRepository.save(condition));
    }

    public HousingConditionResponse getActiveCondition(Long userId) {
        HousingConditionEntity condition = housingConditionRepository
                .findFirstByUserIdAndActiveOrderByUpdatedAtDesc(userId, "Y")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "저장된 주거 조건이 없습니다."));
        return HousingConditionResponse.from(condition);
    }
}
