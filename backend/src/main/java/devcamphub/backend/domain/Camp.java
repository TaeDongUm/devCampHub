package devcamphub.backend.domain;

import devcamphub.backend.dto.CampUpdateRequest;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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

    @OneToMany(mappedBy = "camp", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CampMember> campMembers = new ArrayList<>();

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

    @Column(nullable = false)
    private int capacity;

    @Column(name = "institution_name", nullable = false, length = 100)
    private String institutionName;

    @Builder
    public Camp(User creator, String name, String description, String homepageUrl, LocalDate startDate,
            LocalDate endDate, CampStatus status, String inviteCode, int capacity, String institutionName) {
        this.creator = creator;
        this.name = name;
        this.description = description;
        this.homepageUrl = homepageUrl;
        this.institutionName = institutionName;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = status;
        this.inviteCode = inviteCode;
        this.capacity = capacity; // Assign capacity
    }

    // == Business Logic ==//
    public void updateDetails(CampUpdateRequest request) {
        if (request.getName() != null) {
            this.name = request.getName();
        }
        if (request.getDescription() != null) {
            this.description = request.getDescription();
        }
        if (request.getHomepageUrl() != null) {
            this.homepageUrl = request.getHomepageUrl();
        }
        if (request.getStartDate() != null) {
            this.startDate = request.getStartDate();
        }
        if (request.getEndDate() != null) {
            this.endDate = request.getEndDate();
        }

        // 날짜 변경에 따른 상태 업데이트
        if (this.startDate.isAfter(LocalDate.now())) {
            this.status = CampStatus.UPCOMING;
        } else if (this.endDate.isBefore(LocalDate.now())) {
            this.status = CampStatus.ENDED;
        } else {
            this.status = CampStatus.ONGOING;
        }
    }

    public void regenerateInviteCode(String newCode) {
        this.inviteCode = newCode;
    }
}