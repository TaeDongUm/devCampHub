package devcamphub.backend.dto;

public record ProfileUpdateRequest(
        String nickname,
        String avatarUrl,
        String track,
        String githubUrl,
        String blogUrl
) {
}
