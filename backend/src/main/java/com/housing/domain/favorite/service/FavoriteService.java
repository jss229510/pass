package com.housing.domain.favorite.service;

import com.housing.domain.favorite.dto.FavoriteResponse;
import com.housing.domain.favorite.entity.FavoriteEntity;
import com.housing.domain.favorite.repository.FavoriteRepository;
import com.housing.domain.region.entity.RegionEntity;
import com.housing.domain.region.repository.RegionRepository;
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
public class FavoriteService {
    private final FavoriteRepository favoriteRepository;
    private final UserRepository userRepository;
    private final RegionRepository regionRepository;

    public List<FavoriteResponse> getAll(Long userId) {
        return favoriteRepository.findAllByUserIdOrderByCreatedAtDesc(userId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public FavoriteResponse add(Long userId, Long regionId) {
        if (!userRepository.existsById(userId)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다.");
        if (favoriteRepository.existsByUserIdAndRegionId(userId, regionId)) throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 관심 지역에 추가되어 있습니다.");
        requireRegion(regionId);
        return toResponse(favoriteRepository.save(new FavoriteEntity(userId, regionId)));
    }

    @Transactional
    public void remove(Long userId, Long regionId) {
        favoriteRepository.deleteByUserIdAndRegionId(userId, regionId);
    }

    private FavoriteResponse toResponse(FavoriteEntity favorite) {
        RegionEntity region = requireRegion(favorite.getRegionId());
        return new FavoriteResponse(favorite.getId(), region.getId(), region.getDisplayName(), favorite.getCreatedAt());
    }

    private RegionEntity requireRegion(Long regionId) {
        return regionRepository.findById(regionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "지역을 찾을 수 없습니다."));
    }
}
