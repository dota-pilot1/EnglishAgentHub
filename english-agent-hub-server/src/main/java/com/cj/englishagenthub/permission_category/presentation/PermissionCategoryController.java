package com.cj.englishagenthub.permission_category.presentation;

import com.cj.englishagenthub.permission_category.application.PermissionCategoryService;
import com.cj.englishagenthub.permission_category.presentation.dto.CreatePermissionCategoryRequest;
import com.cj.englishagenthub.permission_category.presentation.dto.PermissionCategoryResponse;
import com.cj.englishagenthub.permission_category.presentation.dto.UpdatePermissionCategoryRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "권한 카테고리 관리")
@RestController
@RequestMapping("/api/permission-categories")
@RequiredArgsConstructor
public class PermissionCategoryController {

    private final PermissionCategoryService service;

    @GetMapping
    public List<PermissionCategoryResponse> list() {
        return service.findAll().stream().map(PermissionCategoryResponse::from).toList();
    }

    @GetMapping("/{id}")
    public PermissionCategoryResponse get(@PathVariable Long id) {
        return PermissionCategoryResponse.from(service.getById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PermissionCategoryResponse create(@Valid @RequestBody CreatePermissionCategoryRequest req) {
        return PermissionCategoryResponse.from(service.create(req));
    }

    @PatchMapping("/{id}")
    public PermissionCategoryResponse update(@PathVariable Long id,
                                             @Valid @RequestBody UpdatePermissionCategoryRequest req) {
        return PermissionCategoryResponse.from(service.update(id, req));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
