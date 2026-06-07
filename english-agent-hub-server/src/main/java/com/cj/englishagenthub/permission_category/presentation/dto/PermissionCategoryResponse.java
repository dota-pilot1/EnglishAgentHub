package com.cj.englishagenthub.permission_category.presentation.dto;

import com.cj.englishagenthub.permission_category.domain.PermissionCategory;

import java.time.Instant;

public record PermissionCategoryResponse(
        Long id,
        String code,
        String name,
        String description,
        Integer displayOrder,
        Instant createdAt
) {
    public static PermissionCategoryResponse from(PermissionCategory c) {
        return new PermissionCategoryResponse(
                c.getId(), c.getCode(), c.getName(),
                c.getDescription(), c.getDisplayOrder(), c.getCreatedAt());
    }
}
