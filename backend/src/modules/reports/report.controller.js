"use strict";

const reportService = require('./report.service');
const asyncHandler = require('../../utils/asyncHandler');

const getUserReport = asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    const { fromDate, toDate } = req.query;
    const report = await reportService.getUserReport(userId, { fromDate, toDate });
    res.json({ success: true, data: { report } });
});

const getHallReport = asyncHandler(async (req, res) => {
    const hallId = parseInt(req.params.hallId, 10);
    const { fromDate, toDate } = req.query;
    const report = await reportService.getHallReport(hallId, { fromDate, toDate });
    res.json({ success: true, data: { report } });
});

const getWeeklyReport = asyncHandler(async (req, res) => {
    const { weekStart, weekEnd } = req.query;
    if (!weekStart || !weekEnd) {
        return res.status(400).json({ error: 'weekStart and weekEnd query parameters required (YYYY-MM-DD)' });
    }
    const report = await reportService.getWeeklyReport(weekStart, weekEnd);
    res.json({ success: true, data: { report } });
});

const getMonthlyReport = asyncHandler(async (req, res) => {
    const { yearMonth } = req.query;
    if (!yearMonth) {
        return res.status(400).json({ error: 'yearMonth query parameter required (YYYY-MM)' });
    }
    const report = await reportService.getMonthlyReport(yearMonth);
    res.json({ success: true, data: { report } });
});

const getCancellationReport = asyncHandler(async (req, res) => {
    const { fromDate, toDate } = req.query;
    const report = await reportService.getCancellationReport({ fromDate, toDate });
    res.json({ success: true, data: { report } });
});

const getOverstayReport = asyncHandler(async (req, res) => {
    const { fromDate, toDate } = req.query;
    const report = await reportService.getOverstayReport({ fromDate, toDate });
    res.json({ success: true, data: { report } });
});

module.exports = {
    getUserReport,
    getHallReport,
    getWeeklyReport,
    getMonthlyReport,
    getCancellationReport,
    getOverstayReport
};