package devcamphub.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public final class LoginRequest {

    @NotBlank(message = "아이디 또는 이메일은 필수 항목입니다.")
    private final String loginId;

    @NotBlank(message = "비밀번호는 필수 항목입니다.")
    private final String password;

    public LoginRequest(String loginId, String password) {
        this.loginId = loginId;
        this.password = password;
    }
}
