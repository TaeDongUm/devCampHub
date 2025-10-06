package devcamphub.backend.repository;

import devcamphub.backend.domain.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    // 특정 사용자의 특정 캠프에 대한 모든 출석 기록 조회
    List<Attendance> findByCampIdAndUserId(Long campId, Long userId);

    // 특정 사용자의 특정 캠프의 특정 날짜 출석 기록 조회
    Optional<Attendance> findByCampIdAndUserIdAndDate(Long campId, Long userId, LocalDate date);

}
