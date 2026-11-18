package com.housing.domain.notification.controller;
import com.housing.domain.notification.dto.NotificationSettingRequest;
import com.housing.domain.notification.dto.NotificationSettingResponse;
import com.housing.domain.notification.service.NotificationSettingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController @RequestMapping("/api/users/{userId}/notification-settings") @RequiredArgsConstructor
public class NotificationSettingController {
    private final NotificationSettingService notificationSettingService;
    @GetMapping public NotificationSettingResponse get(@PathVariable Long userId) { return notificationSettingService.get(userId); }
    @PutMapping public NotificationSettingResponse update(@PathVariable Long userId, @RequestBody NotificationSettingRequest request) { return notificationSettingService.update(userId, request); }
}
