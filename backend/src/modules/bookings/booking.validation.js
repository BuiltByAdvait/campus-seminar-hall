"use strict";

const z = require('zod');

const createBookingSchema = z.object({
    hallId: z.number().int().positive(),
    eventTypeId: z.number().int().positive(),
    eventName: z.string().min(3).max(200),
    eventDescription: z.string().max(2000).optional(),
    expectedAttendees: z.number().int().min(0).max(10000).default(0),
    startTime: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}(:\d{2})?$/)),
    endTime: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}(:\d{2})?$/))
}).refine(data => new Date(data.endTime) > new Date(data.startTime), {
    message: 'End time must be after start time',
    path: ['endTime']
});

const updateBookingSchema = z.object({
    eventName: z.string().min(3).max(200).optional(),
    eventDescription: z.string().max(2000).optional(),
    expectedAttendees: z.number().int().min(0).max(10000).optional()
});

const cancelBookingSchema = z.object({
    reasonId: z.number().int().positive().optional(),
    reasonText: z.string().max(500).optional()
});

const approveRejectSchema = z.object({
    adminNotes: z.string().max(500).optional()
});

const queryBookingsSchema = z.object({
    status: z.string().optional(),
    hallId: z.coerce.number().int().positive().optional(),
    userId: z.coerce.number().int().positive().optional(),
    fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20)
});

module.exports = {
    createBookingSchema,
    updateBookingSchema,
    cancelBookingSchema,
    queryBookingsSchema,
    approveRejectSchema
};