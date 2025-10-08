package devcamphub.backend.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record CampCreateRequest(
        @NotBlank(message = "캠프 이름은 필수 항목입니다.")
        @Size(max = 100, message = "캠프 이름은 100자를 초과할 수 없습니다.")
        String name,

        @Size(max = 1000, message = "캠프 설명은 1000자를 초과할 수 없습니다.")
        String description,

        String homepageUrl,

        @NotNull(message = "시작일은 필수 항목입니다.")
        LocalDate startDate,

        @NotNull(message = "종료일은 필수 항목입니다.")
        @Future(message = "종료일은 현재보다 미래여야 합니다.")
        LocalDate endDate
) {
}
