package com.housing.global.auth;

import tools.jackson.databind.node.ObjectNode;
import com.housing.domain.user.service.EmailVerificationService;
import com.housing.global.storage.LocalStateStore;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class LocalAuthService {

    private static final Duration SESSION_TTL = Duration.ofDays(7);
    private static final String DEMO_NICKNAME = "테스트 사용자";

    private final LocalStateStore localStateStore;
    private final EmailVerificationService emailVerificationService;
    private final PasswordEncoder passwordEncoder;
    private final ConcurrentHashMap<String, Session> sessions = new ConcurrentHashMap<>();

    @Value("${app.local-store.upload-path:./data/uploads}")
    private String uploadPath;

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
        if (!passwordEncoder.matches(password, account.path("passwordHash").asString())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "사용자 ID 또는 비밀번호가 올바르지 않습니다.");
        }
        return createSession(normalizedUserId, account.path("email").asString(), account.path("nickname").asString());
    }

    /**
     * 개발용 소셜 로그인. 실제 OAuth 대신 제공자별 체험 계정({provider}-demo)으로 세션을 발급한다.
     * 비밀번호 로그인은 막기 위해 아무도 모르는 무작위 값의 해시를 저장한다.
     */
    public AuthenticatedUser demoSocialLogin(String provider, String providerLabel) {
        String userId = provider + "-demo";
        if (!localStateStore.hasUser(userId)) {
            localStateStore.updateUserState(userId, state -> {
                ObjectNode account = state.putObject("account");
                account.put("email", userId + "@demo.local");
                account.put("nickname", DEMO_NICKNAME);
                account.put("passwordHash", passwordEncoder.encode(UUID.randomUUID().toString()));
                account.put("provider", provider);
                account.put("providerLabel", providerLabel);
                account.put("createdAt", Instant.now().toString());
                return state;
            });
        } else if (!DEMO_NICKNAME.equals(localStateStore.getUserState(userId).path("account").path("nickname").asString())) {
            // 이전 형식("카카오 체험 사용자")으로 만든 체험 계정도 기본 닉네임으로 맞춘다.
            localStateStore.updateUserState(userId, state -> {
                state.withObject("account").put("nickname", DEMO_NICKNAME);
                return state;
            });
        }
        ObjectNode account = localStateStore.getUserState(userId).withObject("account");
        return createSession(userId, account.path("email").asString(), account.path("nickname").asString());
    }

    public void changePassword(String userId, String currentPassword, String newPassword) {
        ObjectNode account = localStateStore.getUserState(userId).withObject("account");
        if (account.has("provider")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.");
        }
        if (!passwordEncoder.matches(currentPassword, account.path("passwordHash").asString())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "현재 비밀번호가 올바르지 않습니다.");
        }
        String newHash = passwordEncoder.encode(newPassword);
        localStateStore.updateUserState(userId, state -> {
            state.withObject("account").put("passwordHash", newHash);
            return state;
        });
    }

    /** 계정 정보만 남기고 저장된 상태와 업로드 파일을 모두 지운다. 실수 방지를 위해 계정 이메일을 한 번 더 받는다. */
    public void clearUserData(String userId, String confirmEmail) {
        ObjectNode account = localStateStore.getUserState(userId).withObject("account");
        if (confirmEmail == null || !account.path("email").asString().equalsIgnoreCase(confirmEmail.trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "확인 이메일이 계정 이메일과 다릅니다.");
        }
        localStateStore.updateUserState(userId, state -> {
            ObjectNode cleared = state.objectNode();
            cleared.set("account", state.get("account"));
            return cleared;
        });
        deleteUploads(userId);
    }

    private void deleteUploads(String userId) {
        Path directory = Path.of(uploadPath).toAbsolutePath().normalize().resolve(userId);
        if (!Files.isDirectory(directory)) return;
        try (Stream<Path> paths = Files.walk(directory)) {
            for (Path path : paths.sorted(Comparator.reverseOrder()).toList()) {
                Files.deleteIfExists(path);
            }
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "업로드 파일을 삭제하지 못했습니다.");
        }
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
