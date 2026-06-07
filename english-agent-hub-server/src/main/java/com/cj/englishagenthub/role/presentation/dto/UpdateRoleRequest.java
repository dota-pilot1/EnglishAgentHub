package com.cj.englishagenthub.role.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateRoleRequest(
        @NotBlank
        @Size(max = 50)
        String name,

        @Size(max = 255)
        String description
) {
}
