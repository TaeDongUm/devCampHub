package devcamphub.backend.dto;

import devcamphub.backend.domain.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;

/**
 * 회원가입 요청 데이터를 담는 DTO (Data Transfer Object) 입니다.
 * Java 16 이상의 record를 사용하면 아래 코드를 단 한 줄로 줄일 수 있습니다.
 * public record RegistrationRequest(String email, String password, String
 * nickname, Role role) {}
 */
@Getter
public final class RegistrationRequest {

    @NotBlank(message = "이메일은 필수 항목입니다.")
    @Email(message = "유효한 이메일 형식이 아닙니다.")
    private final String email;

    @NotBlank(message = "비밀번호는 필수 항목입니다.")
    @Size(min = 8, message = "비밀번호는 최소 8자 이상이어야 합니다.")
    private final String password;

    @NotBlank(message = "닉네임은 필수 항목입니다.")
    @Size(min = 2, max = 50, message = "닉네임은 2자 이상 50자 이하이어야 합니다.")
    private final String nickname;

    @NotNull(message = "역할은 필수 항목입니다.")
    private final Role role;

    public RegistrationRequest(String email, String password, String nickname, Role role) {
        this.email = email;
        this.password = password;
        this.nickname = nickname;
        this.role = role;
    }
}
