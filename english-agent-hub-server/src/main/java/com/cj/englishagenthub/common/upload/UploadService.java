package com.cj.englishagenthub.common.upload;

import com.cj.englishagenthub.common.exception.BusinessException;
import com.cj.englishagenthub.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UploadService {

    private final S3Properties props;
    private final S3Presigner presigner;

    public PresignResponse presign(String filename, String contentType, String folder) {
        if (!props.isConfigured()) {
            throw new BusinessException(ErrorCode.UPLOAD_NOT_CONFIGURED);
        }

        String safeName = sanitize(filename);
        String objectKey = buildKey(folder, safeName);

        PutObjectRequest objectRequest = PutObjectRequest.builder()
                .bucket(props.bucket())
                .key(objectKey)
                .contentType(contentType)
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofSeconds(props.presignExpiresSeconds()))
                .putObjectRequest(objectRequest)
                .build();

        String presignedUrl = presigner.presignPutObject(presignRequest).url().toString();
        String publicUrl = buildPublicUrl(objectKey);

        return new PresignResponse(presignedUrl, publicUrl, objectKey);
    }

    private String sanitize(String filename) {
        String base = (filename == null || filename.isBlank()) ? "file" : filename;
        String lower = base.toLowerCase(Locale.ROOT);
        String cleaned = lower.replaceAll("[^a-z0-9._-]", "-");
        return UUID.randomUUID() + "-" + cleaned;
    }

    private String buildKey(String folder, String safeName) {
        String root = (props.prefix() == null || props.prefix().isBlank()) ? "" : props.prefix() + "/";
        String sub = (folder == null || folder.isBlank()) ? "misc" : folder.replaceAll("[^a-z0-9_-]", "");
        return root + sub + "/" + safeName;
    }

    private String buildPublicUrl(String objectKey) {
        String encodedKey = URLEncoder.encode(objectKey, StandardCharsets.UTF_8).replace("%2F", "/");
        return "https://" + props.bucket() + ".s3." + props.region() + ".amazonaws.com/" + encodedKey;
    }

    public record PresignResponse(String presignedUrl, String publicUrl, String objectKey) {}
}
