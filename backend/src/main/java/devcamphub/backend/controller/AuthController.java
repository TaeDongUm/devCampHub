package devcamphub.backend.controller;

import devcamphub.backend.dto.EmailRequest;
import devcamphub.backend.dto.LoginRequest;
import devcamphub.backend.dto.LoginResponse;
import devcamphub.backend.dto.RegistrationRequest;
import devcamphub.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @PostMapping("/send-verification-code")
    public ResponseEntity<String> sendVerificationCode(@Valid @RequestBody EmailRequest request) {
        userService.sendVerificationCode(request.getEmail());
        return ResponseEntity.ok("인증 코드가 성공적으로 발송되었습니다.");
    }

    @PostMapping("/register")
    public ResponseEntity<String> registerUser(@Valid @RequestBody RegistrationRequest request) {
        userService.registerUser(request);
        return ResponseEntity.ok("회원가입이 성공적으로 완료되었습니다.");
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse loginResponse = userService.login(request);
        return ResponseEntity.ok(loginResponse);
    }
}
