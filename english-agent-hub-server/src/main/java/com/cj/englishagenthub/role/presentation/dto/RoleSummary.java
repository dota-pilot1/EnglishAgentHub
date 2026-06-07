package com.cj.englishagenthub.role.presentation.dto;

import com.cj.englishagenthub.role.domain.Role;

public record RoleSummary(Long id, String code, String name) {
    public static RoleSummary from(Role r) {
        return new RoleSummary(r.getId(), r.getCode(), r.getName());
    }
}
