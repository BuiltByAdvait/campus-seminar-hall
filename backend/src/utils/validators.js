"use strict";

const z = require('zod');

// Common validation schemas
const validators = {
    // Email validation
    email: z.string().email({ message: 'Invalid email format' }).max(150),

    // Mobile validation (Indian format)
    mobile: z.string()
        .regex(/^[6-9]\d{9}$/, { message: 'Invalid mobile number' })
        .length(10, { message: 'Mobile number must be 10 digits' }),

    // Password validation
    password: z.string()
        .min(8, { message: 'Password must be at least 8 characters' })
        .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
        .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
        .regex(/[0-9]/, { message: 'Password must contain at least one digit' })
        .regex(/[!@#$%^&*]/, { message: 'Password must contain at least one special character' }),

    // Full name
    fullName: z.string()
        .min(2, { message: 'Name must be at least 2 characters' })
        .max(150, { message: 'Name must not exceed 150 characters' })
        .regex(/^[a-zA-Z\s'.-]+$/, { message: 'Name can only contain letters, spaces, apostrophes, hyphens, and periods' }),

    // Date: z.coerce.date().refine((date) => !isNaN(date.getTime()), { message: 'Invalid date' }),

    // Time string validation (HH:mm format)
    timeString: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Invalid time format (use HH:mm)' }),

    // Positive integer
    positiveInt: z.number().int().positive({ message: 'Must be a positive integer' }),

    // Non-negative integer
    nonNegativeInt: z.number().int().nonnegative({ message: 'Must be a non-negative integer' }),

    // Duration in minutes (1-1440)
    durationMinutes: z.number().int().min(1, { message: 'Duration must be at least 1 minute' })
        .max(1440, { message: 'Duration cannot exceed 24 hours' }),

    // Rating (1-5)
    rating: z.number().int().min(1, { message: 'Rating must be between 1 and 5' })
        .max(5, { message: 'Rating must be between 1 and 5' }),

    // Booking status codes
    bookingStatus: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED']),

    // User type codes
    userType: z.enum(['STUDENT', 'FACULTY', 'STAFF', 'EXTERNAL']),

    // Event type codes
    eventType: z.enum(['SEMINAR', 'WORKSHOP', 'ASSEMBLY', 'ORIENTATION', 'MEETING', 'GUEST_LECTURE', 'EXAMINATION', 'OTHER'])
};

// Zod error formatter
const formatZodError = (error) => {
    return error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
    }));
};

module.exports = {
    validators,
    formatZodError
};