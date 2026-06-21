package com.svms.service;

import com.svms.entity.User;
import com.svms.dto.SignupRequest;
import com.svms.dto.UserCreationRequest;
import com.svms.dto.UserCreationResponse;
import com.svms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import java.util.Random;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private OtpService otpService;

    @Autowired
    private EmailService emailService;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Integer id) {
        return userRepository.findById(id);
    }

    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public User updateUser(Integer id, SignupRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));

        // Validate username change
        if (!user.getUsername().equals(request.getUsername()) && userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username is already taken!");
        }
        // Validate email change
        if (!user.getEmail().equals(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already in use!");
        }

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setMobile(request.getMobile());
        user.setUsername(request.getUsername());
        user.setRole(request.getRole());

        // Update password if provided
        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            if (!request.getPassword().equals(request.getConfirmPassword())) {
                throw new IllegalArgumentException("Passwords do not match!");
            }
            validatePassword(request.getPassword());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setPlainPassword(request.getPassword());
        }

        return userRepository.save(user);
    }

    public void deleteUser(Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        
        if ("admin".equals(user.getUsername())) {
            throw new IllegalArgumentException("Default admin user cannot be deleted!");
        }
        
        userRepository.delete(user);
    }

    private void validatePassword(String password) {
        if (password == null || password.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters long!");
        }
        if (!password.matches(".*[A-Z].*")) {
            throw new IllegalArgumentException("Password must contain at least one uppercase letter!");
        }
        if (!password.matches(".*[a-z].*")) {
            throw new IllegalArgumentException("Password must contain at least one lowercase letter!");
        }
        if (!password.matches(".*\\d.*")) {
            throw new IllegalArgumentException("Password must contain at least one digit!");
        }
        if (!password.matches(".*[@$!%*?&#].*")) {
            throw new IllegalArgumentException("Password must contain at least one special character (@$!%*?&#)!");
        }
    }

    /**
     * Admin OTP-verified user creation for Reception and Security accounts.
     */
    public UserCreationResponse adminCreateUser(UserCreationRequest request) {
        if (request.getFullName() == null || request.getFullName().trim().isEmpty()) {
            throw new IllegalArgumentException("Full Name is required!");
        }
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email Address is required!");
        }
        if (request.getMobile() == null || request.getMobile().trim().isEmpty()) {
            throw new IllegalArgumentException("Mobile Number is required!");
        }
        if (request.getRole() == null || request.getRole().trim().isEmpty()) {
            throw new IllegalArgumentException("Role selection is required!");
        }
        if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
            throw new IllegalArgumentException("Username is required!");
        }
        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            throw new IllegalArgumentException("Password is required!");
        }

        // Validate that OTP verification has been completed
        otpService.validateAndConsumeVerification(request.getEmail());

        // Validate uniqueness of email
        if (userRepository.existsByEmail(request.getEmail().trim())) {
            throw new IllegalArgumentException("Email address is already registered!");
        }

        // Validate uniqueness of username
        String targetUsername = request.getUsername().trim();
        if (userRepository.existsByUsername(targetUsername)) {
            throw new IllegalArgumentException("Username is already taken!");
        }

        // Validate password complexity
        String rawPassword = request.getPassword().trim();
        validatePassword(rawPassword);

        // Map and save new user entity
        User user = new User();
        user.setFullName(request.getFullName().trim());
        user.setEmail(request.getEmail().trim());
        user.setMobile(request.getMobile().trim());
        user.setUsername(targetUsername);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setPlainPassword(rawPassword);
        user.setRole(request.getRole().trim());
        user.setCreatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);

        // Send credentials email to the newly created user
        try {
            emailService.sendCredentialsEmail(
                    savedUser.getEmail(),
                    savedUser.getFullName(),
                    savedUser.getRole(),
                    savedUser.getUsername(),
                    rawPassword
            );
        } catch (Exception e) {
            System.err.println("[USER SERVICE] Failed to send credentials email: " + e.getMessage());
        }

        // Return credentials
        return new UserCreationResponse(
                savedUser.getUsername(),
                rawPassword,
                savedUser.getFullName(),
                savedUser.getEmail(),
                savedUser.getMobile(),
                savedUser.getRole()
        );
    }

    public java.util.Map<String, String> suggestCredentials(String role) {
        String prefix = "";
        String roleStr = role.toUpperCase();
        if (roleStr.contains("RECEPTION")) {
            prefix = "reception";
        } else if (roleStr.contains("SECURITY")) {
            prefix = "security";
        } else {
            prefix = roleStr.replace("ROLE_", "").toLowerCase();
        }

        List<User> existingUsers = userRepository.findByUsernameStartingWith(prefix);
        int maxIndex = 0;
        Pattern pattern = Pattern.compile("^" + prefix + "(\\d+)$");
        for (User u : existingUsers) {
            String uName = u.getUsername().toLowerCase();
            Matcher matcher = pattern.matcher(uName);
            if (matcher.matches()) {
                try {
                    int val = Integer.parseInt(matcher.group(1));
                    if (val > maxIndex) {
                        maxIndex = val;
                    }
                } catch (NumberFormatException e) {
                    // Ignore malformed numeric usernames
                }
            }
        }
        int nextIndex = maxIndex + 1;
        String generatedUsername = prefix + String.format("%03d", nextIndex);

        // Ensure uniqueness
        int suffix = 1;
        while (userRepository.existsByUsername(generatedUsername)) {
            generatedUsername = prefix + String.format("%03d", nextIndex + suffix);
            suffix++;
        }

        String rawPassword = generateSecurePassword();

        java.util.Map<String, String> suggestions = new java.util.HashMap<>();
        suggestions.put("username", generatedUsername);
        suggestions.put("password", rawPassword);
        return suggestions;
    }

    private String generateSecurePassword() {
        String upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        String lower = "abcdefghijklmnopqrstuvwxyz";
        String digits = "0123456789";
        String special = "@$!%*?&#";
        Random rand = new Random();
        
        StringBuilder sb = new StringBuilder();
        sb.append(upper.charAt(rand.nextInt(upper.length())));
        sb.append(digits.charAt(rand.nextInt(digits.length())));
        sb.append(lower.charAt(rand.nextInt(lower.length())));
        sb.append(digits.charAt(rand.nextInt(digits.length())));
        sb.append(special.charAt(rand.nextInt(special.length())));
        sb.append(upper.charAt(rand.nextInt(upper.length())));
        sb.append(digits.charAt(rand.nextInt(digits.length())));
        sb.append(upper.charAt(rand.nextInt(upper.length())));
        return sb.toString();
    }
}
