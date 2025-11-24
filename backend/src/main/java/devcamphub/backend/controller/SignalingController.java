package devcamphub.backend.controller;

import devcamphub.backend.dto.SignalMessage;
import devcamphub.backend.service.WebSocketSessionRegistry;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Controller;

@Slf4j
@Controller
@RequiredArgsConstructor
public class SignalingController {

    private final SimpMessageSendingOperations messagingTemplate;
    private final WebSocketSessionRegistry sessionRegistry;

    /**
     * 사용자가 스트리밍 방에 참여할 때 호출됩니다.
     * 1. 기존 참여자 목록을 조회하고, 방에 참여시킵니다.
     * 2. 새로운 참여자에게는 기존 참여자 목록(user-list)을 보냅니다.
     * 3. 기존 참여자들에게는 새로운 참여자의 합류(user-joined)를 알립니다.
     */
    @MessageMapping("/signal/join")
    public void join(SignalMessage message, SimpMessageHeaderAccessor headerAccessor) {
        String streamId = message.getStreamId();
        String nickname = message.getNickname();
        String sessionId = headerAccessor.getSessionId();

        log.info("JOIN: streamId={}, nickname={}, sessionId={}", streamId, nickname, sessionId);

        // 세션 등록은 WebSocketEventListener에서 처리하므로 여기서는 방 참여 로직만 수행합니다.

        // 1. 기존 참여자 목록 조회 및 방 참여
        Set<String> existingUsers = sessionRegistry.getUsersInRoom(streamId);
        sessionRegistry.joinRoom(streamId, nickname);
        log.info("Existing users in room {}: {}", streamId, existingUsers);

        // 2. 새로운 참여자에게 기존 참여자 목록 전송
        SignalMessage userListMessage = new SignalMessage();
        userListMessage.setType("user-list");
        userListMessage.setSender("server");
        userListMessage.setReceiver(nickname); // 이 메시지는 새로운 참여자만 받음
        userListMessage.setData(existingUsers);
        messagingTemplate.convertAndSend("/topic/signal/" + streamId, userListMessage);
        log.info("Sent user-list to {}: {}", nickname, existingUsers);

        // 3. 기존 참여자들에게 새로운 참여자 합류 알림 (자신은 제외)
        SignalMessage joinedMessage = new SignalMessage();
        joinedMessage.setType("user-joined");
        joinedMessage.setSender(nickname); // 합류한 사람의 닉네임
        messagingTemplate.convertAndSend("/topic/signal/" + streamId, joinedMessage);
        log.info("Broadcast user-joined for {} to room {}", nickname, streamId);
    }

    /**
     * WebRTC 시그널(offer, answer, ice)을 중계합니다.
     * 메시지를 받아서 특정 수신자(receiver)에게 그대로 전달합니다.
     */
    @MessageMapping("/signal/{streamId}")
    public void forward(@DestinationVariable String streamId, SignalMessage message) {
        log.debug("FORWARD: type={}, sender={}, receiver={}, streamId={}",
                message.getType(), message.getSender(), message.getReceiver(), streamId);

        // 메시지를 해당 토픽으로 그대로 전달
        messagingTemplate.convertAndSend("/topic/signal/" + streamId, message);
    }
}

