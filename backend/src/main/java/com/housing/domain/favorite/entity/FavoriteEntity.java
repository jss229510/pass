package com.housing.domain.favorite.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "FAVORITES")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@SequenceGenerator(name = "favoritesSequence", sequenceName = "FAVORITES_SEQ", allocationSize = 1)
public class FavoriteEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "favoritesSequence")
    @Column(name = "FAVORITE_ID")
    private Long id;

    @Column(name = "USER_ID", nullable = false)
    private Long userId;

    @Column(name = "REGION_ID", nullable = false)
    private Long regionId;

    @Column(name = "CREATED_AT", nullable = false)
    private LocalDateTime createdAt;

    public FavoriteEntity(Long userId, Long regionId) {
        this.userId = userId;
        this.regionId = regionId;
    }

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
