package com.housing.domain.policy.dto;

import java.time.Instant;
import java.util.List;

public record PolicyLibraryResponse(List<Item> items, List<Source> sources) {
    public record Item(String id, String title, String organization, String source, String category,
                       String region, String description, String eligibility, String benefit,
                       String applicationMethod, String documents, String period, String status,
                       String publishedAt, String updatedAt, String originalUrl) {}
    public record Source(String id, String name, String status, String message, Instant fetchedAt,
                         int count, boolean truncated) {}
}
