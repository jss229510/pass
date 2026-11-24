package com.housing.global.recommendation;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;

@RestController
@RequestMapping("/api/recommendations")
public class LocalRecommendationController {

    private static final Map<String, City> CITIES = Map.of(
            "대전", new City(36.3504, 127.3845, List.of(
                    new Area("둔산동", 36.3568, 127.3797, 13, 19, 62, 18500, 95, 64, 79),
                    new Area("월평동", 36.3580, 127.3558, 13, 24, 49, 14200, 83, 80, 90),
                    new Area("노은동", 36.3713, 127.3198, 20, 30, 43, 12500, 73, 86, 96),
                    new Area("관저동", 36.2999, 127.3375, 23, 42, 39, 10600, 75, 92, 83)
            )),
            "부산", new City(35.1692, 129.1287, List.of(
                    new Area("우동", 35.1638, 129.1460, 11, 18, 64, 18600, 95, 70, 88),
                    new Area("재송동", 35.1851, 129.1241, 14, 23, 48, 13200, 78, 82, 85),
                    new Area("광안동", 35.1587, 129.1117, 17, 26, 53, 15300, 89, 70, 84),
                    new Area("연산동", 35.1859, 129.0821, 24, 38, 41, 11000, 83, 88, 73)
            )),
            "전주", new City(35.8466, 127.1337, List.of(
                    new Area("금암동", 35.8422, 127.1384, 9, 16, 39, 11400, 87, 74, 68),
                    new Area("덕진동", 35.8532, 127.1217, 12, 22, 36, 10800, 74, 85, 96),
                    new Area("서신동", 35.8296, 127.1140, 15, 29, 45, 13200, 92, 77, 82),
                    new Area("효자동", 35.8108, 127.1125, 24, 40, 49, 14500, 94, 90, 88)
            )),
            "청주", new City(36.6201, 127.3271, List.of(
                    new Area("오송읍", 36.6259, 127.3303, 9, 15, 47, 12300, 80, 85, 91),
                    new Area("강내면", 36.6158, 127.3605, 14, 23, 35, 9800, 66, 91, 95),
                    new Area("가경동", 36.6216, 127.4359, 23, 34, 49, 14300, 92, 74, 77),
                    new Area("복대동", 36.6383, 127.4335, 26, 42, 53, 15400, 94, 70, 82)
            ))
    );

    @PostMapping
    public List<RecommendationResponse> recommend(@RequestBody JsonNode answers) {
        JsonNode cityAnswer = answers.path(0);
        City city = CITIES.get(cityAnswer.path("name").asText());
        if (city == null) return List.of();

        JsonNode range = answers.path(1);
        double rangeValue = range.path("value").asDouble(0);
        String rangeUnit = range.path("unit").asText();
        String mode = answers.path(2).asText("대중교통");
        String leaseType = answers.path(4).asText();
        String building = answers.path(5).asText();
        double budget = answers.path(7).asDouble(0);
        double depositCeiling = answers.path(8).asDouble(-1);
        List<Integer> preferences = new ArrayList<>();
        answers.path(9).forEach(value -> preferences.add(value.asInt()));

        if (leaseType.isBlank()) return city.areas().stream().map(area -> baseResponse(city, area, mode)).toList();
        BuildingFactor factor = buildingFactor(building);
        List<RecommendationResponse> results = new ArrayList<>();
        for (Area area : city.areas()) {
            double km = distance(city.lat(), city.lng(), area.lat(), area.lng());
            int commute = "자차".equals(mode) ? area.car() : "대중교통".equals(mode) ? area.bus() : Math.min(area.car(), area.bus());
            if (rangeValue > 0 && ("km".equals(rangeUnit) ? km > rangeValue : commute > rangeValue)) continue;
            int price = "전세".equals(leaseType) ? roundHundred(area.jeonse() * factor.jeonseFactor()) : (int) Math.round(area.rent() * factor.rentFactor());
            Integer rentDeposit = "월세".equals(leaseType) ? factor.rentDeposit() : null;
            List<String> failures = new ArrayList<>();
            if (budget > 0 && price > budget) failures.add("예산 한도 초과");
            if (rentDeposit != null && depositCeiling >= 0 && rentDeposit > depositCeiling) failures.add("보증금 한도 초과");
            double environmentScore = environmentScore(area.environment(), preferences);
            double commuteScore = "분".equals(rangeUnit) && rangeValue > 0 ? 100 - commute / rangeValue * 50 : 100 - km / (rangeValue > 0 ? rangeValue : 10) * 50;
            double budgetScore = budget > 0 ? 100 - ((double) price / budget) * 50 : 50;
            int score = (int) Math.round(environmentScore * .60 + Math.max(0, commuteScore) * .25 + Math.max(0, budgetScore) * .15);
            results.add(new RecommendationResponse(area.name(), List.of(area.lat(), area.lng()), km, commute, price, rentDeposit,
                    factor.area(), factor.areas(), area.environment(), environmentScore, score, failures, 0, null));
        }
        results.sort(Comparator.comparing((RecommendationResponse row) -> !row.failures().isEmpty())
                .thenComparing(RecommendationResponse::score, Comparator.reverseOrder())
                .thenComparing(RecommendationResponse::commute));
        List<RecommendationResponse> ranked = new ArrayList<>();
        int rank = 1;
        for (int index = 0; index < results.size(); index++) {
            RecommendationResponse row = results.get(index);
            Integer rowRank = !preferences.isEmpty() && row.failures().isEmpty() ? rank++ : null;
            ranked.add(new RecommendationResponse(row.name(), row.at(), row.km(), row.commute(), row.price(), row.rentDeposit(),
                    row.area(), row.areas(), row.environment(), row.environmentScore(), row.score(), row.failures(), index + 1, rowRank));
        }
        return ranked;
    }

    private RecommendationResponse baseResponse(City city, Area area, String mode) {
        int commute = "자차".equals(mode) ? area.car() : area.bus();
        return new RecommendationResponse(area.name(), List.of(area.lat(), area.lng()), distance(city.lat(), city.lng(), area.lat(), area.lng()),
                commute, 0, null, 0, List.of(), area.environment(), 0, 0, List.of(), 0, null);
    }

    private BuildingFactor buildingFactor(String building) {
        return switch (building) {
            case "아파트" -> new BuildingFactor(1.16, 1.18, 2000, 59, List.of(39, 59, 84));
            case "빌라" -> new BuildingFactor(.90, .86, 1000, 39, List.of(26, 39, 52));
            case "단독·다가구" -> new BuildingFactor(.80, .72, 300, 27, List.of(19, 27, 41));
            default -> new BuildingFactor(1, 1, 500, 29, List.of(20, 29, 43));
        };
    }

    private int roundHundred(double value) { return (int) Math.round(value / 100) * 100; }
    private double environmentScore(List<Integer> values, List<Integer> preferences) {
        if (preferences.isEmpty()) return values.stream().mapToInt(Integer::intValue).average().orElse(0);
        double sum = 0;
        for (int index = 0; index < values.size(); index++) sum += values.get(index) * (preferences.contains(index) ? 3 : 1);
        return sum / (3 + 2 * preferences.size());
    }
    private double distance(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1), dLng = Math.toRadians(lng2 - lng1);
        double h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 12742 * Math.asin(Math.min(1, Math.sqrt(h)));
    }

    private record City(double lat, double lng, List<Area> areas) { }
    private record Area(String name, double lat, double lng, int car, int bus, int rent, int jeonse, int amenity, int quiet, int park) {
        List<Integer> environment() { return List.of(amenity, quiet, park); }
    }
    private record BuildingFactor(double rentFactor, double jeonseFactor, int rentDeposit, int area, List<Integer> areas) { }
    public record RecommendationResponse(String name, List<Double> at, double km, int commute, int price, Integer rentDeposit,
                                         int area, List<Integer> areas, List<Integer> environment, double environmentScore,
                                         int score, List<String> failures, int commuteRank, Integer rank) { }
}
