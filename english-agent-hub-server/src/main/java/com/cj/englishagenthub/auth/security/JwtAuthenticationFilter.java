package com.cj.englishagenthub.auth.security;

import com.cj.englishagenthub.auth.jwt.JwtTokenProvider;
import com.cj.englishagenthub.auth.jwt.TokenType;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String HEADER = "Authorization";
    private static final String PREFIX = "Bearer ";

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String token = resolveToken(request);
        if (token != null) {
            try {
                Claims claims = jwtTokenProvider.parse(token).getPayload();
                if (jwtTokenProvider.getType(claims) == TokenType.ACCESS) {
                    List<String> permissions = jwtTokenProvider.getPermissions(claims);
                    UserPrincipal principal = UserPrincipal.fromClaims(
                            jwtTokenProvider.getUserId(claims),
                            jwtTokenProvider.getEmail(claims),
                            jwtTokenProvider.getUsername(claims),
                            jwtTokenProvider.getRole(claims),
                            permissions
                    );
                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (JwtException | IllegalArgumentException e) {
                SecurityContextHolder.clearContext();
            }
        }
        chain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest req) {
        String h = req.getHeader(HEADER);
        if (StringUtils.hasText(h) && h.startsWith(PREFIX)) return h.substring(PREFIX.length());
        return null;
    }
}
