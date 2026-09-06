-- ================================================================
-- CAMPUS SEMINAR HALL BOOKING & MANAGEMENT SYSTEM
-- Seed / Demo Data
-- ================================================================
-- Run AFTER schema.sql: mysql -u root -p campus_seminar_hall < seed.sql
-- ================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ================================================================
-- 1. USER TYPES
-- ================================================================
INSERT INTO user_types (id, code, label, description, sort_order) VALUES
(1, 'STUDENT', 'Student', 'Enrolled student', 1),
(2, 'FACULTY', 'Faculty', 'Teaching faculty member', 2),
(3, 'STAFF', 'Staff', 'Non-teaching staff', 3),
(4, 'EXTERNAL', 'External User', 'Visitor from another institution', 4);

-- ================================================================
-- 2. BOOKING STATUSES
-- ================================================================
INSERT INTO booking_statuses (id, code, label, description, color, is_final, is_cancelable, sort_order) VALUES
(1, 'PENDING', 'Pending', 'Awaiting confirmation', '#FFA500', FALSE, TRUE, 1),
(2, 'CONFIRMED', 'Confirmed', 'Booking confirmed', '#4CAF50', FALSE, TRUE, 2),
(3, 'IN_PROGRESS', 'In Progress', 'Event is currently happening', '#2196F3', FALSE, FALSE, 3),
(4, 'COMPLETED', 'Completed', 'Event finished normally', '#9E9E9E', TRUE, FALSE, 4),
(5, 'CANCELLED', 'Cancelled', 'Booking cancelled', '#F44336', TRUE, FALSE, 5),
(6, 'REJECTED', 'Rejected', 'Booking rejected by admin', '#9C27B0', TRUE, FALSE, 6);

-- ================================================================
-- 3. EVENT TYPES
-- ================================================================
INSERT INTO event_types (id, code, label, description, icon, color, sort_order) VALUES
(1, 'SEMINAR', 'Seminar', 'Knowledge-sharing presentation', 'book-open', '#2196F3', 1),
(2, 'WORKSHOP', 'Workshop', 'Hands-on training session', 'tools', '#4CAF50', 2),
(3, 'ASSEMBLY', 'Assembly', 'Campus or departmental gathering', 'account-multiple', '#FF9800', 3),
(4, 'ORIENTATION', 'Orientation', 'New student/faculty orientation', 'school', '#3F51B5', 4),
(5, 'MEETING', 'Meeting', 'Departmental or committee meeting', 'meeting-room', '#607D8B', 5),
(6, 'GUEST_LECTURE', 'Guest Lecture', 'External speaker session', 'star', '#E91E63', 6),
(7, 'EXAMINATION', 'Examination', 'Written or practical exam', 'file-document', '#795548', 7),
(8, 'OTHER', 'Other', 'Any other type of event', 'circle', '#607D8B', 8);

-- ================================================================
-- 4. CANCELLATION REASONS
-- ================================================================
INSERT INTO cancellation_reasons (id, code, label, description, sort_order) VALUES
(1, 'SCHEDULE_CHANGE', 'Schedule Change', 'Event date or time changed', 1),
(2, 'CANCELED_EVENT', 'Event Canceled', 'The event itself was canceled', 2),
(3, 'HALL_REASSIGNED', 'Hall Reassigned', 'Different hall assigned', 3),
(4, 'PERSONAL', 'Personal Reason', 'Organizer personal reason', 4),
(5, 'OTHER', 'Other', 'Other reasons', 5);

-- ================================================================
-- 5. INSTITUTES
-- ================================================================
INSERT INTO institutes (id, code, name, short_name, address, contact_email, contact_phone) VALUES
(1, 'DEGREE', 'Degree Engineering College', 'Degree College', 'Campus North Wing', 'admin@degree.edu.in', '+91-9876543210'),
(2, 'POLY', 'Polytechnic Institute', 'Polytechnic', 'Campus South Wing', 'admin@poly.edu.in', '+91-9876543211'),
(3, 'MANAGEMENT', 'Institute of Management', 'Management Dept', 'Campus East Wing', 'admin@mgmt.edu.in', '+91-9876543212');

-- ================================================================
-- 6. DEPARTMENTS
-- ================================================================
INSERT INTO departments (id, institute_id, code, name, short_name, hod_name, hod_email) VALUES
(1, 1, 'CS', 'Computer Science', 'CSE', 'Dr. Rajesh Kumar', 'rajesh@cse.degree.edu.in'),
(2, 1, 'IT', 'Information Technology', 'IT', 'Dr. Priya Sharma', 'priya@it.degree.edu.in'),
(3, 1, 'MECH', 'Mechanical Engineering', 'ME', 'Dr. Amit Patel', 'amit@mec.degree.edu.in'),
(4, 1, 'ECE', 'Electronics & Communication', 'ECE', 'Dr. Sunita Verma', 'sunita@ece.degree.edu.in'),
(5, 1, 'MBA', 'Master of Business Admin', 'MBA', 'Dr. Vikram Singh', 'vikram@mba.degree.edu.in'),
(6, 2, 'CE', 'Civil Engineering', 'CE', 'Dr. Ramesh Yadav', 'ram@ce.poly.edu.in'),
(7, 2, 'EE', 'Electrical Engineering', 'EE', 'Dr. Suresh Kumar', 'suresh@ee.poly.edu.in'),
(8, 2, 'AC', 'Automobile Engineering', 'Auto', 'Dr. Mohan Das', 'mohan@auto.poly.edu.in'),
(9, 2, 'CS', 'Computer Science (Poly)', 'CSP', 'Dr. Geeta Rani', 'geeta@cs.poly.edu.in'),
(10, 3, 'MKT', 'Marketing', 'MKT', 'Dr. Neha Gupta', 'neha@mkt.mgmt.edu.in'),
(11, 3, 'FIN', 'Finance', 'FIN', 'Dr. Arjun Mehta', 'arjun@fin.mgmt.edu.in'),
(12, 3, 'HR', 'Human Resources', 'HR', 'Dr. Kavita Nair', 'kavita@hr.mgmt.edu.in');

-- ================================================================
-- 7. HALLS
-- ================================================================
INSERT INTO halls (id, institute_id, code, name, short_name, description, capacity, location, floor, opening_time, closing_time, facilities, requires_approval) VALUES
(1, 1, 'DEGREE_SEM_HALL_1', 'Degree Seminar Hall', 'Degree Hall', 'Main seminar hall for Degree Engineering College. Equipped with projector, sound system, and whiteboard.', 120, 'Campus North Wing, 1st Floor', '1st Floor', '08:00:00', '20:00:00', '["Projector", "Sound System", "Whiteboard", "Laptop Port", "Microphone", "WiFi"]', FALSE),
(2, 2, 'POLY_SEM_HALL_1', 'Polytechnic Seminar Hall', 'Poly Hall', 'Main seminar hall for Polytechnic Institute. Equipped with projector, sound system, and whiteboard.', 80, 'Campus South Wing, 2nd Floor', '2nd Floor', '08:00:00', '20:00:00', '["Projector", "Sound System", "Whiteboard", "Laptop Port", "Mic"]', FALSE);

-- ================================================================
-- 8. USERS
-- All passwords: 'Password123!' (proper bcrypt hash generated at runtime)
-- A placeholder hash that will be replaced with a real bcrypt hash via Node script.
-- ================================================================
-- All users share the same temporary hash; a Node helper will rewrite it to a real bcrypt hash
INSERT INTO users (id, user_type_id, institute_id, department_id, email, password_hash, full_name, mobile, gender, date_of_birth, course, academic_year, semester, roll_number, employee_id, designation, is_active, is_verified) VALUES
(1, 1, 1, 1, 'student.raj@gmail.com', 'TEMP_HASH', 'Raj Sharma', '9876543001', 'M', '2003-05-15', 'B.Tech CSE', '2025-2026', 5, 'CS2025001', NULL, NULL, TRUE, TRUE),
(2, 1, 1, 2, 'student.priya@gmail.com', 'TEMP_HASH', 'Priya Patel', '9876543002', 'F', '2003-08-22', 'B.Tech IT', '2025-2026', 5, 'IT2025002', NULL, NULL, TRUE, TRUE),
(3, 2, 1, 1, 'faculty.rajesh@degree.edu.in', 'TEMP_HASH', 'Dr. Rajesh Kumar', '9876543003', 'M', '1978-03-10', NULL, NULL, NULL, NULL, 'FAC001', 'Professor, CSE', TRUE, TRUE),
(4, 2, 1, 3, 'faculty.amit@degree.edu.in', 'TEMP_HASH', 'Dr. Amit Patel', '9876543004', 'M', '1975-07-18', NULL, NULL, NULL, NULL, 'FAC003', 'Professor, ME', TRUE, TRUE),
(5, 3, 1, 5, 'staff.vikram@degree.edu.in', 'TEMP_HASH', 'Vikram Singh', '9876543005', 'M', '1985-11-25', NULL, NULL, NULL, NULL, 'STAFF001', 'Admin Officer', TRUE, TRUE),
(6, 1, 2, 6, 'student.suresh@poly.edu.in', 'TEMP_HASH', 'Suresh Yadav', '9876543006', 'M', '2004-02-14', 'Diploma CE', '2025-2026', 3, 'CE2025006', NULL, NULL, TRUE, TRUE),
(7, 1, 2, 8, 'student.mohan@poly.edu.in', 'TEMP_HASH', 'Mohan Das', '9876543007', 'M', '2004-06-30', 'Diploma Auto', '2025-2026', 3, 'AC2025007', NULL, NULL, TRUE, TRUE),
(8, 2, 2, 7, 'faculty.suresh@poly.edu.in', 'TEMP_HASH', 'Dr. Suresh Kumar', '9876543008', 'M', '1980-01-20', NULL, NULL, NULL, NULL, 'FAC007', 'Professor, EE', TRUE, TRUE),
(9, 2, 3, 10, 'faculty.neha@mgmt.edu.in', 'TEMP_HASH', 'Dr. Neha Gupta', '9876543009', 'F', '1982-09-05', NULL, NULL, NULL, NULL, 'FAC010', 'Associate Professor, MKT', TRUE, TRUE),
(10, 4, NULL, NULL, 'external.user@othercollege.edu.in', 'TEMP_HASH', 'Amit Singh', '9876543010', 'M', '1990-12-01', 'B.Tech ECE', '2024-2025', 6, NULL, NULL, 'Guest Lecturer', TRUE, TRUE),
(99, 2, 1, NULL, 'admin@campus.edu.in', 'TEMP_HASH', 'System Administrator', '9876543999', 'M', '1980-01-01', NULL, NULL, NULL, NULL, 'ADMIN001', 'Super Admin', TRUE, TRUE);

-- ================================================================
-- 9. SAMPLE BOOKINGS
-- ================================================================
-- Past completed bookings
INSERT INTO bookings (id, user_id, hall_id, event_type_id, status_id, event_name, event_description, expected_attendees, start_time, end_time, timezone, check_in_time, check_out_time, actual_duration_minutes, overstay_minutes, late_arrival_minutes, early_departure_minutes) VALUES
(1, 1, 1, 1, 4, 'AI/ML Seminar', 'Guest lecture on Artificial Intelligence and Machine Learning by industry expert', 80, '2026-08-20 10:00:00', '2026-08-20 12:00:00', 'Asia/Kolkata', '2026-08-20 10:05:00', '2026-08-20 11:50:00', 105, 0, 5, 10),
(2, 3, 1, 2, 4, 'Python Workshop', 'Hands-on Python programming workshop for CS students', 40, '2026-08-25 14:00:00', '2026-08-25 16:30:00', 'Asia/Kolkata', '2026-08-25 14:10:00', '2026-08-25 16:20:00', 130, 0, 10, 10),
(3, 2, 1, 3, 4, 'College Assembly', 'Monthly college assembly for all students', 200, '2026-08-28 09:00:00', '2026-08-28 10:30:00', 'Asia/Kolkata', '2026-08-28 09:02:00', '2026-08-28 10:25:00', 93, 0, 2, 5),
(4, 4, 1, 5, 3, 'Faculty Meeting', 'Monthly departmental meeting', 15, '2026-09-06 11:00:00', '2026-09-06 12:00:00', 'Asia/Kolkata', NULL, NULL, NULL, NULL, NULL, NULL),
(5, 1, 1, 1, 2, 'Guest Lecture: Cloud Computing', 'Guest lecture by AWS certified professional', 60, '2026-09-08 11:30:00', '2026-09-08 13:30:00', 'Asia/Kolkata', NULL, NULL, NULL, NULL, NULL, NULL),
(6, 6, 1, 2, 2, 'Web Development Workshop', 'Full-stack web development hands-on session', 30, '2026-09-10 14:00:00', '2026-09-10 16:00:00', 'Asia/Kolkata', NULL, NULL, NULL, NULL, NULL, NULL),
(7, 8, 1, 6, 2, 'Guest Lecture: Cybersecurity', 'Guest lecture on cybersecurity trends', 50, '2026-09-12 10:30:00', '2026-09-12 12:00:00', 'Asia/Kolkata', NULL, NULL, NULL, NULL, NULL, NULL),
(8, 2, 1, 4, 2, 'New Student Orientation', 'Orientation for new batch 2025-26', 100, '2026-09-15 09:00:00', '2026-09-15 12:00:00', 'Asia/Kolkata', NULL, NULL, NULL, NULL, NULL, NULL),
(9, 6, 2, 1, 4, 'Robotics Seminar', 'Introduction to robotics and automation', 45, '2026-08-22 11:00:00', '2026-08-22 13:00:00', 'Asia/Kolkata', '2026-08-22 11:10:00', '2026-08-22 12:45:00', 95, 0, 10, 15),
(10, 7, 2, 2, 4, 'Electronics Workshop', 'PCB design and fabrication workshop', 25, '2026-08-27 15:00:00', '2026-08-27 17:00:00', 'Asia/Kolkata', '2026-08-27 15:05:00', '2026-08-27 16:50:00', 105, 0, 5, 10),
(11, 7, 2, 5, 2, 'Department Meeting', 'Automobile engineering department meeting', 20, '2026-09-09 14:30:00', '2026-09-09 15:30:00', 'Asia/Kolkata', NULL, NULL, NULL, NULL, NULL, NULL),
(12, 8, 2, 6, 2, 'Guest Lecture: IoT', 'Internet of Things technologies', 35, '2026-09-11 10:00:00', '2026-09-11 11:30:00', 'Asia/Kolkata', NULL, NULL, NULL, NULL, NULL, NULL),
(13, 9, 1, 7, 5, 'Exam Hall Booking', 'Mid-semester examination', 50, '2026-09-05 09:00:00', '2026-09-05 12:00:00', 'Asia/Kolkata', NULL, NULL, NULL, NULL, NULL, NULL);

-- Cancellation record
INSERT INTO cancellations (booking_id, reason_id, reason_text, cancelled_by_user_id, cancelled_at) VALUES
(13, 1, 'Exam rescheduled to different venue', 9, '2026-09-03 14:30:00');

-- ================================================================
-- 10. FEEDBACK SAMPLES
-- ================================================================
INSERT INTO feedback (id, booking_id, user_id, overall_rating, cleanliness_rating, equipment_rating, experience_rating, comments, would_recommend) VALUES
(1, 1, 1, 5, 4, 5, 5, 'Excellent seminar! Great hall and equipment.', TRUE),
(2, 2, 3, 4, 4, 4, 4, 'Good workshop venue. Equipment worked well.', TRUE),
(3, 3, 2, 3, 3, 3, 3, 'Assembly was fine but seating was cramped.', TRUE),
(4, 9, 6, 4, 5, 4, 4, 'Good seminar, hall was clean and well-maintained.', TRUE),
(5, 10, 7, 5, 4, 5, 5, 'Excellent workshop experience!', TRUE);

-- ================================================================
-- 11. ADMIN EVALUATIONS
-- ================================================================
INSERT INTO admin_evaluations (id, booking_id, evaluated_by_user_id, hall_left_clean, equipment_damaged, discipline_rating, usage_quality_rating, overstay_occurred, overstay_minutes, overall_condition, admin_remarks) VALUES
(1, 1, 5, TRUE, FALSE, 5, 5, FALSE, 0, 'EXCELLENT', 'Excellent condition. Hall returned clean.'),
(2, 2, 5, TRUE, FALSE, 4, 4, FALSE, 0, 'GOOD', 'Good condition. Minor mess in seating area.'),
(3, 3, 5, FALSE, FALSE, 3, 3, FALSE, 0, 'FAIR', 'Some chairs were misplaced. General cleanup needed.'),
(4, 9, 5, TRUE, FALSE, 5, 5, FALSE, 0, 'EXCELLENT', 'Hall was in perfect condition.');

-- ================================================================
-- 12. CHECK-IN/OUT RECORDS
-- ================================================================
INSERT INTO check_in_outs (booking_id, user_id, check_in_time, check_out_time, check_in_method, check_out_method, overstay_minutes) VALUES
(1, 1, '2026-08-20 10:05:00', '2026-08-20 11:50:00', 'MANUAL', 'MANUAL', 0),
(2, 3, '2026-08-25 14:10:00', '2026-08-25 16:20:00', 'MANUAL', 'MANUAL', 0),
(3, 2, '2026-08-28 09:02:00', '2026-08-28 10:25:00', 'MANUAL', 'MANUAL', 0),
(9, 6, '2026-08-22 11:10:00', '2026-08-22 12:45:00', 'MANUAL', 'MANUAL', 0),
(10, 7, '2026-08-27 15:05:00', '2026-08-27 16:50:00', 'MANUAL', 'MANUAL', 0);

-- ================================================================
-- 13. AUDIT LOGS SAMPLE
-- ================================================================
INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, old_values, new_values, created_at) VALUES
(1, 99, 'SEED_DATA', 'SYSTEM', NULL, NULL, JSON_OBJECT('description', 'Seed data loaded'), '2026-09-06 10:00:00'),
(2, 1, 'BOOKING_CREATE', 'BOOKING', 1, NULL, JSON_OBJECT('event_name', 'AI/ML Seminar'), '2026-08-20 09:55:00'),
(3, 99, 'HALL_CREATE', 'HALL', 1, NULL, JSON_OBJECT('name', 'Degree Seminar Hall'), '2026-08-01 00:00:00'),
(4, 99, 'HALL_CREATE', 'HALL', 2, NULL, JSON_OBJECT('name', 'Polytechnic Seminar Hall'), '2026-08-01 00:00:00'),
(5, 99, 'USER_CREATE', 'USER', 99, NULL, JSON_OBJECT('email', 'admin@campus.edu.in'), '2026-08-01 00:00:00');

SET FOREIGN_KEY_CHECKS = 1;

-- ================================================================
-- END OF SEED DATA
-- ================================================================