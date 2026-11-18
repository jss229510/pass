package com.housing.domain.region.repository;

import com.housing.domain.region.entity.RegionEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RegionRepository extends JpaRepository<RegionEntity, Long> {

    List<RegionEntity> findByDisplayNameContainingIgnoreCaseOrderByDisplayNameAsc(String keyword);
}
