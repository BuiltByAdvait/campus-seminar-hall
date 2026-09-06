"use strict";

const authService = require('./auth.service');
const asyncHandler = require('../../utils/asyncHandler');
const logger = require('../../config/logger');

/**
 * POST /api/auth/register
 * Register a new user
 */
const register = asyncHandler(async (req, res) => {
    const user = await authService.register(req.body);

    logger.info(`User registered: ${user.email}`);

    res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: { user }
    });
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    logger.info(`User logged in: ${email}`);

    res.json({
        success: true,
        message: 'Login successful',
        data: result
    });
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
const refresh = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const result = await authService.refresh(refreshToken);

    res.json({
        success: true,
        message: 'Token refreshed',
        data: result
    });
});

/**
 * POST /api/auth/logout
 * Logout and revoke refresh token
 */
const logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    if (refreshToken) {
        await authService.logout(refreshToken);
    }

    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
const me = asyncHandler(async (req, res) => {
    const user = await authService.getProfile(req.user.id);

    res.json({
        success: true,
        data: { user }
    });
});

/**
 * PATCH /api/auth/profile
 * Update current user profile
 */
const updateProfile = asyncHandler(async (req, res) => {
    const user = await authService.updateProfile(req.user.id, req.body);

    res.json({
        success: true,
        message: 'Profile updated',
        data: { user }
    });
});

module.exports = {
    register,
    login,
    refresh,
    logout,
    me,
    updateProfile
};