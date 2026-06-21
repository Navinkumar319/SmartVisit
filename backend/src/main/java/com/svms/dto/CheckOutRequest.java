package com.svms.dto;

public class CheckOutRequest {
    private Integer visitorId;
    private String remarks;

    // Constructors
    public CheckOutRequest() {}

    // Getters and Setters
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
