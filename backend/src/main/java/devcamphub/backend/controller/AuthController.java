package devcamphub.backend.controller;

import devcamphub.backend.domain.User;
import devcamphub.backend.dto.RegistrationRequest;
import devcamphub.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<String> registerUser(@Valid @RequestBody RegistrationRequest request) {
        User newUser = userService.registerUser(request);

        // 성공 시, 생성된 리소스의 위치(URI)와 함께 201 Created 상태를 반환합니다.
        // 여기서는 간단하게 성공 메시지를 반환합니다.
        return ResponseEntity.created(URI.create("/api/users/" + newUser.getId()))
                .body("회원가입이 성공적으로 완료되었습니다.");
    }

    // 앞으로 여기에 /api/auth/login 엔드포인트 등이 추가될 예정입니다.
}
