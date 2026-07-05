package com.svms.controller;

import com.svms.dto.*;
import com.svms.entity.User;
import com.svms.security.JwtTokenProvider;
import com.svms.security.UserPrincipal;
import com.svms.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtTokenProvider tokenProvider;

    // 1. User Login API
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername(),
                            loginRequest.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = tokenProvider.generateToken(authentication);
            
            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
            String role = userPrincipal.getAuthorities().iterator().next().getAuthority();

            return ResponseEntity.ok(new LoginResponse(
                    jwt,
                    userPrincipal.getUsername(),
                    role,
                    userPrincipal.getFullName()
            ));
        } catch (Exception e) {
            System.err.println("=== LOGIN ERROR ===");
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Invalid username or password: " + e.getMessage()));
        }
    }

    // 2. Get Current User Details
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        
        Object principal = authentication.getPrincipal();
        String username = null;
        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else if (principal instanceof String) {
            username = (String) principal;
        }
        
        if (username == null || "anonymousUser".equals(username)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }

        return userService.getUserByUsername(username)
                .<ResponseEntity<?>>map(user -> ResponseEntity.ok(new java.util.HashMap<String, Object>() {{
                    put("id", user.getUserId());
                    put("username", user.getUsername());
                    put("fullName", user.getFullName());
                    put("email", user.getEmail());
                    put("mobile", user.getMobile());
                    put("role", user.getRole());
                    put("profilePhoto", user.getProfilePhoto());
                }}))
                .orElse(ResponseEntity.notFound().build());
    }
}
