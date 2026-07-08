package com.svms.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "visitors")
public class Visitor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "visitor_id")
    private Integer visitorId;

    @Column(name = "visitor_code", nullable = false, unique = true, length = 50)
    private String visitorCode;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 15)
    private String mobile;

    @Column(nullable = false, length = 100)
    private String email;

    @Column(name = "company_name", length = 100)
    private String companyName;

    @Column(nullable = false, length = 255)
    private String purpose;

    @Column(name = "person_to_meet", nullable = false, length = 100)
    private String personToMeet;

    @Column(nullable = false, length = 100)
    private String department;

    @Column(name = "visit_date", nullable = true)
    private LocalDate visitDate;

    @Column(name = "visit_time", nullable = true, length = 20)
    private String visitTime;


    @Column(name = "id_proof_type", nullable = false, length = 50)
    private String idProofType;

    @Column(name = "id_number", nullable = false, length = 50)
    private String idNumber;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String photo; // Base64 encoded image string

    @Column(nullable = false, length = 30)
    private String status; // PENDING, APPROVED, REJECTED, CHECKED_IN, CHECKED_OUT

    @Column(name = "created_by", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Transient
    private Double similarityScore;

    // Constructors
    public Visitor() {
        this.createdAt = LocalDateTime.now();
        this.status = "PENDING";
    }

    // Getters and Setters
    public Integer getVisitorId() {
        return visitorId;
    }

    public void setVisitorId(Integer visitorId) {
        this.visitorId = visitorId;
    }

    public String getVisitorCode() {
        return visitorCode;
    }

    public void setVisitorCode(String visitorCode) {
        this.visitorCode = visitorCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getMobile() {
        return mobile;
    }

    public void setMobile(String mobile) {
        this.mobile = mobile;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public String getPersonToMeet() {
        return personToMeet;
    }

    public void setPersonToMeet(String personToMeet) {
        this.personToMeet = personToMeet;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public LocalDate getVisitDate() {
        return visitDate;
    }

    public void setVisitDate(LocalDate visitDate) {
        this.visitDate = visitDate;
     }

    public String getVisitTime() {
        return visitTime;
    }

    public void setVisitTime(String visitTime) {
        this.visitTime = visitTime;
    }

    public String getIdProofType() {
        return idProofType;
    }

    public void setIdProofType(String idProofType) {
        this.idProofType = idProofType;
    }

    public String getIdNumber() {
        return idNumber;
    }

    public void setIdNumber(String idNumber) {
        this.idNumber = idNumber;
    }

    public String getPhoto() {
        return photo;
    }

    public void setPhoto(String photo) {
        this.photo = photo;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Transient
    private String checkinTime;

    @Transient
    private String checkoutTime;

    @Transient
    private String checkinBy;

    @Transient
    private String checkoutBy;

    public String getCheckinTime() {
        return checkinTime;
    }

    public void setCheckinTime(String checkinTime) {
        this.checkinTime = checkinTime;
    }

    public String getCheckoutTime() {
        return checkoutTime;
    }

    public void setCheckoutTime(String checkoutTime) {
        this.checkoutTime = checkoutTime;
    }

    public String getCheckinBy() {
        return checkinBy;
    }

    public void setCheckinBy(String checkinBy) {
        this.checkinBy = checkinBy;
    }

    public String getCheckoutBy() {
        return checkoutBy;
    }

    public void setCheckoutBy(String checkoutBy) {
        this.checkoutBy = checkoutBy;
    }

    public Double getSimilarityScore() {
        return similarityScore;
    }

    public void setSimilarityScore(Double similarityScore) {
        this.similarityScore = similarityScore;
    }

    @Transient
    private String floor;

    @Transient
    private String roomNo;

    @Transient
    private String matchReason;

    @Transient
    private String matchedWithCode;

    public String getFloor() {
        return floor;
    }

    public void setFloor(String floor) {
        this.floor = floor;
    }

    public String getRoomNo() {
        return roomNo;
    }

    public void setRoomNo(String roomNo) {
        this.roomNo = roomNo;
    }

    public String getMatchReason() {
        return matchReason;
    }

    public void setMatchReason(String matchReason) {
        this.matchReason = matchReason;
    }

    public String getMatchedWithCode() {
        return matchedWithCode;
    }

    public void setMatchedWithCode(String matchedWithCode) {
        this.matchedWithCode = matchedWithCode;
    }
}
