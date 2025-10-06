package devcamphub.backend.service;

import devcamphub.backend.domain.User;
import devcamphub.backend.dto.LoginRequest;
import devcamphub.backend.dto.LoginResponse;
import devcamphub.backend.dto.RegistrationRequest;
import devcamphub.backend.repository.UserRepository;
import devcamphub.backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor // final 필드에 대한 생성자를 자동으로 생성합니다.
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public User registerUser(RegistrationRequest request) {
        // 1. 이메일 중복 확인
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        // 2. 닉네임 중복 확인
        if (userRepository.existsByNickname(request.getNickname())) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
        }

        // 3. 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        // 4. DTO를 User 엔티티로 변환
        User newUser = User.builder()
                .email(request.getEmail())
                .password(encodedPassword)
                .nickname(request.getNickname())
                .role(request.getRole())
                .build();

        // 5. 데이터베이스에 저장
        return userRepository.save(newUser);
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        // 1. Spring Security를 사용하여 사용자 인증
        // AuthenticationManager가 인증을 처리하며, 실패 시 예외를 던집니다.
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        // 2. 인증된 사용자 정보 가져오기
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        // 3. JwtUtil을 사용하여 Access Token과 Refresh Token 생성
        String accessToken = jwtUtil.generateAccessToken(userDetails);
        String refreshToken = jwtUtil.generateRefreshToken(userDetails);

        // 4. LoginResponse DTO에 토큰들을 담아 반환
        return new LoginResponse(accessToken, refreshToken);
    }
}
