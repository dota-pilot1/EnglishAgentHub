package com.cj.englishagenthub.auth.security;

import com.cj.englishagenthub.common.exception.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;

@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException ex)
            throws IOException {
        ErrorCode ec = ErrorCode.INVALID_TOKEN;
        response.setStatus(ec.getStatus().value());
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(
                "{\"code\":\"" + ec.getCode() + "\","
                + "\"message\":\"" + ec.getMessage() + "\","
                + "\"timestamp\":\"" + Instant.now() + "\","
                + "\"fieldErrors\":null}"
        );
    }
}
