"use strict";

const hallService = require('./hall.service');
const asyncHandler = require('../../utils/asyncHandler');

const getAll = asyncHandler(async (req, res) => {
    const halls = await hallService.getAll({ instituteId: req.query.instituteId ? parseInt(req.query.instituteId) : null });
    res.json({ success: true, data: { halls } });
});

const getById = asyncHandler(async (req, res) => {
    const hall = await hallService.getById(parseInt(req.params.id, 10));
    res.json({ success: true, data: { hall } });
});

const create = asyncHandler(async (req, res) => {
    const hall = await hallService.create(req.body);
    res.status(201).json({ success: true, message: 'Hall created', data: { hall } });
});

const update = asyncHandler(async (req, res) => {
    const hall = await hallService.update(parseInt(req.params.id, 10), req.body);
    res.json({ success: true, message: 'Hall updated', data: { hall } });
});

const remove = asyncHandler(async (req, res) => {
    await hallService.delete(parseInt(req.params.id, 10));
    res.json({ success: true, message: 'Hall deleted' });
});

const getAvailability = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
        return res.status(400).json({ error: 'Date parameter required (YYYY-MM-DD)' });
    }

    const availability = await hallService.getAvailability(parseInt(id, 10), date);
    res.json({ success: true, data: availability });
});

module.exports = { getAll, getById, create, update, remove, getAvailability };