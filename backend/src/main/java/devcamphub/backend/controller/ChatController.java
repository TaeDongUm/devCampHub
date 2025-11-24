package devcamphub.backend.controller;

import devcamphub.backend.dto.ChatMessageDto;
import devcamphub.backend.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate; // ACK 전송용

    /**
     * 클라이언트에서 "/app/chat/{campId}/{channel}"로 메시지를 보내면 이 메소드가 처리합니다.
     * 
     * @param messageDto 클라이언트가 보낸 채팅 메시지
     * @param campId     메시지가 속한 캠프 ID
     * @param channel    메시지가 속한 채널
     * @param principal  메시지를 보낸 인증된 사용자 정보
     */
    @MessageMapping("/chat/{campId}/{channel}")
    public void sendMessage(
            @Payload ChatMessageDto messageDto,
            @DestinationVariable Long campId,
            @DestinationVariable String channel,
            Principal principal) {

        log.info("Received chat message for campId: {}, channel: {}", campId, channel);

        if (principal == null) {
            log.error("Unauthorized user tried to send a message. Principal is null.");
            return;
        }

        String username = principal.getName();
        log.info("Authenticated user: {}", username);

        messageDto.setChannel(channel);
        log.debug("ChatMessageDto after setting channel: {}", messageDto);
        log.info("[시도] Received clientMsgId: {}", messageDto.getClientMsgId()); // 디버깅

        chatService.saveAndBroadcastMessage(messageDto, campId, username);
        log.info("Message processed by ChatService for user {}.", username);

        // ACK 전송
        if (messageDto.getClientMsgId() != null) {
            messagingTemplate.convertAndSendToUser(
                    username,
                    "/queue/ack",
                    Map.of("clientMsgId", messageDto.getClientMsgId(), "status", "DELIVERED"));
            log.info("[시도] ✅ ACK sent to user {} for msgId: {}", username, messageDto.getClientMsgId());
        } else {
            log.warn("[시도] ❌ clientMsgId is NULL - ACK not sent!");
        }
    }

    @GetMapping("/api/camps/{campId}/chat/{channel}/history")
    public ResponseEntity<List<ChatMessageDto>> getChatHistory(
            @PathVariable Long campId,
            @PathVariable String channel) {
        log.info("Fetching chat history for campId: {}, channel: {}", campId, channel);
        List<ChatMessageDto> chatHistory = chatService.getChatHistory(campId, channel);
        return ResponseEntity.ok(chatHistory);
    }
}
