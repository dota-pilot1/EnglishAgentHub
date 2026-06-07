package com.cj.englishagenthub.permission.presentation.dto;

import com.cj.englishagenthub.permission.domain.Permission;
import com.cj.englishagenthub.permission_category.presentation.dto.PermissionCategorySummary;

import java.time.Instant;

public record PermissionResponse(
        Long id,
        String code,
        String name,
        String description,
        PermissionCategorySummary category,
        Instant createdAt
) {
    public static PermissionResponse from(Permission p) {
        return new PermissionResponse(
                p.getId(), p.getCode(), p.getName(), p.getDescription(),
                p.getCategory() != null ? PermissionCategorySummary.from(p.getCategory()) : null,
                p.getCreatedAt());
    }
}
