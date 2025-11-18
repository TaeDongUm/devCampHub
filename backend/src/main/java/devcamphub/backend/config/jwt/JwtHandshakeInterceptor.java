
package devcamphub.backend.config.jwt;

import devcamphub.backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.util.Map;

@Slf4j
@RequiredArgsConstructor
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
            WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {

        String token = null;

        // 1. 핸드셰이크 요청에서 토큰 추출
        if (request instanceof ServletServerHttpRequest) {
            ServletServerHttpRequest servletReq = (ServletServerHttpRequest) request;
            token = servletReq.getServletRequest().getParameter("token");
            if (token == null) {
                // 1-2. Authorization 헤더에서 토큰 추출 시도
                String auth = servletReq.getServletRequest().getHeader("Authorization");
                if (auth != null && auth.startsWith("Bearer ")) {
                    token = auth.substring(7);
                }
            }
        }

        // 2. URI 쿼리에서 토큰 추출 (외부 라이브러리 없이 수동으로)
        if (token == null) {
            URI uri = request.getURI();
            String rawQuery = uri.getRawQuery();
            if (rawQuery != null) {
                String[] pairs = rawQuery.split("&");
                for (String pair : pairs) {
                    int idx = pair.indexOf('=');
                    if (idx > 0) {
                        String name = URLDecoder.decode(pair.substring(0, idx), StandardCharsets.UTF_8);
                        String value = URLDecoder.decode(pair.substring(idx + 1), StandardCharsets.UTF_8);
                        if ("token".equals(name)) {
                            token = value;
                            break;
                        }
                    }
                }
            }
        }

        if (token != null) {
            try {
                String username = jwtUtil.extractUsername(token);
                if (username != null) {
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    if (jwtUtil.validateToken(token, userDetails)) {
                        // 3. 웹소켓 세션 속성에 인증 정보 저장 (가장 중요한 부분)
                        // 'attributes' 맵은 웹소켓 세션으로 그대로 전달됩니다.
                        // 여기에 사용자 정보를 저장하면, 세션이 유지되는 동안 계속 사용할 수 있습니다.
                        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());
                        // 3-1. 세션 속성에 인증 객체 저장
                        attributes.put("principal", (Principal) auth);
                        log.info(">>> [WS-HANDSHAKE] Principal set for user: {}", username);
                    } else {
                        log.warn(">>> [WS-HANDSHAKE] Token validation failed for user: {}", username);
                    }
                }
            } catch (Exception ex) {
                log.error(">>> [WS-HANDSHAKE] Error during handshake auth: {}", ex.getMessage());
            }
        } else {
            log.debug(">>> [WS-HANDSHAKE] No token found in handshake request: {}", request.getURI());
        }

        return true; // true를 반환하여 핸드셰이크 계속 진행
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
            WebSocketHandler wsHandler, Exception exception) {

    }
}
