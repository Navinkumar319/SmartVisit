package com.svms.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "settings")
public class Settings {

    @Id
    private Integer id = 1; // Primary key is hardcoded to 1 to enforce single-row configuration

    @Column(name = "company_name", nullable = false, length = 100)
    private String companyName;

    @Lob
    @Column(name = "company_logo", columnDefinition = "LONGTEXT")
    private String companyLogo; // Base64 logo string

    @Column(name = "visitor_id_format", nullable = false, length = 20)
    private String visitorIdFormat; // E.g., "vis-"

    @Column(name = "email_notification", nullable = false)
    private Boolean emailNotification;

    @Column(name = "sms_notification", nullable = false)
    private Boolean smsNotification;

    // Constructors
    public Settings() {
        this.id = 1;
        this.companyName = "Smart Visitor Management System";
        this.visitorIdFormat = "vis-";
        this.emailNotification = true;
        this.smsNotification = false;
    }

    // Getters and Setters
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

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
