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

    // ...

    @MessageMapping("/signal/join")
    public void handleSignalMessage(org.springframework.messaging.Message<?> message) {
        log.info(">>> SignalingController: handleMessage received generic message on /signal/join");
        log.info("Headers: {}", message.getHeaders());
        log.info("Payload: {}", message.getPayload());
    }

    @MessageMapping("/signal/**")
    public void handleAllSignalMessages(SignalMessage message, @DestinationVariable String[] pathSegments) {
        log.info(">>> SignalingController: handleAllSignalMessages received message on generic path: /signal/{}", String.join("/", pathSegments));
        log.info("Generic Signal message received: type={}, sender={}, data={}",
                message.getType(), message.getSender(), message.getData());
    }
}
