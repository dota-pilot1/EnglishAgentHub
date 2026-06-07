package com.cj.englishagenthub.user.infrastructure;

import com.cj.englishagenthub.user.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByRoleCode(String code);
    boolean existsByRoleId(Long roleId);
    Page<User> findAll(Pageable pageable);
}
