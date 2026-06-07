package com.cj.englishagenthub.site_settings.presentation;

import com.cj.englishagenthub.site_settings.application.SiteSettingService;
import com.cj.englishagenthub.site_settings.presentation.dto.SiteSettingResponse;
import com.cj.englishagenthub.site_settings.presentation.dto.UpdateSiteSettingRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/site-settings")
@RequiredArgsConstructor
@Tag(name = "Site Settings", description = "대문 이미지·소개 문구 등 사이트 전역 설정")
public class SiteSettingController {

    private final SiteSettingService service;

    @GetMapping
    @Operation(summary = "사이트 설정 조회 (공개)")
    public SiteSettingResponse get() {
        return service.get();
    }

    @PutMapping
    @Operation(summary = "사이트 설정 수정 (ROLE_ADMIN 전용)")
    @PreAuthorize("hasRole('ADMIN')")
    public SiteSettingResponse update(@Valid @RequestBody UpdateSiteSettingRequest request) {
        return service.update(request);
    }
}
