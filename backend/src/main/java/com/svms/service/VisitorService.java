package com.svms.service;

import com.svms.entity.*;
import com.svms.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class VisitorService {

    @Autowired
    private VisitorRepository visitorRepository;

    @Autowired
    private CheckInRepository checkInRepository;

    @Autowired
    private CheckOutRepository checkOutRepository;

    @Autowired
    private SettingsRepository settingsRepository;

    @Autowired
    private EmailService emailService;

    // 1. Generate Next Visitor Code
    public String generateNextVisitorCode() {
        Settings settings = settingsRepository.findById(1).orElse(new Settings());
        String prefix = settings.getVisitorIdFormat(); // Default: "VIS-"
        
        LocalDate today = LocalDate.now();
        java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("ddMMyyyy");
        String dateStr = today.format(formatter);
        
        String currentDayPrefix = prefix + dateStr + "-";
        
        Optional<Visitor> lastVisitor = visitorRepository.findTopByOrderByVisitorIdDesc();
        int nextNum = 1;

        if (lastVisitor.isPresent()) {
            String lastCode = lastVisitor.get().getVisitorCode();
            if (lastCode.startsWith(currentDayPrefix)) {
                try {
                    String numPart = lastCode.substring(currentDayPrefix.length());
                    nextNum = Integer.parseInt(numPart) + 1;
                } catch (NumberFormatException e) {
                    // fallback if last code was modified manually
                    nextNum = lastVisitor.get().getVisitorId() + 1;
                }
            }
        }
        return currentDayPrefix + nextNum;
    }

    // 2. Register a New Visitor
    public Visitor registerVisitor(Visitor visitor, String username) {
        visitor.setVisitorCode(generateNextVisitorCode());
        visitor.setStatus("PENDING");
        if (visitor.getCreatedBy() == null || visitor.getCreatedBy().trim().isEmpty()) {
            visitor.setCreatedBy(username);
        }
        visitor.setCreatedAt(LocalDateTime.now());
        return visitorRepository.save(visitor);
    }

    // 3. Edit Visitor Details (Admin/Reception)
    public Visitor updateVisitor(Integer id, Visitor details) {
        Visitor visitor = visitorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Visitor not found with id: " + id));

        visitor.setName(details.getName());
        visitor.setMobile(details.getMobile());
        visitor.setEmail(details.getEmail());
        visitor.setCompanyName(details.getCompanyName());
        visitor.setPurpose(details.getPurpose());
        visitor.setPersonToMeet(details.getPersonToMeet());
        visitor.setDepartment(details.getDepartment());
        visitor.setVisitDate(details.getVisitDate());
        visitor.setIdProofType(details.getIdProofType());
        visitor.setIdNumber(details.getIdNumber());
        visitor.setPhoto(details.getPhoto());

        return visitorRepository.save(visitor);
    }

    // 4. Delete Visitor (Admin only)
    public void deleteVisitor(Integer id) {
        Visitor visitor = visitorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Visitor not found with id: " + id));
        visitorRepository.delete(visitor);
    }

    // 5. Approve Visitor (Admin/Reception)
    @Transactional
    public Visitor approveVisitor(Integer id, String username, String remarks, LocalDate visitDate, String visitTime) {
        Visitor visitor = visitorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Visitor not found with id: " + id));
        
        visitor.setStatus("APPROVED");
        if (visitDate != null) {
            visitor.setVisitDate(visitDate);
        }
        if (visitTime != null) {
            visitor.setVisitTime(visitTime);
        }
        visitorRepository.save(visitor);

        return visitor;
    }

    // 6. Reject Visitor (Admin/Reception)
    @Transactional
    public Visitor rejectVisitor(Integer id, String username, String remarks) {
        Visitor visitor = visitorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Visitor not found with id: " + id));
        
        visitor.setStatus("REJECTED");
        visitorRepository.save(visitor);

        return visitor;
    }

    // 7. Check-In Visitor (Admin/Reception)
    @Transactional
    public Visitor checkInVisitor(Integer id, String securityName, String remarks) {
        Visitor visitor = visitorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Visitor not found with id: " + id));

        if (!"APPROVED".equals(visitor.getStatus())) {
            throw new IllegalStateException("Visitor must be APPROVED before checking in!");
        }

        if (visitor.getVisitDate() != null) {
            LocalDateTime scheduled = visitor.getVisitDate().atStartOfDay();
            if (visitor.getVisitTime() != null && !visitor.getVisitTime().trim().isEmpty()) {
                try {
                    String[] timeParts = visitor.getVisitTime().split(":");
                    int hours = Integer.parseInt(timeParts[0]);
                    int minutes = Integer.parseInt(timeParts[1]);
                    scheduled = visitor.getVisitDate().atTime(hours, minutes);
                } catch (Exception e) {
                    // Ignore parsing error
                }
            }
            if (LocalDateTime.now().isBefore(scheduled)) {
                throw new IllegalStateException("Visitor's scheduled visit date and time has not been reached yet.");
            }
        }

        visitor.setStatus("CHECKED_IN");
        Visitor saved = visitorRepository.save(visitor);

        CheckIn checkIn = new CheckIn(saved, securityName, remarks);
        checkInRepository.save(checkIn);

        populateCheckTimes(saved);

        Settings settings = settingsRepository.findById(1).orElse(new Settings());
        boolean sendEmail = settings.getEmailNotification() != null && settings.getEmailNotification();
        boolean sendSms = settings.getSmsNotification() != null && settings.getSmsNotification();

        if (sendEmail) {
            java.util.concurrent.CompletableFuture.runAsync(() -> {
                try {
                    emailService.sendCheckInEmail(
                        saved.getEmail(),
                        saved.getName(),
                        saved.getVisitorCode(),
                        saved.getCheckinTime(),
                        securityName
                    );
                } catch (Exception e) {
                    System.err.println(">>> Failed to send visitor check-in email asynchronously: " + e.getMessage());
                }
            });
        }

        if (sendSms) {
            System.out.println(">>> [SMS GATEWAY] Dispatched check-in Entry Pass link to mobile " + saved.getMobile() + " for visitor " + saved.getName());
        }

        return saved;
    }

    // 8. Check-Out Visitor (Admin only)
    @Transactional
    public Visitor checkOutVisitor(Integer id, String remarks) {
        Visitor visitor = visitorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Visitor not found with id: " + id));

        if (!"CHECKED_IN".equals(visitor.getStatus())) {
            throw new IllegalStateException("Visitor must be CHECKED_IN before checking out!");
        }

        visitor.setStatus("CHECKED_OUT");
        Visitor saved = visitorRepository.save(visitor);

        CheckOut checkOut = new CheckOut(saved, remarks);
        checkOutRepository.save(checkOut);

        populateCheckTimes(saved);

        Settings settings = settingsRepository.findById(1).orElse(new Settings());
        boolean sendEmail = settings.getEmailNotification() != null && settings.getEmailNotification();
        boolean sendSms = settings.getSmsNotification() != null && settings.getSmsNotification();

        if (sendEmail) {
            java.util.concurrent.CompletableFuture.runAsync(() -> {
                try {
                    emailService.sendCheckOutEmail(
                        saved.getEmail(),
                        saved.getName(),
                        saved.getVisitorCode(),
                        saved.getCheckoutTime()
                    );
                } catch (Exception e) {
                    System.err.println(">>> Failed to send visitor check-out email asynchronously: " + e.getMessage());
                }
            });
        }

        if (sendSms) {
            System.out.println(">>> [SMS GATEWAY] Dispatched check-out confirmation link to mobile " + saved.getMobile() + " for visitor " + saved.getName());
        }

        return saved;
    }

    private Visitor populateCheckTimes(Visitor visitor) {
        if (visitor == null) return null;
        checkInRepository.findByVisitorVisitorId(visitor.getVisitorId())
                .ifPresent(checkin -> {
                    java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd hh:mm:ss a");
                    visitor.setCheckinTime(checkin.getCheckinTime().format(formatter));
                });
        checkOutRepository.findByVisitorVisitorId(visitor.getVisitorId())
                .ifPresent(checkout -> {
                    java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd hh:mm:ss a");
                    visitor.setCheckoutTime(checkout.getCheckoutTime().format(formatter));
                });
        return visitor;
    }

    // 9. Fetch and Sanitize List/Details for Security Role
    public List<Visitor> getAllVisitors() {
        return visitorRepository.findAll().stream()
                .map(this::populateCheckTimes)
                .collect(Collectors.toList());
    }

    public Optional<Visitor> getVisitorById(Integer id) {
        return visitorRepository.findById(id).map(this::populateCheckTimes);
    }

    public List<Visitor> searchVisitors(String query) {
        return visitorRepository.findByNameContainingIgnoreCaseOrVisitorCodeContainingIgnoreCaseOrPersonToMeetContainingIgnoreCase(query, query, query).stream()
                .map(this::populateCheckTimes)
                .collect(Collectors.toList());
    }

    public List<Visitor> filterVisitorsByStatus(String status) {
        return visitorRepository.findByStatus(status).stream()
                .map(this::populateCheckTimes)
                .collect(Collectors.toList());
    }


}
