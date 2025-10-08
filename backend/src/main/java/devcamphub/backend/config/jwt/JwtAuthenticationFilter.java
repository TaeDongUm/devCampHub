package devcamphub.backend.config.jwt;

import devcamphub.backend.service.UserService;
import devcamphub.backend.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserService userService; // Spring Security의 UserDetailsService 구현체

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        // 1. Authorization 헤더가 없거나 "Bearer "로 시작하지 않으면 필터를 통과시킵니다.
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 2. "Bearer " 부분을 제외한 실제 JWT를 추출합니다.
        jwt = authHeader.substring(7);
        userEmail = jwtUtil.extractUsername(jwt);

        // 3. 이메일이 존재하고, 아직 SecurityContext에 인증 정보가 없는 경우
        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            // 4. DB에서 사용자 정보를 조회합니다.
            UserDetails userDetails = this.userService.loadUserByUsername(userEmail);

            // 5. 토큰이 유효한지 검증합니다.
            if (jwtUtil.validateToken(jwt, userDetails)) {
                // 6. 토큰이 유효하면, Spring Security가 사용할 인증 토큰을 생성합니다.
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null, // 비밀번호는 사용하지 않으므로 null
                        userDetails.getAuthorities()
                );
                authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );

                // 7. SecurityContext에 인증 정보를 설정합니다.
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }
        // 8. 다음 필터로 요청을 전달합니다.
        filterChain.doFilter(request, response);
    }
}
