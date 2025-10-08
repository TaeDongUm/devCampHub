package devcamphub.backend.controller;

import devcamphub.backend.dto.ChatMessageDto;
import devcamphub.backend.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    /**
     * 클라이언트에서 "/app/chat/{campId}/{channel}"로 메시지를 보내면 이 메소드가 처리합니다.
     * @param messageDto 클라이언트가 보낸 채팅 메시지
     * @param campId     메시지가 속한 캠프 ID
     * @param channel    메시지가 속한 채널
     * @param userDetails 메시지를 보낸 인증된 사용자 정보
     */
    @MessageMapping("/chat/{campId}/{channel}")
    public void sendMessage(
            @Payload ChatMessageDto messageDto,
            @DestinationVariable Long campId,
            @DestinationVariable String channel,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            log.error("Unauthorized user tried to send a message.");
            return;
        }

        // DTO에 채널 정보 설정
        messageDto.setChannel(channel);

        // 서비스를 호출하여 메시지 처리
        chatService.saveAndBroadcastMessage(messageDto, campId, userDetails.getUsername());
    }
}
