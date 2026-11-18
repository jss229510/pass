package com.housing.domain.inquiry.controller;

import com.housing.domain.inquiry.dto.InquiryCreateRequest;
import com.housing.domain.inquiry.dto.InquiryResponse;
import com.housing.domain.inquiry.service.InquiryService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/{userId}/inquiries")
@RequiredArgsConstructor
public class InquiryController {
    private final InquiryService inquiryService;

    @GetMapping
    public List<InquiryResponse> getAll(@PathVariable Long userId) {
        return inquiryService.getAll(userId);
    }

    @PostMapping
    public ResponseEntity<InquiryResponse> create(@PathVariable Long userId, @Valid @RequestBody InquiryCreateRequest request) {
        return ResponseEntity.ok(inquiryService.create(userId, request));
    }
}
