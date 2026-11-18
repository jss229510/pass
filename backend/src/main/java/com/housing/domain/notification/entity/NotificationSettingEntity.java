package com.housing.domain.notification.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity @Table(name = "NOTIFICATION_SETTINGS") @Getter @NoArgsConstructor(access = AccessLevel.PROTECTED)
@SequenceGenerator(name = "notificationSettingsSequence", sequenceName = "NOTIFICATION_SETTINGS_SEQ", allocationSize = 1)
public class NotificationSettingEntity {
    @Id @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "notificationSettingsSequence") @Column(name = "NOTIFICATION_SETTING_ID") private Long id;
    @Column(name = "USER_ID", nullable = false, unique = true) private Long userId;
    @Column(name = "POLICY_NOTICE_ENABLED", nullable = false, length = 1) private String policyNoticeEnabled;
    @Column(name = "DOCUMENT_NOTICE_ENABLED", nullable = false, length = 1) private String documentNoticeEnabled;
    @Column(name = "RECOMMENDATION_NOTICE_ENABLED", nullable = false, length = 1) private String recommendationNoticeEnabled;
    @Column(name = "UPDATED_AT", nullable = false) private LocalDateTime updatedAt;

    public NotificationSettingEntity(Long userId) { this.userId = userId; this.policyNoticeEnabled = "Y"; this.documentNoticeEnabled = "Y"; this.recommendationNoticeEnabled = "Y"; }
    public void update(boolean policy, boolean document, boolean recommendation) { policyNoticeEnabled = flag(policy); documentNoticeEnabled = flag(document); recommendationNoticeEnabled = flag(recommendation); }
    private String flag(boolean value) { return value ? "Y" : "N"; }
    @PrePersist @PreUpdate void touch() { updatedAt = LocalDateTime.now(); }
}
