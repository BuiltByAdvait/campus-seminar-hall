"use strict";

const db = require('../../config/db');
const { NotFoundError, ConflictError, FeedbackError, ValidationError } = require('../../utils/errors');

const feedbackService = {
    /**
     * Submit feedback for a booking
     * @param {number} bookingId - Booking ID
     * @param {number} userId - User ID
     * @param {Object} feedbackData - Feedback data
     * @returns {Promise<Object>} Created feedback
     */
    submit: async (bookingId, userId, feedbackData) => {
        const { overallRating, cleanlinessRating = null, equipmentRating = null,
                experienceRating = null, comments = null, wouldRecommend = null } = feedbackData;

        // Validate rating
        if (overallRating < 1 || overallRating > 5) {
            throw new ValidationError('Overall rating must be between 1 and 5');
        }

        // Get booking
        const [bookingRows] = await db.query(
            `SELECT b.*, bs.code AS status_code
             FROM bookings b
             JOIN booking_statuses bs ON b.status_id = bs.id
             WHERE b.id = ? AND b.deleted_at IS NULL`,
            [bookingId]
        );

        const booking = bookingRows[0];
        if (!booking) {
            throw new NotFoundError('Booking not found');
        }

        // Check ownership
        if (booking.user_id !== userId) {
            throw new FeedbackError('You can only submit feedback for your own bookings');
        }

        // Check booking is completed
        if (booking.status_code !== 'COMPLETED') {
            throw new FeedbackError('Can only submit feedback for completed bookings');
        }

        // Check if already submitted
        const existing = await db.queryOne(
            'SELECT id FROM feedback WHERE booking_id = ?',
            [bookingId]
        );

        if (existing) {
            throw new ConflictError('Feedback already submitted for this booking');
        }

        // Insert feedback
        const [result] = await db.query(
            `INSERT INTO feedback (booking_id, user_id, overall_rating, cleanliness_rating,
                                  equipment_rating, experience_rating, comments, would_recommend)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [bookingId, userId, overallRating, cleanlinessRating, equipmentRating,
             experienceRating, comments, wouldRecommend]
        );

        const feedbackId = result.insertId;

        // Return created feedback
        const [feedbackRows] = await db.query(
            `SELECT f.*, b.event_name, b.start_time, b.end_time, h.name AS hall_name
             FROM feedback f
             JOIN bookings b ON f.booking_id = b.id
             JOIN halls h ON b.hall_id = h.id
             WHERE f.id = ?`,
            [feedbackId]
        );

        return feedbackRows[0];
    },

    /**
     * Get feedback for a booking
     * @param {number} bookingId - Booking ID
     * @returns {Promise<Object|null>} Feedback or null
     */
    getByBooking: async (bookingId) => {
        const [rows] = await db.query(
            `SELECT f.*, u.full_name AS user_name, b.event_name, h.name AS hall_name
             FROM feedback f
             JOIN users u ON f.user_id = u.id
             JOIN bookings b ON f.booking_id = b.id
             JOIN halls h ON b.hall_id = h.id
             WHERE f.booking_id = ?`,
            [bookingId]
        );
        return rows[0] || null;
    },

    /**
     * Get all feedback (admin)
     * @param {Object} filters - Filters
     * @returns {Promise<Object>} Feedback list with pagination
     */
    getAll: async (filters = {}) => {
        const { hallId, fromDate, toDate, minRating, page = 1, limit = 20 } = filters;
        const where = ['1=1'];
        const params = [];

        if (hallId) {
            where.push('b.hall_id = ?');
            params.push(hallId);
        }

        if (fromDate) {
            where.push('f.submitted_at >= ?');
            params.push(fromDate);
        }

        if (toDate) {
            where.push('f.submitted_at <= ?');
            params.push(toDate);
        }

        if (minRating) {
            where.push('f.overall_rating >= ?');
            params.push(minRating);
        }

        const [countRows] = await db.query(
            `SELECT COUNT(*) as total
             FROM feedback f
             JOIN bookings b ON f.booking_id = b.id
             WHERE ${where.join(' AND ')}`,
            params
        );

        const offset = (page - 1) * limit;
        const [rows] = await db.query(
            `SELECT f.*, u.full_name AS user_name, b.event_name, b.start_time,
                    h.name AS hall_name, h.id AS hall_id
             FROM feedback f
             JOIN users u ON f.user_id = u.id
             JOIN bookings b ON f.booking_id = b.id
             JOIN halls h ON b.hall_id = h.id
             WHERE ${where.join(' AND ')}
             ORDER BY f.submitted_at DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        return {
            feedback: rows,
            total: countRows[0].total,
            page: parseInt(page),
            limit: parseInt(limit)
        };
    },

    /**
     * Get average ratings
     * @param {number} hallId - Optional hall ID
     * @returns {Promise<Object>} Average ratings
     */
    getAverageRatings: async (hallId = null) => {
        let sql = `SELECT
                       AVG(f.overall_rating) AS avg_overall,
                       AVG(f.cleanliness_rating) AS avg_cleanliness,
                       AVG(f.equipment_rating) AS avg_equipment,
                       AVG(f.experience_rating) AS avg_experience,
                       COUNT(f.id) AS total_reviews,
                       SUM(CASE WHEN f.would_recommend = TRUE THEN 1 ELSE 0 END) AS recommend_count,
                       SUM(CASE WHEN f.would_recommend = FALSE THEN 1 ELSE 0 END) AS not_recommend_count
                    FROM feedback f
                    JOIN bookings b ON f.booking_id = b.id`;

        const params = [];
        if (hallId) {
            sql += ' WHERE b.hall_id = ?';
            params.push(hallId);
        }

        const [rows] = await db.query(sql, params);
        return rows[0];
    }
};

module.exports = feedbackService;