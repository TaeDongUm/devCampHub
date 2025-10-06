package devcamphub.backend.repository;

import devcamphub.backend.domain.EmailVerification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmailVerificationRepository extends JpaRepository<EmailVerification, Long> {

    /**
     * 특정 이메일에 대해 가장 최근에 생성된 인증 정보를 조회합니다.
     * (만료 시간 내림차순으로 정렬하여 첫 번째 결과를 가져옴)
     */
    Optional<EmailVerification> findFirstByEmailOrderByExpiresAtDesc(String email);

}
