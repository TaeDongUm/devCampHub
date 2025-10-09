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
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
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
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final EmailVerificationRepository emailVerificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    @Value("classpath:templates/verification-email.html")
    private ClassPathResource emailTemplateResource;

    @Transactional
    public void sendVerificationCode(String email) {
        // 진행중인 유효한 인증이 있는지 확인하고, 있다면 삭제
        emailVerificationRepository.findByEmail(email)
                .ifPresent(emailVerificationRepository::delete);

        String code = createVerificationCode();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(10); // 10분 후 만료

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
            throw new RuntimeException("이메일 템플릿을 읽는 중 오류가 발생했습니다.", e);
        }
    }

    @Transactional
    public User registerUser(RegistrationRequest request) {
        // 1. 이메일 인증 코드 검증
        verifyEmailCode(request.getEmail(), request.getVerificationCode());

        // 2. 이메일 중복 확인
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        // 3. 닉네임 중복 확인
        if (userRepository.existsByNickname(request.getNickname())) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
        }

        // 4. 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        // 5. DTO를 User 엔티티로 변환
        User newUser = User.builder()
                .email(request.getEmail())
                .password(encodedPassword)
                .nickname(request.getNickname())
                .role(request.getRole())
                .build();

        // 6. 데이터베이스에 저장
        return userRepository.save(newUser);
    }

    private void verifyEmailCode(String email, String code) {
        EmailVerification verification = emailVerificationRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("인증 코드가 발송되지 않은 이메일입니다."));

        if (verification.getExpiresAt().isBefore(LocalDateTime.now())) {
            emailVerificationRepository.delete(verification);
            throw new IllegalArgumentException("인증 코드가 만료되었습니다.");
        }

        if (!verification.getCode().equals(code)) {
            throw new IllegalArgumentException("인증 코드가 일치하지 않습니다.");
        }

        // 인증 성공 시, 인증 기록 삭제
        emailVerificationRepository.delete(verification);
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
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String accessToken = jwtUtil.generateAccessToken(userDetails);
        String refreshToken = jwtUtil.generateRefreshToken(userDetails);
        return new LoginResponse(accessToken, refreshToken);
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + email));
    }
}
