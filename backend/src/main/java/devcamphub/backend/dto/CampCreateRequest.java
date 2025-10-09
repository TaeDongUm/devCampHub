package devcamphub.backend.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import java.time.LocalDate;

public record CampCreateRequest(
                @NotBlank(message = "캠프 이름은 필수 항목입니다.") @Size(max = 100, message = "캠프 이름은 100자를 초과할 수 없습니다.") String name,

                @Size(max = 1000, message = "캠프 설명은 1000자를 초과할 수 없습니다.") String description,

                String homepageUrl,

                @NotBlank(message = "교육기관명은 필수 항목입니다.") // Add NotBlank constraint
                @Size(max = 100, message = "교육기관명은 100자를 초과할 수 없습니다.") // Add Size constraint
                String institutionName, // Add institutionName field

                @NotNull(message = "시작일은 필수 항목입니다.") LocalDate startDate,

                @NotNull(message = "종료일은 필수 항목입니다.") @Future(message = "종료일은 현재보다 미래여야 합니다.") LocalDate endDate,

                @NotNull(message = "인원수는 필수 항목입니다.") // Add NotNull constraint
                @Min(value = 1, message = "인원수는 최소 1명 이상이어야 합니다.") // Add Min constraint
                @Max(value = 100, message = "인원수는 최대 100명 이하이어야 합니다.") // Add Max constraint
                Integer capacity // Add capacity field
) {
}
