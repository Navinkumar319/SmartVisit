package com.svms.dto;

public class CheckOutRequest {
    private Integer visitorId;
    private String remarks;

    private String securityName;

    // Constructors
    public CheckOutRequest() {}

    // Getters and Setters
    public String getSecurityName() {
        return securityName;
    }

    public void setSecurityName(String securityName) {
        this.securityName = securityName;
    }

    public Integer getVisitorId() {
        return visitorId;
    }

    public void setVisitorId(Integer visitorId) {
        this.visitorId = visitorId;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
