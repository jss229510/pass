package com.housing.global.community;

import com.housing.global.auth.LocalAuthService;
import com.housing.global.auth.LocalAuthService.AuthenticatedUser;
import com.housing.global.storage.LocalStateStore;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.IntStream;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

/**
 * 커뮤니티 Q&A에 이용자가 남긴 질문과 '도움돼요' 표시를 모든 사용자가 함께 보도록 저장한다.
 * 기본 예시 질문(id 2~8)은 프런트에 있고, 여기에는 새 질문과 표시 기록만 남긴다.
 */
@RestController
@RequestMapping("/api/community/questions")
@RequiredArgsConstructor
public class LocalCommunityController {

    private static final String STORE_KEY = "community";
    private static final Set<String> CATEGORIES = Set.of("지역·매물", "계약·보증", "청년 지원", "이사 준비");
    private static final Set<Integer> SEED_QUESTION_IDS = Set.of(2, 3, 4, 5, 6, 7, 8);
    private static final int FIRST_POST_ID = 101;
    private static final int MAX_TITLE_LENGTH = 80;
    private static final int MAX_BODY_LENGTH = 2000;
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy.MM.dd");
    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");

    private final LocalStateStore localStateStore;
    private final LocalAuthService localAuthService;

    @GetMapping
    public CommunityResponse list(@RequestHeader(value = "Authorization", required = false) String authorization) {
        String userId = optionalUserId(authorization);
        ObjectNode community = localStateStore.getShared(STORE_KEY);
        List<QuestionResponse> questions = new ArrayList<>();
        community.withArray("posts").forEach(post -> questions.add(toResponse(post, community, userId)));
        questions.sort((left, right) -> Integer.compare(right.id(), left.id()));

        Map<String, HelpfulResponse> helpful = new LinkedHashMap<>();
        SEED_QUESTION_IDS.forEach(id -> helpful.put(String.valueOf(id), helpful(community, id, userId)));
        return new CommunityResponse(questions, helpful);
    }

    @PostMapping
    public QuestionResponse create(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody QuestionRequest request
    ) {
        AuthenticatedUser user = requireUser(authorization);
        String category = request.category() == null ? "" : request.category().trim();
        String title = request.title() == null ? "" : request.title().strip();
        String body = request.body() == null ? "" : request.body().strip();
        if (!CATEGORIES.contains(category)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "질문 분류를 확인해 주세요.");
        }
        if (title.isEmpty() || body.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "질문 제목과 내용을 모두 입력해 주세요.");
        }
        if (title.length() > MAX_TITLE_LENGTH || body.length() > MAX_BODY_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "제목은 80자, 내용은 2,000자 이내로 입력해 주세요.");
        }

        return localStateStore.updateShared(STORE_KEY, community -> {
            ArrayNode posts = community.withArray("posts");
            int nextId = FIRST_POST_ID;
            for (JsonNode post : posts) nextId = Math.max(nextId, post.path("id").asInt() + 1);

            ObjectNode post = posts.addObject();
            post.put("id", nextId);
            post.put("category", category);
            post.put("title", title);
            post.put("body", body);
            post.put("authorId", user.userId());
            post.put("author", user.nickname() == null || user.nickname().isBlank() ? "이용자" : user.nickname());
            post.put("date", LocalDate.now(SEOUL).format(DATE_FORMAT));
            post.put("createdAt", Instant.now().toString());
            post.putArray("answers");
            return toResponse(post, community, user.userId());
        });
    }

    @PostMapping("/{id}/helpful")
    public HelpfulResponse toggleHelpful(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable int id
    ) {
        String userId = requireUser(authorization).userId();
        return localStateStore.updateShared(STORE_KEY, community -> {
            if (!SEED_QUESTION_IDS.contains(id) && findPost(community, id) == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "질문을 찾을 수 없습니다.");
            }
            ArrayNode voters = community.withObject("helpful").withArray(String.valueOf(id));
            int existing = IntStream.range(0, voters.size())
                    .filter(index -> userId.equals(voters.get(index).asString()))
                    .findFirst().orElse(-1);
            if (existing >= 0) voters.remove(existing);
            else voters.add(userId);
            return helpful(community, id, userId);
        });
    }

    private QuestionResponse toResponse(JsonNode post, ObjectNode community, String userId) {
        int id = post.path("id").asInt();
        List<AnswerResponse> answers = new ArrayList<>();
        post.path("answers").forEach(answer -> answers.add(new AnswerResponse(
                answer.path("author").asString(""), answer.path("official").asBoolean(false), answer.path("text").asString(""))));
        HelpfulResponse helpful = helpful(community, id, userId);
        return new QuestionResponse(id, post.path("category").asString(""), post.path("title").asString(""),
                post.path("body").asString(""), post.path("author").asString(""), post.path("date").asString(""),
                helpful.count(), helpful.helped(), userId != null && userId.equals(post.path("authorId").asString(null)), answers);
    }

    private HelpfulResponse helpful(ObjectNode community, int id, String userId) {
        JsonNode voters = community.path("helpful").path(String.valueOf(id));
        boolean helped = false;
        for (JsonNode voter : voters) helped |= userId != null && userId.equals(voter.asString());
        return new HelpfulResponse(voters.size(), helped);
    }

    private JsonNode findPost(ObjectNode community, int id) {
        for (JsonNode post : community.withArray("posts")) {
            if (post.path("id").asInt() == id) return post;
        }
        return null;
    }

    private AuthenticatedUser requireUser(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인하면 질문과 도움돼요를 남길 수 있어요.");
        }
        return localAuthService.requireUser(authorization.substring(7));
    }

    /** 목록은 로그인 없이 볼 수 있고, 로그인했으면 내 글·내 표시 여부를 함께 알려 준다. */
    private String optionalUserId(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) return null;
        try {
            return localAuthService.requireUser(authorization.substring(7)).userId();
        } catch (ResponseStatusException expired) {
            return null;
        }
    }

    public record QuestionRequest(String category, String title, String body) { }
    public record AnswerResponse(String author, boolean official, String text) { }
    public record HelpfulResponse(int count, boolean helped) { }
    public record QuestionResponse(int id, String category, String title, String body, String author, String date,
                                   int helpfulCount, boolean helped, boolean mine, List<AnswerResponse> answers) { }
    public record CommunityResponse(List<QuestionResponse> questions, Map<String, HelpfulResponse> helpful) { }
}
