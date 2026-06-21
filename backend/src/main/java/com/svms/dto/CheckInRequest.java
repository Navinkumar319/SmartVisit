package com.svms.dto;

public class CheckInRequest {
    private Integer visitorId;
    private String securityName;
    private String remarks;

    // Constructors
    public CheckInRequest() {}

    // Getters and Setters
    public Integer getVisitorId() {
        return visitorId;
    }

    public void setVisitorId(Integer visitorId) {
        this.visitorId = visitorId;
    }

    public String getSecurityName() {
        return securityName;
    }

    public void setSecurityName(String securityName) {
        this.securityName = securityName;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
