"use strict";

const express = require('express');
const router = express.Router();
const { validate } = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/authorize');
const { createBookingSchema, updateBookingSchema, cancelBookingSchema, queryBookingsSchema, approveRejectSchema } = require('./booking.validation');
const bookingController = require('./booking.controller');

/**
 * Booking routes
 * GET    /api/bookings              - List bookings (own for users, all for admin)
 * GET    /api/bookings/upcoming     - Get user's upcoming bookings
 * GET    /api/bookings/today        - Get user's today bookings
 * GET    /api/bookings/:id          - Get booking by ID
 * POST   /api/bookings              - Create booking
 * PATCH  /api/bookings/:id          - Update booking
 * POST   /api/bookings/:id/cancel   - Cancel booking
 */

router.use(authenticate);

// Special routes first
router.get('/upcoming', bookingController.getUpcoming);
router.get('/today', bookingController.getToday);

// CRUD
router.get('/', validate(queryBookingsSchema, 'query'), bookingController.getAll);
router.get('/:id', bookingController.getById);
router.post('/', validate(createBookingSchema), bookingController.create);
router.patch('/:id', validate(updateBookingSchema), bookingController.update);
router.post('/:id/cancel', validate(cancelBookingSchema), bookingController.cancel);
router.post('/:id/approve', requireRole('ADMIN', 'SUPER_ADMIN'), bookingController.approve);
router.post('/:id/reject', requireRole('ADMIN', 'SUPER_ADMIN'), validate(approveRejectSchema), bookingController.reject);

module.exports = router;