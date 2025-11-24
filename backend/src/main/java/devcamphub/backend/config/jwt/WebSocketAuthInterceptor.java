package devcamphub.backend.config.jwt;

import devcamphub.backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;

import java.util.List;

@Slf4j
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        StompCommand command = accessor.getCommand();

        if (StompCommand.CONNECT.equals(command)) {
            log.info(">>> [WS-CONNECT] Intercepting CONNECT command. Attempting to authenticate...");

            String token = extractToken(accessor);

            if (token != null) {
                try {
                    String username = jwtUtil.extractUsername(token);
                    if (username != null) {
                        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                        if (jwtUtil.validateToken(token, userDetails)) {
                            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                    userDetails, null, userDetails.getAuthorities());
                            accessor.setUser(authentication);
                            log.info(">>> [WS-CONNECT] Authentication SUCCESS for user: {}. Principal set on accessor.",
                                    username);
                        } else {
                            log.warn(">>> [WS-CONNECT] Token validation FAILED for user: {}", username);
                        }
                    }
                } catch (Exception e) {
                    log.error(">>> [WS-CONNECT] Authentication exception: {}", e.getMessage());
                }
            } else {
                // No token in STOMP headers; try to find a principal placed during the HTTP
                // handshake
                if (accessor.getSessionAttributes() != null) {
                    Object principalObj = accessor.getSessionAttributes().get("principal");
                    if (principalObj instanceof java.security.Principal) {
                        accessor.setUser((java.security.Principal) principalObj);
                        log.info(">>> [WS-CONNECT] Used Principal from handshake session attributes: {}",
                                accessor.getUser());
                    } else if (principalObj != null) {
                        log.debug(">>> [WS-CONNECT] session 'principal' attribute found but not a Principal: {}",
                                principalObj.getClass());
                    } else {
                        log.warn(">>> [WS-CONNECT] No JWT token found in headers or handshake session.");
                    }
                } else {
                    log.warn(
                            ">>> [WS-CONNECT] No JWT token found and no session attributes available. Proceeding unauthenticated.");
                }
            }
        } else if (StompCommand.SEND.equals(command)) {
            // SEND 요청 시, 세션에 저장된 User가 있는지 확인
            log.info(">>> [WS-SEND] Intercepting SEND command. User from accessor: {}", accessor.getUser());
        }

        return message;
    }

    private String extractToken(StompHeaderAccessor accessor) {
        // 헤더 이름 대소문자를 다르게 전송할 경우 처리
        List<String> authorization = accessor.getNativeHeader("Authorization");
        if (authorization == null || authorization.isEmpty()) {
            authorization = accessor.getNativeHeader("authorization");
        }
        if (authorization == null || authorization.isEmpty()) {
            // STOMP CONNECT에 Authorization 헤더가 없음
            log.debug(">>> [WS-CONNECT] No Authorization header present in STOMP headers, messageHeaders={}",
                    accessor.getMessageHeaders());
            return null;
        }
        String bearerToken = authorization.get(0);
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
