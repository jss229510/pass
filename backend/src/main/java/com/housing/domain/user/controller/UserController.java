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

    private static final java.util.Map<String, String> DEMO_SOCIAL_PROVIDERS = java.util.Map.of(
            "google", "Google", "naver", "네이버", "kakao", "카카오", "github", "GitHub"
    );

    private final EmailVerificationService emailVerificationService;
    private final LocalAuthService localAuthService;

    @org.springframework.beans.factory.annotation.Value("${app.auth.demo-social:false}")
    private boolean demoSocialEnabled;

    @PostMapping("/email-verifications")
    public java.util.Map<String, String> sendEmailVerificationCode(
            @Valid @RequestBody EmailVerificationRequests.Send request
    ) {
        String devCode = emailVerificationService.sendCode(request.email());
        return devCode == null
                ? java.util.Map.of("delivery", "email")
                : java.util.Map.of("delivery", "server-log", "devCode", devCode);
    }

    /** 개발 모드(bootRun)에서만 열리는 체험용 소셜 로그인. 배포 환경에서는 404. */
    @PostMapping("/demo-social")
    public LocalAuthService.AuthenticatedUser demoSocialLogin(@Valid @RequestBody DemoSocialRequest request) {
        if (!demoSocialEnabled) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND);
        }
        String label = DEMO_SOCIAL_PROVIDERS.get(request.provider());
        if (label == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "지원하지 않는 소셜 로그인입니다.");
        }
        return localAuthService.demoSocialLogin(request.provider(), label);
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

    @PostMapping("/me/password")
    public ResponseEntity<Void> changePassword(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        String userId = localAuthService.requireUser(extractToken(authorization)).userId();
        localAuthService.changePassword(userId, request.currentPassword(), request.newPassword());
        return ResponseEntity.noContent().build();
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/me/data")
    public ResponseEntity<Void> clearMyData(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody ClearDataRequest request
    ) {
        String userId = localAuthService.requireUser(extractToken(authorization)).userId();
        localAuthService.clearUserData(userId, request.confirmEmail());
        return ResponseEntity.noContent().build();
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

    public record DemoSocialRequest(@NotBlank String provider) {
    }

    public record ChangePasswordRequest(
            @NotBlank String currentPassword,
            @NotBlank @Size(min = 8, max = 72) String newPassword
    ) {
    }

    public record ClearDataRequest(@NotBlank String confirmEmail) {
    }

    public record LoginRequest(
            @NotBlank String userId,
            @NotBlank String password
    ) {
    }
}
