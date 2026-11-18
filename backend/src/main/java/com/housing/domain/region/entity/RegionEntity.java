package com.housing.domain.region.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "REGIONS")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@SequenceGenerator(name = "regionsSequence", sequenceName = "REGIONS_SEQ", allocationSize = 1)
public class RegionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "regionsSequence")
    @Column(name = "REGION_ID")
    private Long id;

    @Column(name = "SIDO", nullable = false, length = 30)
    private String sido;

    @Column(name = "SIGUNGU", nullable = false, length = 50)
    private String sigungu;

    @Column(name = "DISPLAY_NAME", nullable = false, unique = true, length = 100)
    private String displayName;

    @Column(name = "LATITUDE", precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(name = "LONGITUDE", precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(name = "AVG_RENT")
    private Long averageRent;

    @Column(name = "AVG_MANAGEMENT_FEE")
    private Long averageManagementFee;

    @Column(name = "TRANSPORT_SCORE")
    private Integer transportScore;

    @Column(name = "INFRA_SCORE")
    private Integer infraScore;

    @Column(name = "SAFETY_SCORE")
    private Integer safetyScore;

    @Column(name = "SUPPORT_SCORE")
    private Integer supportScore;

    @Column(name = "CREATED_AT", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "UPDATED_AT", nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    private RegionEntity(String sido, String sigungu, String displayName, BigDecimal latitude, BigDecimal longitude,
                         Long averageRent, Long averageManagementFee, Integer transportScore, Integer infraScore,
                         Integer safetyScore, Integer supportScore) {
        this.sido = sido;
        this.sigungu = sigungu;
        this.displayName = displayName;
        this.latitude = latitude;
        this.longitude = longitude;
        this.averageRent = averageRent;
        this.averageManagementFee = averageManagementFee;
        this.transportScore = transportScore;
        this.infraScore = infraScore;
        this.safetyScore = safetyScore;
        this.supportScore = supportScore;
    }

    @jakarta.persistence.PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @jakarta.persistence.PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
