"use strict";

// Environment configuration - validates required env vars
require('dotenv').config();

const requiredVars = [
    'DB_HOST',
    'DB_PORT',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET'
];

const missing = requiredVars.filter(v => !process.env[v]);
if (missing.length > 0) {
    console.error('Missing required environment variables:', missing.join(', '));
    console.error('Copy .env.example to .env and fill in values');
    // Don't exit in tests
    if (process.env.NODE_ENV !== 'test') {
        process.exit(1);
    }
}

module.exports = {
    // Database
    DB_HOST: process.env.DB_HOST,
    DB_PORT: parseInt(process.env.DB_PORT, 10) || 3306,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME,

    // JWT
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_ACCESS_EXPIRY: '15m',
    JWT_REFRESH_EXPIRY: '7d',

    // Server
    PORT: parseInt(process.env.PORT, 10) || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',

    // Frontend URL for CORS
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

    // Security
    BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
    SESSION_SECRET: process.env.SESSION_SECRET || 'fallback-secret-change-me',

    // Rate limiting
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,

    // Booking defaults
    DEFAULT_BOOKING_DURATION_MINUTES: parseInt(process.env.DEFAULT_BOOKING_DURATION_MINUTES, 10) || 120,
    MAX_BOOKING_DURATION_MINUTES: parseInt(process.env.MAX_BOOKING_DURATION_MINUTES, 10) || 240,
    MIN_ADVANCE_BOOKING_MINUTES: parseInt(process.env.MIN_ADVANCE_BOOKING_MINUTES, 10) || 60,
    CANCELLATION_WINDOW_MINUTES: parseInt(process.env.CANCELLATION_WINDOW_MINUTES, 10) || 30,

    // Timezone
    TIMEZONE: 'Asia/Kolkata'
};