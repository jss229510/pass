package com.housing.global.auth;

import tools.jackson.databind.node.ObjectNode;
import com.housing.domain.user.service.EmailVerificationService;
import com.housing.global.storage.LocalStateStore;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class LocalAuthService {

    private static final Duration SESSION_TTL = Duration.ofDays(7);

    private final LocalStateStore localStateStore;
    private final EmailVerificationService emailVerificationService;
    private final PasswordEncoder passwordEncoder;
    private final ConcurrentHashMap<String, Session> sessions = new ConcurrentHashMap<>();

    public AuthenticatedUser signup(String userId, String email, String nickname, String password) {
        String normalizedUserId = normalizeUserId(userId);
        String normalizedEmail = normalizeEmail(email);
        if (localStateStore.hasUser(normalizedUserId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 사용 중인 사용자 ID입니다.");
        }
        if (localStateStore.findUserIdByEmail(normalizedEmail).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다.");
        }

        emailVerificationService.requireVerified(normalizedEmail);
        localStateStore.updateUserState(normalizedUserId, state -> {
            ObjectNode account = state.putObject("account");
            account.put("email", normalizedEmail);
            account.put("nickname", nickname.trim());
            account.put("passwordHash", passwordEncoder.encode(password));
            account.put("createdAt", Instant.now().toString());
            return state;
        });
        return createSession(normalizedUserId, normalizedEmail, nickname.trim());
    }

    public AuthenticatedUser login(String userId, String password) {
        String normalizedUserId = normalizeUserId(userId);
        if (!localStateStore.hasUser(normalizedUserId)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "사용자 ID 또는 비밀번호가 올바르지 않습니다.");
        }

        ObjectNode account = localStateStore.getUserState(normalizedUserId).withObject("account");
        if (!passwordEncoder.matches(password, account.path("passwordHash").asText())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "사용자 ID 또는 비밀번호가 올바르지 않습니다.");
        }
        return createSession(normalizedUserId, account.path("email").asText(), account.path("nickname").asText());
    }

    public AuthenticatedUser requireUser(String token) {
        Session session = sessions.get(token);
        if (session == null || Instant.now().isAfter(session.expiresAt())) {
            sessions.remove(token);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 만료되었습니다. 다시 로그인해 주세요.");
        }
        return new AuthenticatedUser(session.userId(), session.email(), session.nickname(), token);
    }

    public void logout(String token) {
        sessions.remove(token);
    }

    private AuthenticatedUser createSession(String userId, String email, String nickname) {
        String token = UUID.randomUUID().toString();
        sessions.put(token, new Session(userId, email, nickname, Instant.now().plus(SESSION_TTL)));
        return new AuthenticatedUser(userId, email, nickname, token);
    }

    private String normalizeUserId(String userId) {
        String normalized = userId.trim().toLowerCase(Locale.ROOT);
        if (!normalized.matches("[a-z0-9_-]{3,40}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "사용자 ID는 영문, 숫자, 밑줄, 하이픈 3~40자여야 합니다.");
        }
        return normalized;
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    public record AuthenticatedUser(String userId, String email, String nickname, String token) {
    }

    private record Session(String userId, String email, String nickname, Instant expiresAt) {
    }
}
