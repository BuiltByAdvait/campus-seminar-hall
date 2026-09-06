"use strict";

const z = require('zod');

const createInstituteSchema = z.object({
    code: z.string().min(2).max(20).regex(/^[A-Z0-9_]+$/, { message: 'Code must be uppercase letters and numbers' }),
    name: z.string().min(2).max(150),
    shortName: z.string().max(50).optional(),
    address: z.string().max(500).optional(),
    contactEmail: z.string().email().max(150).optional(),
    contactPhone: z.string().max(20).optional()
});

const updateInstituteSchema = z.object({
    name: z.string().min(2).max(150).optional(),
    shortName: z.string().max(50).optional(),
    address: z.string().max(500).optional(),
    contactEmail: z.string().email().max(150).optional(),
    contactPhone: z.string().max(20).optional(),
    isActive: z.boolean().optional()
});

module.exports = { createInstituteSchema, updateInstituteSchema };