"use strict";

const z = require('zod');

const createHallSchema = z.object({
    instituteId: z.number().int().positive(),
    code: z.string().min(2).max(20).regex(/^[A-Z0-9_]+$/),
    name: z.string().min(2).max(150),
    shortName: z.string().max(50).optional(),
    description: z.string().max(1000).optional(),
    capacity: z.number().int().positive().max(10000).default(100),
    location: z.string().max(255).optional(),
    floor: z.string().max(20).optional(),
    facilities: z.array(z.string()).optional(),
    openingTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/).default('08:00:00'),
    closingTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/).default('20:00:00'),
    requiresApproval: z.boolean().default(false)
});

const updateHallSchema = z.object({
    name: z.string().min(2).max(150).optional(),
    shortName: z.string().max(50).optional(),
    description: z.string().max(1000).optional(),
    capacity: z.number().int().positive().max(10000).optional(),
    location: z.string().max(255).optional(),
    floor: z.string().max(20).optional(),
    facilities: z.array(z.string()).optional(),
    openingTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/).optional(),
    closingTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/).optional(),
    requiresApproval: z.boolean().optional(),
    isActive: z.boolean().optional()
});

const availabilitySchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    hallId: z.number().int().positive().optional()
});

module.exports = { createHallSchema, updateHallSchema, availabilitySchema };