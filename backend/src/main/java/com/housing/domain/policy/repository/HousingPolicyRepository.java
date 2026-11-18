package com.housing.domain.policy.repository;

import com.housing.domain.policy.entity.HousingPolicyEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HousingPolicyRepository extends JpaRepository<HousingPolicyEntity, Long> {
    List<HousingPolicyEntity> findAllByStatusOrderByEndDateAsc(String status);
}
