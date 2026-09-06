"use strict";

const db = require('../../config/db');

const dashboardService = {
    /**
     * Get user dashboard stats
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Dashboard stats
     */
    getUserStats: async (userId) => {
        const [statsRows] = await db.query(
            `SELECT
                COUNT(*) AS total_bookings,
                SUM(CASE WHEN bs.code = 'COMPLETED' THEN 1 ELSE 0 END) AS completed,
                SUM(CASE WHEN bs.code = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled,
                SUM(CASE WHEN bs.code IN ('CONFIRMED', 'PENDING') AND b.start_time > NOW() THEN 1 ELSE 0 END) AS upcoming,
                SUM(CASE WHEN bs.code = 'IN_PROGRESS' THEN 1 ELSE 0 END) AS in_progress,
                COALESCE(SUM(b.actual_duration_minutes), 0) AS total_usage_minutes,
                COALESCE(AVG(f.overall_rating), 0) AS avg_rating
             FROM bookings b
             JOIN booking_statuses bs ON b.status_id = bs.id
             LEFT JOIN feedback f ON f.booking_id = b.id
             WHERE b.user_id = ? AND b.deleted_at IS NULL`,
            [userId]
        );

        // Today's bookings
        const [todayRows] = await db.query(
            `SELECT
                b.id, b.event_name, b.start_time, b.end_time, b.duration_minutes,
                bs.code AS status_code, bs.label AS status_label, bs.color AS status_color,
                h.name AS hall_name, h.location AS hall_location,
                et.label AS event_type_label
             FROM bookings b
             JOIN booking_statuses bs ON b.status_id = bs.id
             JOIN halls h ON b.hall_id = h.id
             JOIN event_types et ON b.event_type_id = et.id
             WHERE b.user_id = ?
               AND DATE(b.start_time) = CURDATE()
               AND b.deleted_at IS NULL
             ORDER BY b.start_time`,
            [userId]
        );

        // Upcoming bookings
        const [upcomingRows] = await db.query(
            `SELECT
                b.id, b.event_name, b.start_time, b.end_time, b.duration_minutes,
                bs.code AS status_code, bs.label AS status_label, bs.color AS status_color,
                h.name AS hall_name, h.location AS hall_location,
                et.label AS event_type_label
             FROM bookings b
             JOIN booking_statuses bs ON b.status_id = bs.id
             JOIN halls h ON b.hall_id = h.id
             JOIN event_types et ON b.event_type_id = et.id
             WHERE b.user_id = ?
               AND b.start_time > NOW()
               AND bs.code NOT IN ('CANCELLED', 'REJECTED')
               AND b.deleted_at IS NULL
             ORDER BY b.start_time
             LIMIT 5`,
            [userId]
        );

        return {
            stats: statsRows[0],
            todayBookings: todayRows,
            upcomingBookings: upcomingRows
        };
    },

    /**
     * Get admin dashboard stats
     * @returns {Promise<Object>} Admin dashboard stats
     */
    getAdminStats: async () => {
        // Overall stats
        const [overallRows] = await db.query(
            `SELECT
                COUNT(*) AS total_bookings,
                SUM(CASE WHEN bs.code = 'COMPLETED' THEN 1 ELSE 0 END) AS completed,
                SUM(CASE WHEN bs.code = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled,
                SUM(CASE WHEN bs.code = 'IN_PROGRESS' THEN 1 ELSE 0 END) AS in_progress,
                SUM(CASE WHEN bs.code IN ('CONFIRMED', 'PENDING') AND b.start_time > NOW() THEN 1 ELSE 0 END) AS upcoming,
                COALESCE(SUM(b.actual_duration_minutes), 0) AS total_usage_minutes,
                COALESCE(SUM(b.overstay_minutes), 0) AS total_overstay_minutes,
                COALESCE(AVG(f.overall_rating), 0) AS avg_rating,
                COUNT(DISTINCT b.user_id) AS unique_users
             FROM bookings b
             JOIN booking_statuses bs ON b.status_id = bs.id
             LEFT JOIN feedback f ON f.booking_id = b.id
             WHERE b.deleted_at IS NULL`
        );

        // Today's bookings
        const [todayRows] = await db.query(
            `SELECT
                b.id, b.event_name, b.start_time, b.end_time,
                bs.code AS status_code, bs.label AS status_label, bs.color AS status_color,
                h.name AS hall_name, u.full_name AS user_name, u.email AS user_email,
                et.label AS event_type_label
             FROM bookings b
             JOIN booking_statuses bs ON b.status_id = bs.id
             JOIN halls h ON b.hall_id = h.id
             JOIN users u ON b.user_id = u.id
             JOIN event_types et ON b.event_type_id = et.id
             WHERE DATE(b.start_time) = CURDATE()
               AND b.deleted_at IS NULL
             ORDER BY b.start_time`
        );

        // Hall utilization (last 30 days)
        const [hallRows] = await db.query(
            `SELECT
                h.id, h.name AS hall_name, h.capacity,
                COUNT(b.id) AS bookings_count,
                SUM(CASE WHEN bs.code = 'COMPLETED' THEN 1 ELSE 0 END) AS completed,
                COALESCE(SUM(b.actual_duration_minutes), 0) AS total_usage_minutes,
                COALESCE(AVG(f.overall_rating), 0) AS avg_rating
             FROM halls h
             LEFT JOIN bookings b ON b.hall_id = h.id
                 AND DATE(b.start_time) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                 AND b.deleted_at IS NULL
             LEFT JOIN booking_statuses bs ON b.status_id = bs.id
             LEFT JOIN feedback f ON f.booking_id = b.id
             WHERE h.deleted_at IS NULL AND h.is_active = TRUE
             GROUP BY h.id, h.name, h.capacity
             ORDER BY bookings_count DESC`
        );

        // Recent activity (last 7 days)
        const [activityRows] = await db.query(
            `SELECT
                b.id, b.event_name, b.start_time, b.end_time,
                bs.code AS status_code, bs.label AS status_label, bs.color AS status_color,
                h.name AS hall_name, u.full_name AS user_name,
                et.label AS event_type_label
             FROM bookings b
             JOIN booking_statuses bs ON b.status_id = bs.id
             JOIN halls h ON b.hall_id = h.id
             JOIN users u ON b.user_id = u.id
             JOIN event_types et ON b.event_type_id = et.id
             WHERE b.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
               AND b.deleted_at IS NULL
             ORDER BY b.created_at DESC
             LIMIT 10`
        );

        // Booking trend (last 7 days)
        const [trendRows] = await db.query(
            `SELECT
                DATE(b.created_at) AS date,
                COUNT(*) AS bookings_count
             FROM bookings b
             WHERE b.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
               AND b.deleted_at IS NULL
             GROUP BY DATE(b.created_at)
             ORDER BY date`
        );

        // Institute breakdown
        const [instituteRows] = await db.query(
            `SELECT
                i.id, i.name AS institute_name,
                COUNT(b.id) AS bookings_count,
                COUNT(DISTINCT b.user_id) AS unique_users
             FROM bookings b
             JOIN users u ON b.user_id = u.id
             LEFT JOIN institutes i ON u.institute_id = i.id
             WHERE b.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
               AND b.deleted_at IS NULL
             GROUP BY i.id, i.name
             ORDER BY bookings_count DESC`
        );

        // Peak hours today
        const [peakRows] = await db.query(
            `SELECT
                HOUR(b.start_time) AS hour,
                COUNT(*) AS bookings_count
             FROM bookings b
             WHERE DATE(b.start_time) = CURDATE()
               AND b.deleted_at IS NULL
             GROUP BY HOUR(b.start_time)
             ORDER BY hour`
        );

        // Pending approvals
        const [pendingRows] = await db.query(
            `SELECT COUNT(*) AS pending_count
             FROM bookings b
             JOIN booking_statuses bs ON b.status_id = bs.id
             WHERE bs.code IN ('PENDING')
               AND b.start_time > NOW()
               AND b.deleted_at IS NULL`
        );

        return {
            overall: overallRows[0],
            todayBookings: todayRows,
            hallUtilization: hallRows,
            recentActivity: activityRows,
            bookingTrend: trendRows,
            instituteBreakdown: instituteRows,
            peakHoursToday: peakRows,
            pendingApprovals: pendingRows[0]?.pending_count || 0
        };
    }
};

module.exports = dashboardService;