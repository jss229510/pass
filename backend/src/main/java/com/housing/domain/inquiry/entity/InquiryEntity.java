package com.housing.domain.inquiry.entity;

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

@Entity @Table(name = "INQUIRIES") @Getter @NoArgsConstructor(access = AccessLevel.PROTECTED)
@SequenceGenerator(name = "inquiriesSequence", sequenceName = "INQUIRIES_SEQ", allocationSize = 1)
public class InquiryEntity {
    @Id @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "inquiriesSequence") @Column(name = "INQUIRY_ID") private Long id;
    @Column(name = "USER_ID") private Long userId;
    @Column(name = "INQUIRY_TYPE", nullable = false, length = 30) private String inquiryType;
    @Column(name = "CONTENT", nullable = false, columnDefinition = "CLOB") private String content;
    @Column(name = "STATUS", nullable = false, length = 20) private String status;
    @Column(name = "ANSWER", columnDefinition = "CLOB") private String answer;
    @Column(name = "ANSWERED_AT") private LocalDateTime answeredAt;
    @Column(name = "CREATED_AT", nullable = false) private LocalDateTime createdAt;
    @Column(name = "UPDATED_AT", nullable = false) private LocalDateTime updatedAt;
    public InquiryEntity(Long userId, String inquiryType, String content) { this.userId = userId; this.inquiryType = inquiryType; this.content = content; this.status = "RECEIVED"; }
    @PrePersist void onCreate() { LocalDateTime now = LocalDateTime.now(); createdAt = now; updatedAt = now; }
    @PreUpdate void onUpdate() { updatedAt = LocalDateTime.now(); }
}
