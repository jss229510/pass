package com.housing.global.storage;

import com.housing.global.auth.LocalAuthService;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

/**
 * 계약 문서 원본 파일을 사용자별로 서버 로컬 디스크에 저장한다.
 * 파일명은 서버가 만든 UUID와 실제 내용으로 판별한 확장자만 사용한다.
 */
@RestController
@RequestMapping("/api/my/contract-files")
@RequiredArgsConstructor
public class LocalContractFileController {

    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024;
    private static final String FILE_ID_PATTERN = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(pdf|jpg|png)";

    private final LocalAuthService localAuthService;

    @Value("${app.local-store.upload-path:./data/uploads}")
    private String uploadPath;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UploadedFile upload(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam("file") MultipartFile file
    ) {
        String userId = currentUserId(authorization);
        if (file.isEmpty() || file.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "10MB 이하의 파일만 올릴 수 있습니다.");
        }

        String extension = detectExtension(file);
        String fileId = UUID.randomUUID() + "." + extension;
        Path target = userDirectory(userId).resolve(fileId);
        try (InputStream input = file.getInputStream()) {
            Files.createDirectories(target.getParent());
            Files.copy(input, target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "파일을 저장하지 못했습니다.");
        }
        return new UploadedFile(fileId, originalName(file), mediaType(extension).toString(), file.getSize());
    }

    @GetMapping("/{fileId}")
    public ResponseEntity<Resource> download(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable String fileId
    ) {
        Path file = requireFile(currentUserId(authorization), fileId);
        String extension = fileId.substring(fileId.lastIndexOf('.') + 1);
        return ResponseEntity.ok()
                .contentType(mediaType(extension))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline().filename(fileId).build().toString())
                .header("X-Content-Type-Options", "nosniff")
                .body(new FileSystemResource(file));
    }

    @DeleteMapping("/{fileId}")
    public ResponseEntity<Void> delete(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable String fileId
    ) {
        Path file = requireFile(currentUserId(authorization), fileId);
        try {
            Files.deleteIfExists(file);
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "파일을 삭제하지 못했습니다.");
        }
        return ResponseEntity.noContent().build();
    }

    private Path requireFile(String userId, String fileId) {
        if (!fileId.matches(FILE_ID_PATTERN)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "잘못된 파일 ID입니다.");
        }
        Path file = userDirectory(userId).resolve(fileId);
        if (!Files.isRegularFile(file)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "파일을 찾을 수 없습니다.");
        }
        return file;
    }

    private Path userDirectory(String userId) {
        // 사용자 ID는 로그인 시 [a-z0-9_-]로 검증된 값이라 경로 구분자를 포함하지 않는다.
        return Path.of(uploadPath).toAbsolutePath().normalize().resolve(userId);
    }

    private String detectExtension(MultipartFile file) {
        byte[] head;
        try (InputStream input = file.getInputStream()) {
            head = input.readNBytes(8);
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "파일을 읽지 못했습니다.");
        }
        if (startsWith(head, 0x25, 0x50, 0x44, 0x46)) return "pdf";
        if (startsWith(head, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)) return "png";
        if (startsWith(head, 0xFF, 0xD8, 0xFF)) return "jpg";
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PDF, JPG, PNG 파일만 올릴 수 있습니다.");
    }

    private static boolean startsWith(byte[] head, int... signature) {
        if (head.length < signature.length) return false;
        for (int i = 0; i < signature.length; i++) {
            if ((head[i] & 0xFF) != signature[i]) return false;
        }
        return true;
    }

    private static MediaType mediaType(String extension) {
        return switch (extension) {
            case "pdf" -> MediaType.APPLICATION_PDF;
            case "png" -> MediaType.IMAGE_PNG;
            default -> MediaType.IMAGE_JPEG;
        };
    }

    private static String originalName(MultipartFile file) {
        String name = file.getOriginalFilename();
        if (name == null || name.isBlank()) return "계약서";
        String baseName = Arrays.stream(name.split("[\\\\/]")).reduce((first, second) -> second).orElse(name);
        return baseName.length() > 120 ? baseName.substring(0, 120) : baseName;
    }

    private String currentUserId(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인 토큰이 필요합니다.");
        }
        return localAuthService.requireUser(authorization.substring(7)).userId();
    }

    public record UploadedFile(String fileId, String originalName, String contentType, long size) {
    }
}
