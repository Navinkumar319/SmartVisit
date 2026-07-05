package com.svms.controller;

import com.svms.dto.*;
import com.svms.entity.Visitor;
import com.svms.service.VisitorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/visitors")
public class VisitorController {

    @Autowired
    private VisitorService visitorService;

    // Helper method to get the current logged-in username
    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return "system";
        return auth.getName();
    }

    // 1. Get All Visitors
    @GetMapping
    public ResponseEntity<List<Visitor>> getAllVisitors() {
        List<Visitor> visitors = visitorService.getAllVisitors();
        return ResponseEntity.ok(visitors);
    }

    // 2. Get Single Visitor Details
    @GetMapping("/{id}")
    public ResponseEntity<?> getVisitorById(@PathVariable Integer id) {
        return visitorService.getVisitorById(id)
                .<ResponseEntity<?>>map(visitor -> ResponseEntity.ok(visitor))
                .orElse(ResponseEntity.notFound().build());
    }

    // 3. Register Visitor (Reception only)
    @PostMapping
    public ResponseEntity<?> registerVisitor(@RequestBody Visitor visitor) {
        try {
            Visitor saved = visitorService.registerVisitor(visitor, getCurrentUsername());
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    // 4. Update Visitor (Reception only)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateVisitor(@PathVariable Integer id, @RequestBody Visitor details) {
        try {
            Visitor updated = visitorService.updateVisitor(id, details);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    // 5. Delete Visitor (Admin only)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteVisitor(@PathVariable Integer id) {
        try {
            visitorService.deleteVisitor(id);
            return ResponseEntity.ok(new ApiResponse(true, "Visitor record deleted successfully!"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    // 6. Search Visitors
    @GetMapping("/search")
    public ResponseEntity<List<Visitor>> searchVisitors(@RequestParam String query) {
        List<Visitor> visitors = visitorService.searchVisitors(query);
        return ResponseEntity.ok(visitors);
    }

    // 7. Filter Visitors by Status
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Visitor>> getVisitorsByStatus(@PathVariable String status) {
        List<Visitor> visitors = visitorService.filterVisitorsByStatus(status);
        return ResponseEntity.ok(visitors);
    }

    // 8. Approve Visitor (Admin only)
    @PostMapping("/approve")
    public ResponseEntity<?> approveVisitor(@RequestBody ApprovalRequest request) {
        try {
            Visitor visitor = visitorService.approveVisitor(
                request.getVisitorId(), 
                getCurrentUsername(), 
                request.getRemarks(),
                request.getVisitDate(),
                request.getVisitTime()
            );
            return ResponseEntity.ok(new ApiResponse(true, "Visitor " + visitor.getVisitorCode() + " approved successfully!"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    // 9. Reject Visitor (Admin only)
    @PostMapping("/reject")
    public ResponseEntity<?> rejectVisitor(@RequestBody ApprovalRequest request) {
        try {
            Visitor visitor = visitorService.rejectVisitor(request.getVisitorId(), getCurrentUsername(), request.getRemarks());
            return ResponseEntity.ok(new ApiResponse(true, "Visitor " + visitor.getVisitorCode() + " rejected successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    // 10. Check-In Visitor (Reception only)
    @PostMapping("/checkin")
    public ResponseEntity<?> checkInVisitor(@RequestBody CheckInRequest request) {
        try {
            Visitor visitor = visitorService.checkInVisitor(request.getVisitorId(), request.getSecurityName(), request.getRemarks());
            return ResponseEntity.ok(visitor);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    // 11. Check-Out Visitor (Reception only)
    @PostMapping("/checkout")
    public ResponseEntity<?> checkOutVisitor(@RequestBody CheckOutRequest request) {
        try {
            Visitor visitor = visitorService.checkOutVisitor(request.getVisitorId(), request.getRemarks());
            return ResponseEntity.ok(visitor);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }
}
