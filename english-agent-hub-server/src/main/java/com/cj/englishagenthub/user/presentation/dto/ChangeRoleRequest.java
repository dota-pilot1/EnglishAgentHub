package com.cj.englishagenthub.user.presentation.dto;

import jakarta.validation.constraints.NotNull;

public record ChangeRoleRequest(@NotNull Long roleId) {
}
