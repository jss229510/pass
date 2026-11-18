package com.housing.domain.region.controller;

import com.housing.domain.region.dto.RegionResponse;
import com.housing.domain.region.service.RegionService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/regions")
@RequiredArgsConstructor
public class RegionController {

    private final RegionService regionService;

    @GetMapping
    public List<RegionResponse> search(@RequestParam(required = false) String keyword) {
        return regionService.search(keyword);
    }

    @GetMapping("/{regionId}")
    public RegionResponse get(@PathVariable Long regionId) {
        return regionService.get(regionId);
    }
}
