"use strict";

const express = require('express');
const router = express.Router();
const { validate } = require('../../middleware/validate');
const { registerSchema, loginSchema, changePasswordSchema, refreshTokenSchema } = require('./auth.validation');
const { authenticate } = require('../../middleware/auth');
const authController = require('./auth.controller');

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);

/**
 POST /api/auth/logout
 * Logout and revoke refresh token
 */
router.post('/logout', authenticate, authController.logout);

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authenticate, authController.me);

/**
 * PATCH /api/auth/profile
 * Update current user profile
 */
router.patch('/profile', authenticate, authController.updateProfile);

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post('/change-password', authenticate, validate(changePasswordSchema), (req, res) => {
    // TODO: Implement change password logic
    res.status(501).json({ error: 'Not implemented' });
});

module.exports = router;