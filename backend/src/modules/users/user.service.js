"use strict";

const db = require('../../config/db');
const { APP_ERROR, NotFoundError, ConflictError } = require('../../utils/errors');
const logger = require('../../config/logger');

/**
 * User service - handles user management
 */
const userService = {
    /**
     * Get all users (admin only)
     * @param {Object} filters - Query filters
     * @returns {Promise<Object>} Users list with pagination
     */
    getAll: async (filters = {}) => {
        const { page = 1, limit = 20, userType, instituteId, search } = filters;
        const offset = (page - 1) * limit;

        let where = [];
        let params = [];

        where.push('u.deleted_at IS NULL');

        if (userType) {
            where.push('ut.code = ?');
            params.push(userType);
        }

        if (instituteId) {
            where.push('u.institute_id = ?');
            params.push(instituteId);
        }

        if (search) {
            where.push('(u.full_name LIKE ? OR u.email LIKE ? OR u.mobile LIKE ?)');
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        const [rows] = await db.query(
            `SELECT u.id, u.user_type_id, u.institute_id, u.department_id, u.email,
                    u.full_name, u.mobile, u.gender, u.course, u.academic_year, u.semester,
                    u.roll_number, u.employee_id, u.designation, u.is_active, u.is_verified,
                    u.created_at, ut.code AS user_type_code,
                    i.name AS institute_name, d.name AS department_name
             FROM users u
             LEFT JOIN user_types ut ON u.user_type_id = ut.id
             LEFT JOIN institutes i ON u.institute_id = i.id AND i.deleted_at IS NULL
             LEFT JOIN departments d ON u.department_id = d.id AND d.deleted_at IS NULL
             WHERE ${where.join(' AND ')}
             ORDER BY u.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        // Get total count
        const [countRows] = await db.query(
            `SELECT COUNT(*) as total FROM users u
             LEFT JOIN user_types ut ON u.user_type_id = ut.id
             WHERE ${where.join(' AND ')}`,
            params
        );

        return {
            users: rows,
            total: countRows[0].total,
            page: parseInt(page),
            limit: parseInt(limit)
        };
    },

    /**
     * Get user by ID
     * @param {number} userId - User ID
     * @returns {Promise<Object>} User data
     */
    getById: async (userId) => {
        const [rows] = await db.query(
            `SELECT u.id, u.user_type_id, u.institute_id, u.department_id, u.email,
                    u.full_name, u.mobile, u.gender, u.date_of_birth, u.course,
                    u.academic_year, u.semester, u.roll_number, u.employee_id,
                    u.designation, u.profile_image_url, u.is_active, u.is_verified,
                    u.last_login_at, u.created_at, u.updated_at,
                    ut.code AS user_type_code,
                    i.name AS institute_name, d.name AS department_name
             FROM users u
             LEFT JOIN user_types ut ON u.user_type_id = ut.id
             LEFT JOIN institutes i ON u.institute_id = i.id AND i.deleted_at IS NULL
             LEFT JOIN departments d ON u.department_id = d.id AND d.deleted_at IS NULL
             WHERE u.id = ? AND u.deleted_at IS NULL`,
            [userId]
        );

        if (!rows[0]) {
            throw new NotFoundError('User not found');
        }

        return rows[0];
    },

    /**
     * Update user profile
     * @param {number} userId - User ID
     * @param {Object} updates - Profile updates
     * @returns {Promise<Object>} Updated user
     */
    updateProfile: async (userId, updates) => {
        // Check if email/mobile is being changed and not already taken
        if (updates.email) {
            const existing = await db.queryOne(
                'SELECT id FROM users WHERE email = ? AND id != ? AND deleted_at IS NULL',
                [updates.email, userId]
            );
            if (existing) {
                throw new ConflictError('Email already in use');
            }
        }

        if (updates.mobile) {
            const existing = await db.queryOne(
                'SELECT id FROM users WHERE mobile = ? AND id != ? AND deleted_at IS NULL',
                [updates.mobile, userId]
            );
            if (existing) {
                throw new ConflictError('Mobile number already in use');
            }
        }

        const allowedFields = ['full_name', 'mobile', 'gender', 'date_of_birth',
            'course', 'academic_year', 'semester', 'roll_number',
            'employee_id', 'designation', 'profile_image_url'];

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

        values.push(userId);

        await db.query(
            `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
            values
        );

        return userService.getById(userId);
    },

    /**
     * Update user status (admin only)
     * @param {number} userId - User ID
     * @param {boolean} isActive - Active status
     * @returns {Promise<Object>} Updated user
     */
    updateStatus: async (userId, isActive) => {
        await db.query(
            'UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?',
            [isActive, userId]
        );

        return userService.getById(userId);
    },

    /**
     * Delete user (soft delete)
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Deleted user info
     */
    delete: async (userId) => {
        await db.query(
            'UPDATE users SET deleted_at = NOW() WHERE id = ?',
            [userId]
        );

        return { id: userId, deleted: true };
    },

    /**
     * Get user statistics
     * @param {number} userId - User ID
     * @returns {Promise<Object>} User statistics
     */
    getStats: async (userId) => {
        const [rows] = await db.query(
            `SELECT
                COUNT(DISTINCT b.id) as total_bookings,
                SUM(CASE WHEN b.status_id = (SELECT id FROM booking_statuses WHERE code = 'COMPLETED') THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN b.status_id = (SELECT id FROM booking_statuses WHERE code = 'CANCELLED') THEN 1 ELSE 0 END) as cancelled,
                SUM(CASE WHEN b.status_id = (SELECT id FROM booking_statuses WHERE code = 'IN_PROGRESS') THEN 1 ELSE 0 END) as in_progress,
                COALESCE(SUM(b.duration_minutes), 0) as total_usage_minutes,
                AVG(f.overall_rating) as avg_rating,
                SUM(CASE WHEN b.overstay_minutes > 0 THEN 1 ELSE 0 END) as overstay_count
             FROM bookings b
             LEFT JOIN feedback f ON f.booking_id = b.id
             WHERE b.user_id = ? AND b.deleted_at IS NULL`,
            [userId]
        );

        return rows[0];
    }
};

module.exports = userService;