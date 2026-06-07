package com.cj.englishagenthub.config;

import com.cj.englishagenthub.permission.domain.Permission;
import com.cj.englishagenthub.permission.infrastructure.PermissionRepository;
import com.cj.englishagenthub.permission_category.domain.PermissionCategory;
import com.cj.englishagenthub.permission_category.infrastructure.PermissionCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@Order(3)
@RequiredArgsConstructor
public class PermissionSeeder implements ApplicationRunner {

    private final PermissionRepository permissionRepository;
    private final PermissionCategoryRepository categoryRepository;

    private record PermDef(String code, String name, String description, String categoryCode) {}

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<PermDef> seeds = List.of(
                new PermDef("USER_VIEW",        "사용자 조회",     "유저 목록/상세 페이지 접근",       "USER"),
                new PermDef("USER_EDIT",        "사용자 수정",     "유저 프로필·롤·활성 상태 변경",    "USER"),
                new PermDef("USER_DELETE",      "사용자 삭제",     "유저 계정 삭제",                  "USER"),
                new PermDef("ROLE_VIEW",        "롤 조회",        "롤 목록/상세 페이지 접근",          "ROLE"),
                new PermDef("ROLE_EDIT",        "롤 수정/등록",   "롤 생성·수정",                    "ROLE"),
                new PermDef("ROLE_DELETE",      "롤 삭제",        "커스텀 롤 삭제",                  "ROLE"),
                new PermDef("PERMISSION_VIEW",  "권한 조회",      "권한 목록/상세 페이지 접근",        "PERMISSION"),
                new PermDef("PERMISSION_EDIT",  "권한 수정/등록", "권한 생성·수정",                   "PERMISSION"),
                new PermDef("PERMISSION_DELETE","권한 삭제",      "권한 삭제",                       "PERMISSION")
        );

        for (PermDef seed : seeds) {
            PermissionCategory cat = categoryRepository.findByCode(seed.categoryCode())
                    .orElseThrow(() -> new IllegalStateException("Category not found: " + seed.categoryCode()));

            permissionRepository.findByCode(seed.code()).ifPresentOrElse(
                    existing -> existing.updateCategory(cat),
                    () -> permissionRepository.save(
                            Permission.create(seed.code(), seed.name(), seed.description(), cat))
            );
        }
    }
}
