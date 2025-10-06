package devcamphub.backend.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "camps")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Camp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "camp_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id", nullable = false)
    private User creator;

    @Column(nullable = false)
    private String name;

    @Lob // For longer text
    private String description;

    @Column(name = "homepage_url")
    private String homepageUrl;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CampStatus status;

    @Column(name = "invite_code", unique = true, length = 20)
    private String inviteCode;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public Camp(User creator, String name, String description, String homepageUrl, LocalDate startDate,
            LocalDate endDate, CampStatus status, String inviteCode) {
        this.creator = creator;
        this.name = name;
        this.description = description;
        this.homepageUrl = homepageUrl;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = status;
        this.inviteCode = inviteCode;
    }
}
