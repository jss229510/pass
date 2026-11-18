package com.housing.domain.notification.dto;
public record NotificationSettingRequest(boolean policyNoticeEnabled, boolean documentNoticeEnabled, boolean recommendationNoticeEnabled) { }
