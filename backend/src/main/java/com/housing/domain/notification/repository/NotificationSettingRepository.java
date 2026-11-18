package com.housing.domain.notification.repository;
import com.housing.domain.notification.entity.NotificationSettingEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
public interface NotificationSettingRepository extends JpaRepository<NotificationSettingEntity, Long> { Optional<NotificationSettingEntity> findByUserId(Long userId); }
