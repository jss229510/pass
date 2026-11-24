package com.housing.global.storage;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ObjectNode;
import com.housing.global.auth.LocalAuthService;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/my/state")
@RequiredArgsConstructor
public class LocalStateController {

    private static final Set<String> ALLOWED_STATE_KEYS = Set.of(
            "profile",
            "conditions",
            "recentRegions",
            "favorites",
            "comparisons",
            "moveChecklist",
            "savedPolicies",
            "documents",
            "marketRegions",
            "contracts",
            "notifications",
            "journey",
            "inquiries"
    );

    private final LocalStateStore localStateStore;
    private final LocalAuthService localAuthService;

    @GetMapping
    public ObjectNode getAll(@RequestHeader(value = "Authorization", required = false) String authorization) {
        ObjectNode state = localStateStore.getUserState(currentUserId(authorization));
        state.remove("account");
        return state;
    }

    @GetMapping("/{stateKey}")
    public JsonNode get(@RequestHeader(value = "Authorization", required = false) String authorization, @PathVariable String stateKey) {
        ObjectNode state = localStateStore.getUserState(currentUserId(authorization));
        JsonNode value = state.get(requireStateKey(stateKey));
        return value == null ? state.nullNode() : value;
    }

    @PutMapping("/{stateKey}")
    public ResponseEntity<JsonNode> save(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable String stateKey,
            @RequestBody JsonNode value
    ) {
        String key = requireStateKey(stateKey);
        ObjectNode state = localStateStore.updateUserState(currentUserId(authorization), current -> {
            current.set(key, value);
            return current;
        });
        return ResponseEntity.ok(state.get(key));
    }

    private String currentUserId(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인 토큰이 필요합니다.");
        }
        return localAuthService.requireUser(authorization.substring(7)).userId();
    }

    private String requireStateKey(String stateKey) {
        if (!ALLOWED_STATE_KEYS.contains(stateKey)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "저장할 수 없는 상태 항목입니다.");
        }
        return stateKey;
    }
}
