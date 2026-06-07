package com.cj.englishagenthub.menu.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateMenuRequest(
        @NotBlank
        @Pattern(regexp = "^[A-Z][A-Z0-9_]*$", message = "코드는 대문자/숫자/언더스코어 형식이어야 합니다.")
        @Size(max = 100)
        String code,

        Long parentId,

        @NotBlank
        @Size(max = 100)
        String label,

        @Size(max = 100)
        String labelKey,

        @Size(max = 255)
        String path,

        @Size(max = 100)
        String icon,

        boolean isExternal,

        @Size(max = 100)
        String requiredRole,

        @Size(max = 100)
        String requiredPermission,

        boolean visible,

        int displayOrder
) {
}
