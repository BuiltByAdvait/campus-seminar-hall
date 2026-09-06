"use strict";

const bookingService = require('./booking.service');
const asyncHandler = require('../../utils/asyncHandler');
const db = require('../../config/db');

/**
 * GET /api/bookings
 * Get all bookings (filtered)
 */
const getAll = asyncHandler(async (req, res) => {
    const { status, hallId, userId, fromDate, toDate, page, limit } = req.query;

    // Check admin
    const [userRows] = await db.query(
        `SELECT u.email, ut.code AS user_type_code
         FROM users u JOIN user_types ut ON u.user_type_id = ut.id
         WHERE u.id = ?`,
        [req.user.id]
    );
    const isAdmin = userRows[0]?.user_type_code === 'ADMIN' ||
                    userRows[0]?.email === 'admin@campus.edu.in';

    const result = await bookingService.getAll(
        { status, hallId, userId, fromDate, toDate, page: parseInt(page) || 1, limit: parseInt(limit) || 20 },
        { isAdmin, currentUserId: req.user.id }
    );

    res.json({ success: true, data: result });
});

/**
 * GET /api/bookings/:id
 * Get booking by ID
 */
const getById = asyncHandler(async (req, res) => {
    const booking = await bookingService.getById(parseInt(req.params.id, 10));

    // Check access: owner or admin
    if (booking.user_id !== req.user.id) {
        const [userRows] = await db.query(
            `SELECT u.email, ut.code AS user_type_code
             FROM users u JOIN user_types ut ON u.user_type_id = ut.id
             WHERE u.id = ?`,
            [req.user.id]
        );
        const isAdmin = userRows[0]?.user_type_code === 'ADMIN' ||
                        userRows[0]?.email === 'admin@campus.edu.in';
        if (!isAdmin) {
            return res.status(403).json({ error: 'Access denied' });
        }
    }

    res.json({ success: true, data: { booking } });
});

/**
 * POST /api/bookings
 * Create a new booking
 */
const create = asyncHandler(async (req, res) => {
    const booking = await bookingService.create(req.user.id, req.body);
    res.status(201).json({ success: true, message: 'Booking created', data: { booking } });
});

/**
 * PATCH /api/bookings/:id
 * Update booking
 */
const update = asyncHandler(async (req, res) => {
    const bookingId = parseInt(req.params.id, 10);
    const booking = await bookingService.getById(bookingId);

    if (booking.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await bookingService.update(bookingId, req.body);
    res.json({ success: true, message: 'Booking updated', data: { booking: updated } });
});

/**
 * POST /api/bookings/:id/cancel
 * Cancel a booking
 */
const cancel = asyncHandler(async (req, res) => {
    const bookingId = parseInt(req.params.id, 10);
    const booking = await bookingService.cancel(bookingId, req.user.id, req.body);
    res.json({ success: true, message: 'Booking cancelled', data: { booking } });
});

/**
 * POST /api/bookings/:id/approve
 * Admin approve a pending booking
 */
const approve = asyncHandler(async (req, res) => {
    const bookingId = parseInt(req.params.id, 10);
    const booking = await bookingService.approve(bookingId, req.user.id);
    res.json({ success: true, message: 'Booking approved', data: { booking } });
});

/**
 * POST /api/bookings/:id/reject
 * Admin reject a pending booking
 */
const reject = asyncHandler(async (req, res) => {
    const bookingId = parseInt(req.params.id, 10);
    const booking = await bookingService.reject(bookingId, req.user.id, req.body.adminNotes);
    res.json({ success: true, message: 'Booking rejected', data: { booking } });
});

/**
 * GET /api/bookings/upcoming
 * Get current user's upcoming bookings
 */
const getUpcoming = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const bookings = await bookingService.getUpcoming(req.user.id, limit);
    res.json({ success: true, data: { bookings } });
});

/**
 * GET /api/bookings/today
 * Get current user's today's bookings
 */
const getToday = asyncHandler(async (req, res) => {
    const bookings = await bookingService.getToday(req.user.id);
    res.json({ success: true, data: { bookings } });
});

module.exports = { getAll, getById, create, update, cancel, approve, reject, getUpcoming, getToday };