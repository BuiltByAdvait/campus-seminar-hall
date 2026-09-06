"use strict";

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const reportController = require('./report.controller');

/**
 * Report routes
 * GET /api/reports/user/:userId          - Get user report
 * GET /api/reports/hall/:hallId          - Get hall report
 * GET /api/reports/weekly?weekStart=...&weekEnd=...  - Get weekly report
 * GET /api/reports/monthly?yearMonth=YYYY-MM          - Get monthly report
 * GET /api/reports/cancellations                       - Get cancellation report
 * GET /api/reports/overstay                            - Get overstay report
 */

router.use(authenticate);

router.get('/user/:userId', reportController.getUserReport);
router.get('/hall/:hallId', reportController.getHallReport);
router.get('/weekly', reportController.getWeeklyReport);
router.get('/monthly', reportController.getMonthlyReport);
router.get('/cancellations', reportController.getCancellationReport);
router.get('/overstay', reportController.getOverstayReport);

module.exports = router;