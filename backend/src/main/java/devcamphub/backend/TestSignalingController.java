package devcamphub.backend;

import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

@Slf4j
@Controller
public class TestSignalingController {

    @MessageMapping("/test/join") // 새로운 간단한 목적지
    public void handleTestMessage(String payload) {
        log.info(">>> TestSignalingController: handleTestMessage received payload: {}", payload);
    }
}
