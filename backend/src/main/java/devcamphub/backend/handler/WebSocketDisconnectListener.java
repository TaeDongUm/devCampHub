package devcamphub.backend.handler;

import devcamphub.backend.domain.StreamStatus;
import devcamphub.backend.dto.SignalMessage;
import devcamphub.backend.repository.StreamRepository;
import devcamphub.backend.service.WebSocketSessionRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketDisconnectListener {

    private final WebSocketSessionRegistry sessionRegistry;
    private final StreamRepository streamRepository;
    private final SimpMessageSendingOperations messagingTemplate;

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        String sessionId = event.getSessionId();
        if (sessionId == null) {
            log.warn("Session ID is null in disconnect event.");
            return;
        }

        // Redis에서 세션 ID를 통해 닉네임 조회
        String nickname = sessionRegistry.getNicknameBySessionId(sessionId);

        if (nickname != null) {
            log.info("WebSocket session disconnected: sessionId={}, nickname={}", sessionId, nickname);

            // Redis에서 방 정보 조회 및 퇴장 처리
            String roomId = sessionRegistry.getRoomIdForUser(nickname);
            if (roomId != null) {
                sessionRegistry.leaveRoom(nickname);
                log.info("Nickname {} left room {}.", nickname, roomId);

                // 다른 사용자들에게 user-left 메시지 전송
                SignalMessage leftMessage = new SignalMessage();
                leftMessage.setType("user-left");
                leftMessage.setSender(nickname);
                messagingTemplate.convertAndSend("/topic/signal/" + roomId, leftMessage);
            }
        }

        // 세션 등록 해제 (닉네임 존재 여부와 상관없이 시도)
        sessionRegistry.unregisterSession(sessionId);
        log.info("Unregistered session {} from Redis.", sessionId);


        // Principal을 통해 이메일 조회 (DB 스트림 종료 처리를 위함)
        if (event.getUser() != null && event.getUser().getName() != null) {
            String userEmail = event.getUser().getName();
            log.info("Principal email {} found for session {}. Checking for active streams.", userEmail, sessionId);

            // 해당 사용자가 소유한 활성 스트림이 있는지 확인
            streamRepository.findFirstByOwner_EmailAndStatusOrderByStartedAtDesc(userEmail, StreamStatus.ACTIVE)
                    .ifPresent(stream -> {
                        log.warn("User {} disconnected without checking out. Automatically ending stream id: {}", userEmail, stream.getId());
                        // 스트림 종료 처리
                        stream.endStream();
                        streamRepository.save(stream);
                        log.info("Stream {} for user {} successfully ended and saved.", stream.getId(), userEmail);
                    });
        }
    }
}
