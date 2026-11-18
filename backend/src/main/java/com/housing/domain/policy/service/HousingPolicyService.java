package com.housing.domain.policy.service;

import com.housing.domain.policy.dto.HousingPolicyResponse;
import com.housing.domain.policy.entity.HousingPolicyEntity;
import com.housing.domain.policy.repository.HousingPolicyRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service @RequiredArgsConstructor @Transactional(readOnly = true)
public class HousingPolicyService {
    private final HousingPolicyRepository housingPolicyRepository;
    public List<HousingPolicyResponse> getOpenPolicies() {
        return housingPolicyRepository.findAllByStatusOrderByEndDateAsc("OPEN").stream().map(HousingPolicyResponse::from).toList();
    }
    public HousingPolicyResponse get(Long policyId) {
        HousingPolicyEntity policy = housingPolicyRepository.findById(policyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "주거 지원 정책을 찾을 수 없습니다."));
        return HousingPolicyResponse.from(policy);
    }
}
