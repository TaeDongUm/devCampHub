package devcamphub.backend.service;

import devcamphub.backend.domain.User;
import devcamphub.backend.dto.RegistrationRequest;
import devcamphub.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor // final 필드에 대한 생성자를 자동으로 생성합니다.
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public User registerUser(RegistrationRequest request) {
        // 1. 이메일 중복 확인
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        // 2. 닉네임 중복 확인
        if (userRepository.existsByNickname(request.nickname())) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
        }

        // 3. 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(request.password());

        // 4. DTO를 User 엔티티로 변환
        User newUser = User.builder()
                .email(request.email())
                .password(encodedPassword)
                .nickname(request.nickname())
                .role(request.role())
                .build();

        // 5. 데이터베이스에 저장
        return userRepository.save(newUser);
    }
}
