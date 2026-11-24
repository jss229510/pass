package com.housing.domain.user.service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailVerificationService.class);
    private static final Duration CODE_TTL = Duration.ofMinutes(5);
    private final ConcurrentHashMap<String, VerificationCode> codes = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Instant> verifiedEmails = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String senderEmail;

    // 로컬 개발(bootRun)에서만 켜진다. SMTP 설정이 없으면 메일 대신 서버 콘솔에 인증번호를 출력한다.
    @Value("${app.mail.dev-log-code:false}")
    private boolean devLogCode;

    /** @return 실제 메일로 보냈으면 null, 개발 모드면 화면에 채울 인증번호 */
    public String sendCode(String email) {
        boolean logOnly = senderEmail.isBlank() && devLogCode;
        if (senderEmail.isBlank() && !logOnly) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "메일 발송 설정이 완료되지 않았습니다.");
        }

        String normalizedEmail = normalizeEmail(email);
        String code = "%06d".formatted(random.nextInt(1_000_000));
        codes.put(normalizedEmail, new VerificationCode(code, Instant.now().plus(CODE_TTL)));

        if (logOnly) {
            log.warn("[DEV] SMTP 미설정 - 이메일 인증번호 {} ({}, 5분 유효)", code, normalizedEmail);
            return code;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(senderEmail);
        message.setTo(normalizedEmail);
        message.setSubject("[이사온] 이메일 인증번호 안내");
        message.setText("이사온 회원가입 인증번호는 " + code + "입니다.\n5분 안에 입력해 주세요.");
        try {
            mailSender.send(message);
        } catch (MailException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "인증 메일을 보내지 못했습니다. Gmail SMTP 설정을 확인해 주세요."
            );
        }
        return null;
    }

    public void verifyCode(String email, String code) {
        String normalizedEmail = normalizeEmail(email);
        VerificationCode saved = codes.get(normalizedEmail);
        if (saved == null || Instant.now().isAfter(saved.expiresAt())) {
            codes.remove(normalizedEmail);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "인증번호가 없거나 만료되었습니다. 다시 발송해 주세요.");
        }
        if (!saved.code().equals(code)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "인증번호가 일치하지 않습니다.");
        }
        codes.remove(normalizedEmail);
        verifiedEmails.put(normalizedEmail, Instant.now().plus(CODE_TTL));
    }

    public void requireVerified(String email) {
        String normalizedEmail = normalizeEmail(email);
        Instant expiresAt = verifiedEmails.get(normalizedEmail);
        if (expiresAt == null || Instant.now().isAfter(expiresAt)) {
            verifiedEmails.remove(normalizedEmail);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이메일 인증을 먼저 완료해 주세요.");
        }
        verifiedEmails.remove(normalizedEmail);
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private record VerificationCode(String code, Instant expiresAt) {
    }
}
