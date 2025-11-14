package devcamphub.backend.handler;

import devcamphub.backend.repository.UserRepository;
import devcamphub.backend.service.WebSocketSessionRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final WebSocketSessionRegistry sessionRegistry;
    private final UserRepository userRepository;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();

        if (event.getUser() == null || event.getUser().getName() == null) {
            log.warn("User principal is null for session: {}", sessionId);
            return;
        }

        String userEmail = event.getUser().getName();
        log.info("WebSocket session connected: sessionId={}, userEmail={}", sessionId, userEmail);

        // 이메일을 사용하여 DB에서 사용자 정보를 찾고, 닉네임을 가져옵니다.
        userRepository.findByEmail(userEmail).ifPresent(user -> {
            String nickname = user.getNickname();
            sessionRegistry.registerSession(sessionId, nickname);
            log.info("Session registered with nickname: {} for email: {}", nickname, userEmail);
        });
    }
}
