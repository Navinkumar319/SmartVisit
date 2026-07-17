# 🛡️ SmartVisit (SVMS)

## An Enterprise-Grade AI-Powered Visitor Management and Intelligent Access Control Platform

SmartVisit (SVMS) is a complete, production-grade SaaS-style platform designed to automate and streamline the entire visitor management lifecycle within organizations. The system integrates Artificial Intelligence, secure authentication, role-based access control, and real-time analytics into a unified web application. SmartVisit eliminates traditional paper-based visitor registration and manual verification processes by providing AI-assisted visitor identity verification, digital approvals, intelligent access management, and centralized visitor monitoring.

The platform addresses modern organizational security challenges such as unauthorized access, manual visitor verification, inefficient approval workflows, poor visitor tracking, lack of real-time monitoring, and limited reporting capabilities. Through automation and intelligent technologies, SmartVisit delivers a faster, more secure, and highly efficient visitor management ecosystem suitable for enterprises, educational institutions, hospitals, corporate offices, government organizations, and industrial environments.

---

# 🏗️ Enterprise System Architecture

The application follows a modern multi-layer enterprise architecture that separates the frontend, backend, security, AI engine, and database into independent layers for scalability and maintainability.

**React.js (Frontend) ➜ REST APIs (JSON) ➜ Spring Boot (Backend) ➜ Spring Security (JWT) ➜ AI Engine ➜ MySQL Database**

### Presentation Layer (Frontend)

The frontend is developed using **React.js** with **Vite**, providing a responsive Single Page Application (SPA). It enables users to perform visitor registration, approvals, AI verification, dashboard monitoring, and report generation through a fast and intuitive interface without page reloads.

### Business Logic Layer (Backend)

The backend is built using **Java Spring Boot**, which handles all business operations including visitor registration, approval workflows, role management, visitor lifecycle management, report generation, notifications, and system administration.

### Security Layer

Security is implemented using **Spring Security**, **JWT Authentication**, and **BCrypt Password Encryption**. The system enforces strict Role-Based Access Control (RBAC), ensuring that each user can access only the modules permitted for their assigned role.

### Artificial Intelligence Layer

The AI module utilizes **Face API** and **TensorFlow Models** for real-time face detection and visitor identity verification during registration, check-in, and check-out. This improves security while reducing manual verification effort.

### Data Persistence Layer

The application uses **MySQL 8.0** together with **Spring Data JPA** and **Hibernate ORM** to securely manage visitor information, approvals, reports, audit logs, and user accounts while maintaining reliable ACID-compliant transactions.

---

# 🌟 Core Modules

## 1.🔐 Authentication & Security Module

* Secure Login Authentication
* BCrypt Password Encryption
* JWT-Based Authentication
* Role-Based Access Control
* Secure Session Management
* Audit Log Monitoring

---

## 2.👤 Visitor Registration Module

* Digital Visitor Registration
* Visitor Information Management
* Visitor Photo Capture
* AI Face Detection
* Visitor Data Validation
* Visitor Record Creation

---

## 3.✅ AI Visitor Verification Module

* AI Face Detection
* Face Alignment
* Visitor Identity Verification
* AI Verification during Check-In
* AI Verification during Check-Out
* Secure Visitor Authentication

---

## 4.🛂 Visitor Approval & Access Control Module

* Visitor Approval Workflow
* Admin Approval & Rejection
* Digital Visitor Pass
* Controlled Visitor Entry
* Access Authorization

---

## 5.🚪 Check-In & Check-Out Module

* AI-Assisted Check-In
* AI-Assisted Check-Out
* Entry Time Recording
* Exit Time Recording
* Visitor Status Management

---

## 6.📍 Live Visitor Monitoring Module

* Active Visitor Tracking
* Visitor Status Monitoring
* Real-Time Visitor Dashboard
* Visitor Duration Monitoring
* Intelligent Overstay Detection

---

## 7.📢 Notification Module

* Automatic Email Notifications
* Visitor Approval Notifications
* Overstay Alerts
* Security Alerts
* Administrative Notifications

---

## 8.📊 Reports & Analytics Module

* Daily Visitor Reports
* Monthly Visitor Reports
* Department-wise Reports
* Approval Reports
* Check-In & Check-Out Reports
* Dashboard Analytics
* Excel Export
* PDF Export

---

## 9.👥 User & Department Management Module

* User Management
* Department Management
* Role Assignment
* Account Activation & Deactivation
* System Configuration

---

# 🤖 AI Features

SmartVisit integrates Artificial Intelligence to improve organizational security and automate visitor verification.

The AI capabilities include:

* AI Face Detection
* Automatic Face Alignment
* AI-Based Visitor Identity Verification
* AI-Assisted Check-In & Check-Out
* Intelligent Overstay Detection
* Real-Time Visitor Monitoring
* Automated Security Notifications

---

# 💡 Project Novelty

Unlike conventional visitor management systems that mainly focus on visitor registration and access logging, SmartVisit introduces an intelligent visitor lifecycle management platform.

The major innovations include:

* Intelligent End-to-End Visitor Lifecycle Management
* AI-Assisted Visitor Identity Verification
* Automated Visitor Approval Workflow
* Intelligent Overstay Detection
* Automated Email Alert System
* Integrated Reception–Admin–Security Workflow
* Live Visitor Monitoring
* Centralized Dashboard Analytics
* Enterprise-Level Role-Based Security
* Secure Digital Visitor History Management

---

# 🗄️ Database Schema

The application follows a normalized relational database design.

### users

Stores administrator, receptionist, and security user accounts.

### departments

Stores organization departments.

### visitors

Stores visitor personal information, host details, purpose of visit, and visitor status.

### approvals

Stores visitor approval and rejection records.

### face_records

Stores AI face registration information.

### checkin_logs

Stores visitor check-in history.

### checkout_logs

Stores visitor check-out history.

### notifications

Stores email notifications and alert history.

### reports

Stores analytical report information.

### audit_logs

Stores login history and important system activities.

---

# 🛠️ Technology Stack

| Layer                   | Technology                                  |
| ----------------------- | ------------------------------------------- |
| Frontend                | React.js 19, Vite                           |
| UI Framework            | Tailwind CSS, Framer Motion, Lucide React   |
| Routing                 | React Router DOM                            |
| State Management        | Context API                                 |
| Backend                 | Java 21, Spring Boot 3.2.x                  |
| Security                | Spring Security, JWT Authentication, BCrypt |
| Database                | MySQL 8.0                                   |
| ORM                     | Spring Data JPA, Hibernate                  |
| Artificial Intelligence | Face API, TensorFlow Models                 |
| Charts                  | Recharts, Chart.js                          |
| Email Service           | JavaMail Sender (SMTP)                      |
| Build Tools             | Maven, npm                                  |

---

# 🚀 Installation & Local Setup

## Prerequisites

* Java 21 or above
* Node.js 18 or above
* MySQL 8.0

---

## Database Setup

```sql
CREATE DATABASE smartvisit_db;
```

---

## Backend Setup

```bash
cd smartvisit-backend
```

Create a `.env` file:

```env
DB_PASSWORD=your_mysql_password

JWT_SECRET=your_secure_secret_key

MAIL_USERNAME=your_email@gmail.com

MAIL_PASSWORD=your_app_password
```

Run Backend

```bash
mvn clean install

mvn spring-boot:run
```

Backend API

```
http://localhost:8080
```

---

## Frontend Setup

```bash
cd smartvisit-frontend

npm install

npm run dev
```

Frontend

```
http://localhost:5173
```

---

# 🔌 REST API Endpoints

### Authentication

* POST /api/auth/login
* POST /api/auth/register

### Visitors

* GET /api/visitors
* POST /api/visitors
* PUT /api/visitors/{id}
* DELETE /api/visitors/{id}

### Visitor Approval

* POST /api/approvals/{visitorId}
* PUT /api/approvals/{visitorId}

### Check-In

* POST /api/checkin

### Check-Out

* POST /api/checkout

### Dashboard

* GET /api/dashboard/summary

### Reports

* GET /api/reports
* GET /api/reports/export/excel
* GET /api/reports/export/pdf

### Users

* GET /api/users
* POST /api/users
* PUT /api/users/{id}

---

# 🌍 Deployment & Hosting

The SmartVisit platform is designed for cloud deployment and enterprise scalability.

### Frontend

* Vercel
* Responsive React SPA
* Global CDN

### Backend

* Railway / Render
* Spring Boot REST API
* Secure JWT Authentication

### Database

* Railway MySQL
* Managed Cloud Database
* Automated Backup
* Secure Data Storage

---

# 📈 Key Benefits

* AI-Powered Visitor Verification
* Secure Role-Based Access Control
* Intelligent Visitor Lifecycle Management
* Automated Approval Workflow
* Real-Time Visitor Monitoring
* Intelligent Overstay Detection
* Automated Email Notifications
* Enterprise Dashboard & Analytics
* Centralized Digital Visitor Records
* Excel & PDF Report Generation
* Scalable Cloud-Ready Architecture
* Reduced Manual Work and Improved Organizational Security

---

# 📜 Conclusion

SmartVisit (SVMS) is an enterprise-grade AI-powered Visitor Management System developed using React.js, Spring Boot, MySQL, and Artificial Intelligence technologies. The platform automates the complete visitor lifecycle, including registration, approval, identity verification, check-in, monitoring, check-out, reporting, and administrative management. By integrating secure authentication, AI-assisted verification, automated workflows, real-time analytics, and intelligent monitoring, SmartVisit delivers a modern, scalable, secure, and production-ready solution for organizations seeking efficient visitor management and enhanced security.
