package devcamphub.backend.dto;

import lombok.Data;

@Data
public class SignalMessage {
    private String type;
    private String sender;
    private String receiver;
    private Object data;
    private String streamId; // 추가
    private String nickname; // 추가
}

