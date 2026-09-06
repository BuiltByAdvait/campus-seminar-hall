"use strict";

const logger = require('../config/logger');
const {
    AppError,
    ValidationError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
    BookingConflictError,
    CheckInError,
    CheckOutError,
    FeedbackError,
    CancellationError
} = require('../utils/errors');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
    // Default values
    let statusCode = 500;
    let message = 'Internal server error';
    let errors = [];
    let isOperational = true;

    // Handle known error types
    if (err instanceof ValidationError) {
        statusCode = 400;
        message = err.message;
        errors = err.errors || [];
        isOperational = err.isOperational !== false;
    } else if (err instanceof NotFoundError) {
        statusCode = 404;
        message = err.message;
        isOperational = err.isOperational !== false;
    } else if (err instanceof UnauthorizedError) {
        statusCode = 401;
        message = err.message;
        isOperational = err.isOperational !== false;
    } else if (err instanceof ForbiddenError) {
        statusCode = 403;
        message = err.message;
        isOperational = err.isOperational !== false;
    } else if (err instanceof ConflictError || err instanceof BookingConflictError) {
        statusCode = 409;
        message = err.message;
        isOperational = err.isOperational !== false;
    } else if (err instanceof AppError) {
        statusCode = err.statusCode || 500;
        message = err.message;
        isOperational = err.isOperational !== false;
    } else if (err instanceof CheckInError || err instanceof CheckOutError ||
               err instanceof FeedbackError || err instanceof CancellationError) {
        statusCode = err.statusCode || 400;
        message = err.message;
        isOperational = err.isOperational !== false;
    } else if (err.code === 'ER_DUP_ENTRY') {
        // MySQL duplicate entry error
        statusCode = 409;
        message = 'A record with this value already exists';
        isOperational = true;
    } else if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
        // MySQL foreign key error
        statusCode = 400;
        message = 'Referenced record does not exist';
        isOperational = true;
    } else if (err.name === 'SyntaxError' && err.status === 400) {
        // JSON parse error
        statusCode = 400;
        message = 'Invalid JSON in request body';
        isOperational = true;
    }

    // Log error
    if (!isOperational || statusCode >= 500) {
        logger.error(`${req.method} ${req.originalUrl}`, {
            statusCode,
            message,
            stack: err.stack,
            body: req.body,
            params: req.params,
            userId: req.user?.id
        });
    } else {
        logger.warn(`${req.method} ${req.originalUrl}`, { statusCode, message });
    }

    // Build response
    const response = {
        success: false,
        error: message
    };

    if (errors.length > 0) {
        response.errors = errors;
    }

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development' && err.stack) {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
};

module.exports = errorHandler;