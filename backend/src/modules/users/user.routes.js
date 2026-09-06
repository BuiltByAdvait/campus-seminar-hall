"use strict";

const express = require('express');
const router = express.Router();
const { validate } = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/authorize');
const userController = require('./user.controller');
const { updateProfileSchema } = require('./user.validation');

/**
 * GET /api/users
 * Get all users (admin only)
 */
router.get('/', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), userController.getAll);

/**
 * GET /api/users/:id
 * Get user by ID
 */
router.get('/:id', authenticate, userController.getById);

/**
 * PATCH /api/users/:id
 * Update user
 */
router.patch('/:id', authenticate, validate(updateProfileSchema), userController.update);

/**
 * GET /api/users/:id/stats
 * Get user statistics
 */
router.get('/:id/stats', authenticate, userController.getStats);

/**
 * DELETE /api/users/:id
 * Delete user (soft delete, admin only)
 */
router.delete('/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), userController.remove);

module.exports = router;