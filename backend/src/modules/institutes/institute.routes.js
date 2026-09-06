"use strict";

const express = require('express');
const router = express.Router();
const { validate } = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/authorize');
const instituteController = require('./institute.controller');
const { createInstituteSchema, updateInstituteSchema } = require('./institute.validation');

/**
 * Institute routes
 * GET    /api/institutes                - List all institutes
 * GET    /api/institutes/:id            - Get institute by ID
 * POST   /api/institutes                - Create institute (admin)
 * PATCH  /api/institutes/:id            - Update institute (admin)
 * DELETE /api/institutes/:id            - Delete institute (admin)
 */

router.get('/', authenticate, instituteController.getAll);
router.get('/:id', authenticate, instituteController.getById);
router.post('/', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), validate(createInstituteSchema), instituteController.create);
router.patch('/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), validate(updateInstituteSchema), instituteController.update);
router.delete('/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), instituteController.remove);

module.exports = router;