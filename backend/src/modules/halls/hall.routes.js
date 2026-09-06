"use strict";

const express = require('express');
const router = express.Router();
const { validate } = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/authorize');
const hallController = require('./hall.controller');
const { createHallSchema, updateHallSchema } = require('./hall.validation');

/**
 * Hall routes
 * GET    /api/halls               - List all halls
 * GET    /api/halls/:id           - Get hall by ID
 * GET    /api/halls/:id/availability?date=YYYY-MM-DD - Get hall availability for a date
 * POST   /api/halls               - Create hall (admin)
 * PATCH  /api/halls/:id           - Update hall (admin)
 * DELETE /api/halls/:id           - Delete hall (admin)
 */

router.get('/', authenticate, hallController.getAll);
router.get('/:id', authenticate, hallController.getById);
router.get('/:id/availability', authenticate, hallController.getAvailability);
router.post('/', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), validate(createHallSchema), hallController.create);
router.patch('/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), validate(updateHallSchema), hallController.update);
router.delete('/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), hallController.remove);

module.exports = router;