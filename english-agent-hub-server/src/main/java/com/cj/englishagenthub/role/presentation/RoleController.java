package com.cj.englishagenthub.role.presentation;

import com.cj.englishagenthub.permission.presentation.dto.PermissionSummary;
import com.cj.englishagenthub.role.application.RoleService;
import com.cj.englishagenthub.role.presentation.dto.CreateRoleRequest;
import com.cj.englishagenthub.role.presentation.dto.RoleResponse;
import com.cj.englishagenthub.role.presentation.dto.UpdateRoleRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
@Tag(name = "Role", description = "롤(역할) CRUD")
public class RoleController {

    private final RoleService roleService;

    @GetMapping
    @Operation(summary = "전체 롤 목록 조회")
    public List<RoleResponse> list() {
        return roleService.findAll().stream().map(RoleResponse::from).toList();
    }

    @GetMapping("/{id}")
    @Operation(summary = "롤 상세 조회 (권한 포함)")
    public RoleResponse get(@PathVariable Long id) {
        return RoleResponse.from(roleService.getRoleWithPermissions(id));
    }

    @PostMapping
    @Operation(summary = "롤 등록")
    public ResponseEntity<RoleResponse> create(@Valid @RequestBody CreateRoleRequest req) {
        RoleResponse created = RoleResponse.from(roleService.create(req));
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/{id}")
    @Operation(summary = "롤 수정 (시스템 롤은 불가)")
    public RoleResponse update(@PathVariable Long id, @Valid @RequestBody UpdateRoleRequest req) {
        return RoleResponse.from(roleService.update(id, req));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "롤 삭제 (시스템 롤 및 사용 중 롤은 불가)")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        roleService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/permissions")
    @Operation(summary = "롤에 할당된 권한 목록")
    public List<PermissionSummary> getPermissions(@PathVariable Long id) {
        return roleService.getRoleWithPermissions(id).getPermissions().stream()
                .map(PermissionSummary::from)
                .toList();
    }

    @PutMapping("/{id}/permissions")
    @Operation(summary = "롤 권한 일괄 교체")
    public RoleResponse setPermissions(@PathVariable Long id,
                                       @RequestBody List<Long> permissionIds) {
        return RoleResponse.from(roleService.setPermissions(id, permissionIds));
    }
}
