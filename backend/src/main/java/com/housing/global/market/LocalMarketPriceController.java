package com.housing.global.market;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * 지역별 원룸·1.5룸·투룸 월세/전세 중위값 샘플 시세.
 * 실거래가 API 연동 전까지 홈 화면 시세 카드에 사용한다. 단위는 만원.
 */
@RestController
@RequestMapping("/api/market-prices")
public class LocalMarketPriceController {

    private static final String BASE_MONTH = "2026.10";
    private static final List<String> ROOM_TYPES = List.of("원룸", "1.5룸", "투룸");
    private static final List<String> DEAL_TYPES = List.of("월세", "전세");

    private static final List<Region> REGIONS = List.of(
            new Region("daejeon-yuseong", "대전", "유성구", null, new Source(600, 37, -2.6, 60), new Source(9800, 0, -1.4, 22)),
            new Region("seoul-gwanak-sillim", "서울", "관악구", "신림동", new Source(900, 55, 3.8, 44), new Source(15500, 0, 1.9, 18)),
            new Region("seoul-mapo", "서울", "마포구", null, new Source(1200, 69, 6.2, 84), new Source(21000, 0, 3.1, 31)),
            new Region("gyeonggi-suwon-yeongtong", "경기", "수원시 영통구", null, new Source(800, 48, 2.1, 65), new Source(13500, 0, 0.8, 27)),
            new Region("gwangju-buk", "광주", "북구", null, new Source(500, 38, 1.2, 52), new Source(8200, 0, -0.6, 19)),
            new Region("chungnam-asan", "충남", "아산시", null, new Source(500, 35, -1.1, 41), new Source(7600, 0, -2.2, 16)),
            new Region("seoul-gangnam", "서울", "강남구", null, new Source(1500, 85, 4.4, 96), new Source(26000, 0, 2.7, 38)),
            new Region("seoul-seongdong", "서울", "성동구", null, new Source(1200, 72, 5.1, 47), new Source(22000, 0, 3.4, 20)),
            new Region("seoul-dongjak", "서울", "동작구", null, new Source(1000, 58, 2.9, 58), new Source(17000, 0, 1.5, 24)),
            new Region("daejeon-seo", "대전", "서구", null, new Source(500, 36, -0.8, 49), new Source(9000, 0, -1.0, 21)),
            new Region("gyeonggi-seongnam-bundang", "경기", "성남시 분당구", null, new Source(1000, 60, 3.3, 55), new Source(18500, 0, 2.0, 26)),
            new Region("incheon-yeonsu", "인천", "연수구", null, new Source(700, 45, 1.7, 38), new Source(12000, 0, 0.4, 17)),
            new Region("busan-haeundae", "부산", "해운대구", null, new Source(700, 46, 0.9, 43), new Source(11500, 0, -0.3, 15)),
            new Region("daegu-suseong", "대구", "수성구", null, new Source(600, 42, -1.9, 36), new Source(10500, 0, -2.8, 14))
    );

    private static final List<String> DEFAULT_REGION_IDS = List.of(
            "daejeon-yuseong", "seoul-gwanak-sillim", "seoul-mapo", "gyeonggi-suwon-yeongtong", "gwangju-buk", "chungnam-asan"
    );

    private static final Map<String, Scale> ROOM_TYPE_SCALES = Map.of(
            "원룸", new Scale(1, 1, 0, 1),
            "1.5룸", new Scale(1.4, 1.28, -0.4, 0.55),
            "투룸", new Scale(2, 1.62, -0.9, 0.4)
    );

    @GetMapping
    public MarketPriceResponse getMarketPrices(
            @RequestParam(defaultValue = "원룸") String roomType,
            @RequestParam(defaultValue = "월세") String dealType
    ) {
        if (!ROOM_TYPES.contains(roomType) || !DEAL_TYPES.contains(dealType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "방 구조와 거래 유형을 확인해 주세요.");
        }

        List<RegionPrice> regions = REGIONS.stream()
                .map(region -> new RegionPrice(
                        region.id(), region.sido(), region.sigungu(), region.dong(),
                        joinParts(region, " "), joinParts(region, " > "),
                        snapshot(region, roomType, dealType)
                ))
                .toList();
        return new MarketPriceResponse(BASE_MONTH, roomType, dealType, ROOM_TYPES, DEAL_TYPES, DEFAULT_REGION_IDS, regions);
    }

    private Snapshot snapshot(Region region, String roomType, String dealType) {
        Scale scale = ROOM_TYPE_SCALES.get(roomType);
        boolean jeonse = "전세".equals(dealType);
        Source source = jeonse ? region.jeonse() : region.monthly();
        double change = Math.round((source.change() + scale.change()) * 10) / 10.0;
        int samples = (int) Math.max(3, Math.round(source.samples() * scale.samples()));
        String seedText = region.id() + "-" + roomType + "-" + dealType;

        if (jeonse) {
            int deposit = roundTo(source.deposit() * scale.deposit(), 100);
            return new Snapshot(deposit, null, change, samples, yearSeries(deposit, change, seedText));
        }
        int deposit = roundTo(source.deposit() * scale.deposit(), 50);
        int rent = (int) Math.round(source.rent() * scale.rent());
        return new Snapshot(deposit, rent, change, samples, yearSeries(rent, change, seedText));
    }

    /** 1년 전 값에서 현재 값까지 12개월 추이를 만들되, 중간 달에는 약간의 등락을 섞는다. */
    private List<Double> yearSeries(double endValue, double changePct, String seedText) {
        SeededRandom random = new SeededRandom(seedText);
        double startValue = endValue / (1 + changePct / 100);
        double amplitude = Math.abs(endValue - startValue) * 0.35 + endValue * 0.006;
        List<Double> series = new ArrayList<>(12);
        for (int index = 0; index < 12; index++) {
            double base = startValue + ((endValue - startValue) * index) / 11;
            series.add(index == 0 || index == 11 ? base : base + (random.next() - 0.5) * 2 * amplitude);
        }
        return series;
    }

    private static int roundTo(double value, int unit) {
        return (int) Math.max(unit, Math.round(value / unit) * unit);
    }

    private static String joinParts(Region region, String separator) {
        return Stream.of(region.sido(), region.sigungu(), region.dong())
                .filter(part -> part != null && !part.isBlank())
                .collect(Collectors.joining(separator));
    }

    /** 프런트에서 쓰던 32비트 LCG와 같은 수열을 만든다. */
    private static final class SeededRandom {
        private long seed;

        SeededRandom(String seedText) {
            for (int i = 0; i < seedText.length(); i++) {
                seed = (seed * 31 + seedText.charAt(i)) & 0xFFFFFFFFL;
            }
        }

        double next() {
            seed = (seed * 1664525 + 1013904223) & 0xFFFFFFFFL;
            return seed / 4294967296.0;
        }
    }

    private record Source(int deposit, int rent, double change, int samples) {
    }

    private record Region(String id, String sido, String sigungu, String dong, Source monthly, Source jeonse) {
    }

    private record Scale(double deposit, double rent, double change, double samples) {
    }

    public record Snapshot(int deposit, Integer rent, double change, int samples, List<Double> series) {
    }

    public record RegionPrice(String id, String sido, String sigungu, String dong, String label, String path,
                              Snapshot snapshot) {
    }

    public record MarketPriceResponse(String baseMonth, String roomType, String dealType, List<String> roomTypes,
                                      List<String> dealTypes, List<String> defaultRegionIds,
                                      List<RegionPrice> regions) {
    }
}
