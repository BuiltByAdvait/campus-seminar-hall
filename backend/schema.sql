-- ================================================================
-- CAMPUS SEMINAR HALL BOOKING & MANAGEMENT SYSTEM
-- MySQL 8.4+ Database Schema
-- ================================================================
-- Run: mysql -u root -p campus_seminar_hall < schema.sql
-- ================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ================================================================
-- 1. REFERENCE / LOOKUP TABLES
-- ================================================================

CREATE TABLE IF NOT EXISTS user_types (
    id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
    code VARCHAR(20) NOT NULL UNIQUE,
    label VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    sort_order TINYINT UNSIGNED DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS event_types (
    id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
    code VARCHAR(30) NOT NULL UNIQUE,
    label VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    icon VARCHAR(50),
    color VARCHAR(7),
    sort_order TINYINT UNSIGNED DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS booking_statuses (
    id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
    code VARCHAR(20) NOT NULL UNIQUE,
    label VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    color VARCHAR(7),
    is_final BOOLEAN DEFAULT FALSE,
    is_cancelable BOOLEAN DEFAULT FALSE,
    sort_order TINYINT UNSIGNED DEFAULT 0,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cancellation_reasons (
    id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
    code VARCHAR(30) NOT NULL UNIQUE,
    label VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    sort_order TINYINT UNSIGNED DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 2. CORE ENTITY TABLES
-- ================================================================

CREATE TABLE IF NOT EXISTS institutes (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    short_name VARCHAR(50),
    address TEXT,
    contact_email VARCHAR(150),
    contact_phone VARCHAR(20),
    logo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    INDEX idx_institutes_active (is_active),
    INDEX idx_institutes_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS departments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    institute_id BIGINT UNSIGNED NOT NULL,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(150) NOT NULL,
    short_name VARCHAR(50),
    hod_name VARCHAR(100),
    hod_email VARCHAR(150),
    hod_phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_dept_institute_code (institute_id, code),
    INDEX idx_dept_institute (institute_id),
    INDEX idx_dept_active (is_active),
    CONSTRAINT fk_dept_institute FOREIGN KEY (institute_id) REFERENCES institutes(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS halls (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    institute_id BIGINT UNSIGNED NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    short_name VARCHAR(50),
    description TEXT,
    capacity SMALLINT UNSIGNED NOT NULL DEFAULT 100,
    location VARCHAR(255),
    floor VARCHAR(20),
    facilities JSON,
    opening_time TIME NOT NULL DEFAULT '08:00:00',
    closing_time TIME NOT NULL DEFAULT '20:00:00',
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
    is_active BOOLEAN DEFAULT TRUE,
    requires_approval BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    INDEX idx_halls_institute (institute_id),
    INDEX idx_halls_active (is_active),
    INDEX idx_halls_code (code),
    CONSTRAINT fk_hall_institute FOREIGN KEY (institute_id) REFERENCES institutes(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_hall_hours CHECK (closing_time > opening_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 3. USERS
-- ================================================================

CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_type_id TINYINT UNSIGNED NOT NULL,
    institute_id BIGINT UNSIGNED,
    department_id BIGINT UNSIGNED,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    mobile VARCHAR(20) NOT NULL UNIQUE,
    gender ENUM('M','F','O') NULL,
    date_of_birth DATE NULL,
    course VARCHAR(100) NULL,
    academic_year VARCHAR(20) NULL,
    semester TINYINT UNSIGNED NULL,
    roll_number VARCHAR(50) NULL,
    employee_id VARCHAR(50) NULL,
    designation VARCHAR(100) NULL,
    profile_image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP NULL DEFAULT NULL,
    failed_login_attempts TINYINT UNSIGNED DEFAULT 0,
    locked_until TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_email (email),
    UNIQUE KEY uk_users_mobile (mobile),
    INDEX idx_users_institute (institute_id),
    INDEX idx_users_dept (department_id),
    INDEX idx_users_type (user_type_id),
    INDEX idx_users_active (is_active),
    INDEX idx_users_email_active (email, is_active),
    CONSTRAINT fk_user_type FOREIGN KEY (user_type_id) REFERENCES user_types(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_user_institute FOREIGN KEY (institute_id) REFERENCES institutes(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_user_dept FOREIGN KEY (department_id) REFERENCES departments(id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_refresh_tokens (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP NULL DEFAULT NULL,
    replaced_by_token_hash VARCHAR(255) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_refresh_hash (token_hash),
    INDEX idx_refresh_user (user_id),
    INDEX idx_refresh_expires (expires_at),
    CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 4. BOOKINGS (Core)
-- ================================================================

CREATE TABLE IF NOT EXISTS bookings (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    hall_id BIGINT UNSIGNED NOT NULL,
    event_type_id TINYINT UNSIGNED NOT NULL,
    status_id TINYINT UNSIGNED NOT NULL DEFAULT 1,
    event_name VARCHAR(200) NOT NULL,
    event_description TEXT,
    expected_attendees SMALLINT UNSIGNED DEFAULT 0,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
    duration_minutes INT UNSIGNED,
    check_in_time TIMESTAMP NULL DEFAULT NULL,
    check_out_time TIMESTAMP NULL DEFAULT NULL,
    actual_duration_minutes INT UNSIGNED NULL,
    overstay_minutes INT UNSIGNED NULL,
    late_arrival_minutes INT UNSIGNED NULL,
    early_departure_minutes INT UNSIGNED NULL,
    cancellation_id BIGINT UNSIGNED NULL,
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    INDEX idx_bookings_user (user_id),
    INDEX idx_bookings_hall (hall_id),
    INDEX idx_bookings_status (status_id),
    INDEX idx_bookings_start (start_time),
    INDEX idx_bookings_end (end_time),
    INDEX idx_bookings_hall_range (hall_id, start_time, end_time),
    INDEX idx_bookings_user_start (user_id, start_time),
    INDEX idx_bookings_active (status_id, deleted_at),
    CONSTRAINT fk_booking_user FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_booking_hall FOREIGN KEY (hall_id) REFERENCES halls(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_booking_event_type FOREIGN KEY (event_type_id) REFERENCES event_types(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_booking_status FOREIGN KEY (status_id) REFERENCES booking_statuses(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_booking_times CHECK (end_time > start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS booking_status_history (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    booking_id BIGINT UNSIGNED NOT NULL,
    old_status_id TINYINT UNSIGNED NULL,
    new_status_id TINYINT UNSIGNED NOT NULL,
    changed_by_user_id BIGINT UNSIGNED NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_bsh_booking (booking_id),
    INDEX idx_bsh_created (created_at),
    CONSTRAINT fk_bsh_booking FOREIGN KEY (booking_id) REFERENCES bookings(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_bsh_old_status FOREIGN KEY (old_status_id) REFERENCES booking_statuses(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_bsh_new_status FOREIGN KEY (new_status_id) REFERENCES booking_statuses(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_bsh_user FOREIGN KEY (changed_by_user_id) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 5. CANCELLATIONS
-- ================================================================

CREATE TABLE IF NOT EXISTS cancellations (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    booking_id BIGINT UNSIGNED NOT NULL,
    reason_id TINYINT UNSIGNED,
    reason_text TEXT,
    cancelled_by_user_id BIGINT UNSIGNED NOT NULL,
    cancelled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    refund_eligible BOOLEAN DEFAULT FALSE,
    admin_notes TEXT,
    PRIMARY KEY (id),
    UNIQUE KEY uk_cancel_booking (booking_id),
    INDEX idx_cancel_user (cancelled_by_user_id),
    INDEX idx_cancel_date (cancelled_at),
    CONSTRAINT fk_cancel_booking FOREIGN KEY (booking_id) REFERENCES bookings(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_cancel_reason FOREIGN KEY (reason_id) REFERENCES cancellation_reasons(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_cancel_user FOREIGN KEY (cancelled_by_user_id) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 6. CHECK-IN / CHECK-OUT
-- ================================================================

CREATE TABLE IF NOT EXISTS check_in_outs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    booking_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    check_in_time TIMESTAMP NULL DEFAULT NULL,
    check_out_time TIMESTAMP NULL DEFAULT NULL,
    check_in_method ENUM('MANUAL','QR','ADMIN') DEFAULT 'MANUAL',
    check_out_method ENUM('MANUAL','QR','ADMIN') DEFAULT 'MANUAL',
    check_in_notes VARCHAR(255),
    check_out_notes VARCHAR(255),
    overstay_minutes INT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_cio_booking (booking_id),
    INDEX idx_cio_user (user_id),
    INDEX idx_cio_checkin (check_in_time),
    INDEX idx_cio_checkout (check_out_time),
    CONSTRAINT fk_cio_booking FOREIGN KEY (booking_id) REFERENCES bookings(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_cio_user FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_cio_times CHECK (check_out_time IS NULL OR check_out_time >= check_in_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 7. FEEDBACK & EVALUATIONS
-- ================================================================

CREATE TABLE IF NOT EXISTS feedback (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    booking_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    overall_rating TINYINT UNSIGNED NOT NULL,
    cleanliness_rating TINYINT UNSIGNED,
    equipment_rating TINYINT UNSIGNED,
    experience_rating TINYINT UNSIGNED,
    comments TEXT,
    would_recommend BOOLEAN,
    is_public BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_feedback_booking (booking_id),
    INDEX idx_feedback_user (user_id),
    INDEX idx_feedback_rating (overall_rating),
    INDEX idx_feedback_date (submitted_at),
    CONSTRAINT fk_feedback_booking FOREIGN KEY (booking_id) REFERENCES bookings(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_feedback_user FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_feedback_overall CHECK (overall_rating BETWEEN 1 AND 5),
    CONSTRAINT chk_feedback_clean CHECK (cleanliness_rating IS NULL OR cleanliness_rating BETWEEN 1 AND 5),
    CONSTRAINT chk_feedback_equip CHECK (equipment_rating IS NULL OR equipment_rating BETWEEN 1 AND 5),
    CONSTRAINT chk_feedback_exp CHECK (experience_rating IS NULL OR experience_rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_evaluations (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    booking_id BIGINT UNSIGNED NOT NULL,
    evaluated_by_user_id BIGINT UNSIGNED NOT NULL,
    hall_left_clean BOOLEAN DEFAULT TRUE,
    equipment_damaged BOOLEAN DEFAULT FALSE,
    damage_description TEXT,
    discipline_rating TINYINT UNSIGNED,
    usage_quality_rating TINYINT UNSIGNED,
    overstay_occurred BOOLEAN DEFAULT FALSE,
    overstay_minutes INT UNSIGNED DEFAULT 0,
    overall_condition ENUM('EXCELLENT','GOOD','FAIR','POOR') DEFAULT 'GOOD',
    admin_remarks TEXT,
    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_eval_booking (booking_id),
    INDEX idx_eval_user (evaluated_by_user_id),
    INDEX idx_eval_date (evaluated_at),
    CONSTRAINT fk_eval_booking FOREIGN KEY (booking_id) REFERENCES bookings(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_eval_user FOREIGN KEY (evaluated_by_user_id) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_eval_discipline CHECK (discipline_rating IS NULL OR discipline_rating BETWEEN 1 AND 5),
    CONSTRAINT chk_eval_quality CHECK (usage_quality_rating IS NULL OR usage_quality_rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 8. AUDIT LOGS
-- ================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT UNSIGNED NULL,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_entity (entity_type, entity_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_date (created_at),
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 9. VIEWS
-- ================================================================

CREATE OR REPLACE VIEW v_active_bookings AS
SELECT
    b.id, b.event_name, b.event_description, b.expected_attendees,
    b.start_time, b.end_time, b.duration_minutes,
    b.check_in_time, b.check_out_time, b.actual_duration_minutes, b.overstay_minutes,
    b.status_id, bs.code AS status_code, bs.label AS status_label, bs.color AS status_color,
    h.id AS hall_id, h.name AS hall_name, h.capacity AS hall_capacity, h.location AS hall_location,
    u.id AS user_id, u.full_name AS user_name, u.email AS user_email, u.mobile AS user_mobile,
    ut.code AS user_type_code,
    i.id AS institute_id, i.name AS institute_name,
    d.id AS department_id, d.name AS department_name,
    et.id AS event_type_id, et.code AS event_type_code, et.label AS event_type_label, et.color AS event_type_color
FROM bookings b
JOIN booking_statuses bs ON b.status_id = bs.id
JOIN halls h ON b.hall_id = h.id
JOIN users u ON b.user_id = u.id
JOIN user_types ut ON u.user_type_id = ut.id
LEFT JOIN departments d ON u.department_id = d.id
LEFT JOIN institutes i ON u.institute_id = i.id
JOIN event_types et ON b.event_type_id = et.id
WHERE b.deleted_at IS NULL AND h.deleted_at IS NULL AND u.deleted_at IS NULL;

CREATE OR REPLACE VIEW v_hall_utilization AS
SELECT
    h.id AS hall_id, h.name AS hall_name, h.capacity, h.opening_time, h.closing_time,
    COUNT(b.id) AS total_bookings,
    SUM(CASE WHEN b.status_id = (SELECT id FROM booking_statuses WHERE code = 'COMPLETED') THEN 1 ELSE 0 END) AS completed_bookings,
    SUM(CASE WHEN b.status_id = (SELECT id FROM booking_statuses WHERE code = 'CANCELLED') THEN 1 ELSE 0 END) AS cancelled_bookings,
    SUM(b.duration_minutes) AS total_scheduled_minutes,
    SUM(COALESCE(b.actual_duration_minutes,0)) AS total_actual_minutes,
    SUM(COALESCE(b.overstay_minutes,0)) AS total_overstay_minutes,
    AVG(f.overall_rating) AS avg_feedback_rating,
    COUNT(f.id) AS feedback_count
FROM halls h
LEFT JOIN bookings b ON b.hall_id = h.id AND b.deleted_at IS NULL
LEFT JOIN feedback f ON f.booking_id = b.id
WHERE h.deleted_at IS NULL
GROUP BY h.id;

CREATE OR REPLACE VIEW v_user_booking_summary AS
SELECT
    u.id AS user_id, u.full_name, u.email, u.mobile, ut.label AS user_type,
    COUNT(b.id) AS total_bookings,
    SUM(CASE WHEN b.status_id = (SELECT id FROM booking_statuses WHERE code = 'COMPLETED') THEN 1 ELSE 0 END) AS completed,
    SUM(CASE WHEN b.status_id = (SELECT id FROM booking_statuses WHERE code = 'CANCELLED') THEN 1 ELSE 0 END) AS cancelled,
    SUM(CASE WHEN b.status_id = (SELECT id FROM booking_statuses WHERE code = 'IN_PROGRESS') THEN 1 ELSE 0 END) AS in_progress,
    SUM(COALESCE(b.actual_duration_minutes,0)) AS total_usage_minutes,
    AVG(f.overall_rating) AS avg_rating,
    SUM(CASE WHEN b.overstay_minutes > 0 THEN 1 ELSE 0 END) AS overstay_count
FROM users u
JOIN user_types ut ON u.user_type_id = ut.id
LEFT JOIN bookings b ON b.user_id = u.id AND b.deleted_at IS NULL
LEFT JOIN feedback f ON f.booking_id = b.id
WHERE u.deleted_at IS NULL
GROUP BY u.id;

-- ================================================================
-- END OF SCHEMA
-- ================================================================

SET FOREIGN_KEY_CHECKS = 1;
