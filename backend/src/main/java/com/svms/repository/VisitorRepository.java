package com.svms.repository;

import com.svms.entity.Visitor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface VisitorRepository extends JpaRepository<Visitor, Integer> {
    Optional<Visitor> findByVisitorCode(String visitorCode);
    List<Visitor> findByStatus(String status);
    
    // For searches by security/reception/admin
    @Query("SELECT v FROM Visitor v WHERE " +
           "LOWER(v.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(v.visitorCode) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(v.mobile) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(v.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(v.companyName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(v.personToMeet) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(v.department) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(v.idNumber) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Visitor> searchVisitors(@Param("query") String query);

    // For searches by security/reception/admin
    List<Visitor> findByNameContainingIgnoreCaseOrVisitorCodeContainingIgnoreCaseOrPersonToMeetContainingIgnoreCase(String name, String code, String person);
    
    // For reports filtering
    List<Visitor> findByVisitDate(LocalDate date);
    List<Visitor> findByVisitDateBetween(LocalDate startDate, LocalDate endDate);
    List<Visitor> findByVisitDateBetweenAndStatus(LocalDate startDate, LocalDate endDate, String status);
    
    // To support automatic visitor ID sequence generation (e.g. VIS-1001, VIS-1002)
    Optional<Visitor> findTopByOrderByVisitorIdDesc();

    // Fast counts for dashboard stats
    long countByStatus(String status);
    long countByVisitDate(LocalDate date);
}
