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
            case "ai_matches":
                return getAiMatchesReport();
            case "history":
            default:
                return visitorRepository.findAll();
        }
    }

    private List<Visitor> getAiMatchesReport() {
        List<Visitor> all = visitorRepository.findAll();
        List<Visitor> matched = new java.util.ArrayList<>();

        for (int i = 0; i < all.size(); i++) {
            Visitor v1 = all.get(i);
            boolean isMatch = false;
            StringBuilder reasons = new StringBuilder();
            StringBuilder withCodes = new StringBuilder();

            for (int j = 0; j < all.size(); j++) {
                if (i == j) continue;
                Visitor v2 = all.get(j);

                boolean nameMatches = false;
                if (v1.getName() != null && v2.getName() != null) {
                    nameMatches = v1.getName().trim().equalsIgnoreCase(v2.getName().trim());
                }

                boolean mobileMatches = false;
                if (v1.getMobile() != null && v2.getMobile() != null) {
                    String m1 = v1.getMobile().replaceAll("[^0-9]", "");
                    String m2 = v2.getMobile().replaceAll("[^0-9]", "");
                    if (!m1.isEmpty() && m1.equals(m2)) {
                        mobileMatches = true;
                    }
                }

                if (nameMatches || mobileMatches) {
                    isMatch = true;
                    String reason;
                    if (nameMatches && mobileMatches) {
                        reason = "Name & Mobile Match";
                    } else if (nameMatches) {
                        reason = "Name Match";
                    } else {
                        reason = "Mobile Match";
                    }

                    if (reasons.indexOf(reason) == -1) {
                        if (reasons.length() > 0) reasons.append(", ");
                        reasons.append(reason);
                    }

                    if (withCodes.length() > 0) {
                        withCodes.append(", ");
                    }
                    withCodes.append(v2.getVisitorCode());
                }
            }

            if (isMatch) {
                v1.setMatchReason(reasons.toString());
                v1.setMatchedWithCode(withCodes.toString());
                matched.add(v1);
            }
        }
        return matched;
    }
}
