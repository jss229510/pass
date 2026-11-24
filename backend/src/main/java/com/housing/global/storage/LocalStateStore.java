package com.housing.global.storage;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Optional;
import java.util.function.UnaryOperator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

@Component
public class LocalStateStore {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.local-store.path:./data/local-state.json}")
    private String storagePath;

    private Path path;
    private ObjectNode root;

    @PostConstruct
    void load() {
        path = Path.of(storagePath).toAbsolutePath().normalize();
        try {
            Files.createDirectories(path.getParent());
            if (Files.notExists(path)) {
                root = objectMapper.createObjectNode();
                root.set("users", objectMapper.createObjectNode());
                persist();
                return;
            }

            JsonNode saved = objectMapper.readTree(path.toFile());
            root = saved instanceof ObjectNode objectNode ? objectNode : objectMapper.createObjectNode();
            if (!(root.get("users") instanceof ObjectNode)) {
                root.set("users", objectMapper.createObjectNode());
            }
        } catch (IOException exception) {
            throw new IllegalStateException("로컬 상태 저장소를 열 수 없습니다.", exception);
        }
    }

    public synchronized ObjectNode getUserState(String userId) {
        return getOrCreateUserState(userId).deepCopy();
    }

    public synchronized boolean hasUser(String userId) {
        return users().has(userId);
    }

    public synchronized Optional<String> findUserIdByEmail(String email) {
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        return users().properties().stream()
                .filter(entry -> entry.getValue().path("account").path("email").asText().equalsIgnoreCase(normalizedEmail))
                .map(entry -> entry.getKey())
                .findFirst();
    }

    public synchronized ObjectNode updateUserState(String userId, UnaryOperator<ObjectNode> updater) {
        ObjectNode updated = updater.apply(getOrCreateUserState(userId));
        if (updated == null) {
            throw new IllegalArgumentException("저장할 사용자 상태가 없습니다.");
        }
        users().set(userId, updated);
        persist();
        return updated.deepCopy();
    }

    /** 커뮤니티처럼 모든 사용자가 함께 보는 데이터를 사용자별 상태와 분리해 저장한다. */
    public synchronized ObjectNode getShared(String key) {
        return getOrCreateShared(key).deepCopy();
    }

    public synchronized <T> T updateShared(String key, java.util.function.Function<ObjectNode, T> updater) {
        ObjectNode current = getOrCreateShared(key);
        T result = updater.apply(current);
        persist();
        return result;
    }

    private ObjectNode getOrCreateShared(String key) {
        ObjectNode shared = root.get("shared") instanceof ObjectNode node ? node : root.putObject("shared");
        return shared.get(key) instanceof ObjectNode node ? node : shared.putObject(key);
    }

    private ObjectNode getOrCreateUserState(String userId) {
        JsonNode existing = users().get(userId);
        if (existing instanceof ObjectNode objectNode) {
            return objectNode;
        }

        ObjectNode created = objectMapper.createObjectNode();
        users().set(userId, created);
        return created;
    }

    private ObjectNode users() {
        return (ObjectNode) root.get("users");
    }

    private void persist() {
        Path temporaryPath = path.resolveSibling(path.getFileName() + ".tmp");
        try {
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(temporaryPath.toFile(), root);
            try {
                Files.move(temporaryPath, path, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
            } catch (IOException ignored) {
                Files.move(temporaryPath, path, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException exception) {
            throw new IllegalStateException("로컬 상태 저장에 실패했습니다.", exception);
        }
    }
}
