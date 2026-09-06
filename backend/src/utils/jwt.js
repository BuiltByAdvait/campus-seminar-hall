"use strict";

const jwt = require('jsonwebtoken');
const config = require('../config/env');
const db = require('../config/db');

/**
 * Generate access token
 * @param {Object} user - User object with id, user_type_id, email
 * @returns {string} JWT access token
 */
const generateAccessToken = (user) => {
    return jwt.sign(
        { userId: user.id, userTypeId: user.user_type_id, email: user.email },
        config.JWT_ACCESS_SECRET,
        { expiresIn: config.JWT_ACCESS_EXPIRY }
    );
};

/**
 * Generate refresh token
 * @param {Object} user - User object with id
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (user) => {
    return jwt.sign(
        { userId: user.id, type: 'refresh' },
        config.JWT_REFRESH_SECRET,
        { expiresIn: config.JWT_REFRESH_EXPIRY }
    );
};

/**
 * Store refresh token hash in database
 * @param {number} userId - User ID
 * @param {string} token - Refresh token
 * @returns {Promise<void>}
 */
const storeRefreshToken = async (userId, token) => {
    const crypto = require('crypto');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.query(
        `INSERT INTO user_refresh_tokens (user_id, token_hash, expires_at)
         VALUES (?, ?, ?)`,
        [userId, tokenHash, expiresAt]
    );
};

/**
 * Verify refresh token and return user
 * @param {string} token - Refresh token
 * @returns {Promise<Object|null>} User object or null if invalid
 */
const verifyRefreshToken = async (token) => {
    try {
        const decoded = jwt.verify(token, config.JWT_REFRESH_SECRET);

        if (decoded.type !== 'refresh') {
            return null;
        }

        // Check if token exists in database and not revoked
        const crypto = require('crypto');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const [rows] = await db.query(
            `SELECT urt.*, u.id, u.email, u.full_name, u.user_type_id, u.is_active
             FROM user_refresh_tokens urt
             JOIN users u ON u.id = urt.user_id
             WHERE urt.token_hash = ? AND urt.revoked_at IS NULL AND urt.expires_at > NOW()
             AND u.deleted_at IS NULL AND u.is_active = TRUE`,
            [tokenHash]
        );

        return rows[0] || null;
    } catch (err) {
        return null;
    }
};

/**
 * Revoke refresh token (logout)
 * @param {string} token - Refresh token to revoke
 * @returns {Promise<void>}
 */
const revokeRefreshToken = async (token) => {
    const crypto = require('crypto');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await db.query(
        `UPDATE user_refresh_tokens SET revoked_at = NOW() WHERE token_hash = ?`,
        [tokenHash]
    );
};

/**
 * Revoke all refresh tokens for a user
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
const revokeAllUserTokens = async (userId) => {
    await db.query(
        `UPDATE user_refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL`,
        [userId]
    );
};

/**
 * Verify access token (without database lookup)
 * @param {string} token - Access token
 * @returns {Object|null} Decoded payload or null
 */
const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, config.JWT_ACCESS_SECRET);
    } catch (err) {
        return null;
    }
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    storeRefreshToken,
    verifyRefreshToken,
    revokeRefreshToken,
    revokeAllUserTokens,
    verifyAccessToken
};