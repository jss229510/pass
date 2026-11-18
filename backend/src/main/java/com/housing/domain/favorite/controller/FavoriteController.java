package com.housing.domain.favorite.controller;

import com.housing.domain.favorite.dto.FavoriteResponse;
import com.housing.domain.favorite.service.FavoriteService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/{userId}/favorites")
@RequiredArgsConstructor
public class FavoriteController {
    private final FavoriteService favoriteService;

    @GetMapping
    public List<FavoriteResponse> getAll(@PathVariable Long userId) {
        return favoriteService.getAll(userId);
    }

    @PostMapping
    public ResponseEntity<FavoriteResponse> add(@PathVariable Long userId, @RequestParam Long regionId) {
        return ResponseEntity.ok(favoriteService.add(userId, regionId));
    }

    @DeleteMapping("/{regionId}")
    public ResponseEntity<Void> remove(@PathVariable Long userId, @PathVariable Long regionId) {
        favoriteService.remove(userId, regionId);
        return ResponseEntity.noContent().build();
    }
}
