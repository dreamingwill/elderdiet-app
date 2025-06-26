package com.elderdiet.backend.security;

import com.elderdiet.backend.service.UserService;
import com.elderdiet.backend.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * JWT认证过滤器
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private final JwtUtil jwtUtil;
    private final UserService userService;
    
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        
        String jwt = getJwtFromRequest(request);
        
        if (StringUtils.hasText(jwt) && jwtUtil.validateToken(jwt)) {
            String phone = jwtUtil.getPhoneFromToken(jwt);
            String uid = jwtUtil.getUidFromToken(jwt);
            String role = jwtUtil.getRoleFromToken(jwt);
            
            if (phone != null && uid != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                try {
                    UserDetails userDetails = userService.loadUserByUsername(phone);
                    
                    if (userDetails != null) {
                        // 创建自定义的Authentication对象，将用户ID作为principal
                        JwtAuthenticationToken authentication = 
                                new JwtAuthenticationToken(
                                        uid, // 使用用户ID作为principal
                                        userDetails,
                                        phone,
                                        role,
                                        userDetails.getAuthorities()
                                );
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                        
                        log.debug("用户认证成功: phone={}, uid={}, role={}", phone, uid, role);
                    }
                } catch (Exception e) {
                    log.error("用户认证失败: {}", e.getMessage());
                }
            }
        }
        
        filterChain.doFilter(request, response);
    }
    
    /**
     * 从请求头中获取JWT令牌
     */
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
} 