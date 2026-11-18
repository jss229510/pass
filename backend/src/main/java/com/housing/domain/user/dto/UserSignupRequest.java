package com.housing.domain.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserSignupRequest(
        @Email @NotBlank String email,
        @NotBlank @Size(min = 8, max = 72) String password,
        @NotBlank @Size(max = 50) String nickname,
        @Size(max = 20) String phoneNumber
) {
}
