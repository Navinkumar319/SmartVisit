package com.svms.config;

import com.svms.security.CustomUserDetailsService;
import com.svms.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.Collections;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/api/auth/**").permitAll()
                
                // Admin-only endpoints
                .requestMatchers("/api/users/**").hasRole("ADMIN")
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/settings/**", "/api/settings").hasRole("ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/settings/**", "/api/settings").hasAnyRole("ADMIN", "RECEPTION", "SECURITY")
                .requestMatchers("/api/reports/**").hasRole("ADMIN")
                
                // Check-in and Check-out is Security & Admin
                .requestMatchers("/api/visitors/checkin/**", "/api/visitors/checkin").hasAnyRole("SECURITY", "ADMIN")
                .requestMatchers("/api/visitors/checkout/**", "/api/visitors/checkout").hasAnyRole("SECURITY", "ADMIN")
                
                // Approvals is Admin only
                .requestMatchers("/api/visitors/approve/**", "/api/visitors/approve").hasRole("ADMIN")
                .requestMatchers("/api/visitors/reject/**", "/api/visitors/reject").hasRole("ADMIN")
                
                // Register and Update visitors is Reception only
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/visitors").hasRole("RECEPTION")
                .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/visitors/**").hasRole("RECEPTION")
                
                // Delete visitors is Admin only
                .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/visitors/**").hasRole("ADMIN")
                
                // Other GET visitor endpoints (listing, details, search, status, etc.)
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/visitors/**").hasAnyRole("ADMIN", "RECEPTION", "SECURITY")
                .requestMatchers("/api/dashboard/**").hasRole("ADMIN")
                
                // Catch-all
                .anyRequest().authenticated()
            );

        // Add our JWT security filter
        http.addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Allow all origins or specify React port
        configuration.setAllowedOriginPatterns(Collections.singletonList("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "x-auth-token"));
        configuration.setExposedHeaders(Collections.singletonList("x-auth-token"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
