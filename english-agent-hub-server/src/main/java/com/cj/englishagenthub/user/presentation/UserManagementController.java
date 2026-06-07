package com.cj.englishagenthub.user.presentation;

import com.cj.englishagenthub.user.application.UserManagementService;
import com.cj.englishagenthub.user.presentation.dto.ChangeRoleRequest;
import com.cj.englishagenthub.user.presentation.dto.CreateUserRequest;
import com.cj.englishagenthub.user.presentation.dto.UpdateUserRequest;
import com.cj.englishagenthub.user.presentation.dto.UserListItemResponse;
import com.cj.englishagenthub.user.presentation.dto.UserPageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "User Management", description = "유저 CRUD 및 롤/활성 상태 관리 (ROLE_ADMIN 전용)")
public class UserManagementController {

    private final UserManagementService userManagementService;

    @GetMapping
    @Operation(summary = "유저 목록 조회 (페이지네이션)")
    public UserPageResponse list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<UserListItemResponse> p = userManagementService.getUsers(
                PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "id"))
        );
        return UserPageResponse.from(p);
    }

    @GetMapping("/{userId}")
    @Operation(summary = "유저 상세 조회")
    public UserListItemResponse get(@PathVariable Long userId) {
        return userManagementService.getUser(userId);
    }

    @PostMapping
    @Operation(summary = "유저 등록")
    public ResponseEntity<UserListItemResponse> create(@Valid @RequestBody CreateUserRequest request) {
        UserListItemResponse created = userManagementService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/{userId}")
    @Operation(summary = "유저 프로필 수정 (email, username)")
    public UserListItemResponse update(
            @PathVariable Long userId,
            @Valid @RequestBody UpdateUserRequest request
    ) {
        return userManagementService.updateProfile(userId, request);
    }

    @PatchMapping("/{userId}/role")
    @Operation(summary = "유저 롤 변경")
    public UserListItemResponse changeRole(
            @PathVariable Long userId,
            @Valid @RequestBody ChangeRoleRequest request
    ) {
        return userManagementService.changeRole(userId, request.roleId());
    }

    @PatchMapping("/{userId}/active")
    @Operation(summary = "유저 활성/비활성 토글")
    public UserListItemResponse toggleActive(@PathVariable Long userId) {
        return userManagementService.toggleActive(userId);
    }

    @DeleteMapping("/{userId}")
    @Operation(summary = "유저 삭제")
    public ResponseEntity<Void> delete(@PathVariable Long userId) {
        userManagementService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }
}
