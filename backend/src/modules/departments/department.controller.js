"use strict";

const departmentService = require('./department.service');
const asyncHandler = require('../../utils/asyncHandler');

const getAll = asyncHandler(async (req, res) => {
    const { instituteId } = req.query;
    const departments = await departmentService.getAll(instituteId ? parseInt(instituteId) : null);
    res.json({ success: true, data: { departments } });
});

const getById = asyncHandler(async (req, res) => {
    const department = await departmentService.getById(parseInt(req.params.id, 10));
    res.json({ success: true, data: { department } });
});

const create = asyncHandler(async (req, res) => {
    const department = await departmentService.create(req.body);
    res.status(201).json({ success: true, message: 'Department created', data: { department } });
});

const update = asyncHandler(async (req, res) => {
    const department = await departmentService.update(parseInt(req.params.id, 10), req.body);
    res.json({ success: true, message: 'Department updated', data: { department } });
});

const remove = asyncHandler(async (req, res) => {
    await departmentService.delete(parseInt(req.params.id, 10));
    res.json({ success: true, message: 'Department deleted' });
});

module.exports = { getAll, getById, create, update, remove };