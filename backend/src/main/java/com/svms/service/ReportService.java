package com.svms.service;

import com.svms.entity.Visitor;
import com.svms.repository.VisitorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class ReportService {

    @Autowired
    private VisitorRepository visitorRepository;

    public List<Visitor> getReportData(String reportType) {
        LocalDate today = LocalDate.now();

        switch (reportType.toLowerCase()) {
            case "daily":
                return visitorRepository.findByVisitDate(today);
            case "weekly":
                // Past 7 days including today
                return visitorRepository.findByVisitDateBetween(today.minusDays(6), today);
            case "monthly":
                // Past 30 days including today
                return visitorRepository.findByVisitDateBetween(today.minusDays(29), today);
            case "approved":
                return visitorRepository.findByStatus("APPROVED");
            case "rejected":
                return visitorRepository.findByStatus("REJECTED");
            case "history":
            default:
                return visitorRepository.findAll();
        }
    }
}
