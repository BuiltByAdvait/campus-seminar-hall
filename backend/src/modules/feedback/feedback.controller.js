"use strict";

const feedbackService = require('./feedback.service');
const asyncHandler = require('../../utils/asyncHandler');

const submit = asyncHandler(async (req, res) => {
    const bookingId = parseInt(req.params.bookingId, 10);
    const feedback = await feedbackService.submit(bookingId, req.user.id, req.body);
    res.status(201).json({ success: true, message: 'Feedback submitted', data: { feedback } });
});

const getByBooking = asyncHandler(async (req, res) => {
    const bookingId = parseInt(req.params.bookingId, 10);
    const feedback = await feedbackService.getByBooking(bookingId);
    res.json({ success: true, data: { feedback } });
});

const getAll = asyncHandler(async (req, res) => {
    const { hallId, fromDate, toDate, minRating, page, limit } = req.query;
    const result = await feedbackService.getAll({
        hallId: hallId ? parseInt(hallId) : null,
        fromDate,
        toDate,
        minRating: minRating ? parseInt(minRating) : null,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20
    });
    res.json({ success: true, data: result });
});

const getAverageRatings = asyncHandler(async (req, res) => {
    const { hallId } = req.query;
    const ratings = await feedbackService.getAverageRatings(hallId ? parseInt(hallId) : null);
    res.json({ success: true, data: { ratings } });
});

module.exports = { submit, getByBooking, getAll, getAverageRatings };