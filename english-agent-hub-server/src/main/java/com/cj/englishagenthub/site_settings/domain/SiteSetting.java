package com.cj.englishagenthub.site_settings.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "site_settings")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SiteSetting {

    public static final long SINGLETON_ID = 1L;

    @Id
    private Long id;

    @Column(length = 1024)
    private String heroImageUrl;

    @Column(length = 200)
    private String introTitle;

    @Column(length = 500)
    private String introSubtitle;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public static SiteSetting createDefault() {
        SiteSetting s = new SiteSetting();
        s.id = SINGLETON_ID;
        s.heroImageUrl = null;
        s.introTitle = "팀을 위한\n깔끔한 인증 보일러플레이트";
        s.introSubtitle =
                "Spring Boot + Next.js 기반. 회원·역할·권한까지 갖춘 스타터 템플릿.";
        return s;
    }

    public void update(String heroImageUrl, String introTitle, String introSubtitle) {
        this.heroImageUrl = heroImageUrl;
        this.introTitle = introTitle;
        this.introSubtitle = introSubtitle;
    }
}
