"use strict";

const db = require('../../config/db');
const {
    APP_ERROR,
    NotFoundError,
    CheckInError,
    CheckOutError,
    ValidationError
} = require('../../utils/errors');
const logger = require('../../config/logger');

const checkInOutService = {
    /**
     * Check in to a booking
     * @param {number} bookingId - Booking ID
     * @param {number} userId - User ID
     * @param {string} method - Method (MANUAL, QR, ADMIN)
     * @returns {Promise<Object>} Check-in result
     */
    checkIn: async (bookingId, userId, method = 'MANUAL', notes = null) => {
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

            // Check ownership (admin can check in for users)
            const [userRows] = await connection.query(
                `SELECT u.email, ut.code AS user_type_code
                 FROM users u JOIN user_types ut ON u.user_type_id = ut.id
                 WHERE u.id = ?`,
                [userId]
            );

            const isAdmin = userRows[0]?.user_type_code === 'ADMIN' ||
                            userRows[0]?.email === 'admin@campus.edu.in';

            if (booking.user_id !== userId && !isAdmin) {
                throw new APP_ERROR('Not authorized to check in to this booking', 403);
            }

            // Check status
            if (booking.status_code === 'CANCELLED' || booking.status_code === 'REJECTED') {
                throw new CheckInError('Cannot check in to a cancelled or rejected booking');
            }

            if (booking.status_code === 'COMPLETED') {
                throw new CheckInError('Booking is already completed');
            }

            if (booking.check_in_time) {
                throw new CheckInError('Already checked in');
            }

            // Check time window: from 30 min before start to end_time
            const now = new Date();
            const startTime = new Date(booking.start_time);
            const endTime = new Date(booking.end_time);
            const minutesUntilStart = (startTime - now) / (1000 * 60);
            const minutesAfterEnd = (now - endTime) / (1000 * 60);

            if (minutesUntilStart > 30) {
                throw new CheckInError('Check-in opens 30 minutes before start time');
            }

            if (minutesAfterEnd > 0) {
                throw new CheckInError('Cannot check in - booking time has passed');
            }

            // Calculate late arrival
            const lateArrivalMinutes = minutesUntilStart < 0
                ? Math.ceil(-minutesUntilStart)
                : 0;

            // Update booking
            await connection.query(
                `UPDATE bookings
                 SET check_in_time = NOW(),
                     late_arrival_minutes = ?,
                     status_id = (SELECT id FROM booking_statuses WHERE code = 'IN_PROGRESS'),
                     updated_at = NOW()
                 WHERE id = ?`,
                [lateArrivalMinutes, bookingId]
            );

            // Create check-in record
            await connection.query(
                `INSERT INTO check_in_outs (booking_id, user_id, check_in_time, check_in_method, check_in_notes)
                 VALUES (?, ?, NOW(), ?, ?)`,
                [bookingId, userId, method, notes]
            );

            // Log status change
            await connection.query(
                `INSERT INTO booking_status_history (booking_id, old_status_id, new_status_id, changed_by_user_id)
                 VALUES (?, ?, (SELECT id FROM booking_statuses WHERE code = 'IN_PROGRESS'), ?)`,
                [bookingId, booking.status_id, userId]
            );

            return {
                bookingId,
                checkInTime: new Date(),
                lateArrivalMinutes,
                message: lateArrivalMinutes > 0
                    ? `Checked in. You are ${lateArrivalMinutes} minute(s) late.`
                    : 'Checked in successfully'
            };
        });
    },

    /**
     * Check out from a booking
     * @param {number} bookingId - Booking ID
     * @param {number} userId - User ID
     * @param {string} method - Method
     * @returns {Promise<Object>} Check-out result
     */
    checkOut: async (bookingId, userId, method = 'MANUAL', notes = null) => {
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

            // Check ownership
            const [userRows] = await connection.query(
                `SELECT u.email, ut.code AS user_type_code
                 FROM users u JOIN user_types ut ON u.user_type_id = ut.id
                 WHERE u.id = ?`,
                [userId]
            );

            const isAdmin = userRows[0]?.user_type_code === 'ADMIN' ||
                            userRows[0]?.email === 'admin@campus.edu.in';

            if (booking.user_id !== userId && !isAdmin) {
                throw new APP_ERROR('Not authorized to check out from this booking', 403);
            }

            // Check status
            if (booking.status_code === 'CANCELLED' || booking.status_code === 'REJECTED') {
                throw new CheckOutError('Cannot check out from a cancelled or rejected booking');
            }

            if (booking.status_code === 'COMPLETED') {
                throw new CheckOutError('Booking is already completed');
            }

            if (!booking.check_in_time) {
                throw new CheckOutError('Must check in first before checking out');
            }

            if (booking.check_out_time) {
                throw new CheckOutError('Already checked out');
            }

            // Calculate actual duration and overstay
            const now = new Date();
            const checkInTime = new Date(booking.check_in_time);
            const endTime = new Date(booking.end_time);

            const actualDurationMinutes = Math.round((now - checkInTime) / (1000 * 60));

            // Overstay: positive if checked out after end_time
            const overstayMinutes = (now > endTime)
                ? Math.round((now - endTime) / (1000 * 60))
                : 0;

            // Early departure: positive if checked out before end_time
            const earlyDepartureMinutes = (now < endTime)
                ? Math.round((endTime - now) / (1000 * 60))
                : 0;

            // Update booking
            await connection.query(
                `UPDATE bookings
                 SET check_out_time = NOW(),
                     actual_duration_minutes = ?,
                     overstay_minutes = ?,
                     early_departure_minutes = ?,
                     status_id = (SELECT id FROM booking_statuses WHERE code = 'COMPLETED'),
                     updated_at = NOW()
                 WHERE id = ?`,
                [actualDurationMinutes, overstayMinutes, earlyDepartureMinutes, bookingId]
            );

            // Update check_in_outs record
            await connection.query(
                `UPDATE check_in_outs
                 SET check_out_time = NOW(),
                     check_out_method = ?,
                     check_out_notes = ?,
                     overstay_minutes = ?
                 WHERE booking_id = ? AND check_out_time IS NULL`,
                [method, notes, overstayMinutes, bookingId]
            );

            // Log status change
            await connection.query(
                `INSERT INTO booking_status_history (booking_id, old_status_id, new_status_id, changed_by_user_id)
                 VALUES (?, ?, (SELECT id FROM booking_statuses WHERE code = 'COMPLETED'), ?)`,
                [bookingId, booking.status_id, userId]
            );

            return {
                bookingId,
                checkOutTime: new Date(),
                actualDurationMinutes,
                overstayMinutes,
                earlyDepartureMinutes,
                message: overstayMinutes > 0
                    ? `Checked out. You overstayed by ${overstayMinutes} minute(s).`
                    : 'Checked out successfully'
            };
        });
    },

    /**
     * Get check-in/out record for a booking
     * @param {number} bookingId - Booking ID
     * @returns {Promise<Object|null>} Check-in/out record or null
     */
    getByBooking: async (bookingId) => {
        const [rows] = await db.query(
            `SELECT
                cio.*, u.full_name AS user_name
             FROM check_in_outs cio
             JOIN users u ON cio.user_id = u.id
             WHERE cio.booking_id = ?
             ORDER BY cio.created_at DESC
             LIMIT 1`,
            [bookingId]
        );
        return rows[0] || null;
    },

    /**
     * Get all check-in/out records (admin)
     * @param {Object} filters - Filters
     * @returns {Promise<Array>} List of records
     */
    getAll: async (filters = {}) => {
        const { hallId, fromDate, toDate, page = 1, limit = 50 } = filters;

        let where = ['1=1'];
        const params = [];

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

        const offset = (page - 1) * limit;

        const [rows] = await db.query(
            `SELECT
                b.id AS booking_id, b.event_name, b.start_time, b.end_time,
                b.check_in_time, b.check_out_time, b.actual_duration_minutes,
                b.overstay_minutes, b.late_arrival_minutes, b.early_departure_minutes,
                b.status_id, bs.code AS status_code, bs.label AS status_label,
                h.name AS hall_name,
                u.full_name AS user_name, u.email AS user_email,
                cio.check_in_method, cio.check_out_method, cio.overstay_minutes AS cio_overstay
             FROM bookings b
             JOIN booking_statuses bs ON b.status_id = bs.id
             JOIN halls h ON b.hall_id = h.id
             JOIN users u ON b.user_id = u.id
             LEFT JOIN check_in_outs cio ON cio.booking_id = b.id
             WHERE ${where.join(' AND ')}
               AND (b.check_in_time IS NOT NULL OR b.check_out_time IS NOT NULL)
             ORDER BY b.start_time DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        return rows;
    }
};

module.exports = checkInOutService;