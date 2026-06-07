package com.cj.englishagenthub.user.presentation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @Schema(example = "terecal@daum.net")
        @NotBlank(message = "이메일을 입력해주세요.")
        @Email(message = "올바른 이메일 형식이 아닙니다.")
        String email,

        @Schema(example = "password123!@")
        @NotBlank(message = "비밀번호를 입력해주세요.")
        String password
) {}
