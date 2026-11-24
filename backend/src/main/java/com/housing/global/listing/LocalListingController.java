package com.housing.global.listing;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/listings")
public class LocalListingController {

    private static final List<Template> TEMPLATES = List.of(
            new Template("원룸", 300, 1000, 33, 48, 5, 9, 17, 25),
            new Template("원룸", 500, 1000, 35, 50, 5, 9, 19, 26),
            new Template("1.5룸", 1000, 2000, 45, 60, 6, 10, 26, 33),
            new Template("투룸", 1500, 3000, 55, 75, 7, 12, 33, 46),
            new Template("오피스텔", 1000, 2000, 50, 70, 10, 16, 22, 31)
    );
    private static final List<String> ADJECTIVES = List.of("햇살 좋은", "조용한", "풀옵션", "역세권", "가성비", "깔끔한", "넓은", "채광 좋은");
    private static final List<String> OPTIONS = List.of("풀옵션", "주차 가능", "엘리베이터", "역세권", "반려동물 가능", "남향", "보안 우수", "베란다");

    @GetMapping
    public List<ListingResponse> search(
            @RequestParam String query,
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "") String address,
            @RequestParam(defaultValue = "") String placeName,
            @RequestParam(defaultValue = "8") int count
    ) {
        String normalizedQuery = query.trim();
        if (normalizedQuery.isBlank() || count < 1 || count > 20) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "검색어와 매물 수를 확인해 주세요.");
        }

        String areaLabel = address.isBlank() ? normalizedQuery : address.trim();
        String[] tokens = areaLabel.split("\\s+");
        String dongName = tokens[tokens.length - 1];
        double scale = areaLabel.startsWith("서울") ? 1.55 : areaLabel.startsWith("경기") ? 1.2 : areaLabel.startsWith("인천") ? 1.1 : areaLabel.startsWith("부산") ? 1.05 : 1;
        Random random = new Random((normalizedQuery + "|" + Math.round(lat * 10_000) + "|" + Math.round(lng * 10_000)).hashCode());
        List<ListingResponse> listings = new ArrayList<>();

        for (int index = 0; index < count; index++) {
            Template template = TEMPLATES.get(random.nextInt(TEMPLATES.size()));
            double radius = 120 + random.nextDouble() * 780;
            double angle = random.nextDouble() * Math.PI * 2;
            double listingLat = lat + (radius * Math.cos(angle)) / 111_000;
            double listingLng = lng + (radius * Math.sin(angle)) / (111_000 * Math.cos(Math.toRadians(lat)));
            int builtYear = between(random, 2006, 2025);
            int area = between(random, template.areaMin(), template.areaMax());
            int deposit = Math.max(100, (int) (between(random, template.depositMin(), template.depositMax()) * scale / 100) * 100);
            int rent = (int) Math.round(between(random, template.rentMin(), template.rentMax()) * scale);
            int maintenance = between(random, template.maintenanceMin(), template.maintenanceMax());
            int walkMinutes = Math.max(1, (int) Math.ceil(radius / 67));
            List<String> options = shuffledOptions(random, builtYear);
            int score = Math.max(68, Math.min(97, (int) Math.round(72 + (builtYear - 2006) * .6 + ((double) area / (rent + maintenance)) * 18 - walkMinutes * .4 + random.nextDouble() * 6)));
            listings.add(new ListingResponse(
                    "listing-" + Integer.toUnsignedString((normalizedQuery + index).hashCode(), 36),
                    dongName + " " + ADJECTIVES.get(random.nextInt(ADJECTIVES.size())) + " " + template.roomType(),
                    areaLabel,
                    placeName.isBlank() ? normalizedQuery : placeName.trim(),
                    template.roomType(), deposit, rent, maintenance, area,
                    1 + random.nextInt(9), builtYear, walkMinutes, score, options, listingLat, listingLng
            ));
        }
        return listings;
    }

    private int between(Random random, int min, int max) {
        return min + random.nextInt(max - min + 1);
    }

    private List<String> shuffledOptions(Random random, int builtYear) {
        List<String> shuffled = new ArrayList<>(OPTIONS);
        java.util.Collections.shuffle(shuffled, random);
        List<String> selected = new ArrayList<>(shuffled.subList(0, 2 + random.nextInt(2)));
        if (builtYear >= 2022) selected.add(0, "신축");
        return selected;
    }

    private record Template(String roomType, int depositMin, int depositMax, int rentMin, int rentMax,
                            int maintenanceMin, int maintenanceMax, int areaMin, int areaMax) {
    }

    public record ListingResponse(String id, String title, String location, String searchedFrom, String roomType,
                                  int deposit, int rent, int maintenance, int area, int floor, int builtYear,
                                  int walkMinutes, int score, List<String> options, double lat, double lng) {
    }
}
