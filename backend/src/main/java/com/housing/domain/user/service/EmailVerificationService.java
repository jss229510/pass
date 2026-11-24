package com.housing.domain.user.service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;
import lombok.RequiredArgsConstructor;
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

    private static final Duration CODE_TTL = Duration.ofMinutes(5);
    private final ConcurrentHashMap<String, VerificationCode> codes = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Instant> verifiedEmails = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String senderEmail;

    public void sendCode(String email) {
        if (senderEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "메일 발송 설정이 완료되지 않았습니다.");
        }

        String normalizedEmail = normalizeEmail(email);
        String code = "%06d".formatted(random.nextInt(1_000_000));
        codes.put(normalizedEmail, new VerificationCode(code, Instant.now().plus(CODE_TTL)));

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
