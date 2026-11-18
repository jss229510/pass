package com.housing.domain.user.controller;

import com.housing.domain.user.dto.UserProfileResponse;
import com.housing.domain.user.dto.UserSignupRequest;
import com.housing.domain.user.service.UserService;
import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping
    public ResponseEntity<UserProfileResponse> signup(@Valid @RequestBody UserSignupRequest request) {
        UserProfileResponse response = userService.signup(request);
        return ResponseEntity.created(URI.create("/api/users/" + response.id())).body(response);
    }

    @GetMapping("/{userId}")
    public UserProfileResponse getProfile(@PathVariable Long userId) {
        return userService.getProfile(userId);
    }
}
