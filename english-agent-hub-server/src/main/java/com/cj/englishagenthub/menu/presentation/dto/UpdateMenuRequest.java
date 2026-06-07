package com.cj.englishagenthub.menu.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateMenuRequest(
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
