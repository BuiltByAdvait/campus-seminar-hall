"use strict";

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/authorize');
const dashboardController = require('./dashboard.controller');

/**
 * Dashboard routes
 * GET /api/dashboard              - Get dashboard (auto-detects user type)
 * GET /api/dashboard/user         - Get user dashboard
 * GET /api/dashboard/admin        - Get admin dashboard
 */

router.use(authenticate);

router.get('/', dashboardController.getDashboard);
router.get('/user', dashboardController.getUserDashboard);
router.get('/admin', requireRole('ADMIN', 'SUPER_ADMIN'), dashboardController.getAdminDashboard);

module.exports = router;