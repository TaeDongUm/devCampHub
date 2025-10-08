package devcamphub.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker // STOMP를 사용하기 위해 선언하는 어노테이션
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // 클라이언트에서 WebSocket에 접속할 때 사용할 엔드포인트를 등록합니다.
        // 여기서는 "/ws"를 엔드포인트로 설정했습니다.
        // setAllowedOriginPatterns("*")는 모든 도메인에서의 접속을 허용합니다. (개발 단계)
        // withSockJS()는 WebSocket을 지원하지 않는 브라우저를 위한 폴백 옵션입니다.
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // 메시지 브로커에 대한 설정을 합니다.

        // /topic, /queue 프리픽스가 붙은 메시지를 발행(publish)할 수 있도록 설정합니다.
        // /topic은 1:N, /queue는 1:1 메시징 방식에 주로 사용됩니다.
        registry.enableSimpleBroker("/topic", "/queue");

        // 클라이언트에서 서버로 메시지를 보낼 때 붙는 프리픽스를 설정합니다.
        // 예를 들어, 클라이언트가 "/app/signal"로 메시지를 보내면, @MessageMapping("/signal") 어노테이션이 붙은 메소드가 이를 처리합니다.
        registry.setApplicationDestinationPrefixes("/app");
    }
}
