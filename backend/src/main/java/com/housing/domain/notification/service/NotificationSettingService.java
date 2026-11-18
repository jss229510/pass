package com.housing.domain.notification.service;
import com.housing.domain.notification.dto.NotificationSettingRequest;
import com.housing.domain.notification.dto.NotificationSettingResponse;
import com.housing.domain.notification.entity.NotificationSettingEntity;
import com.housing.domain.notification.repository.NotificationSettingRepository;
import com.housing.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service @RequiredArgsConstructor @Transactional(readOnly = true)
public class NotificationSettingService {
    private final NotificationSettingRepository notificationSettingRepository;
    private final UserRepository userRepository;
    public NotificationSettingResponse get(Long userId) { return NotificationSettingResponse.from(notificationSettingRepository.findByUserId(userId).orElseGet(() -> notificationSettingRepository.save(new NotificationSettingEntity(userId)))); }
    @Transactional public NotificationSettingResponse update(Long userId, NotificationSettingRequest request) {
        if (!userRepository.existsById(userId)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다.");
        NotificationSettingEntity setting = notificationSettingRepository.findByUserId(userId).orElseGet(() -> new NotificationSettingEntity(userId));
        setting.update(request.policyNoticeEnabled(), request.documentNoticeEnabled(), request.recommendationNoticeEnabled());
        return NotificationSettingResponse.from(notificationSettingRepository.save(setting));
    }
}
