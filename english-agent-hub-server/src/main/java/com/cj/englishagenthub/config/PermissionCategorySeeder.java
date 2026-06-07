package com.cj.englishagenthub.config;

import com.cj.englishagenthub.permission_category.domain.PermissionCategory;
import com.cj.englishagenthub.permission_category.infrastructure.PermissionCategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class PermissionCategorySeeder implements ApplicationRunner {

    private final PermissionCategoryRepository categoryRepository;

    private record CategoryDef(String code, String name, String description, int order) {}

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<CategoryDef> seeds = List.of(
                new CategoryDef("USER",       "사용자",   "유저 계정 관련 권한",         1),
                new CategoryDef("ROLE",       "롤",      "롤 관리 관련 권한",           2),
                new CategoryDef("PERMISSION", "권한",    "권한 관리 관련 권한",          3),
                new CategoryDef("DASHBOARD",  "대시보드", "대시보드 관련 권한",           4),
                new CategoryDef("REPORT",     "리포트",  "리포트/통계 관련 권한",        5),
                new CategoryDef("SYSTEM",     "시스템",  "시스템 설정 관련 권한",        6)
        );

        for (CategoryDef def : seeds) {
            if (!categoryRepository.existsByCode(def.code())) {
                categoryRepository.save(
                        PermissionCategory.create(def.code(), def.name(), def.description(), def.order()));
                log.info("Seeded permission category: {}", def.code());
            }
        }
    }
}
