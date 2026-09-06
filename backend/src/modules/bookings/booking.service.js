"use strict";

const db = require('../../config/db');
const config = require('../../config/env');
const logger = require('../../config/logger');
const {
    AppError,
    NotFoundError,
    ConflictError,
    BookingConflictError,
    ValidationError,
    CancellationError
} = require('../../utils/errors');

// Approve/reject specific error class
class BookingStateError extends AppError {
    constructor(message) {
        super(message, 400);
        this.name = 'BookingStateError';
    }
}

/**
 * Booking service - core booking logic with overlap detection
 */
const bookingService = {
    /**
     * Check if hall is available for a time range
     * CRITICAL: This is the core overlap detection algorithm
     *
     * Two ranges overlap iff: startA < endB AND endA > startB
     * We use strict inequality to allow adjacent bookings (back-to-back is OK)
     */
    checkAvailability: async (hallId, startTime, endTime, excludeBookingId = null) => {
        let sql = `
            SELECT b.id, b.event_name, b.start_time, b.end_time, b.status_id, bs.code AS status_code
            FROM bookings b
            JOIN booking_statuses bs ON b.status_id = bs.id
            WHERE b.hall_id = ?
              AND b.deleted_at IS NULL
              AND bs.code NOT IN ('CANCELLED', 'REJECTED')
              AND b.start_time < ?
              AND b.end_time > ?
        `;

        const params = [hallId, endTime, startTime];

        if (excludeBookingId) {
            sql += ' AND b.id != ?';
            params.push(excludeBookingId);
        }

        const conflicts = await db.queryAll(sql, params);
        return {
            available: conflicts.length === 0,
            conflicts
        };
    },

    /**
     * Create a booking with overlap detection and transaction safety
     * @param {number} userId - User ID
     * @param {Object} bookingData - Booking data
     * @returns {Promise<Object>} Created booking
     */
    create: async (userId, bookingData) => {
        const { hallId, eventTypeId, eventName, eventDescription = null,
                expectedAttendees = 0, startTime, endTime } = bookingData;

        // Parse dates
        const start = new Date(startTime);
        const end = new Date(endTime);

        // Validate dates
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new ValidationError('Invalid date format');
        }

        if (end <= start) {
            throw new ValidationError('End time must be after start time');
        }

        // Check booking is in the future
        const now = new Date();
        if (start <= now) {
            throw new ValidationError('Booking start time must be in the future');
        }

        // Check minimum advance booking
        const minutesUntilStart = Math.floor((start - now) / (1000 * 60));
        if (minutesUntilStart < config.MIN_ADVANCE_BOOKING_MINUTES) {
            throw new ValidationError(`Booking must be at least ${config.MIN_ADVANCE_BOOKING_MINUTES} minutes in advance`);
        }

        // Check booking duration limits
        const durationMinutes = Math.floor((end - start) / (1000 * 60));
        if (durationMinutes > config.MAX_BOOKING_DURATION_MINUTES) {
            throw new ValidationError(`Booking duration cannot exceed ${config.MAX_BOOKING_DURATION_MINUTES} minutes`);
        }

        // Get hall info to validate operating hours
        const [hallRows] = await db.query(
            'SELECT * FROM halls WHERE id = ? AND deleted_at IS NULL',
            [hallId]
        );

        const hall = hallRows[0];
        if (!hall) {
            throw new NotFoundError('Hall not found');
        }

        if (!hall.is_active) {
            throw new ValidationError('Hall is not active');
        }

        // Check if event type exists
        const [eventTypeRows] = await db.query(
            'SELECT * FROM event_types WHERE id = ? AND is_active = TRUE',
            [eventTypeId]
        );

        if (!eventTypeRows[0]) {
            throw new NotFoundError('Event type not found');
        }

        // Check expected attendees against capacity
        if (expectedAttendees > hall.capacity) {
            throw new ValidationError(`Expected attendees (${expectedAttendees}) exceeds hall capacity (${hall.capacity})`);
        }

        // Check operating hours
        const startHour = start.getHours();
        const startMin = start.getMinutes();
        const endHour = end.getHours();
        const endMin = end.getMinutes();

        const openingTime = hall.opening_time.split(':');
        const closingTime = hall.closing_time.split(':');

        const openingMinutes = parseInt(openingTime[0]) * 60 + parseInt(openingTime[1]);
        const closingMinutes = parseInt(closingTime[0]) * 60 + parseInt(closingTime[1]);
        const bookingStartMinutes = startHour * 60 + startMin;
        const bookingEndMinutes = endHour * 60 + endMin;

        if (bookingStartMinutes < openingMinutes || bookingEndMinutes > closingMinutes) {
            throw new ValidationError(`Booking time must be within hall operating hours (${hall.opening_time} - ${hall.closing_time})`);
        }

        // CRITICAL: Check for overlap using transaction with row locking
        // This prevents race conditions where two users try to book the same slot
        const result = await db.transaction(async (connection) => {
            // Lock the hall row to serialize bookings for this hall
            await connection.query('SELECT id FROM halls WHERE id = ? FOR UPDATE', [hallId]);

            // Check for overlapping bookings
            const [conflicts] = await connection.query(
                `SELECT b.id, b.event_name, b.start_time, b.end_time, b.status_id, bs.code AS status_code
                 FROM bookings b
                 JOIN booking_statuses bs ON b.status_id = bs.id
                 WHERE b.hall_id = ?
                   AND b.deleted_at IS NULL
                   AND bs.code NOT IN ('CANCELLED', 'REJECTED')
                   AND b.start_time < ?
                   AND b.end_time > ?`,
                [hallId, endTime, startTime]
            );

            if (conflicts.length > 0) {
                throw new BookingConflictError('Hall is already booked for the selected time slot');
            }

            // Get default status (CONFIRMED = 2)
            const [statusRows] = await connection.query(
                'SELECT id FROM booking_statuses WHERE code = ?',
                ['CONFIRMED']
            );

            const statusId = statusRows[0]?.id || 2;

            // Insert booking
            const [insertResult] = await connection.query(
                `INSERT INTO bookings (user_id, hall_id, event_type_id, status_id, event_name,
                                      event_description, expected_attendees, start_time, end_time, timezone)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [userId, hallId, eventTypeId, statusId, eventName, eventDescription,
                 expectedAttendees, startTime, endTime, config.TIMEZONE]
            );

            const bookingId = insertResult.insertId;

            // Log status change
            await connection.query(
                `INSERT INTO booking_status_history (booking_id, old_status_id, new_status_id, changed_by_user_id)
                 VALUES (?, NULL, ?, ?)`,
                [bookingId, statusId, userId]
            );

            return bookingId;
        });

        return bookingService.getById(result);
    },

    /**
     * Get booking by ID
     * @param {number} bookingId - Booking ID
     * @returns {Promise<Object>} Booking with related data
     */
    getById: async (bookingId) => {
        const [rows] = await db.query(
            `SELECT
                b.*,
                bs.code AS status_code, bs.label AS status_label, bs.color AS status_color,
                h.name AS hall_name, h.location AS hall_location, h.capacity AS hall_capacity,
                u.id AS user_id, u.full_name AS user_name, u.email AS user_email, u.mobile AS user_mobile,
                ut.code AS user_type_code,
                i.name AS institute_name,
                d.name AS department_name,
                et.code AS event_type_code, et.label AS event_type_label, et.color AS event_type_color
             FROM bookings b
             JOIN booking_statuses bs ON b.status_id = bs.id
             JOIN halls h ON b.hall_id = h.id
             JOIN users u ON b.user_id = u.id
             JOIN user_types ut ON u.user_type_id = ut.id
             LEFT JOIN institutes i ON u.institute_id = i.id AND i.deleted_at IS NULL
             LEFT JOIN departments d ON u.department_id = d.id AND d.deleted_at IS NULL
             JOIN event_types et ON b.event_type_id = et.id
             WHERE b.id = ? AND b.deleted_at IS NULL`,
            [bookingId]
        );

        if (!rows[0]) {
            throw new NotFoundError('Booking not found');
        }

        return rows[0];
    },

    /**
     * Get list of bookings with filters
     * @param {Object} filters - Query filters
     * @param {Object} options - Options (user context for filtering own bookings)
     * @returns {Promise<Object>} Bookings list with pagination
     */
    getAll: async (filters = {}, options = {}) => {
        const { status, hallId, userId, fromDate, toDate, page = 1, limit = 20 } = filters;
        const { isAdmin, currentUserId } = options;

        const where = ['b.deleted_at IS NULL'];
        const params = [];

        // Non-admin users can only see their own bookings (unless admin)
        if (!isAdmin) {
            if (userId && userId !== currentUserId) {
                throw new APP_ERROR('Cannot view other users\' bookings', 403);
            }
            where.push('b.user_id = ?');
            params.push(currentUserId);
        } else if (userId) {
            where.push('b.user_id = ?');
            params.push(userId);
        }

        if (status) {
            where.push('bs.code = ?');
            params.push(status);
        }

        if (hallId) {
            where.push('b.hall_id = ?');
            params.push(hallId);
        }

        if (fromDate) {
            where.push('b.start_time >= ?');
            params.push(fromDate);
        }

        if (toDate) {
            where.push('b.start_time <= ?');
            params.push(toDate);
        }

        // Count total
        const [countRows] = await db.query(
            `SELECT COUNT(*) as total
             FROM bookings b
             JOIN booking_statuses bs ON b.status_id = bs.id
             WHERE ${where.join(' AND ')}`,
            params
        );

        // Get bookings
        const offset = (page - 1) * limit;
        const [rows] = await db.query(
            `SELECT
                b.id, b.event_name, b.event_description, b.expected_attendees,
                b.start_time, b.end_time, b.duration_minutes,
                b.check_in_time, b.check_out_time, b.actual_duration_minutes,
                b.overstay_minutes, b.late_arrival_minutes, b.early_departure_minutes,
                b.created_at,
                bs.code AS status_code, bs.label AS status_label, bs.color AS status_color,
                h.id AS hall_id, h.name AS hall_name, h.location AS hall_location,
                u.id AS user_id, u.full_name AS user_name, u.email AS user_email,
                ut.code AS user_type_code,
                et.code AS event_type_code, et.label AS event_type_label, et.color AS event_type_color
             FROM bookings b
             JOIN booking_statuses bs ON b.status_id = bs.id
             JOIN halls h ON b.hall_id = h.id
             JOIN users u ON b.user_id = u.id
             JOIN user_types ut ON u.user_type_id = ut.id
             JOIN event_types et ON b.event_type_id = et.id
             WHERE ${where.join(' AND ')}
             ORDER BY b.start_time DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        return {
            bookings: rows,
            total: countRows[0].total,
            page: parseInt(page),
            limit: parseInt(limit)
        };
    },

    /**
     * Approve a pending booking (admin)
     * @param {number} bookingId - Booking ID
     * @param {number} adminUserId - Admin user ID
     * @returns {Promise<Object>} Updated booking
     */
    approve: async (bookingId, adminUserId) => {
        return await db.transaction(async (connection) => {
            const [bookingRows] = await connection.query(
                `SELECT b.*, bs.code AS status_code
                 FROM bookings b
                 JOIN booking_statuses bs ON b.status_id = bs.id
                 WHERE b.id = ? AND b.deleted_at IS NULL FOR UPDATE`,
                [bookingId]
            );

            const booking = bookingRows[0];

            if (!booking) {
                throw new NotFoundError('Booking not found');
            }

            if (booking.status_code !== 'PENDING') {
                throw new BookingStateError(`Cannot approve a booking with status '${booking.status_code}'`);
            }

            // Check for overlap before confirming
            const [conflicts] = await connection.query(
                `SELECT b.id, b.event_name FROM bookings b
                 JOIN booking_statuses bs ON b.status_id = bs.id
                 WHERE b.hall_id = ?
                   AND b.id != ?
                   AND b.deleted_at IS NULL
                   AND bs.code NOT IN ('CANCELLED', 'REJECTED')
                   AND b.start_time < ?
                   AND b.end_time > ?`,
                [booking.hall_id, bookingId, booking.end_time, booking.start_time]
            );

            if (conflicts.length > 0) {
                throw new BookingConflictError(`Cannot approve: hall is already booked during this time (${conflicts[0].event_name})`);
            }

            const [statusRows] = await connection.query(
                'SELECT id FROM booking_statuses WHERE code = ?',
                ['CONFIRMED']
            );
            const confirmedStatusId = statusRows[0]?.id || 2;

            await connection.query(
                'UPDATE bookings SET status_id = ?, updated_at = NOW() WHERE id = ?',
                [confirmedStatusId, bookingId]
            );

            await connection.query(
                `INSERT INTO booking_status_history (booking_id, old_status_id, new_status_id, changed_by_user_id)
                 VALUES (?, ?, ?, ?)`,
                [bookingId, booking.status_id, confirmedStatusId, adminUserId]
            );

            const [updatedRows] = await connection.query(
                `SELECT b.*,
                    bs.code AS status_code, bs.label AS status_label, bs.color AS status_color,
                    h.name AS hall_name, h.location AS hall_location, h.capacity AS hall_capacity,
                    u.id AS user_id, u.full_name AS user_name, u.email AS user_email,
                    et.code AS event_type_code, et.label AS event_type_label
                 FROM bookings b
                 JOIN booking_statuses bs ON b.status_id = bs.id
                 JOIN halls h ON b.hall_id = h.id
                 JOIN users u ON b.user_id = u.id
                 JOIN event_types et ON b.event_type_id = et.id
                 WHERE b.id = ? AND b.deleted_at IS NULL`,
                [bookingId]
            );

            return updatedRows[0];
        });
    },

    /**
     * Reject a pending booking (admin)
     * @param {number} bookingId - Booking ID
     * @param {number} adminUserId - Admin user ID
     * @param {string} adminNotes - Admin rejection notes
     * @returns {Promise<Object>} Updated booking
     */
    reject: async (bookingId, adminUserId, adminNotes = null) => {
        return await db.transaction(async (connection) => {
            const [bookingRows] = await connection.query(
                `SELECT b.*, bs.code AS status_code
                 FROM bookings b
                 JOIN booking_statuses bs ON b.status_id = bs.id
                 WHERE b.id = ? AND b.deleted_at IS NULL FOR UPDATE`,
                [bookingId]
            );

            const booking = bookingRows[0];

            if (!booking) {
                throw new NotFoundError('Booking not found');
            }

            if (booking.status_code !== 'PENDING') {
                throw new BookingStateError(`Cannot reject a booking with status '${booking.status_code}'`);
            }

            const [statusRows] = await connection.query(
                'SELECT id FROM booking_statuses WHERE code = ?',
                ['REJECTED']
            );
            const rejectedStatusId = statusRows[0]?.id || 6;

            await connection.query(
                'UPDATE bookings SET status_id = ?, admin_notes = ?, updated_at = NOW() WHERE id = ?',
                [rejectedStatusId, adminNotes || booking.admin_notes, bookingId]
            );

            await connection.query(
                `INSERT INTO booking_status_history (booking_id, old_status_id, new_status_id, changed_by_user_id, reason)
                 VALUES (?, ?, ?, ?, ?)`,
                [bookingId, booking.status_id, rejectedStatusId, adminUserId, adminNotes]
            );

            const [updatedRows] = await connection.query(
                `SELECT b.*,
                    bs.code AS status_code, bs.label AS status_label, bs.color AS status_color,
                    h.name AS hall_name, h.location AS hall_location, h.capacity AS hall_capacity,
                    u.id AS user_id, u.full_name AS user_name, u.email AS user_email,
                    et.code AS event_type_code, et.label AS event_type_label
                 FROM bookings b
                 JOIN booking_statuses bs ON b.status_id = bs.id
                 JOIN halls h ON b.hall_id = h.id
                 JOIN users u ON b.user_id = u.id
                 JOIN event_types et ON b.event_type_id = et.id
                 WHERE b.id = ? AND b.deleted_at IS NULL`,
                [bookingId]
            );

            return updatedRows[0];
        });
    },

    /**
     * Cancel a booking
     * @param {number} bookingId - Booking ID
     * @param {number} userId - User ID cancelling
     * @param {Object} cancellationData - Cancellation reason
     * @returns {Promise<Object>} Cancelled booking
     */
    cancel: async (bookingId, userId, cancellationData = {}) => {
        const { reasonId = null, reasonText = null } = cancellationData;

        return await db.transaction(async (connection) => {
            // Get booking with lock
            const [bookingRows] = await connection.query(
                `SELECT b.*, bs.code AS status_code
                 FROM bookings b
                 JOIN booking_statuses bs ON b.status_id = bs.id
                 WHERE b.id = ? AND b.deleted_at IS NULL FOR UPDATE`,
                [bookingId]
            );

            const booking = bookingRows[0];

            if (!booking) {
                throw new NotFoundError('Booking not found');
            }

            // Check ownership or admin
            const isOwner = booking.user_id === userId;
            const [userRows] = await connection.query(
                'SELECT email, user_type_id FROM users WHERE id = ?',
                [userId]
            );
            const isAdmin = userRows[0]?.email === 'admin@campus.edu.in' ||
                (await connection.query(
                    'SELECT code FROM user_types WHERE id = ?',
                    [userRows[0]?.user_type_id]
                ))[0][0]?.code === 'ADMIN';

            if (!isOwner && !isAdmin) {
                throw new APP_ERROR('Not authorized to cancel this booking', 403);
            }

            // Check if already cancelled
            if (booking.status_code === 'CANCELLED') {
                throw new CancellationError('Booking is already cancelled');
            }

            // Check if completed
            if (booking.status_code === 'COMPLETED' || booking.status_code === 'IN_PROGRESS') {
                throw new CancellationError('Cannot cancel a booking that is in progress or completed');
            }

            // Check cancellation window
            const startTime = new Date(booking.start_time);
            const now = new Date();
            const minutesUntilStart = Math.floor((startTime - now) / (1000 * 60));

            if (minutesUntilStart < config.CANCELLATION_WINDOW_MINUTES && !isAdmin) {
                throw new CancellationError(`Cancellation must be at least ${config.CANCELLATION_WINDOW_MINUTES} minutes before start time`);
            }

            // Get CANCELLED status
            const [statusRows] = await connection.query(
                'SELECT id FROM booking_statuses WHERE code = ?',
                ['CANCELLED']
            );
            const cancelledStatusId = statusRows[0]?.id;

            // Create cancellation record
            const [cancelResult] = await connection.query(
                `INSERT INTO cancellations (booking_id, reason_id, reason_text, cancelled_by_user_id)
                 VALUES (?, ?, ?, ?)`,
                [bookingId, reasonId, reasonText, userId]
            );

            // Update booking status
            await connection.query(
                `UPDATE bookings SET status_id = ?, cancellation_id = ?, updated_at = NOW() WHERE id = ?`,
                [cancelledStatusId, cancelResult.insertId, bookingId]
            );

            // Log status change
            await connection.query(
                `INSERT INTO booking_status_history (booking_id, old_status_id, new_status_id, changed_by_user_id)
                 VALUES (?, ?, ?, ?)`,
                [bookingId, booking.status_id, cancelledStatusId, userId]
            );

            // Return updated booking using the same connection so we see the committed data
            const [updatedRows] = await connection.query(
                `SELECT
                    b.*,
                    bs.code AS status_code, bs.label AS status_label, bs.color AS status_color,
                    h.name AS hall_name, h.location AS hall_location, h.capacity AS hall_capacity,
                    u.id AS user_id, u.full_name AS user_name, u.email AS user_email, u.mobile AS user_mobile,
                    ut.code AS user_type_code,
                    i.name AS institute_name,
                    d.name AS department_name,
                    et.code AS event_type_code, et.label AS event_type_label, et.color AS event_type_color
                 FROM bookings b
                 JOIN booking_statuses bs ON b.status_id = bs.id
                 JOIN halls h ON b.hall_id = h.id
                 JOIN users u ON b.user_id = u.id
                 JOIN user_types ut ON u.user_type_id = ut.id
                 LEFT JOIN institutes i ON u.institute_id = i.id AND i.deleted_at IS NULL
                 LEFT JOIN departments d ON u.department_id = d.id AND d.deleted_at IS NULL
                 JOIN event_types et ON b.event_type_id = et.id
                 WHERE b.id = ? AND b.deleted_at IS NULL`,
                [bookingId]
            );

            return updatedRows[0];
        });
    },

    /**
     * Update booking (limited edits)
     * @param {number} bookingId - Booking ID
     * @param {Object} updates - Updates
     * @returns {Promise<Object>} Updated booking
     */
    update: async (bookingId, updates) => {
        const allowedFields = ['event_name', 'event_description', 'expected_attendees'];
        const fields = [];
        const values = [];

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(updates[field]);
            }
        }

        if (fields.length === 0) {
            throw new APP_ERROR('No valid fields to update', 400);
        }

        values.push(bookingId);

        await db.query(
            `UPDATE bookings SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
            values
        );

        return bookingService.getById(bookingId);
    },

    /**
     * Get upcoming bookings for a user
     * @param {number} userId - User ID
     * @param {number} limit - Limit
     * @returns {Promise<Array>} List of upcoming bookings
     */
    getUpcoming: async (userId, limit = 10) => {
        const [rows] = await db.query(
            `SELECT
                b.id, b.event_name, b.start_time, b.end_time, b.duration_minutes,
                bs.code AS status_code, bs.label AS status_label, bs.color AS status_color,
                h.id AS hall_id, h.name AS hall_name, h.location AS hall_location,
                et.code AS event_type_code, et.label AS event_type_label, et.color AS event_type_color
             FROM bookings b
             JOIN booking_statuses bs ON b.status_id = bs.id
             JOIN halls h ON b.hall_id = h.id
             JOIN event_types et ON b.event_type_id = et.id
             WHERE b.user_id = ?
               AND b.deleted_at IS NULL
               AND b.start_time > NOW()
               AND bs.code NOT IN ('CANCELLED', 'REJECTED', 'COMPLETED')
             ORDER BY b.start_time ASC
             LIMIT ?`,
            [userId, limit]
        );
        return rows;
    },

    /**
     * Get today's bookings for a user
     * @param {number} userId - User ID
     * @returns {Promise<Array>} List of today's bookings
     */
    getToday: async (userId) => {
        const [rows] = await db.query(
            `SELECT
                b.id, b.event_name, b.start_time, b.end_time, b.duration_minutes,
                bs.code AS status_code, bs.label AS status_label, bs.color AS status_color,
                h.id AS hall_id, h.name AS hall_name, h.location AS hall_location,
                et.code AS event_type_code, et.label AS event_type_label, et.color AS event_type_color
             FROM bookings b
             JOIN booking_statuses bs ON b.status_id = bs.id
             JOIN halls h ON b.hall_id = h.id
             JOIN event_types et ON b.event_type_id = et.id
             WHERE b.user_id = ?
               AND b.deleted_at IS NULL
               AND DATE(b.start_time) = CURDATE()
             ORDER BY b.start_time ASC`,
            [userId]
        );
        return rows;
    }
};

module.exports = bookingService;