package com.housing.domain.inquiry.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
public record InquiryCreateRequest(@NotBlank @Size(max = 30) String inquiryType, @NotBlank @Size(max = 5000) String content) { }
