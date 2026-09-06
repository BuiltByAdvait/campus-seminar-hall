"use strict";

const instituteService = require('./institute.service');
const asyncHandler = require('../../utils/asyncHandler');

const getAll = asyncHandler(async (req, res) => {
    const institutes = await instituteService.getAll();
    res.json({ success: true, data: { institutes } });
});

const getById = asyncHandler(async (req, res) => {
    const institute = await instituteService.getById(parseInt(req.params.id, 10));
    res.json({ success: true, data: { institute } });
});

const create = asyncHandler(async (req, res) => {
    const institute = await instituteService.create(req.body);
    res.status(201).json({ success: true, message: 'Institute created', data: { institute } });
});

const update = asyncHandler(async (req, res) => {
    const institute = await instituteService.update(parseInt(req.params.id, 10), req.body);
    res.json({ success: true, message: 'Institute updated', data: { institute } });
});

const remove = asyncHandler(async (req, res) => {
    await instituteService.delete(parseInt(req.params.id, 10));
    res.json({ success: true, message: 'Institute deleted' });
});

module.exports = { getAll, getById, create, update, remove };