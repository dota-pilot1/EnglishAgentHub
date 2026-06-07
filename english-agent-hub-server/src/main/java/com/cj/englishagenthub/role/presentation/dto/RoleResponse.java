package com.cj.englishagenthub.role.presentation.dto;

import com.cj.englishagenthub.permission.presentation.dto.PermissionSummary;
import com.cj.englishagenthub.role.domain.Role;

import java.util.List;

public record RoleResponse(
        Long id,
        String code,
        String name,
        String description,
        boolean systemRole,
        List<PermissionSummary> permissions
) {
    public static RoleResponse from(Role r) {
        List<PermissionSummary> perms = r.getPermissions().stream()
                .map(PermissionSummary::from)
                .toList();
        return new RoleResponse(r.getId(), r.getCode(), r.getName(),
                r.getDescription(), r.isSystemRole(), perms);
    }
}
