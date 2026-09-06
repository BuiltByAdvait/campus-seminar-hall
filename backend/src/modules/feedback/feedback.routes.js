"use strict";

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/authorize');
const feedbackController = require('./feedback.controller');

/**
 * Feedback routes
 * POST   /api/feedback/:bookingId             - Submit feedback for a booking
 * GET    /api/feedback/:bookingId             - Get feedback for a booking
 * GET    /api/feedback                        - Get all feedback (admin)
 * GET    /api/feedback/average                - Get average ratings
 */

router.use(authenticate);

router.post('/:bookingId', feedbackController.submit);
router.get('/:bookingId', feedbackController.getByBooking);
router.get('/average', feedbackController.getAverageRatings);
router.get('/', requireRole('ADMIN', 'SUPER_ADMIN'), feedbackController.getAll);

module.exports = router;