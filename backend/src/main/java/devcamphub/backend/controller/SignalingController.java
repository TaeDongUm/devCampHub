package devcamphub.backend.controller;

import devcamphub.backend.dto.SignalMessage;
import devcamphub.backend.service.WebSocketSessionRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Controller;

@Slf4j
@Controller
@RequiredArgsConstructor
public class SignalingController {

    private final SimpMessageSendingOperations messagingTemplate;
    private final WebSocketSessionRegistry sessionRegistry;

    @MessageMapping("/signal/{roomId}")
    public void handleSignalMessage(SignalMessage message, @DestinationVariable String roomId, @Header("simpSessionId") String sessionId) {
        log.info("Signal message received: type={}, sender={}, roomId={}, sessionId={}",
                message.getType(), message.getSender(), roomId, sessionId);

        switch (message.getType()) {
            case "join":
                // 세션과 사용자 등록, 방에 참여
                sessionRegistry.registerSession(sessionId, message.getSender());
                sessionRegistry.joinRoom(roomId, message.getSender());

                // 다른 모든 참여자에게 '새로운 사용자 참여' 이벤트를 전송하여 피어 연결을 준비하도록 함
                messagingTemplate.convertAndSend("/topic/signal/" + roomId, 
                        new SignalMessage("user-joined", message.getSender(), null));
                break;

            case "leave":
                // 방에서 나가고 세션 등록 해제
                sessionRegistry.leaveRoom(message.getSender());
                sessionRegistry.unregisterSession(sessionId);

                // 다른 모든 참여자에게 '사용자 퇴장' 이벤트를 전송하여 피어 연결을 정리하도록 함
                messagingTemplate.convertAndSend("/topic/signal/" + roomId, 
                        new SignalMessage("user-left", message.getSender(), null));
                break;

            default:
                // 'join', 'leave'가 아닌 다른 모든 메시지(offer, answer, ice)는 방의 모든 참여자에게 전달
                messagingTemplate.convertAndSend("/topic/signal/" + roomId, message);
                break;
        }
    }
}
