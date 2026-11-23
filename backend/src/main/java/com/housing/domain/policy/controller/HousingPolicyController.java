package com.housing.domain.policy.controller;

import com.housing.domain.policy.dto.HousingPolicyResponse;
import com.housing.domain.policy.dto.PolicyLibraryResponse;
import com.housing.domain.policy.service.HousingPolicyService;
import com.housing.domain.policy.service.PolicyLibraryService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController @RequestMapping("/api/housing-policies") @RequiredArgsConstructor
public class HousingPolicyController {
    private final HousingPolicyService housingPolicyService;
    private final PolicyLibraryService policyLibraryService;
    @GetMapping public List<HousingPolicyResponse> getOpenPolicies() { return housingPolicyService.getOpenPolicies(); }
    @GetMapping("/library") public PolicyLibraryResponse library() { return policyLibraryService.getLibrary(); }
    @GetMapping("/{policyId}") public HousingPolicyResponse get(@PathVariable Long policyId) { return housingPolicyService.get(policyId); }
}
