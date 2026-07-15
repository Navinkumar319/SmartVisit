package com.svms.service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.time.LocalDate;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @org.springframework.beans.factory.annotation.Value("${spring.mail.username:}")
    private String fromEmail;

    @PostConstruct
    public void init() {
        if (mailSender instanceof JavaMailSenderImpl) {
            JavaMailSenderImpl impl = (JavaMailSenderImpl) mailSender;
            System.out.println(">>> [EMAIL SERVICE] SMTP Initialized - Host: " + impl.getHost() + ", Port: " + impl.getPort() + ", Username: " + impl.getUsername());
        } else {
            System.out.println(">>> [EMAIL SERVICE] JavaMailSender is NULL or not an instance of JavaMailSenderImpl. Simulating emails.");
        }
    }

    /**
     * Sends a generic HTML email message.
     */
    private void sendHtmlEmail(String toEmail, String subject, String htmlBody) {
        System.out.println("==========================================");
        System.out.println(" [EMAIL SERVICE] SENDING HTML EMAIL ");
        System.out.println(" To: " + toEmail);
        System.out.println(" Subject: " + subject);
        System.out.println("==========================================");

        if (mailSender == null) {
            System.out.println("[EMAIL SERVICE] JavaMailSender is not configured in properties. Simulating email send only.");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            if (fromEmail != null && !fromEmail.trim().isEmpty()) {
                helper.setFrom(fromEmail);
            } else {
                helper.setFrom("kpugalk2003@gmail.com");
            }
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlBody, true); // true parameter indicates HTML content
            
            mailSender.send(message);
            System.out.println("[EMAIL SERVICE] HTML email sent successfully.");
        } catch (Exception e) {
            System.err.println("[EMAIL SERVICE] Failed to send HTML email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Sends a styled HTML OTP Verification Email.
     */
    public void sendOtpEmail(String toEmail, String otp) {
        int currentYear = LocalDate.now().getYear();
        String htmlBody = "<div style=\"font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;\">"
                + "    <div style=\"text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 25px;\">"
                + "        <h2 style=\"color: #1e3a8a; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;\">Smart Visitor Management System</h2>"
                + "    </div>"
                + "    <div style=\"padding: 10px 0;\">"
                + "        <p style=\"font-size: 16px; color: #1e293b; line-height: 1.6; margin-bottom: 16px;\">Hello,</p>"
                + "        <p style=\"font-size: 16px; color: #334155; line-height: 1.6; margin-bottom: 24px;\">You are registering an account in the Smart Visitor Management System. Please enter the following 6-digit One-Time Password (OTP) in the admin console to verify your email address:</p>"
                + "        <div style=\"text-align: center; margin: 35px 0;\">"
                + "            <span style=\"font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #2563eb; background-color: #eff6ff; padding: 16px 32px; border-radius: 8px; border: 1.5px dashed #3b82f6; display: inline-block; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.1);\">"
                +                  otp
                + "            </span>"
                + "        </div>"
                + "        <p style=\"font-size: 14px; color: #ef4444; line-height: 1.5; font-weight: 600; margin-top: 24px;\">⚠️ Note: This OTP is valid for exactly 5 minutes and must not be shared.</p>"
                + "    </div>"
                + "    <div style=\"border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: center; font-size: 12px; color: #64748b;\">"
                + "        <p style=\"margin-bottom: 6px;\">This is an automated system email. Please do not reply directly.</p>"
                + "        <p style=\"margin: 0;\">&copy; " + currentYear + " Smart Visitor Management System. All rights reserved.</p>"
                + "    </div>"
                + "</div>";

        sendHtmlEmail(toEmail, "SVMS - Account Verification OTP", htmlBody);
    }

    /**
     * Sends a styled HTML Welcome Email with generated credentials (username and temporary password).
     */
    public void sendCredentialsEmail(String toEmail, String fullName, String role, String username, String password) {
        int currentYear = LocalDate.now().getYear();
        String formattedRole = role.replace("ROLE_", "");
        
        String htmlBody = "<div style=\"font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;\">"
                + "    <div style=\"text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 25px;\">"
                + "        <h2 style=\"color: #065f46; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;\">Welcome to SVMS!</h2>"
                + "    </div>"
                + "    <div style=\"padding: 10px 0;\">"
                + "        <p style=\"font-size: 16px; color: #1e293b; line-height: 1.6; margin-bottom: 16px;\">Dear " + fullName + ",</p>"
                + "        <p style=\"font-size: 16px; color: #334155; line-height: 1.6; margin-bottom: 20px;\">An account has been created for you in the Smart Visitor Management System. Below are your login credentials:</p>"
                + "        "
                + "        <table style=\"width: 100%; border-collapse: collapse; margin: 24px 0; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden;\">"
                + "            <tr>"
                + "                <td style=\"padding: 14px 18px; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0; width: 35%;\">Role:</td>"
                + "                <td style=\"padding: 14px 18px; border-bottom: 1px solid #e2e8f0; color: #2563eb; font-weight: 600; text-transform: uppercase;\">" + formattedRole + "</td>"
                + "            </tr>"
                + "            <tr>"
                + "                <td style=\"padding: 14px 18px; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0;\">Username:</td>"
                + "                <td style=\"padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 16px; font-weight: 700; color: #0f172a;\">" + username + "</td>"
                + "            </tr>"
                + "            <tr>"
                + "                <td style=\"padding: 14px 18px; font-weight: 600; color: #475569;\">Temporary Password:</td>"
                + "                <td style=\"padding: 14px 18px; font-family: monospace; font-size: 16px; font-weight: 700; color: #ef4444;\">" + password + "</td>"
                + "            </tr>"
                + "        </table>"
                + "        "
                + "        <p style=\"font-size: 14.5px; color: #475569; line-height: 1.6; margin-top: 20px;\">Please log in to the portal at your earliest convenience. For security reasons, we strongly recommend updating your password after logging in for the first time.</p>"
                + "    </div>"
                + "    <div style=\"border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: center; font-size: 12px; color: #64748b;\">"
                + "        <p style=\"margin-bottom: 6px;\">This is an automated system email. Please do not reply directly.</p>"
                + "        <p style=\"margin: 0;\">&copy; " + currentYear + " Smart Visitor Management System. All rights reserved.</p>"
                + "    </div>"
                + "</div>";

        sendHtmlEmail(toEmail, "SVMS - Your Login Credentials", htmlBody);
    }

    /**
     * Sends a styled HTML Check-In Notification Email to a visitor.
     */
    public void sendCheckInEmail(String toEmail, String name, String visitorCode, String checkinTime, String securityName, String department, String roomNo, String floor) {
        int currentYear = LocalDate.now().getYear();
        
        String htmlBody = "<div style=\"font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;\">"
                + "    <div style=\"text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 25px;\">"
                + "        <h2 style=\"color: #1e3a8a; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;\">Check-In Successful</h2>"
                + "    </div>"
                + "    <div style=\"padding: 10px 0;\">"
                + "        <p style=\"font-size: 16px; color: #1e293b; line-height: 1.6; margin-bottom: 16px;\">Dear " + name + ",</p>"
                + "        <p style=\"font-size: 16px; color: #334155; line-height: 1.6; margin-bottom: 20px;\">You have successfully checked into our building. Below are your check-in details:</p>"
                + "        "
                + "        <table style=\"width: 100%; border-collapse: collapse; margin: 24px 0; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden;\">"
                + "            <tr>"
                + "                <td style=\"padding: 14px 18px; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0; width: 35%;\">Visitor Code:</td>"
                + "                <td style=\"padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 16px; font-weight: 700; color: #2563eb;\">" + visitorCode + "</td>"
                + "            </tr>"
                + "            <tr>"
                + "                <td style=\"padding: 14px 18px; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0;\">Check-In Time:</td>"
                + "                <td style=\"padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-size: 14.5px; font-weight: 600; color: #0f172a;\">" + checkinTime + "</td>"
                + "            </tr>"
                + "            <tr>"
                + "                <td style=\"padding: 14px 18px; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0;\">Host Department:</td>"
                + "                <td style=\"padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-size: 14.5px; color: #0f172a;\">" + department + "</td>"
                + "            </tr>"
                + "            <tr>"
                + "                <td style=\"padding: 14px 18px; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0;\">Location Floor:</td>"
                + "                <td style=\"padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-size: 14.5px; color: #0f172a;\">" + floor + "</td>"
                + "            </tr>"
                + "            <tr>"
                + "                <td style=\"padding: 14px 18px; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0;\">Room Number:</td>"
                + "                <td style=\"padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-size: 14.5px; color: #0f172a;\">" + roomNo + "</td>"
                + "            </tr>"
                + "            <tr>"
                + "                <td style=\"padding: 14px 18px; font-weight: 600; color: #475569;\">Duty Officer:</td>"
                + "                <td style=\"padding: 14px 18px; font-size: 14.5px; color: #0f172a;\">" + securityName + "</td>"
                + "            </tr>"
                + "        </table>"
                + "        "
                + "        <div style=\"background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 20px; margin-top: 24px;\">"
                + "            <h4 style=\"margin: 0 0 12px 0; color: #b45309; font-size: 15px; font-weight: 700;\">⚠️ IMPORTANT VISITOR GUIDELINES:</h4>"
                + "            <ul style=\"margin: 0; padding-left: 20px; font-size: 14px; color: #78350f; line-height: 1.6;\">"
                + "                <li style=\"margin-bottom: 8px;\"><strong>Display Pass:</strong> Wear your physical visitor badge visibly at all times inside the premises.</li>"
                + "                <li style=\"margin-bottom: 8px;\"><strong>Stay in Area:</strong> Remain in the designated office or public meeting areas authorized for your visit.</li>"
                + "                <li style=\"margin-bottom: 8px;\"><strong>No Unapproved Media:</strong> Photography or video filming is strictly restricted.</li>"
                + "                <li style=\"margin-bottom: 0;\"><strong>Exit Sign-Out:</strong> Hand over your visitor badge to the Security Desk and verify your exit check-out before leaving the premises.</li>"
                + "            </ul>"
                + "        </div>"
                + "    </div>"
                + "    <div style=\"border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: center; font-size: 12px; color: #64748b;\">"
                + "        <p style=\"margin-bottom: 6px;\">This is an automated system email. Please do not reply directly.</p>"
                + "        <p style=\"margin: 0;\">&copy; " + currentYear + " Smart Visitor Management System. All rights reserved.</p>"
                + "    </div>"
                + "</div>";

        sendHtmlEmail(toEmail, "SVMS Check-In Notification - " + visitorCode, htmlBody);
    }

    /**
     * Sends a styled HTML Check-Out Confirmation Email to a visitor.
     */
    public void sendCheckOutEmail(String toEmail, String name, String visitorCode, String checkoutTime, String department, String roomNo, String floor) {
        int currentYear = LocalDate.now().getYear();
        
        String htmlBody = "<div style=\"font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;\">"
                + "    <div style=\"text-align: center; border-bottom: 2px solid #64748b; padding-bottom: 20px; margin-bottom: 25px;\">"
                + "        <h2 style=\"color: #334155; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;\">Check-Out Confirmed</h2>"
                + "    </div>"
                + "    <div style=\"padding: 10px 0;\">"
                + "        <p style=\"font-size: 16px; color: #1e293b; line-height: 1.6; margin-bottom: 16px;\">Dear " + name + ",</p>"
                + "        <p style=\"font-size: 16px; color: #334155; line-height: 1.6; margin-bottom: 20px;\">You have successfully checked out of the premises. Thank you for your visit!</p>"
                + "        "
                + "        <table style=\"width: 100%; border-collapse: collapse; margin: 24px 0; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden;\">"
                + "            <tr>"
                + "                <td style=\"padding: 14px 18px; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0; width: 35%;\">Visitor Code:</td>"
                + "                <td style=\"padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 16px; font-weight: 700; color: #64748b;\">" + visitorCode + "</td>"
                + "            </tr>"
                + "            <tr>"
                + "                <td style=\"padding: 14px 18px; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0;\">Check-Out Time:</td>"
                + "                <td style=\"padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-size: 14.5px; font-weight: 600; color: #0f172a;\">" + checkoutTime + "</td>"
                + "            </tr>"
                + "            <tr>"
                + "                <td style=\"padding: 14px 18px; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0;\">Host Department:</td>"
                + "                <td style=\"padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-size: 14.5px; color: #0f172a;\">" + department + "</td>"
                + "            </tr>"
                + "            <tr>"
                + "                <td style=\"padding: 14px 18px; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0;\">Location Floor:</td>"
                + "                <td style=\"padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-size: 14.5px; color: #0f172a;\">" + floor + "</td>"
                + "            </tr>"
                + "            <tr>"
                + "                <td style=\"padding: 14px 18px; font-weight: 600; color: #475569;\">Room Number:</td>"
                + "                <td style=\"padding: 14px 18px; font-size: 14.5px; color: #0f172a;\">" + roomNo + "</td>"
                + "            </tr>"
                + "        </table>"
                + "        "
                + "        <p style=\"font-size: 15px; color: #475569; line-height: 1.6;\">Have a safe journey back!</p>"
                + "    </div>"
                + "    <div style=\"border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: center; font-size: 12px; color: #64748b;\">"
                + "        <p style=\"margin-bottom: 6px;\">This is an automated system email. Please do not reply directly.</p>"
                + "        <p style=\"margin: 0;\">&copy; " + currentYear + " Smart Visitor Management System. All rights reserved.</p>"
                + "    </div>"
                + "</div>";

        sendHtmlEmail(toEmail, "SVMS Check-Out Confirmation - " + visitorCode, htmlBody);
    }

    /**
     * Sends a styled HTML Visitor Pass / Entry Invitation Email when approval is given.
     */
    public void sendApprovalPassEmail(String toEmail, String name, String visitorCode, String hostName, String department, String purpose, String visitDate, String visitTime, String roomNo, String floor) {
        int currentYear = LocalDate.now().getYear();
        
        String formattedDate = formatDateStandard(visitDate);
        String formattedTime = formatTimeTo12Hour(visitTime);

        System.out.println("==========================================");
        System.out.println(" [EMAIL SERVICE] SENDING APPROVAL PASS EMAIL ");
        System.out.println(" To: " + toEmail);
        System.out.println(" Date: " + formattedDate + " Time: " + formattedTime);
        System.out.println("==========================================");

        String htmlBody = "<div style=\"font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;\">"
                + "    <div style=\"text-align: center; border-bottom: 2px solid #0047ff; padding-bottom: 20px; margin-bottom: 25px;\">"
                + "        <h2 style=\"color: #0047ff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;\">Visitor Gate Pass Approved</h2>"
                + "        <p style=\"margin: 6px 0 0 0; color: #475569; font-size: 14px;\">Smart Visitor Management System</p>"
                + "    </div>"
                + "    <div style=\"padding: 10px 0;\">"
                + "        <p style=\"font-size: 16px; color: #1e293b; line-height: 1.6; margin-bottom: 16px;\">Dear " + name + ",</p>"
                + "        <p style=\"font-size: 16px; color: #334155; line-height: 1.6; margin-bottom: 20px;\">Your visitor gate pass request has been <strong>APPROVED</strong>. Please present the visitor code below at the reception/security desk upon arrival:</p>"
                + "        "
                + "        <div style=\"text-align: center; margin: 30px 0;\">"
                + "            <span style=\"font-size: 28px; font-weight: 700; letter-spacing: 2px; color: #ffffff; background-color: #0047ff; padding: 14px 28px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 10px rgba(0, 71, 255, 0.15);\">"
                +                  visitorCode
                + "            </span>"
                + "        </div>"
                + "        "
                + "        <table style=\"width: 100%; border-collapse: collapse; margin: 24px 0; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden;\">"
                + "            <tr>"
                + "                <td style=\"padding: 14px 18px; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0; width: 35%;\">Visitor Name:</td>"
                + "                <td style=\"padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-size: 14.5px; font-weight: 600; color: #0f172a;\">" + name + "</td>"
                + "            </tr>"
                + "            <tr>"
                + "                <td style=\"padding: 14px 18px; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0;\">Host to Meet:</td>"
                + "                <td style=\"padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-size: 14.5px; font-weight: 600; color: #0f172a;\">" + hostName + " (" + department + ")</td>"
                + "            </tr>"
                + "            <tr>"
                + "                <td style=\"padding: 14px 18px; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0;\">Location Floor:</td>"
                + "                <td style=\"padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-size: 14.5px; color: #0f172a;\">" + floor + "</td>"
                + "            </tr>"
                + "            <tr>"
                + "                <td style=\"padding: 14px 18px; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0;\">Room Number:</td>"
                + "                <td style=\"padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-size: 14.5px; color: #0f172a;\">" + roomNo + "</td>"
                + "            </tr>"
                + "            <tr>"
                + "                <td style=\"padding: 14px 18px; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0;\">Visit Date:</td>"
                + "                <td style=\"padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-size: 14.5px; color: #0f172a;\">" + formattedDate + "</td>"
                + "            </tr>"
                + "            <tr>"
                + "                <td style=\"padding: 14px 18px; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0;\">Visit Time:</td>"
                + "                <td style=\"padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-size: 14.5px; color: #0f172a;\">" + formattedTime + "</td>"
                + "            </tr>"
                + "            <tr>"
                + "                <td style=\"padding: 14px 18px; font-weight: 600; color: #475569;\">Purpose:</td>"
                + "                <td style=\"padding: 14px 18px; font-size: 14.5px; color: #0f172a;\">" + purpose + "</td>"
                + "            </tr>"
                + "        </table>"
                + "        "
                + "        <div style=\"background-color: #eff6ff; border: 1px solid #dbeafe; border-radius: 8px; padding: 20px; margin-top: 24px;\">"
                + "            <h4 style=\"margin: 0 0 10px 0; color: #1e40af; font-size: 15px; font-weight: 700;\">ℹ️ ENTRY INSTRUCTIONS:</h4>"
                + "            <p style=\"margin: 0; font-size: 14px; color: #1e3a8a; line-height: 1.5;\">"
                + "                Upon arrival, please show this email or state your Visitor Code at the main gate. A physical visitor badge will be printed for you once your identity is verified."
                + "            </p>"
                + "        </div>"
                + "    </div>"
                + "    <div style=\"border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: center; font-size: 12px; color: #64748b;\">"
                + "        <p style=\"margin-bottom: 6px;\">This is an automated system email. Please do not reply directly.</p>"
                + "        <p style=\"margin: 0;\">&copy; " + currentYear + " Smart Visitor Management System. All rights reserved.</p>"
                + "    </div>"
                + "</div>";
 
        sendHtmlEmail(toEmail, "SVMS Gate Pass Approved - " + visitorCode, htmlBody);
    }

    /**
     * Sends an Overstay Warning Email to the visitor.
     */
    public void sendVisitorOverstayEmail(String toEmail, String name, String visitorCode, String checkinTime) {
        int currentYear = LocalDate.now().getYear();
        
        String htmlBody = "<div style=\"font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #fecaca; border-radius: 12px; background-color: #fff5f5;\">"
                + "    <div style=\"text-align: center; border-bottom: 2px solid #ef4444; padding-bottom: 20px; margin-bottom: 25px;\">"
                + "        <h2 style=\"color: #991b1b; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;\">⚠️ Overstay Alert Notification</h2>"
                + "        <p style=\"margin: 6px 0 0 0; color: #7f1d1d; font-size: 14px;\">Smart Visitor Management System</p>"
                + "    </div>"
                + "    <div style=\"padding: 10px 0;\">"
                + "        <p style=\"font-size: 16px; color: #1e293b; line-height: 1.6; margin-bottom: 16px;\">Dear " + name + ",</p>"
                + "        <p style=\"font-size: 16px; color: #334155; line-height: 1.6; margin-bottom: 20px;\">Our records show that you checked into the premises at <strong>" + checkinTime + "</strong> and have exceeded the standard visit duration of <strong>8 hours</strong>.</p>"
                + "        "
                + "        <div style=\"background-color: #ffffff; border: 1px solid #fca5a5; border-radius: 8px; padding: 20px; margin: 24px 0;\">"
                + "            <p style=\"margin: 0 0 8px 0; font-size: 14.5px; color: #1e293b;\"><strong>Visitor Code:</strong> " + visitorCode + "</p>"
                + "            <p style=\"margin: 0; font-size: 14.5px; color: #1e293b;\"><strong>Check-In Time:</strong> " + checkinTime + "</p>"
                + "        </div>"
                + "        "
                + "        <p style=\"font-size: 15px; color: #b91c1c; font-weight: 600; line-height: 1.6;\">Action Required: Please report to the Security Desk / Reception immediately to sign out and verify your check-out.</p>"
                + "    </div>"
                + "    <div style=\"border-top: 1px solid #fca5a5; padding-top: 20px; margin-top: 30px; text-align: center; font-size: 12px; color: #991b1b;\">"
                + "        <p style=\"margin-bottom: 6px;\">This is an automated security system warning. Please do not reply directly.</p>"
                + "        <p style=\"margin: 0;\">&copy; " + currentYear + " Smart Visitor Management System. All rights reserved.</p>"
                + "    </div>"
                + "</div>";

        sendHtmlEmail(toEmail, "SVMS Security Alert: Visitor Overstay Notice - " + visitorCode, htmlBody);
    }

    /**
     * Sends an Overstay Security Alert Email to Admin / Security personnel.
     */
    public void sendStaffOverstayAlertEmail(String staffEmail, String staffName, String visitorName, String visitorCode, String company, String checkinTime, double durationHours, String hostName, String department) {
        int currentYear = LocalDate.now().getYear();
        
        String htmlBody = "<div style=\"font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #ef4444; border-radius: 12px; background-color: #ffffff;\">"
                + "    <div style=\"text-align: center; border-bottom: 2px solid #ef4444; padding-bottom: 20px; margin-bottom: 25px;\">"
                + "        <h2 style=\"color: #b91c1c; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;\">🚨 STAFF ALERT: Visitor Overstay Detected</h2>"
                + "        <p style=\"margin: 6px 0 0 0; color: #475569; font-size: 14px;\">Smart Visitor Management System</p>"
                + "    </div>"
                + "    <div style=\"padding: 10px 0;\">"
                + "        <p style=\"font-size: 16px; color: #1e293b; line-height: 1.6; margin-bottom: 16px;\">Dear " + staffName + ",</p>"
                + "        <p style=\"font-size: 16px; color: #334155; line-height: 1.6; margin-bottom: 20px;\">The following visitor has exceeded their authorized duration of stay (8 hours) and is still logged inside the building. Please locate the visitor or verify their checkout status immediately.</p>"
                + "        "
                + "        <table style=\"width: 100%; border-collapse: collapse; margin: 24px 0; background-color: #fef2f2; border-radius: 8px; border: 1px solid #fca5a5; overflow: hidden;\">"
                + "            <tr>"
                + "                <td style=\"padding: 14px 18px; font-weight: 600; color: #7f1d1d; border-bottom: 1px solid #fca5a5; width: 35%;\">Visitor Name:</td>"
                + "                <td style=\"padding: 14px 18px; border-bottom: 1px solid #fca5a5; font-size: 14.5px; font-weight: 600; color: #0f172a;\">" + visitorName + "</td>"
                + "            </tr>"
                + "            <tr>"
                + "                <td style=\"padding: 14px 18px; font-weight: 600; color: #7f1d1d; border-bottom: 1px solid #fca5a5;\">Visitor Code:</td>"
                + "                <td style=\"padding: 14px 18px; border-bottom: 1px solid #fca5a5; font-family: monospace; font-size: 16px; font-weight: 700; color: #b91c1c;\">" + visitorCode + "</td>"
                + "            </tr>"
                + "            <tr>"
                + "                <td style=\"padding: 14px 18px; font-weight: 600; color: #7f1d1d; border-bottom: 1px solid #fca5a5;\">Company:</td>"
                + "                <td style=\"padding: 14px 18px; border-bottom: 1px solid #fca5a5; font-size: 14.5px; color: #0f172a;\">" + (company != null ? company : "No Company") + "</td>"
                + "            </tr>"
                + "            <tr>"
                + "                <td style=\"padding: 14px 18px; font-weight: 600; color: #7f1d1d; border-bottom: 1px solid #fca5a5;\">Check-In Time:</td>"
                + "                <td style=\"padding: 14px 18px; border-bottom: 1px solid #fca5a5; font-size: 14.5px; font-weight: 600; color: #0f172a;\">" + checkinTime + "</td>"
                + "            </tr>"
                + "            <tr>"
                + "                <td style=\"padding: 14px 18px; font-weight: 600; color: #7f1d1d; border-bottom: 1px solid #fca5a5;\">Duration inside:</td>"
                + "                <td style=\"padding: 14px 18px; border-bottom: 1px solid #fca5a5; font-size: 14.5px; font-weight: 700; color: #ef4444;\">" + String.format("%.1f", durationHours) + " hours</td>"
                + "            </tr>"
                + "            <tr>"
                + "                <td style=\"padding: 14px 18px; font-weight: 600; color: #7f1d1d;\">Host Person:</td>"
                + "                <td style=\"padding: 14px 18px; font-size: 14.5px; color: #0f172a;\">" + hostName + " (" + department + ")</td>"
                + "            </tr>"
                + "        </table>"
                + "    </div>"
                + "    <div style=\"border-top: 1px solid #ef4444; padding-top: 20px; margin-top: 30px; text-align: center; font-size: 12px; color: #64748b;\">"
                + "        <p style=\"margin-bottom: 6px;\">This is a high-priority security alert from the SVMS monitoring gateway.</p>"
                + "        <p style=\"margin: 0;\">&copy; " + currentYear + " Smart Visitor Management System. All rights reserved.</p>"
                + "    </div>"
                + "</div>";

        sendHtmlEmail(staffEmail, "SVMS SECURITY ALERT: Overstay Detected - " + visitorName, htmlBody);
    }

    private String formatTimeTo12Hour(String timeStr) {
        if (timeStr == null || timeStr.trim().isEmpty() || "N/A".equalsIgnoreCase(timeStr)) {
            return "N/A";
        }
        try {
            if (timeStr.toLowerCase().contains("am") || timeStr.toLowerCase().contains("pm")) {
                return timeStr;
            }
            java.time.LocalTime time = java.time.LocalTime.parse(timeStr, java.time.format.DateTimeFormatter.ofPattern("HH:mm"));
            return time.format(java.time.format.DateTimeFormatter.ofPattern("hh:mm a")).toUpperCase();
        } catch (Exception e) {
            try {
                java.time.LocalTime time = java.time.LocalTime.parse(timeStr, java.time.format.DateTimeFormatter.ofPattern("HH:mm:ss"));
                return time.format(java.time.format.DateTimeFormatter.ofPattern("hh:mm a")).toUpperCase();
            } catch (Exception ex) {
                return timeStr;
            }
        }
    }

    private String formatDateStandard(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty() || "N/A".equalsIgnoreCase(dateStr)) {
            return "N/A";
        }
        try {
            java.time.LocalDate date = java.time.LocalDate.parse(dateStr);
            return date.format(java.time.format.DateTimeFormatter.ofPattern("dd-MM-yyyy"));
        } catch (Exception e) {
            return dateStr;
        }
    }
}
