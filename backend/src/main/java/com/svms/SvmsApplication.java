package com.svms;

import com.svms.entity.User;
import com.svms.entity.Settings;
import com.svms.repository.UserRepository;
import com.svms.repository.SettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

@SpringBootApplication
public class SvmsApplication {

    public static void main(String[] args) {
        SpringApplication.run(SvmsApplication.class, args);
    }

    @Bean
    public CommandLineRunner initDatabase(
            UserRepository userRepository,
            SettingsRepository settingsRepository,
            PasswordEncoder passwordEncoder,
            org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
        return args -> {
            // Run SQL migrations to add visitor_name column to checkins and checkouts if not exists
            try {
                Integer checkinColCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'checkins' AND column_name = 'visitor_name'",
                    Integer.class
                );
                if (checkinColCount == null || checkinColCount == 0) {
                    jdbcTemplate.execute("ALTER TABLE checkins ADD COLUMN visitor_name VARCHAR(100) NOT NULL DEFAULT ''");
                }

                Integer checkoutColCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'checkouts' AND column_name = 'visitor_name'",
                    Integer.class
                );
                if (checkoutColCount == null || checkoutColCount == 0) {
                    jdbcTemplate.execute("ALTER TABLE checkouts ADD COLUMN visitor_name VARCHAR(100) NOT NULL DEFAULT ''");
                }

                Integer plainPasswordColCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'plain_password'",
                    Integer.class
                );
                if (plainPasswordColCount == null || plainPasswordColCount == 0) {
                    jdbcTemplate.execute("ALTER TABLE users ADD COLUMN plain_password VARCHAR(255) DEFAULT NULL");
                    jdbcTemplate.execute("UPDATE users SET plain_password = 'admin123' WHERE plain_password IS NULL");
                }

                Integer expectedTimeColCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'visitors' AND column_name = 'expected_time'",
                    Integer.class
                );
                if (expectedTimeColCount != null && expectedTimeColCount > 0) {
                    jdbcTemplate.execute("ALTER TABLE visitors DROP COLUMN expected_time");
                    System.out.println(">>> Successfully dropped expected_time column from visitors table.");
                }

                try {
                    jdbcTemplate.execute("ALTER TABLE visitors MODIFY COLUMN visit_date DATE NULL");
                    System.out.println(">>> Successfully modified visit_date column to be NULL (optional) in visitors table.");
                } catch (Exception alterEx) {
                    System.err.println(">>> SQL schema update warning (alter visit_date): " + alterEx.getMessage());
                }

                jdbcTemplate.execute("UPDATE checkins c JOIN visitors v ON c.visitor_id = v.visitor_id SET c.visitor_name = v.name WHERE c.visitor_name = ''");
                jdbcTemplate.execute("UPDATE checkouts c JOIN visitors v ON c.visitor_id = v.visitor_id SET c.visitor_name = v.name WHERE c.visitor_name = ''");
                System.out.println(">>> SQL schema update completed successfully!");
            } catch (Exception e) {
                System.err.println(">>> SQL schema update error: " + e.getMessage());
            }

            // 1. Seed Default Administrator Account if not present
            if (!userRepository.findByUsername("admin").isPresent()) {
                User admin = new User();
                admin.setFullName("System Admin");
                admin.setEmail("admin@svms.com");
                admin.setMobile("9999999999");
                admin.setUsername("admin");
                // Encode the admin password
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setPlainPassword("admin123");
                admin.setRole("ROLE_ADMIN");
                admin.setCreatedAt(LocalDateTime.now());
                
                userRepository.save(admin);
                System.out.println(">>> Default Admin user seeded successfully! (Username: admin, Password: admin123)");
            }

            // 2. Seed Default Settings if not present
            Optional<Settings> existingSettings = settingsRepository.findById(1);
            if (!existingSettings.isPresent()) {
                Settings settings = new Settings();
                settings.setId(1);
                settings.setCompanyName("Smart Visitor Management System");
                settings.setVisitorIdFormat("vis-");
                settings.setEmailNotification(true);
                settings.setSmsNotification(false);
                
                settingsRepository.save(settings);
                System.out.println(">>> Default system settings seeded successfully!");
            } else {
                Settings settings = existingSettings.get();
                if ("VIS-".equals(settings.getVisitorIdFormat())) {
                    settings.setVisitorIdFormat("vis-");
                    settingsRepository.save(settings);
                    System.out.println(">>> Default system settings updated default prefix to 'vis-'");
                }
            }
        };
    }
}
