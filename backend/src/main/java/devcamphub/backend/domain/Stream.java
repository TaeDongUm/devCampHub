package devcamphub.backend.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "streams")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Stream {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "stream_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "camp_id", nullable = false)
    private Camp camp;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StreamType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StreamStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Track track;

    @CreationTimestamp
    @Column(name = "started_at", updatable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "thumbnail_path")
    private String thumbnailPath;

    public void setThumbnailPath(String thumbnailPath) {
        this.thumbnailPath = thumbnailPath;
    }

    @Builder
    public Stream(Camp camp, User owner, String title, StreamType type, Track track) {
        this.camp = camp;
        this.owner = owner;
        this.title = title;
        this.type = type;
        this.track = track;
        this.status = StreamStatus.ACTIVE; // 생성 시 항상 ACTIVE 상태
    }

    // 방송 종료와 같은 상태 변경을 위한 메서드
    public void endStream() {
        this.status = StreamStatus.ENDED;
        this.endedAt = LocalDateTime.now();
    }
}
