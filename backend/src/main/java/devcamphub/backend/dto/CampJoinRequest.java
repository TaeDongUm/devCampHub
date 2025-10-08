package devcamphub.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record CampJoinRequest(
        @NotBlank(message = "초대 코드는 필수 항목입니다.")
        String inviteCode
) {
}
