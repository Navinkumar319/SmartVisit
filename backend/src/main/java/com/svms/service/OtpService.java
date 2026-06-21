package com.svms.service;

import com.svms.entity.Otp;
import com.svms.repository.OtpRepository;
import com.svms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;

@Service
public class OtpService {

    @Autowired
    private OtpRepository otpRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    /**
     * Generates a 6-digit OTP, persists it, and sends it to the target email.
     */
    public void generateAndSendOtp(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email address is required!");
        }

        // Validate if the email is already in use by another user
        if (userRepository.existsByEmail(email.trim())) {
            throw new IllegalArgumentException("Email address is already in use!");
        }

        // Generate 6-digit OTP
        String otp = String.format("%06d", new Random().nextInt(1000000));
        LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(5);

        // Save OTP verification record
        Otp otpRecord = new Otp(email.trim(), otp, expiryTime);
        otpRepository.save(otpRecord);

        // Send Email
        System.out.println(">>> Generated OTP for " + email.trim() + ": " + otp);
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                emailService.sendOtpEmail(email.trim(), otp);
            } catch (Exception e) {
                System.err.println(">>> Failed to send OTP email asynchronously: " + e.getMessage());
            }
        });
    }

    /**
     * Verifies the OTP submitted for the email.
     */
    public boolean verifyOtp(String email, String otp) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required!");
        }
        if (otp == null || otp.trim().isEmpty()) {
            throw new IllegalArgumentException("OTP code is required!");
        }

        Otp otpRecord = otpRepository.findTopByEmailOrderByCreatedAtDesc(email.trim())
                .orElseThrow(() -> new IllegalArgumentException("No OTP request found for this email!"));

        if (otpRecord.getVerified()) {
            throw new IllegalArgumentException("This OTP has already been verified and consumed!");
        }

        if (LocalDateTime.now().isAfter(otpRecord.getExpiryTime())) {
            throw new IllegalArgumentException("OTP has expired (validity is 5 minutes)!");
        }

        if (!otpRecord.getOtp().equals(otp.trim())) {
            throw new IllegalArgumentException("Invalid OTP code!");
        }

        otpRecord.setVerified(true);
        otpRepository.save(otpRecord);
        return true;
    }

    /**
     * Checks if a verified OTP exists for the email, and consumes it.
     */
    public void validateAndConsumeVerification(String email) {
        Otp otpRecord = otpRepository.findTopByEmailOrderByCreatedAtDesc(email.trim())
                .orElseThrow(() -> new IllegalArgumentException("Email verification is required. Please request an OTP first."));

        if (!otpRecord.getVerified()) {
            throw new IllegalArgumentException("OTP verification is pending. Please verify OTP first.");
        }

        // Consume OTP to prevent reuse
        otpRecord.setVerified(false);
        otpRepository.save(otpRecord);
    }
}
