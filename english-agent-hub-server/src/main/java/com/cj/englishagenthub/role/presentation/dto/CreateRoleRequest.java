package com.cj.englishagenthub.role.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateRoleRequest(
        @NotBlank
        @Pattern(regexp = "^ROLE_[A-Z][A-Z0-9_]*$", message = "코드는 ROLE_대문자/숫자/언더스코어 형식이어야 합니다.")
        @Size(max = 50)
        String code,

        @NotBlank
        @Size(max = 50)
        String name,

        @Size(max = 255)
        String description
) {
}
