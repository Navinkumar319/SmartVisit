package com.svms.dto;

public class LoginResponse {
    private String accessToken;
    private String tokenType = "Bearer";
    private String username;
    private String role;
    private String fullName;

    // Constructors
    public LoginResponse() {}

    public LoginResponse(String accessToken, String username, String role, String fullName) {
        this.accessToken = accessToken;
        this.username = username;
        this.role = role;
        this.fullName = fullName;
    }

    // Getters and Setters
    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }
}
