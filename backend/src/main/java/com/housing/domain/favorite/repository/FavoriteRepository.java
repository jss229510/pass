package com.housing.domain.favorite.repository;

import com.housing.domain.favorite.entity.FavoriteEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FavoriteRepository extends JpaRepository<FavoriteEntity, Long> {
    List<FavoriteEntity> findAllByUserIdOrderByCreatedAtDesc(Long userId);
    boolean existsByUserIdAndRegionId(Long userId, Long regionId);
    void deleteByUserIdAndRegionId(Long userId, Long regionId);
}
