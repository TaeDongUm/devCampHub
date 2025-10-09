package devcamphub.backend.repository;

import devcamphub.backend.domain.ChannelChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChannelChatMessageRepository extends JpaRepository<ChannelChatMessage, Long> {

    /**
     * 특정 캠프의 특정 채널에 해당하는 메시지를 최신순으로 조회합니다.
     * Page가 아닌 Slice를 사용하면 전체 개수(total count) 쿼리를 생략하여 성능을 향상 가능
     * (무한 스크롤 방식의 채팅 내역 조회에 적합)
     */
    Slice<ChannelChatMessage> findByCampIdAndChannelOrderByCreatedAtDesc(Long campId, String channel,
            Pageable pageable);

    /**
     * 특정 캠프의 특정 채널에 해당하는 메시지를 오래된 순으로 조회합니다.
     */
    List<ChannelChatMessage> findByCampIdAndChannelOrderByCreatedAtAsc(Long campId, String channel);
}
