"use strict";

const z = require('zod');

const createDepartmentSchema = z.object({
    instituteId: z.number().int().positive(),
    code: z.string().min(2).max(20),
    name: z.string().min(2).max(150),
    shortName: z.string().max(50).optional(),
    hodName: z.string().max(100).optional(),
    hodEmail: z.string().email().max(150).optional(),
    hodPhone: z.string().max(20).optional()
});

const updateDepartmentSchema = z.object({
    name: z.string().min(2).max(150).optional(),
    shortName: z.string().max(50).optional(),
    hodName: z.string().max(100).optional(),
    hodEmail: z.string().email().max(150).optional(),
    hodPhone: z.string().max(20).optional(),
    isActive: z.boolean().optional()
});

module.exports = { createDepartmentSchema, updateDepartmentSchema };