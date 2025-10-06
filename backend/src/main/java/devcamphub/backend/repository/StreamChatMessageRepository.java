package devcamphub.backend.repository;

import devcamphub.backend.domain.StreamChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StreamChatMessageRepository extends JpaRepository<StreamChatMessage, Long> {

    /**
     * 특정 스트림(방송)에 해당하는 메시지를 최신순으로 조회합니다.
     */
    Slice<StreamChatMessage> findByStreamIdOrderByCreatedAtDesc(Long streamId, Pageable pageable);

}
