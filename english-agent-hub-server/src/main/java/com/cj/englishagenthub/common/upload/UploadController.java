package com.cj.englishagenthub.common.upload;

import com.cj.englishagenthub.common.exception.BusinessException;
import com.cj.englishagenthub.common.exception.ErrorCode;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Set;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Upload", description = "S3 업로드용 Presigned URL 발급 (ROLE_ADMIN 전용)")
public class UploadController {

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/webp",
            "image/gif"
    );

    private final UploadService uploadService;

    @PostMapping("/presign")
    @Operation(summary = "이미지 업로드용 Presigned URL 발급")
    public UploadService.PresignResponse presign(@Valid @RequestBody PresignRequest request) {
        if (!ALLOWED_IMAGE_TYPES.contains(request.contentType())) {
            throw new BusinessException(ErrorCode.UPLOAD_INVALID_CONTENT_TYPE);
        }
        return uploadService.presign(request.filename(), request.contentType(), request.folder());
    }

    public record PresignRequest(
            @NotBlank String filename,
            @NotBlank String contentType,
            String folder
    ) {}
}
