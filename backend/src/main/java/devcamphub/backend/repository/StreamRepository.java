package devcamphub.backend.repository;

import devcamphub.backend.domain.Stream;
import devcamphub.backend.domain.StreamStatus;
import devcamphub.backend.domain.StreamType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StreamRepository extends JpaRepository<Stream, Long> {

    // 특정 캠프에서, 특정 타입의, 특정 상태인 스트림 목록 조회
    // 예: "네트워크 스터디 캠프"에서 "LIVE" 타입의 "ACTIVE" 상태인 모든 방송 조회
    List<Stream> findByCampIdAndTypeAndStatus(Long campId, StreamType type, StreamStatus status);

}
