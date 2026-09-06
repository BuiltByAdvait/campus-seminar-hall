"use strict";

const db = require('../../config/db');
const { NotFoundError } = require('../../utils/errors');

const reportService = {
    /**
     * Get user report
     * @param {number} userId - User ID
     * @param {Object} dateRange - Optional date range
     * @returns {Promise<Object>} User report
     */
    getUserReport: async (userId, dateRange = {}) => {
        const { fromDate, toDate } = dateRange;

        // Basic stats
        let statsSql = `SELECT
                COUNT(*) AS total_bookings,
                SUM(CASE WHEN bs.code = 'COMPLETED' THEN 1 ELSE 0 END) AS completed,
                SUM(CASE WHEN bs.code = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled,
                SUM(CASE WHEN bs.code = 'CONFIRMED' THEN 1 ELSE 0 END) AS confirmed,
                SUM(CASE WHEN bs.code = 'IN_PROGRESS' THEN 1 ELSE 0 END) AS in_progress,
                SUM(CASE WHEN bs.code = 'PENDING' THEN 1 ELSE 0 END) AS pending,
                COALESCE(SUM(b.actual_duration_minutes), 0) AS total_usage_minutes,
                COALESCE(SUM(b.overstay_minutes), 0) AS total_overstay_minutes,
                COALESCE(AVG(f.overall_rating), 0) AS avg_rating,
                COUNT(DISTINCT f.id) AS feedback_count
             FROM bookings b
             JOIN booking_statuses bs ON b.status_id = bs.id
             LEFT JOIN feedback f ON f.booking_id = b.id
             WHERE b.user_id = ? AND b.deleted_at IS NULL`;

        const statsParams = [userId];

        if (fromDate) {
            statsSql += ' AND b.start_time >= ?';
            statsParams.push(fromDate);
        }
        if (toDate) {
            statsSql += ' AND b.start_time <= ?';
            statsParams.push(toDate);
        }

        const [statsRows] = await db.query(statsSql, statsParams);

        // Booking history
        let historySql = `SELECT
                b.id, b.event_name, b.start_time, b.end_time, b.duration_minutes,
                b.actual_duration_minutes, b.overstay_minutes, b.check_in_time, b.check_out_time,
                bs.code AS status_code, bs.label AS status_label, bs.color AS status_color,
                h.name AS hall_name, h.id AS hall_id,
                et.label AS event_type_label,
                f.overall_rating AS rating
             FROM bookings b
             JOIN booking_statuses bs ON b.status_id = bs.id
             JOIN halls h ON b.hall_id = h.id
             JOIN event_types et ON b.event_type_id = et.id
             LEFT JOIN feedback f ON f.booking_id = b.id
             WHERE b.user_id = ? AND b.deleted_at IS NULL`;

        const historyParams = [userId];

        if (fromDate) {
            historySql += ' AND b.start_time >= ?';
            historyParams.push(fromDate);
        }
        if (toDate) {
            historySql += ' AND b.start_time <= ?';
            historyParams.push(toDate);
        }

        historySql += ' ORDER BY b.start_time DESC LIMIT 50';

        const [historyRows] = await db.query(historySql, historyParams);

        return {
            stats: statsRows[0],
            bookings: historyRows
        };
    },

    /**
     * Get hall report
     * @param {number} hallId - Hall ID
     * @param {Object} dateRange - Optional date range
     * @returns {Promise<Object>} Hall report
     */
    getHallReport: async (hallId, dateRange = {}) => {
        const { fromDate, toDate } = dateRange;

        // Basic stats
        let statsSql = `SELECT
                COUNT(b.id) AS total_bookings,
                SUM(CASE WHEN bs.code = 'COMPLETED' THEN 1 ELSE 0 END) AS completed,
                SUM(CASE WHEN bs.code = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled,
                SUM(b.duration_minutes) AS total_scheduled_minutes,
                COALESCE(SUM(b.actual_duration_minutes), 0) AS total_usage_minutes,
                COALESCE(SUM(b.overstay_minutes), 0) AS total_overstay_minutes,
                COALESCE(AVG(f.overall_rating), 0) AS avg_rating
             FROM bookings b
             JOIN booking_statuses bs ON b.status_id = bs.id
             LEFT JOIN feedback f ON f.booking_id = b.id
             WHERE b.hall_id = ? AND b.deleted_at IS NULL`;

        const statsParams = [hallId];

        if (fromDate) {
            statsSql += ' AND b.start_time >= ?';
            statsParams.push(fromDate);
        }
        if (toDate) {
            statsSql += ' AND b.start_time <= ?';
            statsParams.push(toDate);
        }

        const [statsRows] = await db.query(statsSql, statsParams);

        // Daily breakdown
        let dailySql = `SELECT
                DATE(b.start_time) AS booking_date,
                COUNT(b.id) AS bookings_count,
                SUM(b.duration_minutes) AS total_minutes
             FROM bookings b
             WHERE b.hall_id = ? AND b.deleted_at IS NULL`;

        const dailyParams = [hallId];

        if (fromDate) {
            dailySql += ' AND b.start_time >= ?';
            dailyParams.push(fromDate);
        }
        if (toDate) {
            dailySql += ' AND b.start_time <= ?';
            dailyParams.push(toDate);
        }

        dailySql += ' GROUP BY DATE(b.start_time) ORDER BY booking_date DESC LIMIT 30';

        const [dailyRows] = await db.query(dailySql, dailyParams);

        // Top users
        let topUsersSql = `SELECT
                u.id, u.full_name, COUNT(b.id) AS bookings_count,
                SUM(b.duration_minutes) AS total_minutes
             FROM bookings b
             JOIN users u ON b.user_id = u.id
             WHERE b.hall_id = ? AND b.deleted_at IS NULL`;

        const topParams = [hallId];

        if (fromDate) {
            topUsersSql += ' AND b.start_time >= ?';
            topParams.push(fromDate);
        }
        if (toDate) {
            topUsersSql += ' AND b.start_time <= ?';
            topParams.push(toDate);
        }

        topUsersSql += ' GROUP BY u.id, u.full_name ORDER BY bookings_count DESC LIMIT 10';

        const [topUsersRows] = await db.query(topUsersSql, topParams);

        return {
            stats: statsRows[0],
            dailyBreakdown: dailyRows,
            topUsers: topUsersRows
        };
    },

    /**
     * Get weekly report
     * @param {string} weekStart - Week start date (YYYY-MM-DD)
     * @param {string} weekEnd - Week end date (YYYY-MM-DD)
     * @returns {Promise<Object>} Weekly report
     */
    getWeeklyReport: async (weekStart, weekEnd) => {
        // Summary
        const [summaryRows] = await db.query(
            `SELECT
                COUNT(*) AS total_bookings,
                SUM(CASE WHEN bs.code = 'COMPLETED' THEN 1 ELSE 0 END) AS completed,
                SUM(CASE WHEN bs.code = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled,
                SUM(CASE WHEN bs.code = 'IN_PROGRESS' THEN 1 ELSE 0 END) AS in_progress,
                SUM(b.duration_minutes) AS total_scheduled_minutes,
                COALESCE(SUM(b.actual_duration_minutes), 0) AS total_actual_minutes,
                COALESCE(SUM(b.overstay_minutes), 0) AS total_overstay_minutes,
                COALESCE(AVG(f.overall_rating), 0) AS avg_rating
             FROM bookings b
             JOIN booking_statuses bs ON b.status_id = bs.id
             LEFT JOIN feedback f ON f.booking_id = b.id
             WHERE DATE(b.start_time) BETWEEN ? AND ? AND b.deleted_at IS NULL`,
            [weekStart, weekEnd]
        );

        // Day-wise breakdown
        const [dayRows] = await db.query(
            `SELECT
                DAYNAME(b.start_time) AS day_name,
                COUNT(*) AS bookings_count,
                SUM(b.duration_minutes) AS total_minutes
             FROM bookings b
             WHERE DATE(b.start_time) BETWEEN ? AND ? AND b.deleted_at IS NULL
             GROUP BY DAYNAME(b.start_time), DAYOFWEEK(b.start_time)
             ORDER BY DAYOFWEEK(b.start_time)`,
            [weekStart, weekEnd]
        );

        // Hall-wise breakdown
        const [hallRows] = await db.query(
            `SELECT
                h.id, h.name AS hall_name,
                COUNT(b.id) AS bookings_count,
                SUM(b.duration_minutes) AS total_minutes
             FROM bookings b
             JOIN halls h ON b.hall_id = h.id
             WHERE DATE(b.start_time) BETWEEN ? AND ? AND b.deleted_at IS NULL
             GROUP BY h.id, h.name
             ORDER BY bookings_count DESC`,
            [weekStart, weekEnd]
        );

        // Peak time slots
        const [peakRows] = await db.query(
            `SELECT
                HOUR(b.start_time) AS start_hour,
                COUNT(*) AS bookings_count
             FROM bookings b
             WHERE DATE(b.start_time) BETWEEN ? AND ? AND b.deleted_at IS NULL
             GROUP BY HOUR(b.start_time)
             ORDER BY bookings_count DESC
             LIMIT 5`,
            [weekStart, weekEnd]
        );

        return {
            period: { start: weekStart, end: weekEnd },
            summary: summaryRows[0],
            dayBreakdown: dayRows,
            hallBreakdown: hallRows,
            peakTimeSlots: peakRows
        };
    },

    /**
     * Get monthly report
     * @param {string} yearMonth - Year-month (YYYY-MM)
     * @returns {Promise<Object>} Monthly report
     */
    getMonthlyReport: async (yearMonth) => {
        const [year, month] = yearMonth.split('-');
        const startDate = `${year}-${month}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month

        // Summary
        const [summaryRows] = await db.query(
            `SELECT
                COUNT(*) AS total_bookings,
                SUM(CASE WHEN bs.code = 'COMPLETED' THEN 1 ELSE 0 END) AS completed,
                SUM(CASE WHEN bs.code = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled,
                SUM(b.duration_minutes) AS total_scheduled_minutes,
                COALESCE(SUM(b.actual_duration_minutes), 0) AS total_usage_minutes,
                COALESCE(SUM(b.overstay_minutes), 0) AS total_overstay_minutes,
                COALESCE(AVG(f.overall_rating), 0) AS avg_rating,
                COUNT(DISTINCT b.user_id) AS unique_users
             FROM bookings b
             JOIN booking_statuses bs ON b.status_id = bs.id
             LEFT JOIN feedback f ON f.booking_id = b.id
             WHERE DATE(b.start_time) BETWEEN ? AND ? AND b.deleted_at IS NULL`,
            [startDate, endDate]
        );

        // Week-wise breakdown
        const [weekRows] = await db.query(
            `SELECT
                WEEK(b.start_time, 1) AS week_num,
                MIN(DATE(b.start_time)) AS week_start,
                COUNT(*) AS bookings_count,
                SUM(b.duration_minutes) AS total_minutes
             FROM bookings b
             WHERE DATE(b.start_time) BETWEEN ? AND ? AND b.deleted_at IS NULL
             GROUP BY WEEK(b.start_time, 1)
             ORDER BY week_num`,
            [startDate, endDate]
        );

        // Daily breakdown
        const [dailyRows] = await db.query(
            `SELECT
                DATE(b.start_time) AS booking_date,
                DAYNAME(b.start_time) AS day_name,
                COUNT(*) AS bookings_count,
                SUM(b.duration_minutes) AS total_minutes
             FROM bookings b
             WHERE DATE(b.start_time) BETWEEN ? AND ? AND b.deleted_at IS NULL
             GROUP BY DATE(b.start_time), DAYNAME(b.start_time)
             ORDER BY booking_date`,
            [startDate, endDate]
        );

        // Hall utilization
        const [hallRows] = await db.query(
            `SELECT
                h.id, h.name AS hall_name,
                COUNT(b.id) AS bookings_count,
                SUM(b.duration_minutes) AS total_minutes,
                COALESCE(AVG(f.overall_rating), 0) AS avg_rating
             FROM halls h
             LEFT JOIN bookings b ON b.hall_id = h.id AND DATE(b.start_time) BETWEEN ? AND ? AND b.deleted_at IS NULL
             LEFT JOIN feedback f ON f.booking_id = b.id
             WHERE h.deleted_at IS NULL
             GROUP BY h.id, h.name
             ORDER BY bookings_count DESC`,
            [startDate, endDate]
        );

        // Institute breakdown
        const [instituteRows] = await db.query(
            `SELECT
                i.id, i.name AS institute_name,
                COUNT(b.id) AS bookings_count,
                SUM(b.duration_minutes) AS total_minutes
             FROM bookings b
             JOIN users u ON b.user_id = u.id
             JOIN institutes i ON u.institute_id = i.id
             WHERE DATE(b.start_time) BETWEEN ? AND ? AND b.deleted_at IS NULL
             GROUP BY i.id, i.name
             ORDER BY bookings_count DESC`,
            [startDate, endDate]
        );

        return {
            period: { yearMonth, startDate, endDate },
            summary: summaryRows[0],
            weeklyBreakdown: weekRows,
            dailyBreakdown: dailyRows,
            hallUtilization: hallRows,
            instituteBreakdown: instituteRows
        };
    },

    /**
     * Get cancellation report
     * @param {Object} dateRange - Optional date range
     * @returns {Promise<Object>} Cancellation report
     */
    getCancellationReport: async (dateRange = {}) => {
        const { fromDate, toDate } = dateRange;

        let sql = `SELECT
                COUNT(*) AS total_cancellations,
                SUM(CASE WHEN cr.label IS NOT NULL THEN 1 ELSE 0 END) AS with_reason,
                SUM(CASE WHEN cr.label IS NULL THEN 1 ELSE 0 END) AS without_reason
             FROM cancellations c
             JOIN bookings b ON c.booking_id = b.id
             LEFT JOIN cancellation_reasons cr ON c.reason_id = cr.id
             WHERE 1=1`;

        const params = [];

        if (fromDate) {
            sql += ' AND DATE(c.cancelled_at) >= ?';
            params.push(fromDate);
        }
        if (toDate) {
            sql += ' AND DATE(c.cancelled_at) <= ?';
            params.push(toDate);
        }

        const [summaryRows] = await db.query(sql, params);

        // Reason breakdown
        let reasonSql = `SELECT
                cr.label AS reason,
                COUNT(*) AS count
             FROM cancellations c
             JOIN bookings b ON c.booking_id = b.id
             JOIN cancellation_reasons cr ON c.reason_id = cr.id
             WHERE 1=1`;

        const reasonParams = [];

        if (fromDate) {
            reasonSql += ' AND DATE(c.cancelled_at) >= ?';
            reasonParams.push(fromDate);
        }
        if (toDate) {
            reasonSql += ' AND DATE(c.cancelled_at) <= ?';
            reasonParams.push(toDate);
        }

        reasonSql += ' GROUP BY cr.label ORDER BY count DESC';

        const [reasonRows] = await db.query(reasonSql, reasonParams);

        return {
            summary: summaryRows[0],
            reasonBreakdown: reasonRows
        };
    },

    /**
     * Get overstay report
     * @param {Object} dateRange - Optional date range
     * @returns {Promise<Object>} Overstay report
     */
    getOverstayReport: async (dateRange = {}) => {
        const { fromDate, toDate } = dateRange;

        let sql = `SELECT
                COUNT(*) AS total_overstays,
                SUM(b.overstay_minutes) AS total_overstay_minutes,
                AVG(b.overstay_minutes) AS avg_overstay_minutes,
                MAX(b.overstay_minutes) AS max_overstay_minutes
             FROM bookings b
             WHERE b.overstay_minutes > 0 AND b.deleted_at IS NULL`;

        const params = [];

        if (fromDate) {
            sql += ' AND DATE(b.start_time) >= ?';
            params.push(fromDate);
        }
        if (toDate) {
            sql += ' AND DATE(b.start_time) <= ?';
            params.push(toDate);
        }

        const [summaryRows] = await db.query(sql, params);

        // Top overstays
        let topSql = `SELECT
                b.id, b.event_name, b.start_time, b.end_time, b.check_out_time,
                b.overstay_minutes,
                h.name AS hall_name, u.full_name AS user_name
             FROM bookings b
             JOIN halls h ON b.hall_id = h.id
             JOIN users u ON b.user_id = u.id
             WHERE b.overstay_minutes > 0 AND b.deleted_at IS NULL`;

        const topParams = [];

        if (fromDate) {
            topSql += ' AND DATE(b.start_time) >= ?';
            topParams.push(fromDate);
        }
        if (toDate) {
            topSql += ' AND DATE(b.start_time) <= ?';
            topParams.push(toDate);
        }

        topSql += ' ORDER BY b.overstay_minutes DESC LIMIT 20';

        const [topRows] = await db.query(topSql, topParams);

        return {
            summary: summaryRows[0],
            topOverstays: topRows
        };
    }
};

module.exports = reportService;