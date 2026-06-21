package com.svms.controller;

import com.svms.dto.*;
import com.svms.service.OtpService;
import com.svms.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminUserController {

    @Autowired
    private OtpService otpService;

    @Autowired
    private UserService userService;

    // 1. Send OTP
    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody OtpSendRequest request) {
        try {
            otpService.generateAndSendOtp(request.getEmail());
            return ResponseEntity.ok(new ApiResponse(true, "OTP has been generated and sent to " + request.getEmail()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new ApiResponse(false, "An error occurred while generating/sending OTP: " + e.getMessage()));
        }
    }

    // 2. Verify OTP
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody OtpVerifyRequest request) {
        try {
            boolean verified = otpService.verifyOtp(request.getEmail(), request.getOtp());
            if (verified) {
                return ResponseEntity.ok(new ApiResponse(true, "OTP verification successful!"));
            } else {
                return ResponseEntity.badRequest().body(new ApiResponse(false, "OTP verification failed."));
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new ApiResponse(false, "An error occurred during verification: " + e.getMessage()));
        }
    }

    // 3. Create User
    @PostMapping("/create-user")
    public ResponseEntity<?> createUser(@RequestBody UserCreationRequest request) {
        try {
            UserCreationResponse response = userService.adminCreateUser(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new ApiResponse(false, "An error occurred during user creation: " + e.getMessage()));
        }
    }

    // 4. Suggest Credentials
    @GetMapping("/suggest-credentials")
    public ResponseEntity<?> suggestCredentials(@RequestParam String role) {
        try {
            java.util.Map<String, String> suggestions = userService.suggestCredentials(role);
            return ResponseEntity.ok(suggestions);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new ApiResponse(false, "An error occurred while suggesting credentials: " + e.getMessage()));
        }
    }
}
