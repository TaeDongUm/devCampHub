package devcamphub.backend.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users") // 'user'는 여러 DB에서 예약어일 수 있으므로 'users' 사용을 권장합니다.
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED) // JPA는 기본 생성자를 필요로 합니다.
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, unique = true, length = 50)
    private String nickname;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(length = 20)
    private String track;

    @Column(name = "github_url")
    private String githubUrl;

    @Column(name = "blog_url")
    private String blogUrl;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public User(String email, String password, String nickname, Role role, String avatarUrl, String track,
            String githubUrl, String blogUrl) {
        this.email = email;
        this.password = password;
        this.nickname = nickname;
        this.role = role;
        this.avatarUrl = avatarUrl;
        this.track = track;
        this.githubUrl = githubUrl;
        this.blogUrl = blogUrl;
    }

    public void updateProfile(devcamphub.backend.dto.ProfileUpdateRequest request) {
        if (request.nickname() != null) {
            this.nickname = request.nickname();
        }
        if (request.avatarUrl() != null) {
            this.avatarUrl = request.avatarUrl();
        }
        if (request.track() != null) {
            this.track = request.track();
        }
        if (request.githubUrl() != null) {
            this.githubUrl = request.githubUrl();
        }
        if (request.blogUrl() != null) {
            this.blogUrl = request.blogUrl();
        }
    }
}
