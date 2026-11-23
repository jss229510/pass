package com.housing.domain.policy.service;

import com.housing.domain.policy.dto.PolicyLibraryResponse;
import com.housing.domain.policy.dto.PolicyLibraryResponse.Item;
import com.housing.domain.policy.dto.PolicyLibraryResponse.Source;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
public class PolicyLibraryService {
    private static final Duration CACHE_TTL = Duration.ofMinutes(15);
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    private final ObjectMapper mapper;
    private final String youthKey;
    private final String lhKey;
    private volatile PolicyLibraryResponse cached;
    private volatile Instant expiresAt = Instant.MIN;

    public PolicyLibraryService(ObjectMapper mapper,
            @Value("${policy.youth.api-key:}") String youthKey,
            @Value("${policy.lh.api-key:}") String lhKey) {
        this.mapper = mapper;
        this.youthKey = youthKey.strip();
        this.lhKey = lhKey.strip();
    }

    public synchronized PolicyLibraryResponse getLibrary() {
        if (cached != null && Instant.now().isBefore(expiresAt)) return cached;
        // Independent providers: failure of one must not hide the other's documents.
        var youth = CompletableFuture.supplyAsync(() -> load("youth", "온통청년", youthKey));
        var lh = CompletableFuture.supplyAsync(() -> load("lh", "LH청약플러스", lhKey));
        Snapshot a = youth.join(), b = lh.join();
        List<Item> items = new ArrayList<>(a.items());
        items.addAll(b.items());
        cached = new PolicyLibraryResponse(List.copyOf(items), List.of(a.source(), b.source()));
        expiresAt = Instant.now().plus(a.source().status().equals("ERROR") || b.source().status().equals("ERROR")
                ? Duration.ofMinutes(1) : CACHE_TTL);
        return cached;
    }

    private Snapshot load(String id, String name, String key) {
        if (key.isBlank()) return new Snapshot(List.of(), new Source(id, name, "MISSING_KEY", "API 연결 준비 중", null, 0, false));
        var items = new LinkedHashMap<String, Item>();
        boolean truncated = false;
        try {
            for (int page = 1; page <= 10; page++) {
                JsonNode root = request(id, key, page);
                List<JsonNode> rows;
                if (id.equals("youth")) {
                    String code = PolicyLibraryMapper.text(root, "resultCode");
                    if (!List.of("0", "00", "200").contains(code)) throw new IllegalStateException("Provider rejected request");
                    rows = PolicyLibraryMapper.rows(root, "youthPolicyList");
                } else {
                    List<JsonNode> headers = PolicyLibraryMapper.rows(root, "resHeader");
                    if (headers.isEmpty() || !"Y".equals(PolicyLibraryMapper.text(headers.get(0), "SS_CODE"))) {
                        throw new IllegalStateException("Provider rejected request");
                    }
                    rows = PolicyLibraryMapper.rows(root, "dsList");
                }
                for (JsonNode row : rows) {
                    Item item = id.equals("youth") ? PolicyLibraryMapper.youth(row) : PolicyLibraryMapper.lh(row);
                    if (!item.title().isBlank()) items.putIfAbsent(item.id(), item);
                }
                if (rows.size() < 100) break;
                truncated = page == 10;
            }
            return new Snapshot(List.copyOf(items.values()), new Source(id, name, "CONNECTED", "공식 API 자료", Instant.now(), items.size(), truncated));
        } catch (Exception exception) {
            if (exception instanceof InterruptedException) Thread.currentThread().interrupt();
            // Never return/log upstream exceptions: request URIs contain secret API keys.
            return new Snapshot(List.copyOf(items.values()), new Source(id, name, items.isEmpty() ? "ERROR" : "PARTIAL",
                    items.isEmpty() ? "자료를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요." : "일부 자료만 불러왔습니다.",
                    items.isEmpty() ? null : Instant.now(), items.size(), !items.isEmpty()));
        }
    }

    private JsonNode request(String id, String key, int page) throws Exception {
        UriComponentsBuilder uri;
        if (id.equals("youth")) {
            uri = UriComponentsBuilder.fromUriString("https://www.youthcenter.go.kr/go/ythip/getPlcy")
                    .queryParam("apiKeyNm", "{key}").queryParam("pageNum", page).queryParam("pageSize", 100)
                    .queryParam("rtnType", "json").queryParam("pageType", "1").queryParam("lclsfNm", "주거");
        } else {
            LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
            uri = UriComponentsBuilder.fromUriString("https://apis.data.go.kr/B552555/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1")
                    .queryParam("ServiceKey", "{key}").queryParam("PG_SZ", 100).queryParam("PAGE", page)
                    .queryParam("UPP_AIS_TP_CD", "06")
                    .queryParam("PAN_NT_ST_DT", today.minusYears(1).format(DateTimeFormatter.ofPattern("yyyy.MM.dd")))
                    .queryParam("CLSG_DT", today.plusYears(1).format(DateTimeFormatter.ofPattern("yyyy.MM.dd")));
        }
        URI address = uri.encode().buildAndExpand(key).toUri();
        var request = HttpRequest.newBuilder(address).timeout(Duration.ofSeconds(8)).header("Accept", "application/json").GET().build();
        var response = client.send(request, HttpResponse.BodyHandlers.ofString(java.nio.charset.StandardCharsets.UTF_8));
        if (response.statusCode() != 200) throw new IllegalStateException("Provider unavailable");
        return mapper.readTree(response.body());
    }

    private record Snapshot(List<Item> items, Source source) {}
}
