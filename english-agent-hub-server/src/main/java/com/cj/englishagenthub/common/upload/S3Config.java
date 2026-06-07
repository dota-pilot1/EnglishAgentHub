package com.cj.englishagenthub.common.upload;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

@Configuration
@EnableConfigurationProperties(S3Properties.class)
public class S3Config {

    @Bean
    public S3Client s3Client(S3Properties props) {
        if (!props.isConfigured()) {
            return S3Client.builder()
                    .region(Region.of(props.region() != null ? props.region() : "ap-northeast-2"))
                    .build();
        }
        return S3Client.builder()
                .region(Region.of(props.region()))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(props.accessKey(), props.secretKey())
                ))
                .build();
    }

    @Bean
    public S3Presigner s3Presigner(S3Properties props) {
        if (!props.isConfigured()) {
            return S3Presigner.builder()
                    .region(Region.of(props.region() != null ? props.region() : "ap-northeast-2"))
                    .build();
        }
        return S3Presigner.builder()
                .region(Region.of(props.region()))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(props.accessKey(), props.secretKey())
                ))
                .build();
    }
}
