package com.elderdiet.backend.security;

import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;

/**
 * JWT认证令牌
 * 自定义Authentication实现，用于存储JWT中的用户信息
 */
public class JwtAuthenticationToken extends AbstractAuthenticationToken {
    
    private final String userId;
    private final UserDetails userDetails;
    private final String phone;
    private final String role;
    
    public JwtAuthenticationToken(
            String userId,
            UserDetails userDetails,
            String phone,
            String role,
            Collection<? extends GrantedAuthority> authorities) {
        super(authorities);
        this.userId = userId;
        this.userDetails = userDetails;
        this.phone = phone;
        this.role = role;
        setAuthenticated(true);
    }
    
    @Override
    public Object getCredentials() {
        return null; // JWT不需要凭证
    }
    
    @Override
    public Object getPrincipal() {
        return userId; // 返回用户ID作为principal
    }
    
    public String getUserId() {
        return userId;
    }
    
    public UserDetails getUserDetails() {
        return userDetails;
    }
    
    public String getPhone() {
        return phone;
    }
    
    public String getRole() {
        return role;
    }
} 