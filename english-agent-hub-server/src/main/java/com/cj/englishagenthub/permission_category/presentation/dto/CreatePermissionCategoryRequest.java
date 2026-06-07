package com.cj.englishagenthub.permission_category.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreatePermissionCategoryRequest(
        @NotBlank
        @Pattern(regexp = "^[A-Z][A-Z0-9_]*$", message = "대문자/숫자/언더스코어 형식이어야 합니다.")
        @Size(max = 40)
        String code,

        @NotBlank @Size(max = 80)
        String name,

        @Size(max = 255)
        String description
) {}
