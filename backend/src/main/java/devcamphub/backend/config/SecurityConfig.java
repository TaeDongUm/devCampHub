package devcamphub.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        // BCrypt는 현재 가장 널리 사용되는 안전한 패스워드 해싱 방식 중 하나입니다.
        return new BCryptPasswordEncoder();
    }

    // 앞으로 여기에 JWT 필터, 경로별 권한 설정 등이 추가될 예정입니다.
}
