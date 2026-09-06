"use strict";

const checkInOutService = require('./checkinout.service');
const asyncHandler = require('../../utils/asyncHandler');

const checkIn = asyncHandler(async (req, res) => {
    const bookingId = parseInt(req.params.bookingId, 10);
    const { method = 'MANUAL', notes = null } = req.body;

    const result = await checkInOutService.checkIn(bookingId, req.user.id, method, notes);

    res.json({ success: true, message: result.message, data: result });
});

const checkOut = asyncHandler(async (req, res) => {
    const bookingId = parseInt(req.params.bookingId, 10);
    const { method = 'MANUAL', notes = null } = req.body;

    const result = await checkInOutService.checkOut(bookingId, req.user.id, method, notes);

    res.json({ success: true, message: result.message, data: result });
});

const getByBooking = asyncHandler(async (req, res) => {
    const bookingId = parseInt(req.params.bookingId, 10);
    const record = await checkInOutService.getByBooking(bookingId);
    res.json({ success: true, data: { record } });
});

const getAll = asyncHandler(async (req, res) => {
    const { hallId, fromDate, toDate, page, limit } = req.query;
    const records = await checkInOutService.getAll({
        hallId: hallId ? parseInt(hallId) : null,
        fromDate,
        toDate,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50
    });
    res.json({ success: true, data: { records } });
});

module.exports = { checkIn, checkOut, getByBooking, getAll };