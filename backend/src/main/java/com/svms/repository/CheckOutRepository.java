package com.svms.repository;

import com.svms.entity.CheckOut;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CheckOutRepository extends JpaRepository<CheckOut, Integer> {
    Optional<CheckOut> findByVisitorVisitorId(Integer visitorId);
    Optional<CheckOut> findTopByVisitorVisitorIdOrderByCheckoutTimeDesc(Integer visitorId);
}
