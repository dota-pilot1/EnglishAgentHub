package com.cj.englishagenthub.site_settings.presentation.dto;

import com.cj.englishagenthub.site_settings.domain.SiteSetting;

import java.time.Instant;

public record SiteSettingResponse(
        String heroImageUrl,
        String introTitle,
        String introSubtitle,
        Instant updatedAt
) {
    public static SiteSettingResponse from(SiteSetting s) {
        return new SiteSettingResponse(
                s.getHeroImageUrl(),
                s.getIntroTitle(),
                s.getIntroSubtitle(),
                s.getUpdatedAt()
        );
    }
}
