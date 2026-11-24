package com.housing.global.recommendation;

import java.text.DecimalFormat;
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

    private static final List<BuildingType> BUILDING_TYPES = List.of(
            new BuildingType("아파트", 1.16, 2000, 1.18, List.of(39, 59, 84)),
            new BuildingType("빌라", .90, 1000, .86, List.of(26, 39, 52)),
            new BuildingType("오피스텔", 1, 500, 1, List.of(20, 29, 43)),
            new BuildingType("단독·다가구", .80, 300, .72, List.of(19, 27, 41))
    );
    private static final String NO_PREFERENCE = "상관없음";

    /** 프런트 maruRecommendation.getRecommendations와 같은 규칙으로 계산한다. */
    @PostMapping
    public List<RecommendationResponse> recommend(@RequestBody JsonNode answers) {
        City city = CITIES.get(answers.path(0).path("name").asString(""));
        if (city == null) return List.of();

        JsonNode range = answers.path(1);
        boolean hasRange = range.path("value").isNumber();
        double rangeValue = range.path("value").asDouble(0);
        String rangeUnit = range.path("unit").asString("");
        String mode = answers.path(2).asString("");
        String leaseType = answers.path(4).isString() ? answers.path(4).asString() : "";
        String building = answers.path(5).isString() ? answers.path(5).asString() : "";
        Integer budget = answers.path(7).isNumber() ? answers.path(7).asInt() : null;
        Integer depositCeiling = answers.path(8).isNumber() ? answers.path(8).asInt() : null;
        boolean hasPreference = answers.path(9).isArray();
        List<Integer> preferences = new ArrayList<>();
        answers.path(9).forEach(value -> preferences.add(value.asInt()));

        List<Candidate> candidates = new ArrayList<>();
        for (Area area : city.areas()) {
            double km = distance(city.lat(), city.lng(), area.lat(), area.lng());
            int commute = "자차".equals(mode) ? area.car() : "대중교통".equals(mode) ? area.bus() : Math.min(area.car(), area.bus());
            if (hasRange && ("km".equals(rangeUnit) ? km > rangeValue : commute > rangeValue)) continue;
            candidates.add(new Candidate(area, km, commute));
        }
        candidates.sort(Comparator.comparingInt(Candidate::commute).thenComparingDouble(Candidate::km));

        List<RecommendationResponse> results = new ArrayList<>();
        for (int index = 0; index < candidates.size(); index++) {
            Candidate candidate = candidates.get(index);
            Area area = candidate.area();
            if (leaseType.isBlank()) {
                results.add(new RecommendationResponse(area.name(), List.of(area.lat(), area.lng()), candidate.km(), candidate.commute(),
                        index + 1, null, 0, null, 0, List.of(), area.environment(), 0, 0, List.of(), null));
                continue;
            }
            PriceSample sample = BUILDING_TYPES.stream()
                    .filter(option -> building.isBlank() || NO_PREFERENCE.equals(building) || building.equals(option.name()))
                    .map(option -> priceSample(option, area, leaseType, budget, depositCeiling))
                    .min(Comparator.comparingInt((PriceSample row) -> row.failures().size()).thenComparingInt(PriceSample::price))
                    .orElseThrow();
            double environmentScore = environmentScore(area.environment(), preferences);
            double commuteScore = "분".equals(rangeUnit)
                    ? 100 - candidate.commute() / rangeValue * 50
                    : 100 - candidate.km() / (rangeValue > 0 ? rangeValue : 10) * 50;
            double budgetScore = budget != null && budget > 0 ? 100 - (double) sample.price() / budget * 50 : 50;
            int score = (int) Math.round(environmentScore * .60 + Math.max(0, commuteScore) * .25 + Math.max(0, budgetScore) * .15);
            results.add(new RecommendationResponse(area.name(), List.of(area.lat(), area.lng()), candidate.km(), candidate.commute(),
                    index + 1, sample.building(), sample.price(), sample.rentDeposit(), sample.area(), sample.areas(),
                    area.environment(), environmentScore, score, sample.failures(), null));
        }

        if (leaseType.isBlank()) return results;
        results.sort(Comparator.comparing((RecommendationResponse row) -> !row.failures().isEmpty())
                .thenComparing((left, right) -> hasPreference && left.failures().isEmpty() && right.failures().isEmpty()
                        ? Integer.compare(right.score(), left.score()) : 0)
                .thenComparingInt(RecommendationResponse::commuteRank));
        List<RecommendationResponse> ranked = new ArrayList<>();
        for (int index = 0; index < results.size(); index++) {
            RecommendationResponse row = results.get(index);
            ranked.add(row.withRank(hasPreference && row.failures().isEmpty() ? index + 1 : null));
        }
        return ranked;
    }

    private PriceSample priceSample(BuildingType option, Area area, String leaseType, Integer budget, Integer depositCeiling) {
        boolean jeonse = "전세".equals(leaseType);
        int price = jeonse ? roundHundred(area.jeonse() * option.jeonseFactor()) : (int) Math.round(area.rent() * option.rentFactor());
        Integer rentDeposit = "월세".equals(leaseType) ? option.rentDeposit() : null;
        List<String> failures = new ArrayList<>();
        if (budget != null && price > budget) failures.add(leaseType + " 한도 " + money(price - budget) + " 초과");
        if (depositCeiling != null && rentDeposit != null && rentDeposit > depositCeiling) {
            failures.add("보증금 한도 " + money(rentDeposit - depositCeiling) + " 초과");
        }
        return new PriceSample(option.name(), price, rentDeposit, option.areas().get(1), option.areas(), failures);
    }

    private static String money(int value) {
        DecimalFormat format = new DecimalFormat("#,##0.###");
        return value >= 10000 ? format.format(value / 10000.0) + "억 원" : format.format(value) + "만 원";
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
    private record BuildingType(String name, double rentFactor, int rentDeposit, double jeonseFactor, List<Integer> areas) { }
    private record Candidate(Area area, double km, int commute) { }
    private record PriceSample(String building, int price, Integer rentDeposit, int area, List<Integer> areas, List<String> failures) { }
    public record RecommendationResponse(String name, List<Double> at, double km, int commute, int commuteRank, String building,
                                         int price, Integer rentDeposit, int area, List<Integer> areas, List<Integer> environment,
                                         double environmentScore, int score, List<String> failures, Integer rank) {
        RecommendationResponse withRank(Integer nextRank) {
            return new RecommendationResponse(name, at, km, commute, commuteRank, building, price, rentDeposit, area, areas,
                    environment, environmentScore, score, failures, nextRank);
        }
    }
}
