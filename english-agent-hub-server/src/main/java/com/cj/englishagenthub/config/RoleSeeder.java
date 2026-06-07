package com.cj.englishagenthub.config;

import com.cj.englishagenthub.role.domain.Role;
import com.cj.englishagenthub.role.infrastructure.RoleRepository;
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
@Order(2)
@RequiredArgsConstructor
public class RoleSeeder implements ApplicationRunner {

    public static final String ROLE_USER = "ROLE_USER";
    public static final String ROLE_MANAGER = "ROLE_MANAGER";
    public static final String ROLE_ADMIN = "ROLE_ADMIN";

    private final RoleRepository roleRepository;

    private record RoleDef(String code, String name, String description) {}

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<RoleDef> defaults = List.of(
                new RoleDef(ROLE_USER, "일반 사용자", "기본 가입자 롤"),
                new RoleDef(ROLE_MANAGER, "매니저", "중간 관리자 롤"),
                new RoleDef(ROLE_ADMIN, "관리자", "시스템 전체 관리자")
        );
        for (RoleDef def : defaults) {
            if (!roleRepository.existsByCode(def.code())) {
                roleRepository.save(Role.create(def.code(), def.name(), def.description(), true));
                log.info("Seeded role: {} ({})", def.code(), def.name());
            }
        }
    }
}
