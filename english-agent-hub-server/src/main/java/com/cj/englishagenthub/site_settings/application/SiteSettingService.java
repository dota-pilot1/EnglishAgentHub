package com.cj.englishagenthub.site_settings.application;

import com.cj.englishagenthub.site_settings.domain.SiteSetting;
import com.cj.englishagenthub.site_settings.infrastructure.SiteSettingRepository;
import com.cj.englishagenthub.site_settings.presentation.dto.SiteSettingResponse;
import com.cj.englishagenthub.site_settings.presentation.dto.UpdateSiteSettingRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SiteSettingService {

    private final SiteSettingRepository repository;

    @Transactional(readOnly = true)
    public SiteSettingResponse get() {
        SiteSetting setting = repository.findById(SiteSetting.SINGLETON_ID)
                .orElseGet(SiteSetting::createDefault);
        return SiteSettingResponse.from(setting);
    }

    @Transactional
    public SiteSettingResponse update(UpdateSiteSettingRequest request) {
        SiteSetting setting = repository.findById(SiteSetting.SINGLETON_ID)
                .orElseGet(() -> repository.save(SiteSetting.createDefault()));
        setting.update(request.heroImageUrl(), request.introTitle(), request.introSubtitle());
        SiteSetting saved = repository.save(setting);
        return SiteSettingResponse.from(saved);
    }
}
