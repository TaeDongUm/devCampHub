package devcamphub.backend.service;

import devcamphub.backend.domain.Camp;
import devcamphub.backend.domain.ChannelChatMessage;
import devcamphub.backend.domain.User;
import devcamphub.backend.dto.ChatMessageDto;
import devcamphub.backend.repository.CampRepository;
import devcamphub.backend.repository.ChannelChatMessageRepository;
import devcamphub.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final SimpMessageSendingOperations messagingTemplate;
    private final ChannelChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final CampRepository campRepository;

    @Transactional
    public void saveAndBroadcastMessage(ChatMessageDto messageDto, Long campId, String userEmail) {
        // 1. 메시지를 보낸 사용자(User)와 메시지가 속한 캠프(Camp)를 DB에서 조회합니다.
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userEmail));
        Camp camp = campRepository.findById(campId)
                .orElseThrow(() -> new IllegalArgumentException("캠프를 찾을 수 없습니다: " + campId));

        // 2. DTO를 영속성을 위한 엔티티 객체로 변환합니다.
        ChannelChatMessage chatMessage = ChannelChatMessage.builder()
                .camp(camp)
                .author(user)
                .channel(messageDto.getChannel())
                .content(messageDto.getContent())
                .build();

        // 3. 메시지를 데이터베이스에 저장합니다.
        ChannelChatMessage savedMessage = chatMessageRepository.save(chatMessage);

        // 4. 클라이언트에게 전달할 DTO에 서버 시간 등 최종 정보를 담습니다.
        messageDto.setSender(user.getNickname()); // 발신자 닉네임 설정
        messageDto.setTimestamp(formatTimestamp(savedMessage.getCreatedAt())); // DB에 저장된 시간으로 설정

        // 5. 해당 채널을 구독하고 있는 클라이언트들에게 메시지를 전송(broadcast)합니다.
        String destination = "/topic/chat/" + campId + "/" + messageDto.getChannel();
        messagingTemplate.convertAndSend(destination, messageDto);
    }

    public List<ChatMessageDto> getChatHistory(Long campId, String channel) {
        // 캠프와 채널에 해당하는 메시지를 조회합니다.
        List<ChannelChatMessage> messages = chatMessageRepository.findByCampIdAndChannelOrderByCreatedAtAsc(campId, channel);

        // 조회된 메시지를 ChatMessageDto 리스트로 변환합니다.
        return messages.stream().map(message -> {
            ChatMessageDto dto = new ChatMessageDto();
            dto.setChannel(message.getChannel());
            dto.setSender(message.getAuthor().getNickname()); // User 엔티티에서 닉네임 가져오기
            dto.setContent(message.getContent());
            dto.setTimestamp(formatTimestamp(message.getCreatedAt()));
            return dto;
        }).collect(Collectors.toList());
    }

    private String formatTimestamp(LocalDateTime localDateTime) {
        // 필요에 따라 시간 포맷을 변경할 수 있습니다.
        return localDateTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }
}
