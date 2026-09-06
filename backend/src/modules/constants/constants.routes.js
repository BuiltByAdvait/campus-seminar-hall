"use strict";

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const constantsController = require('./constants.controller');

// Constants is public — no auth required (it's just reference data)
router.get('/', constantsController.getAll);

module.exports = router;