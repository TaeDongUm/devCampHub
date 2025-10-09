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
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (StompCommand.CONNECT.equals(accessor.getCommand()) || StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            log.debug("WebSocket CONNECT or SUBSCRIBE command received.");
            List<String> authorization = accessor.getNativeHeader("Authorization");
            String token = null;
            if (authorization != null && !authorization.isEmpty()) {
                String bearerToken = authorization.get(0);
                if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
                    token = bearerToken.substring(7);
                    log.debug("Extracted Bearer token: {}", token);
                }
            }

            if (token != null) {
                try {
                    String username = jwtUtil.extractUsername(token);
                    log.debug("Extracted username from token: {}", username);
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                    if (jwtUtil.validateToken(token, userDetails)) {
                        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                        accessor.setUser(authentication);
                        log.info(">>> WebSocketAuthInterceptor: Authentication successful for user: {}. Principal set on accessor.", username);
                    } else {
                        log.debug("WebSocket token validation failed for user: {}", username);
                    }
                } catch (Exception e) {
                    log.error("WebSocket JWT authentication failed: {}", e.getMessage(), e);
                }
            } else {
                log.info(">>> WebSocketAuthInterceptor: No JWT token found in WebSocket CONNECT/SUBSCRIBE headers. Proceeding as unauthenticated.");
            }
        } else if (StompCommand.DISCONNECT.equals(accessor.getCommand())) {
            log.info(">>> WebSocketAuthInterceptor: DISCONNECT command received for session: {}", accessor.getSessionId());
        }
        return message;
    }
}
