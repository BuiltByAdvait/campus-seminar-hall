"use strict";

/**
 * Custom application error classes
 */

class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message, errors = []) {
        super(message, 400);
        this.errors = errors;
        this.name = 'ValidationError';
    }
}

class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401);
        this.name = 'UnauthorizedError';
    }
}

class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, 403);
        this.name = 'ForbiddenError';
    }
}

class NotFoundError extends AppError {
    constructor(message = 'Not Found') {
        super(message, 404);
        this.name = 'NotFoundError';
    }
}

class ConflictError extends AppError {
    constructor(message = 'Conflict') {
        super(message, 409);
        this.name = 'ConflictError';
    }
}

class BookingConflictError extends AppError {
    constructor(message = 'Hall already booked for selected time') {
        super(message, 409);
        this.name = 'BookingConflictError';
    }
}

class CheckInError extends AppError {
    constructor(message = 'Check-in failed') {
        super(message, 400);
        this.name = 'CheckInError';
    }
}

class CheckOutError extends AppError {
    constructor(message = 'Check-out failed') {
        super(message, 400);
        this.name = 'CheckOutError';
    }
}

class FeedbackError extends AppError {
    constructor(message = 'Feedback submission failed') {
        super(message, 400);
        this.name = 'FeedbackError';
    }
}

class CancellationError extends AppError {
    constructor(message = 'Cancellation failed') {
        super(message, 400);
        this.name = 'CancellationError';
    }
}

module.exports = {
    AppError,
    ValidationError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    BookingConflictError,
    CheckInError,
    CheckOutError,
    FeedbackError,
    CancellationError
};