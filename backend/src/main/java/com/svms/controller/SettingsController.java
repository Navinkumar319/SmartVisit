package com.svms.controller;

import com.svms.dto.ApiResponse;
import com.svms.dto.SettingsDto;
import com.svms.entity.Settings;
import com.svms.repository.SettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    @Autowired
    private SettingsRepository settingsRepository;

    // 1. Get System Settings (Single row configuration id = 1)
    @GetMapping
    public ResponseEntity<Settings> getSettings() {
        Settings settings = settingsRepository.findById(1)
                .orElseGet(() -> {
                    Settings s = new Settings();
                    s.setId(1);
                    return settingsRepository.save(s);
                });
        return ResponseEntity.ok(settings);
    }

    // 2. Update System Settings
    @PutMapping
    public ResponseEntity<?> updateSettings(@RequestBody SettingsDto dto) {
        Settings settings = settingsRepository.findById(1)
                .orElseGet(() -> {
                    Settings s = new Settings();
                    s.setId(1);
                    return s;
                });

        settings.setCompanyName(dto.getCompanyName());
        if (dto.getCompanyLogo() != null) {
            settings.setCompanyLogo(dto.getCompanyLogo());
        }
        settings.setVisitorIdFormat(dto.getVisitorIdFormat());
        settings.setEmailNotification(dto.getEmailNotification());
        settings.setSmsNotification(dto.getSmsNotification());

        settingsRepository.save(settings);
        return ResponseEntity.ok(new ApiResponse(true, "Settings updated successfully!"));
    }
}
