package com.cj.englishagenthub.permission.presentation;

import com.cj.englishagenthub.permission.application.PermissionService;
import com.cj.englishagenthub.permission.presentation.dto.CreatePermissionRequest;
import com.cj.englishagenthub.permission.presentation.dto.PermissionResponse;
import com.cj.englishagenthub.permission.presentation.dto.UpdatePermissionRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "권한 관리")
@RestController
@RequestMapping("/api/permissions")
@RequiredArgsConstructor
public class PermissionController {

    private final PermissionService permissionService;

    @GetMapping
    public List<PermissionResponse> list(@RequestParam(required = false) String category) {
        return permissionService.findAll(category).stream()
                .map(PermissionResponse::from)
                .toList();
    }

    @GetMapping("/{id}")
    public PermissionResponse get(@PathVariable Long id) {
        return PermissionResponse.from(permissionService.getById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PermissionResponse create(@Valid @RequestBody CreatePermissionRequest req) {
        return PermissionResponse.from(permissionService.create(req));
    }

    @PatchMapping("/{id}")
    public PermissionResponse update(@PathVariable Long id,
                                     @Valid @RequestBody UpdatePermissionRequest req) {
        return PermissionResponse.from(permissionService.update(id, req));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        permissionService.delete(id);
    }
}
