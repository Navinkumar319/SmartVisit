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
        int n = all.size();

        String[] cleanedMobiles = new String[n];
        String[] cleanedEmails = new String[n];

        java.util.Map<String, List<Integer>> mobileToIndices = new java.util.HashMap<>();
        java.util.Map<String, List<Integer>> emailToIndices = new java.util.HashMap<>();

        for (int i = 0; i < n; i++) {
            Visitor v = all.get(i);

            String m = v.getMobile();
            if (m != null) {
                String cleanedM = m.replaceAll("[^0-9]", "");
                if (!cleanedM.isEmpty()) {
                    cleanedMobiles[i] = cleanedM;
                    mobileToIndices.computeIfAbsent(cleanedM, k -> new java.util.ArrayList<>()).add(i);
                }
            }

            String e = v.getEmail();
            if (e != null) {
                String cleanedE = e.trim().toLowerCase();
                if (!cleanedE.isEmpty()) {
                    cleanedEmails[i] = cleanedE;
                    emailToIndices.computeIfAbsent(cleanedE, k -> new java.util.ArrayList<>()).add(i);
                }
            }
        }

        for (int i = 0; i < n; i++) {
            Visitor v1 = all.get(i);
            boolean isMatch = false;
            StringBuilder reasons = new StringBuilder();
            StringBuilder withCodes = new StringBuilder();

            java.util.Set<Integer> matchingIndices = new java.util.LinkedHashSet<>();

            String myMobile = cleanedMobiles[i];
            if (myMobile != null) {
                List<Integer> sameMobile = mobileToIndices.get(myMobile);
                if (sameMobile != null) {
                    matchingIndices.addAll(sameMobile);
                }
            }

            String myEmail = cleanedEmails[i];
            if (myEmail != null) {
                List<Integer> sameEmail = emailToIndices.get(myEmail);
                if (sameEmail != null) {
                    matchingIndices.addAll(sameEmail);
                }
            }

            matchingIndices.remove(i);

            if (!matchingIndices.isEmpty()) {
                isMatch = true;
                for (int idx : matchingIndices) {
                    Visitor v2 = all.get(idx);

                    boolean mobileMatches = (myMobile != null && myMobile.equals(cleanedMobiles[idx]));
                    boolean emailMatches = (myEmail != null && myEmail.equals(cleanedEmails[idx]));

                    String reason;
                    if (mobileMatches && emailMatches) {
                        reason = "Mobile & Email Match";
                    } else if (mobileMatches) {
                        reason = "Mobile Match";
                    } else {
                        reason = "Email Match";
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
