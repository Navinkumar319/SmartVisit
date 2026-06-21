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

}
