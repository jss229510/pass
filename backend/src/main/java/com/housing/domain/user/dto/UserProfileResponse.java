package com.housing.domain.user.dto;

import com.housing.domain.user.entity.UserEntity;
import java.time.LocalDateTime;

public record UserProfileResponse(
        Long id,
        String email,
        String nickname,
        String phoneNumber,
        String role,
        String status,
        LocalDateTime createdAt
) {
    public static UserProfileResponse from(UserEntity user) {
        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getNickname(),
                user.getPhoneNumber(),
                user.getRole(),
                user.getStatus(),
                user.getCreatedAt()
        );
    }
}
