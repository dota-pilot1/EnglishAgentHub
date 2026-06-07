package com.cj.englishagenthub.user.application;

import com.cj.englishagenthub.auth.infrastructure.RefreshTokenRepository;
import com.cj.englishagenthub.common.exception.BusinessException;
import com.cj.englishagenthub.common.exception.DuplicateEmailException;
import com.cj.englishagenthub.common.exception.ErrorCode;
import com.cj.englishagenthub.role.application.RoleService;
import com.cj.englishagenthub.role.domain.Role;
import com.cj.englishagenthub.user.domain.User;
import com.cj.englishagenthub.user.infrastructure.UserRepository;
import com.cj.englishagenthub.user.presentation.dto.CreateUserRequest;
import com.cj.englishagenthub.user.presentation.dto.UpdateUserRequest;
import com.cj.englishagenthub.user.presentation.dto.UserListItemResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserManagementService {

    private final UserRepository userRepository;
    private final RoleService roleService;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenRepository refreshTokenRepository;

    @Transactional(readOnly = true)
    public Page<UserListItemResponse> getUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(UserListItemResponse::from);
    }

    @Transactional(readOnly = true)
    public UserListItemResponse getUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return UserListItemResponse.from(user);
    }

    @Transactional
    public UserListItemResponse createUser(CreateUserRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new DuplicateEmailException();
        }
        Role role = roleService.getById(req.roleId());
        String hash = passwordEncoder.encode(req.password());
        User saved = userRepository.save(User.createNewUser(req.email(), hash, req.username(), role));
        return UserListItemResponse.from(saved);
    }

    @Transactional
    public UserListItemResponse updateProfile(Long userId, UpdateUserRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        if (!user.getEmail().equals(req.email()) && userRepository.existsByEmail(req.email())) {
            throw new DuplicateEmailException();
        }
        user.updateProfile(req.email(), req.username());
        return UserListItemResponse.from(user);
    }

    @Transactional
    public UserListItemResponse changeRole(Long userId, Long roleId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        Role newRole = roleService.getById(roleId);
        user.changeRole(newRole);
        return UserListItemResponse.from(user);
    }

    @Transactional
    public UserListItemResponse toggleActive(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        user.toggleActive();
        return UserListItemResponse.from(user);
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        refreshTokenRepository.deleteByUserId(userId);
        userRepository.delete(user);
    }
}
