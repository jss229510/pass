package com.housing.domain.favorite.dto;

import java.time.LocalDateTime;

public record FavoriteResponse(Long favoriteId, Long regionId, String regionName, LocalDateTime createdAt) {
}
