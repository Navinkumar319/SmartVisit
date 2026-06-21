package com.svms.dto;

public class UserCreationRequest {
    private String fullName;
    private String email;
    private String mobile;
    private String role;
    private String username;
    private String password;

    public UserCreationRequest() {}

    public UserCreationRequest(String fullName, String email, String mobile, String role, String username, String password) {
        this.fullName = fullName;
        this.email = email;
        this.mobile = mobile;
        this.role = role;
        this.username = username;
        this.password = password;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getMobile() {
        return mobile;
    }

    public void setMobile(String mobile) {
        this.mobile = mobile;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
