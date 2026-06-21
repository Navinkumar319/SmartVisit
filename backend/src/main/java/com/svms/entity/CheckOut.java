package com.svms.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "checkouts")
public class CheckOut {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "checkout_id")
    private Integer checkoutId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "visitor_id", nullable = false)
    private Visitor visitor;

    @Column(name = "visitor_name", nullable = false, length = 100)
    private String visitorName;

    @Column(name = "checkout_time")
    private LocalDateTime checkoutTime;

    @Column(length = 255)
    private String remarks;

    // Constructors
    public CheckOut() {
        this.checkoutTime = LocalDateTime.now();
    }

    public CheckOut(Visitor visitor, String remarks) {
        this.visitor = visitor;
        this.visitorName = visitor != null ? visitor.getName() : "";
        this.remarks = remarks;
        this.checkoutTime = LocalDateTime.now();
    }

    // Getters and Setters
    public String getVisitorName() {
        return visitorName;
    }

    public void setVisitorName(String visitorName) {
        this.visitorName = visitorName;
    }

    public Integer getCheckoutId() {
        return checkoutId;
    }

    public void setCheckoutId(Integer checkoutId) {
        this.checkoutId = checkoutId;
    }

    public Visitor getVisitor() {
        return visitor;
    }

    public void setVisitor(Visitor visitor) {
        this.visitor = visitor;
    }

    public LocalDateTime getCheckoutTime() {
        return checkoutTime;
    }

    public void setCheckoutTime(LocalDateTime checkoutTime) {
        this.checkoutTime = checkoutTime;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
