package com.cj.englishagenthub.user.presentation.dto;

import org.springframework.data.domain.Page;

import java.util.List;

public record UserPageResponse(
        List<UserListItemResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
    public static UserPageResponse from(Page<UserListItemResponse> p) {
        return new UserPageResponse(
                p.getContent(),
                p.getNumber(),
                p.getSize(),
                p.getTotalElements(),
                p.getTotalPages()
        );
    }
}
