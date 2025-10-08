package devcamphub.backend.repository;

import devcamphub.backend.domain.Camp;
import devcamphub.backend.domain.CampStatus;
import devcamphub.backend.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CampRepository extends JpaRepository<Camp, Long> {

    // 대시보드에서 상태별 캠프 목록을 페이지네이션으로 조회
    Page<Camp> findByStatus(CampStatus status, Pageable pageable);

    // 관리자가 생성한 캠프 목록 조회
    List<Camp> findByCreator(User creator);

    // 초대 코드가 존재하는지 확인 (캠프 생성 시 중복 방지용)
    boolean existsByInviteCode(String inviteCode);
}
