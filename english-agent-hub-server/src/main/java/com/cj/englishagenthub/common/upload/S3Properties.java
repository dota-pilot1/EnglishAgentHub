package com.cj.englishagenthub.common.upload;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "aws.s3")
public record S3Properties(
        String accessKey,
        String secretKey,
        String bucket,
        String region,
        String prefix,
        int presignExpiresSeconds
) {
    public boolean isConfigured() {
        return accessKey != null && !accessKey.isBlank()
                && secretKey != null && !secretKey.isBlank()
                && bucket != null && !bucket.isBlank()
                && region != null && !region.isBlank();
    }
}
