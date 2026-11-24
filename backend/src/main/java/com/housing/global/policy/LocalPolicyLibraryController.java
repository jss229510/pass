package com.housing.global.policy;

import com.housing.domain.policy.dto.PolicyLibraryResponse;
import com.housing.domain.policy.service.PolicyLibraryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/housing-policies")
@RequiredArgsConstructor
public class LocalPolicyLibraryController {

    private final PolicyLibraryService policyLibraryService;

    @GetMapping("/library")
    public PolicyLibraryResponse library() {
        return policyLibraryService.getLibrary();
    }
}
