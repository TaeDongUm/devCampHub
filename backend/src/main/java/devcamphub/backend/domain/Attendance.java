package devcamphub.backend.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "attendances", uniqueConstraints = {
        @UniqueConstraint(name = "uk_attendance_user_date", columnNames = { "camp_id", "user_id", "date" })
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "attendance_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "camp_id", nullable = false)
    private Camp camp;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "total_minutes", nullable = false)
    private Integer totalMinutes = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AttendanceStatus status;

    @Builder
    public Attendance(Camp camp, User user, LocalDate date, Integer totalMinutes, AttendanceStatus status) {
        this.camp = camp;
        this.user = user;
        this.date = date;
        this.totalMinutes = totalMinutes;
        this.status = status;
    }

    // 비즈니스 로직: 누적 시간 업데이트
    public void updateTotalMinutes(int minutes) {
        this.totalMinutes = minutes;
    }

    // 비즈니스 로직: 최종 상태 업데이트
    public void updateStatus(AttendanceStatus status) {
        this.status = status;
    }
}
