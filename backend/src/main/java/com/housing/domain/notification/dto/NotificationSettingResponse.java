package com.housing.domain.notification.dto;
import com.housing.domain.notification.entity.NotificationSettingEntity;
public record NotificationSettingResponse(boolean policyNoticeEnabled, boolean documentNoticeEnabled, boolean recommendationNoticeEnabled) {
    public static NotificationSettingResponse from(NotificationSettingEntity setting) { return new NotificationSettingResponse("Y".equals(setting.getPolicyNoticeEnabled()), "Y".equals(setting.getDocumentNoticeEnabled()), "Y".equals(setting.getRecommendationNoticeEnabled())); }
}
