package com.cj.englishagenthub.role.application;

import com.cj.englishagenthub.common.exception.BusinessException;
import com.cj.englishagenthub.common.exception.ErrorCode;
import com.cj.englishagenthub.permission.domain.Permission;
import com.cj.englishagenthub.permission.infrastructure.PermissionRepository;
import com.cj.englishagenthub.role.domain.Role;
import com.cj.englishagenthub.role.infrastructure.RoleRepository;
import com.cj.englishagenthub.role.presentation.dto.CreateRoleRequest;
import com.cj.englishagenthub.role.presentation.dto.UpdateRoleRequest;
import com.cj.englishagenthub.user.infrastructure.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PermissionRepository permissionRepository;

    @Transactional(readOnly = true)
    public List<Role> findAll() {
        return roleRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Role getByCode(String code) {
        return roleRepository.findByCode(code)
                .orElseThrow(() -> new BusinessException(ErrorCode.ROLE_NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public Role getById(Long id) {
        return roleRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.ROLE_NOT_FOUND));
    }

    @Transactional
    public Role create(CreateRoleRequest req) {
        if (roleRepository.existsByCode(req.code())) {
            throw new BusinessException(ErrorCode.ROLE_CODE_DUPLICATE);
        }
        return roleRepository.save(Role.create(req.code(), req.name(), req.description(), false));
    }

    @Transactional
    public Role update(Long id, UpdateRoleRequest req) {
        Role role = getById(id);
        if (role.isSystemRole()) {
            throw new BusinessException(ErrorCode.ROLE_SYSTEM_READONLY);
        }
        role.rename(req.name(), req.description());
        return role;
    }

    @Transactional
    public void delete(Long id) {
        Role role = getById(id);
        if (role.isSystemRole()) {
            throw new BusinessException(ErrorCode.ROLE_SYSTEM_READONLY);
        }
        if (userRepository.existsByRoleId(id)) {
            throw new BusinessException(ErrorCode.ROLE_IN_USE);
        }
        roleRepository.delete(role);
    }

    @Transactional(readOnly = true)
    public Role getRoleWithPermissions(Long id) {
        return roleRepository.findByIdWithPermissions(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.ROLE_NOT_FOUND));
    }

    @Transactional
    public Role setPermissions(Long roleId, List<Long> permissionIds) {
        Role role = getById(roleId);
        Set<Permission> permissions = new HashSet<>(permissionRepository.findAllById(permissionIds));
        role.setPermissions(permissions);
        return role;
    }
}
