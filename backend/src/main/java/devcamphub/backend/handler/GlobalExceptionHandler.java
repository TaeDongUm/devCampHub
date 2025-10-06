package devcamphub.backend.handler;

import devcamphub.backend.dto.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 비즈니스 로직 상의 예외를 처리합니다. (예: 중복된 이메일, 잘못된 요청 등)
     * 
     * @param ex 처리할 예외
     * @return 400 Bad Request 상태 코드와 에러 메시지를 담은 응답
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(IllegalArgumentException ex) {
        ErrorResponse errorResponse = new ErrorResponse(ex.getMessage());
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    // 앞으로 여기에 다른 종류의 예외 핸들러(예: 권한 없음 - 403, 리소스 없음 - 404 등)를 추가할 수 있습니다.
}
