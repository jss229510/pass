package com.housing.domain.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public final class EmailVerificationRequests {

    private EmailVerificationRequests() {
    }

    public record Send(@Email @NotBlank String email) {
    }

    public record Verify(
            @Email @NotBlank String email,
            @NotBlank @Pattern(regexp = "\\d{6}", message = "인증번호는 6자리 숫자여야 합니다.") String code
    ) {
    }
}
