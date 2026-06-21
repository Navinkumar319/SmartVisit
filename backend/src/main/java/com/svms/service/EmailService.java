package com.svms.service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

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
            
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlBody, true); // true parameter indicates HTML content
            
            mailSender.send(message);
            System.out.println("[EMAIL SERVICE] HTML email sent successfully.");
        } catch (Exception e) {
            System.err.println("[EMAIL SERVICE] Failed to send HTML email: " + e.getMessage());
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
    public void sendCheckInEmail(String toEmail, String name, String visitorCode, String checkinTime, String securityName) {
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
    public void sendCheckOutEmail(String toEmail, String name, String visitorCode, String checkoutTime) {
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
                + "                <td style=\"padding: 14px 18px; font-weight: 600; color: #475569;\">Check-Out Time:</td>"
                + "                <td style=\"padding: 14px 18px; font-size: 14.5px; font-weight: 600; color: #0f172a;\">" + checkoutTime + "</td>"
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
}
