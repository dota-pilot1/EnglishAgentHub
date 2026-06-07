package com.cj.englishagenthub.permission.domain;

import com.cj.englishagenthub.permission_category.domain.PermissionCategory;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "permissions", uniqueConstraints = @UniqueConstraint(columnNames = "code"))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80, unique = true)
    private String code;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(length = 255)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private PermissionCategory category;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public static Permission create(String code, String name, String description, PermissionCategory category) {
        Permission p = new Permission();
        p.code = code;
        p.name = name;
        p.description = description;
        p.category = category;
        return p;
    }

    public void update(String name, String description, PermissionCategory category) {
        this.name = name;
        this.description = description;
        this.category = category;
    }

    public void updateCategory(PermissionCategory category) {
        this.category = category;
    }
}
