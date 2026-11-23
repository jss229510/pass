package com.housing.domain.policy.service;

import com.housing.domain.policy.dto.PolicyLibraryResponse.Item;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import tools.jackson.databind.JsonNode;

/** Keeps provider-specific field names out of the UI. Missing dates never imply an open application. */
public final class PolicyLibraryMapper {
    private PolicyLibraryMapper() {}

    public static String text(JsonNode node, String... names) {
        for (String name : names) {
            JsonNode value = node.path(name);
            if (!value.isMissingNode() && !value.isNull() && !value.asText().isBlank()) {
                return value.asText().strip();
            }
        }
        return "";
    }

    public static List<JsonNode> rows(JsonNode root, String field) {
        List<JsonNode> rows = new ArrayList<>();
        collect(root, field, rows);
        return rows;
    }

    private static void collect(JsonNode node, String field, List<JsonNode> rows) {
        if (node.isArray()) {
            node.forEach(child -> collect(child, field, rows));
        } else if (node.isObject()) {
            JsonNode target = node.path(field);
            if (target.isArray()) target.forEach(rows::add);
            else if (target.isObject()) rows.add(target);
            else node.forEach(child -> collect(child, field, rows));
        }
    }

    public static Item youth(JsonNode node) {
        String title = text(node, "plcyNm");
        String middle = text(node, "mclsfNm");
        String period = text(node, "aplyYmd");
        String minimum = text(node, "sprtTrgtMinAge"), maximum = text(node, "sprtTrgtMaxAge");
        String age = !minimum.isBlank() && !maximum.isBlank() && !"0".equals(maximum)
                ? "연령: " + minimum + "~" + maximum + "세 (세부 기준은 원문 확인)" : "";
        String eligibility = String.join("\n", List.of(age, text(node, "earnEtcCn"),
                text(node, "addAplyQlfcCndCn"), text(node, "ptcpPrpTrgtCn"))).strip();
        String organization = text(node, "sprvsnInstCdNm", "operInstCdNm", "rgtrInstCdNm");
        String region = regionFromCodes(text(node, "zipCd"));
        String url = safeUrl(text(node, "refUrlAddr1", "aplyUrlAddr", "refUrlAddr2"));
        if (url.isBlank()) url = "https://www.youthcenter.go.kr/youngPlcyUnif/youngPlcyUnifDtl?plcyNo=" + text(node, "plcyNo");
        // Business dates and application dates have different meanings; do not substitute one for the other.
        String status = periodStatus(period);
        return new Item("youth-" + text(node, "plcyNo"), title, organization, "youth", category(title + " " + middle),
                region, text(node, "plcyExplnCn"), eligibility, text(node, "plcySprtCn"),
                text(node, "plcyAplyMthdCn"), text(node, "sbmsnDcmntCn"), period, status,
                text(node, "frstRegDt"), text(node, "lastMdfcnDt"), url);
    }

    public static Item lh(JsonNode node) {
        String title = text(node, "PAN_NM");
        String status = switch (text(node, "PAN_SS")) {
            case "접수중" -> "접수중";
            case "접수마감" -> "마감";
            default -> "공고 확인";
        };
        String url = safeUrl(text(node, "DTL_URL"));
        return new Item("lh-" + text(node, "PAN_ID") + "-" + text(node, "AIS_TP_CD") + "-" + title,
                title, "한국토지주택공사", "lh", "공공임대", text(node, "CNP_CD_NM"),
                text(node, "AIS_TP_CD_NM", "UPP_AIS_TP_NM"), "입주 자격은 모집공고 원문에서 확인해 주세요.",
                "임대 조건과 공급 주택은 공고별로 다릅니다.", "LH청약플러스 공고 원문 확인", "",
                "", status, text(node, "PAN_NT_ST_DT"), text(node, "PAN_NT_ST_DT"),
                url.isBlank() ? "https://apply.lh.or.kr/" : url);
    }

    public static String category(String value) {
        if (Pattern.compile("이사|중개|복비").matcher(value).find()) return "이사·중개비";
        if (Pattern.compile("보증금|보증료|대출|이자|전세자금").matcher(value).find()) return "전세·금융";
        if (Pattern.compile("임대|행복주택|기숙사|공공주택").matcher(value).find()) return "공공임대";
        if (Pattern.compile("월세|주거급여").matcher(value).find()) return "월세·주거비";
        return "기타 주거지원";
    }

    public static String periodStatus(String value) {
        if (value.strip().equals("상시") || value.strip().equals("상시 신청")) return "상시";
        var dates = Pattern.compile("(?<!\\d)(20\\d{2})[.\\-/]?(\\d{2})[.\\-/]?(\\d{2})(?!\\d)").matcher(value);
        List<LocalDate> parsed = new ArrayList<>();
        while (dates.find()) {
            try { parsed.add(LocalDate.parse(dates.group(1) + dates.group(2) + dates.group(3), DateTimeFormatter.BASIC_ISO_DATE)); }
            catch (DateTimeParseException ignored) { return "공고 확인"; }
        }
        // Multiple rounds cannot safely be reduced to a single continuous application window.
        if (parsed.size() != 2) return "공고 확인";
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        if (parsed.get(1).isBefore(parsed.get(0))) return "공고 확인";
        if (today.isBefore(parsed.get(0))) return "접수예정";
        if (today.isAfter(parsed.get(1))) return "마감";
        return "접수중";
    }

    public static String safeUrl(String value) {
        try {
            var uri = java.net.URI.create(value);
            return ("https".equalsIgnoreCase(uri.getScheme()) || "http".equalsIgnoreCase(uri.getScheme()))
                    && uri.getHost() != null ? value : "";
        } catch (IllegalArgumentException ignored) { return ""; }
    }

    public static String regionFromCodes(String codes) {
        if (codes.isBlank()) return "지역 확인";
        List<String> regions = new ArrayList<>();
        for (String code : codes.split("[,\\s]+")) {
            if (code.length() < 2) continue;
            String name = switch (code.substring(0, 2)) {
                case "11" -> "서울"; case "26" -> "부산"; case "27" -> "대구"; case "28" -> "인천";
                case "29" -> "광주"; case "30" -> "대전"; case "31" -> "울산"; case "36" -> "세종";
                case "41" -> "경기"; case "42", "51" -> "강원"; case "43" -> "충북"; case "44" -> "충남";
                case "45", "52" -> "전북"; case "46" -> "전남"; case "47" -> "경북"; case "48" -> "경남";
                case "50" -> "제주"; default -> "";
            };
            if (!name.isBlank() && !regions.contains(name)) regions.add(name);
        }
        if (regions.size() >= 17) return "전국";
        return regions.isEmpty() ? "지역 확인" : String.join(", ", regions);
    }
}
