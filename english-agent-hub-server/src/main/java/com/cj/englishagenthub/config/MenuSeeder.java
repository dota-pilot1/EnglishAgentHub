package com.cj.englishagenthub.config;

import com.cj.englishagenthub.menu.domain.Menu;
import com.cj.englishagenthub.menu.infrastructure.MenuRepository;
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
@Order(4)
@RequiredArgsConstructor
public class MenuSeeder implements ApplicationRunner {

    private final MenuRepository menuRepository;

    private record MenuDef(
            String code, String parentCode, String label, String labelKey,
            String path, String icon, String requiredRole, int displayOrder
    ) {}

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<MenuDef> defs = List.of(
                new MenuDef("DASHBOARD",             null,    "대시보드",      "nav.dashboard",        "/dashboard",        "LayoutDashboard", null,                    0),
                new MenuDef("ADMIN",                 null,    "관리",          "nav.admin",            null,                "Settings",        RoleSeeder.ROLE_ADMIN,   1),
                new MenuDef("ADMIN_USERS",           "ADMIN", "유저 관리",     "nav.users",            "/users",            "Users",           RoleSeeder.ROLE_ADMIN,   0),
                new MenuDef("ADMIN_ROLE_PERMISSIONS","ADMIN", "역할-권한 매핑","nav.rolePermissions",  "/role-permissions", "ShieldCheck",     RoleSeeder.ROLE_ADMIN,   1),
                new MenuDef("ADMIN_SITE_SETTINGS",   "ADMIN", "메인 관리",     "nav.siteSettings",     "/site-settings",   "LayoutDashboard", RoleSeeder.ROLE_ADMIN,   2),
                new MenuDef("ADMIN_MENU_MANAGEMENT", "ADMIN", "메뉴 관리",     "nav.menuManagement",   "/menu-management",  "Menu",            RoleSeeder.ROLE_ADMIN,   3)
        );

        for (MenuDef def : defs) {
            if (menuRepository.existsByCode(def.code())) continue;
            Menu parent = def.parentCode() != null
                    ? menuRepository.findByCode(def.parentCode()).orElse(null)
                    : null;
            menuRepository.save(Menu.create(
                    def.code(), parent, def.label(), def.labelKey(),
                    def.path(), def.icon(), false,
                    def.requiredRole(), null, true, def.displayOrder()
            ));
            log.info("Seeded menu: {}", def.code());
        }
    }
}
