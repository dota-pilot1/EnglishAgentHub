package com.cj.englishagenthub.user.presentation.dto;

import com.cj.englishagenthub.role.presentation.dto.RoleSummary;
import com.cj.englishagenthub.user.domain.User;

import java.time.Instant;

public record UserListItemResponse(
        Long id,
        String email,
        String username,
        RoleSummary role,
        boolean active,
        Instant createdAt
) {
    public static UserListItemResponse from(User u) {
        return new UserListItemResponse(
                u.getId(),
                u.getEmail(),
                u.getUsername(),
                RoleSummary.from(u.getRole()),
                u.isActive(),
                u.getCreatedAt()
        );
    }
}
