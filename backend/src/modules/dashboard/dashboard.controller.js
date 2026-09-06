"use strict";

const dashboardService = require('./dashboard.service');
const asyncHandler = require('../../utils/asyncHandler');
const db = require('../../config/db');

const getUserDashboard = asyncHandler(async (req, res) => {
    const data = await dashboardService.getUserStats(req.user.id);
    res.json({ success: true, data });
});

const getAdminDashboard = asyncHandler(async (req, res) => {
    const data = await dashboardService.getAdminStats();
    res.json({ success: true, data });
});

const getDashboard = asyncHandler(async (req, res) => {
    // Check if admin
    const [userRows] = await db.query(
        `SELECT u.email, ut.code AS user_type_code
         FROM users u JOIN user_types ut ON u.user_type_id = ut.id
         WHERE u.id = ?`,
        [req.user.id]
    );

    const isAdmin = userRows[0]?.user_type_code === 'ADMIN' ||
                    userRows[0]?.email === 'admin@campus.edu.in';

    if (isAdmin) {
        const data = await dashboardService.getAdminStats();
        return res.json({ success: true, data, userType: 'admin' });
    } else {
        const data = await dashboardService.getUserStats(req.user.id);
        return res.json({ success: true, data, userType: 'user' });
    }
});

module.exports = { getUserDashboard, getAdminDashboard, getDashboard };