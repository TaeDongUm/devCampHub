package devcamphub.backend.dto;

import devcamphub.backend.domain.StreamType;
import devcamphub.backend.domain.Track;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record StreamCreateRequest(
        @NotBlank(message = "스트림 제목은 필수입니다.")
        String title,

        @NotNull(message = "스트림 타입은 필수입니다.")
        StreamType type,

        @NotNull(message = "트랙은 필수입니다.")
        Track track
) {
}
