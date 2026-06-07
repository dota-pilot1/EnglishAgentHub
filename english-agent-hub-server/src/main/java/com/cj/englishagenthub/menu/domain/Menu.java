package com.cj.englishagenthub.menu.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "menus", uniqueConstraints = @UniqueConstraint(columnNames = "code"))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Menu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100, unique = true)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Menu parent;

    @Column(nullable = false, length = 100)
    private String label;

    @Column(length = 100)
    private String labelKey;

    @Column(length = 255)
    private String path;

    @Column(length = 100)
    private String icon;

    @Column(nullable = false)
    private boolean isExternal = false;

    @Column(length = 100)
    private String requiredRole;

    @Column(length = 100)
    private String requiredPermission;

    @Column(nullable = false)
    private boolean visible = true;

    @Column(nullable = false)
    private int displayOrder = 0;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public static Menu create(
            String code,
            Menu parent,
            String label,
            String labelKey,
            String path,
            String icon,
            boolean isExternal,
            String requiredRole,
            String requiredPermission,
            boolean visible,
            int displayOrder
    ) {
        Menu m = new Menu();
        m.code = code;
        m.parent = parent;
        m.label = label;
        m.labelKey = labelKey;
        m.path = path;
        m.icon = icon;
        m.isExternal = isExternal;
        m.requiredRole = requiredRole;
        m.requiredPermission = requiredPermission;
        m.visible = visible;
        m.displayOrder = displayOrder;
        return m;
    }

    public void update(
            Menu parent,
            String label,
            String labelKey,
            String path,
            String icon,
            boolean isExternal,
            String requiredRole,
            String requiredPermission,
            boolean visible,
            int displayOrder
    ) {
        this.parent = parent;
        this.label = label;
        this.labelKey = labelKey;
        this.path = path;
        this.icon = icon;
        this.isExternal = isExternal;
        this.requiredRole = requiredRole;
        this.requiredPermission = requiredPermission;
        this.visible = visible;
        this.displayOrder = displayOrder;
    }
}
