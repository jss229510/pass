package com.housing.domain.inquiry.repository;
import com.housing.domain.inquiry.entity.InquiryEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
public interface InquiryRepository extends JpaRepository<InquiryEntity, Long> { List<InquiryEntity> findAllByUserIdOrderByCreatedAtDesc(Long userId); }
