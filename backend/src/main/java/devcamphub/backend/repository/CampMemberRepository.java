package devcamphub.backend.repository;

import devcamphub.backend.domain.Camp;
import devcamphub.backend.domain.CampMember;
import devcamphub.backend.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CampMemberRepository extends JpaRepository<CampMember, Long> {

    // 특정 캠프에 속한 모든 멤버 조회
    List<CampMember> findByCamp(Camp camp);

    // 특정 사용자가 참여한 모든 캠프 멤버십 정보 조회
    List<CampMember> findByUser(User user);

    // 특정 사용자가 특정 캠프에 참여했는지 확인
    Optional<CampMember> findByCampAndUser(Camp camp, User user);

    // 특정 캠프에 속한 모든 멤버 삭제 (캠프 삭제 시 사용)
    void deleteAllByCamp(Camp camp);
}
