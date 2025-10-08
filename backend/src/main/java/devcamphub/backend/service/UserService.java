package devcamphub.backend.service;

import devcamphub.backend.domain.EmailVerification;
import devcamphub.backend.domain.User;
import devcamphub.backend.dto.LoginRequest;
import devcamphub.backend.dto.LoginResponse;
import devcamphub.backend.dto.RegistrationRequest;
import devcamphub.backend.repository.EmailVerificationRepository;
import devcamphub.backend.repository.UserRepository;
import devcamphub.backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.FileCopyUtils;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor // final 필드에 대한 생성자를 자동으로 생성합니다.
public class UserService {

    private final UserRepository userRepository;
    private final EmailVerificationRepository emailVerificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    @Value("classpath:templates/verification-email.html")
    private ClassPathResource emailTemplateResource;

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

        // 5. 데이터베이스에 사용자 정보 저장
        User savedUser = userRepository.save(newUser);

        // 6. 이메일 인증 코드 생성 및 발송
        sendVerificationEmail(savedUser.getEmail());

        return savedUser;
    }

    private void sendVerificationEmail(String email) {
        String code = createVerificationCode();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(10);

        EmailVerification verification = EmailVerification.builder()
                .email(email)
                .code(code)
                .expiresAt(expiresAt)
                .build();
        emailVerificationRepository.save(verification);

        try {
            String htmlContent = readEmailTemplate();
            htmlContent = htmlContent.replace("{{VERIFICATION_CODE}}", code);
            emailService.sendVerificationEmail(email, "[devCampHub] 이메일 인증 코드 안내", htmlContent);
        } catch (IOException e) {
            // 로깅 또는 예외 처리
            throw new RuntimeException("이메일 템플릿을 읽는 중 오류가 발생했습니다.", e);
        }
    }

    private String createVerificationCode() {
        Random random = new Random();
        int number = 100000 + random.nextInt(900000);
        return String.valueOf(number);
    }

    private String readEmailTemplate() throws IOException {
        try (Reader reader = new InputStreamReader(emailTemplateResource.getInputStream(), StandardCharsets.UTF_8)) {
            return FileCopyUtils.copyToString(reader);
        }
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
