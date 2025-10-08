package devcamphub.backend.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

// 필드들이 null일 수 있으므로 record 대신 일반 클래스 사용
public class CampUpdateRequest {

    @Size(max = 100, message = "캠프 이름은 100자를 초과할 수 없습니다.")
    private String name;

    @Size(max = 1000, message = "캠프 설명은 1000자를 초과할 수 없습니다.")
    private String description;

    private String homepageUrl;

    private LocalDate startDate;

    @Future(message = "종료일은 현재보다 미래여야 합니다.")
    private LocalDate endDate;

    // Getter
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getHomepageUrl() { return homepageUrl; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
}
