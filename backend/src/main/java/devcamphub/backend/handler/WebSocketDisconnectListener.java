package devcamphub.backend.handler;

import devcamphub.backend.domain.Stream;
import devcamphub.backend.domain.StreamStatus;
import devcamphub.backend.repository.StreamRepository;
import devcamphub.backend.service.WebSocketSessionRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketDisconnectListener implements ApplicationListener<SessionDisconnectEvent> {

    private final WebSocketSessionRegistry sessionRegistry;
    private final StreamRepository streamRepository;

    @Override
    public void onApplicationEvent(SessionDisconnectEvent event) {
        log.info(">>> WebSocketDisconnectListener triggered for session: {}", event.getSessionId());
        String sessionId = event.getSessionId();
        if (sessionId == null) {
            log.warn(">>> Session ID is null in disconnect event.");
            return;
        }

        // 세션 ID를 통해 사용자 정보 조회
        String username = null;
        if (event.getUser() != null) {
            username = event.getUser().getName();
            log.info(">>> Retrieved username from Principal: {} for sessionId {}", username, sessionId);
        } else {
            log.info(">>> No Principal found for sessionId {}. Attempting to retrieve from sessionRegistry.", sessionId);
            username = sessionRegistry.getUserBySessionId(sessionId);
        }
        log.info(">>> Retrieved username {} for sessionId {}", username, sessionId);

        if (username != null) {
            final String finalUsername = username; // Introduce effectively final variable
            log.info("WebSocket session disconnected: sessionId={}, user={}", sessionId, finalUsername);

            // 해당 사용자가 소유한 활성 스트림이 있는지 확인
            streamRepository.findFirstByOwner_EmailAndStatusOrderByStartedAtDesc(finalUsername, StreamStatus.ACTIVE)
                    .ifPresentOrElse(stream -> {
                        log.warn(">>> User {} disconnected without checking out. Automatically ending stream id: {}", finalUsername, stream.getId());
                        // 스트림 종료 처리
                        stream.endStream();
                        streamRepository.save(stream);
                        log.info(">>> Stream {} for user {} successfully ended and saved.", stream.getId(), finalUsername);
                    }, () -> {
                        log.info(">>> No active stream found for user {} on disconnect.", finalUsername);
                    });

            // Redis에서 세션 및 룸 정보 정리
            sessionRegistry.leaveRoom(username);
            log.info(">>> User {} left room in Redis.", username);
            sessionRegistry.unregisterSession(sessionId);
            log.info(">>> Session {} unregistered from Redis.", sessionId);
        } else {
            log.debug("No user found for disconnected session: {}", sessionId);
        }
    }
}
