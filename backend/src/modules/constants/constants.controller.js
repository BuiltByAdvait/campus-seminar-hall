"use strict";

const { EVENT_TYPES, BOOKING_STATUSES, USER_TYPES } = require('../../constants/eventTypes');
const db = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * GET /api/constants
 * Get all system constants (event types, statuses, user types)
 */
const getAll = asyncHandler(async (req, res) => {
    // Get event types from DB (not hard-coded)
    const [eventTypes] = await db.query(
        'SELECT id, code, label, description, icon, color, sort_order FROM event_types WHERE is_active = TRUE ORDER BY sort_order'
    );

    // Get booking statuses
    const [statuses] = await db.query(
        'SELECT id, code, label, description, color, is_final, is_cancelable, sort_order FROM booking_statuses ORDER BY sort_order'
    );

    // Get user types
    const [userTypes] = await db.query(
        'SELECT id, code, label, description, sort_order FROM user_types WHERE is_active = TRUE ORDER BY sort_order'
    );

    // Get cancellation reasons
    const [reasons] = await db.query(
        'SELECT id, code, label, description FROM cancellation_reasons WHERE is_active = TRUE ORDER BY sort_order'
    );

    res.json({
        success: true,
        data: {
            eventTypes,
            statuses,
            userTypes,
            cancellationReasons: reasons
        }
    });
});

module.exports = { getAll };