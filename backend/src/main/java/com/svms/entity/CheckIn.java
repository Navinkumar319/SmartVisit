package com.svms.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "checkins")
public class CheckIn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "checkin_id")
    private Integer checkinId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "visitor_id", nullable = false)
    private Visitor visitor;

    @Column(name = "visitor_name", nullable = false, length = 100)
    private String visitorName;

    @Column(name = "checkin_time")
    private LocalDateTime checkinTime;

    @Column(name = "security_name", nullable = false, length = 100)
    private String securityName;

    @Column(name = "remarks", length = 255)
    private String remarks;

    @Column(name = "overstay_alert_sent", nullable = false)
    private boolean overstayAlertSent = false;

    // Constructors
    public CheckIn() {
        this.checkinTime = LocalDateTime.now();
        this.overstayAlertSent = false;
    }

    public CheckIn(Visitor visitor, String securityName, String remarks) {
        this.visitor = visitor;
        this.visitorName = visitor != null ? visitor.getName() : "";
        this.securityName = securityName;
        this.remarks = remarks;
        this.checkinTime = LocalDateTime.now();
        this.overstayAlertSent = false;
    }

    // Getters and Setters
    public String getVisitorName() {
        return visitorName;
    }

    public void setVisitorName(String visitorName) {
        this.visitorName = visitorName;
    }

    public Integer getCheckinId() {
        return checkinId;
    }

    public void setCheckinId(Integer checkinId) {
        this.checkinId = checkinId;
    }

    public Visitor getVisitor() {
        return visitor;
    }

    public void setVisitor(Visitor visitor) {
        this.visitor = visitor;
    }

    public LocalDateTime getCheckinTime() {
        return checkinTime;
    }

    public void setCheckinTime(LocalDateTime checkinTime) {
        this.checkinTime = checkinTime;
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

    public boolean isOverstayAlertSent() {
        return overstayAlertSent;
    }

    public void setOverstayAlertSent(boolean overstayAlertSent) {
        this.overstayAlertSent = overstayAlertSent;
    }
}
