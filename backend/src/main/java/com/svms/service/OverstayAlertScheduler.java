package com.svms.service;

import com.svms.entity.CheckIn;
import com.svms.entity.User;
import com.svms.entity.Visitor;
import com.svms.repository.CheckInRepository;
import com.svms.repository.UserRepository;
import com.svms.repository.VisitorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;

@Component
public class OverstayAlertScheduler {

    @Autowired
    private VisitorRepository visitorRepository;

    @Autowired
    private CheckInRepository checkInRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    // Run every 1 minute to check for overstay alerts
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void checkOverstayingVisitors() {
        System.out.println("[OVERSTAY MONITOR] Scanning for checked-in visitors who have overstayed...");

        List<Visitor> insideVisitors = visitorRepository.findByStatus("CHECKED_IN");
        LocalDateTime limitTime = LocalDateTime.now().minusHours(8);

        for (Visitor visitor : insideVisitors) {
            checkInRepository.findTopByVisitorVisitorIdOrderByCheckinTimeDesc(visitor.getVisitorId()).ifPresent(checkin -> {
                // If checked in before 8 hours ago and alert hasn't been sent yet for this check-in
                if (checkin.getCheckinTime().isBefore(limitTime) && !checkin.isOverstayAlertSent()) {
                    System.out.println("[OVERSTAY ALERT] Visitor " + visitor.getName() + " (" + visitor.getVisitorCode() + ") has overstayed. Sending notifications...");

                    // Calculate duration
                    long seconds = Duration.between(checkin.getCheckinTime(), LocalDateTime.now()).getSeconds();
                    double durationHours = seconds / 3600.0;

                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd hh:mm:ss a");
                    String checkinTimeStr = checkin.getCheckinTime().format(formatter);

                    // 1. Send warning email to visitor
                    try {
                        emailService.sendVisitorOverstayEmail(
                            visitor.getEmail(),
                            visitor.getName(),
                            visitor.getVisitorCode(),
                            checkinTimeStr
                        );
                    } catch (Exception e) {
                        System.err.println("[OVERSTAY ALERT] Failed to send email to visitor " + visitor.getName() + ": " + e.getMessage());
                    }

                    // 2. Find all Admin and Security Staff members to alert
                    List<User> alertStaff = userRepository.findByRoleIn(Arrays.asList("ROLE_ADMIN", "ROLE_SECURITY"));
                    for (User staff : alertStaff) {
                        try {
                            emailService.sendStaffOverstayAlertEmail(
                                staff.getEmail(),
                                staff.getFullName(),
                                visitor.getName(),
                                visitor.getVisitorCode(),
                                visitor.getCompanyName(),
                                checkinTimeStr,
                                durationHours,
                                visitor.getPersonToMeet(),
                                visitor.getDepartment()
                            );
                        } catch (Exception e) {
                            System.err.println("[OVERSTAY ALERT] Failed to send email to staff member " + staff.getFullName() + ": " + e.getMessage());
                        }
                    }

                    // 3. Mark alert as sent to prevent duplicate alerts
                    checkin.setOverstayAlertSent(true);
                    checkInRepository.save(checkin);
                }
            });
        }
    }
}
