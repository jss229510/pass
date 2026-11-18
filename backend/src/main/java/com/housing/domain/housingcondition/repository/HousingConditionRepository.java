package com.housing.domain.housingcondition.repository;

import com.housing.domain.housingcondition.entity.HousingConditionEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HousingConditionRepository extends JpaRepository<HousingConditionEntity, Long> {

    List<HousingConditionEntity> findAllByUserIdAndActiveOrderByUpdatedAtDesc(Long userId, String active);

    Optional<HousingConditionEntity> findFirstByUserIdAndActiveOrderByUpdatedAtDesc(Long userId, String active);
}
