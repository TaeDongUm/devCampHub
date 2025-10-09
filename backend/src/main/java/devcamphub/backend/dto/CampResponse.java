package devcamphub.backend.dto;

import devcamphub.backend.domain.Camp;
import devcamphub.backend.domain.CampStatus;
import java.time.LocalDate;

public record CampResponse(
        Long id,
        String name,
        String description,
        String homepageUrl,
        LocalDate startDate,
        LocalDate endDate,
        CampStatus status,
        String inviteCode,
        String creatorName,
        String institutionName,
        Integer capacity,
        int currentMembers) {
    public static CampResponse from(Camp camp) {
        return new CampResponse(
                camp.getId(),
                camp.getName(),
                camp.getDescription(),
                camp.getHomepageUrl(),
                camp.getStartDate(),
                camp.getEndDate(),
                camp.getStatus(),
                camp.getInviteCode(),
                camp.getCreator().getNickname(),
                camp.getInstitutionName(),
                camp.getCapacity(),
                camp.getCampMembers().size());
    }
}