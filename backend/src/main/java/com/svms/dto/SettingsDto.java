package com.svms.dto;

public class SettingsDto {
    private String companyName;
    private String companyLogo; // Base64
    private String visitorIdFormat;
    private Boolean emailNotification;
    private Boolean smsNotification;

    // Constructors
    public SettingsDto() {}

    public SettingsDto(String companyName, String companyLogo, String visitorIdFormat, Boolean emailNotification, Boolean smsNotification) {
        this.companyName = companyName;
        this.companyLogo = companyLogo;
        this.visitorIdFormat = visitorIdFormat;
        this.emailNotification = emailNotification;
        this.smsNotification = smsNotification;
    }

    // Getters and Setters
    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getCompanyLogo() {
        return companyLogo;
    }

    public void setCompanyLogo(String companyLogo) {
        this.companyLogo = companyLogo;
    }

    public String getVisitorIdFormat() {
        return visitorIdFormat;
    }

    public void setVisitorIdFormat(String visitorIdFormat) {
        this.visitorIdFormat = visitorIdFormat;
    }

    public Boolean getEmailNotification() {
        return emailNotification;
    }

    public void setEmailNotification(Boolean emailNotification) {
        this.emailNotification = emailNotification;
    }

    public Boolean getSmsNotification() {
        return smsNotification;
    }

    public void setSmsNotification(Boolean smsNotification) {
        this.smsNotification = smsNotification;
    }
}
