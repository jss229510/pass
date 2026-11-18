package com.housing.domain.region.service;

import com.housing.domain.region.dto.RegionResponse;
import com.housing.domain.region.entity.RegionEntity;
import com.housing.domain.region.repository.RegionRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RegionService {

    private final RegionRepository regionRepository;

    public List<RegionResponse> search(String keyword) {
        List<RegionEntity> regions = keyword == null || keyword.isBlank()
                ? regionRepository.findAll()
                : regionRepository.findByDisplayNameContainingIgnoreCaseOrderByDisplayNameAsc(keyword.trim());
        return regions.stream().map(RegionResponse::from).toList();
    }

    public RegionResponse get(Long regionId) {
        RegionEntity region = regionRepository.findById(regionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "지역을 찾을 수 없습니다."));
        return RegionResponse.from(region);
    }
}
