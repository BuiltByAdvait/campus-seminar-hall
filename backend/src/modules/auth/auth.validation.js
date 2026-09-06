"use strict";

const z = require('zod');
const { validators } = require('../../utils/validators');

/**
 * Registration validation schema
 */
const registerSchema = z.object({
    fullName: validators.fullName,
    email: validators.email,
    mobile: validators.mobile,
    password: validators.password,
    userType: validators.userType,
    instituteId: validators.positiveInt.optional(),
    departmentId: validators.positiveInt.optional(),
    // Optional profile fields
    dateOfBirth: z.string().date().optional(),
    course: z.string().max(100).optional(),
    academicYear: z.string().max(20).optional(),
    semester: z.number().int().min(1).max(12).optional(),
    rollNumber: z.string().max(50).optional(),
    employeeId: z.string().max(50).optional(),
    designation: z.string().max(100).optional()
}).refine((data) => {
    // If userType is STUDENT, course/academicYear/semester recommended but not required for MVP
    // If userType is FACULTY/STAFF, instituteId and departmentId required
    if (data.userType === 'FACULTY' || data.userType === 'STAFF') {
        return !!data.instituteId && !!data.departmentId;
    }
    return true;
}, {
    message: 'Institute and department required for faculty/staff'
});

/**
 * Login validation schema
 */
const loginSchema = z.object({
    email: validators.email,
    password: z.string().min(1, { message: 'Password is required' })
});

/**
 * Change password validation schema
 */
const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, { message: 'Current password required' }),
    newPassword: validators.password
});

/**
 * Refresh token validation schema
 */
const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, { message: 'Refresh token required' })
});

module.exports = {
    registerSchema,
    loginSchema,
    changePasswordSchema,
    refreshTokenSchema
};