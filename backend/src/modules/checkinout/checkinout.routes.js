"use strict";

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/authorize');
const checkInOutController = require('./checkinout.controller');

/**
 * Check-in / Check-out routes
 * POST   /api/check-in-out/:bookingId/check-in   - Check in
 * POST   /api/check-in-out/:bookingId/check-out  - Check out
 * GET    /api/check-in-out/:bookingId             - Get check-in/out record for booking
 * GET    /api/check-in-out                        - Get all records (admin)
 */

router.use(authenticate);

router.post('/:bookingId/check-in', checkInOutController.checkIn);
router.post('/:bookingId/check-out', checkInOutController.checkOut);
router.get('/:bookingId', checkInOutController.getByBooking);
router.get('/', requireRole('ADMIN', 'SUPER_ADMIN'), checkInOutController.getAll);

module.exports = router;