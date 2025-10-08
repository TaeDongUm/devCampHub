package devcamphub.backend.config;

import devcamphub.backend.config.jwt.JwtAuthenticationFilter;
import devcamphub.backend.domain.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:5173"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("authorization", "content-type", "x-auth-token"));
        configuration.setExposedHeaders(Arrays.asList("x-auth-token"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // CORS 설정 추가
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // CSRF 비활성화 (stateless JWT 인증 사용)
                .csrf(csrf -> csrf.disable())
                // 세션 관리 정책을 STATELESS로 설정
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // HTTP 요청에 대한 인가 규칙 설정
                .authorizeHttpRequests(authorize -> authorize
                        // 인증 API, WebSocket 접속 경로는 모두에게 허용
                        .requestMatchers("/api/auth/**", "/ws/**").permitAll()
                        // 캠프 생성, 수정, 삭제는 ADMIN 역할만 가능
                        .requestMatchers(HttpMethod.POST, "/api/camps").hasRole(Role.ADMIN.name())
                        .requestMatchers(HttpMethod.PATCH, "/api/camps/*").hasRole(Role.ADMIN.name())
                        .requestMatchers(HttpMethod.DELETE, "/api/camps/*").hasRole(Role.ADMIN.name())
                        // 캠프 참여는 STUDENT 역할만 가능
                        .requestMatchers(HttpMethod.POST, "/api/camps/*/join").hasRole(Role.STUDENT.name())
                        // 마이페이지 관련 API는 인증된 사용자 모두에게 허용
                        .requestMatchers("/api/me/**").authenticated()
                        // 스트림 이벤트는 인증된 사용자 모두에게 허용
                        .requestMatchers("/api/streams/events").authenticated()
                        // 캠프 조회는 인증된 사용자 모두에게 허용
                        .requestMatchers(HttpMethod.GET, "/api/camps", "/api/camps/**").authenticated()
                        // 그 외 모든 요청은 인증 필요
                        .anyRequest().authenticated()
                )
                // 직접 구현한 JWT 필터를 UsernamePasswordAuthenticationFilter 앞에 추가
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
