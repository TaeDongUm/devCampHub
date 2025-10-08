package devcamphub.backend.dto;

import devcamphub.backend.domain.Role;
import devcamphub.backend.domain.User;

public record MyProfileResponse(
        Long id,
        String email,
        String nickname,
        Role role,
        String avatarUrl,
        String track,
        String githubUrl,
        String blogUrl
) {
    public static MyProfileResponse from(User user) {
        return new MyProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getNickname(),
                user.getRole(),
                user.getAvatarUrl(),
                user.getTrack(),
                user.getGithubUrl(),
                user.getBlogUrl()
        );
    }
}
