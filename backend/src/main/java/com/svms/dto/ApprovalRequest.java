package com.svms.dto;

public class ApprovalRequest {
    private Integer visitorId;
    private String status; // APPROVED, REJECTED
    private String remarks;

    // Constructors
    public ApprovalRequest() {}

    // Getters and Setters
    public Integer getVisitorId() {
        return visitorId;
    }

    public void setVisitorId(Integer visitorId) {
        this.visitorId = visitorId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
