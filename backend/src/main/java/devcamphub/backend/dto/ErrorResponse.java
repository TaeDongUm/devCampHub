package devcamphub.backend.dto;

import java.time.LocalDateTime;

/**
 * API 에러 발생 시 클라이언트에게 반환할 표준 응답 DTO 입니다.
 */
public record ErrorResponse(
        LocalDateTime timestamp,
        String message) {
    public ErrorResponse(String message) {
        this(LocalDateTime.now(), message);
    }
}
