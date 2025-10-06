package devcamphub.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public final class LoginRequest {

    @NotBlank(message = "이메일은 필수 항목입니다.")
    @Email(message = "유효한 이메일 형식이 아닙니다.")
    private final String email;

    @NotBlank(message = "비밀번호는 필수 항목입니다.")
    private final String password;

    public LoginRequest(String email, String password) {
        this.email = email;
        this.password = password;
    }
}
