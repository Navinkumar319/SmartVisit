package com.svms.repository;

import com.svms.entity.CheckIn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CheckInRepository extends JpaRepository<CheckIn, Integer> {
    Optional<CheckIn> findByVisitorVisitorId(Integer visitorId);
    Optional<CheckIn> findTopByVisitorVisitorIdOrderByCheckinTimeDesc(Integer visitorId);
    List<CheckIn> findByVisitorVisitorIdInOrderByCheckinTimeDesc(List<Integer> visitorIds);
}
