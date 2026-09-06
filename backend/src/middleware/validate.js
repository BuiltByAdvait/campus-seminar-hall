"use strict";

const { ValidationError } = require('../utils/errors');
const { formatZodError } = require('../utils/validators');

/**
 * Middleware factory for Zod validation
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {string} source - 'body' | 'query' | 'params' - Source of data to validate
 * @returns {Function} Express middleware
 */
const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        try {
            const data = req[source];
            const result = schema.safeParse(data);

            if (!result.success) {
                const errors = formatZodError(result.error);
                const message = errors.length > 0
                    ? errors.map(e => e.message).join(', ')
                    : 'Validation failed';
                return next(new ValidationError(message, errors));
            }

            // Replace request data with validated/transformed data
            req[source] = result.data;
            next();
        } catch (err) {
            next(err);
        }
    };
};

module.exports = { validate };