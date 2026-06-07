package com.cj.englishagenthub.user.presentation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;

public record SignupRequest(
        @Schema(example = "terecal@daum.net")
        @NotBlank(message = "이메일을 입력해주세요.")
        @Email(message = "올바른 이메일 형식이 아닙니다.")
        @Size(max = 255, message = "이메일은 255자 이하여야 합니다.")
        String email,

        @Schema(example = "password123")
        @NotBlank(message = "비밀번호를 입력해주세요.")
        @Pattern(
                regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,100}$",
                message = "비밀번호는 영문과 숫자를 포함한 8자 이상이어야 합니다."
        )
        String password,

        @Schema(example = "홍길동")
        @NotBlank(message = "사용자명을 입력해주세요.")
        @Size(min = 2, max = 50, message = "사용자명은 2~50자여야 합니다.")
        String username
) {}
