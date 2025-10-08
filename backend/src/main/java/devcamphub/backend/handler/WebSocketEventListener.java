package devcamphub.backend.handler;

import devcamphub.backend.dto.SignalMessage;
import devcamphub.backend.service.WebSocketSessionRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Objects;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final WebSocketSessionRegistry sessionRegistry;
    private final SimpMessageSendingOperations messagingTemplate;

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        String username = sessionRegistry.getUserBySessionId(sessionId);

        if (username != null) {
            log.info("User Disconnected: {}", username);

            // 사용자가 참여하고 있던 방 찾기
            String roomId = sessionRegistry.getRoomIdForUser(username);
            if (roomId != null) {
                // 방에서 사용자 제거
                sessionRegistry.leaveRoom(username);

                // 다른 참여자들에게 "leave" 메시지 전송
                SignalMessage leaveMessage = new SignalMessage();
                leaveMessage.setType("leave");
                leaveMessage.setSender(username);
                messagingTemplate.convertAndSend("/topic/signal/" + roomId, leaveMessage);
            }

            // 세션 등록 해제
            sessionRegistry.unregisterSession(sessionId);
        }
    }
}
