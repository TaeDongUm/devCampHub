package devcamphub.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageDto {
    private Long clientMsgId; // 클라이언트 생성 ID
    private String channel; // 메시지가 속한 채널 (e.g., "notice", "qna")
    private String sender; // 보낸 사람 닉네임
    private String content; // 메시지 내용
    private String timestamp; // 메시지 보낸 시간
}
