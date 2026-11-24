package com.housing.domain.user.controller;

import com.housing.domain.user.dto.EmailVerificationRequests;
import com.housing.domain.user.service.EmailVerificationService;
import com.housing.global.auth.LocalAuthService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final EmailVerificationService emailVerificationService;
    private final LocalAuthService localAuthService;

    @PostMapping("/email-verifications")
    public ResponseEntity<Void> sendEmailVerificationCode(
            @Valid @RequestBody EmailVerificationRequests.Send request
    ) {
        emailVerificationService.sendCode(request.email());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/email-verifications/confirm")
    public ResponseEntity<Void> confirmEmailVerificationCode(
            @Valid @RequestBody EmailVerificationRequests.Verify request
    ) {
        emailVerificationService.verifyCode(request.email(), request.code());
        return ResponseEntity.noContent().build();
    }

    @PostMapping
    public ResponseEntity<LocalAuthService.AuthenticatedUser> signup(@Valid @RequestBody SignupRequest request) {
        return ResponseEntity.ok(localAuthService.signup(request.userId(), request.email(), request.nickname(), request.password()));
    }

    @PostMapping("/login")
    public LocalAuthService.AuthenticatedUser login(@Valid @RequestBody LoginRequest request) {
        return localAuthService.login(request.userId(), request.password());
    }

    @GetMapping("/me")
    public LocalAuthService.AuthenticatedUser getCurrentUser(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        return localAuthService.requireUser(extractToken(authorization));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        localAuthService.logout(extractToken(authorization));
        return ResponseEntity.noContent().build();
    }

    private String extractToken(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNAUTHORIZED,
                    "로그인 토큰이 필요합니다."
            );
        }
        return authorization.substring(7);
    }

    public record SignupRequest(
            @Email @NotBlank String email,
            @NotBlank @Pattern(regexp = "[a-zA-Z0-9_-]{3,40}") String userId,
            @NotBlank @Size(min = 2, max = 50) String nickname,
            @NotBlank @Size(min = 8, max = 72) String password
    ) {
    }

    public record LoginRequest(
            @NotBlank String userId,
            @NotBlank String password
    ) {
    }
}
