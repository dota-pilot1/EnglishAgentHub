package com.cj.englishagenthub.permission_category.infrastructure;

import com.cj.englishagenthub.permission_category.domain.PermissionCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PermissionCategoryRepository extends JpaRepository<PermissionCategory, Long> {
    boolean existsByCode(String code);
    Optional<PermissionCategory> findByCode(String code);
}
