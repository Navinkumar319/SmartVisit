package com.svms.controller;

import com.svms.entity.Visitor;
import com.svms.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private ReportService reportService;

    // Get report data in table format
    // Parameter type can be: daily, weekly, monthly, approved, rejected, history
    @GetMapping
    public ResponseEntity<List<Visitor>> getReport(@RequestParam(defaultValue = "history") String type) {
        List<Visitor> data = reportService.getReportData(type);
        return ResponseEntity.ok(data);
    }
}
