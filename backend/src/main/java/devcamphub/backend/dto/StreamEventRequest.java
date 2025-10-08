package devcamphub.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record StreamEventRequest(
        @NotNull(message = "이벤트 타입은 필수 항목입니다.")
        StreamEventType eventType,

        @NotBlank(message = "스트림 세션 ID는 필수 항목입니다.")
        String streamSessionId,

        // START 이벤트 시에만 필요한 정보
        Long campId,
        String streamTitle
) {
}
