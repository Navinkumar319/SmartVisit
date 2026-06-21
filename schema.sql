-- Smart Visitor Management System Database Schema
-- Database: svms_db

CREATE DATABASE IF NOT EXISTS svms_db;
USE svms_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    mobile VARCHAR(15) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    plain_password VARCHAR(255) DEFAULT NULL,
    role VARCHAR(30) NOT NULL, -- ROLE_ADMIN, ROLE_RECEPTION
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Visitors Table
CREATE TABLE IF NOT EXISTS visitors (
    visitor_id INT AUTO_INCREMENT PRIMARY KEY,
    visitor_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    email VARCHAR(100) NOT NULL,
    company_name VARCHAR(100),
    purpose VARCHAR(255) NOT NULL,
    person_to_meet VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    visit_date DATE NOT NULL,
    expected_time VARCHAR(20) NOT NULL,
    id_proof_type VARCHAR(50) NOT NULL,
    id_number VARCHAR(50) NOT NULL,
    photo LONGTEXT, -- Stores Base64-encoded image content
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, CHECKED_IN, CHECKED_OUT
    created_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Check-Ins Table
CREATE TABLE IF NOT EXISTS checkins (
    checkin_id INT AUTO_INCREMENT PRIMARY KEY,
    visitor_id INT NOT NULL,
    visitor_name VARCHAR(100) NOT NULL,
    checkin_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    security_name VARCHAR(100) NOT NULL,
    remarks VARCHAR(255),
    FOREIGN KEY (visitor_id) REFERENCES visitors(visitor_id) ON DELETE CASCADE
);

-- 5. Check-Outs Table
CREATE TABLE IF NOT EXISTS checkouts (
    checkout_id INT AUTO_INCREMENT PRIMARY KEY,
    visitor_id INT NOT NULL,
    visitor_name VARCHAR(100) NOT NULL,
    checkout_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    remarks VARCHAR(255),
    FOREIGN KEY (visitor_id) REFERENCES visitors(visitor_id) ON DELETE CASCADE
);

-- 6. Settings Table (to persist system configuration)
CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY DEFAULT 1,
    company_name VARCHAR(100) NOT NULL DEFAULT 'Smart Visitor Management System',
    company_logo LONGTEXT, -- Base64 logo
    visitor_id_format VARCHAR(20) NOT NULL DEFAULT 'VIS-',
    email_notification TINYINT(1) NOT NULL DEFAULT 1,
    sms_notification TINYINT(1) NOT NULL DEFAULT 0,
    CONSTRAINT single_row CHECK (id = 1)
);

-- Seed initial settings row if not present
INSERT INTO settings (id, company_name, visitor_id_format, email_notification, sms_notification)
SELECT 1, 'Smart Visitor Management System', 'VIS-', 1, 0
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE id = 1);

-- 7. OTP Table for user creation verification
CREATE TABLE IF NOT EXISTS otp (
    otp_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    expiry_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

