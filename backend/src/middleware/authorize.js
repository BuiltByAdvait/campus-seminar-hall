"use strict";

const db = require('../config/db');
const { APP_ERROR } = require('../utils/errors');

/**
 * Check if user has required role(s)
 * @param {...string} roles - Allowed role codes (e.g., 'ADMIN', 'FACULTY')
 */
const requireRole = (...roles) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Also allow admin@campus.edu.in to access any role-required route
        const isSuperAdmin = req.user.email === 'admin@campus.edu.in';

        if (isSuperAdmin) {
            req.userType = 'ADMIN';
            req.isAdmin = true;
            return next();
        }

        // Get user type code
        const [rows] = await db.query(
            'SELECT code FROM user_types WHERE id = ?',
            [req.user.user_type_id]
        );

        const userType = rows[0]?.code;

        if (!userType || !roles.includes(userType)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        req.userType = userType;
        next();
    };
};

/**
 * Check if user is admin (admin user type or specific admin user)
 */
const requireAdmin = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user is admin by user_type or specific admin email
    const [rows] = await db.query(
        'SELECT code FROM user_types WHERE id = ?',
        [req.user.user_type_id]
    );

    const userType = rows[0]?.code;

    // Also check if this is the super admin user
    const isSuperAdmin = req.user.email === 'admin@campus.edu.in';

    if (userType !== 'ADMIN' && !isSuperAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }

    req.isAdmin = true;
    next();
};

/**
 * Check if user owns the resource or is admin
 * @param {string} paramName - Request parameter name containing user ID
 */
const requireOwnershipOrAdmin = (paramName = 'userId') => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const resourceUserId = parseInt(req.params[paramName], 10);
        const isOwn = req.user.id === resourceUserId;

        // Check if admin
        const [rows] = await db.query(
            'SELECT code FROM user_types WHERE id = ?',
            [req.user.user_type_id]
        );
        const isAdmin = rows[0]?.code === 'ADMIN' || req.user.email === 'admin@campus.edu.in';

        if (!isOwn && !isAdmin) {
            return res.status(403).json({ error: 'Access denied' });
        }

        next();
    };
};

/**
 * Check if user can access a booking (own booking or admin)
 */
const requireBookingAccess = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const bookingId = parseInt(req.params.id || req.params.bookingId, 10);

    if (!bookingId) {
        return res.status(400).json({ error: 'Booking ID required' });
    }

    const [rows] = await db.query(
        'SELECT user_id FROM bookings WHERE id = ? AND deleted_at IS NULL',
        [bookingId]
    );

    const booking = rows[0];

    if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if admin
    const [userRows] = await db.query(
        'SELECT code FROM user_types WHERE id = ?',
        [req.user.user_type_id]
    );
    const isAdmin = userRows[0]?.code === 'ADMIN' || req.user.email === 'admin@campus.edu.in';

    if (booking.user_id !== req.user.id && !isAdmin) {
        return res.status(403).json({ error: 'Access denied' });
    }

    req.booking = booking;
    next();
};

module.exports = {
    requireRole,
    requireAdmin,
    requireOwnershipOrAdmin,
    requireBookingAccess
};