package com.cj.englishagenthub.site_settings.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateSiteSettingRequest(
        @Size(max = 1024)
        String heroImageUrl,

        @NotBlank
        @Size(max = 200)
        String introTitle,

        @NotBlank
        @Size(max = 500)
        String introSubtitle
) {}
