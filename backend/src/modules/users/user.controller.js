"use strict";

const userService = require('./user.service');
const asyncHandler = require('../../utils/asyncHandler');
const logger = require('../../config/logger');

/**
 * GET /api/users
 * Get all users (admin only)
 */
const getAll = asyncHandler(async (req, res) => {
    const { page, limit, userType, instituteId, search } = req.query;
    const result = await userService.getAll({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        userType,
        instituteId: instituteId ? parseInt(instituteId) : undefined,
        search
    });

    res.json({
        success: true,
        data: result
    });
});

/**
 * GET /api/users/:id
 * Get user by ID
 */
const getById = asyncHandler(async (req, res) => {
    const user = await userService.getById(parseInt(req.params.id, 10));

    res.json({
        success: true,
        data: { user }
    });
});

/**
 * PATCH /api/users/:id
 * Update user profile or status
 */
const update = asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    const updates = req.body;

    // If admin, can update status
    if (updates.isActive !== undefined) {
        await userService.updateStatus(userId, updates.isActive);
        const user = await userService.getById(userId);
        return res.json({
            success: true,
            message: 'User status updated',
            data: { user }
        });
    }

    // Otherwise update profile
    const user = await userService.updateProfile(userId, updates);

    res.json({
        success: true,
        message: 'Profile updated',
        data: { user }
    });
});

/**
 * GET /api/users/:id/stats
 * Get user statistics
 */
const getStats = asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    const stats = await userService.getStats(userId);

    res.json({
        success: true,
        data: { stats }
    });
});

/**
 * DELETE /api/users/:id
 * Delete user (soft delete)
 */
const remove = asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    await userService.delete(userId);

    res.json({
        success: true,
        message: 'User deleted'
    });
});

module.exports = {
    getAll,
    getById,
    update,
    getStats,
    remove
};