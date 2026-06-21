package com.svms.service;

import com.svms.dto.DashboardStats;
import com.svms.repository.VisitorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class DashboardService {

    @Autowired
    private VisitorRepository visitorRepository;

    public DashboardStats getDashboardStats() {
        long total = visitorRepository.count();
        long today = visitorRepository.countByVisitDate(LocalDate.now());
        long checkedIn = visitorRepository.countByStatus("CHECKED_IN");
        long checkedOut = visitorRepository.countByStatus("CHECKED_OUT");
        long pending = visitorRepository.countByStatus("PENDING");
        long rejected = visitorRepository.countByStatus("REJECTED");

        return new DashboardStats(total, today, checkedIn, checkedOut, pending, rejected);
    }
}
