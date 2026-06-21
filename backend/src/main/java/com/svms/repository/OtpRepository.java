package com.svms.repository;

import com.svms.entity.Otp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OtpRepository extends JpaRepository<Otp, Integer> {
    Optional<Otp> findTopByEmailOrderByCreatedAtDesc(String email);
}
