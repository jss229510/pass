package com.housing.domain.inquiry.dto;

import com.housing.domain.inquiry.entity.InquiryEntity;
import java.time.LocalDateTime;

public record InquiryResponse(Long id, String inquiryType, String content, String status, String answer, LocalDateTime createdAt) {
    public static InquiryResponse from(InquiryEntity inquiry) {
        return new InquiryResponse(inquiry.getId(), inquiry.getInquiryType(), inquiry.getContent(),
                inquiry.getStatus(), inquiry.getAnswer(), inquiry.getCreatedAt());
    }
}
