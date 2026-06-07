package com.cj.englishagenthub.permission_category.application;

import com.cj.englishagenthub.common.exception.BusinessException;
import com.cj.englishagenthub.common.exception.ErrorCode;
import com.cj.englishagenthub.permission.infrastructure.PermissionRepository;
import com.cj.englishagenthub.permission_category.domain.PermissionCategory;
import com.cj.englishagenthub.permission_category.infrastructure.PermissionCategoryRepository;
import com.cj.englishagenthub.permission_category.presentation.dto.CreatePermissionCategoryRequest;
import com.cj.englishagenthub.permission_category.presentation.dto.UpdatePermissionCategoryRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PermissionCategoryService {

    private final PermissionCategoryRepository categoryRepository;
    private final PermissionRepository permissionRepository;

    @Transactional(readOnly = true)
    public List<PermissionCategory> findAll() {
        return categoryRepository.findAll(Sort.by("displayOrder"));
    }

    @Transactional(readOnly = true)
    public PermissionCategory getById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.PERMISSION_CATEGORY_NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public PermissionCategory getByCode(String code) {
        return categoryRepository.findByCode(code)
                .orElseThrow(() -> new BusinessException(ErrorCode.PERMISSION_CATEGORY_NOT_FOUND));
    }

    @Transactional
    public PermissionCategory create(CreatePermissionCategoryRequest req) {
        if (categoryRepository.existsByCode(req.code())) {
            throw new BusinessException(ErrorCode.PERMISSION_CATEGORY_CODE_DUPLICATE);
        }
        long nextOrder = categoryRepository.count() + 1;
        return categoryRepository.save(
                PermissionCategory.create(req.code(), req.name(), req.description(), (int) nextOrder));
    }

    @Transactional
    public PermissionCategory update(Long id, UpdatePermissionCategoryRequest req) {
        PermissionCategory category = getById(id);
        category.update(req.name(), req.description());
        return category;
    }

    @Transactional
    public void delete(Long id) {
        PermissionCategory category = getById(id);
        if (permissionRepository.existsByCategory(category)) {
            throw new BusinessException(ErrorCode.PERMISSION_CATEGORY_IN_USE);
        }
        categoryRepository.delete(category);
    }
}
