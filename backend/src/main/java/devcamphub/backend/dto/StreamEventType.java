package devcamphub.backend.dto;

public enum StreamEventType {
    START,      // 방송 시작
    HEARTBEAT,  // 생존 신호
    STOP        // 방송 종료
}
