"use strict";

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../../config/env');
const db = require('../../config/db');
const { hashPassword, comparePassword, validatePasswordStrength } = require('../../utils/password');
const { generateAccessToken, generateRefreshToken, storeRefreshToken, revokeAllUserTokens } = require('../../utils/jwt');
const { APP_ERROR, UnauthorizedError, ConflictError, NotFoundError } = require('../../utils/errors');
const logger = require('../../config/logger');

/**
 * Auth service - handles registration, login, refresh, logout
 */
const authService = {
    /**
     * Register a new user
     * @param {Object} userData - Registration data
     * @returns {Promise<Object>} User data (without password)
     */
    register: async (userData) => {
        const { fullName, email, mobile, password, userType, instituteId, departmentId } = userData;

        // Check if email exists
        const existingUser = await db.queryOne(
            'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL',
            [email]
        );

        if (existingUser) {
            throw new ConflictError('Email already registered');
        }

        // Check if mobile exists
        const existingMobile = await db.queryOne(
            'SELECT id FROM users WHERE mobile = ? AND deleted_at IS NULL',
            [mobile]
        );

        if (existingMobile) {
            throw new ConflictError('Mobile number already registered');
        }

        // Validate password strength
        const passwordCheck = validatePasswordStrength(password);
        if (!passwordCheck.valid) {
            throw new APP_ERROR('Password does not meet strength requirements: ' + passwordCheck.errors.join(', '), 400);
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, config.BCRYPT_SALT_ROUNDS);

        // Get user type ID from code (lookup from DB, not hardcoded)
        const userTypeRow = await db.queryOne(
            'SELECT id FROM user_types WHERE code = ?',
            [userType]
        );

        if (!userTypeRow) {
            throw new APP_ERROR('Invalid user type', 400);
        }

        const userTypeId = userTypeRow.id;

        // Create user
        const [result] = await db.query(
            `INSERT INTO users (user_type_id, institute_id, department_id, email, password_hash, full_name, mobile)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userTypeId, instituteId || null, departmentId || null, email, passwordHash, fullName, mobile]
        );

        const userId = result.insertId;

        // Get created user (without password)
        const [users] = await db.query(
            `SELECT id, user_type_id, institute_id, department_id, email, full_name, mobile,
             is_active, is_verified, created_at
             FROM users WHERE id = ?`,
            [userId]
        );

        return users[0];
    },

    /**
     * Login user
     * @param {string} email - User email
     * @param {string} password - Plain text password
     * @returns {Promise<Object>} User data and tokens
     */
    login: async (email, password) => {
        // Find user
        const [rows] = await db.query(
            `SELECT u.id, u.user_type_id, u.institute_id, u.department_id, u.email,
                    u.full_name, u.password_hash, u.mobile, u.is_active, u.is_verified,
                    ut.code AS user_type_code
             FROM users u
             JOIN user_types ut ON u.user_type_id = ut.id
             WHERE u.email = ? AND u.deleted_at IS NULL`,
            [email]
        );

        const user = rows[0];

        if (!user) {
            throw new UnauthorizedError('Invalid email or password');
        }

        if (!user.is_active) {
            throw new UnauthorizedError('Account is deactivated');
        }

        // Check account lock
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
            throw new UnauthorizedError('Account locked. Try again later.');
        }

        // Verify password
        const isMatch = await comparePassword(password, user.password_hash);

        if (!isMatch) {
            // Increment failed login attempts
            const attempts = (user.failed_login_attempts || 0) + 1;
            const lockedUntil = attempts >= 5
                ? new Date(Date.now() + 15 * 60 * 1000) // Lock for 15 minutes
                : null;

            await db.query(
                `UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?`,
                [attempts, lockedUntil, user.id]
            );

            throw new UnauthorizedError('Invalid email or password');
        }

        // Reset failed attempts and update last login
        await db.query(
            `UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login_at = NOW() WHERE id = ?`,
            [user.id]
        );

        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Store refresh token hash
        await storeRefreshToken(user.id, refreshToken);

        // Remove password_hash from response
        const { password_hash, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword,
            accessToken,
            refreshToken,
            expiresIn: config.JWT_ACCESS_EXPIRY
        };
    },

    /**
     * Refresh access token using refresh token
     * @param {string} refreshToken - Refresh token
     * @returns {Promise<Object>} New access token and user data
     */
    refresh: async (refreshToken) => {
        const storedToken = await jwt.verify(refreshToken, config.JWT_REFRESH_SECRET);
        if (!storedToken) {
            throw new UnauthorizedError('Invalid refresh token');
        }

        // Get user from database
        const [rows] = await db.query(
            `SELECT u.id, u.user_type_id, u.institute_id, u.department_id, u.email,
                    u.full_name, u.mobile, u.is_active, u.is_verified,
                    ut.code AS user_type_code
             FROM users u
             JOIN user_types ut ON u.user_type_id = ut.id
             WHERE u.id = ? AND u.deleted_at IS NULL AND u.is_active = TRUE`,
            [storedToken.userId]
        );

        if (!rows[0]) {
            throw new UnauthorizedError('Invalid refresh token');
        }

        const user = rows[0];
        const newAccessToken = generateAccessToken(user);

        return {
            user,
            accessToken: newAccessToken,
            expiresIn: config.JWT_ACCESS_EXPIRY
        };
    },

    /**
     * Logout - revoke refresh token
     * @param {string} refreshToken - Refresh token to revoke
     * @returns {Promise<void>}
     */
    logout: async (refreshToken) => {
        if (refreshToken) {
            await revokeAllUserTokens(refreshToken.userId);
        }
    },

    /**
     * Get current user profile
     * @param {number} userId - User ID
     * @returns {Promise<Object>} User profile
     */
    getProfile: async (userId) => {
        const [rows] = await db.query(
            `SELECT u.id, u.user_type_id, u.institute_id, u.department_id, u.email,
                    u.full_name, u.mobile, u.gender, u.date_of_birth, u.course,
                    u.academic_year, u.semester, u.roll_number, u.employee_id, u.designation,
                    u.profile_image_url, u.is_active, u.is_verified, u.last_login_at,
                    i.name AS institute_name, d.name AS department_name,
                    ut.code AS user_type_code
             FROM users u
             LEFT JOIN institutes i ON u.institute_id = i.id AND i.deleted_at IS NULL
             LEFT JOIN departments d ON u.department_id = d.id AND d.deleted_at IS NULL
             JOIN user_types ut ON u.user_type_id = ut.id
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
        const allowedFields = ['full_name', 'mobile', 'gender', 'date_of_birth',
            'course', 'academic_year', 'semester', 'roll_number',
            'employee_id', 'designation'];

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

        return authService.getProfile(userId);
    }
};

module.exports = authService;