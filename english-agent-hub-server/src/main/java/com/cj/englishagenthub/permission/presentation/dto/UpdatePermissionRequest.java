package com.cj.englishagenthub.permission.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdatePermissionRequest(
        @NotBlank @Size(max = 80)
        String name,

        @Size(max = 255)
        String description,

        @NotBlank
        String categoryCode
) {}
