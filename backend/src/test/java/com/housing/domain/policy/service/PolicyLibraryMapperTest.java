package com.housing.domain.policy.service;

import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDate;
import java.time.ZoneId;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

class PolicyLibraryMapperTest {
    private final ObjectMapper mapper = new ObjectMapper();

    @Test void youthFieldsKeepApplicationDatesSeparateFromBusinessDates() {
        var item = PolicyLibraryMapper.youth(mapper.readTree("""
            {"plcyNo":"123", "plcyNm":"청년 이사비 지원", "zipCd":"11110,41110",
             "sprvsnInstCdNm":"기관", "plcySprtCn":"지원 내용", "sprtTrgtMinAge":"19",
             "sprtTrgtMaxAge":"39", "bizPrdBgngYmd":"20260101", "bizPrdEndYmd":"20991231",
             "aplyUrlAddr":"javascript:alert(1)"}
            """));
        assertEquals("youth-123", item.id());
        assertEquals("이사·중개비", item.category());
        assertEquals("서울, 경기", item.region());
        assertEquals("", item.period());
        assertEquals("공고 확인", item.status());
        assertTrue(item.eligibility().contains("19~39"));
        assertTrue(item.originalUrl().startsWith("https://www.youthcenter.go.kr/"));
    }

    @Test void applicationStatusUsesKoreanCalendarDatesAndRejectsAmbiguousWindows() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        assertEquals("접수중", PolicyLibraryMapper.periodStatus(today.minusDays(1) + " ~ " + today.plusDays(1)));
        assertEquals("접수중", PolicyLibraryMapper.periodStatus(today + " ~ " + today));
        assertEquals("접수예정", PolicyLibraryMapper.periodStatus(today.plusDays(1) + " ~ " + today.plusDays(2)));
        assertEquals("마감", PolicyLibraryMapper.periodStatus("20200101 ~ 20201231"));
        assertEquals("공고 확인", PolicyLibraryMapper.periodStatus("20260230 ~ 20260301"));
        assertEquals("공고 확인", PolicyLibraryMapper.periodStatus("20260101 ~ 20260201, 20260601 ~ 20260701"));
        assertEquals("공고 확인", PolicyLibraryMapper.periodStatus("20261231 ~ 20260101"));
        assertEquals("공고 확인", PolicyLibraryMapper.periodStatus(""));
        assertEquals("상시", PolicyLibraryMapper.periodStatus("상시"));
    }

    @Test void lhNoticePublicationDateIsNotAnApplicationDate() {
        var item = PolicyLibraryMapper.lh(mapper.readTree("""
            {"PAN_ID":"77", "PAN_NM":"행복주택 공고", "CNP_CD_NM":"경기도",
             "PAN_SS":"공고중", "PAN_NT_ST_DT":"2026.11.23", "AIS_TP_CD_NM":"행복주택",
             "DTL_URL":"https://apply.lh.or.kr/example"}
            """));
        assertEquals("공고 확인", item.status());
        assertEquals("", item.period());
        assertEquals("2026.11.23", item.publishedAt());
        assertEquals("공공임대", item.category());
    }

    @Test void providerCollectionsSupportYouthObjectsAndLhArrayEnvelopes() {
        var youth = mapper.readTree("{\"result\":{\"youthPolicyList\":[{\"plcyNo\":\"1\"}]}}");
        var lh = mapper.readTree("[{\"resHeader\":[{\"SS_CODE\":\"Y\"}]},{\"dsList\":[{\"PAN_ID\":\"2\"}]}]");
        assertEquals(1, PolicyLibraryMapper.rows(youth, "youthPolicyList").size());
        assertEquals(1, PolicyLibraryMapper.rows(lh, "dsList").size());
        assertEquals("Y", PolicyLibraryMapper.text(PolicyLibraryMapper.rows(lh, "resHeader").get(0), "SS_CODE"));
        assertEquals(0, PolicyLibraryMapper.rows(mapper.readTree("{}"), "dsList").size());
    }

    @Test void absentKeysReturnExplicitProviderStatusWithoutNetworkCalls() {
        var service = new PolicyLibraryService(mapper, "", " ");
        var response = service.getLibrary();
        assertTrue(response.items().isEmpty());
        assertEquals(2, response.sources().size());
        assertTrue(response.sources().stream().allMatch(source -> source.status().equals("MISSING_KEY") && source.fetchedAt() == null));
        assertSame(response, service.getLibrary());
    }

    @Test void unsafeUrlsAndUnknownRegionsAreNotPresentedAsValid() {
        assertEquals("", PolicyLibraryMapper.safeUrl("javascript:alert(1)"));
        assertEquals("", PolicyLibraryMapper.safeUrl("//evil.example"));
        assertEquals("", PolicyLibraryMapper.safeUrl("file:///private"));
        assertEquals("지역 확인", PolicyLibraryMapper.regionFromCodes(""));
        assertEquals("강원, 전북", PolicyLibraryMapper.regionFromCodes("51110,52110"));
    }
}
