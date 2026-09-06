"use strict";

const { TIMEZONE } = require('../config/env');

/**
 * Convert UTC date to IST
 * @param {Date|string} date - Date to convert
 * @returns {Date} Date in IST
 */
const toIST = (date) => {
    const d = date instanceof Date ? new Date(date) : new Date(date);
    // IST is UTC+5:30
    const istOffset = 5.5 * 60 * 60 * 1000;
    return new Date(d.getTime() + istOffset);
};

/**
 * Convert IST date to UTC
 * @param {Date|string} date - Date to convert
 * @returns {Date} Date in UTC
 */
const toUTC = (date) => {
    const d = date instanceof Date ? new Date(date) : new Date(date);
    const istOffset = 5.5 * 60 * 60 * 1000;
    return new Date(d.getTime() - istOffset);
};

/**
 * Format date for MySQL (ISO format with timezone)
 * @param {Date|string} date - Date to format
 * @returns {string} MySQL-compatible date string
 */
const forMySQL = (date) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString().slice(0, 19).replace('T', ' ');
};

/**
 * Parse date string to Date object
 * @param {string} dateStr - Date string (various formats)
 * @returns {Date} Date object
 */
const parseDate = (dateStr) => {
    return new Date(dateStr);
};

/**
 * Check if a date is in the past (in IST)
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if past
 */
const isPast = (date) => {
    const d = date instanceof Date ? date : new Date(date);
    return d < new Date();
};

/**
 * Check if a date is in the future (in IST)
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if future
 */
const isFuture = (date) => {
    const d = date instanceof Date ? date : new Date(date);
    return d > new Date();
};

/**
 * Get start of day (IST)
 * @param {Date|string} date - Date
 * @returns {Date} Start of day
 */
const startOfDay = (date) => {
    const d = date instanceof Date ? date : new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

/**
 * Get end of day (IST)
 * @param {Date|string} date - Date
 * @returns {Date} End of day
 */
const endOfDay = (date) => {
    const d = date instanceof Date ? date : new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
};

/**
 * Format date for display (DD MMM YYYY)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date
 */
const formatDisplay = (date) => {
    const d = date instanceof Date ? date : new Date(date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

/**
 * Format time for display (HH:MM)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted time
 */
const formatTime = (date) => {
    const d = date instanceof Date ? date : new Date(date);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

/**
 * Calculate duration in minutes between two dates
 * @param {Date|string} start - Start date
 * @param {Date|string} end - End date
 * @returns {number} Duration in minutes
 */
const durationMinutes = (start, end) => {
    const s = start instanceof Date ? start : new Date(start);
    const e = end instanceof Date ? end : new Date(end);
    return Math.round((e - s) / (1000 * 60));
};

/**
 * Check if two time ranges overlap
 * Uses strict inequality: ranges can be adjacent but not overlap
 * @param {Date} startA - Range A start
 * @param {Date} endA - Range A end
 * @param {Date} startB - Range B start
 * @param {Date} endB - Range B end
 * @returns {boolean} True if they overlap
 */
const timeRangesOverlap = (startA, endA, startB, endB) => {
    const aStart = startA instanceof Date ? startA : new Date(startA);
    const aEnd = endA instanceof Date ? endA : new Date(endA);
    const bStart = startB instanceof Date ? startB : new Date(startB);
    const bEnd = endB instanceof Date ? endB : new Date(endB);

    // Overlap if: startA < endB AND endA > startB
    return aStart < bEnd && aEnd > bStart;
};

/**
 * Get relative time description (e.g., "in 2 hours", "3 days ago")
 * @param {Date|string} date - Date to describe
 * @returns {string} Relative description
 */
const relativeTime = (date) => {
    const d = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffMs = d - now;
    const diffMins = Math.round(diffMs / (1000 * 60));
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins === 0) return 'just now';
    if (diffMins > 0) {
        if (diffMins < 60) return `in ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
        if (diffHours < 24) return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
        return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else {
        const absMins = Math.abs(diffMins);
        if (absMins < 60) return `${absMins} minute${absMins > 1 ? 's' : ''} ago`;
        if (Math.abs(diffHours) < 24) return `${Math.abs(diffHours)} hour${Math.abs(diffHours) > 1 ? 's' : ''} ago`;
        return `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''} ago`;
    }
};

module.exports = {
    toIST,
    toUTC,
    forMySQL,
    parseDate,
    isPast,
    isFuture,
    startOfDay,
    endOfDay,
    formatDisplay,
    formatTime,
    durationMinutes,
    timeRangesOverlap,
    relativeTime
};