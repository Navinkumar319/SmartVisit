package com.svms.repository;

import com.svms.entity.Visitor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface VisitorRepository extends JpaRepository<Visitor, Integer> {
    Optional<Visitor> findByVisitorCode(String visitorCode);
    List<Visitor> findByStatus(String status);
    
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
