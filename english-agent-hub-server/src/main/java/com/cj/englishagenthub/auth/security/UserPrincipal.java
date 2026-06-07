package com.cj.englishagenthub.auth.security;

import com.cj.englishagenthub.user.domain.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Getter
public class UserPrincipal implements UserDetails {

    private final Long id;
    private final String email;
    private final String username;
    private final String passwordHash;
    private final String roleCode;
    private final List<String> permissions;
    private final boolean active;

    private UserPrincipal(Long id, String email, String username, String passwordHash, String roleCode, List<String> permissions, boolean active) {
        this.id = id;
        this.email = email;
        this.username = username;
        this.passwordHash = passwordHash;
        this.roleCode = roleCode;
        this.permissions = permissions;
        this.active = active;
    }

    public static UserPrincipal fromEntity(User u) {
        return new UserPrincipal(u.getId(), u.getEmail(), u.getUsername(), u.getPasswordHash(), u.getRole().getCode(), List.of(), u.isActive());
    }

    public static UserPrincipal fromClaims(Long id, String email, String username, String roleCode, List<String> permissions) {
        return new UserPrincipal(id, email, username, null, roleCode, permissions, true);
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        List<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority(roleCode));
        permissions.forEach(p -> authorities.add(new SimpleGrantedAuthority(p)));
        return authorities;
    }

    @Override public String getPassword()   { return passwordHash; }
    @Override public String getUsername()   { return email; }
    @Override public boolean isEnabled()    { return active; }
    @Override public boolean isAccountNonExpired()     { return true; }
    @Override public boolean isAccountNonLocked()      { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
}
