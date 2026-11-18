package com.housing.domain.inquiry.service;

import com.housing.domain.inquiry.dto.InquiryCreateRequest;
import com.housing.domain.inquiry.dto.InquiryResponse;
import com.housing.domain.inquiry.entity.InquiryEntity;
import com.housing.domain.inquiry.repository.InquiryRepository;
import com.housing.domain.user.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InquiryService {
    private final InquiryRepository inquiryRepository;
    private final UserRepository userRepository;

    public List<InquiryResponse> getAll(Long userId) {
        return inquiryRepository.findAllByUserIdOrderByCreatedAtDesc(userId).stream().map(InquiryResponse::from).toList();
    }

    @Transactional
    public InquiryResponse create(Long userId, InquiryCreateRequest request) {
        if (!userRepository.existsById(userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다.");
        }
        return InquiryResponse.from(inquiryRepository.save(new InquiryEntity(userId, request.inquiryType(), request.content())));
    }
}
