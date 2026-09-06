"use strict";

const z = require('zod');
const { validators } = require('../../utils/validators');

/**
 * Update profile validation schema
 */
const updateProfileSchema = z.object({
    fullName: validators.fullName.optional(),
    mobile: validators.mobile.optional(),
    gender: z.enum(['M', 'F', 'O']).optional(),
    dateOfBirth: z.string().date().optional(),
    course: z.string().max(100).optional(),
    academicYear: z.string().max(20).optional(),
    semester: z.number().int().min(1).max(12).optional(),
    rollNumber: z.string().max(50).optional(),
    employeeId: z.string().max(50).optional(),
    designation: z.string().max(100).optional(),
    profileImage: z.string().url().optional(),
});

/**
 * Change password validation schema
 */
const changePasswordSchema = z.object({
    currentPassword: validators.password,
    newPassword: validators.password
});

module.exports = {
    updateProfileSchema,
    changePasswordSchema
};