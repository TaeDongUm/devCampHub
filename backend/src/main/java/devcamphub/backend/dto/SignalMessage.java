package devcamphub.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SignalMessage {
    private String type;      // offer, answer, ice, join, leave 등
    private String sender;    // 메시지를 보낸 사람
    private Object data;      // 실제 데이터 (SDP, ICE candidate 등)
}
