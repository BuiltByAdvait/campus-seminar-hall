"use strict";

const jwt = require('jsonwebtoken');
const config = require('../config/env');
const logger = require('../config/logger');
const db = require('../config/db');
const { APP_ERROR } = require('../utils/errors');

/**
 * Verify JWT access token middleware
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        // Verify token
        const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET);

        // Get user from database (excluding password)
        const [rows] = await db.query(
            `SELECT id, user_type_id, institute_id, department_id, email, full_name,
             mobile, is_active, is_verified, created_at
             FROM users WHERE id = ? AND deleted_at IS NULL`,
            [decoded.userId]
        );

        const user = rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        if (!user.is_active) {
            return res.status(401).json({ error: 'Account deactivated' });
        }

        // Attach user to request
        req.user = user;
        req.userId = user.id;
        next();
    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        logger.error('Auth middleware error:', err);
        return res.status(500).json({ error: 'Authentication failed' });
    }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            req.user = null;
            return next();
        }

        const token = authHeader.substring(7);
        if (!token) {
            req.user = null;
            return next();
        }

        const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET);
        const [rows] = await db.query(
            `SELECT id, user_type_id, email, full_name, is_active
             FROM users WHERE id = ? AND deleted_at IS NULL`,
            [decoded.userId]
        );

        req.user = rows[0] || null;
        next();
    } catch (err) {
        req.user = null;
        next();
    }
};

module.exports = { authenticate, optionalAuth };