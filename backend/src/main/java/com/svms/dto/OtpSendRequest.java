package com.svms.dto;

public class OtpSendRequest {
    private String email;

    public OtpSendRequest() {}

    public OtpSendRequest(String email) {
        this.email = email;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
