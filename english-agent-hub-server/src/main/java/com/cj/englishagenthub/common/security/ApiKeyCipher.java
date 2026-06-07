package com.cj.englishagenthub.common.security;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * AES-GCM 기반 단방향(대칭) 암복호화.
 * 서버 시크릿(API_KEY_SECRET)을 SHA-256으로 정규화해 256-bit 키로 사용.
 * 출력은 base64(iv || ciphertext+tag).
 */
@Component
@Slf4j
public class ApiKeyCipher {

    private static final int IV_BYTES = 12;
    private static final int TAG_BITS = 128;
    private static final String TRANSFORM = "AES/GCM/NoPadding";

    private final SecureRandom random = new SecureRandom();
    private final SecretKey secretKey;

    public ApiKeyCipher(@Value("${app.security.api-key-secret:}") String secret) {
        String resolved = StringUtils.hasText(secret)
                ? secret
                : "english-agent-hub-dev-api-key-secret-change-in-production";
        try {
            byte[] hashed = MessageDigest.getInstance("SHA-256")
                    .digest(resolved.getBytes(StandardCharsets.UTF_8));
            this.secretKey = new SecretKeySpec(hashed, "AES");
        } catch (Exception e) {
            throw new IllegalStateException("Failed to initialize ApiKeyCipher", e);
        }
    }

    @PostConstruct
    void warnIfDefault() {
        // 운영에서는 반드시 env로 override 필요.
        log.info("ApiKeyCipher initialized (AES-GCM). Set app.security.api-key-secret in production.");
    }

    public String encrypt(String plaintext) {
        if (plaintext == null) return null;
        try {
            byte[] iv = new byte[IV_BYTES];
            random.nextBytes(iv);
            Cipher cipher = Cipher.getInstance(TRANSFORM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(TAG_BITS, iv));
            byte[] ct = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            byte[] out = new byte[iv.length + ct.length];
            System.arraycopy(iv, 0, out, 0, iv.length);
            System.arraycopy(ct, 0, out, iv.length, ct.length);
            return Base64.getEncoder().encodeToString(out);
        } catch (Exception e) {
            throw new IllegalStateException("encrypt failed", e);
        }
    }

    public String decrypt(String stored) {
        if (stored == null) return null;
        try {
            byte[] raw = Base64.getDecoder().decode(stored);
            if (raw.length <= IV_BYTES) throw new IllegalArgumentException("ciphertext too short");
            byte[] iv = new byte[IV_BYTES];
            byte[] ct = new byte[raw.length - IV_BYTES];
            System.arraycopy(raw, 0, iv, 0, IV_BYTES);
            System.arraycopy(raw, IV_BYTES, ct, 0, ct.length);
            Cipher cipher = Cipher.getInstance(TRANSFORM);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(TAG_BITS, iv));
            return new String(cipher.doFinal(ct), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("decrypt failed (corrupt or wrong secret?)", e);
        }
    }

    /** "sk-...abcd" 식 마스킹. 키 길이 짧으면 그냥 별표. */
    public static String mask(String plaintext) {
        if (!StringUtils.hasText(plaintext)) return "";
        String s = plaintext.trim();
        if (s.length() <= 8) return "********";
        return s.substring(0, 3) + "..." + s.substring(s.length() - 4);
    }
}
