"use strict";

const db = require('../../config/db');
const { APP_ERROR, NotFoundError, ConflictError } = require('../../utils/errors');
const { TIMEZONE } = require('../../config/env');

const hallService = {
    /**
     * Get all active halls
     * @param {Object} filters - Optional filters
     * @returns {Promise<Array>} List of halls
     */
    getAll: async (filters = {}) => {
        let query = `SELECT h.*, i.name AS institute_name
                     FROM halls h
                     LEFT JOIN institutes i ON h.institute_id = i.id AND i.deleted_at IS NULL
                     WHERE h.deleted_at IS NULL`;
        const params = [];

        if (filters.instituteId) {
            query += ' AND h.institute_id = ?';
            params.push(filters.instituteId);
        }

        if (filters.activeOnly !== false) {
            query += ' AND h.is_active = TRUE';
        }

        query += ' ORDER BY h.name';

        const [rows] = await db.query(query, params);
        return rows;
    },

    /**
     * Get hall by ID
     * @param {number} hallId - Hall ID
     * @returns {Promise<Object>} Hall data
     */
    getById: async (hallId) => {
        const [rows] = await db.query(
            `SELECT h.*, i.name AS institute_name
             FROM halls h
             LEFT JOIN institutes i ON h.institute_id = i.id AND i.deleted_at IS NULL
             WHERE h.id = ? AND h.deleted_at IS NULL`,
            [hallId]
        );

        if (!rows[0]) {
            throw new NotFoundError('Hall not found');
        }

        return rows[0];
    },

    /**
     * Create a new hall
     * @param {Object} hallData - Hall data
     * @returns {Promise<Object>} Created hall
     */
    create: async (hallData) => {
        const { instituteId, code, name, shortName, description, capacity = 100,
                location, floor, facilities = [], openingTime = '08:00:00',
                closingTime = '20:00:00', requiresApproval = false } = hallData;

        // Check if code already exists
        const existing = await db.queryOne(
            'SELECT id FROM halls WHERE code = ? AND deleted_at IS NULL',
            [code]
        );

        if (existing) {
            throw new ConflictError('Hall code already exists');
        }

        // Validate institute
        const institute = await db.queryOne(
            'SELECT id FROM institutes WHERE id = ? AND deleted_at IS NULL',
            [instituteId]
        );

        if (!institute) {
            throw new NotFoundError('Institute not found');
        }

        // Validate opening < closing
        if (openingTime >= closingTime) {
            throw new APP_ERROR('Opening time must be before closing time', 400);
        }

        const [result] = await db.query(
            `INSERT INTO halls (institute_id, code, name, short_name, description, capacity,
                               location, floor, facilities, opening_time, closing_time, requires_approval)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [instituteId, code, name, shortName || null, description || null, capacity,
             location || null, floor || null, JSON.stringify(facilities), openingTime, closingTime, requiresApproval]
        );

        return hallService.getById(result.insertId);
    },

    /**
     * Update hall
     * @param {number} hallId - Hall ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} Updated hall
     */
    update: async (hallId, updates) => {
        const allowedFields = ['name', 'short_name', 'description', 'capacity',
            'location', 'floor', 'facilities', 'opening_time', 'closing_time',
            'requires_approval', 'is_active'];

        const fields = [];
        const values = [];

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                fields.push(`${field} = ?`);
                if (field === 'facilities') {
                    values.push(JSON.stringify(updates[field]));
                } else {
                    values.push(updates[field]);
                }
            }
        }

        if (fields.length === 0) {
            throw new APP_ERROR('No valid fields to update', 400);
        }

        values.push(hallId);

        await db.query(
            `UPDATE halls SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
            values
        );

        return hallService.getById(hallId);
    },

    /**
     * Soft delete hall
     * @param {number} hallId - Hall ID
     * @returns {Promise<void>}
     */
    delete: async (hallId) => {
        // Check for active bookings
        const activeBookings = await db.queryOne(
            `SELECT COUNT(*) as count FROM bookings
             WHERE hall_id = ? AND status_id NOT IN (
                 SELECT id FROM booking_statuses WHERE code IN ('CANCELLED', 'COMPLETED')
             ) AND deleted_at IS NULL AND start_time > NOW()`,
            [hallId]
        );

        if (activeBookings.count > 0) {
            throw new ConflictError(`Cannot delete hall with ${activeBookings.count} active future bookings`);
        }

        await db.query(
            'UPDATE halls SET deleted_at = NOW() WHERE id = ?',
            [hallId]
        );
    },

    /**
     * Get hall availability for a specific date
     * @param {number} hallId - Hall ID
     * @param {string} date - Date in YYYY-MM-DD format
     * @returns {Promise<Object>} Availability data
     */
    getAvailability: async (hallId, date) => {
        // Get hall info
        const hall = await hallService.getById(hallId);

        // Get bookings for that date
        const [bookings] = await db.query(
            `SELECT b.id, b.event_name, b.start_time, b.end_time, b.duration_minutes,
                    b.expected_attendees, b.status_id, bs.code AS status_code, bs.label AS status_label,
                    bs.color AS status_color, u.full_name AS user_name, et.code AS event_type_code
             FROM bookings b
             JOIN booking_statuses bs ON b.status_id = bs.id
             JOIN users u ON b.user_id = u.id
             JOIN event_types et ON b.event_type_id = et.id
             WHERE b.hall_id = ?
               AND DATE(b.start_time) = ?
               AND b.deleted_at IS NULL
               AND bs.code NOT IN ('CANCELLED', 'REJECTED')
             ORDER BY b.start_time`,
            [hallId, date]
        );

        return {
            hall: {
                id: hall.id,
                name: hall.name,
                openingTime: hall.opening_time,
                closingTime: hall.closing_time,
                capacity: hall.capacity
            },
            date,
            bookings,
            timezone: TIMEZONE
        };
    }
};

module.exports = hallService;