"use strict";

const express = require('express');
const router = express.Router();
const { validate } = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/authorize');
const departmentController = require('./department.controller');
const { createDepartmentSchema, updateDepartmentSchema } = require('./department.validation');

router.get('/', authenticate, departmentController.getAll);
router.get('/:id', authenticate, departmentController.getById);
router.post('/', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), validate(createDepartmentSchema), departmentController.create);
router.patch('/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), validate(updateDepartmentSchema), departmentController.update);
router.delete('/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), departmentController.remove);

module.exports = router;